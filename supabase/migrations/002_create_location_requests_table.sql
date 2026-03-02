-- location_requests テーブル作成
-- ERPからの位置情報取得リクエストを管理
CREATE TABLE IF NOT EXISTS location_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_location_requests_user_id ON location_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_location_requests_completed ON location_requests(completed);

-- RLSポリシー設定
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own requests" ON location_requests;
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON location_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON location_requests;

-- SELECT許可（自分宛のリクエストのみ閲覧可能）
CREATE POLICY "Users can view their own requests" ON location_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT許可（認証済みユーザーのみ、ERPから）
CREATE POLICY "Authenticated users can insert requests" ON location_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE許可（自分宛のリクエストのみ更新可能、完了フラグ更新用）
CREATE POLICY "Users can update their own requests" ON location_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtimeを有効化（アプリ側でリクエストを監視するため）
ALTER PUBLICATION supabase_realtime ADD TABLE location_requests;

-- コメント追加
COMMENT ON TABLE location_requests IS '位置情報取得リクエストテーブル - ERPからのリクエストを管理';
COMMENT ON COLUMN location_requests.id IS '自動生成されるUUID';
COMMENT ON COLUMN location_requests.user_id IS '対象ユーザーID（auth.users.idと紐づく）';
COMMENT ON COLUMN location_requests.requested_at IS 'リクエスト日時';
COMMENT ON COLUMN location_requests.completed IS '完了フラグ';
COMMENT ON COLUMN location_requests.completed_at IS '完了日時';
