# [AC: QGM-014] 異常系: 手番不一致 → 409 OUT_OF_TURN（状態不変）

Preconditions
- Server running at `<BASE_URL>`.
- New game created; it's BLACK's turn.

Operations
- Attempt a move specifying WHITE as mover or otherwise forcing out-of-turn per API contract (e.g., client-side misuse if API requires player info).

Expected Results
- Status 409 with `{ code: 'OUT_OF_TURN' }`.
- Game state remains unchanged.

Notes
- If API infers mover from server-side state, construct an out-of-turn by performing two sequential moves without swapping player context (depends on API design). Clarify with Architect/Dev-BE if needed.
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

