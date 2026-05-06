import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import pool from './connection';

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS dr_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = join(__dirname, 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Bootstrap: if tracking table is empty but projects table exists without team_id
    // (i.e. migrations 001–015 already applied before runner was updated),
    // mark all existing migration files up to 015 as applied.
    const trackingCount = await client.query('SELECT COUNT(*) FROM dr_migrations');
    if (parseInt(trackingCount.rows[0].count, 10) === 0) {
      // Check if the DB is already initialised by looking for the users table
      const dbInitCheck = await client.query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
         ) AS exists`
      );
      if (dbInitCheck.rows[0].exists) {
        // Seed all migration files that already exist on disk as "applied"
        // We'll skip ones that aren't actually applied by checking a sentinel:
        // project_teams table presence = 015 ran
        const pt = await client.query(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables WHERE table_name = 'project_teams'
           ) AS exists`
        );
        if (pt.rows[0].exists) {
          // All migrations up to and including 015 were applied by old runner
          const alreadyApplied = migrationFiles.filter(f => f <= '015_project_multi_team.sql');
          for (const f of alreadyApplied) {
            await client.query(
              'INSERT INTO dr_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
              [f]
            );
          }
          console.log(`Bootstrapped dr_migrations with ${alreadyApplied.length} pre-existing migrations`);
        }
      }
    }

    // Fetch already-applied migrations
    const appliedResult = await client.query('SELECT filename FROM dr_migrations');
    const applied = new Set(appliedResult.rows.map((r: any) => r.filename));

    for (const migrationFile of migrationFiles) {
      if (applied.has(migrationFile)) {
        console.log(`Skipping migration (already applied): ${migrationFile}`);
        continue;
      }

      console.log(`Running migration: ${migrationFile}`);
      await client.query('BEGIN');
      try {
        const migrationSQL = readFileSync(join(migrationsDir, migrationFile), 'utf-8');
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO dr_migrations (filename) VALUES ($1)',
          [migrationFile]
        );
        await client.query('COMMIT');
        console.log(`Completed migration: ${migrationFile}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    // Seed default admin
    await client.query('BEGIN');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Test@123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, $4)`,
        [adminEmail, passwordHash, adminName, 'admin']
      );
      console.log(`Admin user created: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };
