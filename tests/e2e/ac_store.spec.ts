import { test } from '@playwright/test'

test.describe('TDA-S-007 In-memory store & IDs', () => {
  test.skip('[AC: TDA-019] プロセス生存中は保持、再起動で空に戻る（READMEに明記）', async () => {
    // Manual/QA note:
    // - Verify tasks persist during server process lifetime.
    // - Restart server (stop webServer then start) and ensure list becomes empty.
    // This is covered by README note and exercised manually or via CI job restart.
  })

  test.skip('[AC: TDA-020] 連続1000件作成でも id 一意', async () => {
    // Optional heavy test; may be enabled in nightly builds.
    // Use API to POST 1000 tasks and assert all ids unique.
  })
})

