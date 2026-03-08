-- Remove the foreign key constraint on user_xp.community_id
ALTER TABLE user_xp DROP CONSTRAINT IF EXISTS user_xp_community_id_fkey;
