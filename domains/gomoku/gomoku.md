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

---

## Full Play Loop（観測・勝敗・リセット・削除まで）

### エラーモデル（統一）
- 形式: `{ code: string, message: string, details?: object }`
- 代表コード:
  - `INVALID_ID`（400）: UUID 形式不正（v1〜v5 いずれか）。
  - `NOT_FOUND`（404）: ゲーム未存在。
  - `INVALID_POSITION`（400）: `position` が範囲外。
  - `CELL_OCCUPIED`（400）: セルに既に石が存在。
  - `OUT_OF_TURN`（409）: 手番不一致。
  - `OBS_NOT_ALLOWED`（409）: 直前に自分が置いた手ではない／観測前提を満たさない。
  - `OBS_LIMIT_EXCEEDED`（409）: 観測回数を使い切っている。
  - `GAME_OVER`（409）: `status !== 'playing'`（終了/引き分け）。

### 確率 → 色の決定規則（観測時）
- `P90`: 黒=0.9, 白=0.1
- `P70`: 黒=0.7, 白=0.3
- `P30`: 黒=0.3, 白=0.7
- `P10`: 黒=0.1, 白=0.9
- 疑似乱数: 実装は `Math.random()` 等で良い。E2E の再現性を高めたい場合はオプションで `seed`（数値）を `POST /observations` のボディに許容してもよい（未指定時は非決定）。

### 勝利判定（観測時のみ）
- 連続3以上（縦・横・斜め）でその色の勝利。
- 両者同時成立時は「観測したプレイヤー」の勝利。
- 不成立なら盤は「未観測」状態に戻す（`observedColor=null` を全セルに適用）。

### API 仕様（詳細）

1) POST `/api/quantum-gomoku/games`
- 201 `{ gameId, gameState }`
- 初期値: `status='playing'`, `currentPlayer='BLACK'`, `winner=null`, `turnCount=0`, `blackObservationsRemaining=5`, `whiteObservationsRemaining=5`, `board=15x15 null`, `lastMover=null`。

2) GET `/api/quantum-gomoku/games/:id`
- 200 `{ gameState }` ／ 404 `NOT_FOUND` ／ 400 `INVALID_ID`

3) POST `/api/quantum-gomoku/games/:id/moves`
- リク: `{ playerId: 'BLACK'|'WHITE', position: { row:number, col:number } }`
- バリデーション: 範囲、占有、手番、ID形式、存在。
- 200 `{ gameState }`（配置反映、`turnCount+=1`, `currentPlayer` 交代, `lastMover=playerId`）
- 400/404/409: 上記エラーモデル参照。

4) POST `/api/quantum-gomoku/games/:id/observations`
- リク: `{ playerId: 'BLACK'|'WHITE', seed?: number }`
- 前提: `status='playing'` かつ `lastMover===playerId` かつ `observationsRemaining(playerId)>0`。
- 処理: 盤上すべての石に対し確率に基づき `observedColor` を一時決定→勝利判定。
  - 勝利あり: `status='finished'`, `winner=playerId`（同時成立時も同じ）。
  - 勝利なし: 全セル `observedColor=null` に戻し、ゲーム続行。
- 消費: 実行者の残り観測回数を 1 減少。
- 200 `{ observationResult, gameState }`
  - `observationResult`: `{ id, observedBy, turnExecuted, resultBoard, isWinning, winner, winningLine }`
- 409: `OBS_NOT_ALLOWED` / `OBS_LIMIT_EXCEEDED` / `GAME_OVER`
- 404/400: `NOT_FOUND` / `INVALID_ID`

5) POST `/api/quantum-gomoku/games/:id/reset`
- 動作: そのゲームの盤・状態を初期化し、同じ `id`/`createdAt` を維持。
- 200 `{ gameState }`

6) DELETE `/api/quantum-gomoku/games/:id`
- 動作: メモリ上のゲームを削除。
- 200 `{ success: true }` ／ 404 `NOT_FOUND`

### ステートマシン（簡易）
```
playing --(observation with win)--> finished
playing --(board full AND obs=0 for both)--> draw
finished/draw --(reset)--> playing
```
補足: `moves` は `playing` のみ許可。`observations` も同様。`delete` はどの状態でも可。

### UI 実装要件（最小）
- セレクタ（テスト安定化）
  - 盤: `[data-testid="board"]` / `role=grid`
  - セル: `[data-testid="cell-<row>-<col>"]` / `role=gridcell`
  - 新規作成: `[data-testid="new-game"]`
  - 観測: `[data-testid="observe"]`（ラベル例: `Observe (BLACK)`/`Observe (WHITE)`）
  - リセット: `[data-testid="reset-game"]`
  - 削除: `[data-testid="delete-game"]`
  - 既存ID入力: `#existing_id` + 送信 `[data-testid="load-game"]`（UUID v4 検証）
