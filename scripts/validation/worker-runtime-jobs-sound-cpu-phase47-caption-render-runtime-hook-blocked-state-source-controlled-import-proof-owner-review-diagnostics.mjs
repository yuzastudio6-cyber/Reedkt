import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = process.cwd()
const scriptRelativePath = path.relative(repoRoot, fileURLToPath(import.meta.url))

const decision =
  'worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_media_no_artifacts'
const phase46OwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE48-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review:diagnostics'

const sourcePr = 1786
const sourceHead = '04a02081708be8b7e265f3fac1b2adaaec0f1f05'
const sourceMergeCommit = '83ec3eb4721b9cc87a79cbaa24ad8b592cad742c'
const phase46OwnerPr = 1783
const phase46OwnerMergeCommit = 'ce9f218e4a0710a5072a170a91a8dd0eb0e51647'
const phase46StaticValidationPr = 1780
const phase46StaticValidationMergeCommit = '8d659c0e15a4b91ae69fc8e1a397e8755d81dee5'
const tempProofFile =
  'server/workers/sound-cpu/phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp.ts'
const tempProofHash = '665f4231682163d439517948924ab770a288d5fbecbf379d66d7fe625ab66bbe'
const indexPath = 'server/workers/sound-cpu/index.ts'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
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

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(entryPath)
    return [entryPath]
  })
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-claim-policy',
)
const prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === sourcePr, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.sourceVerification.phase46OwnerReviewPr === phase46OwnerPr, 'Phase 46 owner PR mismatch')
assert(
  review.sourceVerification.phase46OwnerReviewMergeCommit === phase46OwnerMergeCommit,
  'Phase 46 owner merge mismatch',
)
assert(review.sourceVerification.phase46StaticValidationPr === phase46StaticValidationPr, 'Phase 46 static PR mismatch')
assert(
  review.sourceVerification.phase46StaticValidationMergeCommit === phase46StaticValidationMergeCommit,
  'Phase 46 static merge mismatch',
)
assertTrue(review.reviewDecision.phase47ControlledImportProofAccepted, 'review phase47 acceptance')
assertTrue(review.reviewDecision.controlledExecutionPlanMayProceed, 'review controlled execution plan readiness')
assert(review.reviewDecision.integrationTarget === indexPath, 'review integration target mismatch')
assert(review.reviewDecision.hookSourcePath === hookSourcePath, 'review hook path mismatch')
assert(review.reviewDecision.blockedStateIntegrationPath === blockedStateIntegrationPath, 'review blocked-state path mismatch')
assert(review.reviewDecision.runtimeIntegrationPath === runtimeIntegrationPath, 'review runtime path mismatch')
assertTrue(review.reviewDecision.temporaryProofFileRemovedBeforeStaging, 'review temp file removed')
assert(review.reviewDecision.temporaryProofFileSha256 === tempProofHash, 'review temp proof hash mismatch')
assert(review.reviewDecision.importedSymbolCount === 18, 'review imported symbol count mismatch')
assertTrue(review.reviewDecision.serverTypecheckEvidenceReviewed, 'review server typecheck evidence')
assertTrue(review.reviewDecision.typescriptBuildEvidenceReviewed, 'review TypeScript build evidence')
assertTrue(review.reviewDecision.factoryInvocationReviewedAsNotRun, 'review factory not-run evidence')
assertTrue(review.reviewDecision.blockedAssertionReviewedAsNotRun, 'review blocked assertion not-run evidence')
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
assert(review.selectedNextPrompt === nextPrompt, 'review selected next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase47SourcePr === sourcePr, 'acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase47Decision === sourceDecision, 'acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase46OwnerReviewDecision === phase46OwnerDecision, 'acceptance Phase 46 decision mismatch')
assertTrue(acceptance.acceptedEvidence.temporaryProofFileRemoved, 'acceptance temp removed')
assert(acceptance.acceptedEvidence.temporaryProofFileSha256 === tempProofHash, 'acceptance temp hash mismatch')
assert(acceptance.acceptedEvidence.importedSymbolCount === 18, 'acceptance imported symbol count mismatch')
for (const key of [
  'hookExportsCovered',
  'blockedStateIntegrationExportsCovered',
  'runtimeIntegrationExportsCovered',
  'indexExportsCovered',
  'serverTypecheckPassed',
  'typescriptBuildPassed',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
for (const key of ['factoryInvocationDetected', 'blockedAssertionInvocationDetected', 'runtimeExecutionDetected']) {
  assertFalse(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'cross-chat conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.controlledExecutionPlanPlanning, 'controlled execution planning scope missing')
assertTrue(acceptance.acceptedScope.controlledImportProofOwnerReviewPassed, 'owner review passed scope missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'routeToolProviderCalls',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(readiness.sourceDecision === decision, 'readiness source decision mismatch')
assertTrue(readiness.phase48MayProceed, 'Phase 48 may proceed missing')
for (const key of [
  'controlledExecutionPlanOnly',
  'syntheticNoMediaNoArtifactInputDesignOnly',
  'blockedFactoryInvocationPlanMayBeDefined',
  'blockedAssertionInvocationPlanMayBeDefined',
  'expectedBlockedResultShapeMayBeDefined',
  'noActualHookExecution',
  'noRealMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assertTrue(readiness.phase48AllowedScope[key], `readiness.phase48AllowedScope.${key}`)
}
for (const key of [
  'runtimeExecutionProofBlocked',
  'realMediaExecutionBlocked',
  'ocrInferenceBlocked',
  'captionRenderRuntimeExecutionOverMediaBlocked',
  'workerExecutionBlocked',
  'artifactCreationBlocked',
  'realUserMediaBetaBlocked',
  'paidProductionBlocked',
]) {
  assertTrue(readiness.phase48StillBlocked[key], `readiness.phase48StillBlocked.${key}`)
}
assert(readiness.nextPrompt === nextPrompt, 'readiness next prompt mismatch')

assert(safety.sourceDecision === decision, 'safety source decision mismatch')
assertTrue(safety.sourceSafety.temporaryProofFileMustRemainRemoved, 'safety temp removed')
assertTrue(safety.sourceSafety.hookSourceMustRemainFailClosed, 'safety hook fail-closed')
assertTrue(safety.sourceSafety.blockedStateIntegrationSourceMustRemainFailClosed, 'safety blocked-state fail-closed')
assertTrue(safety.sourceSafety.runtimeIntegrationSourceMustRemainFailClosed, 'safety runtime fail-closed')
assertTrue(safety.sourceSafety.indexExportsMayRemainVisible, 'safety index exports')
assert(safety.sourceSafety.allowedNextStep === 'controlled execution plan', 'safety allowed next step mismatch')
assertTrue(safety.sourceSafety.actualExecutionStillRequiresFutureOwnerGate, 'future owner gate requirement missing')
for (const key of Object.keys(safety.prohibitedToday)) {
  assertTrue(safety.prohibitedToday[key], `safety.prohibitedToday.${key}`)
}

assert(blocker.decision === decision, 'blocker decision mismatch')
assert(Array.isArray(blocker.blockingItems) && blocker.blockingItems.length === 0, 'blocker register must have no blockers')
assert(blocker.selectedNextPrompt === nextPrompt, 'blocker next prompt mismatch')

assert(claimPolicy.decision === decision, 'claim policy decision mismatch')
assertTrue(claimPolicy.allowedClaims.phase47ImportProofOwnerReviewed, 'claim policy owner reviewed')
assert(claimPolicy.allowedClaims.phase47ImportedSymbolCount === 18, 'claim policy symbol count mismatch')
assertTrue(claimPolicy.allowedClaims.phase48ControlledExecutionPlanMayProceed, 'claim policy phase48 may proceed')
assertTrue(claimPolicy.allowedClaims.temporaryProofFileRemoved, 'claim policy temp removed')
assertTrue(claimPolicy.allowedClaims.serverTypecheckEvidenceReviewed, 'claim policy typecheck reviewed')
assertTrue(claimPolicy.allowedClaims.typescriptBuildEvidenceReviewed, 'claim policy tsc reviewed')
for (const key of Object.keys(claimPolicy.disallowedClaims)) {
  assertFalse(claimPolicy.disallowedClaims[key], `claimPolicy.disallowedClaims.${key}`)
}
assertSupabaseNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(prompt.requiredSourceDecision === decision, 'prompt required source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'prompt source head mismatch')
assert(prompt.integrationTarget === indexPath, 'prompt integration target mismatch')
assertTrue(prompt.planningOnly, 'prompt planning-only flag')
for (const key of Object.keys(prompt.futureAllowedPlanSurface)) {
  assertTrue(prompt.futureAllowedPlanSurface[key], `prompt.futureAllowedPlanSurface.${key}`)
}
for (const blockedItem of [
  'actual factory invocation',
  'actual blocked assertion invocation',
  'OCR runtime execution',
  'caption/render runtime execution',
  'media processing',
  'Supabase/SQL',
  'artifact creation',
  'real-user media beta unlock',
  'paid production unlock',
]) {
  assert(prompt.blocked.includes(blockedItem), `prompt blocked list missing ${blockedItem}`)
}
assertSupabaseNoop(prompt.supabaseClassification, 'prompt')

const sourceProof = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result.md',
  'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result',
)
assert(sourceProof.decision === sourceDecision, 'source proof decision mismatch')
assert(sourceProof.sourceVerification.sourcePr === phase46OwnerPr, 'source proof source PR mismatch')
assert(sourceProof.sourceVerification.sourceMergeCommit === phase46OwnerMergeCommit, 'source proof merge mismatch')
assertTrue(sourceProof.proofResult.temporaryProofFileRemovedBeforeStaging, 'source proof temp removed')
assert(sourceProof.proofResult.importedSymbolCount === 18, 'source proof symbol count mismatch')
assertTrue(sourceProof.proofResult.serverTypecheckPassed, 'source proof typecheck passed')
assertTrue(sourceProof.proofResult.expectedCommandPassed, 'source proof tsc passed')
for (const key of [
  'factoryInvoked',
  'blockedAssertionInvoked',
  'runtimeExecution',
  'captionRenderRuntimeExecution',
  'ocrInference',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseMutation',
  'sqlExecution',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(sourceProof.proofResult[key], `sourceProof.proofResult.${key}`)
}

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'temporary proof file must not exist')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review-diagnostics.mjs'), 'package script missing or incorrect')

for (const sourcePath of [hookSourcePath, blockedStateIntegrationPath, runtimeIntegrationPath]) {
  const text = readText(sourcePath)
  for (const snippet of [
    'runtimeExecutionApproved: false',
    'workerExecutionApproved: false',
    'mediaProcessingApproved: false',
    'artifactCreationApproved: false',
    'noArtifactCreated: true',
  ]) {
    assert(text.includes(snippet), `Missing fail-closed snippet in ${sourcePath}: ${snippet}`)
  }
}

const changedTexts = docs.map(([file]) => readText(file)).join('\n') + '\n' + readText(scriptRelativePath)
for (const forbidden of [
  new RegExp('AK' + 'IA[0-9A-Z]{16}'),
  new RegExp('BEGIN (RSA|OPENSSH|PRIVATE) KEY'),
  new RegExp('DATABASE' + '_URL\\s*='),
  new RegExp('SUPABASE' + '_URL\\s*='),
  new RegExp('SUPABASE' + '_SERVICE', 'i'),
  new RegExp('service' + '[_-]role', 'i'),
  new RegExp('gh' + 'p_[A-Za-z0-9_]+'),
  new RegExp('sk' + '-[A-Za-z0-9]{20,}'),
]) {
  assert(!forbidden.test(changedTexts), `forbidden secret-like pattern found: ${forbidden}`)
}

for (const forbiddenPath of ['node_modules', 'dist', 'dist-server']) {
  assert(!fs.existsSync(path.join(repoRoot, forbiddenPath)), `${forbiddenPath} must not be present`)
}

const sidecars = walkFiles(repoRoot).filter((file) => path.basename(file).startsWith('._'))
assert(sidecars.length === 0, `macOS sidecars must not be present: ${sidecars.slice(0, 5).join(', ')}`)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr,
      sourceMergeCommit,
      importedSymbolCount: 18,
      controlledExecutionPlanMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      realUserMediaBetaApprovedToday: false,
      paidProductionApprovedToday: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
