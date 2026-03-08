-- Fix missing foreign keys on conversations table
-- The conversations table has user_1_id and user_2_id but no FK to users

-- Drop constraints if they exist (to be safe)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_1_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_2_id_fkey;

-- Add proper foreign keys
ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_1_id_fkey FOREIGN KEY (user_1_id) REFERENCES users(id);

ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_2_id_fkey FOREIGN KEY (user_2_id) REFERENCES users(id);

-- Also fix direct_messages FKs
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_conversation_id_fkey;
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_receiver_id_fkey;

ALTER TABLE direct_messages
  ADD CONSTRAINT direct_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE direct_messages
  ADD CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id);

ALTER TABLE direct_messages
  ADD CONSTRAINT direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id);

-- Fix channel_messages FK
ALTER TABLE channel_messages DROP CONSTRAINT IF EXISTS channel_messages_user_id_fkey;
ALTER TABLE channel_messages DROP CONSTRAINT IF EXISTS channel_messages_channel_id_fkey;

ALTER TABLE channel_messages
  ADD CONSTRAINT channel_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE channel_messages
  ADD CONSTRAINT channel_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;

-- Ensure realtime is enabled on conversations and direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
