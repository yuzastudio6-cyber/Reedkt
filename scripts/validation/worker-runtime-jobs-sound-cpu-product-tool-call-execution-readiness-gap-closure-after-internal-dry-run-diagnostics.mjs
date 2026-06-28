import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_product_tool_call_execution_readiness_gap_closure_after_internal_dry_run_completed_with_warnings_ready_for_worker_route_execution_boundary_closure_no_external_beta'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_tool_call_runtime_readiness_refresh_after_internal_dry_run_passed_with_warnings_ready_for_next_runtime_blocker_closure_no_external_beta'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-ROUTE-EXECUTION-BOUNDARY-CLOSURE-AFTER-PRODUCT-TOOL-CALL-GAP: close worker/route execution boundary after product tool-call gap, no external beta'

const files = {
  closure:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-source-register-after-internal-dry-run.md',
  evidenceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-evidence-coverage-after-internal-dry-run.md',
  workerRouteBoundary:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-worker-route-boundary-after-internal-dry-run.md',
  blocker:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-blocker-register-after-internal-dry-run.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-claim-policy-after-internal-dry-run.md',
  nextPromptFile:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-closure-after-product-tool-call-gap.md',
  sourceRefresh:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run.md',
  runtimeOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-gate-map-review.md',
  runtimeApproval: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md',
  dispatchSchema: 'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md',
  serverRouteProof: 'docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review.md',
  routeReadinessClaim: 'docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md',
  packageJson: 'package.json'
}

const labels = {
  closure:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-source-register-after-internal-dry-run',
  evidenceCoverage:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-evidence-coverage-after-internal-dry-run',
  workerRouteBoundary:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-worker-route-boundary-after-internal-dry-run',
  blocker:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-blocker-register-after-internal-dry-run',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-claim-policy-after-internal-dry-run'
}

const forbiddenText = [
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"runtimeReadinessClaimed": true',
  '"mediaReadinessClaimed": true',
  '"artifactReadinessClaimed": true',
  '"generatedLocalFixturePassedClaimed": true',
  '"dryRunPassedClaimed": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"externalBetaApprovedToday": true',
  '"productionApprovedToday": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"creditMutated": true',
  '"stripeProcessed": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'BEGIN RSA',
  'BEGIN OPENSSH'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label
  const start = markdown.indexOf(fence)
  assert(start !== -1, `Missing JSON fence: ${label}`)
  const jsonStart = markdown.indexOf('\n', start)
  const end = markdown.indexOf('```', jsonStart + 1)
  assert(jsonStart !== -1 && end !== -1, `Unclosed JSON fence: ${label}`)
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value.nextAction === 'none', `${label}.nextAction must be none`)
}

function assertAllFalse(value, label) {
  for (const [key, entry] of Object.entries(value)) {
    assert(entry === false, `${label}.${key} must remain false`)
  }
}

const docs = Object.fromEntries(Object.entries(files).map(([key, relativePath]) => [key, read(relativePath)]))

for (const [key, text] of Object.entries(docs)) {
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`)
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
)

for (const key of ['closure', 'sourceRegister', 'evidenceCoverage', 'workerRouteBoundary', 'blocker', 'claimPolicy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`)
}

assert(
  docs.packageJson.includes(
    '"worker-runtime-jobs:sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run:diagnostics": "node scripts/validation/worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run-diagnostics.mjs"'
  ),
  'package script missing'
)
assert(
  docs.nextPromptFile.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-ROUTE-EXECUTION-BOUNDARY-CLOSURE-AFTER-PRODUCT-TOOL-CALL-GAP'),
  'next prompt id missing'
)
assert(docs.nextPromptFile.includes('Expected decision if the worker/route boundary can close'), 'next prompt expected decision missing')

assert(parsed.closure.sourceVerification.sourceHead === 'd3286bd96e10493400d12c369d29fd803f6cdaed', 'source head mismatch')
assert(parsed.closure.sourceVerification.pr1367.mergeCommit === 'd3286bd96e10493400d12c369d29fd803f6cdaed', 'PR #1367 merge mismatch')
assert(parsed.closure.sourceVerification.pr1367.decision === sourceDecision, 'PR #1367 decision mismatch')
assert(parsed.closure.gapClosureResult.gapClosedForPlanning === true, 'gap must close for planning')
assert(parsed.closure.gapClosureResult.gapClosedForExecution === false, 'gap must not close for execution')
assert(parsed.closure.gapClosureResult.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.closure.gapClosureResult.boundedInternalDryRunPassed === 15, 'dry-run pass count mismatch')
assert(parsed.closure.gapClosureResult.boundedInternalDryRunFailed === 0, 'dry-run failure count mismatch')
assert(parsed.closure.gapClosureResult.syntheticToolCallProbePassedCount === 15, 'probe pass count mismatch')
assert(parsed.closure.gapClosureResult.syntheticToolCallProbeFailedCount === 0, 'probe fail count mismatch')
for (const key of [
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'runtimeReadinessClaimedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'externalBetaApprovedToday',
  'productionApprovedToday'
]) {
  assert(parsed.closure.gapClosureResult[key] === false, `gap closure widened ${key}`)
}
assert(parsed.closure.selectedNextClosure.blockerId === 'worker_route_execution_boundary_closure', 'selected next blocker mismatch')
assert(parsed.closure.selectedNextClosure.nextPrompt === nextPrompt, 'next prompt mismatch')
assert(parsed.closure.selectedNextClosure.mayProceed === true, 'next closure mayProceed missing')
assert(parsed.closure.selectedNextClosure.mayExecuteWorkerOrRouteNow === false, 'worker/route execution widened')
assertSupabaseNoop(parsed.closure.supabaseClassification, 'closure')

