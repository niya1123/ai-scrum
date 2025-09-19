#!/usr/bin/env -S node --enable-source-maps
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

function mapKeywordToSpec(keyword?: string): string {
  const k = (keyword || '').toLowerCase()
  if (!k) return 'domains/examples/travel-planner.md'
  if (['travel', 'trip', 'planner', 'travel-planner'].includes(k)) return 'domains/examples/travel-planner.md'
  if (['todo', 'todos', 'todo-app'].includes(k)) return 'domains/examples/todo-app.md'
  return keyword as string
}

async function main() {
  const argv = process.argv.slice(2)
  let specArg: string | undefined
  let rest: string[] = []
  if (argv.length && !argv[0].startsWith('-')) {
    specArg = argv[0]
    rest = argv.slice(1)
  } else {
    specArg = process.env.SPEC || process.env.DOMAIN_SPEC
    rest = argv
  }

  const mapped = mapKeywordToSpec(specArg)
  const specPath = mapped && !mapped.startsWith('.') && !mapped.startsWith('/')
    ? join(process.cwd(), mapped)
    : resolve(process.cwd(), mapped || 'domains/examples/travel-planner.md')

  if (!existsSync(specPath)) {
    console.error(`Domain spec not found: ${specPath}`)
    console.error('Hint: pass keyword like "travel" or "todo", or a valid file path.')
    process.exit(2)
  }

  const env = { ...process.env, DOMAIN_SPEC: specPath }
  const child = spawn('tsx', ['scripts/orchestrator.ts', ...rest], {
    stdio: 'inherit',
    env,
  })
  await new Promise<void>((resolveDone) => child.on('close', () => resolveDone()))
  process.exit(child.exitCode === null ? 1 : child.exitCode)
}

main().catch((e) => { console.error(e); process.exit(1) })

