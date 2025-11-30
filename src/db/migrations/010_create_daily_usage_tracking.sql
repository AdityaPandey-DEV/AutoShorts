-- Create daily_usage_tracking table for daily video generation limits (for trial users)

CREATE TABLE IF NOT EXISTS daily_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  videos_generated_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_usage_tracking_user_id ON daily_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_tracking_date ON daily_usage_tracking(user_id, date);

-- Create trigger to update updated_at
CREATE TRIGGER update_daily_usage_tracking_updated_at
  BEFORE UPDATE ON daily_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

