import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult

  let body: { run_id?: string; status?: string; message?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.run_id) return NextResponse.json({ error: 'run_id is required' }, { status: 400 })
  if (!['success', 'failure'].includes(body.status ?? '')) {
    return NextResponse.json({ error: "status must be 'success' or 'failure'" }, { status: 400 })
  }

  const { data: run } = await svc
    .from('runs')
    .select('id, bot_id, status, started_at, duration_secs')
    .eq('id', body.run_id)
    .single()

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  if (run.bot_id !== bot.bot_id) return NextResponse.json({ error: 'Run belongs to a different bot' }, { status: 403 })

  if (run.status !== 'started') {
    return NextResponse.json({ ok: true, duration_secs: run.duration_secs, already_ended: true })
  }

  const now = new Date()
  const durationSecs = (now.getTime() - new Date(run.started_at).getTime()) / 1000

  await svc.from('runs').update({
    status: body.status as 'success' | 'failure',
    ended_at: now.toISOString(),
    duration_secs: durationSecs,
    summary_message: body.message ?? null,
  }).eq('id', body.run_id)

  return NextResponse.json({ ok: true, duration_secs: durationSecs })
}
