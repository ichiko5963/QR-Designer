-- QRコードスキャン履歴テーブル
CREATE TABLE IF NOT EXISTS scanned_qr_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_scanned_qr_history_user_id ON scanned_qr_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_qr_history_scanned_at ON scanned_qr_history(scanned_at DESC);

-- RLSを有効化
ALTER TABLE scanned_qr_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own scanned QR history"
  ON scanned_qr_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scanned QR history"
  ON scanned_qr_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned QR history"
  ON scanned_qr_history
  FOR DELETE
  USING (auth.uid() = user_id);
