import { Bot, Play, XCircle, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OverviewStats } from '@/types'
import { HealthGauge } from './HealthGauge'

interface StatsRowProps {
  stats: OverviewStats
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 mb-6">
      {/* Health Score — spans first column slot */}
      <div className="col-span-2 lg:col-span-1 card bg-gradient-to-br from-[#0d1a2e] to-[#0B1120] text-white p-5 flex items-center gap-5">
        <HealthGauge score={stats.health_score} />
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Automation Health</div>
          <div className="text-2xl font-bold text-white">{stats.health_score}%</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.passed_24h} successful runs (24h)
          </div>
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            stats.health_score >= 90 ? 'text-green-400' : 'text-orange-400'
          )}>
            {stats.health_score >= 90 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {stats.health_score >= 90 ? 'Healthy' : 'Needs attention'}
          </div>
        </div>
      </div>

      {/* Total Bots */}
      <StatCard
        icon={<Bot size={20} />}
        label="Total Bots"
        value={stats.total_bots}
        sub={`${stats.active_bots} active`}
        iconColor="text-blue-500"
        iconBg="bg-blue-50 dark:bg-blue-900/20"
      />

      {/* Currently Running */}
      <StatCard
        icon={<Play size={20} />}
        label="Currently Running"
        value={stats.currently_running}
        sub="active now"
        iconColor="text-cyan-500"
        iconBg="bg-cyan-50 dark:bg-cyan-900/20"
        pulse={stats.currently_running > 0}
      />

      {/* Failed Runs */}
      <StatCard
        icon={<XCircle size={20} />}
        label="Failed (24h)"
        value={stats.failed_24h}
        sub={`${stats.missed_24h} missed`}
        iconColor="text-red-500"
        iconBg="bg-red-50 dark:bg-red-900/20"
        alert={stats.failed_24h > 0 || stats.missed_24h > 0}
      />

      {/* Passed Runs */}
      <StatCard
        icon={<CheckCircle2 size={20} />}
        label="Passed (24h)"
        value={stats.passed_24h}
        sub="successful"
        iconColor="text-green-500"
        iconBg="bg-green-50 dark:bg-green-900/20"
      />

      {/* Timeouts */}
      <StatCard
        icon={<Clock size={20} />}
        label="Timeouts (24h)"
        value={stats.timeouts_24h}
        sub="timed out"
        iconColor="text-orange-500"
        iconBg="bg-orange-50 dark:bg-orange-900/20"
        alert={stats.timeouts_24h > 0}
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  iconColor: string
  iconBg: string
  alert?: boolean
  pulse?: boolean
}

function StatCard({ icon, label, value, sub, iconColor, iconBg, alert, pulse }: StatCardProps) {
  return (
    <div className="stat-card card-hover relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        {alert && value > 0 && (
          <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
        )}
        {pulse && (
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mt-1" />
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-primary leading-none">{value}</div>
        <div className="text-xs font-medium text-secondary mt-1">{label}</div>
        <div className="text-xs text-muted mt-0.5">{sub}</div>
      </div>
    </div>
  )
}
