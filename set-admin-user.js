require('dotenv').config();
const { Pool } = require('pg');

const ADMIN_EMAIL = 'adityapandey.dev.in@gmail.com';

async function setAdminUser() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL with your production database connection string');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log(`\n→ Setting user "${ADMIN_EMAIL}" as admin...`);

    // First, check if user exists
    const checkResult = await client.query(
      'SELECT id, email, is_admin FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (checkResult.rows.length === 0) {
      console.error(`\n✗ ERROR: User with email "${ADMIN_EMAIL}" not found in database`);
      console.error('Please ensure the user exists before setting admin privileges.');
      process.exit(1);
    }

    const user = checkResult.rows[0];
    console.log(`\nFound user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current is_admin: ${user.is_admin}`);

    if (user.is_admin === true) {
      console.log(`\n✓ User is already an admin. No changes needed.`);
      return;
    }

    // Execute the UPDATE query
    const updateResult = await client.query(
      'UPDATE users SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin',
      [ADMIN_EMAIL]
    );

    if (updateResult.rows.length === 0) {
      console.error('\n✗ ERROR: Update query did not affect any rows');
      process.exit(1);
    }

    const updatedUser = updateResult.rows[0];
    console.log(`\n✓ Successfully updated user:`);
    console.log(`  ID: ${updatedUser.id}`);
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  is_admin: ${updatedUser.is_admin}`);
    console.log(`\n✓ Admin privileges granted successfully!`);

  } catch (error) {
    console.error('\n✗ ERROR executing query:', error.message);
    if (error.code === '42P01') {
      console.error('  Database table "users" does not exist. Please run migrations first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('  Cannot connect to database. Please check your DATABASE_URL.');
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setAdminUser()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });

