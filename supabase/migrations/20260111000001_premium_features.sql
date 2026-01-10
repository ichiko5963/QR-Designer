-- ============================================
-- Premium Features Migration
-- ============================================

-- 1. subscription_plans テーブル（プラン定義）
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  features JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. subscriptions テーブル（ユーザーサブスクリプション）
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  plan_name VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  monthly_qr_generated INTEGER DEFAULT 0,
  monthly_scans_tracked INTEGER DEFAULT 0,
  dynamic_qr_count INTEGER DEFAULT 0,
  usage_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. short_urls テーブル（短縮URL + 動的QR）
CREATE TABLE short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  original_url TEXT NOT NULL,
  qr_history_id UUID REFERENCES qr_history(id) ON DELETE SET NULL,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  total_scans INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 4. scan_logs テーブル（スキャン履歴）
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url_id UUID NOT NULL REFERENCES short_urls(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  device_type VARCHAR(20),
  os VARCHAR(50),
  browser VARCHAR(50),
  ip_hash VARCHAR(64),
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100)
);

-- 5. user_logos テーブル（ロゴ管理）
CREATE TABLE user_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  extracted_colors JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_short_urls_code ON short_urls(code);
CREATE INDEX idx_short_urls_user_id ON short_urls(user_id);
CREATE INDEX idx_short_urls_created_at ON short_urls(created_at DESC);

CREATE INDEX idx_scan_logs_short_url_id ON scan_logs(short_url_id);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at DESC);
CREATE INDEX idx_scan_logs_country ON scan_logs(country_code);

CREATE INDEX idx_user_logos_user_id ON user_logos(user_id);
CREATE INDEX idx_user_logos_created_at ON user_logos(created_at DESC);

-- ============================================
-- updated_at トリガー
-- ============================================
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_short_urls_updated_at
  BEFORE UPDATE ON short_urls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_logos_updated_at
  BEFORE UPDATE ON user_logos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS ポリシー
-- ============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logos ENABLE ROW LEVEL SECURITY;

-- subscription_plans: 全員が閲覧可能
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- subscriptions: 自分のサブスクリプションのみ
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- short_urls: 自分の短縮URLのみ
CREATE POLICY "Users can manage own short_urls"
  ON short_urls FOR ALL
  USING (auth.uid() = user_id);

-- scan_logs: short_urlの所有者のみ閲覧可能
CREATE POLICY "Users can view scans for own short_urls"
  ON scan_logs FOR SELECT
  USING (short_url_id IN (SELECT id FROM short_urls WHERE user_id = auth.uid()));

-- scan_logs: service_role のみINSERT可能
CREATE POLICY "Service can insert scan_logs"
  ON scan_logs FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- user_logos: 自分のロゴのみ
CREATE POLICY "Users can manage own logos"
  ON user_logos FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- ヘルパー関数
-- ============================================

-- スキャンカウント増加
CREATE OR REPLACE FUNCTION increment_scan_count(url_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE short_urls
  SET total_scans = total_scans + 1
  WHERE id = url_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 月次QR生成カウント増加
CREATE OR REPLACE FUNCTION increment_monthly_qr_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_name, monthly_qr_generated)
  VALUES (p_user_id, 'free', 1)
  ON CONFLICT (user_id) DO UPDATE
  SET monthly_qr_generated = subscriptions.monthly_qr_generated + 1,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 月次使用量リセット
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET monthly_qr_generated = 0,
      monthly_scans_tracked = 0,
      usage_reset_at = NOW()
  WHERE usage_reset_at IS NULL
    OR usage_reset_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 初期プランデータ
-- ============================================
INSERT INTO subscription_plans (name, display_name, price_monthly, features, sort_order) VALUES
('free', 'Free', 0, '{
  "qr_limit_per_month": 4,
  "max_resolution": 512,
  "svg_pdf_export": false,
  "template_limit": 0,
  "csv_batch_limit": 0,
  "dynamic_qr_limit": 0,
  "scan_analytics": false,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 0,
  "watermark_removable": false,
  "priority_support": false,
  "api_access": false
}', 0),
('starter', 'Starter', 980, '{
  "qr_limit_per_month": 100,
  "max_resolution": 1024,
  "svg_pdf_export": false,
  "template_limit": 3,
  "csv_batch_limit": 0,
  "dynamic_qr_limit": 0,
  "scan_analytics": false,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 10,
  "watermark_removable": true,
  "priority_support": false,
  "api_access": false
}', 1),
('pro', 'Pro', 2980, '{
  "qr_limit_per_month": -1,
  "max_resolution": 4096,
  "svg_pdf_export": true,
  "template_limit": -1,
  "csv_batch_limit": 200,
  "dynamic_qr_limit": 0,
  "scan_analytics": false,
  "team_seats": 1,
  "custom_domain": 0,
  "logo_storage_mb": 50,
  "watermark_removable": true,
  "priority_support": false,
  "api_access": false
}', 2),
('business', 'Business', 7980, '{
  "qr_limit_per_month": -1,
  "max_resolution": 4096,
  "svg_pdf_export": true,
  "template_limit": -1,
  "csv_batch_limit": 1000,
  "dynamic_qr_limit": 250,
  "scan_analytics": true,
  "team_seats": 3,
  "custom_domain": 1,
  "logo_storage_mb": 100,
  "watermark_removable": true,
  "priority_support": true,
  "api_access": false
}', 3);
