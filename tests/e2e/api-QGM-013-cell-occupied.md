# [AC: QGM-013] 異常系: 占有セルに配置 → 400 CELL_OCCUPIED（状態不変）

Preconditions
- Server running at `<BASE_URL>`.
- New game created; place one legal stone at `(r, c)`.

Operations
- POST the same `(r, c)` again as the next move.

Expected Results
- Status 400 with `{ code: 'CELL_OCCUPIED' }`.
- Game state remains unchanged (turnCount, currentPlayer, board).

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

