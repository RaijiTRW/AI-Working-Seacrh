-- Create table for tracking auto-renewal retry attempts
CREATE TABLE IF NOT EXISTS renewal_attempts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  retry_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_renewal_attempts_user ON renewal_attempts(user_id);
