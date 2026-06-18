import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult

  let body: { vm_name?: string; client_run_id?: string } = {}
  try { body = await request.json() } catch {}

  if (body.client_run_id) {
    const { data: existing } = await svc
      .from('runs')
      .select('id, status')
      .eq('bot_id', bot.bot_id)
      .eq('client_run_id', body.client_run_id)
      .single()

    if (existing) {
      return NextResponse.json({ run_id: existing.id, status: existing.status, idempotent: true })
    }
  }

  const { data: botConfig } = await svc
    .from('bots')
    .select('allow_concurrent_runs')
    .eq('id', bot.bot_id)
    .single()

  const { data: activeRun } = await svc
    .from('runs')
    .select('id')
    .eq('bot_id', bot.bot_id)
    .eq('status', 'started')
    .single()

  const now = new Date().toISOString()

  const { data: newRun, error } = await svc
    .from('runs')
    .insert({
      bot_id: bot.bot_id,
      vm_name: body.vm_name ?? null,
      status: 'started',
      started_at: now,
      client_run_id: body.client_run_id ?? null,
    })
    .select('id')
    .single()

  if (error || !newRun) {
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }

  if (activeRun && !botConfig?.allow_concurrent_runs) {
    return NextResponse.json(
      {
        run_id: newRun.id,
        status: 'started',
        warning: '409_concurrent_run_detected',
        existing_run_id: activeRun.id,
      },
      { status: 201 }
    )
  }

  return NextResponse.json({ run_id: newRun.id, status: 'started' }, { status: 201 })
}
