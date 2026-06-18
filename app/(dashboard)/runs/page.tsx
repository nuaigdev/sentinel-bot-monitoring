import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { formatDateTime, formatDuration, formatRelativeTime } from '@/lib/utils'
import type { RunWithBot } from '@/types'

export const dynamic = 'force-dynamic'

export default async function RunsPage({
  searchParams,
}: {
  searchParams: { status?: string; bot_id?: string }
}) {
  const supabase = await createClient()
  const filterStatus = searchParams.status
  const filterBotId = searchParams.bot_id

  let query = supabase
    .from('runs')
    .select('*, bots!inner(*)')
    .order('started_at', { ascending: false })
    .limit(100)

  if (filterStatus) query = query.eq('status', filterStatus)
  if (filterBotId) query = query.eq('bot_id', filterBotId)

  const { data: rawRuns } = await query
  type RawRunWithBot = import('@/types').Run & { bots: import('@/types').Bot }
  const allRuns: RunWithBot[] = ((rawRuns ?? []) as unknown as RawRunWithBot[]).map(
    (r) => ({ ...r, bot: r.bots })
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Runs" subtitle="Complete history of all bot execution instances" />

      {/* Status filter tabs */}
      <div className="px-6 pt-4 flex items-center gap-2 border-b border-default pb-3">
        {[
          { label: 'All', value: undefined },
          { label: 'Running', value: 'started' },
          { label: 'Success', value: 'success' },
          { label: 'Failed', value: 'failure' },
          { label: 'Timeout', value: 'timeout' },
          { label: 'Missed', value: 'missed' },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/runs?status=${tab.value}` : '/runs'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === tab.value
                ? 'bg-blue-600 text-white'
                : 'text-muted hover:bg-surface hover:text-primary'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {allRuns.length === 0 ? (
          <EmptyState
            icon={<Play size={40} />}
            title="No runs found"
            description="Bot runs will appear here once bots start reporting"
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Bot</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>VM / Host</th>
                  <th>Summary</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="whitespace-nowrap">
                      <div className="font-medium text-primary text-sm">{run.bot.bot_name}</div>
                      <div className="text-[11px] text-muted">{run.bot.client_name}</div>
                    </td>
                    <td className="whitespace-nowrap"><StatusBadge status={run.status} /></td>
                    <td className="whitespace-nowrap text-xs text-secondary">
                      <div>{formatDateTime(run.started_at)}</div>
                      <div className="text-muted">{formatRelativeTime(run.started_at)}</div>
                    </td>
                    <td className="whitespace-nowrap text-xs text-secondary">{formatDuration(run.duration_secs)}</td>
                    <td className="whitespace-nowrap text-xs font-mono text-secondary">{run.vm_name ?? '—'}</td>
                    <td className="max-w-xs">
                      <span className="text-xs text-secondary line-clamp-2">
                        {run.summary_message || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap w-20">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/runs/${run.id}`}
                          className="btn-secondary text-[11px] px-2 py-1 text-center leading-tight hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5"
                        >
                          View Run
                        </Link>
                        <Link
                          href={`/bots/${run.bot_id}`}
                          className="btn-secondary text-[11px] px-2 py-1 text-center leading-tight hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5"
                        >
                          View Bot
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
