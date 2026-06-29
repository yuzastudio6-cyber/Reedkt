#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_paddleocr_activation_lane_reconciliation_after_model_license_live_refresh_completed_with_warnings_ready_for_activation_merge_hygiene_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_model_license_live_refresh_after_evaluation_only_semantics_completed_with_warnings_ready_for_paddleocr_activation_lane_reconciliation_no_runtime'
const SOURCE_MERGE_COMMIT = 'c7cf4571e87cbd113b5ac8cb60f7163c4f5419a2'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PADDLEOCR-ACTIVATION-MERGE-HYGIENE-AFTER-RECONCILIATION'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh',
  },
  pr51: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-pr51-evidence-register-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-pr51-evidence-register-after-model-license-live-refresh',
  },
  pr53: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-pr53-evidence-register-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-pr53-evidence-register-after-model-license-live-refresh',
  },
  sourceGap: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-source-gap-register-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-source-gap-register-after-model-license-live-refresh',
  },
  mergeReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-merge-hygiene-readiness-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-merge-hygiene-readiness-after-model-license-live-refresh',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-claim-policy-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-claim-policy-after-model-license-live-refresh',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-paddleocr-activation-merge-hygiene-after-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-merge-hygiene-after-reconciliation',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'blockerSpecificFixNeeded',
  'captionRenderIntegrationExecuted',
  'dockerBuildRunPush',
  'dry_run_passed',
  'duplicatePaddleocrLaneNeeded',
  'externalBetaUnlocked',
  'generated_local_fixture_passed',
  'gcpCloudRunSecretManager',
  'licenseApprovalGrant',
  'licenseApprovalGranted',
  'mediaProcessing',
  'mediaProcessingExecuted',
  'modelDownload',
  'modelFilesDownloaded',
  'modelWeightMount',
  'ocrInferenceExecuted',
  'paidProductionAllowed',
  'productionUnlocked',
  'providerCallExecuted',
  'providerModelCall',
  'publicOutputCreated',
  'realMediaOcrExecuted',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeExecuted',
  'runtimeReady',
  'sourceReadinessAdjustmentAllowedToday',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'workerExecution',
  'workerReady',
])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FALSE_FIELDS.has(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL execution mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function includeAll(actual, expected, label) {
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'model/license live-refresh source decision missing')
assert(sourceDoc.includes('paddleocr'), 'source live-refresh document missing PaddleOCR selection')

const sourcePrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh.md',
)
assert(sourcePrompt.includes(SOURCE_DECISION), 'source prompt missing live-refresh decision')
assert(sourcePrompt.includes('PR #51') && sourcePrompt.includes('PR #53'), 'source prompt missing PaddleOCR PR references')

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
  }
  if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  scanFalse(doc, [key])
}

const reconciliation = parsed.reconciliation
assert(reconciliation.sourcePr === 1574, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.reconciliationResult.livePaddleocrBlockerStillPresent === true, 'live blocker claim mismatch')
assert(reconciliation.reconciliationResult.existingActivationEvidenceSufficientForMergeHygiene === true, 'merge hygiene sufficiency missing')
assert(reconciliation.reconciliationResult.selectedNextPrompt === NEXT_PROMPT, 'selected next prompt mismatch')
assert(reconciliation.liveReadinessSnapshot.hardBlockers === 57, 'hard blocker count mismatch')
assert(reconciliation.liveReadinessSnapshot.warnings === 32, 'warning count mismatch')
assert(reconciliation.liveReadinessSnapshot.cpuWorkerHardBlocker === 'paddleocr_model_weight_missing', 'CPU blocker mismatch')

