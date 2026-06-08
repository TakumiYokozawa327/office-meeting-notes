# Office Meeting Notes

リアルタイム音声書き起こし＋AI提案による営業会議支援アプリ。

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- [Deepgram](https://deepgram.com/) — リアルタイム音声書き起こし・話者分離
- [Anthropic Claude](https://www.anthropic.com/) — AI質問提案・議事録生成

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各APIキーを設定してください。

```bash
cp .env.local.example .env.local
```

| 変数名 | 説明 | 取得先 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API キー | [Anthropic Console](https://console.anthropic.com/) |
| `DEEPGRAM_API_KEY` | Deepgram API キー | [Deepgram Console](https://console.deepgram.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | [Supabase Dashboard](https://supabase.com/) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー | [Supabase Dashboard](https://supabase.com/) |

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動します。

## 主な機能

- Deepgram WebSocket によるリアルタイム音声書き起こし（日本語対応）
- 話者分離・話者ごとの色分け表示
- Claude による質問提案＋「今聞くべき理由」表示
- 採用ボタン → 質問オーバーレイ表示（12秒カウントダウン）
- 会議テーマ管理・ステータス切り替え
- 議事録自動生成（Markdown）
