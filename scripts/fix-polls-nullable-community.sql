-- Make community_id nullable to allow global polls (not tied to any community)
ALTER TABLE polls ALTER COLUMN community_id DROP NOT NULL;

-- Update RLS policy to allow polls without communities
DROP POLICY "Users can create polls in their communities" ON polls;

CREATE POLICY "Users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() = created_by);
