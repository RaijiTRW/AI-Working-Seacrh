-- Migration: Scheduler Monitoring System
-- Creates tables for tracking scheduler job execution, volume stats, and job state

-- Table: scheduler_job_history
-- Stores execution history of all parsing jobs
CREATE TABLE IF NOT EXISTS scheduler_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(50) NOT NULL,           -- parsing_job, avito_job, verification_job
  job_name VARCHAR(100) NOT NULL,        -- Human-readable name
  status VARCHAR(20) NOT NULL,           -- completed, failed, skipped, completed_with_errors
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds FLOAT,
  stats JSONB,                           -- {parsed: X, saved: Y, errors: [...]}
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_history_job_id ON scheduler_job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_history_started ON scheduler_job_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_history_status ON scheduler_job_history(status);

-- Table: vacancy_volume_stats
-- Stores hourly vacancy counts for charting
CREATE TABLE IF NOT EXISTS vacancy_volume_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(20) NOT NULL,           -- hh, avito, superjob, platform, total
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volume_stats_recorded ON vacancy_volume_stats(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_volume_stats_source ON vacancy_volume_stats(source);

-- Table: scheduler_job_state
-- Stores paused/active state for each job
CREATE TABLE IF NOT EXISTS scheduler_job_state (
  job_id VARCHAR(50) PRIMARY KEY,        -- parsing_job, avito_job, verification_job
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  paused_by UUID,                         -- Who paused the job
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default states for all jobs
INSERT INTO scheduler_job_state (job_id, is_paused) VALUES
  ('parsing_job', false),
  ('avito_job', false),
  ('verification_job', false)
ON CONFLICT (job_id) DO NOTHING;

-- RLS Policies (admin only access)
ALTER TABLE scheduler_job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancy_volume_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_job_state ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on scheduler_job_history"
ON scheduler_job_history
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on vacancy_volume_stats"
ON vacancy_volume_stats
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on scheduler_job_state"
ON scheduler_job_state
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
