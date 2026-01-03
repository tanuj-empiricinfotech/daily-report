import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
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
    
    // Create default admin user if it doesn't exist
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

