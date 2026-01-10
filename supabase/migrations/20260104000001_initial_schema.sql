-- QR Designer v3.0 Initial Schema Migration
-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'paid')),
  last_generated_at TIMESTAMP WITH TIME ZONE,
  total_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create QR code history table
CREATE TABLE IF NOT EXISTS qr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  design_name TEXT NOT NULL,
  design_settings JSONB NOT NULL,
  qr_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create rate limit logs table (for tracking API usage)
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_history_user_id ON qr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_history_created_at ON qr_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user_id ON rate_limit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_history_updated_at
  BEFORE UPDATE ON qr_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user subscription plans and usage statistics';
COMMENT ON TABLE qr_history IS 'Stores generated QR codes history for authenticated users';
COMMENT ON TABLE rate_limit_logs IS 'Tracks API rate limiting per user/IP';
