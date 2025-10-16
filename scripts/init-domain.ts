#!/usr/bin/env -S node --enable-source-maps
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

interface Options {
  title: string
  dir: string
}

function usage() {
  console.log(
    `Usage: npm run domain:init <domain-slug> [--title "Display Title"]\n\n` +
      `Generates an idempotent domain scaffold under domains/<domain-slug>/.\n` +
      `Files:\n  - <slug>-plan.md: plan skeleton consumed by the orchestrator\n  - <slug>-spec.md: extended spec to evolve over time\n  - README.md: handoff notes and checklist\n\n` +
      `Re-running keeps existing files untouched.`
  )
}

function toTitle(slug: string) {
  return slug
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function derivePrefix(slug: string) {
  const parts = slug.split(/[-_\s]+/)
  const letters = parts
    .map((p) => p.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .map((p) => p.slice(0, 2).toUpperCase())
  const collapsed = letters.join('')
  return collapsed.length ? collapsed : 'DOM'
}

function parse(argv: string[]): { slug: string; options: Options } {
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
    usage()
    process.exit(argv.length ? 0 : 1)
  }
  const slug = argv[0]
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(slug)) {
    console.error(`Invalid slug: ${slug}. Use lowercase letters, numbers, '-' or '_'`)
    process.exit(1)
  }
  let title = toTitle(slug)
  let dir = join('domains', slug)
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--title' && argv[i + 1]) {
      title = argv[++i]
    } else if (arg === '--dir' && argv[i + 1]) {
      dir = argv[++i]
    } else {
      console.error(`Unknown option: ${arg}`)
      usage()
      process.exit(1)
    }
  }
  return { slug, options: { title, dir } }
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true })
}

function writeIfMissing(path: string, content: string) {
  if (existsSync(path)) {
    console.log(`skip  ${path} (already exists)`)
    return
  }
  writeFileSync(path, content, 'utf8')
  console.log(`create ${path}`)
}

function planTemplate(slug: string, title: string, prefix: string) {
  const specFile = `${slug}-spec.md`
  return `# Domain Plan: ${title}\n\n> Detailed spec: ./${specFile}\n\n## Vision\n- _Outline the product vision here._\n\n## Primary Outcomes\n- _Describe measurable outcomes._\n\n## Actors & Personas\n- _List key actors._\n\n## Initial Scope\n- _Write the MVP slice that the orchestrator should start with._\n\n## Acceptance Style\n- Use AC IDs prefixed with ${prefix}-, e.g. ${prefix}-001.\n\n## Notes\n- _Add domain context, glossary, or constraints._\n`
}

function specTemplate(title: string) {
  return `# Domain Spec: ${title}\n\n## Overview\n- _Expand the functional spec after the initial implementation here._\n\n## Domain Rules\n- _Capture invariants and business rules._\n\n## API Details\n- _Document endpoints, payloads, contracts._\n\n## UI/UX Details\n- _Sketch screens, states, accessibility notes._\n\n## Future Enhancements\n- _Backlog of enhancements after MVP._\n`
}

function readmeTemplate(slug: string) {
  return `# ${toTitle(slug)} Domain Folder\n\n## Workflow\n1. Update \`${slug}-plan.md\` before running \`npm run domain\`.\n2. After implementation cycles, refine \`${slug}-spec.md\` with new learnings.\n3. Keep acceptance criteria IDs in sync across plan/spec/backlog.\n\n## Checklist\n- [ ] MVP plan reviewed with stakeholders\n- [ ] Spec sections populated post-implementation\n- [ ] Backlog synced (see out/po)\n`
}

(function main() {
  const { slug, options } = parse(process.argv.slice(2))
  const root = resolve(options.dir)
  const prefix = derivePrefix(slug)
  ensureDir(root)
  writeIfMissing(join(root, `${slug}-plan.md`), planTemplate(slug, options.title, prefix))
  writeIfMissing(join(root, `${slug}-spec.md`), specTemplate(options.title))
  writeIfMissing(join(root, `README.md`), readmeTemplate(slug))
  console.log('\nDone. You can now run:')
  console.log(`  npm run domain ${join(root, `${slug}-plan.md`)}`)
})()
