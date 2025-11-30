-- Create flowcharts table for storing user-created automation flowcharts

CREATE TABLE IF NOT EXISTS flowcharts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  flowchart_data JSONB NOT NULL,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flowcharts_user_id ON flowcharts(user_id);
CREATE INDEX IF NOT EXISTS idx_flowcharts_created_at ON flowcharts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flowcharts_is_template ON flowcharts(is_template) WHERE is_template = true;

-- Create GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_flowcharts_data ON flowcharts USING GIN (flowchart_data);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_flowcharts_updated_at
  BEFORE UPDATE ON flowcharts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

