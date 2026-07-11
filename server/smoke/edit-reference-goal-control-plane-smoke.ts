import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'docs/edit-reference-goal.md',
  'docs/edit-reference-goal-status.md',
  'docs/edit-reference-goal-status.json',
  'docs/edit-reference-definition-of-done.md',
  'docs/edit-reference-ui-contract.md',
  'docs/edit-reference-skill-registry.md',
  'docs/edit-reference-test-fixture-plan.md',
  'docs/edit-reference-persistence-contract.md',
  'docs/edit-reference-gate-verification-log.md',
  'docs/edit-reference-gate-1-study-session-foundation.md',
  'docs/edit-reference-gate-2-evidence-study-orchestration.md',
  'docs/edit-reference-gate-3-versioned-dna-synthesis.md',
  'docs/edit-reference-gate-4-dna-qa-approval.md',
  'docs/edit-reference-gate-5-target-application.md',
  'docs/edit-reference-gate-6-downstream-integration.md',
  'design-system/MASTER.md',
  'design-system/pages/edit-preferences.md',
  'scripts/validation/edit-reference-goal-preflight.mjs',
  'scripts/validation/edit-reference-goal-postgate.mjs',
]

for (const relativePath of requiredFiles) {
  assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} must exist.`)
}

const read = (relativePath: string) => readFileSync(join(root, relativePath), 'utf8')
const status = JSON.parse(read('docs/edit-reference-goal-status.json')) as Record<string, unknown>
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const goal = read('docs/edit-reference-goal.md')
const definition = read('docs/edit-reference-definition-of-done.md')
const ui = read('docs/edit-reference-ui-contract.md')
const skills = read('docs/edit-reference-skill-registry.md')
const persistence = read('docs/edit-reference-persistence-contract.md')
const designSystem = read('design-system/MASTER.md')
const editPreferencesDesign = read('design-system/pages/edit-preferences.md')
const gate4 = read('docs/edit-reference-gate-4-dna-qa-approval.md')
const gate5 = read('docs/edit-reference-gate-5-target-application.md')
const gate6 = read('docs/edit-reference-gate-6-downstream-integration.md')

assert.equal(status.goal, 'edit_reference_end_to_end')
assert.equal(status.status, 'in_progress')
assert.equal(status.currentGate, 'gate_6')
assert.deepEqual(status.completedGates, ['gate_0', 'gate_1', 'gate_2', 'gate_3', 'gate_4', 'gate_5'])
assert.deepEqual(status.blockedGates, [])
assert.match(String(status.latestCommit), /^[a-f0-9]{40}$/)
assert.equal(status.migrationBaseline, 21)
assert.equal(status.migrationCurrent, 21)
assert.equal(status.browserQa, 'passed_backend_local')
assert.equal(status.runtimeQa, 'passed_backend_local')
assert.equal(status.persistenceQa, 'passed_backend_local')
assert.equal(status.productionReady, false)

assert.equal(
  readdirSync(join(root, 'supabase/migrations')).filter((entry) => entry.endsWith('.sql') && !entry.startsWith('._')).length,
  21,
)

assert.match(goal, /Reference style must be adapted to the target video, never copied blindly/i)
for (const decision of ['reuse', 'extend', 'replace', 'retire', 'blocked', 'historical-only']) {
  assert.match(goal, new RegExp(`\\*\\*${decision.replace('-', '\\-')}\\*\\*|${decision}`, 'i'))
}

for (let step = 1; step <= 16; step += 1) {
  assert.match(definition, new RegExp(`^${step}\\.`, 'm'), `Definition of done must include step ${step}.`)
}

for (const tab of ['Edit References', 'Workspace Defaults', 'Applied Edits', 'Safety & Privacy']) {
  assert.match(ui, new RegExp(tab.replace('&', '&'), 'i'))
}
for (const panel of ['Left — Saved Edit References', 'Center — Preference Study Chat', 'Right — Preference DNA And QA Inspector']) {
  assert.match(ui, new RegExp(panel.replace(/[—]/g, '[—-]'), 'i'))
}

const skillFamilies = [
  'Media Structure',
  'Visual Language',
  'Story And Editorial Structure',
  'Caption Design',
  'Color Treatment',
  'Speech And Pacing',
  'Audio And Sound Design',
  'Graphics And Motion',
  'Transferability And Do-Not-Copy',
  'Preference DNA Synthesis',
  'Preference DNA QA',
  'Target-Video Adaptation',
]
for (const family of skillFamilies) assert.match(skills, new RegExp(`^### ${family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'))

