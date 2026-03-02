-- locations テーブル作成
-- 位置情報を保存するメインテーブル
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  request_id UUID
);

-- インデックス作成
-- user_idでの検索性能向上
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- timestampでの時系列検索用
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);

-- user_idとtimestampの複合インデックス
CREATE INDEX IF NOT EXISTS idx_locations_user_timestamp ON locations(user_id, timestamp);

-- RLSポリシー設定
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can insert their own location" ON locations;
DROP POLICY IF EXISTS "Authenticated users can view locations" ON locations;

-- INSERT許可（認証済みユーザーが自分の位置情報を登録）
CREATE POLICY "Users can insert their own location" ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT許可（認証済みユーザー全員が閲覧可能、ERP側で使用）
CREATE POLICY "Authenticated users can view locations" ON locations
  FOR SELECT
  TO authenticated
  USING (true);

-- コメント追加
COMMENT ON TABLE locations IS '位置情報テーブル - ユーザーの位置情報を時系列で保存';
COMMENT ON COLUMN locations.id IS '自動生成されるUUID';
COMMENT ON COLUMN locations.user_id IS 'ユーザーID（auth.users.idと紐づく）';
COMMENT ON COLUMN locations.latitude IS '緯度';
COMMENT ON COLUMN locations.longitude IS '経度';
COMMENT ON COLUMN locations.altitude IS '高度（メートル）';
COMMENT ON COLUMN locations.accuracy IS '位置精度（メートル）';
COMMENT ON COLUMN locations.speed IS '速度（m/s）';
COMMENT ON COLUMN locations.heading IS '方向（度）';
COMMENT ON COLUMN locations.timestamp IS '位置情報取得日時';
COMMENT ON COLUMN locations.created_at IS 'レコード作成日時';
COMMENT ON COLUMN locations.request_id IS '呼び出しリクエストID（紐付け用）';
