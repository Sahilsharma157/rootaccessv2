-- Create RPC function for incrementing vote counts
CREATE OR REPLACE FUNCTION increment_vote_count(option_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;
