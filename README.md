# 位置情報オンデマンド送信アプリ

ERPシステムからの呼び出しに応じてユーザーの位置情報を取得し、Supabaseに保存するiOS対応のモバイルアプリケーションです。
取得した位置情報は、ERPの実長タブでマップ表示されます。

## 特徴

- iOS対応の位置情報オンデマンド取得
- ERPからの呼び出し時のみ位置情報を送信
- Supabaseへのリアルタイム保存
- 高精度GPS使用
- シンプルで使いやすいUI
- 送信履歴の表示

## プロジェクト構造

```
project-root/
├── docs/                                # ドキュメント
│   ├── プロジェクト仕様書.md
│   ├── 開発ルール.md
│   └── GitHubルール.md
│
├── src/
│   ├── features/                        # 機能ごとにまとめる
│   │   └── location/                    # 位置情報追跡機能
│   │       ├── screens/
│   │       │   └── LocationTrackerScreen.js
│   │       ├── hooks/
│   │       │   └── useLocationTracking.js
│   │       └── services/
│   │           └── locationService.js
│   │
│   ├── navigation/                      # ナビゲーション
│   └── services/                        # 共通サービス
│       └── supabase/
│           └── client.js
│
├── supabase/                            # Supabase設定
│   └── migrations/
│       └── 001_create_locations_table.sql
├── .env.example
├── app.json
├── package.json
└── README.md
```

## セットアップ

### 1. リポジトリをクローン

```bash
git clone [repository-url]
cd Actual_Length_Position_Information_app
```

### 2. 依存関係をインストール

```bash
npm install
```

必要なパッケージ:
- expo-location
- expo-task-manager
- @react-native-async-storage/async-storage
- @supabase/supabase-js
- @react-navigation/native
- @react-navigation/native-stack

### 3. Supabaseプロジェクトの設定

#### 3.1 Supabaseプロジェクト作成
1. https://supabase.com でプロジェクトを作成
2. プロジェクトURLとAnon Keyを取得

#### 3.2 locationsテーブル作成
SQLエディタで以下のファイルを実行:
`supabase/migrations/001_create_locations_table.sql`

または、Supabase SQLエディタで以下を実行:

```sql
-- locations テーブル作成
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);
CREATE INDEX idx_locations_user_timestamp ON locations(user_id, timestamp);

-- RLSポリシー設定
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON locations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select" ON locations
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 4. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して、Supabase の認証情報を設定:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. アプリを起動

```bash
npm start
```

- **iOS シミュレータ:** `i` キーを押す
- **実機:** Expo Goアプリでスキャン

### 6. iOS実機でのテスト

```bash
npm run ios
```

## 使い方

### アプリ側
1. アプリを起動
2. ユーザーIDを入力（初回のみ）
3. 「サービス開始」ボタンをタップ
4. 位置情報の権限を許可
5. アプリがバックグラウンドでも呼び出しを待機

### ERP側
1. 実長タブを開く
2. 「現在位置を取得」ボタンをクリック
3. アプリから位置情報が送信される
4. マップに位置情報が表示される

## 位置情報取得について

- **取得タイミング**: ERPからの呼び出し時のみ
- **精度**: 高精度（GPS使用）
- **バックグラウンド動作**: 呼び出し受信時にのみ実行
- **バッテリー消費**: 常時追跡ではないため最小限

## 取得する位置データ

- 緯度（latitude）
- 経度（longitude）
- 高度（altitude）
- 精度（accuracy）
- 速度（speed）
- 方向（heading）
- タイムスタンプ（timestamp）
- ユーザーID（user_id）

## iOS固有の設定

### app.json設定内容
- `bundleIdentifier`: com.actualposition.locationtracker
- `NSLocationAlwaysAndWhenInUseUsageDescription`: 位置情報の常時取得の理由
- `NSLocationWhenInUseUsageDescription`: 位置情報取得の理由
- `UIBackgroundModes`: location（バックグラウンド実行）

### App Store配布

TestFlightでの配布手順:
1. Expo EAS Buildでビルド
   ```bash
   eas build --platform ios
   ```
2. App Store Connectにアップロード
3. TestFlightで配布

## スクリプト

- `npm start` - Expo 開発サーバーを起動
- `npm run ios` - iOS シミュレータで起動
- `npm run android` - Android エミュレータで起動（今回は非対応）
- `npm run web` - Web ブラウザで起動

## 技術スタック

- **React Native:** 0.81.5
- **Expo:** ~54.0.30
- **React:** 19.1.0
- **expo-location:** 位置情報取得
- **expo-task-manager:** バックグラウンドタスク
- **@react-native-async-storage/async-storage:** ローカルストレージ
- **@supabase/supabase-js:** Supabaseクライアント
- **@react-navigation/native:** ナビゲーション管理

## データベース構造

### locationsテーブル

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | uuid | PRIMARY KEY | 自動生成ID |
| user_id | text | NOT NULL | ユーザー識別ID |
| latitude | double precision | NOT NULL | 緯度 |
| longitude | double precision | NOT NULL | 経度 |
| altitude | double precision | NULL | 高度（メートル） |
| accuracy | double precision | NULL | 位置精度（メートル） |
| speed | double precision | NULL | 速度（m/s） |
| heading | double precision | NULL | 方向（度） |
| timestamp | timestamptz | NOT NULL | 位置情報取得日時 |
| created_at | timestamptz | DEFAULT now() | レコード作成日時 |

## 非機能要件

### パフォーマンス
- 位置情報取得間隔: 60秒または10m移動
- バックグラウンド動作: 継続的
- データ送信: リアルタイム

### セキュリティ
- 位置情報は暗号化された通信で送信（HTTPS）
- Supabase RLSでアクセス制御
- ユーザーIDは識別用途のみ

### バッテリー消費
- 高精度GPSを使用するためバッテリー消費が大きい
- ユーザーに事前の説明が必要

## 制約事項

- iOS専用（Android対応は今回対象外）
- バックグラウンド動作はiOSの制限に従う
- 位置情報権限が必須
- ERPシステムでの表示機能は別プロジェクト

## プライバシー

- App Store申請時に位置情報利用目的の明記が必要
- ユーザーの同意が必須
- プライバシーポリシーの整備が必要

## 今後の拡張予定

- Android対応
- オフライン時のデータ同期
- 位置情報履歴の表示
- 取得間隔の設定変更
- バッテリー節約モード
- プッシュ通知機能

## トラブルシューティング

### 位置情報が取得できない
- 位置情報の権限が「常に許可」になっているか確認
- iOSの設定 > プライバシー > 位置情報サービス が有効か確認

### バックグラウンドで動作しない
- app.jsonの`UIBackgroundModes`設定を確認
- 実機でのテストを推奨（シミュレータでは制限あり）

### データが保存されない
- Supabaseの接続情報（.env）を確認
- SupabaseのRLSポリシーが正しく設定されているか確認
- ネットワーク接続を確認

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリにあります：

- [プロジェクト仕様書](docs/プロジェクト仕様書.md)
- [開発ルール](docs/開発ルール.md)

## ライセンス

MIT License

## サポート

問題が発生した場合は、GitHub Issues で報告してください。
