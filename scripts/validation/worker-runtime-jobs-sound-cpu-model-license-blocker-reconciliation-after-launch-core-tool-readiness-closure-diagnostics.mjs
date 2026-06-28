import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_model_license_blocker_reconciliation_after_launch_core_tool_readiness_closure_completed_with_warnings_ready_for_deployment_security_cost_reconciliation_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_tool_readiness_blocker_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_model_license_blocker_reconciliation_no_external_beta'
const SOURCE_COMMIT = '41cd0db8386e51215db3dbbe50bef7d3bb596a6c'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-DEPLOYMENT-SECURITY-COST-RECONCILIATION-AFTER-MODEL-LICENSE-BLOCKER: reconcile deployment/security/cost blockers after model/license planning closure, no deployment/no external beta'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-blocker-reconciliation-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-blocker-reconciliation-after-launch-core-tool-readiness-closure'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-source-register-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-source-register-after-launch-core-tool-readiness-closure'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-readiness-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-readiness-after-launch-core-tool-readiness-closure'
  },
  modelWeightRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-weight-blocker-register-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-weight-blocker-register-after-launch-core-tool-readiness-closure'
  },
  licenseRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-license-review-blocker-register-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-license-review-blocker-register-after-launch-core-tool-readiness-closure'
  },
  deploymentRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-deployment-security-cost-register-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-deployment-security-cost-register-after-launch-core-tool-readiness-closure'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-claim-policy-after-launch-core-tool-readiness-closure.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-claim-policy-after-launch-core-tool-readiness-closure'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-deployment-security-cost-reconciliation-after-model-license-blocker.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"modelDownloadApprovedToday": true',
  '"modelWeightMountApprovedToday": true',
  '"modelManifestApprovedToday": true',
  '"licenseApprovalGrantedToday": true',
  '"providerModelCallApprovedToday": true',
  '"toolExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"deploymentApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"runtimeReadinessClaimedToday": true',
  '"workerReadinessClaimedToday": true',
  '"mediaReadinessClaimedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS'
]

const EXPECTED_MODEL_WEIGHT_TOOLS = [
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film'
]

const EXPECTED_LICENSE_SURFACE = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'hyperframe',
  'remotion',
  'libass',
  'sharp',
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'opencv',
  'mediapipe',
  'kornia',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'opencolorio',
  'openimageio',
  'deepfilternet',
  'rnnoise',
  'demucs',
  'audioflux',
  'signalsmith_stretch',
  'soundtouch',
  'rubber_band',
  'essentia',
  'real_esrgan',
  'film',
  'lottie',
  'playwright',
  'maplibre',
  'cesium_js',
  'vapoursynth',
  'revideo'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function parseBlock({ path, label }) {
  const text = read(path)
  for (const forbidden of FORBIDDEN_STRINGS) {
    assert(!text.includes(forbidden), `${path} contains forbidden string: ${forbidden}`)
  }

  const marker = '```json ' + label
  const start = text.indexOf(marker)
  assert(start >= 0, `${path} missing fenced JSON label ${label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertDecision(doc, label) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${label} owner mismatch`)
  assert(doc.decision === DECISION, `${label} decision mismatch`)
}

