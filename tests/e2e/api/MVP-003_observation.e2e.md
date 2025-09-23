[Suite] MVP-003 観測（崩壊・勝敗評価・巻き戻し・回数）

- [AC: QGM-013] lastMover 以外の観測は 409 OBSERVATION_NOT_ALLOWED
  - Preconditions:
    - At least one move executed by BLACK.
  - Steps:
    1) POST observation with `{ playerId:'WHITE' }`.
  - Expected:
    - 409 `{ code:'OBSERVATION_NOT_ALLOWED' }`.

- [AC: QGM-014] 観測残回数 0 は 409 OBSERVATIONS_EXHAUSTED
  - Preconditions:
    - Reduce `observationsRemaining` for a player to 0 (repeat allowed observations until exhausted).
  - Steps:
    1) POST observation by the player with 0 remaining.
  - Expected:
    - 409 `{ code:'OBSERVATIONS_EXHAUSTED' }`.

- [AC: QGM-015] 確率種別に基づくランダム観測
  - Preconditions:
    - Board with several stones of both sides placed.
  - Steps:
    1) POST observation with `{ playerId:lastMover }`.
    2) (If test hook available) set deterministic seed.
  - Expected:
    - Each stone receives `observedColor` according to its `probabilityType` (90/70/30/10%).

- [AC: QGM-016] 観測結果オブジェクトと gameState 返却
  - Preconditions:
    - Observation executed.
  - Steps:
    1) Validate response shape `{ observationResult, gameState }`.
  - Expected:
    - `observationResult = { observedBy, turnExecuted, resultBoard, isWinning, winner|null, winningLine|null }`.

- [AC: QGM-017] 勝利判定は 3 連以上（縦横斜）
  - Preconditions:
    - Arrange board so that observation can yield ≥3 in a line for some color.
  - Steps:
    1) Execute observation.
  - Expected:
    - When ≥3 consecutive same color exists, `isWinning=true` and at least one `winningLine` (coords array) is present.

- [AC: QGM-018] 両陣営同時成立時は observedBy が勝者
  - Preconditions:
    - Board setup allowing simultaneous ≥3 for both.
  - Steps:
    1) Execute observation.
  - Expected:
    - `winner === observedBy` when both satisfy winning condition.

- [AC: QGM-019] 勝敗不成立なら巻き戻し（未観測に戻す）
  - Preconditions:
    - Observation that results in no win.
  - Steps:
    1) Validate all stones `observedColor` reverted to null.
  - Expected:
    - `gameState.status='playing'` remains.

- [AC: QGM-020] 観測後は残回数を 1 減らす
  - Preconditions:
    - Prior observation performed.
  - Steps:
    1) Compare observationsRemaining before/after.
  - Expected:
    - `observationsRemaining` for `observedBy` decreased by 1; `turnCount` unchanged.

- [AC: QGM-021] 観測後は再観測不可（配置前）
  - Preconditions:
    - Observation just executed.
  - Steps:
    1) POST another observation immediately.
  - Expected:
    - 409 `{ code:'OBSERVATION_NOT_ALLOWED' }`.

- [AC: QGM-022] 終了ゲームへの観測は 409 GAME_FINISHED
  - Preconditions:
    - Finished game
  - Steps:
    1) POST observation.
  - Expected:
    - 409 `{ code:'GAME_FINISHED' }`.

- [AC: QGM-023] 不在 id の観測は 404 NOT_FOUND
  - Preconditions:
    - Unknown id
  - Steps:
    1) POST observation to unknown id.
  - Expected:
    - 404 `{ code:'NOT_FOUND' }`.
# MVP-003 観測 — E2Eシナリオ雛形

共通前提
- 直前に `lastMover` が存在（直近の成功 move 後）
- エンドポイント: `/api/quantum-gomoku/games/:id/observations`
- 入力スキーマ: `{ playerId:('BLACK'|'WHITE') }`

## [AC: QGM-013] エラー: lastMover 以外は 409 OBSERVATION_NOT_ALLOWED
- 前提: `lastMover='BLACK'`
- 操作: `playerId='WHITE'` で POST
- 期待結果: `409 { code:'OBSERVATION_NOT_ALLOWED' }`

## [AC: QGM-014] エラー: 観測残回数 0 は 409 OBSERVATIONS_EXHAUSTED
- 前提: `observationsRemaining=0` のプレイヤー
- 操作: 観測 POST
- 期待結果: `409 { code:'OBSERVATIONS_EXHAUSTED' }`

## [AC: QGM-015] 正常: 確率種別に基づくランダム観測
- 前提: 盤面に複数の Stone が存在し、各 `probabilityType` が設定済み
- 操作: 観測 POST
- 期待結果: 全 Stone の `observedColor` が 90/70/30/10% に従い `BLACK`/`WHITE` に割当

## [AC: QGM-016] レスポンス: 200 と `{ observationResult, gameState }`
- 前提: 観測 POST 成功
- 操作: レスポンス検査
- 期待結果:
  - `observationResult = { observedBy, turnExecuted, resultBoard, isWinning, winner|null, winningLine|null }`
  - `gameState` は最新状態

## [AC: QGM-017] 判定: 縦/横/斜めに3連以上で勝利
- 前提: 3連以上が成立する配置が resultBoard に存在
- 操作: 観測結果を評価
- 期待結果: `isWinning=true` かつ `winningLine` に少なくとも1つの座標列

## [AC: QGM-018] 競合: 両陣営同時成立時は `winner=observedBy`
- 前提: 双方に3連以上が同時成立
- 操作: 観測結果を評価
- 期待結果: `winner` が `observedBy` と一致

## [AC: QGM-019] 不成立: すべて未観測(null)に巻き戻し、status='playing' 維持
- 前提: 勝敗不成立
- 操作: 観測結果適用後の gameState を取得
- 期待結果:
  - 全 Stone の `observedColor=null` に戻る
  - `status='playing'` を維持

## [AC: QGM-020] 残回数: `observationsRemaining` を観測者側で1減
- 前提: 観測成功
- 操作: レスポンス検査
- 期待結果: 観測者の残回数が 1 減少（`turnCount` は増えない）

## [AC: QGM-021] 制約: 観測後は次の配置まで再観測不可
- 前提: 観測直後で、次の move 未実施
- 操作: 連続で観測を POST
- 期待結果: `409 { code:'OBSERVATION_NOT_ALLOWED' }`

## [AC: QGM-022] エラー: 終了ゲームへの観測は 409 GAME_FINISHED
- 前提: `status='finished'`
- 操作: 観測 POST
- 期待結果: `409 { code:'GAME_FINISHED' }`

## [AC: QGM-023] エラー: 不存在ゲームへの観測は 404 NOT_FOUND
- 前提: 不存在 `:id`
- 操作: POST `/api/quantum-gomoku/games/:id/observations`
- 期待結果: `404 { code:'NOT_FOUND' }`

