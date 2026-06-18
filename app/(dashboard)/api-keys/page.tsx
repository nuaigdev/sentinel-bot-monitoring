import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Key, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const supabase = await createClient()

  const { data: rawKeys } = await supabase
    .from('bot_keys')
    .select('*, bots!inner(bot_name, client_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  type KeyRow = {
    id: string; bot_id: string; key_prefix: string; label: string | null
    created_at: string; revoked_at: string | null; last_used_at: string | null
    bots: { bot_name: string; client_name: string }
  }
  const keys = (rawKeys ?? []) as unknown as KeyRow[]
  const activeKeys = keys.filter((k) => !k.revoked_at)
  const revokedKeys = keys.filter((k) => k.revoked_at)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="API Keys" subtitle="All bot API keys across the platform" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            API keys use SHA-256 hashing. The raw key is shown once at creation and never stored.
            To rotate a key, revoke the old one and create a new one from the Bots page.
          </div>
        </div>

        {/* Active keys */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-default flex items-center gap-2">
            <Key size={14} className="text-green-500" />
            <span className="text-sm font-semibold text-primary">Active Keys ({activeKeys.length})</span>
          </div>
          {activeKeys.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No active API keys</div>
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Bot</th>
                  <th>Client</th>
                  <th>Label</th>
                  <th>Key Prefix</th>
                  <th>Created</th>
                  <th>Last Used</th>
                </tr>
              </thead>
              <tbody>
                {activeKeys.map((k) => {
                  const bot = k.bots as { bot_name: string; client_name: string }
                  return (
                    <tr key={k.id}>
                      <td className="font-medium text-primary">{bot.bot_name}</td>
                      <td className="text-secondary">{bot.client_name}</td>
                      <td className="text-secondary">{k.label ?? '—'}</td>
                      <td><code className="text-xs font-mono text-muted">{k.key_prefix}••••••••</code></td>
                      <td className="text-secondary text-xs">{formatDate(k.created_at)}</td>
                      <td className="text-secondary text-xs">{k.last_used_at ? formatRelativeTime(k.last_used_at) : 'Never'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-default flex items-center gap-2">
              <Key size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-muted">Revoked Keys ({revokedKeys.length})</span>
            </div>
            <table className="w-full data-table opacity-60">
              <thead>
                <tr>
                  <th>Bot</th>
                  <th>Key Prefix</th>
                  <th>Created</th>
                  <th>Revoked</th>
                </tr>
              </thead>
              <tbody>
                {revokedKeys.map((k) => {
                  const bot = k.bots as { bot_name: string; client_name: string }
                  return (
                    <tr key={k.id}>
                      <td className="font-medium text-primary line-through">{bot.bot_name}</td>
                      <td><code className="text-xs font-mono text-muted">{k.key_prefix}••••••••</code></td>
                      <td className="text-muted text-xs">{formatDate(k.created_at)}</td>
                      <td className="text-red-400 text-xs">{formatDate(k.revoked_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
