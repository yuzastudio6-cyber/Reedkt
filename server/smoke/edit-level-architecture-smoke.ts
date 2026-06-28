import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/edit-level-product-contract.md',
  'docs/edit-level-profile-architecture.md',
  'docs/edit-level-legacy-alias-compatibility.md',
  'docs/edit-level-tool-routing-architecture.md',
  'docs/edit-level-qwen-routing-architecture.md',
  'docs/edit-level-source-video-understanding-policy.md',
  'docs/edit-level-edit-brief-policy.md',
  'docs/edit-level-edit-preference-dna-policy.md',
  'docs/edit-level-qa-profile-architecture.md',
  'docs/edit-level-estimate-budget-architecture.md',
  'docs/edit-level-fallback-degraded-capability-policy.md',
  'docs/edit-level-ui-recommendation-architecture.md',
  'docs/edit-level-backend-service-architecture.md',
  'docs/edit-level-integration-map.md',
  'docs/edit-level-internal-testing-plan.md',
  'docs/edit-level-next-types-fixtures-plan.md',
]

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

for (const doc of requiredDocs) {
  assert.equal(existsSync(repoFile(doc)), true, `Missing required edit-level architecture doc: ${doc}`)
}

assert.equal(
  existsSync(repoFile('docs/edit-level-beta-product-copy.md')),
  false,
  'RP-EDITLEVEL-01 should not create the optional beta product copy doc.',
)

const combinedDocs = requiredDocs.map(readRepoFile).join('\n')
const lowerCombinedDocs = combinedDocs.toLowerCase()

const requiredTerms = [
  'Normal',
  'Premium',
  'Ultra Premium',
  'basic',
  'pro',
  'premium',
  'professional edit',
  'Qwen 3.7',
  'Qwen2.5-VL',
  'Edit Brief optional',
  'Edit Brief recommended',
  'Edit Brief strongly recommended',
  'QA profile',
  'credit estimate only',
  'render budget future',
  'fallback policy',
  'no runtime implementation',
]

for (const term of requiredTerms) {
  assert.ok(
    lowerCombinedDocs.includes(term.toLowerCase()),
    `Edit-level architecture docs must include required term: ${term}`,
  )
}

assert.ok(
  combinedDocs.includes('basic -> Normal') &&
    combinedDocs.includes('pro -> Premium') &&
    combinedDocs.includes('premium -> Ultra Premium'),
  'Architecture must document exact legacy alias compatibility mapping.',
)
assert.ok(
  combinedDocs.includes('RP-EDITLEVEL-02') && combinedDocs.includes('RP-EDITLEVEL-03 - Mock Repository + API/Client Layer'),
  'Architecture must preserve the RP-EDITLEVEL-02 handoff and recommend RP-EDITLEVEL-03 next after RP-EDITLEVEL-02 completes.',
)

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:edit-level-architecture'],
  'tsx server/smoke/edit-level-architecture-smoke.ts',
  'package.json must expose smoke:edit-level-architecture.',
)

console.log('edit-level-architecture-smoke passed')
