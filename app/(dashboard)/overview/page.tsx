import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runSweep } from '@/lib/sweep'
import { Header } from '@/components/layout/Header'
import { StatsRow } from '@/components/overview/StatsRow'
import { LiveActivityFeed } from '@/components/overview/LiveActivityFeed'
import { BotActivityChart } from '@/components/overview/BotActivityChart'
import { CurrentlyRunning } from '@/components/overview/CurrentlyRunning'
import { RecentFailures } from '@/components/overview/RecentFailures'
import { MissedRuns } from '@/components/overview/MissedRuns'
import { BotHealthCalendar } from '@/components/overview/BotHealthCalendar'
import { OverviewFiltersBar } from '@/components/overview/OverviewFiltersBar'
import type {
  OverviewStats, DashboardActivity, RunWithBot, BotCalendarRow,
  BotWithClient, Run, TimeScope, Client,
} from '@/types'

type RawRunWithBot = Run & { bots: BotWithClient }
import { subDays } from 'date-fns'
import { computeHealthScore, formatRelativeTime, getPeriod } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchOverviewData(scope: TimeScope, offset: number, clientId: string) {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  await runSweep(serviceClient)

  const { start: periodStart, end: periodEnd, shortLabel } = getPeriod(scope, offset)
  const d30ago = subDays(new Date(), 30).toISOString()

  // Fetch clients for the filter bar
  const { data: rawClients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')
  const allClients = (rawClients ?? []) as Pick<Client, 'id' | 'name'>[]

  // Resolve bot IDs for client filter
  let botIdFilter: string[] | null = null
  if (clientId !== 'all') {
    const { data: clientBots } = await supabase
      .from('bots')
      .select('id')
      .eq('client_id', clientId)
    botIdFilter = (clientBots ?? []).map((b: { id: string }) => b.id)
  }

  function applyBotFilter<Q extends { in: (col: string, vals: string[]) => Q }>(q: Q): Q {
    if (botIdFilter !== null && botIdFilter.length > 0) return q.in('bot_id', botIdFilter)
    if (botIdFilter !== null && botIdFilter.length === 0) return q.in('bot_id', ['__none__'])
    return q
  }

  // Bots list
  let botsQuery = supabase.from('bots').select('*, clients(id, name)').order('bot_name')
  if (botIdFilter !== null && botIdFilter.length > 0) botsQuery = botsQuery.in('id', botIdFilter)
  if (botIdFilter !== null && botIdFilter.length === 0) botsQuery = botsQuery.in('id', ['__none__'])
  const { data: rawBots } = await botsQuery
  const allBots = (rawBots ?? []) as unknown as BotWithClient[]

  // Period stats
  let statsQ = supabase
    .from('runs')
    .select('status, started_at')
    .gte('started_at', periodStart.toISOString())
    .lte('started_at', periodEnd.toISOString())
  statsQ = applyBotFilter(statsQ as Parameters<typeof applyBotFilter>[0]) as typeof statsQ
  const { data: rawRunsPeriod } = await statsQ
  const runsPeriod = (rawRunsPeriod ?? []) as { status: string; started_at: string }[]

  // Currently running (always real-time, not period-scoped)
  let startedQ = supabase.from('runs').select('*, bots!inner(*, clients(id, name))').eq('status', 'started')
  startedQ = applyBotFilter(startedQ as Parameters<typeof applyBotFilter>[0]) as typeof startedQ
  const { data: rawStartedRuns } = await startedQ
  const startedRuns = (rawStartedRuns ?? []) as unknown as RawRunWithBot[]

  // Activity feed (30 days, most recent 5)
  let recentQ = supabase
    .from('runs')
    .select('*, bots!inner(*, clients(id, name))')
    .gte('started_at', d30ago)
    .order('started_at', { ascending: false })
    .limit(5)
  recentQ = applyBotFilter(recentQ as Parameters<typeof applyBotFilter>[0]) as typeof recentQ
  const { data: rawRecentRuns } = await recentQ
  const recentRuns = (rawRecentRuns ?? []) as unknown as RawRunWithBot[]

  // Recent failures (recent, not period-scoped)
  let failuresQ = supabase
    .from('runs')
    .select('*, bots!inner(*, clients(id, name))')
    .in('status', ['failure', 'timeout'])
    .order('started_at', { ascending: false })
    .limit(8)
  failuresQ = applyBotFilter(failuresQ as Parameters<typeof applyBotFilter>[0]) as typeof failuresQ
  const { data: rawRecentFailures } = await failuresQ

  // Missed runs (recent)
  let missedQ = supabase
    .from('runs')
    .select('*, bots!inner(*, clients(id, name))')
    .eq('status', 'missed')
    .order('started_at', { ascending: false })
    .limit(8)
  missedQ = applyBotFilter(missedQ as Parameters<typeof applyBotFilter>[0]) as typeof missedQ
  const { data: rawMissedRuns } = await missedQ

  const recentFailuresRaw = (rawRecentFailures ?? []) as unknown as RawRunWithBot[]
  const missedRunsRaw = (rawMissedRuns ?? []) as unknown as RawRunWithBot[]

  const passed    = runsPeriod.filter((r) => r.status === 'success').length
  const failed    = runsPeriod.filter((r) => r.status === 'failure').length
  const timeouts  = runsPeriod.filter((r) => r.status === 'timeout').length
  const missed    = runsPeriod.filter((r) => r.status === 'missed').length
  const totalFinished = passed + failed + timeouts

  const stats: OverviewStats = {
    total_bots: allBots.length,
    active_bots: allBots.filter((b) => b.is_active).length,
    currently_running: startedRuns.length,
    failed_24h: failed,
    passed_24h: passed,
    timeouts_24h: timeouts,
    missed_24h: missed,
    health_score: computeHealthScore(passed, totalFinished),
  }

  // Activity feed (most recent 5 events)
  const eventMap: Record<string, string> = {
    success: 'completed successfully',
    failure: 'failed',
    timeout: 'timed out',
    missed: 'missed scheduled run',
    started: 'started running',
  }
  const activities: DashboardActivity[] = recentRuns.slice(0, 5).map((r) => ({
    id: r.id,
    bot_name: r.bots.bot_name,
    client_name: r.bots.clients?.name ?? '—',
    event: eventMap[r.status] ?? r.status,
    status: r.status,
    time: formatRelativeTime(r.started_at),
  }))

  const currentlyRunning: RunWithBot[] = startedRuns.map((r) => ({ ...r, bot: r.bots }))

  const recentFailuresList: RunWithBot[] = recentFailuresRaw.slice(0, 8).map((r) => ({
    ...r, bot: r.bots,
  }))

  const missedList: RunWithBot[] = missedRunsRaw.slice(0, 8).map((r) => ({
    ...r, bot: r.bots,
  }))

  // Bot health calendar — last 30 runs per bot (not period-scoped)
  let calQ = supabase
    .from('runs')
    .select('id, bot_id, status, started_at')
    .gte('started_at', d30ago)
    .neq('status', 'started')
  if (botIdFilter !== null && botIdFilter.length > 0) calQ = calQ.in('bot_id', botIdFilter)
  if (botIdFilter !== null && botIdFilter.length === 0) calQ = calQ.in('bot_id', ['__none__'])
  const { data: rawCalendarRuns } = await calQ
  const calendarRuns = (rawCalendarRuns ?? []) as { id: string; bot_id: string; status: string; started_at: string }[]

  const runsByBotId: Record<string, typeof calendarRuns> = {}
  for (const r of calendarRuns) {
    if (!runsByBotId[r.bot_id]) runsByBotId[r.bot_id] = []
    runsByBotId[r.bot_id].push(r)
  }

  const calendarRows: BotCalendarRow[] = allBots.slice(0, 20).map((bot) => ({
    bot,
    runs: (runsByBotId[bot.id] ?? [])
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .slice(-30)
      .map((r) => ({
        id: r.id,
        status: r.status as 'success' | 'failure' | 'timeout' | 'missed',
        started_at: r.started_at,
      })),
  }))

  // Activity chart runs: use the selected period window
  const activityRuns = runsPeriod.map((r) => ({ status: r.status as Run['status'], started_at: r.started_at }))

  return {
    stats,
    activities,
    currentlyRunning,
    recentFailures: recentFailuresList,
    missedRuns: missedList,
    calendarRows,
    activityRuns,
    allClients,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    shortLabel,
  }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: { scope?: string; offset?: string; clientId?: string }
}) {
  const scope = (['24h', '7d', '30d', '1y'].includes(searchParams.scope ?? '')
    ? searchParams.scope
    : '24h') as TimeScope
  const offset = Math.max(0, parseInt(searchParams.offset ?? '0', 10) || 0)
  const clientId = searchParams.clientId ?? 'all'

  const { fullLabel } = getPeriod(scope, offset)
  const data = await fetchOverviewData(scope, offset, clientId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Overview" subtitle="Real-time health and status of your automation ecosystem" />

      <OverviewFiltersBar
        clients={data.allClients}
        scope={scope}
        offset={offset}
        clientId={clientId}
        fullLabel={fullLabel}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <StatsRow stats={data.stats} periodLabel={data.shortLabel} />

        {/* First row: Live Activity Feed (wide) + Bot Activity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4" style={{ minHeight: '280px' }}>
          <div className="lg:col-span-2">
            <LiveActivityFeed activities={data.activities} />
          </div>
          <div className="lg:col-span-1">
            <BotActivityChart
              runs={data.activityRuns}
              scope={scope}
              periodStartIso={data.periodStart}
              periodEndIso={data.periodEnd}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <CurrentlyRunning runs={data.currentlyRunning} />
          <RecentFailures failures={data.recentFailures} />
          <MissedRuns missed={data.missedRuns} />
        </div>

        <BotHealthCalendar rows={data.calendarRows} />
      </div>
    </div>
  )
}
