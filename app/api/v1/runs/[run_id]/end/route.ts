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
    .select('id, bot_id, status, started_at, duration_secs')
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

  await svc.from('runs').update({
    status: status as 'success' | 'failure',
    ended_at: now.toISOString(),
    duration_secs: durationSecs,
  }).eq('id', run_id)

  return NextResponse.json({ ok: true, duration_secs: durationSecs })
}
