-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free',
  last_generated_at TIMESTAMPTZ,
  total_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QRコード履歴テーブル
CREATE TABLE IF NOT EXISTS public.qr_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  design_name TEXT,
  design_settings JSONB,
  qr_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 短縮URLテーブル
CREATE TABLE IF NOT EXISTS public.short_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  original_url TEXT,
  title TEXT,
  qr_history_id UUID REFERENCES public.qr_history(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- user_profiles のポリシー
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- qr_history のポリシー
CREATE POLICY "Users can view own history" ON public.qr_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.qr_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON public.qr_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.qr_history
  FOR DELETE USING (auth.uid() = user_id);

-- short_urls のポリシー
CREATE POLICY "Users can view own short urls" ON public.short_urls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own short urls" ON public.short_urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own short urls" ON public.short_urls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own short urls" ON public.short_urls
  FOR DELETE USING (auth.uid() = user_id);

-- 短縮URLリダイレクト用（認証なしでアクセス可能）
CREATE POLICY "Anyone can read active short urls for redirect" ON public.short_urls
  FOR SELECT USING (is_active = true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_qr_history_user_id ON public.qr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_history_created_at ON public.qr_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON public.short_urls(code);
CREATE INDEX IF NOT EXISTS idx_short_urls_user_id ON public.short_urls(user_id);
