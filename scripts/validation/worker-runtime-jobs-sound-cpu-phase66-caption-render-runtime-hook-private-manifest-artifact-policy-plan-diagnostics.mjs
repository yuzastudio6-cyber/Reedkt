import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase66_caption_render_runtime_hook_private_manifest_artifact_policy_plan_completed_with_warnings_ready_for_private_manifest_artifact_policy_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase65_caption_render_runtime_hook_real_media_artifact_readiness_plan_owner_review_passed_with_warnings_ready_for_private_manifest_artifact_policy_plan_no_media_no_artifacts'
const sourceHead = 'bfb26b1181cdf00aa68514c11f6278b37888bbbd'
const sourceMergeCommit = '4c51e6a6aad1a2576148d5f534cba5726aaa6c50'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE66-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-ARTIFACT-POLICY-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-result.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-media-manifest-contract-plan.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-media-manifest-contract-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-artifact-output-policy-plan.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-artifact-output-policy-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-no-public-artifact-policy-plan.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-no-public-artifact-policy-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-worker-execution-policy-precondition-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-worker-execution-policy-precondition-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-result',
)
const manifest = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-media-manifest-contract-plan',
)
const artifact = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-artifact-output-policy-plan',
)
const publicPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-no-public-artifact-policy-plan',
)
const preconditions = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-worker-execution-policy-precondition-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-claim-policy',
)
const ownerReview = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-register',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review',
)

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-result.md',
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-result',
)
assert(sourceReview.decision === sourceDecision, 'Source Phase 65 owner-review decision mismatch')
assertTrue(sourceReview.reviewedReadinessPlan.privateManifestArtifactPolicyPlanMayProceed, 'Source did not allow policy planning')
assert(sourceReview.reviewedReadinessPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Phase 66 decision mismatch')
assert(result.sourceVerification.sourcePr === 1888, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'privateMediaManifestContractPlanned',
  'artifactOutputPolicyPlanned',
  'noPublicArtifactDefaultsPlanned',
  'ownerReviewBeforeExecutionRequired',
]) {
  assertTrue(result.policyPlan[key], `result.policyPlan.${key}`)
}
assert(result.policyPlan.soundCpuToolCountConfirmed === 15, 'Tool count mismatch')
assert(result.policyPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(result.policyPlan[key], `result.policyPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(manifest.decision === expectedDecision, 'Manifest plan decision mismatch')
assert(manifest.manifestContract.manifestId === 'required_future_field', 'Future manifest ID requirement missing')
assert(manifest.manifestContract.mediaByteAccess === 'blocked_until_later_execution_gate', 'Media byte access must be blocked')
for (const key of [
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloadsAllowed',
  'rawFramesAllowed',
  'rawOcrTextAllowed',
  'providerOutputBlobsAllowed',
]) {
  assertFalse(manifest.manifestContract[key], `manifest.manifestContract.${key}`)
}
for (const key of ['manifestCreation', 'manifestPersistence', 'mediaOpen', 'mediaRead', 'signedUrlFetch', 'supabaseReadOrWrite']) {
  assertFalse(manifest.allowedToday[key], `manifest.allowedToday.${key}`)
}

assert(artifact.decision === expectedDecision, 'Artifact policy decision mismatch')
assertTrue(artifact.artifactPolicy.privateArtifactManifestRequired, 'Private artifact manifest missing')
assertFalse(artifact.artifactPolicy.publicArtifactsDefault, 'Public artifact default must be false')
assertFalse(artifact.artifactPolicy.signedUrlCreationDefault, 'Signed URL default must be false')
assertFalse(artifact.artifactPolicy.renderExportDefault, 'Render/export default must be false')
for (const key of ['artifactWrite', 'storageTransfer', 'signedUrlCreation', 'publicArtifactCreation', 'renderExport']) {
  assertFalse(artifact.allowedToday[key], `artifact.allowedToday.${key}`)
}

assert(publicPolicy.decision === expectedDecision, 'No-public-artifact policy decision mismatch')
assertFalse(publicPolicy.noPublicArtifactPolicy.publicArtifactDefault, 'Public artifact default must be false')
assertFalse(publicPolicy.noPublicArtifactPolicy.signedUrlDefault, 'Signed URL default must be false')
assertTrue(publicPolicy.noPublicArtifactPolicy.ownerApprovalRequiredBeforeAnyPublicExposure, 'Owner approval public exposure guard missing')
for (const value of Object.values(publicPolicy.blockedToday)) {
  assert(value === true, 'Public-artifact blockedToday values must be true')
}

assert(preconditions.decision === expectedDecision, 'Precondition decision mismatch')
assert(preconditions.requiredBeforeAnyExecution.includes('private_manifest_artifact_policy_owner_review'), 'Owner review precondition missing')
for (const value of Object.values(preconditions.runtimeFlagsToday)) {
  assert(value === '0', 'Runtime flags must remain disabled')
}
assertAllFalse(preconditions.approvedForToday, 'preconditions.approvedForToday')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'private_manifest_artifact_policy_plan_pending'),
  'Policy plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'private_manifest_artifact_policy_owner_review_pending'),
  'Policy owner-review blocker missing',
)

assertTrue(claims.allowedClaims.phase66PolicyPlanCompleted, 'Phase 66 plan claim missing')
assertTrue(claims.allowedClaims.privateManifestContractPlanned, 'Manifest plan claim missing')
assertTrue(claims.allowedClaims.artifactOutputPolicyPlanned, 'Artifact plan claim missing')
assertTrue(claims.allowedClaims.noPublicArtifactDefaultsPlanned, 'No-public default claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerReview.sourceDecision === expectedDecision, 'Owner-review source decision mismatch')
assertTrue(ownerReview.ownerReviewMayProceed, 'Owner review may proceed missing')
assertFalse(ownerReview.ownerReviewAllowedScope.approveExecutionToday, 'Owner review must not approve execution')
assert(ownerReview.nextPrompt === nextPrompt, 'Owner review next prompt mismatch')

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.expectedDecision.includes('phase66'), 'Owner prompt expected decision must be Phase 66')
assertTrue(ownerPrompt.reviewScope.reviewPrivateManifestContract, 'Owner prompt manifest review scope missing')
assertTrue(ownerPrompt.reviewScope.reviewArtifactOutputPolicy, 'Owner prompt artifact review scope missing')
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-diagnostics.mjs',
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
  /"approveExecutionToday":\s*true/,
  /"manifestCreation":\s*true/,
  /"manifestPersistence":\s*true/,
  /"artifactWrite":\s*true/,
  /"publicArtifactCreation":\s*true/,
  /"storageObjectCreated":\s*true/,
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
      sourcePr: 1888,
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
