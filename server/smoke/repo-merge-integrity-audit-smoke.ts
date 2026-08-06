import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/repo-merge-integrity-audit.md',
  'docs/repo-path-divergence-audit.md',
  'docs/repo-dirty-worktree-audit.md',
  'docs/repo-milestone-file-presence-audit.md',
  'docs/repo-merge-conflict-audit.md',
  'docs/repo-migration-integrity-audit.md',
  'docs/repo-package-dependency-audit.md',
  'docs/repo-pr-merge-readiness-audit.md',
  'docs/repo-next-safe-staging-plan.md',
  'docs/repo-active-source-of-truth.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing repo merge integrity audit doc: ${doc}`)
}

const docsText = requiredDocs.map(readRepoFile).join('\n').toLowerCase()

for (const phrase of [
  'merge integrity',
  'active repo path',
  'dirty worktree',
  'path divergence',
  'migration count',
  'staged',
  'untracked',
  'merge conflict',
  'next safe staging',
  'no commit',
  'no cleanup',
  'path_divergence_risk',
  '/volumes/backup/reeditpro',
  '/users/macuser/developer/reeditpro',
]) {
  assert.ok(docsText.includes(phrase), `Audit docs must include phrase: ${phrase}`)
}

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:repo-merge-integrity-audit'],
  'tsx server/smoke/repo-merge-integrity-audit-smoke.ts',
  'package.json must expose smoke:repo-merge-integrity-audit.',
)

console.log('repo-merge-integrity-audit-smoke passed')
