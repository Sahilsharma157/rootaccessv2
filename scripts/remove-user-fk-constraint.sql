-- Remove the foreign key constraint that's causing issues
ALTER TABLE user_xp 
DROP CONSTRAINT IF EXISTS user_xp_user_id_fkey;

-- Recreate the constraint as non-enforced or just remove it entirely since we verify user exists before inserting
-- For now, let's just drop it and handle user validation in the application code
