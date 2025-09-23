import type { PlaywrightTestConfig } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve, isAbsolute } from 'node:path'

const PORT = Number(process.env.PORT || 3000)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`
const HTML_REPORT_DIR = process.env.PLAYWRIGHT_HTML_REPORT || 'playwright-report'
const JSON_REPORT_FILE = process.env.PLAYWRIGHT_JSON_REPORT
const OUTPUT_DIR = process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results'
const TRACE = (process.env.PLAYWRIGHT_TRACE as 'on' | 'off' | 'retain-on-failure' | undefined) || 'retain-on-failure'
const SCREENSHOT = (process.env.PLAYWRIGHT_SCREENSHOT as 'off' | 'on' | 'only-on-failure' | undefined) || 'only-on-failure'
const WORKERS = Number(process.env.PW_WORKERS || process.env.PLAYWRIGHT_WORKERS || 1)

const mode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || 'prod' // 'dev' | 'prod'
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1'

const command =
  mode === 'dev'
    ? 'npm run dev'
    : 'npm run start'

// Reporters: always HTML (never auto-open); conditionally JSON when PLAYWRIGHT_JSON_REPORT is set
const reporters: any[] = [['html', { outputFolder: HTML_REPORT_DIR, open: 'never' as const }]]
if (JSON_REPORT_FILE) {
  const resolved = isAbsolute(JSON_REPORT_FILE)
    ? JSON_REPORT_FILE
    : resolve(process.cwd(), JSON_REPORT_FILE)
  try {
    mkdirSync(dirname(resolved), { recursive: true })
  } catch {}
  reporters.push(['json', { outputFile: resolved }])
}

// Optional debug of resolved reporter config
if (process.env.PW_CONF_DEBUG === '1') {
  console.log('[playwright.config] BASE_URL=%s', BASE_URL)
  console.log('[playwright.config] HTML_REPORT_DIR=%s', HTML_REPORT_DIR)
  console.log('[playwright.config] JSON_REPORT_FILE=%s', JSON_REPORT_FILE || '(unset)')
  console.log('[playwright.config] reporters=%o', reporters)
}

const config: PlaywrightTestConfig = {
  // Resolve relative to this config file (config/ → project root tests)
  testDir: '../tests/e2e',
  timeout: 30_000,
  workers: WORKERS,
  outputDir: OUTPUT_DIR,
  reporter: reporters,
  use: {
    baseURL: BASE_URL,
    trace: TRACE,
    screenshot: SCREENSHOT,
  },
  webServer: skipWebServer
    ? undefined
    : {
        command,
        env: { PORT: String(PORT) },
        reuseExistingServer: true,
        timeout: 40_000,
        url: BASE_URL,
      },
}

export default config
