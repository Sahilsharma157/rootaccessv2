INSERT INTO users (username, email, password)
VALUES ('testadmin', 'test@rootaccess.dev', 'Test@1234')
ON CONFLICT (email) DO NOTHING;
