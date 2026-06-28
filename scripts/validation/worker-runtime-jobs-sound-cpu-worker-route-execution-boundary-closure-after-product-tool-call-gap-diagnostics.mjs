import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_worker_route_execution_boundary_closure_after_product_tool_call_gap_completed_with_warnings_ready_for_beta_support_boundary_closure_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_product_tool_call_execution_readiness_gap_closure_after_internal_dry_run_completed_with_warnings_ready_for_worker_route_execution_boundary_closure_no_external_beta'
const SOURCE_HEAD = 'b736b0e2423ca0c3f8f53515810dc6a90f0b6a8d'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-BETA-SUPPORT-BOUNDARY-CLOSURE-AFTER-WORKER-ROUTE-BOUNDARY: close beta/support boundary after worker-route boundary closure, no external beta'

const FILES = {
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-closure-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-closure-after-product-tool-call-gap'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-source-register-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-source-register-after-product-tool-call-gap'
  },
  evidenceCoverage: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-evidence-coverage-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-evidence-coverage-after-product-tool-call-gap'
  },
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-reconciliation-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-reconciliation-after-product-tool-call-gap'
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-blocker-register-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-blocker-register-after-product-tool-call-gap'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-claim-policy-after-product-tool-call-gap.md',
    label: 'worker-runtime-jobs-sound-cpu-worker-route-execution-boundary-claim-policy-after-product-tool-call-gap'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-beta-support-boundary-closure-after-worker-route-boundary.md'

