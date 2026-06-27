import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_runner_boundary_proof_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_proof_owner_review_after_image_import_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof.md',
  allowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof.md',
  blocked: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocked-payload-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-sanitized-evidence-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof.md',
  runner: 'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof-runner.mjs',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-owner-acceptance-register-after-image-import-proof.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof')
const allowlist = parseBlock(files.allowlist, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-allowlist-proof-register-after-image-import-proof')
const blocked = parseBlock(files.blocked, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocked-payload-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-sanitized-evidence-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-controlled-runner-boundary-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-runner-boundary-owner-acceptance-register-after-image-import-proof')

read(files.prompt)
read(files.runner)

for (const row of [result, allowlist, blocked, evidence, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const { runProof, acceptedToolIds } = await import(pathToFileURL(path.join(root, files.runner)).href)
const proof = runProof()

assert(proof.status === 'passed', 'proof runner did not pass')
assert(proof.decision === decision, 'proof runner decision mismatch')
assert(proof.sourceMergeCommit === '95279e0f36e2eb70d69086fb5537657f53e11896', 'proof source merge mismatch')
assert(proof.acceptedToolCount === 15, 'proof tool count mismatch')
assert(proof.allowFixtureCount === 15, 'proof allow fixture count mismatch')
assert(proof.allowPassedCount === 15, 'proof allow passed count mismatch')
assert(proof.blockedFixtureCount === 14, 'proof blocked fixture count mismatch')
assert(proof.blockedPassedCount === 14, 'proof blocked passed count mismatch')
assert(proof.failedFixtures.length === 0, 'proof failed fixtures present')

assert(result.sourcePr === 1186, 'source PR mismatch')
assert(result.sourceMergeCommit === proof.sourceMergeCommit, 'result source merge mismatch')
assert(result.result.status === proof.status, 'recorded proof status mismatch')
assert(result.result.acceptedToolCount === proof.acceptedToolCount, 'recorded tool count mismatch')
assert(result.result.allowPassedCount === proof.allowPassedCount, 'recorded allow passed count mismatch')
assert(result.result.blockedPassedCount === proof.blockedPassedCount, 'recorded blocked passed count mismatch')
assert(result.scope.syntheticPayloadFixturesOnly === true, 'synthetic proof scope missing')

for (const key of [
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(result.scope[key] === 'no', `${key} widened in result`)
  assert(proof[key] === 'no', `${key} widened in proof`)
}

assert(JSON.stringify(allowlist.acceptedToolIds) === JSON.stringify(acceptedToolIds), 'accepted tool IDs mismatch')
assert(allowlist.allowFixtureResult.allowFixtureCount === 15, 'allowlist count mismatch')
assert(allowlist.allowFixtureResult.allowFailedCount === 0, 'allow failed count mismatch')
assert(allowlist.productToolCallExecutionApprovedToday === false, 'tool-call execution approved unexpectedly')

assert(blocked.blockedFixtureResult.blockedFixtureCount === 14, 'blocked fixture count mismatch')
assert(blocked.blockedFixtureResult.blockedFailedCount === 0, 'blocked failed count mismatch')
assert(blocked.blockedCategories.includes('supabase_sql'), 'supabase block missing')
assert(blocked.blockedCategories.includes('external_beta_claim'), 'external beta block missing')

for (const [key, value] of Object.entries(evidence.evidenceRecorded)) {
  if (key.endsWith('Recorded')) assert(value === false, `${key} widened`)
}
for (const value of Object.values(evidence.runtimeFlags)) assert(value === false, 'runtime flag widened')
assert(evidence.trackedRepoMutationFromProof === false, 'proof mutated tracked repo')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForExecutionBlockerCount === 0, 'execution blocker count widened')
assert(policy.allowedClaims.controlledRunnerBoundaryProofPassed === true, 'allowed proof claim missing')
assert(policy.forbiddenClaims.runnerBoundaryReauthorizedToday === true, 'runner reauth forbidden missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'execution forbidden missing')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(
  sourceReview.decision ===
    'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_runner_boundary_proof_after_image_import_proof',
  'source review decision mismatch'
)
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedEvidence.readyForExecutionTodayCount === 0, 'source execution readiness widened')
assert(sourceAcceptance.counts.acceptedForExecutionTodayCount === 0, 'source accepted execution count widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-runner-boundary-proof-after-image-import-proof:proof'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof-runner.mjs',
  'proof package script missing'
)
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-runner-boundary-proof-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runner-boundary-proof-after-image-import-proof-diagnostics.mjs',
  'diagnostics package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"productToolCallExecutionApprovedToday": true',
  '"acceptedForExecutionTodayCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'external beta ready',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_runner_boundary_proof_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedToolCount: result.result.acceptedToolCount,
      allowPassedCount: result.result.allowPassedCount,
      blockedPassedCount: result.result.blockedPassedCount,
      acceptedForExecutionTodayCount: sourceAcceptance.counts.acceptedForExecutionTodayCount,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
