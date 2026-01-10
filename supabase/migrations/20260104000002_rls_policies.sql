-- QR Designer v3.0 Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- user_profiles RLS Policies
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile (for initial signup)
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role has full access to user_profiles"
ON user_profiles
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- qr_history RLS Policies
-- ========================================

-- Users can view their own QR history
CREATE POLICY "Users can view own QR history"
ON qr_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert to their own QR history
CREATE POLICY "Users can insert own QR history"
ON qr_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own QR history
CREATE POLICY "Users can update own QR history"
ON qr_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own QR history
CREATE POLICY "Users can delete own QR history"
ON qr_history
FOR DELETE
USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to qr_history"
ON qr_history
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- rate_limit_logs RLS Policies
-- ========================================

-- Users can view their own rate limit logs
CREATE POLICY "Users can view own rate limit logs"
ON rate_limit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert rate limit logs
CREATE POLICY "Service role can insert rate limit logs"
ON rate_limit_logs
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Service role has full access
CREATE POLICY "Service role has full access to rate_limit_logs"
ON rate_limit_logs
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- Helper Functions for Rate Limiting
-- ========================================

-- Function to check if user can generate QR (rate limit check)
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_type TEXT;
  v_last_generated TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user plan and last generation time
  SELECT plan_type, last_generated_at
  INTO v_plan_type, v_last_generated
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, create one (first time user)
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, plan_type, total_generated)
    VALUES (p_user_id, 'free', 0);
    RETURN TRUE;
  END IF;

  -- Paid users have unlimited access
  IF v_plan_type = 'paid' THEN
    RETURN TRUE;
  END IF;

  -- Free users: check if 1 week has passed since last generation
  IF v_last_generated IS NULL THEN
    RETURN TRUE;
  END IF;

  IF (NOW() - v_last_generated) >= INTERVAL '7 days' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record QR generation
CREATE OR REPLACE FUNCTION record_qr_generation(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_generated_at = NOW(),
    total_generated = total_generated + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, last_generated_at, total_generated)
    VALUES (p_user_id, NOW(), 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION record_qr_generation(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION check_rate_limit IS 'Checks if user can generate QR based on plan type and rate limits';
COMMENT ON FUNCTION record_qr_generation IS 'Records a QR code generation for rate limiting purposes';
