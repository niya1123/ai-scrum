import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.join(__dirname, '..')

const PORT = Number(process.env.PORT || 3000)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`
const HTML_REPORT = process.env.PLAYWRIGHT_HTML_REPORT || 'playwright-report'
const JSON_REPORT = process.env.PLAYWRIGHT_JSON_REPORT
const OUTPUT_DIR = process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results'
const TRACE = (process.env.PLAYWRIGHT_TRACE as 'on' | 'off' | 'retain-on-failure' | undefined) || 'retain-on-failure'
const WORKERS = Number(process.env.PLAYWRIGHT_WORKERS || 1)
const HEADLESS = process.env.PLAYWRIGHT_HEADLESS !== '0'
const WEB_SERVER_MODE = process.env.PLAYWRIGHT_WEB_SERVER_MODE || 'dev'
const WEB_SERVER_COMMAND = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
const WEB_SERVER_TIMEOUT = Number(process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT || 40_000)
const SHOULD_START_WEB_SERVER = process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== '1'

const resolveWithinRoot = (target: string) => (path.isAbsolute(target) ? target : path.join(ROOT_DIR, target))

const reporters: any[] = [
  ['html', { outputFolder: resolveWithinRoot(HTML_REPORT), open: 'never' }],
]

if (JSON_REPORT) {
  reporters.push(['json', { outputFile: resolveWithinRoot(JSON_REPORT) }])
}

const webServer = SHOULD_START_WEB_SERVER
  ? {
      command:
        WEB_SERVER_COMMAND ||
        (WEB_SERVER_MODE === 'prod' ? 'npm run start' : 'npm run dev'),
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PORT: String(PORT),
        BASE_URL,
      },
      port: PORT,
      reuseExistingServer: true,
      timeout: WEB_SERVER_TIMEOUT,
    }
  : undefined

export default defineConfig({
  // Allow both legacy root tests and per-domain tests under trip/* and todo/*
  testDir: ROOT_DIR,
  testMatch: [
    'tests/e2e/**/*.spec.ts',
    'trip/tests/e2e/**/*.spec.ts',
    'todo/tests/e2e/**/*.spec.ts',
  ],
  timeout: 40_000,
  expect: { timeout: 5_000 },
  reporter: reporters as any,
  outputDir: resolveWithinRoot(OUTPUT_DIR),
  workers: WORKERS,
  webServer,
  use: {
    baseURL: BASE_URL,
    trace: TRACE,
    headless: HEADLESS,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
