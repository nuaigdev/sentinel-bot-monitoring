-- ============================================================
-- Sentinel Bot Monitoring — Row Level Security Policies
-- ============================================================
-- Dashboard users (Supabase Auth) can read/write all data.
-- API routes use the service role key which bypasses RLS.
-- ============================================================

-- Enable RLS on all tables
alter table public.bots       enable row level security;
alter table public.bot_keys   enable row level security;
alter table public.runs       enable row level security;
alter table public.run_logs   enable row level security;
alter table public.rate_limits enable row level security;

-- ============================================================
-- bots — any authenticated dashboard user can manage all bots
-- ============================================================
create policy "Authenticated users can view all bots"
  on public.bots for select
  to authenticated
  using (true);

create policy "Authenticated users can insert bots"
  on public.bots for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update bots"
  on public.bots for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete bots"
  on public.bots for delete
  to authenticated
  using (true);

-- ============================================================
-- bot_keys — authenticated users can manage all keys
-- ============================================================
create policy "Authenticated users can view bot keys"
  on public.bot_keys for select
  to authenticated
  using (true);

create policy "Authenticated users can insert bot keys"
  on public.bot_keys for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update bot keys"
  on public.bot_keys for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete bot keys"
  on public.bot_keys for delete
  to authenticated
  using (true);

-- ============================================================
-- runs — authenticated users can view all runs
-- ============================================================
create policy "Authenticated users can view all runs"
  on public.runs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert runs"
  on public.runs for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update runs"
  on public.runs for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- run_logs — authenticated users can view all logs
-- ============================================================
create policy "Authenticated users can view all run logs"
  on public.run_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert run logs"
  on public.run_logs for insert
  to authenticated
  with check (true);

-- ============================================================
-- rate_limits — service role only (API routes bypass RLS)
-- ============================================================
create policy "Service role manages rate limits"
  on public.rate_limits for all
  to service_role
  using (true)
  with check (true);
