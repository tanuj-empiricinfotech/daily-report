import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection';

async function runMigrations() {
  const client = await pool.connect();
  try {
    const migrationFile = readFileSync(
      join(__dirname, 'migrations', '001_init_schema.sql'),
      'utf-8'
    );
    
    await client.query('BEGIN');
    await client.query(migrationFile);
    await client.query('COMMIT');
    
    console.log('Migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };

