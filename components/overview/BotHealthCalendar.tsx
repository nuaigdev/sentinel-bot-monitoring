import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BotCalendarRow } from '@/types'

interface BotHealthCalendarProps {
  rows: BotCalendarRow[]
}

const dotColor = {
  success: 'bg-green-500',
  failure: 'bg-red-500',
  timeout: 'bg-orange-400',
  missed: 'bg-purple-500',
}

const dotLabel = {
  success: 'Success',
  failure: 'Failed',
  timeout: 'Timeout',
  missed: 'Missed',
}

export function BotHealthCalendar({ rows }: BotHealthCalendarProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-primary">Bot Health — Last 30 Runs</span>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          {(Object.keys(dotColor) as Array<keyof typeof dotColor>).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span className={cn('w-2 h-2 rounded-full', dotColor[s])} />
              {dotLabel[s]}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted">No bots registered yet</div>
        ) : (
          rows.map(({ bot, runs }) => (
            <div key={bot.id} className="flex items-center gap-3">
              <Link
                href={`/bots/${bot.id}`}
                className="w-40 shrink-0 text-xs text-primary hover:text-blue-500 transition-colors truncate"
                title={`${bot.client_name} / ${bot.bot_name}`}
              >
                {bot.bot_name}
              </Link>
              <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                {runs.length === 0 ? (
                  <span className="text-[10px] text-muted">No runs yet</span>
                ) : (
                  runs.map((run) => (
                    <Link
                      key={run.id}
                      href={`/runs/${run.id}`}
                      className={cn('w-3 h-3 rounded-full shrink-0 hover:scale-125 transition-transform', dotColor[run.status])}
                      title={`${format(parseISO(run.started_at), 'MMM d, HH:mm')}: ${dotLabel[run.status]}`}
                    />
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
