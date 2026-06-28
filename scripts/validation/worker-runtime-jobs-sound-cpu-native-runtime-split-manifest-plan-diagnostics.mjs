#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_native_runtime_install_import_proof_blocked_native_ffmpeg_dylib_duplicate_warning_ready_for_split_manifest_plan_no_media_no_production'
const SOURCE_HEAD = 'f1c6154461af1eb96e11082354074fed46618d39'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-PLAN: create isolated PyAV/OpenCV/PySceneDetect manifests, no media/no production'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan',
  },
  strategy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-strategy-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-strategy-register',
  },
  process: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-process-isolation-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-process-isolation-register',
  },
  proof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-proof-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-duplicate-blocker-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'requirementsFilesChangedToday',
  'runtimeSourceChangedToday',
  'sourceInstallReviewClosedToday',
  'sourceInstallReviewClosedForNativeRuntimeTargets',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'toolExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'imageProcessingApprovedToday',
  'remotionRenderingApprovedToday',
  'runtimeExecutionApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'requirementsFileCreation',
  'runtimeSourceImplementation',
  'pythonPackageInstall',
  'nodePackageInstall',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
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
  packageJson.scripts['worker-runtime-jobs:sound-cpu-native-runtime-split-manifest-plan:diagnostics'],
  'package script missing',
)

const priorProof = read('docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result.md')
assert(priorProof.includes(SOURCE_DECISION), 'source proof decision missing')

const duplicateBlocker = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-duplicate-blocker-register.md')
assert(duplicateBlocker.includes('native_ffmpeg_dylib_duplicate_warning'), 'duplicate blocker id missing')
assert(duplicateBlocker.includes('AVFFrameReceiver'), 'duplicate blocker class missing')
assert(duplicateBlocker.includes('AVFAudioReceiver'), 'duplicate blocker class missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.nativeImportProofPr === 1473, 'source PR mismatch')
assert(result.sourceBase.nativeImportProofDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.planResult.splitManifestPlanCreated === true, 'split plan flag missing')
assert(result.planResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero native blockers')
assert(result.planResult.sourceInstallReviewStillRequired.length === 3, 'python native blocker count mismatch')
assert(result.planResult.nodeNativeRuntimeSourceInstallStillRequired.length === 2, 'node native blocker count mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const strategy = parsed.strategy.strategy
assert(strategy.futureManifestPlan.length === 3, 'future manifest count mismatch')
assert(strategy.futureManifestPlan.some((entry) => entry.manifestId === 'sound_cpu_launch_core_pyav'), 'missing PyAV manifest lane')
assert(
  strategy.futureManifestPlan.some((entry) => entry.manifestId === 'sound_cpu_launch_core_opencv_scenedetect'),
  'missing OpenCV/PySceneDetect manifest lane',
)
assert(strategy.sourceFilesCreatedToday === false, 'source files must not be created today')

const process = parsed.process.processIsolationPolicy
assert(process.pyavLane.sameProcessWithOpenCvOrPySceneDetect === false, 'PyAV lane must reject OpenCV same-process')
assert(process.opencvScenedetectLane.sameProcessWithPyAv === false, 'OpenCV lane must reject PyAV same-process')
assert(process.pyavLane.mediaOpenOrDecodeAllowedToday === false, 'PyAV media open must stay blocked')
assert(process.opencvScenedetectLane.mediaOpenOrDecodeAllowedToday === false, 'OpenCV media open must stay blocked')

const proof = parsed.proof.futureProofPlan
assert(proof.proofRunsPlannedAfterSourceGate.length === 2, 'future proof count mismatch')
assert(
  proof.closureRequires.noDuplicateNativeClassWarningInEachIsolatedLane === true,
  'future proof must require no duplicate native warning',
)
assert(proof.closureRequires.noMediaExecution === true, 'future proof must require no media execution')

const blockers = parsed.blockers
assert(blockers.blockers.some((entry) => entry.id === 'native_ffmpeg_dylib_duplicate_warning'), 'missing duplicate blocker')
assert(blockers.closureToday.sourceInstallReviewClosedCountThisGate === 0, 'closure count must remain zero')

const claims = parsed.claims
assert(claims.allowedClaims.splitManifestPlanCreated === true, 'allowed split plan claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real-user beta must stay false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.allowedSourcePlanScope.requirementsFileCreation === false, 'source plan must not create requirements files')
assert(prompt.allowedSourcePlanScope.runtimeExecution === false, 'source plan must not run runtime')
assert(prompt.requiredFutureManifestPlan.length === 3, 'prompt future manifest count mismatch')

for (const path of [
  'server/workers/sound-cpu/requirements.launch-core.shared.txt',
  'server/workers/sound-cpu/requirements.launch-core.pyav.txt',
  'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt',
]) {
  const sourceCreationResultPath =
    'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-result.md'
  if (!existsSync(sourceCreationResultPath)) assert(!existsSync(path), `${path} must not be created in the planning gate`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      nativeImportProofPr: 1473,
      splitManifestPlanCreated: true,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
