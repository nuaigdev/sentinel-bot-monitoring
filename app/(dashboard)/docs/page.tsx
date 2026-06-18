'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import {
  Key, Play, FileText, CheckCircle2, AlertCircle, Info,
  ChevronRight, Copy, Check, Zap, Lock, Clock, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group rounded-xl overflow-hidden border border-default">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-white/5">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {copied ? <><Check size={11} className="text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy size={11} /><span>Copy</span></>}
        </button>
      </div>
      <pre className="bg-[#0d1117] text-slate-300 text-xs font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  )
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/20">
      {method}
    </span>
  )
}

function ParamRow({ name, type, required, description, values }: {
  name: string; type: string; required?: boolean; description: string; values?: string
}) {
  return (
    <tr>
      <td className="py-3 pr-4 align-top">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-blue-400">{name}</code>
          {required && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-medium">required</span>}
        </div>
      </td>
      <td className="py-3 pr-4 align-top">
        <code className="text-xs text-slate-400 bg-surface px-2 py-0.5 rounded">{type}</code>
      </td>
      <td className="py-3 align-top">
        <p className="text-sm text-secondary">{description}</p>
        {values && <p className="text-xs text-muted mt-0.5">Values: <code className="text-slate-400">{values}</code></p>}
      </td>
    </tr>
  )
}

function ResponseRow({ status, description, example }: { status: string; description: string; example?: string }) {
  const isOk = status.startsWith('2')
  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl border',
      isOk ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
    )}>
      <span className={cn('font-bold text-sm font-mono shrink-0 w-10', isOk ? 'text-green-400' : 'text-red-400')}>{status}</span>
      <div className="min-w-0">
        <p className="text-sm text-primary">{description}</p>
        {example && <code className="text-xs text-muted">{example}</code>}
      </div>
    </div>
  )
}

const sections = [
  { id: 'intro',       label: 'Introduction',    icon: Info },
  { id: 'auth',        label: 'Authentication',   icon: Lock },
  { id: 'start',       label: 'POST /runs/start', icon: Play },
  { id: 'log',         label: 'POST /runs/log',   icon: FileText },
  { id: 'end',         label: 'POST /runs/end',   icon: CheckCircle2 },
  { id: 'errors',      label: 'Error Codes',      icon: AlertCircle },
  { id: 'quickstart',  label: 'Quick Start',      icon: Zap },
]

