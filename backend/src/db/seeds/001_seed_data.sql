-- Seed Data: Admin User, MERN Team, Team Members, and Projects
-- This seed file creates initial data for the application
-- Uses placeholders {{ADMIN_EMAIL}}, {{ADMIN_PASSWORD_HASH}}, {{ADMIN_NAME}}, {{MEMBER_PASSWORD_HASH}} which will be replaced by the seed runner

-- Step 1: Create or get admin user
-- Note: Placeholders will be replaced by runSeeds.ts
WITH admin_user AS (
  INSERT INTO users (email, password_hash, name, role)
  VALUES (
    '{{ADMIN_EMAIL}}',
    '{{ADMIN_PASSWORD_HASH}}',
    '{{ADMIN_NAME}}',
    'admin'
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role
  RETURNING id
)
-- Step 2: Create or get MERN team
, mern_team AS (
  INSERT INTO teams (name, description, created_by)
  SELECT 
    'MERN',
    'MERN Stack Development Team',
    admin_user.id
  FROM admin_user
  WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'MERN')
  RETURNING id
)
-- Get team ID (either newly created or existing)
, team_result AS (
  SELECT id FROM mern_team
  UNION ALL
  SELECT id FROM teams WHERE name = 'MERN' AND NOT EXISTS (SELECT 1 FROM mern_team)
  LIMIT 1
)
-- Step 3: Assign admin to team (via team_id on users table)
, admin_team_assignment AS (
  UPDATE users
  SET team_id = (SELECT id FROM team_result)
  WHERE email = '{{ADMIN_EMAIL}}'
    AND team_id IS NULL
)
-- Step 4: Create team members
, team_members_data AS (
  SELECT * FROM (VALUES
    ('vansita.g@empiricinfotech.com', 'Vansita Gajjar'),
    ('sahid.m@empiricinfotech.com', 'Sahid Midda'),
    ('sahil.kp@empiricinfotech.com', 'Sahil Kapadia'),
    ('yash.g@empiricinfotech.com', 'Yash Guard'),
    ('parthd@empiricinfotech.com', 'Parth Degama'),
    ('keyur.empiric@gmail.com', 'Keyur Javiya'),
    ('saurav.h@empiricinfotech.com', 'Saurav Hadiya'),
    ('harshit.y@empiricinfotech.com', 'Harshit Yadav'),
    ('jenil.k@empiricinfotech.com', 'Jenil Kakadiya'),
    ('smit.g@empiricinfotech.com', 'Smith Gadhiya'),
    ('om.b@empiricinfotech.com', 'Om Bhanderi')
  ) AS t(email, name)
)
, created_team_members AS (
  INSERT INTO users (email, password_hash, name, role, team_id)
  SELECT 
    tmd.email,
    '{{MEMBER_PASSWORD_HASH}}',
    tmd.name,
    'member',
    (SELECT id FROM team_result)
  FROM team_members_data tmd
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id
  RETURNING id, email
)
-- Step 5: Create projects
, projects_data AS (
  SELECT * FROM (VALUES
    ('PMS - Chuck'),
    ('AssistAI - Gurpal'),
    ('PatientPulse - Gurpal'),
    ('Trisor'),
    ('Engage - Nagarajan'),
    ('EndoDNA - Eric'),
    ('VibeCode - Roee')
  ) AS t(project_name)
)
, created_projects AS (
  INSERT INTO projects (team_id, name, description, created_by)
  SELECT 
    (SELECT id FROM team_result),
    pd.project_name,
    NULL,
    (SELECT id FROM admin_user)
  FROM projects_data pd
  WHERE NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE name = pd.project_name 
    AND team_id = (SELECT id FROM team_result)
  )
  RETURNING id, name
)
-- Step 6: Assign admin to all projects (both newly created and existing)
, all_projects AS (
  SELECT id FROM projects 
  WHERE team_id = (SELECT id FROM team_result)
)
, project_assignments AS (
  INSERT INTO project_assignments (project_id, user_id)
  SELECT 
    ap.id,
    (SELECT id FROM admin_user)
  FROM all_projects ap
  ON CONFLICT (project_id, user_id) DO NOTHING
)
SELECT 
  (SELECT COUNT(*) FROM admin_user) as admin_processed,
  (SELECT COUNT(*) FROM team_result) as team_processed,
  (SELECT COUNT(*) FROM created_team_members) as team_members_processed,
  (SELECT COUNT(*) FROM all_projects) as projects_processed;
