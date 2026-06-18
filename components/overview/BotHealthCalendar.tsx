import Link from 'next/link'
import { format, subDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BotCalendarRow } from '@/types'

interface BotHealthCalendarProps {
  rows: BotCalendarRow[]
}

const dayStatusColors = {
  success: 'bg-green-500',
  failure: 'bg-red-500',
  timeout: 'bg-orange-500',
  missed: 'bg-purple-500',
  no_run: 'bg-slate-200 dark:bg-slate-700',
}

const dayStatusTitles = {
  success: 'Success',
  failure: 'Failed',
  timeout: 'Timeout',
  missed: 'Missed',
  no_run: 'No run',
}

export function BotHealthCalendar({ rows }: BotHealthCalendarProps) {
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-primary">Bot Health Calendar — Last 30 Days</span>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          {(['success', 'failure', 'timeout', 'missed', 'no_run'] as const).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span className={cn('w-2.5 h-2.5 rounded-sm', dayStatusColors[s])} />
              {dayStatusTitles[s]}
            </div>
          ))}
        </div>
      </div>

      {/* Day header */}
      <div className="flex mb-2">
        <div className="w-44 shrink-0" />
        <div className="flex-1 flex gap-0.5 overflow-hidden">
          {days.map((day, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[8px] text-muted"
              style={{ minWidth: 0 }}
            >
              {i % 5 === 0 ? format(day, 'M/d') : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Bot rows */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted">No bots registered yet</div>
        ) : (
          rows.map(({ bot, days: botDays }) => (
            <div key={bot.id} className="flex items-center gap-0.5">
              <Link
                href={`/bots/${bot.id}`}
                className="w-44 shrink-0 pr-3 text-xs text-primary hover:text-blue-500 transition-colors truncate"
                title={`${bot.client_name} / ${bot.bot_name}`}
              >
                {bot.bot_name}
              </Link>
              <div className="flex-1 flex gap-0.5 overflow-hidden">
                {botDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn('flex-1 h-4 rounded-[2px]', dayStatusColors[day.status])}
                    style={{ minWidth: 0 }}
                    title={`${format(parseISO(day.date), 'MMM d')}: ${dayStatusTitles[day.status]}`}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
