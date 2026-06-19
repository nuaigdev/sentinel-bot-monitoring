'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeScope } from '@/types'

interface OverviewFiltersBarProps {
  clients: { id: string; name: string }[]
  scope: TimeScope
  offset: number
  clientId: string
  fullLabel: string
}

const scopes: { value: TimeScope; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
  { value: '1y',  label: '1Y'  },
]

export function OverviewFiltersBar({
  clients,
  scope,
  offset,
  clientId,
  fullLabel,
}: OverviewFiltersBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(updates: Partial<{ scope: TimeScope; offset: number; clientId: string }>) {
    const next = {
      scope,
      offset,
      clientId,
      ...updates,
    }
    const params = new URLSearchParams()
    if (next.scope !== '24h') params.set('scope', next.scope)
    if (next.offset > 0) params.set('offset', String(next.offset))
    if (next.clientId !== 'all') params.set('clientId', next.clientId)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-default bg-card shrink-0 flex-wrap">
      {/* Client filter */}
      {clients.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Building2 size={13} className="text-muted" />
          <select
            className="input-field py-1 text-xs w-auto"
            value={clientId}
            onChange={(e) => navigate({ clientId: e.target.value, offset: 0 })}
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Divider */}
      {clients.length > 0 && <div className="h-4 w-px bg-default shrink-0" />}

      {/* Scope tabs */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
        {scopes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => navigate({ scope: value, offset: 0 })}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              scope === value
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate({ offset: offset + 1 })}
          className="btn-ghost p-1.5 rounded-lg"
          title="Previous period"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-secondary min-w-[160px] text-center px-1">{fullLabel}</span>
        <button
          onClick={() => navigate({ offset: Math.max(0, offset - 1) })}
          disabled={offset === 0}
          className="btn-ghost p-1.5 rounded-lg disabled:opacity-30"
          title="Next period"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
