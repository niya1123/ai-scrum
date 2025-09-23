# Domain: 量子五目並べ

## Overview
- プレイヤーは確率的な石を配置し、観測により石の色を確定させて3目並べを目指す
- 各石は黒になる確率が異なり（90%, 70%, 30%, 10%）、観測時にランダムに色が決定される
- オンメモリで状態管理、ゲーム開始時にリセット

## Primary Entities
- GameState: { id, status, currentPlayer, winner, board, blackObservationsRemaining, whiteObservationsRemaining, turnCount, createdAt }
- Stone: { id, position, probabilityType, observedColor, placedBy, turnPlaced }
- ObservationResult: { id, observedBy, turnExecuted, resultBoard, isWinning, winner, winningLine }

## API (suggested)
- POST /api/quantum-gomoku/games -> { gameId, gameState }
- GET /api/quantum-gomoku/games/:id -> { gameState }
- POST /api/quantum-gomoku/games/:id/moves { playerId, position } -> { gameState }
- POST /api/quantum-gomoku/games/:id/observations { playerId } -> { observationResult, gameState }
- POST /api/quantum-gomoku/games/:id/reset -> { gameState }
- DELETE /api/quantum-gomoku/games/:id -> { success: true }

## UI (suggested)
- ゲームボード: 15x15グリッド、クリック可能な位置
- 石表示: 確率に応じたグラデーション（未観測）、明確な黒白（観測後）
- 観測ボタン: 現在プレイヤーが観測実行
- 状態表示: 現在プレイヤー、残り観測回数、勝敗結果
- 確率表示: 次に置く石の確率種別

## Game Rules
### 基本設定
- 盤面: 15×15グリッド
- 勝利条件: 観測時点で縦・横・斜めに3目以上連続して並んだプレイヤーの勝利

### 石の種類と確率
- 90%石: 黒になる確率90%、白になる確率10%
- 70%石: 黒になる確率70%、白になる確率30%
- 30%石: 黒になる確率30%、白になる確率70%
- 10%石: 黒になる確率10%、白になる確率90%

### プレイヤー別使用石
- 先手（黒プレイヤー）: 90%石 → 70%石 → 90%石 → 70%石...（交互に使用）
- 後手（白プレイヤー）: 10%石 → 30%石 → 10%石 → 30%石...（交互に使用）

### 観測ルール
- 各プレイヤーは1ゲーム中に最大5回まで観測可能
- 観測は自分が石を配置した後にのみ実行可能
- 観測実行時、盤面上の全ての石が確率に基づいてランダムに黒または白に決定される
- 観測で3目以上揃わなかった場合、盤面をリセット（全石を未観測状態に戻す）してゲーム続行
- 両プレイヤーが同時に3目以上揃った場合、観測を実行したプレイヤーの勝利
- 観測回数を使い切った場合、それ以降は観測不可

### ゲーム終了条件
- いずれかのプレイヤーが観測時に3目以上揃えた場合
- 両プレイヤーが観測回数を使い切り、かつ盤面が埋まった場合は引き分け

## Acceptance Style
- Use AC IDs with prefix QGM-, e.g. QGM-001.

---

## MVP-PLAY: Start-to-First-Move（プレイ可能までの最小追加仕様）

目的: 新規ゲーム作成直後に、盤上の任意の空セルをクリックすると、そのセルに未観測の確率石が配置され、ターン/手番が進む状態までを最小で実現する。

方針（優先案）
- 案A: 「配置（Moves）」のみ先に実装（観測は後続）。UI は未観測石をプレースホルダ色で表示。観測/勝敗は未対応でもよい。
- 案B: 配置 + 観測（Observations）まで実装。勝敗判定（3目以上）を観測時のみ行う。
- 案C: 配置 + 観測 + リセット/削除まで一括。

本ドキュメントでは、まず案A（Movesのみ）をAC化し、すぐに「クリックで置ける」状態を作る。観測/勝敗は後続ACで拡張する。

