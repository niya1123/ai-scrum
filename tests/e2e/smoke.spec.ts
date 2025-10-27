import { test, expect } from '@playwright/test'

test.describe('スモークテスト', () => {
  test('トップページが正常にロードされる', async ({ page }) => {
    await page.goto('/')
    
    // ページタイトルが存在することを確認
    await expect(page.locator('h1')).toContainText('AI Scrum')
    
    // ページが正常に表示されることを確認
    await expect(page).toHaveTitle(/Next/)
  })

  test('ページに基本的なコンテンツが含まれている', async ({ page }) => {
    await page.goto('/')
    
    // メインコンテンツが表示されることを確認
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // 説明文が含まれていることを確認
    await expect(page.locator('text=このリポジトリはスクラム自動化')).toBeVisible()
  })
})
