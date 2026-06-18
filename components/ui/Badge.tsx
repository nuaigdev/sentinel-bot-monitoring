import { cn } from '@/lib/utils'
import type { RunStatus } from '@/types'
import { statusBgColors, getStatusLabel, statusDotColors } from '@/lib/utils'
import { Cloud, Monitor } from 'lucide-react'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: RunStatus }) {
  const variantMap: Record<RunStatus, BadgeProps['variant']> = {
    started: 'info',
    success: 'success',
    failure: 'danger',
    timeout: 'warning',
    missed: 'purple',
  }

  return (
    <Badge variant={variantMap[status]}>
      <span className={cn('status-dot', statusDotColors[status])} />
      {getStatusLabel(status)}
    </Badge>
  )
}

export function BotTypeBadge({ type }: { type: 'cloud' | 'desktop' }) {
  return (
    <Badge variant={type === 'cloud' ? 'info' : 'neutral'} className="inline-flex items-center gap-1 whitespace-nowrap">
      {type === 'cloud'
        ? <><Cloud size={11} className="shrink-0" /><span>Cloud</span></>
        : <><Monitor size={11} className="shrink-0" /><span>Desktop</span></>
      }
    </Badge>
  )
}
