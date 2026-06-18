-- Add acknowledgment column to runs table
ALTER TABLE runs ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ DEFAULT NULL;

-- Retroactively acknowledge all incidents older than 24 hours (already seen)
UPDATE runs
SET acknowledged_at = now()
WHERE status IN ('failure', 'timeout', 'missed')
  AND acknowledged_at IS NULL
  AND started_at < now() - INTERVAL '24 hours';

-- Index for fast unacknowledged incident queries
CREATE INDEX IF NOT EXISTS idx_runs_acknowledged_at ON runs (acknowledged_at) WHERE acknowledged_at IS NULL;
