-- Fix user_roles to have user_id as sole primary key (one role per user)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE user_roles ADD PRIMARY KEY (user_id);

-- Add resolved fields to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- Update reports status check to include 'banned'
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed', 'banned'));

-- Add unique constraint on mutes(user_id) for upsert
CREATE UNIQUE INDEX IF NOT EXISTS mutes_user_id_idx ON mutes(user_id);
