'use client'

import { useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  showDateRange?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
  children?: React.ReactNode
}

export function Header({ title, subtitle, showDateRange = false, onRefresh, isRefreshing, children }: HeaderProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const endDate = new Date()
  const startDate = subDays(endDate, 30)

  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-default bg-card shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {children}

        {showDateRange && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-default text-xs text-secondary">
            <Calendar size={13} />
            <span>{format(startDate, 'MMM d')} — {format(endDate, 'MMM d, yyyy')}</span>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className={cn('btn-ghost', isRefreshing && 'opacity-50 cursor-not-allowed')}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
          </button>
        )}

        {showDateRange && (
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
              autoRefresh
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'border-default text-secondary hover:bg-surface'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', autoRefresh ? 'bg-green-500' : 'bg-slate-400')} />
            Auto refresh: {autoRefresh ? 'On' : 'Off'}
          </button>
        )}

        <ThemeToggle />
      </div>
    </div>
  )
}
