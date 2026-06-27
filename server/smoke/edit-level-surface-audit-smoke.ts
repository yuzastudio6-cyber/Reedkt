import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/edit-level-existing-surface-audit.md',
  'docs/edit-level-product-contract-audit.md',
  'docs/edit-level-tool-routing-audit.md',
  'docs/edit-level-project-setup-audit.md',
  'docs/edit-level-edit-session-integration-audit.md',
  'docs/edit-level-edit-brief-integration-audit.md',
  'docs/edit-level-edit-preference-dna-audit.md',
  'docs/edit-level-source-video-understanding-audit.md',
  'docs/edit-level-qwen-routing-audit.md',
  'docs/edit-level-qa-credit-render-audit.md',
  'docs/edit-level-reuse-vs-new-build-plan.md',
  'docs/edit-level-implementation-blockers.md',
  'docs/edit-level-beta-decision-register.md',
  'docs/edit-level-milestone-roadmap.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing required edit-level audit doc: ${doc}`)
}

assert.equal(
  existsSync(repoFile('docs/edit-level-glossary.md')),
  false,
  'RP-EDITLEVEL-00 should not create the optional glossary.',
)

const combinedDocs = requiredDocs.map(readRepoFile).join('\n')
const lowerCombinedDocs = combinedDocs.toLowerCase()

const requiredTerms = [
  'Normal',
  'Premium',
  'Ultra Premium',
  'professional edit',
  'tool routing',
  'Qwen 3.7',
  'Qwen2.5-VL',
  'Edit Brief',
  'Edit Preference',
  'QA',
  'credit estimate',
  'render budget',
  'reuse vs new build',
  'no runtime implementation',
]

for (const term of requiredTerms) {
  assert.ok(
    lowerCombinedDocs.includes(term.toLowerCase()),
    `Edit-level audit docs must include required term: ${term}`,
  )
}

assert.ok(
  combinedDocs.includes("`basic`") && combinedDocs.includes("`pro`") && combinedDocs.includes("`premium`"),
  'Audit must document current basic/pro/premium runtime values.',
)
assert.ok(
  combinedDocs.includes('RP-EDITLEVEL-01'),
  'Roadmap must recommend RP-EDITLEVEL-01 next.',
)

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-surface-audit'],
  'tsx server/smoke/edit-level-surface-audit-smoke.ts',
  'package.json must expose smoke:edit-level-surface-audit.',
)

console.log('edit-level-surface-audit-smoke passed')
