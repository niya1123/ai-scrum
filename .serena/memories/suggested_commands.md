# 推奨コマンド集（Darwin/macOS）

前提:
- Node.js LTS（18+）: `node -v`
- 初回のみ: `npm install`

## npm run エイリアス（各フェーズ）
- フル実行: `npm run all`
- POのみ: `npm run po`
- Architectのみ: `npm run architect`
- Plannerのみ: `npm run planner`
- Devのみ: `npm run dev`
- QAのみ: `npm run qa`
- Docsのみ: `npm run docs`

## 任意ドメインでの実行（新規）
- 汎用: `npm run domain -- <keyword|path> [--from=<stage>]`
  - キーワード: `travel` / `todo`
  - 例: `npm run domain -- todo`（既定フロー）, `npm run domain -- travel --from=qa`
  - ファイルで指定: `npm run domain -- domains/your-domain.md`
- ショートカット:
  - `npm run domain:travel`
  - `npm run domain:todo`

## サブツール
- スコアカード: `npm run sm:eval`
- レポート要約（最新自動検出）: `npm run report:summary`
- 成果物削除: `npm run clean`

## 補足
- 並列・複数実行時はオーケストレータが自動で `PORT` を割当て、成果物は `out/qa/<RUN_ID>/iter-*/` 下に分離配置されます。
- QAはMCP-Playwright専用（フォールバックは失敗扱い）。
