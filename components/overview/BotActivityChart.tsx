'use client'

import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import {
  format, parseISO, addDays, addHours, addMonths, startOfMonth
} from 'date-fns'
import { cn } from '@/lib/utils'
import type { Run, TimeScope } from '@/types'

interface BotActivityChartProps {
  runs: Pick<Run, 'status' | 'started_at'>[]
  scope?: TimeScope
  periodStartIso?: string
  periodEndIso?: string
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

function buildBuckets(
  scope: TimeScope,
  periodStart: Date,
): { key: string; label: string; axisLabel: string; runs: Array<{ status: string }> }[] {
  if (scope === '24h') {
    return Array.from({ length: 24 }, (_, i) => {
      const h = addHours(periodStart, i)
      const key = format(h, 'yyyy-MM-dd HH')
      return { key, label: format(h, 'h a'), axisLabel: i % 6 === 0 ? format(h, 'ha') : '', runs: [] }
    })
  }
  if (scope === '7d') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(periodStart, i)
      const key = format(d, 'yyyy-MM-dd')
      return { key, label: format(d, 'EEE MMM d'), axisLabel: format(d, 'M/d'), runs: [] }
    })
  }
  if (scope === '1y') {
    return Array.from({ length: 12 }, (_, i) => {
      const m = addMonths(startOfMonth(periodStart), i)
      const key = format(m, 'yyyy-MM')
      return { key, label: format(m, 'MMMM yyyy'), axisLabel: format(m, "MMM 'yy"), runs: [] }
    })
  }
  // default: 30d
  return Array.from({ length: 30 }, (_, i) => {
    const d = addDays(periodStart, i)
    const key = format(d, 'yyyy-MM-dd')
    return { key, label: format(d, 'MMM d, yyyy'), axisLabel: i % 5 === 0 ? format(d, 'M/d') : '', runs: [] }
  })
}

export function BotActivityChart({ runs, scope = '30d', periodStartIso, periodEndIso }: BotActivityChartProps) {
  const periodStart = periodStartIso ? parseISO(periodStartIso) : (() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return d
  })()

  const buckets = buildBuckets(scope, periodStart)

  for (const run of runs) {
    const startedAt = parseISO(run.started_at)
    let key: string
    if (scope === '24h') {
      key = format(startedAt, 'yyyy-MM-dd HH')
    } else if (scope === '1y') {
      key = format(startedAt, 'yyyy-MM')
    } else {
      key = format(startedAt, 'yyyy-MM-dd')
    }
    const bucket = buckets.find((b) => b.key === key)
    if (bucket) bucket.runs.push({ status: run.status })
  }

  const maxRuns = Math.max(...buckets.map((d) => d.runs.length), 1)
  const segH = Math.max(8, Math.min(28, Math.floor(120 / maxRuns)))

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-primary">Bot Activity</span>
        </div>
        <Link href="/runs" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
          View Runs →
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-4 pt-3 min-h-0">
        <div className="flex items-center gap-3 mb-3 shrink-0">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-[10px] text-muted">
              <span className={cn('w-2 h-2 rounded-full shrink-0', l.cls)} />
              {l.label}
            </div>
          ))}
        </div>

        <div className="flex-1 flex items-end gap-[3px]" style={{ minHeight: 100 }}>
          {buckets.map((bucket) => (
            <div
              key={bucket.key}
              className="flex-1 flex flex-col-reverse gap-[2px]"
              title={`${bucket.label}: ${bucket.runs.length} run${bucket.runs.length !== 1 ? 's' : ''}`}
            >
              {bucket.runs.length === 0 ? (
                <div className="w-full rounded-sm bg-slate-200 dark:bg-slate-700/40" style={{ height: 4 }} />
              ) : (
                bucket.runs.map((run, i) => (
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

        <div className="flex gap-[3px] mt-2 shrink-0">
          {buckets.map((bucket) => (
            <div key={bucket.key} className="flex-1 text-center text-[8px] text-muted">
              {bucket.axisLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
