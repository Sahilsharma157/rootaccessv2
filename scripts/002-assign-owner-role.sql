-- Assign owner role to Ronaldo's account
INSERT INTO user_roles (user_id, role, assigned_by)
SELECT p.id, 'owner', p.id
FROM profiles p
WHERE p.email = 'gamedeveloper102006@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
