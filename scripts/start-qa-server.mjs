#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'node:net'

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

function runCommand(command, args, env, label) {
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
  return spawn(command, args, { env, stdio: 'inherit', shell: false })
}

function startServerWithShell(command, env) {
  return spawn(command, { env, stdio: 'inherit', shell: true })
}

async function waitForServerReady(url, timeoutMs, serverProcess) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Server exited early with code ${serverProcess.exitCode}`)
    }
    if (serverProcess.signalCode) {
      throw new Error(`Server was killed by signal ${serverProcess.signalCode}`)
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3_000)
      try {
        const response = await fetch(url, { method: 'GET', signal: controller.signal })
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

  throw new Error(`Timed out after ${timeoutMs}ms waiting for ${url}`)
}

function attachSignalHandlers(child) {
  const stop = () => {
    if (child.exitCode !== null || child.signalCode) return
    child.kill('SIGTERM')
  }

  const signals = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.once(signal, () => {
      stop()
      setTimeout(() => process.exit(signal === 'SIGINT' ? 130 : 143), 100)
    })
  }
}

async function main() {
  const explicitPort = Number(process.env.PORT)
  const port = Number.isFinite(explicitPort) && explicitPort > 0 ? explicitPort : await getEphemeralPort()
  const baseURL = `http://localhost:${port}`
  const mode = process.env.PLAYWRIGHT_WEB_SERVER_MODE || 'dev'
  const customCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
  const timeoutMs = Number(
    process.env.PLAYWRIGHT_WEB_SERVER_TIMEOUT ||
      (mode === 'prod' ? DEFAULT_PROD_TIMEOUT : DEFAULT_DEV_TIMEOUT)
  )

  const env = { ...process.env, PORT: String(port), BASE_URL: baseURL, PLAYWRIGHT_WEB_SERVER_MODE: mode }

  if (mode === 'prod' && !customCommand) {
    await runCommand('npm', ['run', 'build'], env, 'npm run build')
  }

  const serverProcess = customCommand
    ? startServerWithShell(customCommand, env)
    : mode === 'prod'
      ? startServer({ command: 'npm', args: ['run', 'start'], env })
      : startServer({ command: 'npm', args: ['run', 'dev'], env })

  attachSignalHandlers(serverProcess)

  try {
    await waitForServerReady(baseURL, timeoutMs, serverProcess)
    console.log(`QA server ready at ${baseURL} (PID ${serverProcess.pid}). Press Ctrl+C to stop.`)
    if (!process.env.PORT || Number(process.env.PORT) <= 0) {
      console.log(`Hint: reuse this server by running commands with PORT=${port}`)
    }
  } catch (err) {
    console.error(err)
    serverProcess.kill('SIGTERM')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
