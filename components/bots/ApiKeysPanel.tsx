'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BotKey } from '@/types'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

interface ApiKeysPanelProps {
  selectedBotId: string | null
  selectedBotName: string | null
}

export function ApiKeysPanel({ selectedBotId, selectedBotName }: ApiKeysPanelProps) {
  const [keys, setKeys] = useState<BotKey[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [label, setLabel] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const loadKeys = async () => {
    if (!selectedBotId) { setKeys([]); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('bot_keys')
      .select('*')
      .eq('bot_id', selectedBotId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
    setKeys(data ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadKeys() }, [selectedBotId])

  const handleCreate = async () => {
    if (!selectedBotId) return
    setCreating(true)
    try {
      const res = await fetch(`/api/v1/bots/${selectedBotId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNewKey(data.raw_key)
      setLabel('')
      setShowCreate(false)
      await loadKeys()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this API key? Bots using it will get 401 immediately.')) return
    await fetch(`/api/v1/bots/${selectedBotId}/keys/${keyId}/revoke`, { method: 'POST' })
    await loadKeys()
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <Key size={14} className="text-purple-500" />
          <span className="text-sm font-semibold text-primary">API Keys</span>
        </div>
        {selectedBotId && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-ghost text-xs"
          >
            <Plus size={13} />
            New Key
          </button>
        )}
      </div>

      {!selectedBotId ? (
        <EmptyState
          icon={<Key size={28} />}
          title="Select a bot"
          description="Click a bot row to manage its API keys"
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Bot context */}
          <div className="px-5 py-3 border-b border-default bg-surface">
            <div className="text-xs text-muted">Managing keys for</div>
            <div className="text-sm font-medium text-primary truncate">{selectedBotName}</div>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="px-5 py-3 border-b border-default bg-surface">
              <div className="text-xs font-medium text-muted mb-2">New API Key</div>
              <input
                className="input-field mb-2 text-xs"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs flex-1 justify-center">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="btn-primary text-xs flex-1 justify-center">
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* New key display */}
          {newKey && (
            <div className="mx-5 mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 size={12} /> New key — copy now, shown once
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] font-mono text-green-800 dark:text-green-300 break-all">{newKey}</code>
                <button onClick={() => handleCopy(newKey)} className="shrink-0">
                  {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} className="text-green-600" />}
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="text-[10px] text-green-600 dark:text-green-500 mt-1.5 hover:underline">
                I&apos;ve saved it
              </button>
            </div>
          )}

          {/* Keys list */}
          <div className="divide-y divide-default">
            {loading ? (
              <div className="px-5 py-4 text-xs text-muted">Loading…</div>
            ) : keys.length === 0 ? (
              <EmptyState
                icon={<Key size={24} />}
                title="No active keys"
                description="Create a key to allow this bot to call the API"
              />
            ) : (
              keys.map((k) => (
                <div key={k.id} className="px-5 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {k.label && <div className="text-xs font-medium text-primary">{k.label}</div>}
                      <code className="text-[11px] font-mono text-muted">{k.key_prefix}••••••••</code>
                      <div className="text-[10px] text-slate-400 mt-0.5">Created {formatDate(k.created_at)}</div>
                      {k.last_used_at && (
                        <div className="text-[10px] text-slate-400">Last used {formatDate(k.last_used_at)}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                      title="Revoke key"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
