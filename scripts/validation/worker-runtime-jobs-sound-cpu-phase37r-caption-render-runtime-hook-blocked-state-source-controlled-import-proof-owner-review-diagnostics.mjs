import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37r_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37r_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_media_no_artifacts'
const previousOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts'
const sourceMergeCommit = '1f06aabc157b0cccf732271737b91bb01cda3297'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  try {
    return JSON.parse(match[1])
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertAbsent(text, pattern, label) {
  assert(!pattern.test(text), `${label} must be absent`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1679, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase37RControlledImportProofAccepted === true, 'Phase 37R proof acceptance missing')
assert(review.reviewDecision.controlledExecutionPlanMayProceed === true, 'Controlled execution plan approval missing')
assert(review.reviewDecision.integrationTarget === indexPath, 'Integration target mismatch')
assert(review.reviewDecision.integrationSourcePath === sourcePath, 'Integration source path mismatch')
assert(review.reviewDecision.temporaryProofFileRemovedBeforeStaging === true, 'Temp proof cleanup review missing')
assert(review.reviewDecision.importedSymbolCount === 7, 'Imported symbol count mismatch')
assert(review.reviewDecision.typecheckEvidenceReviewed === true, 'Typecheck evidence review missing')
assert(review.reviewDecision.factoryInvocationReviewedAsNotRun === true, 'Factory not-run review missing')
assert(review.reviewDecision.blockedAssertionReviewedAsNotRun === true, 'Assertion not-run review missing')
for (const key of [
  'runtimeExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(review.reviewDecision[key], `review.reviewDecision.${key}`)
}
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37RSourcePr === 1679, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37RDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37QOwnerReviewDecision === previousOwnerDecision, 'Phase 37Q owner-review source mismatch')
assert(acceptance.acceptedEvidence.temporaryProofFileRemovedBeforeStaging === true, 'Temp cleanup acceptance missing')
assert(acceptance.acceptedEvidence.importedSymbolCount === 7, 'Acceptance symbol count mismatch')
assert(acceptance.acceptedEvidence.npxTscPassed === true, 'npx tsc acceptance missing')
assert(acceptance.acceptedEvidence.serverTypecheckPassed === true, 'server typecheck acceptance missing')
assertFalse(acceptance.acceptedEvidence.factoryInvoked, 'acceptance.acceptedEvidence.factoryInvoked')
assertFalse(acceptance.acceptedEvidence.blockedAssertionInvoked, 'acceptance.acceptedEvidence.blockedAssertionInvoked')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.controlledExecutionPlanning === true, 'Controlled execution planning scope missing')
assert(acceptance.acceptedScope.controlledImportProofOwnerReviewPassed === true, 'Owner review scope missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(readiness.sourceDecision === decision, 'Phase 37S readiness source mismatch')
assert(readiness.phase37SMayProceed === true, 'Phase 37S may proceed missing')
for (const key of [
  'controlledExecutionPlanOnly',
  'planFutureSyntheticNoMediaProof',
  'planFactoryInvocationOnly',
  'planBlockedAssertionInvocationOnly',
  'noExecutionInPhase37S',
  'noMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assert(readiness.phase37SAllowedScope[key] === true, `phase37SAllowedScope.${key} must be true`)
}
for (const key of [
  'factoryInvocationInThisGate',
  'blockedAssertionInvocationInThisGate',
  'realMediaExecution',
  'ocrInference',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreation',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase37SStillBlocked[key] === true, `phase37SStillBlocked.${key} must be true`)
}

assert(safety.sourceDecision === decision, 'Safety source decision mismatch')
assert(safety.sourceSafety.allowedNextStep === 'controlled execution plan', 'Allowed next step mismatch')
assert(safety.sourceSafety.integrationSourceMustRemainFailClosed === true, 'Fail-closed source flag missing')
assert(safety.sourceSafety.temporaryProofFileMustRemainAbsent === true, 'Temporary proof absence flag missing')
for (const key of [
  'actualRuntimeWiringAllowed',
  'realMediaInputAllowed',
  'ocrInferenceAllowed',
  'captionRenderExecutionAllowed',
  'artifactWriteAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'betaUnlockAllowed',
  'productionUnlockAllowed',
]) {
  assertFalse(safety.sourceSafety[key], `safety.sourceSafety.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(blocker.ownerReviewPassedWithWarnings === true, 'Owner review warning pass missing')
assert(blocker.remainingBlocked.includes('runtime hook execution'), 'Runtime hook blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(
  blocker.blockerPrompts.nextControlledExecutionPlanPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37S-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PLAN',
  'Next controlled execution plan prompt mismatch',
)

assert(claimPolicy.allowedClaims.phase37RControlledImportProofOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase37SControlledExecutionPlanMayProceed === true, 'Phase 37S claim missing')
assert(claimPolicy.allowedClaims.blockedStateIntegrationExportsImportableFromSoundCpuIndex === true, 'Importable claim missing')
assert(claimPolicy.allowedClaims.runtimeRemainsFailClosed === true, 'Fail-closed claim missing')
for (const key of [
  'hookExecuted',
  'factoryInvoked',
  'blockedAssertionInvoked',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'dockerImageReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.forbiddenClaims[key], `claimPolicy.forbiddenClaims.${key}`)
}
for (const key of [
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'gcpCloudRun',
  'workerDispatch',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseSql',
]) {
  assertFalse(claimPolicy.executionClaims[key], `claimPolicy.executionClaims.${key}`)
}

assert(nextPrompt.requiredSourceDecision === decision, 'Next prompt source decision mismatch')
assert(nextPrompt.integrationTarget === indexPath, 'Next prompt integration target mismatch')
assert(nextPrompt.integrationSourcePath === sourcePath, 'Next prompt source path mismatch')
assert(nextPrompt.futureProofDesign.syntheticNoMediaInput === true, 'Next prompt synthetic input missing')
assert(nextPrompt.futureProofDesign.factoryInvocationAllowedInFutureProofOnly === true, 'Next prompt future factory plan missing')
assert(nextPrompt.futureProofDesign.blockedAssertionInvocationAllowedInFutureProofOnly === true, 'Next prompt future assertion plan missing')
assert(nextPrompt.futureProofDesign.noExecutionInPlanningGate === true, 'Next prompt no-execution planning flag missing')
assert(nextPrompt.futureProofDesign.noMediaInput === true, 'Next prompt no media flag missing')
assert(nextPrompt.futureProofDesign.noWorkerDispatch === true, 'Next prompt no worker dispatch flag missing')
assert(nextPrompt.futureProofDesign.noSupabaseSql === true, 'Next prompt no Supabase flag missing')
assert(nextPrompt.supabaseClassification.updateRequired === 'no', 'Next prompt Supabase update must be no')

const phase37RResult = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result.md',
  'worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result',
)
assert(phase37RResult.decision === sourceDecision, 'Phase 37R import proof decision missing')
assert(phase37RResult.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'Phase 37R temp proof cleanup missing')
assert(phase37RResult.proofResult.importedSymbolCount === 7, 'Phase 37R proof symbol count mismatch')
assertFalse(phase37RResult.proofResult.factoryInvoked, 'phase37RResult.proofResult.factoryInvoked')
assertFalse(phase37RResult.proofResult.blockedAssertionInvoked, 'phase37RResult.proofResult.blockedAssertionInvoked')

const sourceText = readText(sourcePath)
assert(sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Integration factory missing')
assert(
  sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Integration blocked assertion missing',
)
for (const snippet of [
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'noArtifactCreated: true',
]) {
  assert(sourceText.includes(snippet), `Missing fail-closed snippet: ${snippet}`)
}
assertAbsent(sourceText, /\bfs\./, 'Filesystem operation')
assertAbsent(sourceText, /fs\/promises|node:fs|readFile|writeFile|createReadStream|createWriteStream/, 'Filesystem import or helper')
assertAbsent(sourceText, /fetch\s*\(/, 'fetch call')
assertAbsent(sourceText, /child_process|exec\s*\(|spawn\s*\(/, 'process spawn')
assertAbsent(sourceText, /audio_open|ffmpeg|ffprobe|pydub|ocrInference|renderCaption|writeArtifact|createSignedUrl/, 'media or artifact operation')
assertAbsent(
  sourceText,
  /createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|sql`|executeSql|service_role/i,
  'Supabase or SQL-like operation',
)

const indexText = readText(indexPath)
assert(indexText.includes('./runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'), 'Index integration export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1679,
      sourceMergeCommit,
      phase37SControlledExecutionPlanMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37S-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PLAN',
    },
    null,
    2,
  ),
)
