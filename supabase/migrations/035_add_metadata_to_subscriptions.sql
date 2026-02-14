-- Add metadata column to user_subscriptions for auto-renewal tracking
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON user_subscriptions(expires_at);
