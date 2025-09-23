# Sprint Retro — 2025-09-23_docs_iter-1

## 続ける (Keep)
- ランナー非依存のドキュメント生成とサンプル併設（`docs/domains/tasks/samples/api/`）。
- API実装（Next.js routes）と仕様の誤差ゼロ運用（エラーコード `TITLE_REQUIRED`/`DONE_REQUIRED`/`TASK_NOT_FOUND` の整合）。
- `share/retro/latest.md` を更新して関係者共有を即時化。

## やめる (Stop)
- ドメイン共通サンプルとドメイン固有サンプルの混在配置（参照先の揺れ）。
- RUN_ID の命名揺れ（タイムスタンプ/ラベル混在）。
- 事前合意なく `.http` と `curl` の両系を重複管理。

## 試す (Try)
- ルートハンドラから OpenAPI 生成の自動化（型からの抽出）。
- CIにドキュメント整合性チェック（エラーコード・ステータス・JSON型）を追加。
- `npm run docs:samples:verify` の軽量スモークで `.http` 実行可否を検証。

## メモ
- 本スプリントは Tasks ドメインの API仕様/ユーザーガイド整備に集中。既存UIとAPIのセレクタ/エラー整合は手元テストで確認済み。
- 次スプリントは OpenAPI 化と E2E 実行系（Architect 選定後）への接続を優先。

