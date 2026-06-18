// eslint-disable-next-line
type DB = any

/**
 * Timeout sweep: marks started runs as timed out when they exceed time_allocated_secs.
 */
export async function sweepTimeouts(supabase: DB): Promise<number> {
  const now = new Date().toISOString()

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
 *
 * Two key invariants:
 *  1. We only look back to the bot's created_at, so a newly-created bot never gets
 *     synthetic misses for time slots that pre-date its existence.
 *  2. We include existing missed rows in the deduplication check, so re-running the
 *     sweep on every page load never produces duplicate missed entries.
 */
export async function sweepMissedRuns(supabase: DB): Promise<number> {
  const now = new Date()
  const lookbackMs = 48 * 60 * 60 * 1000
  const hardWindowStart = new Date(now.getTime() - lookbackMs)

  const { data: bots } = await supabase
    .from('bots')
    .select('id, schedule_type, schedule_cron, schedule_fixed_times, missed_grace_secs, created_at')
    .eq('is_active', true)
    .neq('schedule_type', 'manual')

  if (!bots || bots.length === 0) return 0

  let missedCount = 0

  for (const bot of bots) {
    // Never generate expected slots before the bot existed
    const botCreatedAt = new Date(bot.created_at)
    const effectiveFrom = botCreatedAt > hardWindowStart ? botCreatedAt : hardWindowStart

    const expectedTimes = computeExpectedStartTimes(bot, effectiveFrom, now)
    if (expectedTimes.length === 0) continue

    // Fetch ALL runs (any status) in the effective window — used for both
    // duplicate-missed detection and real-run detection.
    const { data: existingRuns } = await supabase
      .from('runs')
      .select('started_at, status')
      .eq('bot_id', bot.id)
      .gte('started_at', effectiveFrom.toISOString())
      .lte('started_at', now.toISOString())

    // eslint-disable-next-line
    const existing = (existingRuns || []).map((r: any) => ({
      ms: new Date(r.started_at).getTime(),
      status: r.status as string,
    }))

    for (const expectedTime of expectedTimes) {
      const expectedMs = expectedTime.getTime()
      const deadlineMs = expectedMs + bot.missed_grace_secs * 1000

      // Only flag once the grace period has passed
      if (now.getTime() <= deadlineMs) continue

      // Already has a missed row for this exact slot (within 2 s tolerance)
      const alreadyMissed = existing.some(
        (e: { ms: number; status: string }) => e.status === 'missed' && Math.abs(e.ms - expectedMs) <= 2000
      )
      if (alreadyMissed) continue

      // A real run covered this slot within the grace window
      const hasRealRun = existing.some(
        (e: { ms: number; status: string }) => e.status !== 'missed' && Math.abs(e.ms - expectedMs) <= bot.missed_grace_secs * 1000
      )
      if (hasRealRun) continue

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

  return results
}

export async function runSweep(supabase: DB): Promise<{ timeouts: number; missed: number }> {
  const [timeouts, missed] = await Promise.all([
    sweepTimeouts(supabase),
    sweepMissedRuns(supabase),
  ])
  return { timeouts, missed }
}
