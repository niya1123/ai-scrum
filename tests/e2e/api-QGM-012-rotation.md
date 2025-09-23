# [AC: QGM-012] 正常系: ProbabilityType ローテーション（黒/白）

Preconditions
- Server running at `<BASE_URL>`.
- New game created; `gameId` available.

Operations
1) Make a sequence of legal moves alternating players to observe rotation.
   - BLACK moves 1st: expect P90
   - WHITE moves 2nd: expect P10
   - BLACK moves 3rd: expect P70
   - WHITE moves 4th: expect P30
   - ... continue pattern minimally to assert alternation

Expected Results
- Each placed stone has `probabilityType` matching the sequence:
  - BLACK: P90 → P70 → ...
  - WHITE: P10 → P30 → ...

Notes
- If probability is not returned directly on cell, expose via move result or inspect server-side structure as per API.
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

