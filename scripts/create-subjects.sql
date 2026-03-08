-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create subject_techs junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS subject_techs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  tech_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, tech_id)
);

-- Create index for faster lookups
CREATE INDEX idx_subject_techs_subject_id ON subject_techs(subject_id);
CREATE INDEX idx_subject_techs_tech_id ON subject_techs(tech_id);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_techs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);

-- RLS Policies for subject_techs
CREATE POLICY "Anyone can view subject techs" ON subject_techs FOR SELECT USING (true);
