# [AC: QGM-010] 正常系: 盤面クリックで配置 → 再描画

Preconditions
- App served with UI connected to API at `<BASE_URL>`.
- Board rendered with `[data-testid="board"][role="grid"]` and cells `[data-testid="cell-<row>-<col>"][role="gridcell"]`.
- New game is created on load or via explicit action; initial `currentPlayer = BLACK`, `turnCount = 0`.

Operations
- Click an empty cell, e.g., `[data-testid="cell-7-7"]`.

Expected Results
- UI triggers `POST /api/quantum-gomoku/games/:id/moves` and receives 200.
- The clicked cell renders an unobserved stone placeholder:
  - BLACK move → dark gray placeholder
  - WHITE move → light gray placeholder

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool (e.g., Playwright selectors).

