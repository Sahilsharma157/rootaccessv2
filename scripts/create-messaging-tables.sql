-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  member_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create channel_messages for posts and thread replies
CREATE TABLE IF NOT EXISTS channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  content text NOT NULL,
  parent_id uuid REFERENCES channel_messages(id) ON DELETE CASCADE,
  likes integer DEFAULT 0,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table for DM tracking
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid REFERENCES users(id),
  participant_2 uuid REFERENCES users(id),
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Add conversation_id to direct_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'direct_messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE direct_messages ADD COLUMN conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create community_members join table
CREATE TABLE IF NOT EXISTS community_members (
  community_id uuid REFERENCES communities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Communities: everyone can read
CREATE POLICY "Anyone can view communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON communities FOR INSERT WITH CHECK (true);

-- Channels: everyone can read
CREATE POLICY "Anyone can view channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Community creators can create channels" ON channels FOR INSERT WITH CHECK (true);

-- Channel Messages: everyone can read, authenticated can insert
CREATE POLICY "Anyone can view channel messages" ON channel_messages FOR SELECT USING (true);
CREATE POLICY "Users can post channel messages" ON channel_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own messages" ON channel_messages FOR UPDATE USING (true);

-- Conversations: participants can read their own
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (true);

-- Community Members
CREATE POLICY "Anyone can view community members" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can leave communities" ON community_members FOR DELETE USING (true);

-- Enable Realtime for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Seed some communities and channels
INSERT INTO communities (id, name, description, member_count, category) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'React Dev', 'Building modern UIs with React', 156, 'frontend'),
  ('c1000000-0000-0000-0000-000000000002', 'Game Dev', 'Game development with Unity, Unreal, and more', 89, 'gamedev'),
  ('c1000000-0000-0000-0000-000000000003', 'Web3 Builders', 'Blockchain, DeFi, and decentralized apps', 67, 'web3'),
  ('c1000000-0000-0000-0000-000000000004', 'AI & ML', 'Artificial intelligence and machine learning', 124, 'ai')
ON CONFLICT DO NOTHING;

INSERT INTO channels (id, community_id, name) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'help'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'general'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'showcase'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'resources'),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'general'),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'unity'),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'unreal'),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002', 'pixel-art'),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003', 'general'),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 'starknet'),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003', 'solidity'),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000003', 'defi'),
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000004', 'general'),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000004', 'projects'),
  ('d1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000004', 'papers')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_parent_id ON channel_messages(parent_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_channels_community ON channels(community_id);
