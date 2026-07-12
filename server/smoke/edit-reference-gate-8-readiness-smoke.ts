import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const startingCommit = 'e405e69e1a43fd2609854d8acaa7a4ef959b7e94'
const gate8Commit = '7ff15993c505af65abcbc61e0db259061f583e25'
const replayedGate8Commit = 'c648f73f855bcc2ee578e1b6823e3e0e0417cdab'
const allowDirtyAudit = process.env.EDIT_REFERENCE_ALLOW_DIRTY_AUDIT === '1'

const requiredFiles = [
  'docs/edit-reference-gate-8-beta-readiness.md',
  'docs/edit-reference-gate-8-1-application-entrypoints.md',
  'docs/edit-reference-live-study-closure.md',
  'docs/edit-reference-selector-chat-state-consistency.md',
  'docs/edit-reference-gate-8-1-browser-report.md',
  'docs/edit-reference-gate-8-1-known-limitations.md',
  'docs/edit-reference-final-acceptance-matrix.md',
  'docs/edit-reference-adaptation-proof.md',
  'docs/edit-reference-skill-provenance-report.md',
  'docs/edit-reference-persistence-readback-report.md',
  'docs/edit-reference-security-privacy-report.md',
  'docs/edit-reference-browser-e2e-report.md',
  'docs/edit-reference-known-limitations.md',
  'docs/edit-reference-pr-file-inventory.md',
  'docs/edit-reference-rollback-plan.md',
  'docs/edit-reference-goal-status.json',
  'docs/edit-reference-goal-status.md',
  'docs/edit-reference-definition-of-done.md',
  'docs/edit-reference-skill-registry.md',
  'docs/edit-reference-persistence-contract.md',
  'docs/edit-reference-gate-verification-log.md',
  'docs/edit-reference-draft-pr-readiness.md',
  'docs/edit-reference-draft-pr-commit-map.md',
  'docs/edit-reference-draft-pr-file-inventory.md',
  'docs/edit-reference-draft-pr-base-reconciliation.md',
]

for (const relativePath of requiredFiles) {
  assert.equal(existsSync(join(root, relativePath)), true, `${relativePath} must exist.`)
}

const read = (relativePath: string) => readFileSync(join(root, relativePath), 'utf8')
const status = JSON.parse(read('docs/edit-reference-goal-status.json')) as {
  goal: string
  status: string
  currentGate: string
  completedGates: string[]
  blockedGates: string[]
  gate7ImplementationCommit: string
  gate7VerificationCommit: string
  gate8Commit: string
  latestCommit: string
  migrationBaseline: number
  migrationCurrent: number
  sourceMigrationBaseline: number
  browserQa: string
  backendQa: string
  runtimeQa: string
  persistenceQa: string
  runtimeToolReadiness: Record<string, number>
  remainingBlockers: string[]
  readinessDecision: string
  productionReady: boolean
  remoteMutationAllowed: boolean
  prPreparation: {
    strategy: string
    baseBranch: string
    baseSha: string
    replayedGoalCommits: number
    packageLockChanged: boolean
    changedFileCount: number | null
    fullPlaywright: {
      discovered: number
      passed: number
      skipped: number
      failed: number
      skippedReason?: string
    }
  }
}
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const gate8 = read('docs/edit-reference-gate-8-beta-readiness.md')
const matrix = read('docs/edit-reference-final-acceptance-matrix.md')
const adaptation = read('docs/edit-reference-adaptation-proof.md')
const skillReport = read('docs/edit-reference-skill-provenance-report.md')
const skillRegistry = read('docs/edit-reference-skill-registry.md')
const persistenceReport = read('docs/edit-reference-persistence-readback-report.md')
const persistenceContract = read('docs/edit-reference-persistence-contract.md')
const security = read('docs/edit-reference-security-privacy-report.md')
const browser = read('docs/edit-reference-gate-8-1-browser-report.md')
const limitations = read('docs/edit-reference-gate-8-1-known-limitations.md')
const inventory = read('docs/edit-reference-pr-file-inventory.md')
const rollback = read('docs/edit-reference-rollback-plan.md')
const definition = read('docs/edit-reference-definition-of-done.md')
const statusMarkdown = read('docs/edit-reference-goal-status.md')
const verificationLog = read('docs/edit-reference-gate-verification-log.md')
const draftReadiness = read('docs/edit-reference-draft-pr-readiness.md')
const draftCommitMap = read('docs/edit-reference-draft-pr-commit-map.md')
const draftInventory = read('docs/edit-reference-draft-pr-file-inventory.md')
const baseReconciliation = read('docs/edit-reference-draft-pr-base-reconciliation.md')

