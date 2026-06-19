'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface ClientFilterProps {
  clients: { id: string; name: string }[]
  selectedId: string
}

export function ClientFilter({ clients, selectedId }: ClientFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(clientId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (clientId === 'all') {
      params.delete('clientId')
    } else {
      params.set('clientId', clientId)
    }
    // Reset to first page / no offset when filter changes
    params.delete('offset')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-1.5">
      <Building2 size={13} className="text-muted shrink-0" />
      <select
        className="input-field py-1 text-xs w-auto"
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="all">All Clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
