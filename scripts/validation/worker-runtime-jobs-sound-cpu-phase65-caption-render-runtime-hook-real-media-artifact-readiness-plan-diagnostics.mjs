import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase65_caption_render_runtime_hook_real_media_artifact_readiness_plan_completed_with_warnings_ready_for_real_media_artifact_readiness_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_real_media_artifact_readiness_plan_no_media_no_artifacts'
const sourceHead = 'ebd46284421d3ee5e9ce8bd03040e2f218e1fa4d'
const sourceMergeCommit = 'd55912a3525ae5cbaac9159863759aeb9f776252'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE65-CAPTION-RENDER-RUNTIME-HOOK-REAL-MEDIA-ARTIFACT-READINESS-PLAN-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-input-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-input-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-artifact-output-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-artifact-output-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-execution-precondition-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-execution-precondition-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-result',
)
const inputs = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-input-readiness-register',
)
const artifacts = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-artifact-output-readiness-register',
)
const preconditions = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-execution-precondition-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-readiness-claim-policy',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-controlled-external-agent-execution-proof-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source owner-review decision mismatch')
assertTrue(sourceReview.reviewedControlledProof.realMediaArtifactReadinessPlanMayProceed, 'Source did not allow readiness planning')
assert(sourceReview.reviewedControlledProof.soundCpuToolCountAccepted === 15, 'Source tool count mismatch')

const hookText = readText('server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts')
for (const token of [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
]) {
  assert(hookText.includes(token), `Hook source missing rejected input token ${token}`)
  assert(inputs.rejectedInputsUntilLaterGate.includes(token), `Input register missing rejected token ${token}`)
}

assert(result.decision === expectedDecision, 'Phase 65 decision mismatch')
assert(result.sourceVerification.sourcePr === 1883, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(result.readinessPlan.realMediaInputReadinessPlanned, 'Real-media input readiness not planned')
assertTrue(result.readinessPlan.artifactOutputReadinessPlanned, 'Artifact output readiness not planned')
assertTrue(result.readinessPlan.ownerReviewBeforeExecutionRequired, 'Owner review before execution missing')
assert(result.readinessPlan.soundCpuToolCountConfirmed === 15, 'Tool count mismatch')
assert(result.readinessPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(result.readinessPlan[key], `result.readinessPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(inputs.decision === expectedDecision, 'Input register decision mismatch')
assert(inputs.futureInputRequirements.privateMediaManifestId === 'required_before_real_media', 'Private manifest requirement missing')
assert(inputs.futureInputRequirements.normalizedOcrRegionBoxes === 'hashed_metadata_only', 'Hashed OCR metadata requirement missing')
assertTrue(inputs.allowedToday.syntheticMetadataPlanning, 'Synthetic metadata planning should remain allowed')
for (const key of ['realMediaBytes', 'mediaFileOpen', 'signedUrlFetch', 'ocrInference', 'workerExecution']) {
  assertFalse(inputs.allowedToday[key], `inputs.allowedToday.${key}`)
}

assert(artifacts.decision === expectedDecision, 'Artifact register decision mismatch')
assertTrue(artifacts.futureArtifactRequirements.noPublicArtifactDefault, 'No-public-artifact default missing')
assertFalse(artifacts.futureArtifactRequirements.signedUrlCreationDefault, 'Signed URL default must be false')
for (const key of [
  'artifactWrite',
  'storageTransfer',
  'signedUrlCreation',
  'publicArtifactCreation',
  'renderExport',
]) {
  assertFalse(artifacts.allowedToday[key], `artifacts.allowedToday.${key}`)
}

assert(preconditions.decision === expectedDecision, 'Precondition register decision mismatch')
assert(preconditions.requiredBeforeAnyRealExecution.includes('real_media_artifact_readiness_plan_owner_review'), 'Owner review precondition missing')
for (const value of Object.values(preconditions.runtimeFlagsToday)) {
  assert(value === '0', 'Runtime flag must remain disabled')
}
assertAllFalse(preconditions.approvedForToday, 'preconditions.approvedForToday')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'real_media_artifact_readiness_plan_pending'),
  'Readiness plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_media_artifact_readiness_plan_owner_review_pending'),
  'Owner review blocker missing',
)

assertTrue(claims.allowedClaims.phase65ReadinessPlanCompleted, 'Phase 65 claim missing')
assertTrue(claims.allowedClaims.realMediaInputRequirementsInventoried, 'Input inventory claim missing')
assertTrue(claims.allowedClaims.artifactOutputRequirementsInventoried, 'Artifact inventory claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerReview.sourceDecision === expectedDecision, 'Owner review source decision mismatch')
assertTrue(ownerReview.ownerReviewMayProceed, 'Owner review may proceed missing')
assertFalse(ownerReview.ownerReviewAllowedScope.approveExecutionToday, 'Owner review must not approve execution today')
assert(ownerReview.nextPrompt === nextPrompt, 'Owner review next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.expectedDecision.includes('phase65'), 'Owner prompt expected decision must be Phase 65')
assertNoop(ownerPrompt.supabaseClassification, 'owner prompt')
for (const key of [
  'approveExecutionToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(ownerPrompt.reviewScope[key], `ownerPrompt.reviewScope.${key}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

const changedText = docs.map(([file]) => readText(file)).join('\n')
const forbiddenPatterns = [
  /"useRealMedia(?:Today)?":\s*true/,
  /"createArtifact(?:Today)?":\s*true/,
  /"dispatchWorker(?:Today)?":\s*true/,
  /"callRouteToolProvider(?:Today)?":\s*true/,
  /"touchSupabaseSql(?:Today)?":\s*true/,
  /"unlockBeta(?:Today)?":\s*true/,
  /"unlockProduction(?:Today)?":\s*true/,
  /"realMediaProcessing":\s*true/,
  /"artifactCreation":\s*true/,
  /"workerDispatch":\s*true/,
  /"routeToolProviderExecution":\s*true/,
  /"supabaseSql":\s*true/,
  /"realUserMediaBeta":\s*true/,
  /"paidProduction":\s*true/,
  /generated_local_fixture_passed":\s*true/,
  /dry_run_passed":\s*true/,
  /runtime_readiness":\s*true/,
  /worker_readiness":\s*true/,
  /media_readiness":\s*true/,
  /beta_readiness":\s*true/,
  /production_readiness":\s*true/,
]
for (const pattern of forbiddenPatterns) {
  assert(!pattern.test(changedText), `Forbidden readiness or execution claim matched ${pattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1883,
      sourceMergeCommit,
      nextPrompt,
      soundCpuToolCount: 15,
      readyForRealExecutionToday: 0,
      supabaseClassification: 'no-op',
    },
    null,
    2,
  ),
)
