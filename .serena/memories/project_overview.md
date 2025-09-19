# プロジェクト概要 (ai-scrum)

- 目的: AIエージェント（PO/Architect/Planner/Dev-FE/Dev-BE/QA/Docs）のハンドオフ契約に従い、Codex CLIを使ってスクラム型イテレーションを自動実行するオーケストレータ。題材は「ドメイン仕様に基づく任意MVP」（旅行計画に限定しない）。E2EがGreenになって初めてDone。
- 想定フロー: PO→Architect→Planner→Dev(FE/BE)→QA→Docs を `scripts/orchestrator.ts` が非対話で駆動し、成果物は `out/` 配下に保存。
- 受け入れ判定: QA最終メッセージに `{ "status": "green" }`（runnerは原則 `"mcp"`）が含まれる、または `E2E: GREEN` 等のトークン検出。

## 技術スタック
- 言語: TypeScript（ESM） / Node.js（LTS想定）
- 実行ツール: Codex CLI（`codex exec`）、dotenv
- テスト（方針）: Playwright（MCPサーバ経由を強制、ローカルCLIは禁止）
- スクリプト: `scripts/orchestrator.ts`（全体オーケストレート）、`scripts/sm-evaluate.ts`（スコアカード）
- OS: Darwin（macOS）

## ドメイン仕様
- `domains/` 配下にドメイン仕様を配置。既定は `domains/examples/travel-planner.md`。
- 使用時は `DOMAIN_SPEC=/path/to/spec.md tsx scripts/orchestrator.ts` のように環境変数で切替可能。

## 成果物/ディレクトリ
- `out/qa/<RUN_ID>/iter-<n>/`（イテレーションごとの統一フォルダ）
  - `report/`（Playwright HTML Report: `index.html`）
  - `test-results/`, `blob-report/`（存在する場合は収集）
  - `result.json`（QA最終JSON） / `stream.jsonl`（Codex JSONL）
- 他: `out/backlog.yml`, `out/tasks.yml`, 各ステージの *.jsonl, ログ類

## 重要な環境変数（orchestrator.ts）
- `DOMAIN_SPEC` ドメイン仕様のパス（既定: `domains/examples/travel-planner.md`。存在しない場合はPOに渡さない）
- `RUN_ID` 実行単位の名前空間（省略時はISO時刻）
- `MAX_ITERS` デフォルト3 / `ENABLE_RED_INVESTIGATION`=1 / `PARALLEL_DEVS`=2 / `AUTO_DEV_AFTER_REPLAN`=1
- `PROGRESS_STYLE` bar|spinner|none / `QA_REQUIRE_MCP`=1 / `CODEX_TIMEOUT_MS`, `CODEX_STALL_TIMEOUT_MS`
- QA時の自動付与: `PORT=<ephemeral>`, `PLAYWRIGHT_HTML_REPORT=out/qa/<RUN_ID>/iter-*/report`, `FORCE_MCP_PLAYWRIGHT=1`, `QA_ITERATION_LABEL`

## ガイドライン/規約（抜粋）
- 変更は「提案→実行」。提案は根拠/比較表、実行は差分（パッチ/コマンド）。
- 自動変更は冪等（既存物を壊さない、失敗時ロールバック指示）。
- 受け入れはE2E Greenが必須。
- 配置規約:
  - E2E: `tests/e2e/`
  - APIサンプル/契約例: `docs/samples/api/`
  - 実行ログ: `out/logs/`
  - ルート直下に新規ファイルを増やさない
