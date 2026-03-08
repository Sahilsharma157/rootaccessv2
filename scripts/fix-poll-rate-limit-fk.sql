-- Remove the strict foreign key constraint from poll_creation_tracker
-- This allows tracking poll creation for any user_id
ALTER TABLE public.poll_creation_tracker 
DROP CONSTRAINT IF EXISTS poll_creation_tracker_user_id_fkey;
