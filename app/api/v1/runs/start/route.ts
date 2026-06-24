import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult
  const sp = request.nextUrl.searchParams
  const vm_name = sp.get('vm_name') ?? null
  const client_run_id = sp.get('client_run_id') ?? null

  if (client_run_id) {
    const { data: existing } = await svc
      .from('runs')
      .select('id, status')
      .eq('bot_id', bot.bot_id)
      .eq('client_run_id', client_run_id)
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

  if (activeRun && !botConfig?.allow_concurrent_runs) {
    return NextResponse.json(
      {
        error: 'A run is already active for this bot. Enable concurrent runs in bot settings to allow multiple simultaneous runs.',
        existing_run_id: activeRun.id,
      },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  const { data: newRun, error } = await svc
    .from('runs')
    .insert({
      bot_id: bot.bot_id,
      vm_name,
      status: 'started',
      started_at: now,
      client_run_id,
    })
    .select('id')
    .single()

  if (error || !newRun) {
    return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
  }

  return NextResponse.json({ run_id: newRun.id, status: 'started' })
}
