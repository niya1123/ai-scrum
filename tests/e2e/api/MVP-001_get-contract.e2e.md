[Suite] MVP-001 GET 契約の統一（shape と id 検証）

- [AC: QGM-003] GET は 200 と `{ gameState }` を返す（ラップ形）
  - Preconditions:
    - Existing `gameId` from create.
  - Steps:
    1) GET `/api/quantum-gomoku/games/:id`.
  - Expected:
    - 200 OK.
    - Body shape: `{ gameState }`（直返しではなくラップ）。
    - `gameState.id === :id`、初期状態と整合。

- [AC: QGM-033] ステータス規約: invalid id は 400、unknown id は 404
  - Preconditions:
    - N/A
  - Steps:
    1) GET `/api/quantum-gomoku/games/not-a-uuid`.
    2) GET `/api/quantum-gomoku/games/00000000-0000-4000-8000-000000000000`.
  - Expected:
    - Step1 → `400` + `{ code:'INVALID_ID' }`。
    - Step2 → `404` + `{ code:'NOT_FOUND' }`。

- [AC: QGM-034] エラー本文 shape の遵守
  - Preconditions:
    - N/A
  - Steps:
    1) 上記 400/404 レスポンス本文を検査。
  - Expected:
    - `{ code:string, message:string, details?:object }` を満たす。

# 備考
- Playwright を前提（config/playwright.config.ts）。
- 既存自動テスト: `tests/e2e/quantum-gomoku.mvp-001.spec.ts` と `tests/e2e/quantum-gomoku.mvp-002-invalid-id.spec.ts` に合流/固定。

