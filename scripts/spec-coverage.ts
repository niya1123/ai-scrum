#!/usr/bin/env -S node --enable-source-maps
import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

type Method = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'

function fail(msg: string, code = 2): never {
  console.error(`Spec coverage: ${msg}`)
  process.exit(code)
}

function ok(msg: string): void {
  console.log(`Spec coverage: ${msg}`)
}

function getDomainSpecPath(): string {
  const p = process.env.DOMAIN_SPEC || 'domains/examples/travel-planner.md'
  if (!existsSync(p)) fail(`DOMAIN_SPEC not found: ${p}`)
  return p
}

function parseEndpoints(md: string): Array<{ method: Method; path: string }>{
  const out: Array<{ method: Method; path: string }> = []
  const lines = md.split(/\r?\n/)
  const re = /^\s*-\s*(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)(?:\s+[-–>→].*)?$/i
  for (const line of lines) {
    const m = line.match(re)
    if (!m) continue
    const method = m[1].toUpperCase() as Method
    const rawPath = m[2]
    if (!rawPath.startsWith('/api/')) continue
    out.push({ method, path: rawPath })
  }
  return out
}

function toRouteFile(apiPath: string): string {
  // Convert an API path to Next.js App Router file path under app/api
  // Example: /api/quantum-gomoku/games/:id/moves -> app/api/quantum-gomoku/games/[id]/moves/route.ts
  const parts = apiPath.replace(/^\/?api\//, '').split('/')
  const mapped = parts.map(seg => seg.startsWith(':') ? `[${seg.slice(1)}]` : seg)
  return join('app', 'api', ...mapped, 'route.ts')
}

function fileHasMethod(file: string, method: Method): boolean {
  try {
    const src = readFileSync(file, 'utf8')
    const re = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`)
    return re.test(src)
  } catch {
    return false
  }
}

async function main() {
  const specPath = getDomainSpecPath()
  const md = readFileSync(specPath, 'utf8')
  const eps = parseEndpoints(md)
  if (eps.length === 0) {
    ok(`no API endpoints declared in spec (${relative(process.cwd(), specPath)}) — skipping`)
    return
  }

  const missing: Array<{ method: Method; apiPath: string; routePath: string; reason: string }> = []
  for (const { method, path } of eps) {
    const routePath = toRouteFile(path)
    if (!existsSync(routePath)) {
      missing.push({ method, apiPath: path, routePath, reason: 'route file missing' })
      continue
    }
    if (!fileHasMethod(routePath, method)) {
      missing.push({ method, apiPath: path, routePath, reason: `missing exported handler ${method}()` })
    }
  }

  if (missing.length) {
    console.error('\n❌ Spec coverage check failed: the following endpoints are not implemented:')
    for (const m of missing) {
      console.error(`- [${m.method}] ${m.apiPath} → ${m.routePath} (${m.reason})`)
    }
    fail(`missing ${missing.length} endpoint(s). Set ENFORCE_SPEC_COVERAGE=0 to bypass.`)
  }

  ok(`all ${eps.length} endpoint(s) have route handlers`)
}

main().catch((e) => {
  console.error('Spec coverage: unexpected error', e)
  process.exit(2)
})

