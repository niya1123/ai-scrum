# Quantum Gomoku UI — Stable Selectors

This document lists the stable selectors for E2E and manual QA. The UI is implemented under `domains/quantum-gomoku/src/ui/` and rendered at `/`.

- Board: `[data-testid="board"]` (also `role=grid`)
- Cells: `[data-testid="cell-<row>-<col>"]` (also `role=gridcell`)
- New Game: `[data-testid="new-game"]`
- Load Existing: `#existing_id` + `[data-testid="load-game"]`
- Status Bar: `[role="status"]`
- Error: `[role="alert"]`
- Stone marker (placed):
  - Element: `[data-testid="stone"]`
  - Color class: `.marker--black` or `.marker--white`
  - Data attributes:
    - `data-stone-player="BLACK|WHITE"` — the player who placed the stone
    - `data-stone-observed="true|false"` — whether the stone has been observed

Notes
- Grid size is fixed to 15×15 (`BOARD_SIZE=15`).
- First move: `currentPlayer='BLACK'` → after one legal move: `Turn: 1`, `Current: WHITE`.
- The UI disables the Load button until the Game ID matches UUID v4 format; on submit errors, an alert appears with an error code.

