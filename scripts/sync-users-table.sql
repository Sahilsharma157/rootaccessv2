-- Sync missing users from profiles to users table
-- This ensures all profile IDs exist in the users table for foreign key constraints

INSERT INTO users (id, email, username, created_at)
SELECT 
  p.id,
  p.email,
  p.username,
  p.created_at
FROM profiles p
LEFT JOIN users u ON p.id = u.id
WHERE u.id IS NULL
  AND p.id IS NOT NULL
  AND p.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
