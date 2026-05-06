-- Create project_teams junction table (projects can belong to multiple teams)
CREATE TABLE IF NOT EXISTS project_teams (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(project_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_team_id ON project_teams(team_id);

-- Migrate existing single-team associations
INSERT INTO project_teams (project_id, team_id)
SELECT id, team_id FROM projects WHERE team_id IS NOT NULL;

-- Drop team_id from projects (associations now live in project_teams)
ALTER TABLE projects DROP COLUMN team_id;
