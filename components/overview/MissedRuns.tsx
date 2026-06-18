import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { RunWithBot } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface MissedRunsProps {
  missed: RunWithBot[]
}

export function MissedRuns({ missed }: MissedRunsProps) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-purple-500" />
          <span className="text-sm font-semibold text-primary">Missed Runs</span>
        </div>
        <Link href="/runs?status=missed" className="text-xs text-blue-500 hover:text-blue-400">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-default">
        {missed.length === 0 ? (
          <EmptyState icon={<AlertCircle size={28} />} title="No missed runs" description="All scheduled bots are starting on time" />
        ) : (
          missed.map((run) => (
            <Link key={run.id} href={`/bots/${run.bot_id}`} className="block px-5 py-3 hover:bg-surface transition-colors">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-primary truncate">{run.bot.bot_name}</span>
                <span className="text-[10px] text-muted shrink-0 ml-2">{formatRelativeTime(run.started_at)}</span>
              </div>
              <div className="text-[10px] text-muted">{run.bot.client_name}</div>
              <div className="text-[10px] text-purple-500 dark:text-purple-400 mt-0.5">
                Expected at {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
