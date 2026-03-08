-- Create a global community for the leaderboard (run only once)
INSERT INTO communities (id, name, description, created_by, created_at, member_count)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  '[SYSTEM] Global Leaderboard',
  'Global XP and leaderboard system',
  id,
  NOW(),
  0
FROM profiles
WHERE username = 'system' OR email LIKE '%@rootaccess%' OR id != '00000000-0000-0000-0000-000000000000'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Fallback: If no user found, allow community creation by setting created_by to any existing user
-- This will be executed if the above fails
INSERT INTO communities (id, name, description, created_by, created_at, member_count)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  '[SYSTEM] Global Leaderboard',
  'Global XP and leaderboard system',
  (SELECT id FROM profiles LIMIT 1),
  NOW(),
  0
WHERE NOT EXISTS (SELECT 1 FROM communities WHERE id = '00000000-0000-0000-0000-000000000000'::uuid)
ON CONFLICT (id) DO NOTHING;
