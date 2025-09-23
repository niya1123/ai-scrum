import { test, expect } from '@playwright/test'

/**
 * UI E2E Skeletons (skipped until features land)
 * - Follows Architect’s tooling: Playwright (@playwright/test)
 * - Uses stable selectors per AC: [data-testid="board"] and [data-testid="cell-<row>-<col>"]
 * - Each test includes: 前提 (preconditions), 操作 (actions), 期待 (expectations)
 */

test.describe('Quantum Gomoku UI — AC skeletons', () => {
  test.skip('[AC: QGM-004] 15x15グリッドの描画とセレクタ安定性', async ({ page }) => {
    // 前提: 開発/本番サーバ起動済み、トップページで新規ゲームがロードされる
    await page.goto('/')

    // 操作: 画面を開く

    // 期待: data-testidとARIAロールが安定
    await expect(page.getByTestId('board')).toBeVisible()
    await expect(page.getByRole('grid')).toBeVisible()
    await expect(page.getByRole('gridcell')).toHaveCount(15 * 15)
    await expect(page.getByTestId('cell-0-0')).toHaveAttribute('data-testid', 'cell-0-0')
  })

  test.skip('[AC: QGM-010] クリックで空セルに未観測石が配置されUIが再描画', async ({ page }) => {
    // 前提: 新規ゲーム作成済み (トップで自動作成or明示ボタン)
    await page.goto('/')

    // 操作: 空セル(7,7)をクリック
    const target = page.getByTestId('cell-7-7')
    await target.click()

    // 期待: ステータス表示が更新 (Turn: 1, Current: WHITE) かつ セルに未観測石のマーカー
    const status = page.getByRole('status')
    await expect(status).toContainText('Turn: 1')
    await expect(status).toContainText('Current: WHITE')
    // TODO: マーカーの安定セレクタを定義（例: getByTestId('stone') or hasClass('marker--black')）
    // await expect(target.locator('[data-testid="stone"]')).toBeVisible()
  })

  test.skip('[AC: QGM-011] 合法配置後に手番が相手へ交代', async ({ page }) => {
    // 前提: 初期状態はBLACKの手番
    await page.goto('/')

    // 操作: BLACKが任意の空セルをクリック
    await page.getByTestId('cell-0-0').click()

    // 期待: 現在の手番がWHITEへ
    const status = page.getByRole('status')
    await expect(status).toContainText('Current: WHITE')
  })

  test.skip('[AC: QGM-005] 未観測石の見た目がBLACK/WHITEで識別可能', async ({ page }) => {
    // 前提: 1手目BLACKで石配置済み
    await page.goto('/')
    await page.getByTestId('cell-1-1').click()

    // 操作: UI上の未観測石のマーカー確認
    const c = page.getByTestId('cell-1-1')
    // 期待: BLACKとWHITEで視覚的に異なる（色/クラス/テストIDなど）。具体セレクタは実装で固定化。
    // 例: await expect(c.locator('[data-testid="stone"]')).toHaveClass(/marker--black/)
  })
})

