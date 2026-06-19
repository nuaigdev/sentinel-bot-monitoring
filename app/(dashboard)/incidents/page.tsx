import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDateTime, formatRelativeTime, formatDuration } from '@/lib/utils'
import { AcknowledgeButton } from '@/components/incidents/AcknowledgeButton'
import type { Run, BotWithClient } from '@/types'

export const dynamic = 'force-dynamic'

type RawRunWithBot = Run & { bots: BotWithClient }

interface IncidentRun extends Run {
  bot: BotWithClient
}

export default async function IncidentsPage() {
  const supabase = await createClient()

  const h48ago = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: rawRuns } = await supabase
    .from('runs')
    .select('*, bots!inner(*, clients(id, name))')
    .in('status', ['failure', 'timeout', 'missed'])
    .gte('started_at', h48ago)
    .order('started_at', { ascending: false })

  const all: IncidentRun[] = ((rawRuns ?? []) as unknown as RawRunWithBot[]).map(
    (r) => ({ ...r, bot: r.bots })
  )

  const open = all.filter((r) => !r.acknowledged_at)
  const resolved = all.filter((r) => !!r.acknowledged_at)

  const counts = {
    failure: open.filter((i) => i.status === 'failure').length,
    timeout: open.filter((i) => i.status === 'timeout').length,
    missed: open.filter((i) => i.status === 'missed').length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Incidents" subtitle="Failures, timeouts, and missed runs in the last 48 hours" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Failures', count: counts.failure, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Timeouts', count: counts.timeout, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Missed Runs', count: counts.missed, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map((s) => (
            <div key={s.label} className={`card p-4 flex items-center gap-4 ${s.bg}`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
              <div>
                <div className="text-sm font-medium text-primary">{s.label}</div>
                <div className="text-xs text-muted">Unresolved · Last 48h</div>
              </div>
            </div>
          ))}
        </div>

        {/* Open incidents */}
        {open.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={40} className="text-green-500" />}
            title="No open incidents"
            description="All bots are running as expected"
          />
        ) : (
          <IncidentTable
            title={`Open Incidents (${open.length})`}
            runs={open}
            showResolve
          />
        )}

        {/* Resolved */}
        {resolved.length > 0 && (
          <IncidentTable
            title={`Resolved (${resolved.length})`}
            runs={resolved}
            showResolve={false}
            muted
          />
        )}
      </div>
    </div>
  )
}

function IncidentTable({
  title,
  runs,
  showResolve,
  muted = false,
}: {
  title: string
  runs: IncidentRun[]
  showResolve: boolean
  muted?: boolean
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-default flex items-center gap-2">
        {muted
          ? <CheckCircle2 size={15} className="text-green-500" />
          : <AlertTriangle size={15} className="text-orange-500" />}
        <span className="text-sm font-semibold text-primary">{title}</span>
      </div>
      <table className={`w-full data-table ${muted ? 'opacity-60' : ''}`}>
        <thead>
          <tr>
            <th>Bot</th>
            <th>Client</th>
            <th>Status</th>
            <th>When</th>
            <th>Duration</th>
            <th>Issue</th>
            {showResolve && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <Link href={`/bots/${run.bot_id}`} className="font-medium text-primary hover:text-blue-500 transition-colors">
                  {run.bot.bot_name}
                </Link>
              </td>
              <td className="text-secondary">{run.bot.clients?.name ?? '—'}</td>
              <td><StatusBadge status={run.status} /></td>
              <td className="text-secondary text-xs">
                <div>{formatDateTime(run.started_at)}</div>
                <div className="text-muted">{formatRelativeTime(run.started_at)}</div>
              </td>
              <td className="text-secondary">{formatDuration(run.duration_secs)}</td>
              <td className="max-w-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/runs/${run.id}`} className="text-xs text-blue-500 hover:text-blue-400 transition-colors shrink-0">
                    View timeline →
                  </Link>
                  <span className="text-xs text-secondary">
                    {run.summary_message ||
                      (run.status === 'missed' ? 'Scheduled run never started' :
                       run.status === 'timeout' ? 'Run exceeded time limit' :
                       'Run ended with failure status')}
                  </span>
                </div>
              </td>
              {showResolve && (
                <td>
                  <AcknowledgeButton runId={run.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
