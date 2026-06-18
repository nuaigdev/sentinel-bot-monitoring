import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import type { RunStatus, LogLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'Never'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM d, yyyy HH:mm')
  } catch {
    return '—'
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export function formatAllocatedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${(seconds / 3600).toFixed(1)} hr`
}

export const statusColors: Record<RunStatus, string> = {
  started: 'text-blue-500',
  success: 'text-green-500',
  failure: 'text-red-500',
  timeout: 'text-orange-500',
  missed: 'text-purple-500',
}

export const statusBgColors: Record<RunStatus, string> = {
  started: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failure: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  timeout: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  missed: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

export const statusDotColors: Record<RunStatus, string> = {
  started: 'bg-blue-500',
  success: 'bg-green-500',
  failure: 'bg-red-500',
  timeout: 'bg-orange-500',
  missed: 'bg-purple-500',
}

export const levelColors: Record<LogLevel, string> = {
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
}

export const levelBgColors: Record<LogLevel, string> = {
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function getStatusLabel(status: RunStatus): string {
  const labels: Record<RunStatus, string> = {
    started: 'Running',
    success: 'Success',
    failure: 'Failed',
    timeout: 'Timeout',
    missed: 'Missed',
  }
  return labels[status]
}

export function computeHealthScore(successCount: number, totalCount: number): number {
  if (totalCount === 0) return 100
  return Math.round((successCount / totalCount) * 100)
}

export function generateNextRun(bot: { schedule_type: string; schedule_cron?: string | null; schedule_fixed_times?: string | null }): Date | null {
  if (bot.schedule_type === 'manual') return null
  const now = new Date()
  if (bot.schedule_type === 'fixed_times' && bot.schedule_fixed_times) {
    const times = bot.schedule_fixed_times.split(',').map((t) => t.trim())
    for (const time of times) {
      const [h, m] = time.split(':').map(Number)
      const next = new Date(now)
      next.setUTCHours(h, m, 0, 0)
      if (next > now) return next
    }
    const [h, m] = times[0].split(':').map(Number)
    const next = new Date(now)
    next.setUTCDate(next.getUTCDate() + 1)
    next.setUTCHours(h, m, 0, 0)
    return next
  }
  return null
}
