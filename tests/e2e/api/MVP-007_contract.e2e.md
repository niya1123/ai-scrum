[Suite] API Contract Validation

- [AC: QGM-032] Accepts and returns application/json
  - Preconditions:
    - Server running at BASE_URL
  - Steps:
    1) POST `/api/quantum-gomoku/games` with header `Content-Type: application/json`, body `{}`.
    2) Assert response header `Content-Type` includes `application/json`.
  - Expected:
    - HTTP 201
    - JSON body contains `{ gameId, gameState }`.

- [AC: QGM-033] Status code conventions
  - Preconditions:
    - Existing gameId
  - Steps:
    1) GET valid id -> expect 200.
    2) GET non-existent id -> expect 404.
    3) POST moves with rule violation (e.g., not your turn) -> expect 409.
    4) POST moves with invalid input (e.g., out of bounds) -> expect 400.
    5) POST `/api/quantum-gomoku/games` -> expect 201.
  - Expected:
    - Status codes match the convention.

- [AC: QGM-034] Error body shape
  - Preconditions:
    - N/A
  - Steps:
    1) Trigger a 400 (e.g., `position.row=-1`).
    2) Trigger a 404 (unknown id).
    3) Trigger a 409 (e.g., `NOT_YOUR_TURN`).
  - Expected:
    - Response JSON: `{ code: string, message: string, details?: object }`.
    - Example codes: `OUT_OF_BOUNDS`, `NOT_FOUND`, `NOT_YOUR_TURN`.

- [AC: QGM-035] `gameState` shape
  - Preconditions:
    - Newly created game
  - Steps:
    1) Create a game.
    2) Validate returned `gameState` fields.
  - Expected:
    - `id` equals route id on subsequent GET.
    - `status in ['playing','finished','draw']`.
    - `currentPlayer in ['BLACK','WHITE']`, initial `BLACK`.
    - `winner` is null initially.
    - `board` is 15x15, all empty initially.
    - `blackObservationsRemaining=5`, `whiteObservationsRemaining=5`.
    - `turnCount=0`.
    - `createdAt` is ISO timestamp.
    - `lastMover` is null initially.

- [AC: QGM-036] Moves input schema
  - Preconditions:
    - Existing gameId
  - Steps:
    1) POST `/api/quantum-gomoku/games/:id/moves` with body `{ playerId: 'BLACK', position: { row: 0, col: 0 } }`.
    2) Try invalid bodies (missing fields, wrong types, out-of-range).
  - Expected:
    - Valid body -> 200 with updated `gameState`.
    - Invalid body -> 400 with `code` indicating the error.

- [AC: QGM-037] Observations input schema
  - Preconditions:
    - Game with at least one move
  - Steps:
    1) POST `/api/quantum-gomoku/games/:id/observations` with body `{ playerId: 'BLACK' }`.
    2) Try invalid/mismatched playerId.
  - Expected:
    - Valid body -> 200 with `{ observationResult, gameState }` or rule-based 409.
    - Mismatch -> 409 `OBSERVATION_NOT_ALLOWED`.

- [AC: QGM-038] `observationResult.winningLine` shape
  - Preconditions:
    - Board arranged to yield a win upon observation
  - Steps:
    1) Execute observation.
  - Expected:
    - `winningLine` is null or an array of `{ row, col }` (≥ 3 entries) when a win occurs.
# MVP-007 API契約（JSON/エラー/スキーマ）— E2Eシナリオ雛形

共通前提
- 全エンドポイントは JSON 入出力（`application/json`）
- エラー本文は `{ code:string, message:string, details?:object }`

## [AC: QGM-032] Accepts/Returns application/json
- 前提: 標準ヘッダ `Accept/Content-Type: application/json`
- 操作: 各エンドポイント（create/get/move/observe/reset/delete）に対し呼び出し
- 期待結果: `content-type` が `application/json` を含む

## [AC: QGM-033] ステータスコード規約の遵守
- 前提: 正常/異常の代表ケース（201,200,400,404,409）
- 操作: ケースごとにリクエスト
- 期待結果: 契約に一致するステータスコードを返す

## [AC: QGM-034] エラー本文の形 `{ code, message, details? }`
- 前提: 異常系（OUT_OF_BOUNDS, NOT_FOUND, NOT_YOUR_TURN など）
- 操作: 各ケースを誘発
- 期待結果: `code` は安定識別子、`message` は人可読、`details` は任意

## [AC: QGM-035] `gameState` の形（スキーマ）
- 前提: 作成直後/進行中/終了/引き分けの代表状態
- 操作: GET / create のレスポンス検査
- 期待結果: `{ id, status('playing'|'finished'|'draw'), currentPlayer, winner|null, board(15x15), blackObservationsRemaining, whiteObservationsRemaining, turnCount, createdAt, lastMover }`

## [AC: QGM-036] moves 入力スキーマ
- 前提: 正常/異常の代表入力
- 操作: POST moves リクエスト
- 期待結果: 欠落/型不正は 400、正しい場合は 200

## [AC: QGM-037] observations 入力スキーマ
- 前提: 正常/異常の代表入力
- 操作: POST observations リクエスト
- 期待結果: `playerId` 不一致は 409 `OBSERVATION_NOT_ALLOWED`

## [AC: QGM-038] `observationResult.winningLine` 形
- 前提: 勝利成立時
- 操作: 観測 POST → レスポンス検査
- 期待結果: `winningLine` は `[ { row, col }, ... ]`（3点以上）、未成立時は `null`

