'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Plus, Pencil, Trash2, Check, X, Bot, Play,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import type { Run } from '@/types'
import { formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'

interface ClientData {
  id: string
  name: string
  created_at: string
}

interface BotRow {
  id: string
  bot_name: string
  is_active: boolean
  bot_type: 'cloud' | 'desktop'
  last_status: 'started' | 'success' | 'failure' | 'timeout' | 'missed' | null
  last_run_at: string | null
  is_running: boolean
}

interface ClientWithBotRows extends ClientData {
  bots: BotRow[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithBotRows[]>([])
  const [loading, setLoading] = useState(true)
  const [newClientName, setNewClientName] = useState('')
  const [addingClient, setAddingClient] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    try {
      const [{ data: rawClients }, { data: rawBots }, { data: rawLastRuns }, { data: rawRunning }] =
        await Promise.all([
          supabase.from('clients').select('id, name, created_at').order('name'),
          supabase.from('bots').select('id, client_id, bot_name, is_active, bot_type').order('bot_name'),
          supabase.from('runs')
            .select('bot_id, status, started_at')
            .neq('status', 'started')
            .order('started_at', { ascending: false }),
          supabase.from('runs').select('bot_id').eq('status', 'started'),
        ])

      const lastRunByBot: Record<string, { status: string; started_at: string }> = {}
      for (const r of (rawLastRuns ?? []) as { bot_id: string; status: string; started_at: string }[]) {
        if (!lastRunByBot[r.bot_id]) lastRunByBot[r.bot_id] = r
      }

      const runningBotIds = new Set((rawRunning ?? []).map((r: { bot_id: string }) => r.bot_id))

      const enrichedClients: ClientWithBotRows[] = (rawClients ?? []).map((c) => {
        const bots: BotRow[] = (rawBots ?? [])
          .filter((b: { client_id: string | null }) => b.client_id === c.id)
          .map((b: { id: string; bot_name: string; is_active: boolean; bot_type: 'cloud' | 'desktop' }) => ({
            id: b.id,
            bot_name: b.bot_name,
            is_active: b.is_active,
            bot_type: b.bot_type,
            last_status: (lastRunByBot[b.id]?.status as BotRow['last_status']) ?? null,
            last_run_at: lastRunByBot[b.id]?.started_at ?? null,
            is_running: runningBotIds.has(b.id),
          }))
        return { ...c, bots }
      })

      setClients(enrichedClients)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAddClient = async () => {
    const name = newClientName.trim()
    if (!name) return
    setAddingClient(true)
    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || 'Failed to create client')
        return
      }
      setNewClientName('')
      loadData()
    } finally {
      setAddingClient(false)
    }
  }

  const handleStartEdit = (c: ClientData) => {
    setEditingId(c.id)
    setEditName(c.name)
  }

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim()
    if (!name) return
    setSavingEdit(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clients').update({ name }).eq('id', id)
      if (error) { alert(error.message); return }
      setEditingId(null)
      loadData()
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id: string, name: string, botCount: number) => {
    if (botCount > 0) {
      alert(`Cannot delete "${name}" — it has ${botCount} bot(s). Reassign or delete those bots first.`)
      return
    }
    if (!confirm(`Delete client "${name}"?`)) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) { alert(error.message); return }
      loadData()
    } finally {
      setDeletingId(null)
    }
  }

  const unassigned = clients.length === 0 ? [] : (() => {
    const supabase = createClient()
    return []
  })()

  const totalBots = clients.reduce((acc, c) => acc + c.bots.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Clients" subtitle="Manage client accounts and their associated bots" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary */}
        <div className="flex items-center gap-4 mb-6">
          <div className="card px-5 py-3 flex items-center gap-3">
            <Building2 size={16} className="text-blue-500" />
            <div>
              <div className="text-lg font-bold text-primary">{clients.length}</div>
              <div className="text-[10px] text-muted">Clients</div>
            </div>
          </div>
          <div className="card px-5 py-3 flex items-center gap-3">
            <Bot size={16} className="text-green-500" />
            <div>
              <div className="text-lg font-bold text-primary">{totalBots}</div>
              <div className="text-[10px] text-muted">Total Bots</div>
            </div>
          </div>

          {/* Add client form */}
          <div className="ml-auto flex items-center gap-2">
            <input
              className="input-field py-1.5 w-52"
              placeholder="New client name…"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
            />
            <button
              className="btn-primary"
              onClick={handleAddClient}
              disabled={addingClient || !newClientName.trim()}
            >
              <Plus size={14} />
              Add Client
            </button>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="No clients yet"
            description="Add a client to start organizing your bots"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clients.map((client) => {
              const running = client.bots.filter((b) => b.is_running).length
              const active = client.bots.filter((b) => b.is_active).length
              const failed = client.bots.filter((b) => !b.is_running && b.last_status === 'failure').length
              const missed = client.bots.filter((b) => !b.is_running && b.last_status === 'missed').length
              const isEditing = editingId === client.id

              return (
                <div key={client.id} className="card p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="input-field py-1 text-base font-semibold w-48"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(client.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            autoFocus
                          />
                          <button
                            className="btn-ghost p-1 text-green-500 hover:text-green-400"
                            onClick={() => handleSaveEdit(client.id)}
                            disabled={savingEdit}
                          >
                            <Check size={15} />
                          </button>
                          <button
                            className="btn-ghost p-1 text-muted hover:text-primary"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-base font-semibold text-primary truncate">{client.name}</h3>
                      )}
                      <p className="text-[11px] text-muted mt-0.5">{client.bots.length} bot{client.bots.length !== 1 ? 's' : ''}</p>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button
                          className="btn-ghost p-1.5 text-muted hover:text-primary"
                          onClick={() => handleStartEdit(client)}
                          title="Rename"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-muted hover:text-red-400"
                          onClick={() => handleDelete(client.id, client.name, client.bots.length)}
                          disabled={deletingId === client.id}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { icon: <Bot size={11} />, label: 'Active', value: active, color: 'text-green-500' },
                      { icon: <Play size={11} />, label: 'Running', value: running, color: 'text-blue-500' },
                      { icon: <XCircle size={11} />, label: 'Failed', value: failed, color: 'text-red-500' },
                      { icon: <AlertCircle size={11} />, label: 'Missed', value: missed, color: 'text-purple-500' },
                    ].map((s) => (
                      <div key={s.label} className="bg-surface rounded-lg px-2 py-2 flex items-center gap-2">
                        <span className={s.color}>{s.icon}</span>
                        <div>
                          <div className="text-sm font-bold text-primary">{s.value}</div>
                          <div className="text-[9px] text-muted">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bot list */}
                  {client.bots.length === 0 ? (
                    <div className="text-xs text-muted text-center py-3">No bots assigned to this client</div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {client.bots.map((bot) => {
                        const displayStatus = bot.is_running ? 'started' : bot.last_status
                        return (
                          <Link
                            key={bot.id}
                            href={`/bots/${bot.id}`}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface transition-colors group"
                          >
                            <div className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              bot.is_running ? 'bg-blue-500 animate-pulse' :
                              bot.is_active ? 'bg-green-500' : 'bg-slate-400'
                            )} />
                            <span className="flex-1 text-xs text-primary truncate group-hover:text-blue-500 transition-colors">
                              {bot.bot_name}
                            </span>
                            {displayStatus && (
                              <StatusBadge status={displayStatus} />
                            )}
                            {bot.last_run_at && (
                              <span className="text-[10px] text-muted shrink-0">
                                {formatRelativeTime(bot.last_run_at)}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
