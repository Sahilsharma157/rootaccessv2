-- Enable Supabase Realtime for direct_messages table
-- Run this in Supabase SQL Editor if realtime is not working

-- Check if table is already in publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Also enable for conversations (optional, for typing indicators later)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify it's enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
