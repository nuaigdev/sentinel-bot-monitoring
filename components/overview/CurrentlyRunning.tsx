import Link from 'next/link'
import { Play, Clock } from 'lucide-react'
import { formatRelativeTime, formatAllocatedTime } from '@/lib/utils'
import type { RunWithBot } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface CurrentlyRunningProps {
  runs: RunWithBot[]
}

export function CurrentlyRunning({ runs }: CurrentlyRunningProps) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-blue-500" />
          <span className="text-sm font-semibold text-primary">Currently Running</span>
          {runs.length > 0 && (
            <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5">
              {runs.length}
            </span>
          )}
        </div>
        <Link href="/runs?status=started" className="text-xs text-blue-500 hover:text-blue-400">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-default">
        {runs.length === 0 ? (
          <EmptyState icon={<Play size={28} />} title="No bots running" description="All bots are idle" />
        ) : (
          runs.map((run) => {
            const elapsed = (Date.now() - new Date(run.started_at).getTime()) / 1000
            const pct = Math.min((elapsed / run.bot.time_allocated_secs) * 100, 100)
            return (
              <Link key={run.id} href={`/runs?run=${run.id}`} className="block px-5 py-3 hover:bg-surface transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-primary truncate">{run.bot.bot_name}</span>
                  <span className="text-[10px] text-muted shrink-0 ml-2">{formatRelativeTime(run.started_at)}</span>
                </div>
                <div className="text-[10px] text-muted mb-2">{run.bot.client_name} · {run.vm_name ?? '—'}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted shrink-0">
                    {formatAllocatedTime(run.bot.time_allocated_secs)} limit
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
