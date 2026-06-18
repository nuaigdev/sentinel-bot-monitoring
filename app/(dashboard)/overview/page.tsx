import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runSweep } from '@/lib/sweep'
import { Header } from '@/components/layout/Header'
import { StatsRow } from '@/components/overview/StatsRow'
import { ActiveIncidents } from '@/components/overview/ActiveIncidents'
import { LiveActivityFeed } from '@/components/overview/LiveActivityFeed'
import { BotActivityChart } from '@/components/overview/BotActivityChart'
import { CurrentlyRunning } from '@/components/overview/CurrentlyRunning'
import { RecentFailures } from '@/components/overview/RecentFailures'
import { MissedRuns } from '@/components/overview/MissedRuns'
import { BotHealthCalendar } from '@/components/overview/BotHealthCalendar'
import type {
  OverviewStats, ActiveIncident, DashboardActivity, RunWithBot, BotCalendarRow,
  Bot, Run,
} from '@/types'

type RawRunWithBot = Run & { bots: Bot }
import { subDays } from 'date-fns'
import { computeHealthScore, formatRelativeTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function fetchOverviewData() {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  // Run sweeps on page load (lazy strategy from spec)
  await runSweep(serviceClient)

  const now = new Date()
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const d30ago = subDays(now, 30).toISOString()

  const [
    { data: rawBots },
    { data: rawRuns24h },
    { data: rawStartedRuns },
    { data: rawRecentRuns },
    { data: rawRecentFailures },
    { data: rawMissedRuns },
  ] = await Promise.all([
    supabase.from('bots').select('*').order('bot_name'),
    supabase.from('runs').select('status, started_at').gte('started_at', h24ago),
    supabase.from('runs').select('*, bots!inner(*)').eq('status', 'started'),
    supabase.from('runs')
      .select('*, bots!inner(*)')
      .gte('started_at', d30ago)
      .order('started_at', { ascending: false })
      .limit(50),
    supabase.from('runs')
      .select('*, bots!inner(*)')
      .in('status', ['failure', 'timeout'])
      .order('started_at', { ascending: false })
      .limit(8),
    supabase.from('runs')
      .select('*, bots!inner(*)')
      .eq('status', 'missed')
      .order('started_at', { ascending: false })
      .limit(8),
  ])

  const allBots = (rawBots ?? []) as Bot[]
  const allRuns24h = (rawRuns24h ?? []) as { status: string; started_at: string }[]
  const startedRuns = (rawStartedRuns ?? []) as unknown as RawRunWithBot[]
  const recentRuns = (rawRecentRuns ?? []) as unknown as RawRunWithBot[]
  const recentFailuresRaw = (rawRecentFailures ?? []) as unknown as RawRunWithBot[]
  const missedRunsRaw = (rawMissedRuns ?? []) as unknown as RawRunWithBot[]
  const passed24h = allRuns24h.filter((r) => r.status === 'success').length
  const failed24h = allRuns24h.filter((r) => r.status === 'failure').length
  const timeouts24h = allRuns24h.filter((r) => r.status === 'timeout').length
  const missed24h = allRuns24h.filter((r) => r.status === 'missed').length
  const totalFinished = passed24h + failed24h + timeouts24h

  const stats: OverviewStats = {
    total_bots: allBots.length,
    active_bots: allBots.filter((b) => b.is_active).length,
    currently_running: (startedRuns ?? []).length,
    failed_24h: failed24h,
    passed_24h: passed24h,
    timeouts_24h: timeouts24h,
    missed_24h: missed24h,
    health_score: computeHealthScore(passed24h, totalFinished),
  }

  // Active incidents — failures + timeouts + missed in last 48h
  const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const { data: rawIncidentRuns } = await supabase
    .from('runs')
    .select('*, bots!inner(*)')
    .in('status', ['failure', 'timeout', 'missed'])
    .gte('started_at', h48ago)
    .is('acknowledged_at', null)
    .order('started_at', { ascending: false })
    .limit(20)
  const incidentRuns = (rawIncidentRuns ?? []) as unknown as RawRunWithBot[]

  const incidents: ActiveIncident[] = incidentRuns.map((r) => ({
    id: r.id,
    bot_name: r.bots.bot_name,
    client_name: r.bots.client_name,
    issue: r.summary_message || (r.status === 'missed' ? 'Scheduled run never started' : r.status === 'timeout' ? 'Run exceeded time limit' : 'Run ended with failure'),
    severity: r.status === 'failure' ? 'high' : r.status === 'timeout' ? 'medium' : 'critical',
    status: r.status,
    started_at: r.started_at,
    run_id: r.id,
  }))

  // Live activity feed
  const eventMap: Record<string, string> = {
    success: 'completed successfully',
    failure: 'failed',
    timeout: 'timed out',
    missed: 'missed scheduled run',
    started: 'started running',
  }
  const activities: DashboardActivity[] = recentRuns.slice(0, 15).map((r) => ({
    id: r.id,
    bot_name: r.bots.bot_name,
    client_name: r.bots.client_name,
    event: eventMap[r.status] ?? r.status,
    status: r.status,
    time: formatRelativeTime(r.started_at),
  }))

  // Currently running
  const currentlyRunning: RunWithBot[] = startedRuns.map((r) => ({
    ...r,
    bot: r.bots,
  }))

  const recentFailuresList: RunWithBot[] = recentFailuresRaw.slice(0, 8).map((r) => ({
    ...r,
    bot: r.bots,
  }))

  const missedList: RunWithBot[] = missedRunsRaw.slice(0, 8).map((r) => ({
    ...r,
    bot: r.bots,
  }))

  // Bot health calendar — last 30 runs per bot
  const { data: rawCalendarRuns } = await supabase
    .from('runs')
    .select('id, bot_id, status, started_at')
    .gte('started_at', d30ago)
    .neq('status', 'started')
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

  const activityRuns = recentRuns.map((r) => ({ status: r.status, started_at: r.started_at }))

  return { stats, incidents, activities, currentlyRunning, recentFailures: recentFailuresList, missedRuns: missedList, calendarRows, activityRuns }
}

export default async function OverviewPage() {
  const data = await fetchOverviewData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Overview" subtitle="Real-time health and status of your automation ecosystem" showDateRange />
      <div className="flex-1 overflow-y-auto p-6">
        <StatsRow stats={data.stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4" style={{ minHeight: '280px' }}>
          <div className="lg:col-span-1">
            <ActiveIncidents incidents={data.incidents} />
          </div>
          <div className="lg:col-span-1">
            <LiveActivityFeed activities={data.activities} />
          </div>
          <div className="lg:col-span-1">
            <BotActivityChart runs={data.activityRuns} />
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
