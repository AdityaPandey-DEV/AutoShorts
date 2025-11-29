import fs from 'fs';
import path from 'path';
import pool from '../db';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');

    // Get all migration files sorted by name
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.warn('No migration files found');
      return;
    }

    const client = await pool.connect();

    try {
      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get already applied migrations
      const result = await client.query('SELECT version FROM schema_migrations');
      const appliedMigrations = new Set(result.rows.map((row: any) => row.version));

      // Run each migration
      for (const file of files) {
        const version = path.basename(file, '.sql');

        if (appliedMigrations.has(version)) {
          logger.info(`Skipping migration ${version} (already applied)`);
          continue;
        }

        logger.info(`Running migration ${version}...`);
        const migrationSQL = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

        // Run migration in a transaction
        await client.query('BEGIN');
        try {
          await client.query(migrationSQL);
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [version]
          );
          await client.query('COMMIT');
          logger.info(`Migration ${version} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }

      logger.info('All migrations completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migrations finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration error:', error);
      process.exit(1);
    });
}

export { runMigrations };

