import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_static_validation_no_media_no_artifacts'
const sourceHead = '030a92fcb884cc7bda39e644c12ba3f8c052eade'
const sourceMergeCommit = '684521a88ddd6e9ac9c991037227b3ad3366ebe6'
const hookSourcePath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const blockedStateIntegrationPath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const runtimeIntegrationPath = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'

const expectedHashes = new Map([
  [hookSourcePath, '50f7525d39bc70b985634f3e7c050c22905ea1885a3d5edaac49ef5ba131cf8e'],
  [blockedStateIntegrationPath, '3fe6b1525ee940ca268ce25f68ddccceac2a90d7bae4db64ab510faaf32bef48'],
  [runtimeIntegrationPath, '4d96206bcf52ff36c56587bc325e49a933884d7694efb9eeab88640666502c8b'],
  [indexPath, '0a60e11f92733262e0d950df1ce083953dc4a2df90372465d8f888e2203d1526'],
])

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-result.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-shape-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-shape-validation-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(readText(relativePath)).digest('hex')
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-result',
)
const shape = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-shape-validation-register',
)
const prohibited = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-prohibited-source-scan-register',
)
const ownerReadiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-claim-policy',
)
const nextPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
)

assert(result.decision === decision, 'Phase 46 decision mismatch')
assert(result.sourceVerification.sourcePr === 1777, 'Source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(result.staticValidation.hookSourcePath === hookSourcePath, 'Hook source path mismatch')
assert(result.staticValidation.blockedStateIntegrationPath === blockedStateIntegrationPath, 'Blocked-state path mismatch')
assert(result.staticValidation.runtimeIntegrationPath === runtimeIntegrationPath, 'Runtime path mismatch')
assert(result.staticValidation.indexPath === indexPath, 'Index path mismatch')
assert(result.staticValidation.hookSourceSha256 === expectedHashes.get(hookSourcePath), 'Hook hash mismatch')
assert(
  result.staticValidation.blockedStateIntegrationSha256 === expectedHashes.get(blockedStateIntegrationPath),
  'Blocked-state hash mismatch',
)
assert(result.staticValidation.runtimeIntegrationSha256 === expectedHashes.get(runtimeIntegrationPath), 'Runtime hash mismatch')
assert(result.staticValidation.indexSha256 === expectedHashes.get(indexPath), 'Index hash mismatch')
for (const [relativePath, expectedHash] of expectedHashes.entries()) {
  assert(fs.existsSync(path.join(repoRoot, relativePath)), `Required source missing: ${relativePath}`)
  assert(sha256(relativePath) === expectedHash, `Current source hash mismatch: ${relativePath}`)
}
for (const key of [
  'sourceExists',
  'indexExportsExist',
  'hookShapePassed',
  'blockedStateIntegrationShapePassed',
  'runtimeIntegrationShapePassed',
  'disabledRuntimeFlagsPassed',
  'prohibitedSourceScanPassed',
]) {
  assert(result.staticValidation[key] === true, `result.staticValidation.${key} must be true`)
}
for (const key of [
  'sourceModifiedInThisGate',
  'hookExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(result.staticValidation[key], `result.staticValidation.${key}`)
}
assertSupabaseNoop(result.supabaseClassification, 'result')

assert(shape.sourceDecision === decision, 'Shape source decision mismatch')
assert(shape.validatedSources.hook.path === hookSourcePath, 'Shape hook path mismatch')
assert(shape.validatedSources.hook.statusConstant === 'source_created_execution_blocked', 'Hook status mismatch')
assert(shape.validatedSources.hook.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'Hook name mismatch')
assert(shape.validatedSources.hook.factory === 'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult', 'Hook factory mismatch')
assert(shape.validatedSources.hook.blockedAssertion === 'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked', 'Hook assertion mismatch')
assert(shape.validatedSources.blockedStateIntegration.path === blockedStateIntegrationPath, 'Shape blocked-state path mismatch')
assert(
  shape.validatedSources.blockedStateIntegration.statusConstant === 'blocked_state_source_created_execution_blocked',
  'Blocked-state status mismatch',
)
assert(
  shape.validatedSources.blockedStateIntegration.factory ===
    'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'Blocked-state factory mismatch',
)
assert(shape.validatedSources.runtimeIntegration.path === runtimeIntegrationPath, 'Shape runtime path mismatch')
assert(
  shape.validatedSources.runtimeIntegration.statusConstant === 'runtime_integration_source_created_execution_blocked',
  'Runtime status mismatch',
)
assert(
  shape.validatedSources.runtimeIntegration.factory ===
    'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'Runtime factory mismatch',
)
for (const source of [
  shape.validatedSources.hook,
  shape.validatedSources.blockedStateIntegration,
  shape.validatedSources.runtimeIntegration,
]) {
  assert(source.requiresApprovedPlanSnapshotId === true, `${source.path} approved snapshot requirement missing`)
  assert(source.usesRuntimeDisabledFlagsGuard === true, `${source.path} disabled flag guard missing`)
  assert(source.returnsBlockedByOwnerGate === true, `${source.path} blocked status missing`)
  assert(source.returnsNoArtifactCreated === true, `${source.path} no artifact flag missing`)
}
assert(shape.validatedSources.blockedStateIntegration.requiresIntegrationPlanId === true, 'Integration plan id missing')
assert(shape.validatedSources.runtimeIntegration.requiresRuntimeIntegrationPlanId === true, 'Runtime plan id missing')
assert(shape.validatedSources.runtimeIntegration.requiresBlockedStateIntegrationPlanId === true, 'Blocked-state plan id missing')
assert(shape.validatedSources.indexExports.path === indexPath, 'Shape index path mismatch')
assert(shape.validatedSources.indexExports.exportsHook === true, 'Hook index export missing')
assert(shape.validatedSources.indexExports.exportsBlockedStateIntegration === true, 'Blocked index export missing')
assert(shape.validatedSources.indexExports.exportsRuntimeIntegration === true, 'Runtime index export missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
  'routeToolProviderApproved',
  'realUserMediaBetaApproved',
  'paidProductionApproved',
]) {
  assertFalse(shape.requiredFalseResultFields[key], `shape.requiredFalseResultFields.${key}`)
}

assert(prohibited.sourceDecision === decision, 'Prohibited source decision mismatch')
assert(prohibited.scanScope.hookSourcePath === hookSourcePath, 'Prohibited hook path mismatch')
assert(prohibited.scanScope.blockedStateIntegrationPath === blockedStateIntegrationPath, 'Prohibited blocked path mismatch')
assert(prohibited.scanScope.runtimeIntegrationPath === runtimeIntegrationPath, 'Prohibited runtime path mismatch')
assert(prohibited.scanScope.indexPath === indexPath, 'Prohibited index path mismatch')
assert(prohibited.scanScope.temporaryProofFile === tempProofFile, 'Temp proof file mismatch')
for (const key of [
  'fsReadOrWrite',
  'fetch',
  'childProcess',
  'mediaFileOpen',
  'ocrInference',
  'captionRenderExecution',
  'artifactWrite',
  'noWorkerDispatchPattern',
  'routeToolProviderCall',
  'noSupabaseSqlPattern',
  'storageObjectCreation',
  'dockerOrGcpAction',
]) {
  assert(prohibited.prohibitedPatternsAbsent[key] === true, `prohibitedPatternsAbsent.${key} must be true`)
}
assertFalse(prohibited.prohibitedPatternsAbsent.temporaryProofFilePresent, 'temporaryProofFilePresent')

assert(ownerReadiness.decision === decision, 'Owner-readiness decision mismatch')
assert(ownerReadiness.ownerReviewReady === true, 'Owner review readiness missing')
for (const key of [
  'reviewStaticValidationEvidence',
  'reviewHookSourceShape',
  'reviewBlockedStateIntegrationShape',
  'reviewRuntimeIntegrationShape',
  'reviewIndexExports',
  'reviewProhibitedSourceScan',
]) {
  assert(ownerReadiness.ownerReviewScope[key] === true, `ownerReviewScope.${key} must be true`)
}
for (const key of [
  'approveRuntimeExecution',
  'approveMediaExecution',
  'approveArtifactCreation',
  'approveWorkerDispatch',
  'approveSupabaseSql',
  'approveBetaUnlock',
  'approveProductionUnlock',
]) {
  assertFalse(ownerReadiness.ownerReviewScope[key], `ownerReviewScope.${key}`)
}
assert(ownerReadiness.sourceEvidence.phase45OwnerReviewPr === 1777, 'Owner-readiness source PR mismatch')
assert(ownerReadiness.sourceEvidence.phase45OwnerReviewHead === sourceHead, 'Owner-readiness source head mismatch')
assert(
  ownerReadiness.sourceEvidence.phase45OwnerReviewMergeCommit === sourceMergeCommit,
  'Owner-readiness merge mismatch',
)
assert(ownerReadiness.sourceEvidence.phase45OwnerReviewDecision === sourceDecision, 'Owner-readiness source decision mismatch')

assert(blocker.staticValidationPassedWithWarnings === true, 'Static validation warning pass missing')
assert(blocker.remainingBlocked.includes('runtime hook execution'), 'Runtime hook blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(
  blocker.blockerPrompts.nextOwnerReviewPrompt ===
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW',
  'Next owner-review prompt mismatch',
)

for (const key of [
  'phase46StaticValidationPassed',
  'phase46OwnerReviewMayProceed',
  'hookSourceStaticallyValidated',
  'blockedStateIntegrationSourceStaticallyValidated',
  'runtimeIntegrationSourceStaticallyValidated',
  'indexExportsStaticallyValidated',
  'runtimeRemainsFailClosed',
]) {
  assert(claimPolicy.allowedClaims[key] === true, `claimPolicy.allowedClaims.${key} missing`)
}
for (const key of [
  'hookExecuted',
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
assert(nextPrompt.allowedScope.ownerReviewOnly === true, 'Next prompt owner-review scope missing')
assert(nextPrompt.allowedScope.reviewStaticValidationEvidence === true, 'Next prompt static validation scope missing')
assert(nextPrompt.allowedScope.reviewHookSourceShape === true, 'Next prompt hook scope missing')
assert(nextPrompt.allowedScope.reviewBlockedStateIntegrationShape === true, 'Next prompt blocked-state scope missing')
assert(nextPrompt.allowedScope.reviewRuntimeIntegrationShape === true, 'Next prompt runtime scope missing')
assert(nextPrompt.allowedScope.noHookExecution === true, 'Next prompt no hook execution missing')
assert(nextPrompt.allowedScope.noMediaInput === true, 'Next prompt no media missing')
assertSupabaseNoop(nextPrompt.supabaseClassification, 'nextPrompt')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase45-caption-render-runtime-hook-blocked-state-source-integration-plan-owner-review',
)
assert(sourceReview.decision === sourceDecision, 'Phase 45 owner-review decision missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')

const hookText = readText(hookSourcePath)
assert(hookText.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS'), 'Hook status constant missing')
assert(hookText.includes('source_created_execution_blocked'), 'Hook source status string missing')
assert(hookText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'Hook factory missing')
assert(hookText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'Hook blocked assertion missing')
assert(hookText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Hook blocked owner-gate status missing')
const blockedText = readText(blockedStateIntegrationPath)
assert(blockedText.includes('blocked_state_source_created_execution_blocked'), 'Blocked-state status string missing')
assert(blockedText.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Blocked-state factory missing')
assert(
  blockedText.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked-state assertion missing',
)
const runtimeText = readText(runtimeIntegrationPath)
assert(runtimeText.includes('runtime_integration_source_created_execution_blocked'), 'Runtime status string missing')
assert(runtimeText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'), 'Runtime factory missing')
assert(
  runtimeText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'Runtime assertion missing',
)
for (const text of [hookText, blockedText, runtimeText]) {
  for (const snippet of [
    'runtimeExecutionApproved: false',
    'workerExecutionApproved: false',
    'mediaProcessingApproved: false',
    'artifactCreationApproved: false',
    'noArtifactCreated: true',
  ]) {
    assert(text.includes(snippet), `Missing fail-closed snippet: ${snippet}`)
  }
  assert(text.includes('assertSoundCpuRuntimeDisabledFlags'), 'Runtime disabled flags guard missing')
  assert(text.includes('throw new Error('), 'Blocked assertion must throw')
  assertAbsent(text, /\bfs\./, 'Filesystem operation')
  assertAbsent(text, /fs\/promises|node:fs|readFile|writeFile|createReadStream|createWriteStream/, 'Filesystem import or helper')
  assertAbsent(text, /fetch\s*\(/, 'fetch call')
  assertAbsent(text, /child_process|exec\s*\(|spawn\s*\(/, 'process spawn')
  assertAbsent(text, /audio_open|ffmpeg|ffprobe|pydub|ocrInference|renderCaption|writeArtifact|createSignedUrl/, 'media or artifact operation')
  assertAbsent(
    text,
    /createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|sql`|executeSql|service[_-]role/i,
    'Supabase or SQL-like operation',
  )
}
assert(blockedText.includes('supabaseSqlApproved: false'), 'Blocked-state Supabase approval must remain false')
assert(runtimeText.includes('routeToolProviderApproved: false'), 'Runtime route/tool/provider approval must remain false')
assert(runtimeText.includes('realUserMediaBetaApproved: false'), 'Runtime real-user beta approval must remain false')
assert(runtimeText.includes('paidProductionApproved: false'), 'Runtime paid production approval must remain false')
const indexText = readText(indexPath)
for (const expected of [
  './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts',
]) {
  assert(indexText.includes(expected), `Index export missing: ${expected}`)
}

const packageJson = JSON.parse(readText('package.json'))
const scriptName =
  'worker-runtime-jobs:sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation:diagnostics'
assert(
  packageJson.scripts?.[scriptName] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1777,
      sourceHead,
      sourceMergeCommit,
      staticValidationPassed: true,
      sourceModifiedInThisGate: false,
      hookExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      workerDispatchApprovedToday: false,
      supabaseSqlApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
