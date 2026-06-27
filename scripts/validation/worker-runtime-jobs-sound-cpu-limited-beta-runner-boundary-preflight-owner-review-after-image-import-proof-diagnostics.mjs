import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_beta_runner_boundary_preflight_owner_review_after_image_import_proof_passed_with_warnings_ready_for_controlled_limited_beta_runner_boundary_preflight_proof_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof_completed_with_warnings_ready_for_limited_beta_runner_boundary_preflight_owner_review_after_image_import_proof'

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-evidence-review-register-after-image-import-proof.md',
  boundary: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-boundary-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-limited-beta-runner-boundary-preflight-proof-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  sourcePreflight: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-scope-register-after-image-import-proof.md',
  sourceTools: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-tool-register-after-image-import-proof.md',
  sourcePayload: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-payload-guard-register-after-image-import-proof.md',
  sourceBlockers: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-blocker-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-claim-policy-after-image-import-proof.md'
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

const review = parseBlock(
  files.review,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof'
)
const acceptance = parseBlock(
  files.acceptance,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-acceptance-register-after-image-import-proof'
)
const evidence = parseBlock(
  files.evidence,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-evidence-review-register-after-image-import-proof'
)
const boundary = parseBlock(
  files.boundary,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-boundary-register-after-image-import-proof'
)
const policy = parseBlock(
  files.policy,
  'worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-claim-policy-after-image-import-proof'
)
const sourcePreflight = parseBlock(
  files.sourcePreflight,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof'
)
const sourceScope = parseBlock(
  files.sourceScope,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-scope-register-after-image-import-proof'
)
const sourceTools = parseBlock(
  files.sourceTools,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-tool-register-after-image-import-proof'
)
const sourcePayload = parseBlock(
  files.sourcePayload,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-payload-guard-register-after-image-import-proof'
)
const sourceBlockers = parseBlock(
  files.sourceBlockers,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-blocker-register-after-image-import-proof'
)
const sourcePolicy = parseBlock(
  files.sourcePolicy,
  'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-claim-policy-after-image-import-proof'
)

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [review, acceptance, evidence, boundary, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(review.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourcePr === 1195, 'source PR mismatch')
assert(review.sourceMergeCommit === '2a955c3a493fe0357edae7f4ff5b7d18fa934f13', 'source merge mismatch')
assert(review.acceptedEvidence.boundedRunnerBoundaryPreflightPlan === 'accepted_for_controlled_synthetic_proof_planning_only', 'owner review acceptance widened')
assert(review.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(review.acceptedEvidence.forbiddenPayloadStopCount === 14, 'forbidden payload stop count mismatch')
assert(review.acceptedEvidence.failedFixtureCount === 0, 'failed fixture count widened')
assert(review.acceptedEvidence.productExecutionAuthorizedCount === 0, 'product execution widened')
assert(review.acceptedEvidence.externalBetaReadyCount === 0, 'external beta widened')
assert(review.acceptedEvidence.productionReadyCount === 0, 'production widened')
assert(review.acceptedForToday.controlledLimitedBetaRunnerBoundaryPreflightProofPlanning === 'yes', 'proof planning not accepted')

for (const key of [
  'controlledLimitedBetaRunnerBoundaryPreflightProofExecution',
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
  assert(review.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(acceptance.acceptedForControlledSyntheticProofPlanning.length === 7, 'accepted planning count mismatch')
assert(acceptance.counts.acceptedPlanningItemCount === 7, 'accepted planning item count mismatch')
assert(acceptance.counts.notAcceptedForExecutionTodayCount === 17, 'not accepted execution count mismatch')
assert(acceptance.counts.acceptedForProductExecutionTodayCount === 0, 'product execution accepted')
assert(acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'external beta accepted')
assert(acceptance.counts.acceptedForProductionTodayCount === 0, 'production accepted')
for (const item of ['worker_dispatch', 'media_file_open', 'artifact_write', 'supabase_mutation', 'sql_execution']) {
  assert(acceptance.notAcceptedForExecutionToday.includes(item), `missing non-accepted item: ${item}`)
}

assert(evidence.sourceEvidence.boundedPreflightPr === 1195, 'evidence source PR mismatch')
assert(evidence.sourceEvidence.boundedPreflightMergeCommit === '2a955c3a493fe0357edae7f4ff5b7d18fa934f13', 'evidence source merge mismatch')
assert(evidence.reviewResult.acceptedSoundCpuToolCount === 15, 'evidence tool count mismatch')
assert(evidence.reviewResult.forbiddenPayloadStopCount === 14, 'evidence forbidden count mismatch')
assert(evidence.reviewResult.productExecutionAuthorizedCount === 0, 'evidence product execution widened')
assert(evidence.evidenceStatus === 'accepted_for_controlled_synthetic_proof_planning_only', 'evidence status widened')

assert(boundary.boundary.controlledSyntheticProofPlanningMayProceed === true, 'proof planning boundary missing')
for (const key of [
  'controlledSyntheticProofExecutionReadyToday',
  'productToolCallExecutionReadyToday',
  'workerExecutionReadyToday',
  'routeExecutionReadyToday',
  'mediaFileOpenReadyToday',
  'mediaProcessingReadyToday',
  'artifactDeliveryReadyToday',
  'supabaseSqlReadyToday',
  'providerModelCallReadyToday',
  'dockerGcpReadyToday',
  'externalBetaReadyToday',
  'productionReadyToday'
]) {
  assert(boundary.boundary[key] === false, `${key} widened`)
}
assert(boundary.counts.requiredNextProofLimitCount === 7, 'required next proof limit count mismatch')
assert(boundary.counts.readyForExecutionTodayCount === 0, 'execution readiness widened')

assert(policy.allowedClaims.controlledSyntheticProofPlanningMayProceed === true, 'allowed proof planning claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(sourcePreflight.decision === sourceDecision, 'source preflight decision mismatch')
assert(sourcePreflight.sourcePr === 1193, 'upstream source PR mismatch')
assert(sourcePreflight.preflightPlan.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourcePreflight.preflightPlan.forbiddenPayloadStopCount === 14, 'source forbidden count mismatch')
assert(sourcePreflight.acceptedForToday.productToolCallExecution === 'no', 'source product execution widened')
assert(sourceScope.counts.productExecutionAuthorizedCount === 0, 'source scope product execution widened')
assert(sourceTools.counts.acceptedForProductExecutionTodayCount === 0, 'source tools execution widened')
assert(sourcePayload.counts.forbiddenPayloadFamilyCount === 14, 'source payload forbidden count mismatch')
assert(sourceBlockers.counts.readyForProductExecutionBlockerCount === 0, 'source blockers widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-beta-runner-boundary-preflight-owner-review-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const jsonTrue = (key) => `"${key}"` + ': true'
const jsonYes = (key) => `"${key}"` + ': "yes"'
const jsonCount = (key, count) => `"${key}"` + `: ${count}`
const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  jsonTrue('productToolCallExecutionReadyToday'),
  jsonTrue('workerExecutionReadyToday'),
  jsonTrue('routeExecutionReadyToday'),
  jsonTrue('externalBetaReadyToday'),
  jsonTrue('productionReadyToday'),
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
      status: 'worker_runtime_jobs_sound_cpu_limited_beta_runner_boundary_preflight_owner_review_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: review.sourcePr,
      sourceMergeCommit: review.sourceMergeCommit,
      acceptedSoundCpuToolCount: review.acceptedEvidence.acceptedSoundCpuToolCount,
      forbiddenPayloadStopCount: review.acceptedEvidence.forbiddenPayloadStopCount,
      controlledSyntheticProofPlanningMayProceed: boundary.boundary.controlledSyntheticProofPlanningMayProceed,
      productExecutionAuthorizedCount: review.acceptedEvidence.productExecutionAuthorizedCount,
      externalBetaReadyToday: boundary.boundary.externalBetaReadyToday,
      nextPrompt: review.nextPrompt
    },
    null,
    2
  )
)