assert.equal(status.goal, 'edit_reference_end_to_end')
assert.equal(status.status, 'feature_complete_except_external_blocker')
assert.match(status.currentGate, /^gate_9_/)
assert.deepEqual(status.completedGates, [...Array.from({ length: 9 }, (_, index) => `gate_${index}`), 'gate_8_1', 'gate_9'])
assert.deepEqual(status.blockedGates, [])
assert.equal(status.gate7ImplementationCommit, '42d34cdc04179c6808a4c3f23286885daf116006')
assert.equal(status.gate7VerificationCommit, 'abb3b9548baa92c5bcdd4d5cee45a53e1ef6f66e')
assert.equal(status.gate8Commit, gate8Commit)
assert.match(status.latestCommit, /^[a-f0-9]{40}$/)
assert.equal(status.migrationBaseline, 24)
assert.equal(status.migrationCurrent, 24)
assert.equal(status.sourceMigrationBaseline, 21)
assert.equal(status.browserQa, 'passed_43_discovered_42_passed_1_live_provider_gated')
assert.equal(status.backendQa, 'passed_backend_local')
assert.equal(status.runtimeQa, 'passed_local_media_partial_with_external_semantic_limits')
assert.equal(status.persistenceQa, 'passed_backend_local_remote_blocked')
assert.equal(status.runtimeToolReadiness.verifiedLive, 2)
assert.equal(status.runtimeToolReadiness.verifiedLocal, 1)
assert.equal(status.runtimeToolReadiness.verifiedMock, 8)
assert.equal(status.runtimeToolReadiness.degraded, 0)
assert.equal(status.runtimeToolReadiness.blocked, 1)
assert.equal(status.runtimeToolReadiness.notImplemented, 0)
assert.equal(status.runtimeToolReadiness.gate81LocalMediaToolRuns, 2)
assert.equal(status.runtimeToolReadiness.gate81LiveProviderCalls, 0)
assert(status.remainingBlockers.length >= 6)
assert.equal(status.readinessDecision, 'feature_complete_except_external_blocker')
assert.equal(status.productionReady, false)
assert.equal(status.remoteMutationAllowed, false)
assert.equal(status.prPreparation.strategy, 'clean_replay')
assert.equal(status.prPreparation.baseBranch, 'codex/reeditpro-web-ui-shell')
assert.equal(status.prPreparation.baseSha, startingCommit)
assert.equal(status.prPreparation.replayedGoalCommits, 21)
assert.equal(status.prPreparation.packageLockChanged, false)
assert.equal(status.prPreparation.changedFileCount === null || status.prPreparation.changedFileCount === 162, true)
assert.equal(status.prPreparation.fullPlaywright.discovered, 43)
assert.equal(status.prPreparation.fullPlaywright.passed, 42)
assert.equal(status.prPreparation.fullPlaywright.skipped, 1)
assert.equal(status.prPreparation.fullPlaywright.failed, 0)
assert.match(status.prPreparation.fullPlaywright.skippedReason ?? '', /live qwen provider/i)

const migrationCount = readdirSync(join(root, 'supabase/migrations'))
  .filter((entry) => entry.endsWith('.sql') && !entry.startsWith('._')).length
assert.equal(migrationCount, 24)

