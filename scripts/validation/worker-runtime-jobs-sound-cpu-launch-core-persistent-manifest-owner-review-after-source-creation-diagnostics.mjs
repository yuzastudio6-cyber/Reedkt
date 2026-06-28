#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_owner_review_after_source_creation_passed_with_warnings_ready_for_readiness_reconciliation_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_creation_after_source_plan_completed_with_warnings_ready_for_persistent_manifest_owner_review_no_runtime_no_production'
const SOURCE_HEAD = 'eb014af1ef67df8ac517c0ddd89273f7765d35b9'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECONCILIATION-AFTER-PERSISTENT-MANIFEST-REVIEW: reconcile persistent launch-core manifests into readiness diagnostics, no runtime/no production'
const REQUIREMENTS_PATH = 'server/workers/sound-cpu/requirements.launch-core.txt'

const PYTHON_LINES = [
  'av==17.1.0',
  'scenedetect==0.7',
  'opencv-python-headless==4.13.0.92',
  'duckdb==1.5.4',
  'polars==1.42.0',
  'opentimelineio==0.18.1',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation-result',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-acceptance-register-after-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-acceptance-register-after-source-creation',
  },
  warnings: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-warning-register-after-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-warning-register-after-source-creation',
  },
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-register-after-manifest-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-register-after-manifest-review',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-claim-policy-after-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-claim-policy-after-source-creation',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-python-requirements-source-register-after-source-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-node-lockfile-source-register-after-source-plan.md',
  'docs/cross-chat-tool-ownership-registry.md',
]

const MUST_BE_FALSE = [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'imageProcessingApprovedToday',
  'remotionRenderingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'externalProductBetaReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForPaidProductionToday',
  'acceptedForMediaProcessingToday',
  'unlockExternalRealUserMediaBeta',
  'unlockPaidProduction',
]

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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const source of SOURCE_FILES) read(source)
const requirements = read(REQUIREMENTS_PATH).trim().split(/\r?\n/)
assert(requirements.join('\n') === PYTHON_LINES.join('\n'), 'requirements pins mismatch')

const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
assert(pkg.dependencies?.sharp === '0.35.2', 'package.json sharp mismatch')
assert(pkg.dependencies?.remotion === '4.0.484', 'package.json remotion mismatch')
assert(lock.packages?.['']?.dependencies?.sharp === '0.35.2', 'package-lock root sharp mismatch')
assert(lock.packages?.['']?.dependencies?.remotion === '4.0.484', 'package-lock root remotion mismatch')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.sourceCreationPr === 1452, 'source creation PR mismatch')
assert(result.sourceBase.sourceCreationDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.reviewDecision.persistentManifestSourceAccepted === true, 'manifest acceptance missing')
assert(result.reviewDecision.acceptedForReadinessReconciliationPlanning === true, 'reconciliation acceptance missing')
assert(result.reviewedSource.totalPersistentManifestEntries === 8, 'persistent manifest count mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedPythonRequirements.length === 6, 'accepted Python count mismatch')
assert(acceptance.acceptedNodeDependencies.sharp === '0.35.2', 'accepted sharp mismatch')
assert(acceptance.acceptedNodeDependencies.remotion === '4.0.484', 'accepted remotion mismatch')
assert(acceptance.acceptedEvidence.packageLockUpdatedForApprovedClosure === true, 'lock acceptance missing')
assert(acceptance.acceptanceLimits.acceptedForStaticReadinessReconciliation === true, 'readiness acceptance missing')

const warnings = parsed.warnings
assert(warnings.warningsAcceptedForPlanningOnly.length === 4, 'warning count mismatch')
for (const id of ['scenedetect_transitive_opencv_python', 'pyav_opencv_native_library_overlap', 'ffmpeg_lgpl_safe_build_review']) {
  assert(warnings.warningsAcceptedForPlanningOnly.some((entry) => entry.id === id), `missing warning ${id}`)
}
assert(warnings.warningConclusion.manifestSourceAcceptedDespiteWarnings === true, 'warning conclusion mismatch')

const reconciliation = parsed.reconciliation
assert(reconciliation.reconciliationMayProceed === true, 'reconciliation handoff missing')
assert(reconciliation.reconciliationTargets.length === 3, 'reconciliation target count mismatch')
assert(reconciliation.expectedOutcomeForNextGate.staticReadinessMayRecognizePersistentManifests === true, 'static readiness outcome missing')

const claim = parsed.claim
assert(claim.claimConclusion.readinessReconciliationMayProceed === true, 'claim reconciliation missing')
assert(claim.claimConclusion.realUserMediaBetaStillBlocked === true, 'real user beta blocker missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.acceptedManifestInputs.pythonRequirementsPath === REQUIREMENTS_PATH, 'prompt requirements path mismatch')
assert(prompt.allowedInReconciliationGate.staticReadinessDiagnosticsUpdate === true, 'prompt static readiness allowance missing')
assert(prompt.allowedInReconciliationGate.runtimeExecution === false, 'prompt runtime must remain false')
assert(prompt.allowedInReconciliationGate.productionUnlock === false, 'prompt production must remain false')

assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      sourceCreationPr: 1452,
      persistentManifestSourceAccepted: true,
      readinessReconciliationMayProceed: true,
      runtimeExecutionApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