assert(parsed.sourceRegister.sourceRegister.length === 8, 'source register count mismatch')
for (const source of parsed.sourceRegister.sourceRegister) {
  assert(source.executionApprovedBySource === false, `source execution widened: ${source.source}`)
}
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'duplicate flag mismatch')
assert(parsed.sourceRegister.sourceConclusion.productToolCallExecutionApprovedToday === false, 'source conclusion execution widened')

assert(parsed.evidenceCoverage.coverage.length === 6, 'coverage count mismatch')
for (const item of parsed.evidenceCoverage.coverage) assert(item.approvedForExecution === false, `coverage execution widened: ${item.requirement}`)
assert(parsed.evidenceCoverage.coverageSummary.coveredForPlanningCount === 6, 'coverage planning count mismatch')
assert(parsed.evidenceCoverage.coverageSummary.approvedForExecutionCount === 0, 'coverage execution count widened')
assert(parsed.evidenceCoverage.coverageSummary.gapClosedForPlanning === true, 'coverage planning closure missing')
assert(parsed.evidenceCoverage.coverageSummary.gapClosedForExecution === false, 'coverage execution closure widened')

for (const [key, entry] of Object.entries(parsed.workerRouteBoundary.workerRouteBoundary)) {
  if (key.endsWith('Present') || key === 'routeReadinessClaimAcceptedForPlanning') {
    assert(entry === true, `worker route planning evidence missing: ${key}`)
  } else {
    assert(entry === false, `worker route boundary widened: ${key}`)
  }
}
assert(parsed.workerRouteBoundary.nextPrompt === nextPrompt, 'worker route next prompt mismatch')

assert(parsed.blocker.closedOrConvertedBlockers.length === 1, 'closed blocker count mismatch')
assert(parsed.blocker.closedOrConvertedBlockers[0].closedForExecution === false, 'closed blocker execution widened')
assert(parsed.blocker.remainingBlockers.length === 3, 'remaining blocker count mismatch')
assert(parsed.blocker.blockerSummary.closedForPlanningCount === 1, 'closed-for-planning count mismatch')
assert(parsed.blocker.blockerSummary.closedForExecutionCount === 0, 'closed-for-execution count widened')
assert(parsed.blocker.blockerSummary.externalBetaRemainsBlocked === true, 'external beta blocker missing')
assert(parsed.blocker.blockerSummary.productionRemainsBlocked === true, 'production blocker missing')

assert(parsed.claimPolicy.allowedClaims.length === 4, 'allowed claim count mismatch')
for (const required of [
  'product tool-call execution ready',
  'worker execution ready',
  'route execution ready',
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertAllFalse(parsed.claimPolicy.closedFlags, 'claimPolicy.closedFlags')
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

assert(docs.sourceRefresh.includes(sourceDecision), 'source refresh decision missing')
assert(docs.sourceRefresh.includes('"productToolCallExecutionReadyCount": 0'), 'source refresh product count missing')
assert(docs.runtimeOwnerGate.includes('"runtimeExecutionApprovedToday": false'), 'runtime owner gate boundary missing')
assert(docs.runtimeApproval.includes('"allOwnerSignoffsGrantedToday": false'), 'runtime approval signoff boundary missing')
assert(docs.dispatchSchema.includes('"workerExecutionApprovedToday": false'), 'dispatch schema worker boundary missing')
assert(docs.serverRouteProof.includes('"serverRouteExecutedInThisOwnerReview": false'), 'server route execution boundary missing')
assert(docs.routeReadinessClaim.includes('"routeReadinessClaimAcceptedForExecutionToday": false'), 'route readiness execution boundary missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceHead: parsed.closure.sourceVerification.sourceHead,
      gapClosedForPlanning: parsed.closure.gapClosureResult.gapClosedForPlanning,
      gapClosedForExecution: parsed.closure.gapClosureResult.gapClosedForExecution,
      selectedNextPrompt: parsed.closure.selectedNextClosure.nextPrompt,
      externalBetaApprovedToday: parsed.closure.gapClosureResult.externalBetaApprovedToday
    },
    null,
    2
  )
)
