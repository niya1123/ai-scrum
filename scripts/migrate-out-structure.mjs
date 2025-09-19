#!/usr/bin/env node
import { readdirSync, statSync, existsSync, mkdirSync, renameSync, cpSync, rmSync } from 'node:fs'
import { join, basename } from 'node:path'

const OUT = 'out'

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }) }
function moveFile(src, dst) {
  if (!existsSync(src)) return false
  if (existsSync(dst)) return false
  ensureDir(join(dst, '..'))
  try { renameSync(src, dst); return true } catch {
    // cross-device fallback
    try { cpSync(src, dst, { recursive: true }); rmSync(src, { recursive: true, force: true }); return true } catch { return false }
  }
}

function listDirs(p) {
  try { return readdirSync(p).filter(f => statSync(join(p,f)).isDirectory()) } catch { return [] }
}

function latestRunIdFromQa() {
  const qaDir = join(OUT, 'qa')
  const ds = listDirs(qaDir)
  if (ds.length === 0) return 'legacy'
  // ISO8601-like names sort lexicographically by time
  return ds.sort().pop()
}

function main() {
  const runId = process.env.RUN_ID || latestRunIdFromQa()
  const PO = join(OUT, 'po', runId)
  const ARCH = join(OUT, 'architect', runId)
  const PLAN = join(OUT, 'planner', runId)
  const DEVFE = join(OUT, 'dev-fe', runId)
  const DEVBE = join(OUT, 'dev-be', runId)
  const QA = join(OUT, 'qa', runId)
  const INV = join(OUT, 'investigate', runId)
  const DOCS = join(OUT, 'docs', runId)
  ;[PO, ARCH, PLAN, DEVFE, DEVBE, QA, INV, DOCS].forEach(ensureDir)

  // PO
  moveFile(join(OUT, 'backlog.yml'), join(PO, 'backlog.yml'))
  moveFile(join(OUT, 'po.jsonl'), join(PO, 'po.jsonl'))

  // Architect
  moveFile(join(OUT, 'scaffold.log'), join(ARCH, 'scaffold.log'))
  moveFile(join(OUT, 'architect.jsonl'), join(ARCH, 'architect.jsonl'))

  // Planner
  moveFile(join(OUT, 'planner.jsonl'), join(PLAN, 'planner.jsonl'))
  moveFile(join(OUT, 'tasks.yml'), join(PLAN, 'tasks.yml'))
  // Replans
  for (const f of readdirSync(OUT)) {
    let m
    if ((m = f.match(/^tasks-replan-(\d+)\.yml$/))) {
      const iter = m[1]
      const dst = join(PLAN, 'replan', `iter-${iter}`, 'tasks.yml')
      moveFile(join(OUT, f), dst)
    } else if ((m = f.match(/^planner-replan-(\d+)\.jsonl$/))) {
      const iter = m[1]
      const dst = join(PLAN, 'replan', `iter-${iter}`, 'planner-replan.jsonl')
      moveFile(join(OUT, f), dst)
    }
  }

  // Dev FE/BE
  for (const f of readdirSync(OUT)) {
    let m
    if ((m = f.match(/^dev-fe-(\d+)(-retry)?\.(log|jsonl)$/))) {
      const iter = m[1]; const retry = m[2]
      const dir = join(DEVFE, `iter-${iter}${retry ? '-retry' : ''}`)
      ensureDir(dir)
      moveFile(join(OUT, f), join(dir, f))
    } else if ((m = f.match(/^dev-be-(\d+)(-retry)?\.(log|jsonl)$/))) {
      const iter = m[1]; const retry = m[2]
      const dir = join(DEVBE, `iter-${iter}${retry ? '-retry' : ''}`)
      ensureDir(dir)
      moveFile(join(OUT, f), join(dir, f))
    }
  }

  // QA single files -> per-iter
  for (const f of readdirSync(OUT)) {
    let m
    if ((m = f.match(/^qa-(\d+)(-retry)?\.txt$/))) {
      const iter = m[1]; const retry = m[2]
      const dir = join(QA, `iter-${iter}${retry ? '-retry' : ''}`)
      ensureDir(dir)
      const dst = join(dir, 'result.json')
      moveFile(join(OUT, f), dst)
    } else if ((m = f.match(/^qa-(\d+)(-retry)?\.jsonl$/))) {
      const iter = m[1]; const retry = m[2]
      const dir = join(QA, `iter-${iter}${retry ? '-retry' : ''}`)
      ensureDir(dir)
      const dst = join(dir, 'stream.jsonl')
      moveFile(join(OUT, f), dst)
    }
  }
  // QA runner log
  moveFile(join(OUT, 'qa-runner.log'), join(QA, 'qa-runner.log'))

  // Investigations
  for (const f of readdirSync(OUT)) {
    let m
    if ((m = f.match(/^investigation-(\d+)\.yml$/))) {
      const iter = m[1]
      const dir = join(INV, `iter-${iter}`)
      ensureDir(dir)
      moveFile(join(OUT, f), join(dir, 'investigation.yml'))
    } else if ((m = f.match(/^investigate-(\d+)\.jsonl$/))) {
      const iter = m[1]
      const dir = join(INV, `iter-${iter}`)
      ensureDir(dir)
      moveFile(join(OUT, f), join(dir, 'stream.jsonl'))
    }
  }

  console.log(`Migration complete. RUN_ID=${runId}`)
}

main()

