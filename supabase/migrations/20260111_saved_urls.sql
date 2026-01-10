-- 保存されたURL管理テーブル
CREATE TABLE IF NOT EXISTS saved_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  category VARCHAR(100),
  icon VARCHAR(10),
  qr_image_url TEXT,
  short_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_saved_urls_user_id ON saved_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_urls_category ON saved_urls(category);

-- RLSポリシー
ALTER TABLE saved_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved urls"
  ON saved_urls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved urls"
  ON saved_urls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved urls"
  ON saved_urls FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved urls"
  ON saved_urls FOR DELETE
  USING (auth.uid() = user_id);

-- プロフィールカード（名刺）テーブル
CREATE TABLE IF NOT EXISTS profile_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#171158',
  links JSONB DEFAULT '[]',
  slug VARCHAR(100) UNIQUE,
  qr_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_profile_cards_user_id ON profile_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_cards_slug ON profile_cards(slug);

-- RLSポリシー
ALTER TABLE profile_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile cards"
  ON profile_cards FOR SELECT
  USING (auth.uid() = user_id OR is_published = true);

CREATE POLICY "Users can insert own profile cards"
  ON profile_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile cards"
  ON profile_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile cards"
  ON profile_cards FOR DELETE
  USING (auth.uid() = user_id);
