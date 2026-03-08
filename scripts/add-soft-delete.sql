-- Add soft delete columns to channel_messages
ALTER TABLE channel_messages
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id) DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_channel_messages_deleted_at ON channel_messages(deleted_at, channel_id)
WHERE deleted_at IS NULL;

-- Create index for finding all deleted messages by admin (audit trail)
CREATE INDEX IF NOT EXISTS idx_channel_messages_deleted_by ON channel_messages(deleted_by, deleted_at)
WHERE deleted_at IS NOT NULL;
