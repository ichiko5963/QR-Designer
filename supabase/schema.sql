-- user_profiles テーブル
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'paid')),
  last_generated_at TIMESTAMPTZ,
  total_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- qr_history テーブル（生成履歴 - 認証ユーザーのみ）
CREATE TABLE IF NOT EXISTS qr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  design_name TEXT,
  design_config JSONB, -- デザイン設定をJSONで保存
  qr_image_url TEXT, -- Supabase StorageのURLまたはbase64
  file_size INTEGER, -- ファイルサイズ（bytes）
  format TEXT DEFAULT 'png', -- png, jpg, svg, pdf
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみアクセス可能
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の履歴のみアクセス可能
CREATE POLICY IF NOT EXISTS "Users can view own history"
  ON qr_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own history"
  ON qr_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_history_user_id ON qr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_history_created_at ON qr_history(created_at DESC);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

