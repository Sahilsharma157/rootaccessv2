-- Projects table for opportunities posted by users
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  team_size INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Applicants for projects
CREATE TABLE IF NOT EXISTS project_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- GitHub projects cache
CREATE TABLE IF NOT EXISTS github_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_url TEXT UNIQUE NOT NULL,
  repo_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT,
  stars INT DEFAULT 0,
  language TEXT,
  topics TEXT[] DEFAULT '{}',
  cached_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Anyone can view open projects" ON projects
  FOR SELECT USING (status = 'open' OR created_by = auth.uid());

CREATE POLICY "Users can create projects in their community" ON projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for applicants
CREATE POLICY "Users can view applicants on their projects" ON project_applicants
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can apply to projects" ON project_applicants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for GitHub projects
CREATE POLICY "Anyone can view GitHub projects" ON github_projects
  FOR SELECT USING (true);
