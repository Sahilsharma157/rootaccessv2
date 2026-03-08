-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  CONSTRAINT poll_status_valid CHECK (status IN ('active', 'closed'))
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poll votes table (anonymous - no user_id stored, only vote hash)
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_hash VARCHAR(255) NOT NULL, -- Hash of user IP/fingerprint for anonymity
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, voter_hash) -- Prevent duplicate votes from same person
);

-- Add indexes
CREATE INDEX idx_polls_community ON polls(community_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_voter ON poll_votes(voter_hash);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone can view active polls"
  ON polls FOR SELECT
  USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Users can create polls in their communities"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS for poll options
CREATE POLICY "Anyone can view poll options"
  ON poll_options FOR SELECT
  USING (TRUE);

-- RLS for poll votes (anonymous)
CREATE POLICY "Anyone can vote anonymously"
  ON poll_votes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Can only see vote counts, not individual votes"
  ON poll_votes FOR SELECT
  USING (FALSE); -- Users can't select individual votes
