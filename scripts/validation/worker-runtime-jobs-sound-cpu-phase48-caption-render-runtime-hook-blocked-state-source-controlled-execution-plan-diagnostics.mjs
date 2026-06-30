import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase48_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE48-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PLAN-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan:diagnostics'

const sourcePr = 1789
const sourceHead = '0e03934edd0493b07860c415f0285db1c2f13e56'
const sourceMergeCommit = 'c43f29453d82b7ecd0d105d0f2864e36aee0f2d1'
const phase47ProofPr = 1786
const phase47ProofMergeCommit = '83ec3eb4721b9cc87a79cbaa24ad8b592cad742c'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
  ],
]

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan')
const input = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register')
const boundary = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-boundary-register')
const readiness = parsed.get('worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register')
const blocker = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-blocker-register')
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-claim-policy')
const prompt = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review')

assert(plan.decision === decision, 'Phase 48 decision mismatch')
assert(plan.sourceVerification.sourcePr === sourcePr, 'source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(plan.sourceVerification.phase47ProofPr === phase47ProofPr, 'Phase 47 proof PR mismatch')
assert(plan.sourceVerification.phase47ProofMergeCommit === phase47ProofMergeCommit, 'Phase 47 proof merge mismatch')
for (const key of [
  'planningOnly',
  'futureProofMayUseSyntheticNoMediaNoArtifactInput',
  'futureProofMayInvokeFactoryOnlyInsideLaterApprovedProofGate',
  'futureProofMayInvokeBlockedAssertionOnlyInsideLaterApprovedProofGate',
  'futureProofMustExpectBlockedResult',
  'futureProofMustRemoveTemporaryProofFileBeforeStaging',
]) {
  assertTrue(plan.plan[key], `plan.plan.${key}`)
}
for (const key of Object.keys(plan.approvedToday)) assertFalse(plan.approvedToday[key], `plan.approvedToday.${key}`)
assert(plan.nextPrompt === nextPrompt, 'next prompt mismatch')
assertSupabaseNoop(plan.supabaseClassification, 'plan')

assert(input.sourceDecision === decision, 'input source decision mismatch')
assert(input.futureSyntheticInputPlan.inputKind === 'synthetic_no_media_no_artifact', 'input kind mismatch')
for (const key of [
  'approvedPlanSnapshotIdRequired',
  'workspaceIdRequired',
  'projectIdRequired',
  'jobIdRequired',
  'idempotencyKeyRequired',
  'runtimeDisabledFlagsRequired',
]) {
  assertTrue(input.futureSyntheticInputPlan[key], `input.futureSyntheticInputPlan.${key}`)
}
for (const key of [
  'mediaPathAllowed',
  'signedUrlAllowed',
  'publicArtifactUrlAllowed',
  'rawPromptAllowed',
  'providerOutputAllowed',
  'serviceRolePayloadAllowed',
]) {
  assertFalse(input.futureSyntheticInputPlan[key], `input.futureSyntheticInputPlan.${key}`)
}
for (const key of Object.keys(input.futureExpectedResultPlan)) assertTrue(input.futureExpectedResultPlan[key], `input.futureExpectedResultPlan.${key}`)

assert(boundary.sourceDecision === decision, 'boundary source decision mismatch')
for (const key of Object.keys(boundary.plannedFutureProofBoundaries)) assertTrue(boundary.plannedFutureProofBoundaries[key], `boundary.plannedFutureProofBoundaries.${key}`)
for (const key of Object.keys(boundary.blockedInThisGate)) assertTrue(boundary.blockedInThisGate[key], `boundary.blockedInThisGate.${key}`)

assert(readiness.sourceDecision === decision, 'readiness source decision mismatch')
assertTrue(readiness.phase49MayProceedOnlyAfterOwnerReview, 'Phase 49 owner review requirement missing')
for (const key of Object.keys(readiness.futureProofReadiness)) assertTrue(readiness.futureProofReadiness[key], `readiness.futureProofReadiness.${key}`)
for (const key of Object.keys(readiness.stillBlockedUntilLaterGate)) assertTrue(readiness.stillBlockedUntilLaterGate[key], `readiness.stillBlockedUntilLaterGate.${key}`)

assert(blocker.decision === decision, 'blocker decision mismatch')
assert(Array.isArray(blocker.blockingItems) && blocker.blockingItems.length === 0, 'blocker register must be empty')
assert(blocker.selectedNextPrompt === nextPrompt, 'blocker next prompt mismatch')

assert(claimPolicy.decision === decision, 'claim policy decision mismatch')
for (const key of Object.keys(claimPolicy.allowedClaims)) assertTrue(claimPolicy.allowedClaims[key], `claimPolicy.allowedClaims.${key}`)
for (const key of Object.keys(claimPolicy.disallowedClaims)) assertFalse(claimPolicy.disallowedClaims[key], `claimPolicy.disallowedClaims.${key}`)
assertSupabaseNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(prompt.requiredSourceDecision === decision, 'owner-review prompt required source mismatch')
assert(prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'owner-review prompt source head mismatch')
assertTrue(prompt.planningOnly, 'owner-review prompt must be planning-only')
for (const item of [
  'synthetic no-media no-artifact input plan',
  'blocked-result expectation',
  'temporary proof file removal policy',
  'owner review required before any proof run',
  'real media and artifact gates remain closed',
]) {
  assert(prompt.reviewMustConfirm.includes(item), `owner-review prompt missing ${item}`)
}
assertSupabaseNoop(prompt.supabaseClassification, 'owner-review prompt')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
)
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourcePr === phase47ProofPr, 'source owner-review source PR mismatch')
assert(sourceReview.sourceVerification.sourceMergeCommit === phase47ProofMergeCommit, 'source owner-review merge mismatch')
assertTrue(sourceReview.reviewDecision.controlledExecutionPlanMayProceed, 'source owner-review did not approve planning')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-diagnostics.mjs'), 'package script missing or incorrect')

for (const forbiddenPath of [
  'server/workers/sound-cpu/phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts',
  'node_modules',
  'dist',
  'dist-server',
]) {
  assert(!fs.existsSync(path.join(repoRoot, forbiddenPath)), `${forbiddenPath} must not exist`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr,
      sourceMergeCommit,
      controlledExecutionPlanCreated: true,
      actualFactoryInvocation: false,
      actualBlockedAssertionInvocation: false,
      runtimeExecution: false,
      realMediaInput: false,
      artifactCreation: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
