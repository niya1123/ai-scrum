# Quantum Gomoku — 最小UI（Dev-FE）

目的: Planner の E2E 雛形（MVP-008）で要求される最小の UI をサーバー API に接続せずに破壊なく提供し、今後の BE 実装（moves/observe）に備える。

エンドポイント（利用範囲）
- POST `/api/quantum-gomoku/games` — 新規作成
- GET `/api/quantum-gomoku/games/:id` — 取得（404 ハンドリングあり）

配置規約
- ドメイン固有 UI: `domains/quantum-gomoku/src/ui/*`
- ルート: `/`（Quantum Gomoku 最小 UI）。既存 Tasks UI は `/tasks` に移動。

UI 要素/セレクタ
- 盤: `[data-testid="board"]` / `role=grid`
- セル: `[data-testid="cell-<row>-<col>"]` / `role=gridcell`
- 作成: `[data-testid="new-game"]`
- 復元: `#existing_id` + `[data-testid="load-game"]`
- 状態表示: `role=status`
- エラー: `role=alert`

バリデーション
- 既存 ID 入力は必須（空: "Game ID is required"）。
- 形式チェック: UUID v4 正規表現に一致しない場合 "Invalid format: must be UUID v4"。
- 相関チェック: 取得が 404 の場合 "Game not found" を `role=alert` で表示。

既知の制限
- moves/observe は BE のエンドポイント実装待ち（FE 側ハンドラは無効化済み）。
- winningLine ハイライトは API が提供するまで未対応。

起動/確認
```
PORT=3000 npm run dev
# UI: http://localhost:3000/
# Tasks UI: http://localhost:3000/tasks
```

将来対応（BE 完了後）
- `POST /api/quantum-gomoku/games/:id/moves` の接続と占有セル無効化。
- `POST /api/quantum-gomoku/games/:id/observe` 連携、観測可能タイミングの制御、rollback/win 表示。
- 勝利ライン `winningLine` が API で提供されたらグリッド上で強調表示。

