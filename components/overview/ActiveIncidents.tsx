import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { formatRelativeTime, statusBgColors } from '@/lib/utils'
import type { ActiveIncident } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'

interface ActiveIncidentsProps {
  incidents: ActiveIncident[]
}

const severityConfig = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Critical' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'High' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
}

export function ActiveIncidents({ incidents }: ActiveIncidentsProps) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-default">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-orange-500" />
          <span className="text-sm font-semibold text-primary">Active Incidents</span>
          {incidents.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {incidents.length}
            </span>
          )}
        </div>
        <Link href="/incidents" className="text-xs text-blue-500 hover:text-blue-400">
          View all →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {incidents.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle size={32} />}
            title="No active incidents"
            description="All bots are running as expected"
          />
        ) : (
          <div className="divide-y divide-default">
            {incidents.map((incident) => {
              const sev = severityConfig[incident.severity]
              return (
                <div key={incident.id} className="px-5 py-3 hover:bg-surface transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${sev.bg}`}>
                      <AlertTriangle size={12} className={sev.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-primary truncate">
                          {incident.bot_name}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted truncate">{incident.issue}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{incident.client_name}</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(incident.started_at)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/runs?run=${incident.run_id}`}
                      className="shrink-0 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
