'use client'

import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

interface BotStat {
  botName: string
  clientName: string
  success: number
  failure: number
  timeout: number
  missed: number
  total: number
}

interface BotActivityChartProps {
  botStats: BotStat[]
}

const statuses = [
  { key: 'success' as const, label: 'Success', bg: 'bg-green-500' },
  { key: 'failure' as const, label: 'Failure', bg: 'bg-red-500' },
  { key: 'timeout' as const, label: 'Timeout', bg: 'bg-orange-400' },
  { key: 'missed'  as const, label: 'Missed',  bg: 'bg-purple-500' },
]

export function BotActivityChart({ botStats }: BotActivityChartProps) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-primary">Bot Performance</span>
        </div>
        <Link href="/runs" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
          View Runs →
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-4 pt-3 min-h-0 overflow-y-auto">
        {botStats.length === 0 ? (
          <EmptyState
            icon={<BarChart2 size={32} />}
            title="No runs in this period"
            description="Bot performance will appear here once runs complete"
          />
        ) : (
          <>
            <div className="space-y-3.5 flex-1">
              {botStats.map((bot) => {
                const segments = statuses
                  .map((s) => ({ ...s, count: bot[s.key], pct: bot.total > 0 ? (bot[s.key] / bot.total) * 100 : 0 }))
                  .filter((s) => s.count > 0)

                return (
                  <div key={bot.botName}>
                    <div className="flex items-baseline justify-between mb-1.5 gap-2">
                      <div className="min-w-0">
                        <span
                          className="text-xs font-medium text-primary truncate block"
                          title={bot.botName}
                        >
                          {bot.botName}
                        </span>
                        {bot.clientName !== '—' && (
                          <span className="text-[10px] text-muted">{bot.clientName}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted shrink-0">
                        {bot.total} run{bot.total !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/40 gap-[1px]">
                      {segments.length === 0 ? (
                        <div className="flex-1 h-full bg-slate-300 dark:bg-slate-600" />
                      ) : (
                        segments.map((s) => (
                          <div
                            key={s.key}
                            className={cn('h-full first:rounded-l-full last:rounded-r-full', s.bg)}
                            style={{ width: `${s.pct}%` }}
                            title={`${s.label}: ${s.count}`}
                          />
                        ))
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {segments.map((s) => (
                        <span key={s.key} className="text-[9px] text-muted flex items-center gap-0.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full inline-block', s.bg)} />
                          {s.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 pt-3 border-t border-default shrink-0">
              {statuses.map((s) => (
                <div key={s.key} className="flex items-center gap-1 text-[10px] text-muted">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', s.bg)} />
                  {s.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
