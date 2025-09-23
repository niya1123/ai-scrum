[Suite] MVP-001 新規ゲーム開始と取得

- [AC: QGM-001] 新規ゲーム作成 201 と初期 state
  - Preconditions:
    - Server running at BASE_URL
  - Steps:
    1) POST `/api/quantum-gomoku/games` with `{}` and JSON headers.
  - Expected:
    - 201 Created.
    - Body: `{ gameId, gameState }`.
    - `gameState.status='playing'`.
    - `gameState.currentPlayer='BLACK'`.
    - `gameState.winner=null`.
    - `gameState.turnCount=0`.
    - `gameState.blackObservationsRemaining=5`.
    - `gameState.whiteObservationsRemaining=5`.
    - `gameState.board` is 15x15 all empty.

- [AC: QGM-002] 盤は 15x15 の正方グリッド
  - Preconditions:
    - Existing gameId from creation.
  - Steps:
    1) GET `/api/quantum-gomoku/games/:id`.
  - Expected:
    - 200 OK.
    - `board.length === 15` and every row length `=== 15`.

- [AC: QGM-003] GET は 200 と同一 `gameState`
  - Preconditions:
    - Existing gameId
  - Steps:
    1) GET `/api/quantum-gomoku/games/:id`.
  - Expected:
    - 200 OK.
    - `gameState.id === :id`.

- [AC: QGM-004] 不在 id への GET は 404
  - Preconditions:
    - Non-existent id
  - Steps:
    1) GET `/api/quantum-gomoku/games/:unknown`.
  - Expected:
    - 404 with `{ code:'NOT_FOUND' }`.

- [AC: QGM-005] 同一プロセスで状態一貫性
  - Preconditions:
    - Existing gameId
  - Steps:
    1) GET same id multiple times consecutively.
  - Expected:
    - Identical `gameState` snapshots across calls (no mutation between reads).
# MVP-001 新規ゲーム開始と取得 — E2Eシナリオ雛形

本ファイルは Playwright（config/playwright.config.ts, testDir=tests/e2e）を前提としたAPI E2Eの雛形です。既存の自動テスト実装（tests/e2e/quantum-gomoku.mvp-001.spec.ts）と整合します。

共通前提
- サーバ: ローカル開発サーバが起動済み（`BASE_URL` は Playwright 設定に従う）
- ヘッダ: `Accept: application/json`, `Content-Type: application/json`
- エンドポイント: `/api/quantum-gomoku/games`

## [AC: QGM-001] 正常系: 新規ゲーム作成 201 と初期 state
- 前提: 上記 共通前提
- 操作: POST `/api/quantum-gomoku/games` （ボディなし）
- 期待結果:
  - ステータス: 201
  - ボディ: `{ gameId, gameState }`
  - `gameState.status = 'playing'`
  - `gameState.currentPlayer = 'BLACK'`
  - `gameState.winner = null`
  - `gameState.turnCount = 0`
  - `gameState.blackObservationsRemaining = 5`
  - `gameState.whiteObservationsRemaining = 5`
  - `gameState.board` は 15x15 で全セル `null`

## [AC: QGM-002] 検証: board は 15x15 正方グリッド
- 前提: 直前の作成レスポンスの `gameState` を保持
- 操作: レスポンスの `board` を検査
- 期待結果:
  - 行数: 15
  - 各行の列数: 15
  - 値: すべて `null`

## [AC: QGM-003] 正常系: GET で同一 `gameState` を返す
- 前提: `gameId` を保持
- 操作: GET `/api/quantum-gomoku/games/:id`
- 期待結果:
  - ステータス: 200
  - ボディ: `{ gameState }`（`id` が `:id` と一致し、作成時と同一状態）

## [AC: QGM-004] エラー: 不存在 `:id` への GET は 404 NOT_FOUND
- 前提: 存在しない `:id`
- 操作: GET `/api/quantum-gomoku/games/:id`
- 期待結果:
  - ステータス: 404
  - ボディ: `{ code: 'NOT_FOUND', message, details?: { id } }`

## [AC: QGM-005] 一貫性: 同一プロセス内で状態が一貫
- 前提: 同一プロセスで連続して GET を実行
- 操作: 同一 `:id` で複数回 GET
- 期待結果:
  - 連続リクエストで同一 `gameState` が取得できる