const allowedMatrixStatuses = new Set(['passed', 'passed_with_limitation', 'blocked_external', 'failed', 'not_implemented'])
const matrixRows = [...matrix.matchAll(/^\| (ER-[A-Z]+-\d+) \|[^\n]*?\| (passed|passed_with_limitation|blocked_external|failed|not_implemented) \|/gm)]
assert(matrixRows.length >= 70, `Expected at least 70 acceptance rows, found ${matrixRows.length}.`)
assert.equal(new Set(matrixRows.map((match) => match[1])).size, matrixRows.length)
for (const row of matrixRows) assert(allowedMatrixStatuses.has(row[2]!))
assert.equal(matrixRows.filter((row) => row[2] === 'failed').length, 0)
for (const section of ['Study Foundation', 'Skill Pipeline', 'Preference DNA', 'Target Adaptation', 'ReEditPro Integration', 'UI/UX', 'Safety And Persistence']) {
  assert.match(matrix, new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'))
}

for (const title of [
  'Travel/Story Reference To Educational Product Target',
  'Travel/Story Reference To Travel Talking-Head Target',
  'Educational Reference To Product/Demo Target',
]) assert.match(adaptation, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
for (const proof of [
  'Reference footage does not transfer',
  'Exact captions do not transfer',
  'Exact sequence/timing does not transfer',
  'Copyrighted/reference music and SFX do not transfer',
  'Provider/model/media/worker/generation/render/credit effects | 0',
]) assert.match(adaptation, new RegExp(proof.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
assert.equal((adaptation.match(/Do-not-copy result: `passed`/g) ?? []).length, 3)

const skillRows = [...skillReport.matchAll(/^\| (SK-\d+) \|/gm)]
assert.equal(skillRows.length, 12)
assert.equal(new Set(skillRows.map((match) => match[1])).size, 12)
for (const [label, count] of [['verified_live', 2], ['verified_local', 1], ['verified_mock', 8], ['blocked', 1]] as const) {
  assert(skillReport.includes('- `' + label + '`: ' + count))
}
assert.match(skillReport, /Gate 8 intentionally used deterministic\/manual fallbacks and blocked states/i)
assert.match(skillRegistry, /Gate 8 Reconciliation Evidence/)
assert.match(skillRegistry, /smoke:edit-reference-adaptation-proof/)
for (const field of ['skillId', 'displayName', 'purpose', 'inputs', 'outputs', 'toolOrRuntime', 'readinessStatus', 'proofCommand', 'fallback', 'sideEffects', 'privacyPolicy', 'provenancePolicy']) {
  assert.equal(skillRegistry.match(new RegExp(`^- ${field}:`, 'gm'))?.length, 12)
}

assert.match(persistenceReport, /passed_backend_local_remote_blocked/)
assert.match(persistenceReport, /Browser `localStorage` \| not authority/)
assert.match(persistenceReport, /replacement\/removal history.*Passed/is)
assert.match(persistenceReport, /source-branch migration baseline: 21/i)
assert.match(persistenceReport, /PR-base and PR-branch migration count: 24/i)
assert.match(persistenceContract, /Gates 1[–-]8\.1 add no SQL migration/)
assert.match(security, /No raw provider response persistence \| Passed/)
assert.match(security, /No raw frame persistence by default \| Passed/)
assert.match(security, /No frontend secret\/service credential \| Passed/)
assert.match(security, /productionReady` remains `false/)

assert.match(browser, /passed_60_of_60/)
assert.match(browser, /60\/60 Chromium tests passed/i)
assert.match(browser, /New Edit.*Edit Chat/is)
for (const viewport of ['375', '768', '1024', '1440']) assert.match(browser, new RegExp(`\\b${viewport}\\b`))

assert.match(limitations, /semantic frame understanding is not/i)
assert.match(limitations, /productionReady` remains `false/)

assert.match(inventory, /Starting commit: `48540ee9b3d14c8345b0cedf11b6b449424324c3`/)
assert.match(inventory, /Gate 8 implementation commit: `7ff15993c505af65abcbc61e0db259061f583e25`/)
assert.match(inventory, /Total changed paths: 191/)
assert.match(inventory, /Supabase migration paths changed: 0/)
assert.match(rollback, /git revert/)
assert.match(rollback, /Gates 1[–-]8\.1 created no SQL migration/)

for (let step = 1; step <= 16; step += 1) assert.match(definition, new RegExp(`^${step}\\.`, 'm'))
assert.match(definition, /Gates 1[–-]8\.1 satisfy and audit/)
assert.match(gate8, /Final decision: `ready_for_pr_review`/)
assert.match(gate8, /UI UX Pro Max.*supporting/is)
assert.match(statusMarkdown, /Overall status: `feature_complete_except_external_blocker`/)
assert.match(statusMarkdown, /Gate 8 — final beta readiness \| Complete/)
assert.match(verificationLog, /## Gate 8 — Final Beta Readiness And PR Preparation/)
assert.match(verificationLog, /Full Chromium Playwright \| Pass \| 58\/58/)
assert.match(verificationLog, /## Gate 8\.1 — User Application Entry Points And Live Study Closure/)
assert.match(draftReadiness, /Decision: `ready_for_draft_pr`/)
assert.match(draftReadiness, /43 discovered; 42 passed; 1 live-provider test gated; 0 failed/i)
assert.match(draftCommitMap, /21 Edit Reference Gate 0–8\.1 commits/i)
assert.match(draftInventory, /Total changed paths \| 162/)
assert.match(draftInventory, /Supabase migration paths changed \| 0/)
assert.match(baseReconciliation, /Decision B — create a clean PR branch/i)
assert.match(baseReconciliation, /package-lock\.json.*byte-identical/is)

assert.equal(
  packageJson.scripts?.['smoke:edit-reference-gate-8-readiness'],
  'tsx server/smoke/edit-reference-gate-8-readiness-smoke.ts',
)
assert.equal(
  packageJson.scripts?.['smoke:edit-reference-adaptation-proof'],
  'tsx server/smoke/edit-reference-adaptation-proof-smoke.ts',
)

const changedPaths = git(['diff', '--name-only', allowDirtyAudit ? startingCommit : `${startingCommit}..HEAD`]).split('\n').filter(Boolean)
assert(changedPaths.length >= 145, `Expected the clean PR replay to retain at least 145 scoped paths, found ${changedPaths.length}.`)
assert.equal(changedPaths.some((filePath) => filePath.startsWith('supabase/migrations/')), false)
assert.equal(git(['merge-base', '--is-ancestor', replayedGate8Commit, 'HEAD'], true), 'ancestor')
if (!allowDirtyAudit) assert.equal(git(['status', '--porcelain']), '', 'Gate 8 readiness requires a clean worktree.')

console.log(JSON.stringify({
  check: 'edit_reference_gate_8_readiness',
  ok: true,
  decision: status.readinessDecision,
  matrixRows: matrixRows.length,
  adaptationCases: 3,
  skillFamilies: skillRows.length,
  sourceBrowserTests: 60,
  prBrowserTests: status.prPreparation.fullPlaywright,
  migrationCount,
  changedPaths: changedPaths.length,
  productionReady: status.productionReady,
}, null, 2))

function git(args: string[], ancestorCheck = false): string {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  if (ancestorCheck) return result.status === 0 ? 'ancestor' : 'not_ancestor'
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result.stdout.trim()
}
