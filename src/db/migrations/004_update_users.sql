-- Update users table with authentication and subscription fields

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- Add check constraint for subscription_status
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS check_subscription_status;

ALTER TABLE users
  ADD CONSTRAINT check_subscription_status
  CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired'));

-- Add check constraint for subscription_plan
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS check_subscription_plan;

ALTER TABLE users
  ADD CONSTRAINT check_subscription_plan
  CHECK (subscription_plan IS NULL OR subscription_plan IN ('starter', 'pro', 'enterprise'));

-- Update existing users to have trial status if not set
UPDATE users
SET subscription_status = 'trial'
WHERE subscription_status IS NULL;

