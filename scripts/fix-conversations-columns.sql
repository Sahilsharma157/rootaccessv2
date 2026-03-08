-- Rename conversations columns to match existing code expectations
ALTER TABLE conversations RENAME COLUMN participant_1 TO user_1_id;
ALTER TABLE conversations RENAME COLUMN participant_2 TO user_2_id;

-- Add updated_at and disappear_after columns that code expects
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS disappear_after integer;

-- Recreate index with correct column names
DROP INDEX IF EXISTS idx_conversations_participants;
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(user_1_id, user_2_id);
