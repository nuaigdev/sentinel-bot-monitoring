'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Copy, CheckCircle2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BotFormData {
  client_id: string
  bot_name: string
  bot_type: 'cloud' | 'desktop'
  owner_email: string
  description: string
  schedule_type: 'cron' | 'fixed_times' | 'manual'
  schedule_cron: string
  schedule_fixed_times: string
  time_allocated_secs: number
  missed_grace_secs: number
  allow_concurrent_runs: boolean
}

const emptyForm: BotFormData = {
  client_id: '',
  bot_name: '',
  bot_type: 'cloud',
  owner_email: '',
  description: '',
  schedule_type: 'manual',
  schedule_cron: '',
  schedule_fixed_times: '',
  time_allocated_secs: 3600,
  missed_grace_secs: 300,
  allow_concurrent_runs: false,
}

interface ClientOption { id: string; name: string }

interface BotRegistrationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (botId: string, rawKey: string, botName: string) => void
}

export function BotRegistrationModal({ open, onClose, onSuccess }: BotRegistrationModalProps) {
  const [step, setStep] = useState<'form' | 'key'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState('')
  const [createdBotName, setCreatedBotName] = useState('')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState<BotFormData>(emptyForm)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [newClientMode, setNewClientMode] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [creatingClient, setCreatingClient] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/v1/clients')
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {})
  }, [open])

  const update = (field: keyof BotFormData, value: string | number | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleCreateClient = async () => {
    const name = newClientName.trim()
    if (!name) return
    setCreatingClient(true)
    try {
      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create client'); return }
      const newClient = data.client as ClientOption
      setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
      setForm((f) => ({ ...f, client_id: newClient.id }))
      setNewClientMode(false)
      setNewClientName('')
    } finally {
      setCreatingClient(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register bot')
      setCreatedKey(data.raw_key)
      setCreatedBotName(form.bot_name)
      setStep('key')
      onSuccess(data.bot_id, data.raw_key, form.bot_name)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setStep('form')
    setCreatedKey('')
    setError(null)
    setForm(emptyForm)
    setNewClientMode(false)
    setNewClientName('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'form' ? 'Register New Bot' : 'Bot API Key'}
      description={step === 'form' ? 'Add a new Power Automate flow to Sentinel monitoring' : 'Copy this key now — it will not be shown again'}
      size="xl"
    >
      {step === 'key' ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            <div>
              <div className="text-sm font-medium text-green-800 dark:text-green-300">
                {createdBotName} registered successfully
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">Use this API key in your Power Automate flow</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">API Key (shown once)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-lg bg-surface border border-default text-sm font-mono text-primary break-all">
                {createdKey}
              </code>
              <button onClick={handleCopy} className="btn-secondary shrink-0 px-3">
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              ⚠ Store this key securely. It cannot be recovered — only revoked and rotated.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-default text-xs font-mono text-muted space-y-1">
            <div className="text-xs font-sans font-medium text-primary mb-2">Usage in Power Automate HTTP action:</div>
            <div><span className="text-blue-500">Header:</span> x-bot-key: {createdKey}</div>
            <div><span className="text-blue-500">Start:</span> POST /api/v1/runs/start</div>
            <div><span className="text-blue-500">Log:</span> POST /api/v1/runs/log</div>
            <div><span className="text-blue-500">End:</span> POST /api/v1/runs/end</div>
          </div>

          <button onClick={handleClose} className="btn-primary w-full justify-center">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Client selector */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Client *</label>
              {newClientMode ? (
                <div className="flex items-center gap-1.5">
                  <input
                    className="input-field flex-1"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="New client name"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateClient())}
                  />
                  <button
                    type="button"
                    className="btn-primary shrink-0 px-2"
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientName.trim()}
                  >
                    {creatingClient ? '…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary shrink-0 px-2"
                    onClick={() => { setNewClientMode(false); setNewClientName('') }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <select
                    className="input-field flex-1"
                    value={form.client_id}
                    onChange={(e) => update('client_id', e.target.value)}
                    required
                  >
                    <option value="">— Select client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary shrink-0 px-2"
                    onClick={() => setNewClientMode(true)}
                    title="Create new client"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Bot Name *</label>
              <input
                className="input-field"
                value={form.bot_name}
                onChange={(e) => update('bot_name', e.target.value)}
                placeholder="e.g. PCC_to_Rexpert_Billing"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Bot Type *</label>
              <select className="input-field" value={form.bot_type} onChange={(e) => update('bot_type', e.target.value)}>
                <option value="cloud">Cloud Flow</option>
                <option value="desktop">Desktop Flow</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Owner Email *</label>
              <input
                className="input-field"
                type="email"
                value={form.owner_email}
                onChange={(e) => update('owner_email', e.target.value)}
                placeholder="owner@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What does this bot do?"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Schedule Type *</label>
              <select className="input-field" value={form.schedule_type} onChange={(e) => update('schedule_type', e.target.value)}>
                <option value="manual">Manual (no schedule)</option>
                <option value="cron">Cron</option>
                <option value="fixed_times">Fixed Times (UTC)</option>
              </select>
            </div>
            {form.schedule_type === 'cron' && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted mb-1">Cron Expression</label>
                <input
                  className="input-field font-mono"
                  value={form.schedule_cron}
                  onChange={(e) => update('schedule_cron', e.target.value)}
                  placeholder="0 9 * * 1-5"
                />
              </div>
            )}
            {form.schedule_type === 'fixed_times' && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted mb-1">Fixed Times (UTC, comma-separated)</label>
                <input
                  className="input-field font-mono"
                  value={form.schedule_fixed_times}
                  onChange={(e) => update('schedule_fixed_times', e.target.value)}
                  placeholder="09:00, 14:00, 18:30"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Time Limit (seconds)</label>
              <input
                className="input-field"
                type="number"
                min={60}
                value={form.time_allocated_secs}
                onChange={(e) => update('time_allocated_secs', parseInt(e.target.value))}
              />
              <span className="text-[10px] text-muted">{Math.round(form.time_allocated_secs / 60)} min</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Grace Period (seconds)</label>
              <input
                className="input-field"
                type="number"
                min={0}
                value={form.missed_grace_secs}
                onChange={(e) => update('missed_grace_secs', parseInt(e.target.value))}
              />
              <span className="text-[10px] text-muted">{form.missed_grace_secs / 60} min before marking missed</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="concurrent"
              checked={form.allow_concurrent_runs}
              onChange={(e) => update('allow_concurrent_runs', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="concurrent" className="text-xs text-secondary">
              Allow concurrent runs (default: false — new run while one is active triggers a 409 flag)
            </label>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Registering…' : 'Register Bot & Generate Key'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
