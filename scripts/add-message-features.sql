-- Add columns for edit/delete and read status on direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_for UUID[] DEFAULT '{}';
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT false;
