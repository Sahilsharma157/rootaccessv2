-- Insert subjects
INSERT INTO subjects (name, description, icon) VALUES
  ('DevOps', 'Infrastructure automation, deployment, and system management', '⚙️'),
  ('SEPM', 'Software Engineering Project Management and team coordination', '📊'),
  ('Cloud Platform Product Engineering', 'Building products on cloud platforms like AWS, Azure, GCP', '☁️')
ON CONFLICT (name) DO NOTHING;

-- Get subject IDs
WITH subjects_data AS (
  SELECT id, name FROM subjects WHERE name IN ('DevOps', 'SEPM', 'Cloud Platform Product Engineering')
),

-- DevOps tech stack
devops_techs AS (
  SELECT (SELECT id FROM subjects_data WHERE name = 'DevOps') as subject_id, s.id as tech_id
  FROM skills s
  WHERE s.name IN ('Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Git', 'Terraform', 'Ansible', 'Linux', 'CI/CD', 'Monitoring')
),

-- SEPM tech stack
sepm_techs AS (
  SELECT (SELECT id FROM subjects_data WHERE name = 'SEPM') as subject_id, s.id as tech_id
  FROM skills s
  WHERE s.name IN ('Agile', 'Scrum', 'Jira', 'Git', 'Communication', 'Project Management', 'Documentation', 'Team Leadership')
),

-- Cloud Platform Product Engineering tech stack
cloud_techs AS (
  SELECT (SELECT id FROM subjects_data WHERE name = 'Cloud Platform Product Engineering') as subject_id, s.id as tech_id
  FROM skills s
  WHERE s.name IN ('AWS', 'Azure', 'GCP', 'Terraform', 'Docker', 'Kubernetes', 'Microservices', 'Database Design', 'APIs', 'Serverless')
)

-- Insert all relationships
INSERT INTO subject_techs (subject_id, tech_id)
SELECT subject_id, tech_id FROM devops_techs
UNION ALL
SELECT subject_id, tech_id FROM sepm_techs
UNION ALL
SELECT subject_id, tech_id FROM cloud_techs
ON CONFLICT (subject_id, tech_id) DO NOTHING;
