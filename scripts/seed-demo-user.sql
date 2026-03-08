-- Insert demo user into users table so foreign keys work
-- The demo-user-001 string ID is not a valid UUID, so we use a proper UUID
-- and update the auth cookie logic to use this UUID

INSERT INTO users (id, username, email, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', 'prince', 'demo@rootaccess.dev', 'demo')
ON CONFLICT (id) DO NOTHING;

-- Also insert a profile for the demo user
INSERT INTO profiles (id, username, email, display_name, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'prince', 'demo@rootaccess.dev', 'Prince', 'RootAccess founder and builder')
ON CONFLICT (id) DO NOTHING;

-- Seed some sample channel messages so channels aren't empty
INSERT INTO channel_messages (channel_id, user_id, content, pinned) VALUES
  ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Need team for Hackathon - Looking for 2 more devs who know React and Web3. DM me if interested!', true),
  ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'How do you handle global state in Next.js? Context API vs Zustand vs Jotai?', false),
  ('d1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'React 19 is looking incredible! The new compiler and Server Components improvements are a game changer.', true),
  ('d1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Just shipped my first app using shadcn/ui. The component quality is unreal.', false),
  ('d1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Working on a 2D platformer with Godot. Anyone want to join for a game jam next month?', false),
  ('d1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Just released my first game on Steam! 6 months of solo dev. AMA!', true),
  ('d1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Getting started with Starknet. The Cairo language is interesting - different from Solidity but powerful.', false),
  ('d1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Just deployed my first contract on Starknet testnet! ZK rollups are the future.', true),
  ('d1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'The new GPT model benchmarks are insane. Are we reaching AGI or just better pattern matching?', false),
  ('d1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Built a RAG pipeline that actually works well. Using LangChain + Pinecone.', false)
ON CONFLICT DO NOTHING;
