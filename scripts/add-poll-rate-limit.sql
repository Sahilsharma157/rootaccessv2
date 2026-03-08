-- Add rate limiting table for poll creation
CREATE TABLE IF NOT EXISTS poll_creation_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  polls_created_today INT DEFAULT 1,
  last_reset TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_poll_creation_tracker_user_date ON poll_creation_tracker(user_id, last_reset);

-- RLS Policy: Users can only see their own rate limit
ALTER TABLE poll_creation_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own poll rate limit" ON poll_creation_tracker
  FOR SELECT USING (auth.uid() = user_id);
