#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_isolated_proof_owner_review_passed_with_warnings_source_install_review_closed_ready_for_pending_manual_review_closure_plan_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_passed_with_warnings_ready_for_source_install_closure_owner_review_no_media_no_production'
const SOURCE_HEAD = '6cbdea39dca1064084a58a80e1516ed085044cdf'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-CLOSURE-PLAN: plan launch-core pending manual review closure, no media/no production'

const REVIEWED_TOOLS = [
  'duckdb',
  'polars',
  'opentimelineio',
  'pyav',
  'pyscenedetect',
  'opencv',
  'sharp',
  'remotion',
]

const NEWLY_CLOSED = ['pyav', 'pyscenedetect', 'opencv', 'sharp', 'remotion']

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review',
  },
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-source-install-closure-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-source-install-closure-register',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-readiness-status-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-readiness-status-delta-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-pending-manual-review-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-pending-manual-review-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-source-install-closure-readiness.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result.md',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadinessClaimed',
  'workerReadinessClaimed',
  'mediaReadinessClaimed',
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
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
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

for (const file of SOURCE_FILES) read(file)

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
const reviewedSetMatch = runner.match(/const sourceInstallReviewedToolIds = new Set<ProductionToolId>\(\[([\s\S]*?)\]\)/)
assert(reviewedSetMatch, 'sourceInstallReviewedToolIds set missing')
const reviewedSetSource = reviewedSetMatch[1]
for (const toolId of REVIEWED_TOOLS) {
  assert(reviewedSetSource.includes(`'${toolId}'`), `runner missing reviewed tool ${toolId}`)
}
assert(runner.includes("return 'pending_manual_review'"), 'runner must map reviewed manifest tools to pending_manual_review')
assert(runner.includes("return 'source_install_review_required'"), 'runner must retain source-install status path for future unreviewed tools')

const sourceProof = read('docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-result.md')
assert(sourceProof.includes(SOURCE_DECISION), 'source proof decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.controlledIsolatedProofPr === 1489, 'source PR mismatch')
assert(review.sourceBase.controlledIsolatedProofDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.reviewResult.isolatedProofAccepted === true, 'isolated proof acceptance missing')
assert(review.reviewResult.nodeProofEvidenceAcceptedFromPriorGate === true, 'node proof acceptance missing')
assert(review.reviewResult.sourceInstallReviewClosedCountThisGate === 5, 'closure count mismatch')
assert(review.reviewResult.sourceInstallReviewRequiredCountAfter === 0, 'source-install count after mismatch')
assert(review.reviewResult.pendingManualReviewCountAfter === 8, 'pending manual count mismatch')
assert(review.reviewResult.externalProductBetaReadyNoRuntimeNoRealMedia === true, 'bounded external beta status mismatch')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const closure = parsed.closure
assert(closure.closedSourceInstallReviewTools.length === NEWLY_CLOSED.length, 'newly closed count mismatch')
for (const toolId of NEWLY_CLOSED) {
  assert(closure.closedSourceInstallReviewTools.some((entry) => entry.toolId === toolId), `missing closure tool ${toolId}`)
}
assert(closure.alreadyClosedSourceInstallReviewTools.length === 3, 'already closed count mismatch')
assert(closure.sourceInstallReviewRequiredCountAfter === 0, 'closure register count after mismatch')

const delta = parsed.delta.readinessDelta
assert(delta.before.source_install_review_required === 5, 'before source-install count mismatch')
assert(delta.after.source_install_review_required === 0, 'after source-install count mismatch')
assert(delta.after.pending_manual_review === 8, 'after pending count mismatch')
assert(delta.hardBlockersAfter === 84, 'hard blocker count mismatch')

const blockers = parsed.blockers
assert(blockers.remainingManualReviewTools.length === REVIEWED_TOOLS.length, 'remaining manual review count mismatch')
for (const toolId of REVIEWED_TOOLS) {
  assert(blockers.remainingManualReviewTools.includes(toolId), `missing pending manual tool ${toolId}`)
}
assert(blockers.separateHardBlockersStillOpen.includes('ffmpeg'), 'ffmpeg must remain blocked')

const claims = parsed.claims
assert(claims.allowedClaims.sourceInstallReviewClosedForManifestBackedLaunchCoreTools === true, 'closure claim missing')
assert(claims.allowedClaims.sourceInstallReviewRequiredCountAfter === 0, 'closure after claim missing')
assert(claims.allowedClaims.pendingManualReviewCountAfter === 8, 'pending after claim missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.reviewTargets.length === REVIEWED_TOOLS.length, 'prompt review target count mismatch')
assert(prompt.allowedPlanningScope.pendingManualReviewClosurePlan === true, 'prompt pending closure plan missing')
assert(prompt.allowedPlanningScope.runtimeExecution === false, 'prompt runtime must remain false')
assert(prompt.allowedPlanningScope.productionUnlock === false, 'prompt production must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-native-runtime-isolated-proof-owner-review:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      controlledIsolatedProofPr: 1489,
      sourceInstallReviewClosedCountThisGate: 5,
      sourceInstallReviewRequiredCountAfter: 0,
      pendingManualReviewCountAfter: 8,
      hardBlockersAfter: 84,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
