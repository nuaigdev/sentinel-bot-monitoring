'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import type { Run } from '@/types'

interface BotActivityChartProps {
  runs: Pick<Run, 'status' | 'started_at'>[]
}

export function BotActivityChart({ runs }: BotActivityChartProps) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const key = format(date, 'yyyy-MM-dd')
    return { date: key, label: format(date, 'MMM d'), success: 0, failure: 0, timeout: 0, missed: 0 }
  })

  for (const run of runs) {
    const key = format(parseISO(run.started_at), 'yyyy-MM-dd')
    const day = days.find((d) => d.date === key)
    if (!day) continue
    if (run.status === 'success') day.success++
    else if (run.status === 'failure') day.failure++
    else if (run.status === 'timeout') day.timeout++
    else if (run.status === 'missed') day.missed++
  }

  const tickDates = days.filter((_, i) => i % 5 === 0).map((d) => d.date)

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-primary">Bot Activity — Last 30 Days</span>
        <div className="flex items-center gap-4 text-[10px] text-muted">
          {[
            { color: '#22c55e', label: 'Success' },
            { color: '#ef4444', label: 'Failure' },
            { color: '#f97316', label: 'Timeout' },
            { color: '#a855f7', label: 'Missed' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={days} barSize={6} barGap={1}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            ticks={tickDates}
            tickFormatter={(v) => format(parseISO(v), 'MMM d')}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f1f5f9',
            }}
            labelFormatter={(v) => format(parseISO(v as string), 'MMM d, yyyy')}
            cursor={{ fill: 'rgba(148,163,184,0.05)' }}
          />
          <Bar dataKey="success" stackId="a" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="failure" stackId="a" fill="#ef4444" />
          <Bar dataKey="timeout" stackId="a" fill="#f97316" />
          <Bar dataKey="missed" stackId="a" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
