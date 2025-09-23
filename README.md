# AI Scrum テンプレート

マルチエージェントによるスクラム自動化パイプラインを動かすための最小構成テンプレートです。リポジトリをフォークし、ドメイン仕様を書けばすぐに自動スクラムを開始できます。

## クイックスタート
1. 依存関係をインストールします（Node.js >= 18 が必要）。
   ```bash
   npm install
   ```
2. `domains/<ドメイン名>/<ドメイン名>-plan.md` にドメイン計画書を追加します。
3. パイプラインを実行します。
   ```bash
   npm run domain domains/<ドメイン名>/<ドメイン名>-plan.md
   ```
   CLI オーケストレータが PO から Docs までの各ロールを順番に実行します。特定ロールから再開したい場合は `npm run domain:<role>` を利用してください。

## リポジトリ構成
```
.
├─ app/                 # 最小の Next.js シェル（必要に応じて差し替え）
├─ config/              # Playwright 設定
├─ docs/                # 生成されるドキュメント・レトロ・共有物（初期状態では空）
├─ domains/             # ドメイン仕様置き場（ここに計画書を配置）
├─ prompts/             # オーケストレータが読み込むロールごとのプロンプト
├─ scripts/             # オーケストレータと補助スクリプト（削除禁止）
├─ share/retro/         # Docs エージェントがレトロを複製する場所
├─ tests/               # E2E / Unit テストを配置するディレクトリ
└─ out/                 # 各実行の成果物（必要に応じて削除して良い）
```

空ディレクトリには `.gitkeep` を配置しており、成果物がまだ無い状態でもツリーが保たれます。`out/` や `docs/scrum/`、`share/retro/` は各実行で上書きされるため、必要なものだけをコミットしてください。

## よく使うコマンド
- `npm run domain` — PO→Docs を通しで実行。付属サンプルを使う場合は `travel` や `todo` などのキーワードも指定できます。
- `npm run domain:<role>` — `po` / `architect` / `planner` / `dev` / `qa` / `docs` のいずれかから開始。
- `npm run test:e2e` — Next.js アプリを起動し、`tests/e2e` 配下の Playwright テストを実行。
- `npm run test:unit` — `tests/unit` 配下を対象に `tsx --test` を実行。

## 新しいドメインを追加するには
1. 目的・アクター・AC を含む仕様を作成し、`domains/<名前>/<名前>-plan.md` に保存します。
2. `npm run domain domains/<名前>/<名前>-plan.md` を実行します。
3. 実行結果を `out/` 配下で確認します。
   - `out/po/<RUN_ID>/` — PO が生成したバックログと AC
   - `out/planner/<RUN_ID>/` — Planner によるタスク分解とテスト雛形
   - `out/dev-*/<RUN_ID>/` — 各 Dev が出力したログや差分
   - `out/qa/<RUN_ID>/` — QA の E2E テスト結果
4. 同じ仕様で別ロールから再開する場合は `npm run domain:<role>` に同じパスを渡します。

## ハウスキーピング
- ログ (`*.log`) や過去の実行成果物は削除済みです。必要に応じて再生成してください。
- テンプレートを基盤として維持したい場合は、ドメイン固有のコードやドキュメントをコミット前にクリーンアップする運用を推奨します。
