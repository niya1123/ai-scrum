import { test, expect } from '@playwright/test';

/**
 * Quantum Gomoku API E2E (Playwright)
 * - Active tests focus on MVP-001 minimal happy path (QGM-001, QGM-003, QGM-002).
 * - Additional AC tests are scaffolded as skipped to avoid breaking CI until implemented.
 */

function expectBoard15x15(board: unknown) {
  expect(Array.isArray(board)).toBe(true);
  const rows = board as unknown[];
  expect(rows.length).toBe(15);
  for (const r of rows) {
    expect(Array.isArray(r)).toBe(true);
    expect((r as unknown[]).length).toBe(15);
  }
}

test.describe('Quantum Gomoku API', () => {
  test('[AC: QGM-001] 新規ゲーム作成は201と初期stateを返す', async ({ request }) => {
    const res = await request.post('/api/quantum-gomoku/games', {
      headers: { 'content-type': 'application/json' },
      data: {},
    });
    expect(res.status(), await res.text()).toBe(201);
    const body = await res.json();

    // Shape: { gameId, gameState }
    expect(body).toHaveProperty('gameId');
    expect(typeof body.gameId).toBe('string');
    expect(body).toHaveProperty('gameState');
    const gs = body.gameState;

    // Initial state per AC
    expect(gs).toHaveProperty('status', 'playing');
    expect(gs).toHaveProperty('currentPlayer', 'BLACK');
    expect(gs).toHaveProperty('winner', null);
    expect(gs).toHaveProperty('turnCount', 0);
    expect(gs).toHaveProperty('blackObservationsRemaining');
    expect(gs.blackObservationsRemaining).toBeGreaterThanOrEqual(5);
    expect(gs).toHaveProperty('whiteObservationsRemaining');
    expect(gs.whiteObservationsRemaining).toBeGreaterThanOrEqual(5);
    expect(gs).toHaveProperty('board');
    expectBoard15x15(gs.board);
  });

  test('[AC: QGM-003] 既存ゲーム取得は200で同一stateを返す', async ({ request }) => {
    const create = await request.post('/api/quantum-gomoku/games', {
      headers: { 'content-type': 'application/json' },
      data: {},
    });
    expect(create.status()).toBe(201);
    const { gameId, gameState: created } = await create.json();

    const get = await request.get(`/api/quantum-gomoku/games/${gameId}`);
    expect(get.status(), await get.text()).toBe(200);
    const gs = await get.json();

    // Same id/state invariants
    expect(gs).toHaveProperty('id');
    expect(gs.id === gameId || gs.id == created.id).toBeTruthy();
    expect(gs).toHaveProperty('turnCount', 0);
    expect(gs).toHaveProperty('status', 'playing');
    expectBoard15x15(gs.board);
  });

  test('[AC: QGM-002] boardはGETで15x15正方である', async ({ request }) => {
    const create = await request.post('/api/quantum-gomoku/games', {
      headers: { 'content-type': 'application/json' },
      data: {},
    });
    expect(create.status()).toBe(201);
    const { gameId } = await create.json();

    const get = await request.get(`/api/quantum-gomoku/games/${gameId}`);
    expect(get.status()).toBe(200);
    const gs = await get.json();
    expectBoard15x15(gs.board);
  });

  test('[AC: QGM-004] 不存在idのGETは404とNOT_FOUND', async ({ request }) => {
    const bad = await request.get(`/api/quantum-gomoku/games/nonexistent-${Date.now()}`);
    expect(bad.status()).toBe(404);
    const b = await bad.json().catch(async () => ({ raw: await bad.text() }));
    expect(b).toHaveProperty('code');
    expect(String(b.code)).toBe('NOT_FOUND');
  });

  // --- Scaffolds below: skipped until endpoints are implemented ---

  test.skip('[AC: QGM-006] 手番不一致は409 NOT_YOUR_TURN', async () => {});
  test.skip('[AC: QGM-007] 範囲外は400 OUT_OF_BOUNDS', async () => {});
  test.skip('[AC: QGM-008] 占有セルは409 CELL_OCCUPIED', async () => {});
  test.skip('[AC: QGM-009] 成功時に確率種別が設定される', async () => {});
  test.skip('[AC: QGM-010] 成功後turnCount/手番交代/lastMover', async () => {});
  test.skip('[AC: QGM-011] ゲーム終了時は409 GAME_FINISHED', async () => {});
  test.skip('[AC: QGM-012] 不存在ゲームへのmovesは404', async () => {});

  test.skip('[AC: QGM-013] 観測はlastMoverのみ許可', async () => {});
  test.skip('[AC: QGM-014] 観測残回数0は409', async () => {});
  test.skip('[AC: QGM-015] 観測時のランダム崩壊', async () => {});
  test.skip('[AC: QGM-016] 観測レスポンス構造', async () => {});
  test.skip('[AC: QGM-017] 3連以上の勝利判定', async () => {});
  test.skip('[AC: QGM-018] 同時成立時のtie-break', async () => {});
  test.skip('[AC: QGM-019] 不成立時の巻き戻し', async () => {});
  test.skip('[AC: QGM-020] 観測後の残回数減算', async () => {});
  test.skip('[AC: QGM-021] 観測直後の再観測不可', async () => {});
  test.skip('[AC: QGM-022] 終了時の観測は409', async () => {});
  test.skip('[AC: QGM-023] 不存在ゲーム観測は404', async () => {});

  test.skip('[AC: QGM-024] 勝利成立でfinishedとwinner設定', async () => {});
  test.skip('[AC: QGM-025] 終了後の行為は409', async () => {});

  test.skip('[AC: QGM-026] 引き分け条件成立でdraw', async () => {});
  test.skip('[AC: QGM-027] 引き分け後の行為は409', async () => {});

  test.skip('[AC: QGM-028] リセットは初期stateで返す', async () => {});
  test.skip('[AC: QGM-029] 削除後GETは404', async () => {});
  test.skip('[AC: QGM-030] 終了/引き分けでもreset/delete可', async () => {});
  test.skip('[AC: QGM-031] 不存在IDのreset/deleteは404', async () => {});
});

