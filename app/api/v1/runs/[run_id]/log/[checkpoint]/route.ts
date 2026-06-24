import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { run_id: string; checkpoint: string } }
) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult
  const { run_id, checkpoint } = params

  const rawLevel = request.nextUrl.searchParams.get('level') ?? 'info'
  const level = (['info', 'warning', 'error'] as const).includes(rawLevel as 'info' | 'warning' | 'error')
    ? (rawLevel as 'info' | 'warning' | 'error')
    : 'info'

  // Decode + as space (path segments don't auto-decode +), then uppercase
  const title = checkpoint.replace(/\+/g, ' ').toUpperCase()

  const { data: run } = await svc
    .from('runs')
    .select('id, bot_id, status')
    .eq('id', run_id)
    .single()

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  if (run.bot_id !== bot.bot_id) return NextResponse.json({ error: 'Run belongs to a different bot' }, { status: 403 })
  if (run.status !== 'started') {
    return NextResponse.json({ error: `Cannot log on a run with status '${run.status}'` }, { status: 409 })
  }

  await svc.from('run_logs').insert({
    run_id,
    log_title: title,
    message: null,
    level,
    step_index: null,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
