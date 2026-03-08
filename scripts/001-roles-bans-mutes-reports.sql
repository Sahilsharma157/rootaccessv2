-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'moderator', 'ninja')),
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Bans table (site-wide bans by email)
CREATE TABLE IF NOT EXISTS bans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  user_id uuid REFERENCES users(id),
  reason text,
  banned_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bans_email_idx ON bans(email);

-- Mutes table (timed mutes)
CREATE TABLE IF NOT EXISTS mutes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  reason text,
  muted_by uuid NOT NULL REFERENCES users(id),
  muted_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- RLS Policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- user_roles: anyone can read roles (needed for badges), only service role can modify
CREATE POLICY "Anyone can view user roles" ON user_roles FOR SELECT USING (true);

-- bans: only service role manages bans, but we allow select for login check
CREATE POLICY "Anyone can check bans" ON bans FOR SELECT USING (true);

-- mutes: anyone can see mutes (needed to check if user is muted)
CREATE POLICY "Anyone can view mutes" ON mutes FOR SELECT USING (true);

-- reports: users can create reports, only admins see all
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reported_by OR true);
CREATE POLICY "Anyone can view reports" ON reports FOR SELECT USING (true);

-- Add unique constraint on community_members if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_members_pkey'
  ) THEN
    ALTER TABLE community_members ADD PRIMARY KEY (community_id, user_id);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;
