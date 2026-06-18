import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult

  let body: { run_id?: string; log_title?: string; message?: string; level?: string; step_index?: number } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.run_id || !body.log_title) {
    return NextResponse.json({ error: 'run_id and log_title are required' }, { status: 400 })
  }

  const { data: run } = await svc
    .from('runs')
    .select('id, bot_id, status')
    .eq('id', body.run_id)
    .single()

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  if (run.bot_id !== bot.bot_id) return NextResponse.json({ error: 'Run belongs to a different bot' }, { status: 403 })
  if (run.status !== 'started') return NextResponse.json({ error: `Cannot log on a run with status '${run.status}'` }, { status: 409 })

  const validLevels = ['info', 'warning', 'error']
  const level = validLevels.includes(body.level ?? '') ? body.level : 'info'

  await svc.from('run_logs').insert({
    run_id: body.run_id,
    log_title: body.log_title,
    message: body.message ?? null,
    level: level as 'info' | 'warning' | 'error',
    step_index: body.step_index ?? null,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
