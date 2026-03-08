-- Remove the system global leaderboard community
DELETE FROM communities 
WHERE name = '[SYSTEM] Global Leaderboard' 
OR id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Make community_id nullable in user_xp for global rankings
ALTER TABLE user_xp 
ALTER COLUMN community_id DROP NOT NULL;
