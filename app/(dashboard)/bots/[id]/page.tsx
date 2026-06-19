import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatusBadge, BotTypeBadge, Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, AlertCircle, Bot as BotIcon, Calendar } from 'lucide-react'
import { formatDateTime, formatDuration, formatAllocatedTime, levelBgColors, cn } from '@/lib/utils'
import type { Run, RunLog, BotWithClient } from '@/types'

export const dynamic = 'force-dynamic'

interface RunWithLogs extends Run {
  run_logs: RunLog[]
}

export default async function BotDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: rawBot } = await supabase
    .from('bots')
    .select('*, clients(id, name)')
    .eq('id', params.id)
    .single()

  if (!rawBot) notFound()
  const bot = rawBot as unknown as BotWithClient

  const { data: runs } = await supabase
    .from('runs')
    .select('*, run_logs(*)')
    .eq('bot_id', params.id)
    .order('started_at', { ascending: false })
    .limit(20)

  const allRuns = (runs ?? []) as RunWithLogs[]
  const last30Runs = allRuns.slice(0, 30)
  const successCount = last30Runs.filter((r) => r.status === 'success').length
  const totalFinished = last30Runs.filter((r) => r.status !== 'started').length
  const healthScore = totalFinished === 0 ? 100 : Math.round((successCount / totalFinished) * 100)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title={bot.bot_name} subtitle={`${bot.clients?.name ?? '—'} · ${bot.bot_type}`}>
        <Link href="/bots" className="btn-secondary">
          <ArrowLeft size={14} />
          Back to Bots
        </Link>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Bot info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Health Score', value: `${healthScore}%`, icon: <CheckCircle2 size={16} />, color: healthScore >= 90 ? 'text-green-500' : 'text-orange-500' },
            { label: 'Total Runs', value: allRuns.length, icon: <Play size={16} />, color: 'text-blue-500' },
            { label: 'Time Limit', value: formatAllocatedTime(bot.time_allocated_secs), icon: <Clock size={16} />, color: 'text-purple-500' },
            { label: 'Schedule', value: bot.schedule_type === 'manual' ? 'Manual' : bot.schedule_type, icon: <Calendar size={16} />, color: 'text-cyan-500' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-surface', s.color)}>
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bot details */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-primary mb-4">Bot Configuration</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted mb-1">Type</div>
              <BotTypeBadge type={bot.bot_type} />
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Status</div>
              <Badge variant={bot.is_active ? 'success' : 'neutral'}>
                {bot.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Owner</div>
              <div className="text-primary">{bot.owner_email}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Concurrent Runs</div>
              <div className="text-primary">{bot.allow_concurrent_runs ? 'Allowed' : 'Not allowed'}</div>
            </div>
            {bot.schedule_cron && (
              <div>
                <div className="text-xs text-muted mb-1">Cron</div>
                <code className="text-xs font-mono text-primary">{bot.schedule_cron}</code>
              </div>
            )}
            {bot.schedule_fixed_times && (
              <div>
                <div className="text-xs text-muted mb-1">Fixed Times (UTC)</div>
                <div className="text-primary text-xs">{bot.schedule_fixed_times}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted mb-1">Grace Period</div>
              <div className="text-primary">{bot.missed_grace_secs}s</div>
            </div>
            {bot.description && (
              <div className="col-span-2">
                <div className="text-xs text-muted mb-1">Description</div>
                <div className="text-primary text-sm">{bot.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Run history */}
        <div className="card">
          <div className="px-5 py-4 border-b border-default">
            <h2 className="text-sm font-semibold text-primary">Run History</h2>
          </div>

          {allRuns.length === 0 ? (
            <EmptyState icon={<BotIcon size={32} />} title="No runs yet" description="This bot has not reported any runs" />
          ) : (
            <div className="divide-y divide-default">
              {allRuns.map((run) => (
                <div key={run.id} className="px-5 py-4 hover:bg-surface transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/runs/${run.id}`}><StatusBadge status={run.status} /></Link>
                        <span className="text-xs text-muted">{formatDateTime(run.started_at)}</span>
                        {run.duration_secs != null && (
                          <span className="text-xs text-muted">· {formatDuration(run.duration_secs)}</span>
                        )}
                        {run.vm_name && (
                          <span className="text-xs text-muted">· {run.vm_name}</span>
                        )}
                      </div>
                      {run.summary_message && (
                        <div className="text-xs text-secondary mb-2">{run.summary_message}</div>
                      )}
                      <Link href={`/runs/${run.id}`} className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                        View timeline →
                      </Link>

                      {/* Run logs timeline */}
                      {run.run_logs.length > 0 && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-default pl-4">
                          {run.run_logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((log) => (
                            <div key={log.id} className="flex items-start gap-2">
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5', levelBgColors[log.level])}>
                                {log.level}
                              </span>
                              <div>
                                <div className="text-xs font-medium text-primary">{log.log_title}</div>
                                {log.message && <div className="text-[11px] text-muted">{log.message}</div>}
                                <div className="text-[10px] text-slate-400">{formatDateTime(log.timestamp)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