- フロー
  1. 起動時: `?gameId=` または localStorage の ID を読み、無ければ新規作成。
  2. セルクリック: `POST /moves`（`playerId` は `currentPlayer`）。200 なら返却 `gameState` で再描画。
  3. 観測ボタン: 直前手の実行者のみ有効。クリックで `POST /observations` → 返却に従い再描画。
  4. リセット/削除: 該当 API 実行。削除後は新規作成へ。
- 表示
  - ステータスバー: `id`, `turnCount`, `currentPlayer`, `black/white observationsRemaining`, `status`, `winner?`
  - 未観測石: 黒=濃グレー/白=淡グレー、観測済みは黒/白の確定色。
  - 確率ラベル（新規）: 未観測石上に確率を数値で表示（`90%/70%/30%/10%`）。
    - E2E向け属性: 石要素に `data-testid="stone"` と `data-prob="90|70|30|10"` を付与し、テキストノードに同じ数値を描画。
    - `aria-label` には `placedBy` と確率種（例: `BLACK P90`）を含める。
    - 観測により `observedColor` が確定した石は確率ラベルを非表示にし、色のみを表示。
  - 観測回数 表示（新規）: 双方の「使用済み/残り」を可視化。
    - `data-testid="obs-remaining-black"`, `obs-remaining-white`
    - `data-testid="obs-used-black"`, `obs-used-white`（`used = 5 - remaining`）
  - 次に置く確率種: `currentPlayer` に応じたローテーションを小さく表示（任意だが推奨）。
  - 観測ボタンの有効化ルール: `status==='playing'` かつ `lastMover` がボタンラベルに表示されているプレイヤーで、その `observationsRemaining>0` のときのみ `enabled`。それ以外は `disabled`（`aria-disabled` でも可）。

参考 UI 構造（例）
```
<button data-testid="observe" disabled>Observe (BLACK)</button>
<div role="status">
  <span data-testid="obs-remaining-black">BLACK obs remaining: 5</span>
  <span data-testid="obs-used-black">BLACK obs used: 0</span>
  <span data-testid="obs-remaining-white">WHITE obs remaining: 5</span>
  <span data-testid="obs-used-white">WHITE obs used: 0</span>
</div>
<!-- 石（未観測） -->
<span data-testid="stone" data-prob="90" aria-label="BLACK P90">90%</span>
```

### Acceptance Criteria（実装完了の定義）
- QGM-001: 新規作成が 201 で返る（初期値は上記）。
- QGM-002: GET 取得が 200、未存在は 404 `NOT_FOUND`。
- QGM-010: 空セルクリックで未観測石が描画される（UI/POST /moves）。
- QGM-011: 配置後に `currentPlayer` が交代し `turnCount` が +1。
- QGM-012: 確率種ローテーションが手番ごとに交互（黒: P90→P70…／白: P10→P30…）。
- QGM-013: 占有セルは `CELL_OCCUPIED`、範囲外は `INVALID_POSITION`、手番違反は `OUT_OF_TURN`。
- QGM-016: 未観測石には確率ラベル（90/70/30/10%）が表示され、`data-prob` とテキストが一致する。観測確定後は確率ラベルが非表示になる。
- QGM-020: 観測実行で `observationsRemaining` が実行者のみ 1 減少。
- QGM-021: 観測は直前手の実行者のみ可能（それ以外は `OBS_NOT_ALLOWED`）。
- QGM-022: 観測で勝利が成立したら `status='finished'` と `winner` を設定（同時成立時は観測者の勝利）。
- QGM-023: 勝利不成立なら全 `observedColor` が `null` に戻る。
- QGM-024: 観測回数を使い切ると以降の観測は `OBS_LIMIT_EXCEEDED`。
- QGM-025: 観測ボタン `[data-testid="observe"]` が常に表示され、有効/無効がルールに従って切り替わる。ラベルは `Observe (BLACK|WHITE)` で現在の対象（`lastMover`）を示す。
- QGM-026: UI に双方の観測カウンタが表示される（`obs-used-*` と `obs-remaining-*`）。配置/観測操作に応じて値が正しく更新される。
- QGM-030: リセットで同一 `id`/`createdAt` を保持したまま初期状態に戻る。
- QGM-031: 削除で `{ success:true }`。以後 GET は 404。
- QGM-040: 両者の観測回数が 0 で、かつ盤が埋まったら `status='draw'`。

### 実装メモ（非規範だが参考）
- `lastMover` を `observations` のガードに利用（`lastMover===playerId` のみ可）。
- 勝利判定は 8 方向（実装は4方向で対称処理）×連続長カウントで 3 以上。
- `reset` は `id/createdAt` を残し、それ以外は初期化。
- メモリ実装で十分（再起動でクリア）。
