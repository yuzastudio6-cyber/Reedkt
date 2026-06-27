import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_after_image_import_proof_completed_with_warnings_ready_for_gap_closure_owner_review_after_image_import_proof'

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof.md',
  closure: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-register-after-image-import-proof.md',
  runner: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-runner-boundary-plan-after-image-import-proof.md',
  policyMap: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-media-artifact-supabase-policy-after-image-import-proof.md',
  betaMap: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-external-beta-blocker-map-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof.md',
  sourceGapMap: 'docs/worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-gap-map-after-image-import-proof.md'
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

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof')
const closure = parseBlock(files.closure, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-register-after-image-import-proof')
const runner = parseBlock(files.runner, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-runner-boundary-plan-after-image-import-proof')
const policyMap = parseBlock(files.policyMap, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-media-artifact-supabase-policy-after-image-import-proof')
const betaMap = parseBlock(files.betaMap, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-external-beta-blocker-map-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-review-after-image-import-proof')
const sourceGapMap = parseBlock(files.sourceGapMap, 'worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-owner-gap-map-after-image-import-proof')

read(files.prompt)

assert(result.decision === decision, 'result decision mismatch')
assert(closure.decision === decision, 'closure decision mismatch')
assert(runner.decision === decision, 'runner decision mismatch')
assert(policyMap.decision === decision, 'policy map decision mismatch')
assert(betaMap.decision === decision, 'beta map decision mismatch')
assert(policy.decision === decision, 'policy decision mismatch')
assert(result.sourcePr === 1177, 'source PR mismatch')
assert(result.sourceMergeCommit === 'b876b2c6225a51a66e3fd00e7bd35c13c5aeeb5a', 'source merge mismatch')
assert(result.gapClosureResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(result.gapClosureResult.docsPlanningGapClosed === true, 'docs planning gap not closed')
assert(result.gapClosureResult.runnerBoundaryProofRequired === true, 'runner boundary proof must remain required')
assert(result.gapClosureResult.mediaArtifactSupabasePolicyGateRequired === true, 'media/artifact/Supabase gate must remain required')
assert(result.gapClosureResult.externalBetaSecurityCostSupportGateRequired === true, 'external beta gate must remain required')

for (const key of [
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactCreationApprovedToday',
  'externalBetaApprovedToday',
  'productionApprovedToday'
]) {
  assert(result.gapClosureResult[key] === false, `${key} must remain false`)
}

assert(closure.counts.closedGapCount === 1, 'closed gap count mismatch')
assert(closure.counts.convertedToNextGateCount === 3, 'converted gap count mismatch')
assert(closure.counts.executionReadyGapCount === 0, 'execution readiness widened')
assert(closure.gapClosureRows.some((row) => row.gapId === 'gap_closure_packet_missing' && row.newStatus === 'closed'), 'missing docs gap closure')
assert(closure.gapClosureRows.some((row) => row.gapId === 'execution_runner_boundary_not_reauthorized' && row.newStatus === 'converted_to_required_next_gate'), 'missing runner boundary conversion')

assert(runner.runnerBoundaryReauthorizedToday === false, 'runner boundary must not be reauthorized today')
assert(runner.productToolCallExecutionApprovedToday === false, 'product tool-call execution must remain false')
assert(runner.futureRunnerBoundaryRequirements.includes('must not dispatch workers, execute routes, call providers/models, or touch Docker/GCP'), 'runner boundary requirement missing')

for (const value of Object.values(policyMap.policyStatus)) assert(value === false, 'media/artifact/Supabase policy must remain false')
assert(policyMap.futureOwnerGatesRequired.includes('supabase_sql_storage_owner_review'), 'Supabase owner gate missing')
assert(policyMap.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(betaMap.externalBetaStatus.internalDryRunAllowed === true, 'internal dry-run status mismatch')
assert(betaMap.externalBetaStatus.betaFacingToolCallExecutionReadyToday === false, 'beta-facing execution widened')
assert(betaMap.externalBetaStatus.externalBetaReadyToday === false, 'external beta widened')
assert(betaMap.externalBetaStatus.paidProductionReadyToday === false, 'production widened')
assert(betaMap.blockersBeforeExternalBeta.includes('security_privacy_cost_support_gate'), 'external beta blocker missing')
assert(betaMap.counts.externalBetaReadyCount === 0, 'external beta count widened')
assert(betaMap.counts.hardBlockerCountPreserved === 101, 'hard blocker count drifted')

assert(policy.allowedClaims.limitedBetaToolCallGapClosurePacketCreated === true, 'allowed gap closure claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden claim missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')

assert(
  sourceReview.decision ===
    'worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof_passed_with_warnings_ready_for_limited_beta_tool_call_gap_closure_after_image_import_proof',
  'source review decision mismatch'
)
assert(sourceReview.acceptedEvidence.externalBetaReadyCount === 0, 'source external beta widened')
assert(sourceGapMap.counts.openGapCount === 4, 'source gap count mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"externalBetaApprovedToday": true',
  '"productionApprovedToday": true',
  '"betaFacingToolCallExecutionReadyToday": true',
  '"externalBetaReadyToday": true',
  '"paidProductionReadyToday": true',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_limited_beta_tool_call_gap_closure_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedSoundCpuToolCount: result.gapClosureResult.acceptedSoundCpuToolCount,
      closedGapCount: closure.counts.closedGapCount,
      convertedToNextGateCount: closure.counts.convertedToNextGateCount,
      externalBetaReadyCount: betaMap.counts.externalBetaReadyCount,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
