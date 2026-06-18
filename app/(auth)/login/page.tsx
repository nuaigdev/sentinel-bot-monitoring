'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Activity,
  Bell,
  Key,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Activity,
    title: 'Real-Time Run Monitoring',
    description: 'Track every bot execution with 5-state lifecycle visibility: started, success, failure, timeout, and missed.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Bell,
    title: 'Instant Incident Detection',
    description: 'Automatically surface missed runs and silent timeouts before they impact business operations.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Key,
    title: 'Secure Bot API Keys',
    description: 'GitHub-style secret key management. Keys shown once, hashed at rest. Rotate anytime without downtime.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Zap,
    title: 'Lightweight Integration',
    description: 'Three simple API calls: /start, /log, /end. Drop into any existing Power Automate flow in minutes.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-Ready Timeline',
    description: 'Step-by-step run logs build a complete audit trail — see exactly where and why each failure occurred.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
]

const stats = [
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '< 200ms', label: 'API Latency' },
  { value: '5-State', label: 'Run Lifecycle' },
  { value: 'Real-Time', label: 'Status Updates' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        })
        if (error) throw error
        setResetSent(true)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        })
        if (error) throw error
        setError('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/overview')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/5 bg-[#030712]">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Sentinel" width={32} height={32} />
          <span className="font-bold text-sm tracking-widest">SENTINEL</span>
          <span className="hidden sm:block text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
            by NuAIg
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors hidden sm:block">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors hidden sm:block">Docs</a>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex">
        {/* Left — Hero & Features (normal page scroll) */}
        <div className="flex-1 px-6 md:px-12 py-16 flex flex-col">
          {/* Hero */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Power Automate Observability Platform
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Never miss a{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                broken bot
              </span>{' '}
              again.
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Sentinel gives your team real-time visibility into every Power Automate flow —
              tracking each run from start to finish with deterministic 5-state status,
              audit-ready timelines, and instant incident surfacing.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div id="features">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
              Everything your automation team needs
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', f.bg)}>
                    <f.icon size={18} className={f.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-0.5">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div id="how-it-works" className="mt-12 max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              3-call integration
            </p>
            <div className="space-y-3">
              {[
                { step: '01', code: 'POST /api/v1/runs/start', desc: 'Before your flow logic runs' },
                { step: '02', code: 'POST /api/v1/runs/log', desc: 'Checkpoint each major step' },
                { step: '03', code: 'POST /api/v1/runs/end', desc: 'On completion or failure' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <span className="text-slate-700 font-mono text-xs w-6">{item.step}</span>
                  <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <code className="text-blue-400 text-xs font-mono">{item.code}</code>
                    <span className="text-slate-600 text-xs ml-auto hidden sm:block">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer inside scrollable left column */}
          <footer className="mt-16 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Sentinel" width={18} height={18} />
              <span>© {new Date().getFullYear()} NuAIg LLC. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <span>Sentinel v1.0</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                All systems operational
              </span>
            </div>
          </footer>
        </div>

        {/* Right — Login Form (sticky, always in viewport) */}
        <div className="w-[440px] xl:w-[480px] shrink-0 hidden lg:flex items-center justify-center p-12 border-l border-white/5 sticky top-16 h-[calc(100vh-4rem)] self-start">
          <div className="w-full max-w-sm">
            {/* Form card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'reset' ? 'Reset password' : mode === 'signup' ? 'Create account' : 'Welcome back'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {mode === 'reset'
                    ? 'Enter your email to receive a reset link'
                    : mode === 'signup'
                    ? 'Start monitoring your bots today'
                    : 'Sign in to your Sentinel workspace'}
                </p>
              </div>

              {resetSent ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 size={40} className="text-green-400 mb-3" />
                  <p className="text-white font-medium">Reset link sent!</p>
                  <p className="text-slate-500 text-sm mt-1">Check your email inbox.</p>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false) }}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-4"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@nuaig.ai"
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                  </div>

                  {mode !== 'reset' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-xs',
                      error.includes('Check your email')
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    )}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {mode === 'reset' ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    {mode === 'login' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setMode('reset')}
                          className="hover:text-slate-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="hover:text-slate-300 transition-colors"
                        >
                          Create account
                        </button>
                      </>
                    )}
                    {(mode === 'signup' || mode === 'reset') && (
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="hover:text-slate-300 transition-colors mx-auto"
                      >
                        Back to sign in
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Trust indicators */}
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck size={13} />
              <span>SOC2-ready infrastructure</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Data encrypted at rest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
