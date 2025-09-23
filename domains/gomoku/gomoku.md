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