-- ============================================================
-- Sentinel Bot Monitoring — Clients Table + Bot FK Migration
-- ============================================================
-- Creates a dedicated clients table and migrates bots.client_name
-- to a foreign-key client_id so renaming a client is a single UPDATE.
-- Any existing bots (e.g. those seeded with client_name = 'NuAIg')
-- are picked up automatically by the INSERT … SELECT DISTINCT below.
-- ============================================================

-- 1. Clients table
CREATE TABLE public.clients (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.clients IS 'Client registry. Bots belong to a client via client_id FK.';

-- 2. RLS — same open policy as the rest of the dashboard tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all clients"
  ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON public.clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clients FOR DELETE TO authenticated USING (true);

-- 3. Seed clients from every distinct client_name already in bots
--    (e.g. 'NuAIg' and any others present in the live database)
INSERT INTO public.clients (name)
SELECT DISTINCT client_name
FROM   public.bots
WHERE  client_name IS NOT NULL AND client_name <> ''
ON CONFLICT (name) DO NOTHING;

-- 4. Add the FK column (nullable while we backfill)
ALTER TABLE public.bots
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- 5. Backfill: point every existing bot at its new clients row
UPDATE public.bots b
SET    client_id = c.id
FROM   public.clients c
WHERE  b.client_name = c.name;

-- 6. Remove the now-redundant plain-text column and its index
DROP INDEX IF EXISTS idx_bots_client_name;
ALTER TABLE public.bots DROP COLUMN client_name;

-- 7. Indexes
CREATE INDEX idx_bots_client_id ON public.bots(client_id);
CREATE INDEX idx_clients_name   ON public.clients(name);
