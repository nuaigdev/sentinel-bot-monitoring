'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Shield, Palette, LogOut, Save } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(user.email)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Settings" subtitle="Account preferences and platform configuration" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        {/* Account */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-primary">Account</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <div className="input-field bg-surface cursor-not-allowed text-muted">{user?.email ?? '—'}</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="btn-secondary"
            >
              {saved ? <><Save size={14} /> Reset email sent!</> : 'Send Password Reset Email'}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={15} className="text-purple-500" />
            <h2 className="text-sm font-semibold text-primary">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-primary">Theme</div>
              <div className="text-xs text-muted">Switch between light and dark mode</div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Platform info */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-green-500" />
            <h2 className="text-sm font-semibold text-primary">Platform</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted mb-0.5">Version</div>
              <div className="text-primary">Sentinel v1.0.0</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-0.5">Powered by</div>
              <div className="text-primary">Next.js + Supabase</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-0.5">Sweep Strategy</div>
              <div className="text-primary">Lazy (on page load)</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-0.5">Auth Provider</div>
              <div className="text-primary">Supabase Auth</div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-5 border-red-200 dark:border-red-900">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Sign Out</h2>
          <button onClick={handleSignOut} className="btn-danger">
            <LogOut size={14} />
            Sign out of Sentinel
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-muted pt-4 pb-2">
          © {new Date().getFullYear()} NuAIg LLC. All rights reserved. · Sentinel Bot Monitoring Platform
        </div>
      </div>
    </div>
  )
}
