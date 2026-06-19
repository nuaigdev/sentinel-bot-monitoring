import { Bot, Play, XCircle, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OverviewStats } from '@/types'
import { HealthGauge } from './HealthGauge'

interface StatsRowProps {
  stats: OverviewStats
  periodLabel?: string
}

export function StatsRow({ stats, periodLabel = '24h' }: StatsRowProps) {
  const statItems = [
    {
      icon: Bot, label: 'Total Bots', value: stats.total_bots,
      sub: `${stats.active_bots} active`, color: 'text-blue-500', bg: 'bg-blue-500/10',
      alert: false, pulse: false,
    },
    {
      icon: Play, label: 'Running', value: stats.currently_running,
      sub: 'active now', color: 'text-cyan-500', bg: 'bg-cyan-500/10',
      alert: false, pulse: stats.currently_running > 0,
    },
    {
      icon: XCircle, label: `Failed (${periodLabel})`, value: stats.failed_24h,
      sub: `${stats.missed_24h} missed`, color: 'text-red-500', bg: 'bg-red-500/10',
      alert: stats.failed_24h > 0 || stats.missed_24h > 0, pulse: false,
    },
    {
      icon: CheckCircle2, label: `Passed (${periodLabel})`, value: stats.passed_24h,
      sub: 'successful', color: 'text-green-500', bg: 'bg-green-500/10',
      alert: false, pulse: false,
    },
    {
      icon: Clock, label: `Timeouts (${periodLabel})`, value: stats.timeouts_24h,
      sub: 'timed out', color: 'text-orange-500', bg: 'bg-orange-500/10',
      alert: stats.timeouts_24h > 0, pulse: false,
    },
  ]

  return (
    <div className="flex gap-4 mb-6 flex-col lg:flex-row">
      {/* Health card */}
      <div className="card bg-gradient-to-br from-[#0d1a2e] to-[#0B1120] text-white p-5 flex items-center gap-5 shrink-0">
        <HealthGauge score={stats.health_score} />
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Automation Health</div>
          <div className="text-3xl font-bold text-white leading-none">{stats.health_score}%</div>
          <div className="text-xs text-slate-500 mt-1.5">{stats.passed_24h} successful runs ({periodLabel})</div>
          <div className={cn('flex items-center gap-1 text-xs mt-1.5', stats.health_score >= 90 ? 'text-green-400' : 'text-orange-400')}>
            {stats.health_score >= 90 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {stats.health_score >= 90 ? 'Healthy' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Stats strip — one card, 5 stats separated by dividers */}
      <div className="card flex-1 flex items-stretch divide-x divide-default overflow-hidden">
        {statItems.map(({ icon: Icon, label, value, sub, color, bg, alert, pulse }) => (
          <div key={label} className="flex-1 flex flex-col justify-center px-4 py-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', bg)}>
                <Icon size={13} className={color} />
              </div>
              {alert && value > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
              {pulse && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />}
            </div>
            <div className="text-2xl font-bold text-primary leading-none tabular-nums">{value}</div>
            <div className="text-xs font-medium text-secondary mt-1 truncate">{label}</div>
            <div className="text-[10px] text-muted truncate">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
