[Suite] MVP-002 石の配置（手番・空き・境界・確率種別）

- [AC: QGM-006] 手番不一致は 409 NOT_YOUR_TURN
  - Preconditions:
    - New game created (currentPlayer='BLACK').
  - Steps:
    1) POST `/api/quantum-gomoku/games/:id/moves` with `{ playerId:'WHITE', position:{ row:0, col:0 } }`.
  - Expected:
    - 409 `{ code:'NOT_YOUR_TURN' }`.

- [AC: QGM-007] 範囲外は 400 OUT_OF_BOUNDS
  - Preconditions:
    - New game created.
  - Steps:
    1) POST moves with `{ position:{ row:-1, col:0 } }`.
    2) POST moves with `{ position:{ row:0, col:15 } }`.
  - Expected:
    - 400 with `{ code:'OUT_OF_BOUNDS' }`.

- [AC: QGM-008] 占有セルへの配置は 409 CELL_OCCUPIED
  - Preconditions:
    - A legal BLACK move at (0,0).
  - Steps:
    1) POST moves with `{ playerId:'WHITE', position:{ row:0, col:0 } }` on next turn.
  - Expected:
    - 409 `{ code:'CELL_OCCUPIED' }`.

- [AC: QGM-009] 成功 200 と新規 Stone 属性
  - Preconditions:
    - New game created.
  - Steps:
    1) POST legal move `{ playerId:'BLACK', position:{ row:0, col:0 } }`.
  - Expected:
    - 200 with updated `gameState`.
    - The new stone has `placedBy='BLACK'`.
    - `turnPlaced = previous turnCount + 1`.
    - `probabilityType` set per rule: BLACK 1st=90%, 2nd=70%, alternating.

- [AC: QGM-010] ターンカウント増加と手番交代、lastMover 表示
  - Preconditions:
    - After a successful move.
  - Steps:
    1) Inspect returned `gameState`.
  - Expected:
    - `turnCount` incremented by 1.
    - `currentPlayer` switched to opponent.
    - `lastMover` equals the moving playerId.

- [AC: QGM-011] 非 playing 状態では 409 GAME_FINISHED
  - Preconditions:
    - Force a finished or draw game (can be simulated later once observation is implemented).
  - Steps:
    1) POST a move after finish/draw.
  - Expected:
    - 409 `{ code:'GAME_FINISHED' }`.

- [AC: QGM-012] 不在ゲーム id への moves は 404
  - Preconditions:
    - Unknown id
  - Steps:
    1) POST move to `/api/quantum-gomoku/games/:unknown/moves`.
  - Expected:
    - 404 `{ code:'NOT_FOUND' }`.
# MVP-002 石の配置 — E2Eシナリオ雛形

共通前提
- ゲームは `status='playing'`、`currentPlayer` が有効
- ヘッダ: `Accept: application/json`, `Content-Type: application/json`
- エンドポイント: `/api/quantum-gomoku/games/:id/moves`
- 入力スキーマ: `{ playerId:('BLACK'|'WHITE'), position:{ row:int(0..14), col:int(0..14) } }`

## [AC: QGM-006] エラー: 手番不一致は 409 NOT_YOUR_TURN
- 前提: `currentPlayer = 'BLACK'`
- 操作: `playerId='WHITE'` で合法座標へ POST
- 期待結果: `409 { code:'NOT_YOUR_TURN' }`

## [AC: QGM-007] エラー: 範囲外は 400 OUT_OF_BOUNDS
- 前提: 正しい手番
- 操作: `position.row=-1` もしくは `col=15` 等の範囲外で POST
- 期待結果: `400 { code:'OUT_OF_BOUNDS' }`

## [AC: QGM-008] エラー: 占有セルは 409 CELL_OCCUPIED
- 前提: 既に石があるセル
- 操作: 同一セルに POST
- 期待結果: `409 { code:'CELL_OCCUPIED' }`

## [AC: QGM-009] 正常: 200 と更新後 gameState（確率種別割当）
- 前提: 空きセル・正しい手番
- 操作: 合法座標に POST
- 期待結果:
  - ステータス: 200
  - `turnCount` が +1
  - 新規 `Stone` は `placedBy=playerId`, `turnPlaced=旧turnCount+1`
  - `probabilityType` は BLACK: 90→70→以降交互, WHITE: 10→30→以降交互

## [AC: QGM-010] 正常: 手番交代と lastMover 設定
- 前提: 直前の成功 move
- 操作: レスポンス検査
- 期待結果:
  - `currentPlayer` が相手色に交代
  - `lastMover=playerId`

## [AC: QGM-011] エラー: 非 playing 状態は 409 GAME_FINISHED
- 前提: `status!='playing'`
- 操作: 任意の move POST
- 期待結果: `409 { code:'GAME_FINISHED' }`

## [AC: QGM-012] エラー: 不存在ゲームへの moves は 404 NOT_FOUND
- 前提: 不存在 `:id`
- 操作: POST `/api/quantum-gomoku/games/:id/moves`
- 期待結果: `404 { code:'NOT_FOUND' }`

