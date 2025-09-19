#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

function summarize(json) {
  const byTitle = new Map()
  let total = 0, passed = 0, failed = 0, skipped = 0
  const failures = []
  const passes = []

  function walkSuite(suite) {
    for (const s of suite.suites || []) walkSuite(s)
    // Playwright JSON reporter nests specs->tests at leaves
    for (const spec of suite.specs || []) {
      const display = spec.title || 'untitled spec'
      for (const t of spec.tests || []) {
        // Determine outcome
        let outcome = 'failed'
        const exp = t?.expectedStatus
        const res0 = (t?.results || [])[0]
        const resStatus = res0?.status
        if (exp === 'skipped' || resStatus === 'skipped') outcome = 'skipped'
        else if (exp === 'passed' || resStatus === 'passed' || t?.status === 'expected' || t?.status === 'passed') outcome = 'passed'

        total++
        const ok = outcome === 'passed' || outcome === 'skipped'
        const title = `${display}`
        byTitle.set(title, ok)
        if (ok) {
          if (outcome === 'passed') {
            passed++
            if (!passes.includes(title)) passes.push(title)
          } else {
            skipped++
          }
        } else {
          failed++
          let reason = ''
          try {
            const res = (t.results || [])[0]
            const err = res?.error || t?.error
            reason = err?.message || err?.stack || String(err || '')
          } catch {}
          failures.push({ title, reason })
        }
      }
    }
    for (const t of suite.tests || []) {
      total++
      const ok = t?.outcome === 'expected' || t?.status === 'passed'
      const title = t.title || t.titlePath?.join(' › ') || 'unknown'
      byTitle.set(title, ok)
      if (ok) {
        passed++
        passes.push(title)
      } else {
        failed++
        let reason = ''
        try {
          const res = (t.results || [])[0]
          const err = res?.error || t?.error
          reason = err?.message || err?.stack || String(err || '')
        } catch {}
        failures.push({ title, reason })
      }
    }
  }

  for (const s of json.suites || []) walkSuite(s)
  return { total, passed, failed, skipped, passes, failures }
}

function main() {
  const jsonPath = process.env.PLAYWRIGHT_JSON_REPORT || 'playwright-report/results.json'
  const runId = process.env.RUN_ID
  const defaultSummary = runId ? `out/qa/${runId}/ci-summary.json` : 'out/qa/ci-summary.json'
  const outPath = process.env.QA_SUMMARY_JSON || defaultSummary
  if (!existsSync(jsonPath)) {
    console.error(`JSON report not found: ${jsonPath}. Ensure PLAYWRIGHT_JSON_REPORT is set and tests ran.`)
    process.exit(2)
  }
  const raw = readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(raw)
  const s = summarize(data)
  const status = s.failed === 0 && s.passed > 0 ? 'green' : 'red'
  const summary = `${s.passed} passed / ${s.failed} failed / ${s.skipped} skipped (total ${s.total})`
  const result = {
    status,
    runner: 'local',
    summary,
    passed: s.passes,
    failed: s.failures,
    evidence: {
      report: 'playwright-report',
      json: jsonPath,
    },
  }
  const dir = dirname(outPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`QA summary written: ${outPath}`)
}

main()
