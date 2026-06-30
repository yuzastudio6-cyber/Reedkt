import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase66_caption_render_runtime_hook_private_manifest_artifact_policy_owner_review_passed_with_warnings_ready_for_private_manifest_source_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase66_caption_render_runtime_hook_private_manifest_artifact_policy_plan_completed_with_warnings_ready_for_private_manifest_artifact_policy_owner_review_no_media_no_artifacts'
const sourceHead = 'b67c341403afa6105c0c93f0a87243adaaffa1aa'
const sourceMergeCommit = 'e96d415d4a149a1c74683801366353faa28f0640'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE67-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-SOURCE-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan.md',
    'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan',
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
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-claim-policy',
)
const phase67 = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan-register',
)
const prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-plan',
)

const sourceResult = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-result.md',
  'worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-plan-result',
)
assert(sourceResult.decision === sourceDecision, 'Source Phase 66 policy decision mismatch')
assertTrue(sourceResult.policyPlan.privateMediaManifestContractPlanned, 'Source manifest contract missing')
assertTrue(sourceResult.policyPlan.artifactOutputPolicyPlanned, 'Source artifact policy missing')
assert(sourceResult.policyPlan.readyForRealExecutionToday === 0, 'Source ready-for-real count must be zero')

assert(result.decision === expectedDecision, 'Owner-review decision mismatch')
assert(result.sourceVerification.sourcePr === 1891, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'privateManifestContractAccepted',
  'artifactOutputPolicyAccepted',
  'noPublicArtifactDefaultsAccepted',
  'executionPreconditionsAccepted',
  'privateManifestSourcePlanMayProceed',
]) {
  assertTrue(result.reviewedPolicyPlan[key], `result.reviewedPolicyPlan.${key}`)
}
assert(result.reviewedPolicyPlan.soundCpuToolCountAccepted === 15, 'Tool count mismatch')
assert(result.reviewedPolicyPlan.readyForRealExecutionToday === 0, 'Ready-for-real count must remain zero')
for (const key of [
  'approveExecutionToday',
  'createManifestToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(result.reviewedPolicyPlan[key], `result.reviewedPolicyPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase66Pr === 1891, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase66Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase66MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'Acceptance ready-for-real count must be zero')
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
for (const key of [
  'privateManifestContractPlanned',
  'artifactOutputPolicyPlanned',
  'noPublicArtifactDefaultsPlanned',
  'executionPreconditionsPlanned',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assertTrue(acceptance.acceptedScope.privateManifestSourcePlanning, 'Source planning scope missing')
for (const key of [
  'manifestCreation',
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
assert(safety.allowedNextStep === 'private manifest source plan', 'Safety next step mismatch')
assertTrue(safety.nextStepMustRemainPlanningOnly, 'Next step planning-only guard missing')
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'private_manifest_artifact_policy_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'private_manifest_source_plan_pending'),
  'Private manifest source plan blocker missing',
)

assertTrue(claims.allowedClaims.phase66OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.privateManifestArtifactPolicyAccepted, 'Policy accepted claim missing')
assertTrue(claims.allowedClaims.privateManifestSourcePlanMayProceed, 'Source plan claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase67.sourceDecision === expectedDecision, 'Phase 67 source decision mismatch')
assertTrue(phase67.sourcePlanMayProceed, 'Phase 67 may proceed missing')
assert(phase67.sourcePlanScope.confirmSoundCpuToolCount === 15, 'Phase 67 tool count mismatch')
for (const key of [
  'createManifestSource',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase67.sourcePlanScope[key], `phase67.sourcePlanScope.${key}`)
}
assert(phase67.nextPrompt === nextPrompt, 'Phase 67 next prompt mismatch')

assert(prompt.requiredSourceDecision === expectedDecision, 'Prompt source decision mismatch')
assert(prompt.expectedDecision.includes('phase67'), 'Prompt expected decision must be Phase 67')
assertTrue(prompt.planningScope.planManifestSourceTypes, 'Prompt source type scope missing')
assertTrue(prompt.planningScope.planManifestValidationSchema, 'Prompt validation schema scope missing')
assertNoop(prompt.supabaseClassification, 'prompt')
for (const key of [
  'createManifestSourceToday',
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
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-manifest-artifact-policy-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

const changedText = docs.map(([file]) => readText(file)).join('\n')
const forbiddenPatterns = [
  /"createManifest(?:Today)?":\s*true/,
  /"createManifestSource(?:Today)?":\s*true/,
  /"useRealMedia(?:Today)?":\s*true/,
  /"createArtifact(?:Today)?":\s*true/,
  /"dispatchWorker(?:Today)?":\s*true/,
  /"callRouteToolProvider(?:Today)?":\s*true/,
  /"touchSupabaseSql(?:Today)?":\s*true/,
  /"unlockBeta(?:Today)?":\s*true/,
  /"unlockProduction(?:Today)?":\s*true/,
  /"approveExecutionToday":\s*true/,
  /"manifestCreation":\s*true/,
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
      sourcePr: 1891,
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