export default function DocsPage() {
  const [active, setActive] = useState('intro')

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="API Documentation" subtitle="Integrate your Power Automate flows with Sentinel in minutes" />

      <div className="flex-1 flex overflow-hidden">

        {/* Left nav */}
        <nav className="w-52 shrink-0 border-r border-default overflow-y-auto py-6 px-3 hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-3">Reference</p>
          <div className="space-y-0.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left',
                  active === id
                    ? 'bg-blue-500/10 text-blue-400 font-medium'
                    : 'text-secondary hover:text-primary hover:bg-surface'
                )}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 px-3">
            <div className="p-3 rounded-xl bg-surface border border-default">
              <p className="text-xs font-semibold text-primary mb-1">Base URL</p>
              <code className="text-[11px] text-blue-400 break-all">https://sentinel-bot-monitoring.vercel.app</code>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-16">

            {/* INTRO */}
            <section id="intro">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Info size={18} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Introduction</h2>
              </div>
              <p className="text-secondary leading-relaxed mb-4">
                Sentinel provides a simple HTTP API that your Power Automate flows call to report their execution status.
                Three endpoints are all you need: <strong className="text-primary">start</strong> a run when your flow begins,
                optionally <strong className="text-primary">log</strong> checkpoints mid-flow, and <strong className="text-primary">end</strong> the run when it finishes.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { step: '01', title: 'Register a Bot', desc: 'Create a bot in the dashboard and copy your API key.' },
                  { step: '02', title: 'Call the API', desc: 'Add three HTTP actions to your Power Automate flow.' },
                  { step: '03', title: 'Monitor', desc: 'Watch runs, logs, and incidents in the dashboard in real time.' },
                ].map((s) => (
                  <div key={s.step} className="card p-4">
                    <div className="text-2xl font-black text-blue-500/30 font-mono mb-2">{s.step}</div>
                    <div className="text-sm font-semibold text-primary mb-1">{s.title}</div>
                    <div className="text-xs text-muted leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* AUTH */}
            <section id="auth">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Lock size={18} className="text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Authentication</h2>
              </div>
              <p className="text-secondary leading-relaxed mb-4">
                All bot API endpoints require an <code className="text-blue-400 bg-surface px-1.5 py-0.5 rounded text-sm">x-bot-key</code> header.
                Keys are generated when you register a bot and are shown only once — they cannot be retrieved again, only revoked and rotated.
              </p>
              <CodeBlock lang="http" code={`POST /api/v1/runs/start HTTP/1.1
Host: sentinel-bot-monitoring.vercel.app
x-bot-key: pa_live_a1b2c3d4e5f6...
Content-Type: application/json`} />
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary mb-0.5">Keep your key secret</p>
                    <p className="text-xs text-secondary">Keys are stored as SHA-256 hashes — Sentinel cannot recover a lost key. Store it securely (e.g., Power Automate environment variables).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary mb-0.5">Rate limiting</p>
                    <p className="text-xs text-secondary">60 requests per minute per key. Exceeding this returns <code className="text-red-400">429 Too Many Requests</code>.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* START */}
            <section id="start">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Play size={18} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Start a Run</h2>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <MethodBadge method="POST" />
                <code className="text-sm text-primary font-mono">/api/v1/runs/start</code>
              </div>
              <p className="text-secondary leading-relaxed mb-6">
                Call this at the very beginning of your flow — before any business logic runs.
                Returns a <code className="text-blue-400 bg-surface px-1.5 py-0.5 rounded text-sm">run_id</code> that you must pass to all subsequent calls.
              </p>

              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Key size={14} /> Headers</h4>
              <div className="card overflow-hidden mb-6">
                <table className="w-full data-table">
                  <thead><tr><th>Header</th><th>Value</th><th>Required</th></tr></thead>
                  <tbody>
                    <tr><td><code className="text-blue-400 font-mono text-sm">x-bot-key</code></td><td className="text-secondary text-sm">Your bot API key</td><td><span className="text-red-400 text-xs font-bold">Yes</span></td></tr>
                    <tr><td><code className="text-blue-400 font-mono text-sm">Content-Type</code></td><td className="text-secondary text-sm">application/json</td><td><span className="text-red-400 text-xs font-bold">Yes</span></td></tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Hash size={14} /> Request Body</h4>
              <div className="card overflow-hidden mb-6">
                <table className="w-full data-table">
                  <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <ParamRow name="vm_name" type="string" description="Name or identifier of the machine running the flow. Useful for desktop flows." />
                    <ParamRow name="client_run_id" type="string" description="Your own unique ID for this run. If provided and a run with this ID already exists, the existing run is returned instead (idempotency)." />
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Request</p>
                  <CodeBlock lang="json" code={`{
  "vm_name": "DESKTOP-MATHER-01",
  "client_run_id": "my-flow-run-2026-001"
}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Response · 201</p>
                  <CodeBlock lang="json" code={`{
  "run_id": "a1b2c3d4-...",
  "status": "started"
}`} />
                </div>
              </div>

              <div className="space-y-2">
                <ResponseRow status="201" description="Run created. Save the run_id." />
                <ResponseRow status="200 + idempotent: true" description="run_id already exists for this client_run_id. Run returned as-is." example='{ "run_id": "...", "status": "started", "idempotent": true }' />
                <ResponseRow status="200 + warning: 409_concurrent_run_detected" description="New run created but another run is already active for this bot." />
                <ResponseRow status="401" description="Missing or invalid x-bot-key header." />
                <ResponseRow status="403" description="Bot is disabled in the dashboard." />
                <ResponseRow status="429" description="Rate limit exceeded (60 req/min)." />
              </div>
            </section>

            {/* LOG */}
            <section id="log">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText size={18} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Log a Step</h2>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <MethodBadge method="POST" />
                <code className="text-sm text-primary font-mono">/api/v1/runs/log</code>
              </div>
              <p className="text-secondary leading-relaxed mb-6">
                Optional but recommended. Call this after each significant step in your flow to build an audit-ready timeline.
                You can call this endpoint as many times as needed during a run.
              </p>

              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Hash size={14} /> Request Body</h4>
              <div className="card overflow-hidden mb-6">
                <table className="w-full data-table">
                  <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <ParamRow name="run_id" type="string" required description="The run_id returned by /runs/start." />
                    <ParamRow name="log_title" type="string" required description="Short title for this step. Shown prominently in the timeline." />
                    <ParamRow name="message" type="string" description="Longer description or details for this step (e.g., record counts, URLs, values)." />
                    <ParamRow name="level" type="string" description="Severity level. Defaults to info." values='"info" | "warning" | "error"' />
                    <ParamRow name="step_index" type="number" description="Step number. Used to order steps in the timeline when timestamps are too close." />
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Request</p>
                  <CodeBlock lang="json" code={`{
  "run_id": "a1b2c3d4-...",
  "log_title": "Records fetched from PCC",
  "message": "Retrieved 142 records",
  "level": "info",
  "step_index": 1
}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Response · 200</p>
                  <CodeBlock lang="json" code={`{
  "ok": true
}`} />
                </div>
              </div>

              <div className="space-y-2">
                <ResponseRow status="200" description="Log entry recorded." />
                <ResponseRow status="400" description="run_id or log_title missing." example='{ "error": "run_id and log_title are required" }' />
                <ResponseRow status="404" description="Run not found." />
                <ResponseRow status="403" description="Run belongs to a different bot." />
                <ResponseRow status="409" description="Run is not in started state — already ended." example={`{ "error": "Cannot log on a run with status 'success'" }`} />
              </div>
            </section>

            {/* END */}
            <section id="end">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">End a Run</h2>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <MethodBadge method="POST" />
                <code className="text-sm text-primary font-mono">/api/v1/runs/end</code>
              </div>
              <p className="text-secondary leading-relaxed mb-6">
                Call this as the final action in your flow — both on the success path and in any error/catch branches.
                If the run was already ended (e.g., timed out by Sentinel), the call is a no-op and returns the existing duration.
              </p>

              <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Hash size={14} /> Request Body</h4>
              <div className="card overflow-hidden mb-6">
                <table className="w-full data-table">
                  <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <ParamRow name="run_id" type="string" required description="The run_id returned by /runs/start." />
                    <ParamRow name="status" type="string" required description="Final outcome of the run." values='"success" | "failure"' />
                    <ParamRow name="message" type="string" description="Summary message shown in the dashboard and incident list. Required when status is failure — describe what went wrong." />
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Success request</p>
                  <CodeBlock lang="json" code={`{
  "run_id": "a1b2c3d4-...",
  "status": "success",
  "message": "142 records synced to Rexpert"
}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Failure request</p>
                  <CodeBlock lang="json" code={`{
  "run_id": "a1b2c3d4-...",
  "status": "failure",
  "message": "Connection to Rexpert timed out"
}`} />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Response · 200</p>
                <CodeBlock lang="json" code={`{
  "ok": true,
  "duration_secs": 12.4
}`} />
              </div>

              <div className="space-y-2">
                <ResponseRow status="200" description="Run ended. duration_secs is wall-clock time from start to end." />
                <ResponseRow status="200 + already_ended: true" description="Run was already ended (timeout/missed). No change made." example='{ "ok": true, "duration_secs": 3600, "already_ended": true }' />
                <ResponseRow status="400" description="run_id missing or status not success/failure." />
                <ResponseRow status="404" description="Run not found." />
              </div>
            </section>

            {/* ERRORS */}
            <section id="errors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Error Codes</h2>
              </div>
              <p className="text-secondary leading-relaxed mb-6">
                All error responses return JSON with an <code className="text-blue-400 bg-surface px-1.5 py-0.5 rounded text-sm">error</code> field describing what went wrong.
              </p>
              <div className="card overflow-hidden">
                <table className="w-full data-table">
                  <thead><tr><th>Status</th><th>Meaning</th><th>Common cause</th></tr></thead>
                  <tbody>
                    {[
                      ['400', 'Bad Request', 'Missing required fields or invalid values'],
                      ['401', 'Unauthorized', 'Missing or invalid x-bot-key header'],
                      ['403', 'Forbidden', 'Bot is disabled, or run belongs to another bot'],
                      ['404', 'Not Found', 'run_id does not exist'],
                      ['409', 'Conflict', 'Logging on an already-ended run'],
                      ['429', 'Too Many Requests', 'Rate limit exceeded (60 req/min)'],
                      ['500', 'Server Error', 'Database write failed — retry after a moment'],
                    ].map(([code, meaning, cause]) => (
                      <tr key={code}>
                        <td><code className={cn('font-mono text-sm font-bold', code.startsWith('4') ? 'text-red-400' : 'text-orange-400')}>{code}</code></td>
                        <td className="text-primary text-sm font-medium">{meaning}</td>
                        <td className="text-secondary text-sm">{cause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* QUICK START */}
            <section id="quickstart">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Zap size={18} className="text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Quick Start</h2>
              </div>
              <p className="text-secondary leading-relaxed mb-6">
                A complete example showing all three calls in sequence using <strong className="text-primary">curl</strong>.
                Replace <code className="text-blue-400 bg-surface px-1.5 py-0.5 rounded text-sm">YOUR_KEY</code> with your bot API key.
              </p>
              <CodeBlock lang="bash" code={`BASE="https://sentinel-bot-monitoring.vercel.app/api/v1"
KEY="pa_live_your_key_here"

# 1. Start the run
RUN=$(curl -s -X POST "$BASE/runs/start" \\
  -H "x-bot-key: $KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"vm_name": "my-server"}')

RUN_ID=$(echo $RUN | jq -r '.run_id')

# 2. Log a step
curl -s -X POST "$BASE/runs/log" \\
  -H "x-bot-key: $KEY" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"run_id\\": \\"$RUN_ID\\",
    \\"log_title\\": \\"Data processed\\",
    \\"message\\": \\"All records validated\\",
    \\"level\\": \\"info\\",
    \\"step_index\\": 1
  }"

# 3. End the run
curl -s -X POST "$BASE/runs/end" \\
  -H "x-bot-key: $KEY" \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"run_id\\": \\"$RUN_ID\\",
    \\"status\\": \\"success\\",
    \\"message\\": \\"Completed successfully\\"
  }"`} />

              <div className="mt-8 p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-blue-400" />
                  <span className="text-sm font-semibold text-primary">Power Automate pattern</span>
                </div>
                <ol className="space-y-2 text-sm text-secondary">
                  {[
                    'Add an HTTP action as the very first step — call /runs/start and store the run_id in a variable.',
                    'Wrap your main flow logic in a Scope. At the end of the scope, call /runs/log for each major checkpoint.',
                    'Add a Configure run after action on the scope set to "has failed".',
                    'In the failure branch, call /runs/end with status: "failure" and the error message.',
                    'In the success branch (after the scope), call /runs/end with status: "success".',
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <div className="border-t border-default pt-6 pb-4 text-center">
              <p className="text-xs text-muted">© {new Date().getFullYear()} NuAIg LLC · Sentinel v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
