#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_native_runtime_source_install_review_completed_with_warnings_ready_for_native_runtime_install_proof_plan_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_source_install_review_after_readiness_reconciliation_passed_with_warnings_ready_for_native_runtime_source_install_review_no_runtime_no_production'
const SOURCE_HEAD = 'ea8607d28e879e0f0895c566aff8ae06de49371c'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-INSTALL-PROOF-PLAN: plan controlled native/runtime install proof, no media/no production'

const PREVIOUSLY_ACCEPTED = ['duckdb', 'polars', 'opentimelineio']
const NATIVE_RUNTIME_TOOLS = ['pyav', 'pyscenedetect', 'opencv', 'sharp', 'remotion']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review-result',
  },
  risks: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-risk-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-risk-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-blocker-register',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-native-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-remaining-blocker-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'sourceInstallReviewClosedToday',
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

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
const reviewedSetMatch = runner.match(/const sourceInstallReviewedToolIds = new Set<ProductionToolId>\(\[([\s\S]*?)\]\)/)
assert(reviewedSetMatch, 'runner missing source install reviewed set')
const reviewedSetText = reviewedSetMatch[1]
for (const toolId of PREVIOUSLY_ACCEPTED) {
  assert(reviewedSetText.includes(`'${toolId}'`), `runner missing previously accepted tool ${toolId}`)
}
for (const toolId of NATIVE_RUNTIME_TOOLS) {
  assert(runner.includes(`'${toolId}'`), `runner missing manifest-backed native/runtime tool ${toolId}`)
  assert(!reviewedSetText.includes(`'${toolId}'`), `native/runtime tool ${toolId} must not be source-install closed yet`)
}
assert(runner.includes("return 'source_install_review_required'"), 'runner must keep remaining tools source_install_review_required')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.sourceInstallReviewPr === 1462, 'source PR mismatch')
assert(result.sourceBase.sourceInstallReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.reviewResult.reviewedNativeRuntimeTargets === 5, 'native/runtime target count mismatch')
assert(result.reviewResult.sourceInstallReviewClosedCountThisGate === 0, 'this gate must close zero native/runtime tools')
assert(result.reviewResult.sourceInstallReviewStillRequiredCountAfter === 5, 'remaining source-install count mismatch')
assert(result.reviewResult.nativeRuntimeInstallProofRequired === true, 'native proof requirement missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const risks = parsed.risks
assert(risks.nativeRuntimeTargets.length === 5, 'risk target count mismatch')
for (const toolId of NATIVE_RUNTIME_TOOLS) {
  assert(risks.nativeRuntimeTargets.some((entry) => entry.toolId === toolId), `missing risk entry ${toolId}`)
}
assert(risks.separateMissingLaunchCoreTargets.includes('ffmpeg'), 'ffmpeg must remain separate')
assert(risks.separateMissingLaunchCoreTargets.includes('ffprobe'), 'ffprobe must remain separate')

const blockers = parsed.blockers
assert(blockers.blockingConclusion.nativeRuntimeInstallProofRequired === true, 'blocker proof requirement mismatch')
assert(blockers.blockingConclusion.sourceInstallReviewClosureDeferredCount === 5, 'deferred closure count mismatch')
assert(blockers.blockingConclusion.sourceInstallReviewClosureAcceptedCount === 0, 'closure accepted count must be zero')
assert(blockers.blockingConclusion.remainingReadinessStatus === 'source_install_review_required', 'remaining status mismatch')

const claim = parsed.claim
assert(claim.allowedClaims.nativeRuntimeSourceInstallReviewCompleted === true, 'review completed claim missing')
assert(claim.allowedClaims.nativeRuntimeInstallProofMayBePlanned === true, 'proof planning handoff missing')
assert(claim.blockedClaims.sourceInstallReviewClosedForNativeRuntimeTargets === false, 'source install closure claim must remain false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.proofTargets.length === 5, 'prompt proof target count mismatch')
for (const toolId of NATIVE_RUNTIME_TOOLS) {
  assert(prompt.proofTargets.includes(toolId), `prompt missing proof target ${toolId}`)
}
assert(prompt.allowedInProofPlan.runtimeExecution === false, 'prompt runtime must remain false')
assert(prompt.allowedInProofPlan.mediaProcessing === false, 'prompt media must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-native-runtime-source-install-review:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      sourceInstallReviewPr: 1462,
      nativeRuntimeTargetsReviewed: 5,
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