function assertAllFalse(value, label, exceptions = []) {
  for (const [key, actual] of Object.entries(value)) {
    if (exceptions.includes(key)) continue
    assert(actual === false, `${label}.${key} must be false`)
  }
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no deployment/no external beta'), 'next prompt missing no-deployment/no-external-beta scope')
assert(promptText.includes('No deployment'), 'next prompt missing forbidden deployment statement')

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.sourcePr === 1399, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.reconciliationResult.modelLicenseBlockerReconciledForPlanningOnly === true, 'planning reconciliation flag missing')
assert(reconciliation.reconciliationResult.modelWeightToolsRepresented === EXPECTED_MODEL_WEIGHT_TOOLS.length, 'model-weight represented count mismatch')
assert(reconciliation.reconciliationResult.licenseReviewToolsRepresented === EXPECTED_LICENSE_SURFACE.length, 'license represented count mismatch')
assert(reconciliation.reconciliationResult.modelDownloadApprovedToday === false, 'model download must be false')
assert(reconciliation.reconciliationResult.modelWeightMountApprovedToday === false, 'model mount must be false')
assert(reconciliation.reconciliationResult.licenseApprovalGrantedToday === false, 'license approval must be false')
assert(reconciliation.reconciliationResult.providerModelCallApprovedToday === false, 'provider/model call must be false')
assert(reconciliation.reconciliationResult.externalBetaAllowed === false, 'external beta must remain false')
assert(reconciliation.reconciliationResult.realUserMediaBetaAllowed === false, 'real-user beta must remain false')
assert(reconciliation.reconciliationResult.productionAllowed === false, 'production must remain false')
assert(reconciliation.reconciliationResult.selectedNextBlocker === 'deployment_security_cost_approval_pending', 'next blocker mismatch')
assert(reconciliation.reconciliationResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(reconciliation.liveReadinessAtReconciliation.modelWeightBlockers === 8, 'model weight blocker count mismatch')
assert(reconciliation.liveReadinessAtReconciliation.hardBlockers === 101, 'hard blocker count mismatch')
assert(reconciliation.liveReadinessAtReconciliation.warnings === 26, 'warning count mismatch')
assertSupabaseNoop(reconciliation.supabaseClassification, 'reconciliation')

const sources = parsed.sourceRegister.sources
assert(sources.length === 6, 'source register count mismatch')
assert(sources.some((entry) => entry.source === 'PR #1399' && entry.mergeCommit === SOURCE_COMMIT), 'missing PR #1399 source')
assert(sources.some((entry) => entry.source === 'tool registry helper getToolsWithModelWeights' && entry.observedCount === 12), 'missing model-weight helper source')
assert(sources.some((entry) => entry.source === 'tool registry helper getToolsNeedingLicenseReview' && entry.observedCount === 35), 'missing license helper source')
assert(parsed.sourceRegister.sourceConclusion.requiredPr1399Merged === true, 'PR #1399 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'same-purpose duplicate must be false')
assert(parsed.sourceRegister.sourceConclusion.modelLicenseApprovalEvidencePresent === false, 'model/license approval evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.safeToProceedToDeploymentSecurityCostPlanning === true, 'deployment/security/cost handoff missing')

const live = parsed.liveReadiness
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.modelWeightBlockers === 8, 'live model weight blockers mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodReadinessSummary.toolStatuses.needsLicenseReview === 2, 'needs license count mismatch')
assert(live.prodReadinessSummary.toolStatuses.needsModelWeightReview === 10, 'needs model weight count mismatch')
assert(live.prodReadinessSummary.workerModelWeightBlocked.toolReadinessWorker === 12, 'tool readiness model blocker count mismatch')
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.prodBetaSummary.realUserMediaBetaAllowed === false, 'live real-user media beta must remain false')
assert(live.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflicts mismatch')
assert(live.liveConclusion.modelWeightLicenseBlockersRemainLive === true, 'model/license blockers must remain live')
assert(live.liveConclusion.modelLicenseClosedForPlanningOnly === true, 'planning closure missing')
assert(live.liveConclusion.modelLicenseApprovalStillRequiresFutureReview === true, 'future review requirement missing')
assert(live.liveConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'must not unlock external beta')

const modelWeight = parsed.modelWeightRegister
assert(modelWeight.modelWeightTools.length === EXPECTED_MODEL_WEIGHT_TOOLS.length, 'model-weight tool count mismatch')
for (const tool of EXPECTED_MODEL_WEIGHT_TOOLS) {
  assert(modelWeight.modelWeightTools.includes(tool), `missing model-weight tool ${tool}`)
}
assert(modelWeight.modelWeightPolicy.modelWeightToolCount === EXPECTED_MODEL_WEIGHT_TOOLS.length, 'model-weight policy count mismatch')
assertAllFalse(modelWeight.modelWeightPolicy, 'modelWeight.modelWeightPolicy', [
  'modelWeightToolCount',
  'productionReadinessModelWeightBlockerCount',
  'toolStatusNeedsModelWeightReview'
])
assert(modelWeight.registerConclusion.modelWeightBlockersRepresented === true, 'model-weight represented flag missing')
assert(modelWeight.registerConclusion.modelWeightBlockersClosedForPlanningOnly === true, 'model-weight planning closure missing')
assert(modelWeight.registerConclusion.modelWeightsApprovedForBeta === false, 'model weights beta approval must be false')
assert(modelWeight.registerConclusion.modelWeightsApprovedForProduction === false, 'model weights production approval must be false')

const license = parsed.licenseRegister
assert(license.licenseReviewSurface.length === EXPECTED_LICENSE_SURFACE.length, 'license surface count mismatch')
for (const tool of EXPECTED_LICENSE_SURFACE) {
  assert(license.licenseReviewSurface.includes(tool), `missing license-review tool ${tool}`)
}
assert(license.licensePolicy.licenseReviewSurfaceCount === EXPECTED_LICENSE_SURFACE.length, 'license policy count mismatch')
assertAllFalse(license.licensePolicy, 'license.licensePolicy', [
  'licenseReviewSurfaceCount',
  'toolStatusNeedsLicenseReview'
])
assert(license.registerConclusion.licenseReviewBlockersRepresented === true, 'license represented flag missing')
assert(license.registerConclusion.licenseReviewClosedForPlanningOnly === true, 'license planning closure missing')
assert(license.registerConclusion.licensesApprovedForBeta === false, 'license beta approval must be false')
assert(license.registerConclusion.licensesApprovedForProduction === false, 'license production approval must be false')

const deployment = parsed.deploymentRegister
const selected = deployment.deferredBlockers.find((item) => item.selectedNext === true)
assert(selected?.blockerId === 'deployment_security_cost_approval_pending', 'deployment next blocker mismatch')
assert(selected.nextPrompt === NEXT_PROMPT, 'deployment next prompt mismatch')
assertAllFalse(deployment.deploymentSecurityCostScope, 'deployment.deploymentSecurityCostScope')

const claim = parsed.claimPolicy
assert(claim.closedFlags.modelLicenseBlockerReconciledForPlanningOnly === true, 'planning-only reconciliation flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', ['modelLicenseBlockerReconciledForPlanningOnly'])
for (const required of [
  'model weights approved',
  'license approved',
  'model download ready',
  'provider model call ready',
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'production ready'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      externalBetaAllowed: false,
      modelWeightToolsRepresented: EXPECTED_MODEL_WEIGHT_TOOLS.length,
      licenseReviewToolsRepresented: EXPECTED_LICENSE_SURFACE.length,
      selectedNextBlocker: 'deployment_security_cost_approval_pending',
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
