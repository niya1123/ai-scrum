# E2E Test Skeleton (Tool-Agnostic)

- Runner: To be confirmed by Architect (e.g., Playwright/Cypress/WebdriverIO).
- This directory contains human-readable test skeletons that map 1:1 to AC IDs.
- Environment:
  - `BASE_URL`: Base URL for API (e.g., http://localhost:3000/api)
  - `APP_URL`: Base URL for UI (e.g., http://localhost:3000)
- Selectors (per AC QGM-S05):
  - Board: `[data-testid="board"][role="grid"]`
  - Cell: `[data-testid="cell-<row>-<col>"][role="gridcell"]`
  - New Game Button: `[data-testid="new-game"]`
  - Stone: within a cell, `[data-testid="stone"]` (if present)
  - Probability label: `[data-testid="stone"][data-prob]` with visible text like `90%` (AC S08, Could)
- Notes:
  - Tests below specify Preconditions, Steps, and Expected; translate into the chosen runner later.
  - Minimal happy path must be GREEN first.
