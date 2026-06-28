#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_native_runtime_install_import_proof_blocked_native_ffmpeg_dylib_duplicate_warning_ready_for_split_manifest_plan_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_native_runtime_install_proof_plan_completed_with_warnings_ready_for_controlled_install_import_proof_no_media_no_production'
const SOURCE_HEAD = 'fa29051a2410ebb930eeabe82ccae6c90e18639d'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-PLAN: plan PyAV/OpenCV/PySceneDetect import isolation, no media/no production'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result',
  },
  python: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-python-proof-register.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-python-proof-register',
  },
  node: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-node-proof-register.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-node-proof-register',
  },
  duplicate: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-duplicate-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-duplicate-blocker-register',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-proof-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-proof-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'sourceInstallReviewMayCloseNow',
  'sourceInstallReviewClosedForNativeRuntimeTargets',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'imageReadinessClaimedToday',
  'remotionReadinessClaimedToday',
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
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'imageProcessing',
  'remotionRendering',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
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

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-native-runtime-install-import-proof:diagnostics'],
  'package script missing',
)

const packageLockHash = '1bb8eeaeb320c32aecf53939056ad5e63b6d99fc0272b7dad87c5e95f724b2af'

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.installProofPlanPr === 1470, 'source PR mismatch')
assert(result.sourceBase.installProofPlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.proofResult.pythonInstallSucceeded === true, 'python install should have succeeded')
assert(result.proofResult.pythonNativeDuplicateWarningDetected === true, 'native duplicate warning must be recorded')
assert(result.proofResult.nodeInstallSucceeded === true, 'node install should have succeeded')
assert(result.proofResult.nodeImportPassed === true, 'node imports should pass')
assert(result.proofResult.temporaryPythonVenvRemoved === true, 'python venv cleanup must be recorded')
assert(result.proofResult.packageLockUnchanged === true, 'package-lock unchanged must be recorded')
assert(result.proofResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero source-install blockers')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const python = parsed.python.pythonProof
assert(python.venvInsideRepo === false, 'python venv must be outside repo')
assert(python.metadataVersions.av === '17.1.0', 'av version mismatch')
assert(python.metadataVersions.scenedetect === '0.7', 'scenedetect version mismatch')
assert(python.metadataVersions['opencv-python-headless'] === '4.13.0.92', 'opencv version mismatch')
assert(python.isolatedImportChecks.av === 'passed', 'av isolated import mismatch')
assert(python.isolatedImportChecks.cv2 === 'passed', 'cv2 isolated import mismatch')
assert(python.isolatedImportChecks.scenedetect === 'passed_with_native_duplicate_warning', 'scenedetect warning missing')
assert(python.combinedImportCheck.nativeDuplicateWarningDetected === true, 'combined duplicate warning missing')
assert(python.combinedImportCheck.duplicateClasses.includes('AVFFrameReceiver'), 'duplicate class missing')
assert(python.temporaryPythonVenvRemoved === true, 'venv removal missing')

const node = parsed.node.nodeProof
assert(node.installSucceeded === true, 'node install missing')
assert(node.importChecks.sharp === 'passed', 'sharp import missing')
assert(node.importChecks.remotion === 'passed', 'remotion import missing')
assert(node.packageLockHashBefore === packageLockHash, 'package-lock before hash mismatch')
assert(node.packageLockHashAfter === packageLockHash, 'package-lock after hash mismatch')
assert(node.packageLockUnchanged === true, 'package-lock unchanged mismatch')

const duplicate = parsed.duplicate.blocker
assert(duplicate.id === 'native_ffmpeg_dylib_duplicate_warning', 'duplicate blocker id mismatch')
assert(duplicate.severity === 'blocks_real_user_media_beta_and_production', 'duplicate blocker severity mismatch')
assert(duplicate.sourceInstallReviewMayCloseNow === false, 'duplicate blocker must prevent closure')

const claim = parsed.claim
assert(claim.allowedClaims.controlledInstallImportProofRan === true, 'proof run claim missing')
assert(claim.allowedClaims.nativeDuplicateBlockerDetected === true, 'duplicate blocker claim missing')
assert(claim.blockedClaims.realUserMediaBetaAllowed === false, 'real-user beta must remain false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.blockerId === 'native_ffmpeg_dylib_duplicate_warning', 'prompt blocker id mismatch')
assert(prompt.allowedInSplitManifestPlan.runtimeExecution === false, 'prompt runtime must remain false')

if (existsSync('node_modules')) {
  const stat = lstatSync('node_modules')
  assert(stat.isDirectory(), 'node_modules must not be an unexpected file/symlink during diagnostics')
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      installProofPlanPr: 1470,
      pythonInstallSucceeded: true,
      pythonNativeDuplicateWarningDetected: true,
      nodeImportPassed: true,
      packageLockUnchanged: true,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
