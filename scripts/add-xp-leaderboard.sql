-- XP and Leaderboard System

-- User XP tracking table
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- XP activities log
CREATE TABLE IF NOT EXISTS xp_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'post_created', 'reply_created', 'poll_voted', 'helped_user', etc.
  xp_amount INTEGER NOT NULL,
  reference_id UUID, -- ID of the post/reply/etc that triggered XP
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_xp_community ON user_xp(community_id, total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON user_xp(community_id, level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_activities_user ON xp_activities(user_id, community_id);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION get_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN 1 + (xp / 500);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_community_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Upsert user_xp
  INSERT INTO user_xp (user_id, community_id, total_xp, level)
  VALUES (p_user_id, p_community_id, p_xp_amount, get_level_from_xp(p_xp_amount))
  ON CONFLICT (user_id, community_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_xp_amount,
    level = get_level_from_xp(user_xp.total_xp + p_xp_amount),
    updated_at = NOW();

  -- Record activity
  INSERT INTO xp_activities (user_id, community_id, activity_type, xp_amount, reference_id)
  VALUES (p_user_id, p_community_id, p_activity_type, p_xp_amount, p_reference_id);

  -- Get updated values
  SELECT total_xp, level INTO v_new_xp, v_new_level
  FROM user_xp
  WHERE user_id = p_user_id AND community_id = p_community_id;

  RETURN json_build_object(
    'total_xp', v_new_xp,
    'level', v_new_level,
    'xp_added', p_xp_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_xp
CREATE POLICY "Users can view all XP in their community" ON user_xp
  FOR SELECT USING (true);

CREATE POLICY "Users can only update their own XP" ON user_xp
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for xp_activities
CREATE POLICY "Users can view activities in their community" ON xp_activities
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert activities" ON xp_activities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