### データモデル整合メモ（実装便宜）
- `Stone` はセル内オブジェクト（`board[row][col]`）として保持する。`id`/`position` は省略してもよい（位置は配列の添字で一意）。
- `Stone` 例: `{ placedBy: 'BLACK'|'WHITE', turnPlaced: number, probabilityType: 'P90'|'P70'|'P30'|'P10', observedColor: 'BLACK'|'WHITE'|null }`
- `board` は 15x15 の 2 次元配列。空セルは `null`。

### API: Moves（配置）
- エンドポイント: `POST /api/quantum-gomoku/games/:id/moves`
- リクエスト（JSON）
  - `playerId`: `'BLACK' | 'WHITE'`（現在の手番と一致していること）
  - `position`: `{ row: number, col: number }`（0始まり、`0 <= row,col < 15`）
- 正常レスポンス: `200 { gameState }`
- 検証/エラー
  - `400 { code: 'INVALID_POSITION' }` 範囲外
  - `400 { code: 'CELL_OCCUPIED' }` 既に石あり
  - `409 { code: 'OUT_OF_TURN' }` 手番不一致
  - `400 { code: 'INVALID_ID' }` ID 形式不正（UUID v1〜v5 以外）
  - `404 { code: 'NOT_FOUND' }` ゲーム未存在

#### 配置時のルール
- 手番: 初期は `BLACK`。合法手であればそのセルに石を配置し、`currentPlayer` を相手に交代、`turnCount` を +1。
- 確率石の種別（未観測）
  - 先手（黒）: `P90 → P70 → P90 → P70 …` を交互
  - 後手（白）: `P10 → P30 → P10 → P30 …` を交互
- `observedColor` は常に `null`（案A）。表示は「未観測」の見た目を使う（下記UI参照）。
- 盤外・占有セル・手番違反はエラーで応答し、状態は変化しない。

### UI: クリックで配置（案A）
- 盤面セルクリックで `POST /moves` を呼ぶ。成功時は返却 `gameState` で UI を再描画。
- アクセシビリティ/セレクタ（既存に合わせる）
  - 盤: `[data-testid="board"]` / `role=grid`
  - セル: `[data-testid="cell-<row>-<col>"]` / `role=gridcell`（row/col は 0 始まり）
- 未観測石の表示（推奨）
  - `placedBy==='BLACK'` は濃いグレー、`'WHITE'` は淡いグレー（観測後は黒/白の確定色）。
  - これにより「クリック → その場で石が見える」を満たす。

### AC（案A: Moves のみ）
- QGM-010: 新規ゲーム作成後、任意の空セルをクリックすると 200 で `gameState` が更新され、そのセルに未観測石が描画される（UI）。
- QGM-011: 置いた後に `currentPlayer` が相手に交代し、`turnCount` が +1 になる（API/UI）。
- QGM-012: 黒手は `P90/P70`、白手は `P10/P30` が交互に割り当てられる（`Stone.probabilityType`）。
- QGM-013: 占有セルをクリックした場合は配置されず、`CELL_OCCUPIED` を返す。
- QGM-014: 手番と異なる `playerId` を送ると `OUT_OF_TURN` を返す。
- QGM-015: 範囲外 `position` は `INVALID_POSITION`。存在しない ID は `NOT_FOUND`。

### サンプル（curl）
```
# 1) 新規作成
curl -s -X POST localhost:3000/api/quantum-gomoku/games | jq

# 2) 先手の配置（例: (7,7) に黒P90）
curl -s -X POST \
  -H 'Content-Type: application/json' \
  -d '{"playerId":"BLACK","position":{"row":7,"col":7}}' \
  localhost:3000/api/quantum-gomoku/games/<GAME_ID>/moves | jq
```

### 後続（案B への拡張: 観測）
- エンドポイント: `POST /api/quantum-gomoku/games/:id/observations { playerId }`
- 動作: 盤上の全石について確率に従い `observedColor` を乱択。縦横斜めいずれかで3目以上の連続ができていれば、観測した側を勝者にして `status='finished'`/`winner` を設定。成立しなければ全石を未観測状態（`observedColor=null`）に戻して継続。
- 観測回数: 各プレイヤー最大5回。使い切ると以降不可。
