import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import type { RunWithBot } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface RecentFailuresProps {
  failures: RunWithBot[]
}

export function RecentFailures({ failures }: RecentFailuresProps) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <XCircle size={14} className="text-red-500" />
          <span className="text-sm font-semibold text-primary">Recent Failures</span>
        </div>
        <Link href="/runs?status=failure" className="text-xs text-blue-500 hover:text-blue-400">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-default">
        {failures.length === 0 ? (
          <EmptyState icon={<XCircle size={28} />} title="No recent failures" description="All runs completed successfully" />
        ) : (
          failures.map((run) => (
            <Link key={run.id} href={`/runs?run=${run.id}`} className="block px-5 py-3 hover:bg-surface transition-colors">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-primary truncate">{run.bot.bot_name}</span>
                <span className="text-[10px] text-muted shrink-0 ml-2">{formatRelativeTime(run.started_at)}</span>
              </div>
              <div className="text-[10px] text-muted mb-1">{run.bot.client_name}</div>
              {run.summary_message && (
                <div className="text-[11px] text-red-500 dark:text-red-400 truncate">{run.summary_message}</div>
              )}
              {run.duration_secs != null && (
                <div className="text-[10px] text-muted mt-1">Duration: {formatDuration(run.duration_secs)}</div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
