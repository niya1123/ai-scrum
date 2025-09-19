import { expect, test, type Page } from '@playwright/test'
import { createTask, listTasks, resetTasks } from './_helpers'

async function gotoHome(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(page.locator('[role="list"][aria-label="tasks"]')).toBeVisible()
}

test.describe('Tasks UI acceptance', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-001-AC3] Newly created task appears at top unchecked', async ({ page }) => {
    await gotoHome(page)

    const input = page.locator('#new_task')
    await input.fill('  Sample Task  ')
    await input.press('Enter')

    const list = page.getByRole('list', { name: 'tasks' })
    const firstItem = list.locator('[role="listitem"]').first()
    await expect(firstItem).toContainText('Sample Task')
    await expect(firstItem.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
  })

  test('[AC: TDA-002-AC2] Tasks render newest first in list region', async ({ page, request, baseURL }) => {
    await createTask(request, 'older task', baseURL)
    await new Promise(resolve => setTimeout(resolve, 10))
    await createTask(request, 'newer task', baseURL)

    await gotoHome(page)

    const list = page.getByRole('list', { name: 'tasks' })
    const items = list.locator('[role="listitem"]')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('newer task')
  })

  test('[AC: TDA-002-AC3] Empty state shows accessible message when no tasks', async ({ page }) => {
    await gotoHome(page)

    const list = page.getByRole('list', { name: 'tasks' })
    await expect(list.locator('[role="listitem"]')).toHaveCount(0)
    await expect(page.getByTestId('empty-tasks')).toContainText('No tasks yet.')
  })

  test('[AC: TDA-003-AC3] Checkbox toggle updates UI without navigation', async ({ page, request, baseURL }) => {
    const seeded = await createTask(request, 'toggle me', baseURL)

    await gotoHome(page)

    const list = page.getByRole('list', { name: 'tasks' })
    const checkbox = list.locator('[role="listitem"]').first().getByRole('checkbox')
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')

    const beforeUrl = page.url()
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    await expect(page).toHaveURL(beforeUrl)

    const tasks = await listTasks(request, baseURL)
    expect(tasks.find(t => t.id === seeded.id)?.done).toBe(true)
  })

  test('[AC: TDA-004-AC2] Delete button removes row inline without reload', async ({ page, request, baseURL }) => {
    await createTask(request, 'keep me', baseURL)
    const removable = await createTask(request, 'remove me', baseURL)

    await gotoHome(page)

    const list = page.getByRole('list', { name: 'tasks' })
    const items = list.locator('[role="listitem"]')
    await expect(items).toHaveCount(2)

    const beforeUrl = page.url()
    await list.locator('[role="listitem"]').first().getByTestId('delete-task').click()
    await expect(page).toHaveURL(beforeUrl)
    await expect(list.locator('[role="listitem"]')).toHaveCount(1)
    await expect(list.locator('[role="listitem"]').first()).toContainText('keep me')

    const tasks = await listTasks(request, baseURL)
    expect(tasks.some(t => t.id === removable.id)).toBe(false)
  })

  test('[AC: TDA-016] Blank title surfaces TITLE_REQUIRED alert beside input', async ({ page }) => {
    await gotoHome(page)

    const input = page.locator('#new_task')
    await input.fill('   ')
    await input.press('Enter')

    const errorAlert = page.getByRole('alert').filter({ hasText: 'TITLE_REQUIRED' })
    await expect(errorAlert).toBeVisible()
    const list = page.getByRole('list', { name: 'tasks' })
    await expect(list.locator('[role="listitem"]')).toHaveCount(0)
  })
})