const FORBIDDEN_STRINGS = [
  '"workerRouteBoundaryClosedForExecution": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"runtimeReadinessClaimed": true',
  '"mediaReadinessClaimed": true',
  '"artifactReadinessClaimed": true',
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"runtimeExecutionApprovedToday": true',
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
  'service_role',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS'
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
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

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function assertAllFalse(value, label) {
  for (const [key, actual] of Object.entries(value)) {
    assert(actual === false, `${label}.${key} should be false`)
  }
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no external beta'), 'next prompt missing no external beta scope')

const closure = parsed.closure
assert(closure.sourceVerification.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(closure.sourceVerification.pr1373.merged === true, 'PR #1373 merge evidence missing')
assert(closure.sourceVerification.pr1373.mergeCommit === SOURCE_HEAD, 'PR #1373 merge commit mismatch')
assert(closure.sourceVerification.pr1373.decision === SOURCE_DECISION, 'PR #1373 decision mismatch')
assert(closure.sourceVerification.pr1367.mergeCommit === 'd3286bd96e10493400d12c369d29fd803f6cdaed', 'PR #1367 merge mismatch')
assert(closure.sourceVerification.pr1363.mergeCommit === 'b8999b86b2bc36493944d3a55bcfbd8ba90468c9', 'PR #1363 merge mismatch')
assert(closure.sourceVerification.pr1357.mergeCommit === 'a790cad3ecd82a5de715cd2251fe5f1862a29d32', 'PR #1357 merge mismatch')
assert(closure.boundaryClosureResult.closedForPlanning === true, 'boundary should close for planning')
assert(closure.boundaryClosureResult.closedForExecution === false, 'boundary must not close for execution')
assert(closure.boundaryClosureResult.workerDispatchContractSchemaPresent === true, 'dispatch schema missing')
assert(closure.boundaryClosureResult.serverRouteStaticProofPresent === true, 'route static proof missing')
assert(closure.boundaryClosureResult.routeReadinessClaimAcceptedForPlanning === true, 'route readiness planning missing')
assert(closure.boundaryClosureResult.runtimeExecutionOwnerGateMapAcceptedForPlanning === true, 'runtime gate map missing')
assert(closure.boundaryClosureResult.runtimeExecutionOwnerApprovalPacketAcceptedForGapClosurePlanning === true, 'runtime approval packet missing')
for (const [key, value] of Object.entries(closure.boundaryClosureResult)) {
  if (key.endsWith('ApprovedToday') || key.endsWith('ClaimedToday')) {
    assert(value === false, `closure.${key} must remain false`)
  }
}
assert(closure.selectedNextClosure.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(closure.selectedNextClosure.mayUnlockExternalBetaToday === false, 'external beta must remain closed')
assertSupabaseNoop(closure.supabaseClassification, 'closure')

const sourceEntries = parsed.sourceRegister.sources
assert(sourceEntries.length === 9, 'source register count mismatch')
for (const [source, mergeCommit] of [
  ['PR #1373', SOURCE_HEAD],
  ['PR #1367', 'd3286bd96e10493400d12c369d29fd803f6cdaed'],
  ['PR #1363', 'b8999b86b2bc36493944d3a55bcfbd8ba90468c9'],
  ['PR #1357', 'a790cad3ecd82a5de715cd2251fe5f1862a29d32'],
  ['worker dispatch schema owner review', '0180b8d3a31b83318c7407c70692cfbbb7c6eba6'],
  ['server route execution proof owner review', '891c7857b6c7d6e885b4143656cd84391306ad67'],
  ['route-readiness claim owner review', 'f2b5290dff46d034f8b6b0f60dde7c2db47da46c'],
  ['runtime execution owner-gate map review', '93d177348c9cefc128dbedf3878a5b7223b89c9d'],
  ['runtime execution owner approval packet review', '028f49b2e35930f0ddb2fd6663af6f80ab20deb1']
]) {
  assert(
    sourceEntries.some((entry) => entry.source === source && entry.mergeCommit === mergeCommit),
    `missing source register entry: ${source}`
  )
}

assert(parsed.evidenceCoverage.coverageConclusion.workerRouteBoundaryClosedForPlanning === true, 'coverage planning closure missing')
assert(parsed.evidenceCoverage.coverageConclusion.workerRouteBoundaryClosedForExecution === false, 'coverage execution closure must be false')
assert(parsed.evidenceCoverage.coverageConclusion.nextUnclosedBoundary === 'beta_support_boundary_closure', 'coverage next boundary mismatch')
assert(parsed.evidenceCoverage.coverage.some((item) => item.boundary === 'beta-facing support and rollback' && item.coveredForPlanning === false), 'beta/support blocker missing')

assert(parsed.reconciliation.reconciliation.workerDispatch.schemaPresent === true, 'reconciliation dispatch missing')
assert(parsed.reconciliation.reconciliation.workerDispatch.dispatchApprovedToday === false, 'dispatch must remain false')
assert(parsed.reconciliation.reconciliation.serverRoute.staticProofPresent === true, 'route proof missing')
assert(parsed.reconciliation.reconciliation.serverRoute.routeExecutionApprovedToday === false, 'route execution must remain false')
assert(parsed.reconciliation.reconciliation.runtimeOwnerGates.allOwnerSignoffsGrantedToday === false, 'owner signoffs should remain false')
assertAllFalse(parsed.reconciliation.reconciliation.blockingExternalBoundaries, 'blockingExternalBoundaries')

assert(parsed.blocker.closedBlockers.length === 1, 'closed blocker count mismatch')
assert(parsed.blocker.closedBlockers[0].closedForPlanning === true, 'closed blocker planning mismatch')
assert(parsed.blocker.closedBlockers[0].closedForExecution === false, 'closed blocker execution mismatch')
assert(parsed.blocker.remainingBlockers.some((item) => item.blockerId === 'beta_support_boundary_closure'), 'next blocker missing')
assert(parsed.blocker.remainingBlockers.some((item) => item.blockerId === 'external_beta_unlock_gap'), 'external beta blocker missing')

assert(parsed.claimPolicy.allowedClaims.length === 4, 'allowed claim count mismatch')
for (const required of [
  'worker execution ready',
  'route execution ready',
  'product tool-call execution ready',
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assert(parsed.claimPolicy.closedFlags.workerRouteBoundaryClosedForPlanning === true, 'planning flag should be true')
const flagsToRemainFalse = { ...parsed.claimPolicy.closedFlags }
delete flagsToRemainFalse.workerRouteBoundaryClosedForPlanning
assertAllFalse(flagsToRemainFalse, 'claimPolicy.closedFlags')
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      workerRouteBoundaryClosedForPlanning: true,
      workerRouteBoundaryClosedForExecution: false,
      selectedNextPrompt: NEXT_PROMPT,
      externalBetaApprovedToday: false
    },
    null,
    2
  )
)
