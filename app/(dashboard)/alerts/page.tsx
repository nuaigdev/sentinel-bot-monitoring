import { Header } from '@/components/layout/Header'
import { Bell, Slack, Mail, Webhook, Info } from 'lucide-react'

export default function AlertsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Alerts" subtitle="Configure notification channels for bot incidents" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Alert channels are coming soon.</strong> Currently, Sentinel surfaces incidents on the dashboard
            through lazy sweeps on page load. Real-time push notifications (Slack, Teams, email) will be
            available in a future release and will require enabling the scheduled sweep.
          </div>
        </div>

        {/* Planned channels */}
        <div>
          <h2 className="text-sm font-semibold text-primary mb-3">Planned Notification Channels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Slack size={24} />, name: 'Slack', desc: 'Post incident alerts to a Slack channel or DM', status: 'Planned' },
              { icon: <Mail size={24} />, name: 'Email', desc: 'Send email alerts to bot owners on failure/missed', status: 'Planned' },
              { icon: <Webhook size={24} />, name: 'Webhook', desc: 'POST a JSON payload to any HTTP endpoint', status: 'Planned' },
            ].map((ch) => (
              <div key={ch.name} className="card p-5 flex flex-col gap-3 opacity-70">
                <div className="text-slate-400 dark:text-slate-500">{ch.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-primary">{ch.name}</div>
                  <div className="text-xs text-muted mt-0.5">{ch.desc}</div>
                </div>
                <span className="self-start text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-muted">
                  {ch.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert trigger conditions */}
        <div>
          <h2 className="text-sm font-semibold text-primary mb-3">Alert Conditions (Configurable)</h2>
          <div className="card divide-y divide-default">
            {[
              { condition: 'Run ends with status: failure', severity: 'High' },
              { condition: 'Run exceeds time limit → timeout', severity: 'Medium' },
              { condition: 'Scheduled run never starts → missed', severity: 'Critical' },
              { condition: 'Concurrent run detected (policy violation)', severity: 'Medium' },
              { condition: 'Bot API key used after revocation', severity: 'High' },
            ].map((a) => (
              <div key={a.condition} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={14} className="text-muted" />
                  <span className="text-sm text-primary">{a.condition}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.severity === 'Critical' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                  a.severity === 'High' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                  'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
