import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle,
  Play, Info, AlertCircle, Zap, Timer, Server, Hash,
} from 'lucide-react'
import { formatDateTime, formatDuration, cn } from '@/lib/utils'
import type { Run, RunLog, BotWithClient } from '@/types'
import { format, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

function formatTime(date: string) {
  try { return format(parseISO(date), 'HH:mm:ss') } catch { return '—' }
}

function formatMs(a: string, b: string): string {
  try {
    const diff = new Date(b).getTime() - new Date(a).getTime()
    return diff < 1000 ? `+${diff}ms` : `+${(diff / 1000).toFixed(1)}s`
  } catch { return '' }
}

export default async function RunDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: rawRun } = await supabase
    .from('runs')
    .select('*, bots!inner(*, clients(id, name)), run_logs(*)')
    .eq('id', params.id)
    .single()

  if (!rawRun) notFound()

  // eslint-disable-next-line
  const run = rawRun as any
  const bot = run.bots as BotWithClient
  const logs = ((run.run_logs ?? []) as RunLog[]).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const isFinished = ['success', 'failure', 'timeout', 'missed'].includes(run.status)

  const statusConfig = {
    success:  { icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  dot: 'bg-green-500',  label: 'Run Succeeded' },
    failure:  { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    dot: 'bg-red-500',    label: 'Run Failed' },
    timeout:  { icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500', label: 'Run Timed Out' },
    missed:   { icon: AlertTriangle,color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-500', label: 'Run Missed' },
    started:  { icon: Play,         color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   dot: 'bg-blue-500',   label: 'Currently Running' },
  } as const

  const levelConfig = {
    info:    { icon: Info,         color: 'text-blue-500',   bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   dot: 'bg-blue-400',    label: 'INFO' },
    warning: { icon: AlertCircle,  color: 'text-amber-500',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  dot: 'bg-amber-400',   label: 'WARN' },
    error:   { icon: Zap,          color: 'text-red-500',    bg: 'bg-red-500/10',     border: 'border-red-500/20',    dot: 'bg-red-400',     label: 'ERROR' },
  } as const

  const endCfg = statusConfig[run.status as keyof typeof statusConfig] ?? statusConfig.started
  const EndIcon = endCfg.icon

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={`Run Detail`}
        subtitle={`${bot.bot_name} · ${bot.clients?.name ?? '—'}`}
      >
        <Link href="/runs" className="btn-secondary">
          <ArrowLeft size={14} /> All Runs
        </Link>
        <Link href={`/bots/${bot.id}`} className="btn-secondary">
          View Bot
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">

        {/* Run summary card */}
        <div className="card p-5 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', endCfg.bg)}>
                <EndIcon size={22} className={endCfg.color} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={run.status} />
                  <span className="text-xs text-muted font-mono">{run.id.slice(0, 8)}…</span>
                </div>
                <h2 className="text-lg font-bold text-primary">{bot.bot_name}</h2>
                <p className="text-sm text-muted">{bot.clients?.name ?? '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-right">
              {[
                { icon: Play,   label: 'Started',  value: formatDateTime(run.started_at) },
                { icon: Timer,  label: 'Duration', value: formatDuration(run.duration_secs) },
                { icon: Server, label: 'VM / Host', value: run.vm_name ?? '—' },
                { icon: Hash,   label: 'Log Steps', value: String(logs.length) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="text-[10px] text-muted uppercase tracking-wide mb-0.5 flex items-center justify-end gap-1">
                    <Icon size={10} /> {label}
                  </div>
                  <div className="text-sm font-semibold text-primary">{value}</div>
                </div>
              ))}
            </div>
          </div>
          {run.summary_message && (
            <div className="mt-4 pt-4 border-t border-default">
              <p className="text-sm text-secondary italic">&ldquo;{run.summary_message}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Run Timeline</h3>

        <div className="relative">
          {/* Vertical spine */}
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/60 via-default to-transparent" style={{ borderLeft: '1px dashed var(--border-strong)' }} />

          <div className="space-y-1">

            {/* ── START EVENT ── */}
            <TimelineEvent
              dot="bg-blue-500"
              dotRing="ring-blue-500/30"
              pulse
              time={formatTime(run.started_at)}
              label="Run Started"
              sublabel={run.vm_name ? `VM: ${run.vm_name}` : undefined}
              cardClass="border-blue-500/20 bg-blue-500/5"
              icon={<Play size={13} className="text-blue-400" />}
              offset=""
            />

            {/* ── LOG EVENTS ── */}
            {logs.map((log, i) => {
              const lvl = levelConfig[log.level as keyof typeof levelConfig] ?? levelConfig.info
              const LvlIcon = lvl.icon
              const offset = formatMs(run.started_at, log.timestamp)
              return (
                <TimelineEvent
                  key={log.id}
                  dot={lvl.dot}
                  dotRing={`ring-${log.level === 'info' ? 'blue' : log.level === 'warning' ? 'amber' : 'red'}-500/20`}
                  time={formatTime(log.timestamp)}
                  label={log.log_title}
                  sublabel={log.message ?? undefined}
                  cardClass={cn(lvl.border, lvl.bg)}
                  icon={<LvlIcon size={13} className={lvl.color} />}
                  offset={offset}
                  badge={
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide',
                      lvl.bg, lvl.color
                    )}>
                      {lvl.label}
                    </span>
                  }
                  stepIndex={log.step_index != null ? log.step_index : i + 1}
                />
              )
            })}

            {/* ── END EVENT ── */}
            {isFinished && run.ended_at && (
              <TimelineEvent
                dot={endCfg.dot}
                dotRing={`ring-2`}
                time={formatTime(run.ended_at)}
                label={endCfg.label}
                sublabel={run.summary_message ?? undefined}
                cardClass={cn(endCfg.border, endCfg.bg, 'font-medium')}
                icon={<EndIcon size={13} className={endCfg.color} />}
                offset={formatMs(run.started_at, run.ended_at)}
                terminal
              />
            )}

            {/* ── STILL RUNNING ── */}
            {!isFinished && (
              <div className="flex items-center gap-4 pl-1">
                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20" />
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                  Still running…
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

interface TimelineEventProps {
  dot: string
  dotRing: string
  pulse?: boolean
  time: string
  label: string
  sublabel?: string
  cardClass?: string
  icon: React.ReactNode
  offset: string
  badge?: React.ReactNode
  stepIndex?: number
  terminal?: boolean
}

function TimelineEvent({ dot, dotRing, pulse, time, label, sublabel, cardClass, icon, offset, badge, stepIndex, terminal }: TimelineEventProps) {
  return (
    <div className="flex items-start gap-4 group">
      {/* Dot */}
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0 z-10">
        <div className={cn(
          'w-3.5 h-3.5 rounded-full ring-4',
          dot,
          dotRing,
          pulse && 'animate-pulse',
          terminal && 'w-4 h-4'
        )} />
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 mb-3 rounded-xl border px-4 py-3 transition-shadow',
        'hover:shadow-md',
        cardClass ?? 'border-default bg-card'
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {icon}
            {stepIndex != null && (
              <span className="text-[10px] text-muted font-mono">#{stepIndex}</span>
            )}
            {badge}
            <span className={cn('text-sm font-semibold text-primary', terminal && 'text-base')}>{label}</span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-mono text-muted">{time}</div>
            {offset && <div className="text-[10px] text-muted opacity-70">{offset}</div>}
          </div>
        </div>
        {sublabel && (
          <p className="text-xs text-secondary mt-1 leading-relaxed">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
