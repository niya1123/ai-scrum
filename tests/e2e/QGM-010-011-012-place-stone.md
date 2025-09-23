# [AC: QGM-010] UI draws stone on success
# [AC: QGM-011] currentPlayer flips, turnCount+=1
# [AC: QGM-012] Probability rotation per player per turn

Preconditions:
- API server running at `${BASE_URL}`.
- UI running at `${APP_URL}`.
- Board renders with selectors per AC S05.

Steps (Happy Path):
1) Create a game (POST `${BASE_URL}/games`) and navigate UI to `${APP_URL}/?gameId={gameId}`.
2) Assert board presence: `[data-testid="board"][role="grid"]` with 15×15 cells.
3) Click an empty cell `[data-testid="cell-7-7"]`.
4) Wait for UI to redraw cell `7,7` to include `[data-testid="stone"]`.
5) Fetch game state via GET `${BASE_URL}/games/{gameId}`.

Expected:
- [QGM-010] Cell `7,7` contains a visible stone placeholder.
- [QGM-011] `currentPlayer` flips from `BLACK` to `WHITE`; `turnCount` increments by 1.
- [QGM-012] Probability rotation advances correctly based on the placing player for that turn:
  - For BLACK placements: sequence `P90 -> P70 -> P30 -> P10 -> (repeat)`.
  - For WHITE placements: sequence `P10 -> P30 -> P70 -> P90 -> (repeat)`.
- The placed stone at `7,7` has `probabilityType` equal to the expected value for that player's turn.
- (If AC S08 implemented) The stone element includes `data-testid="stone"` with `data-prob` matching `90|70|30|10` and visible text like `90%`.
