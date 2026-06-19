'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { BotRegistrationModal } from '@/components/bots/BotRegistrationModal'
import { ApiKeysPanel } from '@/components/bots/ApiKeysPanel'
import { StatusBadge, BotTypeBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import {
  Bot, Plus, Download, Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Play, AlertCircle
} from 'lucide-react'
import type { BotWithStats, Run } from '@/types'
import { formatRelativeTime, formatAllocatedTime, formatDate, cn } from '@/lib/utils'
import Link from 'next/link'

const PAGE_SIZE = 15

export default function BotsPage() {
  const [bots, setBots] = useState<BotWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null)
  const [selectedBotName, setSelectedBotName] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterClientId, setFilterClientId] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    createClient()
      .from('clients')
      .select('id, name')
      .order('name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadBots = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    try {
      let query = supabase
        .from('bots')
        .select('*, clients(id, name)', { count: 'exact' })
        .order('bot_name')

      if (search) query = query.ilike('bot_name', `%${search}%`)
      if (filterClientId !== 'all') query = query.eq('client_id', filterClientId)
      if (filterType !== 'all') query = query.eq('bot_type', filterType)
      if (filterStatus === 'active') query = query.eq('is_active', true)
      if (filterStatus === 'inactive') query = query.eq('is_active', false)

      const from = page * PAGE_SIZE
      query = query.range(from, from + PAGE_SIZE - 1)

      const { data: rawBots, count } = await query
      setTotal(count ?? 0)

      if (!rawBots) { setBots([]); return }

      type BotRow = import('@/types').BotWithClient
      const bots2 = rawBots as unknown as BotRow[]
      const botIds = bots2.map((b) => b.id)
      const h24ago = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const [{ data: rawAllRuns }, { data: rawStartedRuns }] = await Promise.all([
        supabase.from('runs').select('bot_id, status').in('bot_id', botIds).gte('started_at', h24ago),
        supabase.from('runs').select('*').in('bot_id', botIds).eq('status', 'started'),
      ])
      const allRuns = rawAllRuns as unknown as { bot_id: string; status: string }[]
      const startedRuns = rawStartedRuns as unknown as Run[]

      const { data: rawLastRuns } = await supabase
        .from('runs')
        .select('*')
        .in('bot_id', botIds)
        .neq('status', 'started')
        .order('started_at', { ascending: false })
      const lastRuns = rawLastRuns as unknown as Run[]

      const lastRunByBot: Record<string, Run> = {}
      for (const r of lastRuns ?? []) {
        if (!lastRunByBot[r.bot_id]) lastRunByBot[r.bot_id] = r
      }

      const activeRunByBot: Record<string, Run> = {}
      for (const r of startedRuns ?? []) {
        activeRunByBot[r.bot_id] = r
      }

      const botsWithStats: BotWithStats[] = bots2.map((bot) => {
        const botRuns = (allRuns ?? []).filter((r) => r.bot_id === bot.id)
        const success = botRuns.filter((r) => r.status === 'success').length
        const failure = botRuns.filter((r) => r.status === 'failure').length
        const timeout = botRuns.filter((r) => r.status === 'timeout').length
        const missed = botRuns.filter((r) => r.status === 'missed').length
        const total = success + failure + timeout + missed
        return {
          ...bot,
          total_runs: total,
          success_runs: success,
          failure_runs: failure,
          timeout_runs: timeout,
          missed_runs: missed,
          success_rate: total === 0 ? 100 : Math.round((success / total) * 100),
          last_run: lastRunByBot[bot.id] ?? null,
          active_run: activeRunByBot[bot.id] ?? null,
        }
      })

      if (filterStatus === 'running') {
        setBots(botsWithStats.filter((b) => b.active_run))
      } else {
        setBots(botsWithStats)
      }
    } finally {
      setLoading(false)
    }
  }, [search, filterClientId, filterType, filterStatus, page])

  useEffect(() => { loadBots() }, [loadBots])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const summaryStats = {
    total: bots.length,
    active: bots.filter((b) => b.is_active).length,
    running: bots.filter((b) => b.active_run).length,
    failed: bots.filter((b) => b.failure_runs > 0).length,
    missed: bots.filter((b) => b.missed_runs > 0).length,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Bots Registry" subtitle="Register and manage all your automation bots">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15} />
          Request New Bot
        </button>
        <button className="btn-secondary">
          <Download size={15} />
          Export
        </button>
      </Header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Summary stats */}
          <div className="px-6 pt-4 grid grid-cols-5 gap-3">
            {[
              { label: 'Total Bots', value: total, icon: <Bot size={14} />, color: 'text-blue-500' },
              { label: 'Active', value: summaryStats.active, icon: <CheckCircle2 size={14} />, color: 'text-green-500' },
              { label: 'Running', value: summaryStats.running, icon: <Play size={14} />, color: 'text-cyan-500' },
              { label: 'Missed', value: summaryStats.missed, icon: <AlertCircle size={14} />, color: 'text-purple-500' },
              { label: 'Failed', value: summaryStats.failed, icon: <XCircle size={14} />, color: 'text-red-500' },
            ].map((s) => (
              <div key={s.label} className="card px-4 py-3 flex items-center gap-3">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <div className="text-lg font-bold text-primary">{s.value}</div>
                  <div className="text-[10px] text-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="px-6 py-3 flex items-center gap-3 border-b border-default">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input-field pl-8 py-1.5"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search bots…"
              />
            </div>
            <select
              className="input-field py-1.5 w-auto"
              value={filterClientId}
              onChange={(e) => { setFilterClientId(e.target.value); setPage(0) }}
            >
              <option value="all">All Clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="input-field py-1.5 w-auto"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(0) }}
            >
              <option value="all">All Types</option>
              <option value="cloud">Cloud</option>
              <option value="desktop">Desktop</option>
            </select>
            <select
              className="input-field py-1.5 w-auto"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="running">Running</option>
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <PageLoader />
            ) : bots.length === 0 ? (
              <EmptyState
                icon={<Bot size={40} />}
                title="No bots found"
                description="Register your first bot to start monitoring"
                action={
                  <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={15} /> Register Bot
                  </button>
                }
              />
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Bot Name</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Time Limit</th>
                    <th>Success Rate</th>
                    <th>Last Run</th>
                    <th>Next Run</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((bot) => {
                    const isSelected = selectedBotId === bot.id
                    const currentStatus: 'started' | 'success' | 'failure' | 'timeout' | 'missed' | null =
                      bot.active_run ? 'started' : bot.last_run?.status ?? null
                    const srColor =
                      bot.success_rate >= 90 ? 'bg-green-500' :
                      bot.success_rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'

                    return (
                      <tr
                        key={bot.id}
                        onClick={() => {
                          setSelectedBotId(isSelected ? null : bot.id)
                          setSelectedBotName(isSelected ? null : bot.bot_name)
                        }}
                        className={cn('cursor-pointer', isSelected && 'bg-blue-50 dark:bg-blue-900/10')}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              bot.active_run ? 'bg-blue-500 animate-pulse' :
                              bot.is_active ? 'bg-green-500' : 'bg-slate-300'
                            )} />
                            <div>
                              <Link
                                href={`/bots/${bot.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-primary hover:text-blue-500 transition-colors"
                              >
                                {bot.bot_name}
                              </Link>
                              <div className="text-[10px] text-muted">{formatDate(bot.created_at)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{bot.clients?.name ?? '—'}</td>
                        <td>
                          {currentStatus ? (
                            <StatusBadge status={currentStatus} />
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td><BotTypeBadge type={bot.bot_type} /></td>
                        <td className="text-secondary">{formatAllocatedTime(bot.time_allocated_secs)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" style={{ minWidth: '60px' }}>
                              <div className={cn('h-full rounded-full', srColor)} style={{ width: `${bot.success_rate}%` }} />
                            </div>
                            <span className="text-xs font-medium text-primary w-10 text-right">{bot.success_rate}%</span>
                          </div>
                        </td>
                        <td className="text-secondary text-xs">
                          {bot.last_run ? formatRelativeTime(bot.last_run.started_at) : '—'}
                        </td>
                        <td className="text-secondary text-xs">
                          {bot.schedule_type === 'manual' ? <span className="text-muted">Manual</span> : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-default">
              <span className="text-xs text-muted">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-ghost p-1 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-muted">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-ghost p-1 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Keys sidebar */}
        <div className="w-72 border-l border-default shrink-0 overflow-hidden flex flex-col">
          <ApiKeysPanel selectedBotId={selectedBotId} selectedBotName={selectedBotName} />
        </div>
      </div>

      <BotRegistrationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(botId, rawKey, botName) => {
          loadBots()
          setSelectedBotId(botId)
          setSelectedBotName(botName)
        }}
      />
    </div>
  )
}
