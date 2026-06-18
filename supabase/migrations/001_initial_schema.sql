-- ============================================================
-- Sentinel Bot Monitoring — Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- bots — registry of all registered Power Automate flows
-- ============================================================
create table public.bots (
  id                    uuid primary key default uuid_generate_v4(),
  client_name           text not null,
  bot_name              text not null,
  bot_type              text not null check (bot_type in ('cloud', 'desktop')),
  owner_email           text not null,
  description           text,
  tags                  text[] not null default '{}',
  schedule_type         text not null check (schedule_type in ('cron', 'fixed_times', 'manual')),
  schedule_cron         text,
  schedule_fixed_times  text,
  time_allocated_secs   integer not null default 3600,
  missed_grace_secs     integer not null default 300,
  allow_concurrent_runs boolean not null default false,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  last_event_at         timestamptz,
  created_by            uuid references auth.users(id) on delete set null
);

comment on table public.bots is 'Registry of all registered Power Automate automation bots.';
comment on column public.bots.schedule_cron is 'Cron expression (e.g. "0 9 * * 1-5") when schedule_type = cron.';
comment on column public.bots.schedule_fixed_times is 'Comma-separated UTC HH:MM times when schedule_type = fixed_times.';
comment on column public.bots.time_allocated_secs is 'Max expected duration; exceeding this without an end call triggers timeout.';
comment on column public.bots.missed_grace_secs is 'Grace window after expected start before marking a run as missed.';

-- ============================================================
-- bot_keys — API credentials issued per bot
-- Keys are shown once; only the SHA-256 hash is stored.
-- ============================================================
create table public.bot_keys (
  id           uuid primary key default uuid_generate_v4(),
  bot_id       uuid not null references public.bots(id) on delete cascade,
  key_hash     text not null unique,
  key_prefix   text not null,
  label        text,
  created_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  last_used_at timestamptz
);

comment on table public.bot_keys is 'SHA-256 hashed API keys issued to bots. Raw key shown once at creation.';
comment on column public.bot_keys.key_hash is 'SHA-256 of the raw pa_live_<32hex> key.';
comment on column public.bot_keys.key_prefix is 'First 8 characters of the raw key for identification in UI.';

-- ============================================================
-- runs — one row per bot execution instance
-- ============================================================
create table public.runs (
  id              uuid primary key default uuid_generate_v4(),
  bot_id          uuid not null references public.bots(id) on delete cascade,
  vm_name         text,
  status          text not null check (status in ('started', 'success', 'failure', 'timeout', 'missed')),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  duration_secs   real,
  summary_message text,
  client_run_id   text
);

comment on table public.runs is 'Single execution instance of a bot. Lifecycle: started → success/failure/timeout/missed.';
comment on column public.runs.client_run_id is 'Optional idempotency key from the bot to prevent duplicate /start records.';
comment on column public.runs.duration_secs is 'Computed server-side at end time; null for missed/timeout runs.';

-- ============================================================
-- run_logs — timeline checkpoints within a run
-- ============================================================
create table public.run_logs (
  id          uuid primary key default uuid_generate_v4(),
  run_id      uuid not null references public.runs(id) on delete cascade,
  log_title   text not null,
  message     text,
  level       text not null check (level in ('info', 'warning', 'error')) default 'info',
  step_index  integer,
  timestamp   timestamptz not null default now()
);

comment on table public.run_logs is 'Mid-run timeline checkpoints. Builds the step-by-step audit trail for a run.';

-- ============================================================
-- rate_limits — simple sliding-window counter (replaces Redis)
-- ============================================================
create table public.rate_limits (
  key          text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

comment on table public.rate_limits is 'Per-key sliding window rate limit counters (60 req/min).';

-- ============================================================
-- Indexes
-- ============================================================
create index idx_bots_is_active       on public.bots(is_active);
create index idx_bots_client_name     on public.bots(client_name);
create index idx_bots_last_event_at   on public.bots(last_event_at);

create index idx_bot_keys_key_hash    on public.bot_keys(key_hash);
create index idx_bot_keys_bot_id      on public.bot_keys(bot_id);

create index idx_runs_bot_id          on public.runs(bot_id);
create index idx_runs_status          on public.runs(status);
create index idx_runs_started_at      on public.runs(started_at desc);
create index idx_runs_bot_started     on public.runs(bot_id, started_at desc);

create index idx_run_logs_run_id      on public.run_logs(run_id);
create index idx_run_logs_timestamp   on public.run_logs(timestamp);
create index idx_run_logs_level       on public.run_logs(level);
