import type { Database } from './database'

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']

export type Bot = Database['public']['Tables']['bots']['Row']
export type BotInsert = Database['public']['Tables']['bots']['Insert']
export type BotUpdate = Database['public']['Tables']['bots']['Update']

export type BotKey = Database['public']['Tables']['bot_keys']['Row']
export type BotKeyInsert = Database['public']['Tables']['bot_keys']['Insert']

export type Run = Database['public']['Tables']['runs']['Row']
export type RunInsert = Database['public']['Tables']['runs']['Insert']
export type RunUpdate = Database['public']['Tables']['runs']['Update']

export type RunLog = Database['public']['Tables']['run_logs']['Row']
export type RunLogInsert = Database['public']['Tables']['run_logs']['Insert']

export type RunStatus = Run['status']
export type BotType = Bot['bot_type']
export type ScheduleType = 'cron' | 'fixed_times' | 'manual' | 'weekly' | 'monthly' | 'annually'
export type LogLevel = RunLog['level']

export type TimeScope = '24h' | '7d' | '30d' | '1y'

/** Bot row joined with its parent client. Used everywhere a client name is displayed. */
export interface BotWithClient extends Bot {
  clients: Pick<Client, 'id' | 'name'> | null
}

export interface BotWithStats extends BotWithClient {
  total_runs: number
  success_runs: number
  failure_runs: number
  timeout_runs: number
  missed_runs: number
  success_rate: number
  last_run?: Run | null
  active_run?: Run | null
}

/** Client with its associated bots (used on the Clients management page). */
export interface ClientWithBots extends Client {
  bots: BotWithStats[]
}

export interface RunWithBot extends Run {
  bot: BotWithClient
}

export interface RunWithLogs extends Run {
  run_logs: RunLog[]
  bot: BotWithClient
}

export interface OverviewStats {
  total_bots: number
  active_bots: number
  currently_running: number
  failed_24h: number
  passed_24h: number
  timeouts_24h: number
  missed_24h: number
  health_score: number
}

export interface DashboardActivity {
  id: string
  bot_name: string
  client_name: string
  event: string
  status: RunStatus
  time: string
}

export interface BotDayStatus {
  date: string
  status: 'success' | 'failure' | 'timeout' | 'missed' | 'no_run'
  run_id?: string
}

export interface BotRunDot {
  id: string
  status: 'success' | 'failure' | 'timeout' | 'missed'
  started_at: string
}

export interface BotCalendarRow {
  bot: BotWithClient
  runs: BotRunDot[]
}

export interface ActiveIncident {
  id: string
  bot_name: string
  client_name: string
  issue: string
  severity: 'critical' | 'high' | 'medium'
  status: RunStatus
  started_at: string
  run_id: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status?: number
}
