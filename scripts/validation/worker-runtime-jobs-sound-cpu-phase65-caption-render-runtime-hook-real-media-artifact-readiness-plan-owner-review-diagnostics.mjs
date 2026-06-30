import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase65_caption_render_runtime_hook_real_media_artifact_readiness_plan_owner_review_passed_with_warnings_ready_for_private_manifest_artifact_policy_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase65_caption_render_runtime_hook_real_media_artifact_readiness_plan_completed_with_warnings_ready_for_real_media_artifact_readiness_plan_owner_review_no_media_no_artifacts'
const sourceHead = 'c37f9a994a7541266c13c631c9eb5a18834e6834'
const sourceMergeCommit = '6f963c344d26658e435f9fcfb926753bffbd6b4c'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE66-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-ARTIFACT-POLICY-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan',
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
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-claim-policy',
)
const phase66 = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-register',
)
const prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan',
)

const sourceResult = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-result',
)
assert(sourceResult.decision === sourceDecision, 'Source Phase 65 decision mismatch')
assertTrue(sourceResult.readinessPlan.realMediaInputReadinessPlanned, 'Source input readiness missing')
assertTrue(sourceResult.readinessPlan.artifactOutputReadinessPlanned, 'Source artifact readiness missing')
assert(sourceResult.readinessPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1886, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'realMediaInputRequirementsAccepted',
  'artifactOutputRequirementsAccepted',
  'executionPreconditionsAccepted',
  'claimPolicyAccepted',
  'privateManifestArtifactPolicyPlanMayProceed',
]) {
  assertTrue(result.reviewedReadinessPlan[key], `result.reviewedReadinessPlan.${key}`)
}
assert(result.reviewedReadinessPlan.soundCpuToolCountAccepted === 15, 'Tool count mismatch')
assert(result.reviewedReadinessPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
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
  assertFalse(result.reviewedReadinessPlan[key], `result.reviewedReadinessPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase65Pr === 1886, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase65Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase65MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real count must be zero')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
for (const key of [
  'realMediaInputRequirementsInventoried',
  'artifactOutputRequirementsInventoried',
  'executionPreconditionsInventoried',
  'privateManifestRequiredBeforeRealMedia',
  'artifactPolicyRequiredBeforeWrite',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assertTrue(acceptance.acceptedScope.privateManifestArtifactPolicyPlanning, 'Policy planning scope missing')
for (const key of [
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.allowedNextStep === 'private manifest artifact policy plan', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainPlanningOnly, 'Next-step planning-only guard missing')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'real_media_artifact_readiness_plan_owner_review_pending',
  ),
  'Owner review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'private_manifest_artifact_policy_plan_pending'),
  'Phase 66 blocker missing',
)

assertTrue(claims.allowedClaims.phase65OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.readinessPlanAccepted, 'Readiness acceptance claim missing')
assertTrue(claims.allowedClaims.privateManifestArtifactPolicyPlanMayProceed, 'Policy plan claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase66.sourceDecision === expectedDecision, 'Phase 66 source decision mismatch')
assertTrue(phase66.policyPlanMayProceed, 'Phase 66 may proceed missing')
assert(phase66.policyPlanScope.confirmSoundCpuToolCount === 15, 'Phase 66 tool count mismatch')
for (const key of ['useRealMedia', 'createArtifact', 'dispatchWorker', 'touchSupabaseSql', 'unlockBeta', 'unlockProduction']) {
  assertFalse(phase66.policyPlanScope[key], `phase66.policyPlanScope.${key}`)
}
assert(phase66.nextPrompt === nextPrompt, 'Phase 66 next prompt mismatch')

assert(prompt.requiredSourceDecision === expectedDecision, 'Prompt source decision mismatch')
assert(prompt.expectedDecision.includes('phase66'), 'Prompt expected decision must be Phase 66')
assertTrue(prompt.planningScope.planPrivateMediaManifestContract, 'Prompt manifest scope missing')
assertTrue(prompt.planningScope.planArtifactOutputPolicy, 'Prompt artifact policy scope missing')
assertNoop(prompt.supabaseClassification, 'prompt')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(prompt.planningScope[key], `prompt.planningScope.${key}`)
}

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-artifact-readiness-plan-owner-review-diagnostics.mjs',
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
      sourcePr: 1886,
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
