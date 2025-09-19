#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const DEFAULT_DEV_TIMEOUT = 40_000
const DEFAULT_PROD_TIMEOUT = 120_000
const POLL_INTERVAL = 500

async function getEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      server.close(() => resolve(port))
    })
  })
}

async function runCommand(command, args, env, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env })
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${label} terminated by signal ${signal}`))
        return
      }
      if (code !== 0) {
        reject(new Error(`${label} exited with code ${code}`))
        return
      }
      resolve(undefined)
    })
  })
}

function startServer({ command, args, env }) {
  const child = spawn(command, args, {
    env,
    stdio: 'inherit',
    shell: false,
  })
  return child
}

function startServerWithShell(command, env) {
  return spawn(command, {
    env,
    stdio: 'inherit',
    shell: true,
  })
}

async function waitForServerReady(url, timeoutMs, serverProcess) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Server process exited early with code ${serverProcess.exitCode}`)
    }
    if (serverProcess.signalCode) {
      throw new Error(`Server process was killed with signal ${serverProcess.signalCode}`)
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3_000)
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (response.status < 500) {
          return
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          // swallow and retry
        }
      }
    } catch (e) {
      // ignore and retry
    }

    await delay(POLL_INTERVAL)
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for server at ${url}`)
}

async function stopServer(child) {
  if (!child) return
  if (child.exitCode !== null || child.signalCode) return
  await new Promise((resolve) => {
    child.once('exit', () => resolve(undefined))
    child.kill('SIGTERM')
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL')
      }
    }, 5_000)
  })
}

async function runPlaywright(env) {
  const cli = join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js')

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [cli, 'test', '-c', 'config/playwright.config.ts', ...process.argv.slice(2)],
      { stdio: 'inherit', env }
    )

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`playwright exited by signal ${signal}`))
        return
      }
      resolve(code ?? 1)
    })
  })
}

async function main() {
  const portEnv = process.env.PORT
  const port = Number(portEnv) > 0 ? Number(portEnv) : await getEphemeralPort()
  const baseURL = process.env.BASE_URL || `http://localhost:${port}`
  const headless = process.env.PLAYWRIGHT_HEADLESS ?? '1'
  const mode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || 'prod'
  const workers = process.env.PLAYWRIGHT_WORKERS || '1'
  const reportDir = process.env.PLAYWRIGHT_HTML_REPORT || 'playwright-report'
  const jsonReport = process.env.PLAYWRIGHT_JSON_REPORT
  const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || 'test-results'
  const trace = process.env.PLAYWRIGHT_TRACE
  const customCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
  const timeoutMs = Number(
    process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT ||
      (mode === 'prod' ? DEFAULT_PROD_TIMEOUT : DEFAULT_DEV_TIMEOUT)
  )

  const sharedEnv = {
    ...process.env,
    PORT: String(port),
    BASE_URL: baseURL,
    PLAYWRIGHT_HEADLESS: headless,
    PLAYWRIGHT_WEB_SERVER_MODE: mode,
    PLAYWRIGHT_WORKERS: workers,
    PLAYWRIGHT_HTML_REPORT: reportDir,
    PLAYWRIGHT_OUTPUT_DIR: outputDir,
    PLAYWRIGHT_SKIP_WEB_SERVER: '1',
  }

  if (jsonReport) sharedEnv.PLAYWRIGHT_JSON_REPORT = jsonReport
  if (trace) sharedEnv.PLAYWRIGHT_TRACE = trace

  if (mode === 'prod' && !customCommand) {
    await runCommand('npm', ['run', 'build'], sharedEnv, 'npm run build')
  }

  const serverEnv = { ...sharedEnv }
  let serverProcess
  if (customCommand) {
    serverProcess = startServerWithShell(customCommand, serverEnv)
  } else if (mode === 'prod') {
    serverProcess = startServer({ command: 'npm', args: ['run', 'start'], env: serverEnv })
  } else {
    serverProcess = startServer({ command: 'npm', args: ['run', 'dev'], env: serverEnv })
  }

  let exitCode = 1
  const cleanup = async () => {
    await stopServer(serverProcess)
  }

  const handleSignal = (signal) => {
    const exit = signal === 'SIGINT' ? 130 : 143
    cleanup().finally(() => process.exit(exit))
  }

  process.once('SIGINT', handleSignal)
  process.once('SIGTERM', handleSignal)

  try {
    await waitForServerReady(baseURL, timeoutMs, serverProcess)
    exitCode = await runPlaywright(sharedEnv)
  } catch (err) {
    console.error(err)
    exitCode = 1
  } finally {
    process.removeListener('SIGINT', handleSignal)
    process.removeListener('SIGTERM', handleSignal)
    await cleanup()
  }

  process.exit(exitCode)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
