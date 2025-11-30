-- Create payments table for tracking transactions

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_provider VARCHAR(50) NOT NULL,
  payment_intent_id VARCHAR(255),
  subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_provider ON payments(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add check constraint for status
ALTER TABLE payments
  ADD CONSTRAINT check_payment_status
  CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled'));

-- Add check constraint for payment_provider
ALTER TABLE payments
  ADD CONSTRAINT check_payment_provider
  CHECK (payment_provider IN ('stripe', 'paypal'));

-- Create trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




