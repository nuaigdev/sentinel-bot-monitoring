'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Bot,
  Play,
  AlertTriangle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  BookOpen,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { label: 'Overview',  href: '/overview',  icon: LayoutDashboard },
  { label: 'Clients',   href: '/clients',   icon: Building2 },
  { label: 'Bots',      href: '/bots',      icon: Bot },
  { label: 'Runs',      href: '/runs',      icon: Play },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { label: 'Usage',     href: '/usage',     icon: BookOpen },
  { label: 'Settings',  href: '/settings',  icon: Settings },
]

interface SidebarProps {
  userEmail?: string | null
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [incidentCount, setIncidentCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('runs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['failure', 'timeout', 'missed'])
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is('acknowledged_at', null)
      .then(({ count }) => setIncidentCount(count ?? 0))
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : 'U'

  const displayName = userEmail?.split('@')[0] ?? 'User'

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-[#0B1120] border-r border-[#1e2d45] transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center px-4 h-16 border-b border-[#1e2d45]', collapsed && 'justify-center px-0')}>
        <Link href="/overview" className="flex items-center gap-3 min-w-0">
          <Image src="/logo.svg" alt="Sentinel" width={30} height={30} className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm tracking-widest">SENTINEL</div>
              <div className="text-slate-500 text-[10px] tracking-wide truncate">Bot Monitoring</div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/overview' && pathname.startsWith(href))
          const hasAlert = label === 'Incidents' && incidentCount > 0

          return (
            <Link
              key={href}
              href={href}
              className={cn('sidebar-link relative', isActive && 'active', collapsed && 'justify-center px-0')}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && hasAlert && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                  {incidentCount > 9 ? '9+' : incidentCount}
                </span>
              )}
              {collapsed && hasAlert && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section — inline expand, no absolute positioning */}
      <div className="border-t border-[#1e2d45] p-2 space-y-1" ref={userMenuRef}>
        {/* Sign-out row — visible when menu is open */}
        {userMenuOpen && (
          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400',
              'bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 transition-colors',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        )}

        {/* User button */}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
            'hover:bg-white/5',
            userMenuOpen && 'bg-white/5',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? (userEmail ?? 'Account') : undefined}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-slate-300 text-xs font-medium truncate">{displayName}</div>
                <div className="text-slate-600 text-[10px] truncate">{userEmail}</div>
              </div>
              <ChevronUp
                size={14}
                className={cn('text-slate-500 shrink-0 transition-transform duration-150', !userMenuOpen && 'rotate-180')}
              />
            </>
          )}
        </button>
      </div>

      {/* Collapse toggle — fixed to right edge of sidebar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3.5 top-[4.5rem] z-10',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'bg-[#1a2640] border border-[#2d3f5a] text-slate-400',
          'hover:bg-[#243350] hover:text-white hover:border-[#3d5478]',
          'shadow-md transition-all duration-150'
        )}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  )
}
