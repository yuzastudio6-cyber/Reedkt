import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runProof } from './worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_beta_runner_boundary_preflight_proof_owner_review_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_beta_runner_boundary_preflight_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof'

const files = {
  proof: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof.md',
  allowlist: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof.md',
  stops: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-stop-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-owner-review-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof.md',
  sourceBoundary: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-boundary-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-claim-policy-after-image-import-proof.md'
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

const proof = parseBlock(
  files.proof,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof'
)
const allowlist = parseBlock(
  files.allowlist,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-allowlist-register-after-image-import-proof'
)
const stops = parseBlock(
  files.stops,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-stop-register-after-image-import-proof'
)
const evidence = parseBlock(
  files.evidence,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-evidence-register-after-image-import-proof'
)
const blockers = parseBlock(
  files.blockers,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-blocker-register-after-image-import-proof'
)
const policy = parseBlock(
  files.policy,
  'worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-claim-policy-after-image-import-proof'
)
const sourceReview = parseBlock(
  files.sourceReview,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof'
)
const sourceAcceptance = parseBlock(
  files.sourceAcceptance,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof'
)
const sourceBoundary = parseBlock(
  files.sourceBoundary,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-boundary-register-after-image-import-proof'
)
const sourcePolicy = parseBlock(
  files.sourcePolicy,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-claim-policy-after-image-import-proof'
)

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [proof, allowlist, stops, evidence, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

const liveProof = runProof()
assert(liveProof.status === 'passed', 'live proof did not pass')
assert(liveProof.decision === decision, 'live proof decision mismatch')
assert(liveProof.acceptedToolCount === 15, 'live proof tool count mismatch')
assert(liveProof.allowFixtureCount === 15, 'live proof allow fixture count mismatch')
assert(liveProof.allowPassedCount === 15, 'live proof allow passed count mismatch')
assert(liveProof.blockedFixtureCount === 14, 'live proof blocked fixture count mismatch')
assert(liveProof.blockedPassedCount === 14, 'live proof blocked passed count mismatch')
assert(liveProof.failedFixtures.length === 0, 'live proof failed fixtures present')

assert(proof.sourceDecision === sourceDecision, 'source decision mismatch')
assert(proof.sourcePr === 1198, 'source PR mismatch')
assert(proof.sourceMergeCommit === 'acb7fe959a19b923d324ca14adde18cb5136a7ef', 'source merge mismatch')
assert(proof.result.status === liveProof.status, 'recorded proof status mismatch')
assert(proof.result.acceptedToolCount === liveProof.acceptedToolCount, 'recorded tool count mismatch')
assert(proof.result.forbiddenPayloadFamilyCount === liveProof.forbiddenPayloadFamilyCount, 'recorded forbidden count mismatch')
assert(proof.result.allowPassedCount === liveProof.allowPassedCount, 'recorded allow pass count mismatch')
assert(proof.result.blockedPassedCount === liveProof.blockedPassedCount, 'recorded block pass count mismatch')
assert(proof.result.failedFixtures.length === 0, 'recorded failed fixtures present')
for (const key of [
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(proof.scope[key] === 'no', `${key} widened`)
  assert(liveProof[key] === 'no', `live proof ${key} widened`)
}

assert(allowlist.acceptedToolIds.length === 15, 'allowlist count mismatch')
assert(allowlist.allowFixtureResult.allowPassedCount === 15, 'allowlist pass count mismatch')
assert(allowlist.productToolCallExecutionApprovedToday === false, 'allowlist widened product execution')
assert(stops.blockedPayloadFamilies.length === 14, 'stop family count mismatch')
assert(stops.blockedFixtureResult.blockedPassedCount === 14, 'blocked fixture pass count mismatch')
assert(stops.runtimeFlagsRequiredFalseCount === 3, 'false flag count mismatch')

assert(evidence.sourceEvidence.ownerReviewPr === 1198, 'evidence source PR mismatch')
assert(evidence.proofEvidence.proofStatus === 'passed', 'evidence proof status mismatch')
assert(evidence.proofEvidence.failedFixtureCount === 0, 'evidence failed fixture count widened')
assert(evidence.notEvidenceFor.includes('product_tool_call_execution'), 'not-evidence product execution missing')
assert(evidence.evidenceStatus === 'accepted_for_owner_review_only', 'evidence status widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker count widened')

assert(policy.allowedClaims.controlledSyntheticProofPassed === true, 'proof allowed claim missing')
assert(policy.allowedClaims.failedFixtureCount === 0, 'failed fixture allowed claim mismatch')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourceReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(sourceReview.sourcePr === 1195, 'source owner review upstream PR mismatch')
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source owner review tool count mismatch')
assert(sourceReview.acceptedEvidence.productExecutionAuthorizedCount === 0, 'source owner review product execution widened')
assert(sourceAcceptance.counts.acceptedForProductExecutionTodayCount === 0, 'source acceptance product execution widened')
assert(sourceBoundary.boundary.controlledSyntheticProofPlanningMayProceed === true, 'source proof planning boundary missing')
assert(sourceBoundary.boundary.productToolCallExecutionReadyToday === false, 'source product execution boundary widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof:proof'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof-runner.mjs',
  'proof package script missing'
)
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof-diagnostics.mjs',
  'diagnostics package script missing'
)

const jsonTrue = (key) => `"${key}"` + ': true'
const jsonYes = (key) => `"${key}"` + ': "yes"'
const jsonCount = (key, count) => `"${key}"` + `: ${count}`
const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  jsonTrue('productToolCallExecutionReadyToday'),
  jsonTrue('workerExecutionReadyToday'),
  jsonTrue('routeExecutionReadyToday'),
  jsonYes('productToolCallExecution'),
  jsonYes('workerExecution'),
  jsonYes('mediaFileOpen'),
  jsonYes('supabaseSql'),
  jsonCount('acceptedForProductExecutionTodayCount', 15),
  jsonCount('acceptedForExternalBetaTodayCount', 15),
  jsonCount('acceptedForProductionTodayCount', 15),
  jsonYes('sqlExecuted'),
  'Docker push ' + 'enabled',
  'Docker run ' + 'enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: proof.sourcePr,
      sourceMergeCommit: proof.sourceMergeCommit,
      acceptedToolCount: liveProof.acceptedToolCount,
      allowPassedCount: liveProof.allowPassedCount,
      blockedPassedCount: liveProof.blockedPassedCount,
      failedFixtureCount: liveProof.failedFixtures.length,
      productToolCallExecution: liveProof.productToolCallExecution,
      nextPrompt: proof.nextPrompt
    },
    null,
    2
  )
)
