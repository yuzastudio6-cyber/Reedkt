#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2n_route_readiness_evaluator_source_creation_plan_completed_with_warnings_ready_for_source_plan_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_owner_review_passed_with_warnings_ready_for_evaluator_source_creation_plan'
const gate2mDecision = 'sound_runtime_media_gate_2m_route_readiness_evaluator_plan_completed_with_warnings_ready_for_evaluator_owner_review'
const sourceHead = '0b7b1cbc4b26fdc5973653fc19790cca3a428354'
const pr824MergeCommit = '3b65169d4d48b02bc1f4e581fc74b6e3cacfd243'
const plannedPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'

const docs = [
  ['docs/sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan.md', 'sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan'],
  ['docs/sound-runtime-media-gate-2n-evaluator-source-path-register.md', 'sound-runtime-media-gate-2n-evaluator-source-path-register'],
  ['docs/sound-runtime-media-gate-2n-evaluator-source-content-plan.md', 'sound-runtime-media-gate-2n-evaluator-source-content-plan'],
  ['docs/sound-runtime-media-gate-2n-static-validation-plan.md', 'sound-runtime-media-gate-2n-static-validation-plan'],
  ['docs/sound-runtime-media-gate-2n-owner-handoff.md', 'sound-runtime-media-gate-2n-owner-handoff'],
  ['docs/sound-runtime-media-gate-2n-blocker-register.md', 'sound-runtime-media-gate-2n-blocker-register'],
  ['docs/sound-runtime-media-gate-2n-runtime-claim-policy.md', 'sound-runtime-media-gate-2n-runtime-claim-policy'],
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const jsonStart = start + marker.length
  const end = text.indexOf('```', jsonStart)
  assert(end >= 0, `${file} missing JSON close`)
  return JSON.parse(text.slice(jsonStart, end).trim())
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const plan = parseBlock(docs[0][0], docs[0][1])
const pathRegister = parseBlock(docs[1][0], docs[1][1])
const contentPlan = parseBlock(docs[2][0], docs[2][1])
const staticPlan = parseBlock(docs[3][0], docs[3][1])
const handoff = parseBlock(docs[4][0], docs[4][1])
const blockers = parseBlock(docs[5][0], docs[5][1])
const policy = parseBlock(docs[6][0], docs[6][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review')
const gate2m = parseBlock('docs/sound-runtime-media-gate-2m-route-readiness-evaluator-plan.md', 'sound-runtime-media-gate-2m-route-readiness-evaluator-plan')

for (const entry of [plan, pathRegister, contentPlan, staticPlan, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2N decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr827.status === 'merged', 'PR #827 must be merged')
assert(plan.sourceVerification.pr827.mergeCommit === sourceHead, 'PR #827 merge commit mismatch')
assert(plan.sourceVerification.pr827.decision === ownerDecision, 'PR #827 decision mismatch')
assert(plan.sourceVerification.pr824.status === 'merged', 'PR #824 must be merged')
assert(plan.sourceVerification.pr824.mergeCommit === pr824MergeCommit, 'PR #824 merge commit mismatch')
assert(plan.sourceVerification.pr824.decision === gate2mDecision, 'PR #824 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2m.decision === gate2mDecision, 'Gate 2M decision mismatch')

assert(plan.sourceCreationPlan.futureEvaluatorSourcePath === plannedPath, 'planned path mismatch')
assert(plan.sourceCreationPlan.futureEvaluatorSourceCreationPlanned === true, 'future source creation plan missing')
assert(plan.sourceCreationPlan.actualEvaluatorSourceCreatedInGate2n === false, 'actual evaluator source must not be created')
assert(plan.sourceCreationPlan.futureOwnerReviewRequired === true, 'owner review requirement missing')
assert(plan.sourceCreationPlan.futureExplicitSourceCreationGateRequired === true, 'source creation gate requirement missing')
assert(plan.sourceCreationPlan.routeContractCount === 4, 'route count mismatch')
assert(plan.sourceCreationPlan.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.sourceCreationPlan.rejectedPayloadFieldCount === 14, 'rejected payload field count mismatch')
assert(plan.sourceCreationPlan.mismatchCaseCount === 5, 'mismatch case count mismatch')
for (const key of [
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
  'toolExecutionRun',
  'mediaProcessingRun',
  'dockerOrGcpRun',
  'supabaseOrSqlRun',
  'artifactCreated',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
]) {
  assert(plan.sourceCreationPlan[key] === false, `sourceCreationPlan.${key} must remain false`)
}

assert(pathRegister.approvedForPlanningOnly.futureEvaluatorSourcePath === plannedPath, 'path register mismatch')
assert(pathRegister.approvedForPlanningOnly.pathExistsToday === false, 'planned path must remain absent')
assert(!fs.existsSync(path.join(root, plannedPath)), 'planned evaluator source must not exist in Gate 2N')
assert(pathRegister.approvedForPlanningOnly.sourceCreatedToday === false, 'sourceCreatedToday must remain false')
assert(pathRegister.pathBoundaries.mayUseExistingSoundCpuDirectory === true, 'sound-cpu directory use planning missing')
for (const [key, value] of Object.entries(pathRegister.pathBoundaries)) {
  if (!['mayUseExistingSoundCpuDirectory', 'mayReferenceStaticFixtureContracts', 'mayReferenceGate2MShape', 'mayReferenceGate2NPlan'].includes(key)) {
    assert(value === false, `pathBoundaries.${key} must remain false`)
  }
}

assert(contentPlan.plannedSourceShape.moduleType === 'node_builtins_only_static_evaluator', 'module type mismatch')
assert(contentPlan.plannedSourceShape.futureExports.length === 2, 'future export count mismatch')
assert(contentPlan.plannedSourceShape.inputRecords.length === 8, 'input record count mismatch')
assert(contentPlan.plannedSourceShape.outputRecords.length === 5, 'output record count mismatch')
assert(contentPlan.plannedSourceShape.routeContractCount === 4, 'content route count mismatch')
for (const value of Object.values(contentPlan.prohibitedSourceShape)) {
  assert(value === true, 'prohibited source shape entries must be true')
}

assert(staticPlan.futureStaticValidation.validateApprovedPath === true, 'approved path validation missing')
assert(staticPlan.futureStaticValidation.validateNoReadinessWidening === true, 'readiness validation missing')
assert(staticPlan.currentGateValidation.diagnosticsOnly === true, 'current gate must be diagnostics-only')
for (const [key, value] of Object.entries(staticPlan.currentGateValidation)) {
  if (key !== 'diagnosticsOnly') {
    assert(value === false, `currentGateValidation.${key} must remain false`)
  }
}

assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.futureEvaluatorSourcePath === plannedPath, 'handoff path mismatch')
assert(handoff.acceptedInputs.routeContractCount === 4, 'handoff route count mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'accepted for execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_source_plan_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.futureEvaluatorSourceCreationPlanned === true, 'allowed source creation plan claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner review claim missing')
assert(policy.allowedClaims.futureExplicitSourceCreationGateRequired === true, 'allowed source gate claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2N decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2n:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2n-diagnostics.mjs', 'Gate 2N package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2n_diagnostics_passed',
  decision,
  sourceHead,
  pr827Verified: true,
  futureEvaluatorSourcePath: plan.sourceCreationPlan.futureEvaluatorSourcePath,
  futureEvaluatorSourceCreationPlanned: plan.sourceCreationPlan.futureEvaluatorSourceCreationPlanned,
  actualEvaluatorSourceCreatedInGate2n: plan.sourceCreationPlan.actualEvaluatorSourceCreatedInGate2n,
  routeContractCount: plan.sourceCreationPlan.routeContractCount,
  acceptedFixtureCount: plan.sourceCreationPlan.acceptedFixtureCount,
  rejectedPayloadFieldCount: plan.sourceCreationPlan.rejectedPayloadFieldCount,
  mismatchCaseCount: plan.sourceCreationPlan.mismatchCaseCount,
  routeResolverImported: plan.sourceCreationPlan.routeResolverImported,
  routeExecutionRun: plan.sourceCreationPlan.routeExecutionRun,
  workerExecutionRun: plan.sourceCreationPlan.workerExecutionRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
