-- Enable pgcrypto if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean up any existing demo user data
DELETE FROM channel_messages WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM community_members WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM direct_messages WHERE sender_id = '00000000-0000-0000-0000-000000000001' OR receiver_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM conversations WHERE user_1_id = '00000000-0000-0000-0000-000000000001' OR user_2_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insert demo user with password_hash computed by PostgreSQL
-- The hash matches: SHA-256 hex of "demo123"
INSERT INTO users (id, username, email, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'prince',
  'demo@rootaccess.dev',
  encode(digest('demo123', 'sha256'), 'hex')
);

INSERT INTO profiles (id, username, email, display_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'prince',
  'demo@rootaccess.dev',
  'prince'
) ON CONFLICT (id) DO NOTHING;

-- Seed channel messages
INSERT INTO channel_messages (channel_id, user_id, content) VALUES
  ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Anyone know how to fix hydration errors in React 19?'),
  ('d1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Welcome to the React Dev general channel!'),
  ('d1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Working on a 2D platformer with Unity'),
  ('d1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Anyone building on StarkNet?'),
  ('d1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Just started training a transformer model')
ON CONFLICT DO NOTHING;
