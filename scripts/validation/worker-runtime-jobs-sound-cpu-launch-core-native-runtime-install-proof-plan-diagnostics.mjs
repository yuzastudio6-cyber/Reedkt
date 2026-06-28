#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_native_runtime_install_proof_plan_completed_with_warnings_ready_for_controlled_install_import_proof_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_native_runtime_source_install_review_completed_with_warnings_ready_for_native_runtime_install_proof_plan_no_runtime_no_production'
const SOURCE_HEAD = '2e7eeb4d4755f46884ef382ba02b0a793207c1b7'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-INSTALL-IMPORT-PROOF: run controlled native/runtime install/import proof, no media/no production'

const NATIVE_RUNTIME_TOOLS = ['pyav', 'pyscenedetect', 'opencv', 'sharp', 'remotion']
const PYTHON_TOOLS = ['pyav', 'pyscenedetect', 'opencv']
const NODE_TOOLS = ['sharp', 'remotion']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan-result',
  },
  targets: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-target-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-target-register',
  },
  commands: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-command-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-command-plan',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-safety-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-safety-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-proof-blocker-register',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-blocker-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'installProofExecutedToday',
  'sourceInstallReviewClosedToday',
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
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'imageReadinessClaimedToday',
  'remotionReadinessClaimedToday',
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

const requirements = read('server/workers/sound-cpu/requirements.launch-core.txt')
for (const line of ['av==17.1.0', 'scenedetect==0.7', 'opencv-python-headless==4.13.0.92']) {
  assert(requirements.includes(line), `launch-core requirements missing ${line}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.dependencies?.sharp === '0.35.2', 'package.json sharp dependency mismatch')
assert(packageJson.dependencies?.remotion === '4.0.484', 'package.json remotion dependency mismatch')
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-launch-core-native-runtime-install-proof-plan:diagnostics'],
  'package script missing',
)

const packageLock = JSON.parse(read('package-lock.json'))
assert(packageLock.packages?.['']?.dependencies?.sharp === '0.35.2', 'package-lock sharp dependency mismatch')
assert(packageLock.packages?.['']?.dependencies?.remotion === '4.0.484', 'package-lock remotion dependency mismatch')

const previousReview = read('docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review.md')
assert(previousReview.includes(SOURCE_DECISION), 'source review decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.nativeRuntimeSourceInstallReviewPr === 1467, 'source PR mismatch')
assert(result.sourceBase.nativeRuntimeSourceInstallReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.planResult.proofTargets === 5, 'proof target count mismatch')
assert(result.planResult.pythonProofTargets === 3, 'python target count mismatch')
assert(result.planResult.nodeProofTargets === 2, 'node target count mismatch')
assert(result.planResult.installProofPlanned === true, 'install proof planned flag missing')
assert(result.planResult.sourceInstallReviewClosedCountThisGate === 0, 'this gate must close zero tools')
assert(result.planResult.sourceInstallReviewStillRequiredCountAfter === 5, 'remaining source-install count mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const targets = parsed.targets
assert(targets.proofTargets.length === 5, 'target register count mismatch')
for (const toolId of NATIVE_RUNTIME_TOOLS) {
  assert(targets.proofTargets.some((entry) => entry.toolId === toolId), `missing target ${toolId}`)
}
for (const toolId of PYTHON_TOOLS) {
  assert(targets.proofTargets.some((entry) => entry.toolId === toolId && entry.proofKind === 'python_metadata_and_import_only'), `${toolId} must be python import-only`)
}
for (const toolId of NODE_TOOLS) {
  assert(targets.proofTargets.some((entry) => entry.toolId === toolId && entry.proofKind === 'node_metadata_and_import_only'), `${toolId} must be node import-only`)
}

const commands = parsed.commands
assert(commands.futureProofCommands.pythonVenv.locationPolicy === 'outside_repo_under_private_tmp', 'python venv must be outside repo')
assert(commands.futureProofCommands.pythonVenv.installCommand.includes('requirements.launch-core.txt'), 'python install command must use launch-core requirements')
assert(commands.futureProofCommands.nodeInstall.installCommand === 'npm ci --no-audit --no-fund', 'node install command mismatch')
assert(commands.explicitlyNotExecutedInThisGate.includes('python native imports'), 'python import proof must not run in this gate')
assert(commands.explicitlyNotExecutedInThisGate.includes('node native imports'), 'node import proof must not run in this gate')

const safety = parsed.safety
assert(safety.futureProofFailureHandling.importFailure, 'future import failure classification missing')
assert(safety.futureProofFailureHandling.mediaExecutionDetected, 'media execution failure classification missing')

const blockers = parsed.blockers
assert(blockers.blockersRemainingBeforeProof.sourceInstallReviewRequired.length === 5, 'blocker source-install count mismatch')
assert(blockers.closureCriteriaForFutureProof.packageLockUnchanged === true, 'package-lock closure criterion missing')
assert(blockers.closureCriteriaForFutureProof.noRuntimeExecution === true, 'runtime closure criterion missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
for (const toolId of NATIVE_RUNTIME_TOOLS) {
  assert(prompt.proofTargets.includes(toolId), `prompt missing proof target ${toolId}`)
}
assert(prompt.allowedInProof.pythonVenvOutsideRepo === true, 'prompt python venv policy missing')
assert(prompt.allowedInProof.runtimeExecution === false, 'prompt runtime must remain false')
assert(prompt.allowedInProof.mediaProcessing === false, 'prompt media must remain false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      nativeRuntimeSourceInstallReviewPr: 1467,
      proofTargets: NATIVE_RUNTIME_TOOLS,
      installProofExecutedToday: false,
      sourceInstallReviewClosedCountThisGate: 0,
      sourceInstallReviewStillRequiredCountAfter: 5,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
