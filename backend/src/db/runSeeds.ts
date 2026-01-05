import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import pool from './connection';

async function runSeeds() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get admin credentials from environment variables (same as migrations)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Test@123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Get member default password (can be overridden via env var)
    const memberPassword = process.env.MEMBER_PASSWORD || 'Test@123';

    // Generate password hashes
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const memberPasswordHash = await bcrypt.hash(memberPassword, 10);

    // Get all seed files and sort them
    const seedsDir = join(__dirname, 'seeds');
    const seedFiles = readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sorts alphabetically (001_, 002_, etc.)

    if (seedFiles.length === 0) {
      console.log('No seed files found');
      await client.query('COMMIT');
      return;
    }

    // Run each seed file sequentially
    for (const seedFile of seedFiles) {
      console.log(`Running seed: ${seedFile}`);
      let seedSQL = readFileSync(
        join(seedsDir, seedFile),
        'utf-8'
      );

      // Replace placeholders with actual values
      seedSQL = seedSQL.replace(/\{\{ADMIN_EMAIL\}\}/g, adminEmail);
      seedSQL = seedSQL.replace(/\{\{ADMIN_PASSWORD_HASH\}\}/g, adminPasswordHash);
      seedSQL = seedSQL.replace(/\{\{ADMIN_NAME\}\}/g, adminName);
      seedSQL = seedSQL.replace(/\{\{MEMBER_PASSWORD_HASH\}\}/g, memberPasswordHash);

      await client.query(seedSQL);
      console.log(`Completed seed: ${seedFile}`);
    }

    await client.query('COMMIT');

    console.log('All seeds completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runSeeds };
