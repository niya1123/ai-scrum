import { test, expect } from '@playwright/test'

test.describe('スモークテスト', () => {
  test('トップページが正常にロードされる', async ({ page }) => {
    await page.goto('/')
    
    // ページタイトルにAI Scrumが含まれることを確認
    await expect(page.locator('h1')).toContainText('AI Scrum')
    
    // ページが正常に表示されることを確認
    await expect(page).toHaveTitle(/Next/)
  })

  test('ページに基本的なコンテンツが含まれている', async ({ page }) => {
    await page.goto('/')
    
    // メインコンテンツが表示されることを確認
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // スクラム自動化の説明文が表示されることを確認
    await expect(page.locator('text=このリポジトリはスクラム自動化')).toBeVisible()
  })
})
