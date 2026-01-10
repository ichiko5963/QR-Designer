-- ============================================
-- アンケートフォーム機能用テーブル
-- ============================================

-- 1. qr_historyにpage_titleカラムを追加（既存の問題を修正）
ALTER TABLE public.qr_history
ADD COLUMN IF NOT EXISTS page_title TEXT;

-- 2. フォームテーブル
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '無題のフォーム',
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  is_accepting_responses BOOLEAN DEFAULT true,
  theme_color VARCHAR(7) DEFAULT '#171158',
  response_count INTEGER DEFAULT 0,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. フォーム質問テーブル
CREATE TABLE IF NOT EXISTS public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL DEFAULT 'text',
  -- question_type: text, textarea, select, radio, checkbox, rating, date, email, phone
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- 選択肢用: ["選択肢1", "選択肢2", ...]
  order_index INTEGER NOT NULL DEFAULT 0,
  settings JSONB, -- 追加設定: { min: 1, max: 5 } など
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. フォーム回答テーブル
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- { "question_id": "回答内容", ... }
  respondent_info JSONB, -- IPアドレス、ブラウザ情報など（オプション）
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_code ON public.forms(code);
CREATE INDEX IF NOT EXISTS idx_form_questions_form_id ON public.form_questions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);

-- ============================================
-- RLS (Row Level Security) ポリシー
-- ============================================

-- formsテーブルのRLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own forms" ON public.forms;
CREATE POLICY "Users can manage own forms" ON public.forms
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view published forms" ON public.forms;
CREATE POLICY "Anyone can view published forms" ON public.forms
  FOR SELECT USING (is_published = true);

-- form_questionsテーブルのRLS
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own form questions" ON public.form_questions;
CREATE POLICY "Users can manage own form questions" ON public.form_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_questions.form_id
      AND forms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view published form questions" ON public.form_questions;
CREATE POLICY "Anyone can view published form questions" ON public.form_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_questions.form_id
      AND forms.is_published = true
    )
  );

-- form_responsesテーブルのRLS
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own form responses" ON public.form_responses;
CREATE POLICY "Users can view own form responses" ON public.form_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can submit responses" ON public.form_responses;
CREATE POLICY "Anyone can submit responses" ON public.form_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_responses.form_id
      AND forms.is_published = true
      AND forms.is_accepting_responses = true
    )
  );

-- ============================================
-- 回答数を自動更新するトリガー
-- ============================================
CREATE OR REPLACE FUNCTION update_form_response_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forms
  SET response_count = (
    SELECT COUNT(*) FROM public.form_responses WHERE form_id = NEW.form_id
  )
  WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_response_count ON public.form_responses;
CREATE TRIGGER trigger_update_response_count
  AFTER INSERT ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_form_response_count();

-- スキーマキャッシュをリロード
NOTIFY pgrst, 'reload schema';
