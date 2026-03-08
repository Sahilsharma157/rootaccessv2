-- Add vote_count column to poll_options table
ALTER TABLE public.poll_options 
ADD COLUMN vote_count INT DEFAULT 0;

-- Create or replace the increment_vote_count function
CREATE OR REPLACE FUNCTION public.increment_vote_count(option_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
