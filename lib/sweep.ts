// eslint-disable-next-line
type DB = any

/**
 * Timeout sweep: marks started runs as timed out when they exceed time_allocated_secs.
 */
export async function sweepTimeouts(supabase: DB): Promise<number> {
  const now = new Date().toISOString()

  // Get all started runs joined with their bot's time_allocated_secs
  const { data: startedRuns } = await supabase
    .from('runs')
    .select('id, started_at, bot_id, bots!inner(time_allocated_secs)')
    .eq('status', 'started')

  if (!startedRuns || startedRuns.length === 0) return 0

  const timedOutIds: string[] = []
  const nowMs = new Date(now).getTime()

  for (const run of startedRuns) {
    const bot = run.bots as { time_allocated_secs: number } | null
    if (!bot) continue
    const elapsedSecs = (nowMs - new Date(run.started_at).getTime()) / 1000
    if (elapsedSecs > bot.time_allocated_secs) {
      timedOutIds.push(run.id)
    }
  }

  if (timedOutIds.length === 0) return 0

  await supabase
    .from('runs')
    .update({ status: 'timeout', ended_at: now })
    .in('id', timedOutIds)

  return timedOutIds.length
}

/**
 * Missed-run sweep: inserts synthetic missed runs for scheduled bots that never started.
 * Checks the last 48 hours window.
 */
export async function sweepMissedRuns(supabase: DB): Promise<number> {
  const now = new Date()
  const lookbackHours = 48
  const windowStart = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)

  const { data: bots } = await supabase
    .from('bots')
    .select('id, schedule_type, schedule_cron, schedule_fixed_times, missed_grace_secs')
    .eq('is_active', true)
    .neq('schedule_type', 'manual')

  if (!bots || bots.length === 0) return 0

  let missedCount = 0

  for (const bot of bots) {
    const expectedTimes = computeExpectedStartTimes(bot, windowStart, now)
    if (expectedTimes.length === 0) continue

    // Get existing runs in the window
    const { data: existingRuns } = await supabase
      .from('runs')
      .select('started_at')
      .eq('bot_id', bot.id)
      .gte('started_at', windowStart.toISOString())
      .lte('started_at', now.toISOString())
      .neq('status', 'missed')

    // eslint-disable-next-line
    const existingStartTimes = (existingRuns || []).map((r: any) =>
      new Date(r.started_at).getTime()
    )

    for (const expectedTime of expectedTimes) {
      const expectedMs = expectedTime.getTime()
      const deadlineMs = expectedMs + bot.missed_grace_secs * 1000

      // Only flag if past the grace window
      if (now.getTime() <= deadlineMs) continue

      // Check if any run started within ±grace_secs of expected time
      const hasRun = existingStartTimes.some(
        (t: number) => Math.abs(t - expectedMs) <= bot.missed_grace_secs * 1000
      )

      if (!hasRun) {
        await supabase.from('runs').insert({
          bot_id: bot.id,
          status: 'missed',
          started_at: expectedTime.toISOString(),
          ended_at: null,
          summary_message: 'Missed run detected by sweep — flow never started within grace window.',
        })
        missedCount++
      }
    }
  }

  return missedCount
}

function computeExpectedStartTimes(
  bot: { schedule_type: string; schedule_cron: string | null; schedule_fixed_times: string | null; missed_grace_secs: number },
  from: Date,
  to: Date
): Date[] {
  const results: Date[] = []

  if (bot.schedule_type === 'fixed_times' && bot.schedule_fixed_times) {
    const times = bot.schedule_fixed_times.split(',').map((t) => t.trim())
    const cursor = new Date(from)
    cursor.setUTCHours(0, 0, 0, 0)

    while (cursor <= to) {
      for (const time of times) {
        const [h, m] = time.split(':').map(Number)
        const candidate = new Date(cursor)
        candidate.setUTCHours(h, m, 0, 0)
        if (candidate >= from && candidate <= to) {
          results.push(candidate)
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  // Cron parsing is complex; for now only fixed_times is fully supported
  // A full cron parser would be added here for schedule_type = 'cron'

  return results
}

export async function runSweep(supabase: DB): Promise<{ timeouts: number; missed: number }> {
  const [timeouts, missed] = await Promise.all([
    sweepTimeouts(supabase),
    sweepMissedRuns(supabase),
  ])
  return { timeouts, missed }
}