const pr51 = parsed.pr51
assert(pr51.pullRequest.number === 51, 'PR #51 number mismatch')
assert(pr51.pullRequest.headSha === 'de294139cea9d46fdd2c181915b8428a3ccc4edd', 'PR #51 head mismatch')
assert(pr51.pullRequest.baseSha === 'b6eda348f77f7e66d030f8596d449b295eed843b', 'PR #51 base mismatch')
assert(pr51.pullRequest.mergeStateStatus === 'CLEAN', 'PR #51 clean state mismatch')
assert(pr51.evidenceSummary.approvalWorkflowPresent === true, 'PR #51 approval workflow missing')
assert(pr51.mergeHygieneEligibility.dependencyOrder === 1, 'PR #51 order mismatch')

const pr53 = parsed.pr53
assert(pr53.pullRequest.number === 53, 'PR #53 number mismatch')
assert(pr53.pullRequest.headSha === '80b9ce8188089f0e3a95cd9167f78d1e98f5577f', 'PR #53 head mismatch')
assert(pr53.pullRequest.baseSha === 'de294139cea9d46fdd2c181915b8428a3ccc4edd', 'PR #53 base mismatch')
assert(pr53.pullRequest.mergeStateStatus === 'CLEAN', 'PR #53 clean state mismatch')
includeAll(pr53.evidenceSummary.selectedAssets, ['PP-OCRv5_mobile_det_infer.tar', 'PP-OCRv5_mobile_rec_infer.tar', 'ppocrv5_dict.txt'], 'selected assets')
assert(pr53.evidenceSummary.guardedDownloadEvidenceRecorded === true, 'PR #53 guarded download evidence missing')
assert(pr53.evidenceSummary.privateGcsUploadEvidenceRecorded === true, 'PR #53 private upload evidence missing')
assert(pr53.evidenceSummary.gcsObjectVerificationRecorded === true, 'PR #53 GCS evidence missing')
assert(pr53.recordedChecksums.aggregateSha256 === '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b', 'aggregate checksum mismatch')
assert(pr53.mergeHygieneEligibility.dependencyOrder === 2, 'PR #53 order mismatch')

const sourceGap = parsed.sourceGap
assert(sourceGap.sourceGap.sourceBranchHead === SOURCE_MERGE_COMMIT, 'source branch head mismatch')
assert(sourceGap.sourceGap.paddleocrActivationEvidenceMergedIntoSourceBranch === false, 'source ancestry claim must remain false')
assert(sourceGap.safeNextStep.activationMergeHygieneRequired === true, 'merge hygiene requirement missing')
includeAll(sourceGap.safeNextStep.mergeOrder, [51, 53], 'source gap merge order')

const mergeReadiness = parsed.mergeReadiness
assert(mergeReadiness.mergeHygienePlan.mergeOnlyIfStillOpenCleanAndNonDraft === true, 'merge hygiene live check missing')
assert(mergeReadiness.mergeHygienePlan.targetPrs.length === 2, 'merge target count mismatch')
assert(mergeReadiness.mergeHygienePlan.targetPrs[0].number === 51, 'first merge target mismatch')
assert(mergeReadiness.mergeHygienePlan.targetPrs[1].number === 53, 'second merge target mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.sourcePr1574Merged === true, 'source PR claim missing')
assert(claims.allowedClaims.duplicatePaddleocrLaneAvoided === true, 'duplicate avoidance claim missing')

const prompt = parsed.prompt
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'prompt source head mismatch')
assert(prompt.goal.includes('PRs #51 and #53'), 'prompt goal missing target PRs')
assert(prompt.targetPrs.length === 2, 'prompt target PR count mismatch')
assert(prompt.targetPrs[0].number === 51 && prompt.targetPrs[1].number === 53, 'prompt merge order mismatch')
assert(prompt.scope.blocked.includes('validation reruns'), 'prompt missing validation-rerun block')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt missing beta block')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1574,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      hardBlockers: reconciliation.liveReadinessSnapshot.hardBlockers,
      cpuWorkerHardBlocker: reconciliation.liveReadinessSnapshot.cpuWorkerHardBlocker,
      reviewedPrs: [51, 53],
      selectedNextPrompt: NEXT_PROMPT,
      duplicatePaddleocrLaneNeeded: false,
      sourceReadinessAdjustmentAllowedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
