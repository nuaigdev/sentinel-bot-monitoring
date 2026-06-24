import { NextRequest, NextResponse } from 'next/server'
import { authenticateBotKey } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { run_id: string } }
) {
  const authResult = await authenticateBotKey(request)
  if (authResult instanceof NextResponse) return authResult

  const { bot, svc } = authResult
  const { run_id } = params
  const status = request.nextUrl.searchParams.get('status')

  if (!['success', 'failure'].includes(status ?? '')) {
    return NextResponse.json({ error: "status must be 'success' or 'failure'" }, { status: 400 })
  }

  const { data: run } = await svc
    .from('runs')
    .select('id, bot_id, status, started_at, duration_secs, bots!inner(time_allocated_secs)')
    .eq('id', run_id)
    .single()

  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  if (run.bot_id !== bot.bot_id) return NextResponse.json({ error: 'Run belongs to a different bot' }, { status: 403 })

  if (run.status !== 'started') {
    return NextResponse.json(
      { error: `Cannot end a run with status '${run.status}'` },
      { status: 409 }
    )
  }

  const now = new Date()
  const durationSecs = (now.getTime() - new Date(run.started_at).getTime()) / 1000

  // If the run exceeded its allocated time, mark it as timed out instead of accepting the end call.
  // This catches the case where the sweep hasn't run yet but the bot is already over its limit.
  const botConfig = run.bots as { time_allocated_secs: number } | null
  if (botConfig && durationSecs > botConfig.time_allocated_secs) {
    await svc.from('runs').update({
      status: 'timeout',
      ended_at: now.toISOString(),
    }).eq('id', run_id)

    return NextResponse.json(
      { error: `Run exceeded allocated time (${botConfig.time_allocated_secs}s) and has been marked as timed out` },
      { status: 409 }
    )
  }

  await svc.from('runs').update({
    status: status as 'success' | 'failure',
    ended_at: now.toISOString(),
    duration_secs: durationSecs,
  }).eq('id', run_id)

  return NextResponse.json({ ok: true, duration_secs: durationSecs })
}
