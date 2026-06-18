import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BotActivityChart } from '@/components/overview/BotActivityChart'
import { formatAllocatedTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()

  const d30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rawRuns } = await supabase
    .from('runs')
    .select('status, started_at, duration_secs, bot_id, bots!inner(bot_name, client_name)')
    .gte('started_at', d30ago)
    .order('started_at', { ascending: false })

  type ReportRun = { status: string; started_at: string; duration_secs: number | null; bot_id: string; bots: { bot_name: string; client_name: string } }
  const allRuns = (rawRuns ?? []) as unknown as ReportRun[]

  // Per-client breakdown
  const clientStats: Record<string, { total: number; success: number; failure: number; timeout: number; missed: number }> = {}
  for (const run of allRuns) {
    const bot = run.bots
    const client = bot.client_name
    if (!clientStats[client]) clientStats[client] = { total: 0, success: 0, failure: 0, timeout: 0, missed: 0 }
    clientStats[client].total++
    if (run.status === 'success') clientStats[client].success++
    else if (run.status === 'failure') clientStats[client].failure++
    else if (run.status === 'timeout') clientStats[client].timeout++
    else if (run.status === 'missed') clientStats[client].missed++
  }

  const avgDuration = allRuns
    .filter((r) => r.duration_secs != null && r.status === 'success')
    .reduce((acc, r, _, arr) => acc + (r.duration_secs ?? 0) / arr.length, 0)

  const activityRuns = allRuns.map((r) => ({
    status: r.status as import('@/types').RunStatus,
    started_at: r.started_at,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Reports" subtitle="30-day analytics across all bots and clients" showDateRange />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Runs (30d)', value: allRuns.length },
            { label: 'Success Rate', value: `${allRuns.length === 0 ? 100 : Math.round((allRuns.filter(r => r.status === 'success').length / allRuns.filter(r => r.status !== 'started').length) * 100)}%` },
            { label: 'Avg Run Duration', value: formatAllocatedTime(avgDuration) },
            { label: 'Clients Tracked', value: Object.keys(clientStats).length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <BotActivityChart runs={activityRuns} />

        {/* Per-client breakdown */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-default">
            <h2 className="text-sm font-semibold text-primary">Per-Client Breakdown (30 days)</h2>
          </div>
          {Object.keys(clientStats).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No run data yet</div>
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Total Runs</th>
                  <th>Success</th>
                  <th>Failure</th>
                  <th>Timeout</th>
                  <th>Missed</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(clientStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([client, s]) => {
                    const finished = s.success + s.failure + s.timeout + s.missed
                    const rate = finished === 0 ? 100 : Math.round((s.success / finished) * 100)
                    return (
                      <tr key={client}>
                        <td className="font-medium text-primary">{client}</td>
                        <td className="text-secondary">{s.total}</td>
                        <td className="text-green-600 dark:text-green-400">{s.success}</td>
                        <td className="text-red-600 dark:text-red-400">{s.failure}</td>
                        <td className="text-orange-600 dark:text-orange-400">{s.timeout}</td>
                        <td className="text-purple-600 dark:text-purple-400">{s.missed}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full" style={{ minWidth: '60px' }}>
                              <div
                                className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-primary w-10">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