const registryFields = [
  'skillId',
  'displayName',
  'purpose',
  'inputs',
  'outputs',
  'toolOrRuntime',
  'readinessStatus',
  'proofCommand',
  'fallback',
  'sideEffects',
  'privacyPolicy',
  'provenancePolicy',
]
for (const field of registryFields) {
  const count = skills.match(new RegExp(`^- ${field}:`, 'gm'))?.length ?? 0
  assert.equal(count, skillFamilies.length, `${field} must appear once for every skill family.`)
}

for (const readiness of ['verified_live', 'verified_local', 'verified_mock', 'degraded', 'blocked', 'not_implemented']) {
  assert.match(skills, new RegExp(`\\b${readiness}\\b`))
}

assert.match(persistence, /Browser localStorage is not authority|Browser localStorage may hold transient/i)
assert.match(persistence, /exact response snapshot/i)
assert.match(persistence, /production repository seam/i)
assert.match(persistence, /Gates 1[–-]6 add no SQL migration/i)
assert.match(designSystem, /UI UX Pro Max as a supporting accessibility and craft checklist/i)
assert.match(designSystem, /Skip to main content/i)
assert.match(designSystem, /at least 44px/i)
assert.match(editPreferencesDesign, /Normal user copy does not expose/i)
assert.match(editPreferencesDesign, /mock\/local status/i)
assert.match(editPreferencesDesign, /375px/i)
assert.match(gate4, /version-bound quality and approval path/i)
assert.match(gate4, /blocker cannot be acknowledged away/i)
assert.match(gate4, /not applied and production has not started/i)
assert.match(gate5, /same approved DNA for/i)
assert.match(gate5, /target edit, approved plan, downstream context, production state/i)
assert.match(gate5, /UI UX Pro Max as subordinate critique guidance/i)
assert.match(gate6, /Project Edit Session.*Edit Brief.*Marker Context.*Marker Chat.*Plan Hints.*QA/is)
assert.match(gate6, /safety, platform, tier, frame, credit\/cost policy, approved constraints/i)
assert.match(gate6, /UI UX Pro Max as supporting guidance only/i)

assert.equal(packageJson.scripts?.['check:edit-reference-goal-preflight'], 'node scripts/validation/edit-reference-goal-preflight.mjs')
assert.equal(packageJson.scripts?.['check:edit-reference-goal-postgate'], 'node scripts/validation/edit-reference-goal-postgate.mjs')
assert.equal(packageJson.scripts?.['smoke:edit-reference-goal-control-plane'], 'tsx server/smoke/edit-reference-goal-control-plane-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-repository'], 'tsx server/smoke/edit-reference-repository-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-api-routes'], 'tsx server/smoke/edit-reference-study-session-foundation-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-api-client'], 'tsx server/smoke/edit-reference-api-client-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-study-session-foundation'], 'tsx server/smoke/edit-reference-study-session-foundation-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-ui'], 'tsx server/smoke/edit-reference-ui-adapter-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-evidence-study'], 'tsx server/smoke/edit-reference-evidence-study-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-dna-synthesis'], 'tsx server/smoke/edit-reference-dna-synthesis-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-dna-qa-approval'], 'tsx server/smoke/edit-reference-dna-qa-approval-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-target-application'], 'tsx server/smoke/edit-reference-target-application-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:edit-reference-downstream-integration'], 'tsx server/smoke/edit-reference-downstream-integration-smoke.ts')

console.log('edit_reference_goal_control_plane_passed')
