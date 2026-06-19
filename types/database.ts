export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      bots: {
        Row: {
          id: string
          client_id: string | null
          bot_name: string
          bot_type: 'cloud' | 'desktop'
          owner_email: string
          description: string | null
          tags: string[]
          schedule_type: 'cron' | 'fixed_times' | 'manual'
          schedule_cron: string | null
          schedule_fixed_times: string | null
          time_allocated_secs: number
          missed_grace_secs: number
          allow_concurrent_runs: boolean
          is_active: boolean
          created_at: string
          last_event_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          bot_name: string
          bot_type: 'cloud' | 'desktop'
          owner_email: string
          description?: string | null
          tags?: string[]
          schedule_type: 'cron' | 'fixed_times' | 'manual'
          schedule_cron?: string | null
          schedule_fixed_times?: string | null
          time_allocated_secs?: number
          missed_grace_secs?: number
          allow_concurrent_runs?: boolean
          is_active?: boolean
          created_at?: string
          last_event_at?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['bots']['Insert']>
      }
      bot_keys: {
        Row: {
          id: string
          bot_id: string
          key_hash: string
          key_prefix: string
          label: string | null
          created_at: string
          revoked_at: string | null
          last_used_at: string | null
        }
        Insert: {
          id?: string
          bot_id: string
          key_hash: string
          key_prefix: string
          label?: string | null
          created_at?: string
          revoked_at?: string | null
          last_used_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['bot_keys']['Insert']>
      }
      runs: {
        Row: {
          id: string
          bot_id: string
          vm_name: string | null
          status: 'started' | 'success' | 'failure' | 'timeout' | 'missed'
          started_at: string
          ended_at: string | null
          duration_secs: number | null
          summary_message: string | null
          client_run_id: string | null
          acknowledged_at: string | null
        }
        Insert: {
          id?: string
          bot_id: string
          vm_name?: string | null
          status: 'started' | 'success' | 'failure' | 'timeout' | 'missed'
          started_at?: string
          ended_at?: string | null
          duration_secs?: number | null
          summary_message?: string | null
          client_run_id?: string | null
          acknowledged_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['runs']['Insert']>
      }
      run_logs: {
        Row: {
          id: string
          run_id: string
          log_title: string
          message: string | null
          level: 'info' | 'warning' | 'error'
          step_index: number | null
          timestamp: string
        }
        Insert: {
          id?: string
          run_id: string
          log_title: string
          message?: string | null
          level?: 'info' | 'warning' | 'error'
          step_index?: number | null
          timestamp?: string
        }
        Update: Partial<Database['public']['Tables']['run_logs']['Insert']>
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: {
          key: string
          count?: number
          window_start?: string
        }
        Update: Partial<Database['public']['Tables']['rate_limits']['Insert']>
      }
    }
  }
}
