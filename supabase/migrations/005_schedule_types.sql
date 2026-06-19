-- ============================================================
-- Sentinel Bot Monitoring — Extended Schedule Types
-- ============================================================
-- Adds weekly / monthly / annually schedule support.
-- The schedule_type CHECK constraint is replaced, and four new
-- nullable columns carry the extra recurrence data:
--
--   weekly   → schedule_days_of_week + schedule_time
--              e.g. days="1,3,5"  time="09:00"
--   monthly  → schedule_day_of_month + schedule_time
--              e.g. day=15  time="14:00"
--   annually → schedule_month + schedule_day_of_month + schedule_time
--              e.g. month=3  day=15  time="08:00"
--
-- Existing cron / fixed_times / manual rows are unchanged.
-- ============================================================

-- 1. Drop the old CHECK constraint (name varies by PostgreSQL version)
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM   pg_constraint c
  JOIN   pg_class      t ON t.oid = c.conrelid
  JOIN   pg_namespace  n ON n.oid = t.relnamespace
  WHERE  t.relname  = 'bots'
    AND  n.nspname  = 'public'
    AND  c.contype  = 'c'
    AND  c.conname LIKE '%schedule_type%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bots DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

-- 2. Add the new CHECK constraint that includes the three extra types
ALTER TABLE public.bots
  ADD CONSTRAINT bots_schedule_type_check
  CHECK (schedule_type IN ('cron', 'fixed_times', 'manual', 'weekly', 'monthly', 'annually'));

-- 3. New columns (all nullable — existing rows stay unchanged)
ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS schedule_days_of_week  text,        -- "1,3,5"  (ISO 1=Mon … 7=Sun)
  ADD COLUMN IF NOT EXISTS schedule_day_of_month  smallint,    -- 1–31
  ADD COLUMN IF NOT EXISTS schedule_month         smallint,    -- 1–12
  ADD COLUMN IF NOT EXISTS schedule_time          text;        -- "HH:MM" UTC single-time for weekly/monthly/annually
