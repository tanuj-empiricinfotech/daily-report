import pool from './connection';
import { runMigrations } from './runMigrations';

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('Dropping all tables...');
    
    // Drop tables in reverse order of dependencies
    await client.query('DROP TABLE IF EXISTS daily_logs CASCADE');
    await client.query('DROP TABLE IF EXISTS project_assignments CASCADE');
    await client.query('DROP TABLE IF EXISTS projects CASCADE');
    await client.query('DROP TABLE IF EXISTS team_members CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('DROP TABLE IF EXISTS teams CASCADE');
    
    // Drop function and triggers if they exist
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  } finally {
    client.release();
  }
  
  // Run migrations to recreate the schema (this will also create admin user)
  console.log('Running migrations...');
  await runMigrations();
  
  console.log('Database reset completed successfully');
}

if (require.main === module) {
  resetDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { resetDatabase };
