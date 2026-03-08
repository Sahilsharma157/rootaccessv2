-- Delete any existing role for this user first
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE email = 'gamedeveloper102006@gmail.com'
);

-- Insert fresh owner role using the users table (not profiles)
INSERT INTO user_roles (user_id, role, assigned_by)
SELECT u.id, 'owner', u.id
FROM users u
WHERE u.email = 'gamedeveloper102006@gmail.com';
