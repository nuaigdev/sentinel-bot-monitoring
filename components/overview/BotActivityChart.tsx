'use client'

import { BarChart2 } from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Run } from '@/types'

interface BotActivityChartProps {
  runs: Pick<Run, 'status' | 'started_at'>[]
}

const statusColor: Record<string, string> = {
  success: 'bg-green-500',
  failure: 'bg-red-500',
  timeout: 'bg-orange-400',
  missed: 'bg-purple-500',
  started: 'bg-blue-500',
}

const legend = [
  { cls: 'bg-green-500', label: 'Success' },
  { cls: 'bg-red-500', label: 'Failure' },
  { cls: 'bg-orange-400', label: 'Timeout' },
  { cls: 'bg-purple-500', label: 'Missed' },
]

export function BotActivityChart({ runs }: BotActivityChartProps) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const key = format(date, 'yyyy-MM-dd')
    return { key, label: format(date, 'MMM d'), runs: [] as Array<{ status: string }> }
  })

  for (const run of runs) {
    const key = format(parseISO(run.started_at), 'yyyy-MM-dd')
    const day = days.find((d) => d.key === key)
    if (day) day.runs.push({ status: run.status })
  }

  const maxRuns = Math.max(...days.map((d) => d.runs.length), 1)
  const segH = Math.max(8, Math.min(28, Math.floor(140 / maxRuns)))

  return (
    <div className="card h-full flex flex-col">
      {/* Header — matches LiveActivityFeed style */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-primary">Bot Activity</span>
        </div>
        <div className="flex items-center gap-3">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-[10px] text-muted">
              <span className={cn('w-2 h-2 rounded-full shrink-0', l.cls)} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col px-5 pb-4 pt-3 min-h-0">
        <div className="flex-1 flex items-end gap-[3px]" style={{ minHeight: 120 }}>
          {days.map((day) => (
            <div
              key={day.key}
              className="flex-1 flex flex-col-reverse gap-[2px]"
              title={`${day.label}: ${day.runs.length} run${day.runs.length !== 1 ? 's' : ''}`}
            >
              {day.runs.length === 0 ? (
                <div className="w-full rounded-sm bg-slate-200 dark:bg-slate-700/40" style={{ height: 4 }} />
              ) : (
                day.runs.map((run, i) => (
                  <div
                    key={i}
                    className={cn('w-full rounded-sm', statusColor[run.status] ?? 'bg-slate-400')}
                    style={{ height: segH }}
                  />
                ))
              )}
            </div>
          ))}
        </div>

        {/* Date axis */}
        <div className="flex gap-[3px] mt-2 shrink-0">
          {days.map((day, i) => (
            <div key={day.key} className="flex-1 text-center text-[8px] text-muted">
              {i % 5 === 0 ? format(parseISO(day.key), 'M/d') : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
