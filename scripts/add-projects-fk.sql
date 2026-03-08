-- Add foreign key relationship for projects.created_by to users.id
ALTER TABLE projects
ADD CONSTRAINT projects_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;
