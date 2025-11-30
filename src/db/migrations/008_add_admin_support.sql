-- Add admin support to users table

-- Add is_admin column
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index on is_admin for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Set adityapandey.dev.in@gmail.com as admin if user exists
UPDATE users
SET is_admin = true
WHERE email = 'adityapandey.dev.in@gmail.com';




