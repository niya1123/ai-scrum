# [AC: QGM-001, QGM-010, QGM-011, QGM-012] MVP happy path — GREEN first

Preconditions:
- API and UI are running.

Steps:
1) Create a new game (201) and open UI with `?gameId=...`.
2) Click a center cell (e.g., `7,7`).
3) Verify stone is drawn in UI.
4) Verify `currentPlayer` flipped and `turnCount` incremented via API.
5) Verify placed stone's `probabilityType` is correct for that player's turn.

Expected:
- All checks pass; no errors are shown.
