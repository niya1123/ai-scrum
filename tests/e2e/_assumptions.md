# QA 前提・抽象セレクタ（API）

前提
- ランナー: Playwright API Testing（@playwright/test）
- 設定: `config/playwright.config.ts`（`testDir=tests/e2e`）
- サーバ: ローカルまたはCI上で起動済み（`webServer` 設定に依存）
- ヘッダ: `Accept: application/json`, `Content-Type: application/json`
- エラー契約: `{ code:string, message:string, details?:object }`

抽象セレクタ（APIエンドポイント）
- `POST /api/quantum-gomoku/games` → 新規作成
- `GET  /api/quantum-gomoku/games/:id` → 取得
- `POST /api/quantum-gomoku/games/:id/moves` → 配置
- `POST /api/quantum-gomoku/games/:id/observations` → 観測
- `POST /api/quantum-gomoku/games/:id/reset` → リセット
- `DELETE /api/quantum-gomoku/games/:id` → 削除

抽象セレクタ（JSONパス例）
- `$.gameId` / `$.gameState`
- `$.gameState.board[ROW][COL]`
- `$.gameState.status` / `$.gameState.currentPlayer` / `$.gameState.winner`
- `$.gameState.blackObservationsRemaining` / `$.gameState.whiteObservationsRemaining`
- `$.gameState.turnCount` / `$.gameState.lastMover`
- エラー: `$.code` / `$.message` / `$.details`

注意
- 乱数を含む観測（QGM-015）は統計的性質を前提にしつつ、判定系（QGM-017〜018）は決定ルールで検証すること。

