'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface AcknowledgeButtonProps {
  runId: string
}

export function AcknowledgeButton({ runId }: AcknowledgeButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleResolve() {
    setLoading(true)
    try {
      await fetch(`/api/incidents/${runId}/acknowledge`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
      Resolve
    </button>
  )
}
