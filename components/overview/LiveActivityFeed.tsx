import { Activity } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime, statusDotColors, getStatusLabel } from '@/lib/utils'
import type { DashboardActivity } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface LiveActivityFeedProps {
  activities: DashboardActivity[]
}

export function LiveActivityFeed({ activities }: LiveActivityFeedProps) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-primary">Live Activity Feed</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        <Link href="/runs" className="text-xs text-blue-500 hover:text-blue-400">
          View all →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <EmptyState
            icon={<Activity size={32} />}
            title="No recent activity"
            description="Bot events will appear here in real time"
          />
        ) : (
          <div className="divide-y divide-default">
            {activities.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface transition-colors">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColors[item.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-primary truncate">
                    <span className="font-medium">{item.bot_name}</span>
                    {' '}
                    <span className="text-muted">{item.event}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.client_name}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block
                    ${item.status === 'success' ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                      item.status === 'failure' ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20' :
                      item.status === 'timeout' ? 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20' :
                      item.status === 'missed' ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' :
                      'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'}`}>
                    {getStatusLabel(item.status)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
