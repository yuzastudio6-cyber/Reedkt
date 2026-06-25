#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_synthetic_route_source_owner_review_passed_with_warnings_ready_for_actual_synthetic_route_source_gate'
const gate2dDecision = 'sound_runtime_media_gate_2d_synthetic_worker_route_source_plan_completed_with_warnings_ready_for_source_owner_review'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-path-approval-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-path-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-beta-boundary-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-beta-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-claim-policy'],
]

const approvedPaths = [
  'server/workers/sound-cpu/synthetic-route-types.ts',
  'server/workers/sound-cpu/synthetic-route-decision.ts',
  'server/workers/sound-cpu/index.ts',
]

const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json ' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

for (const [relativePath, label] of docs) {
  assert(fs.existsSync(path.join(repoRoot, relativePath)), `missing doc ${relativePath}`)
  parseBlock(relativePath, label)
}

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const paths = parseBlock(docs[2][0], docs[2][1])
const beta = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2d = parseBlock('docs/sound-runtime-media-gate-2d-synthetic-worker-route-source-plan.md', 'sound-runtime-media-gate-2d-synthetic-worker-route-source-plan')
const gate2dPaths = parseBlock('docs/sound-runtime-media-gate-2d-source-path-register.md', 'sound-runtime-media-gate-2d-source-path-register')
const gate2dContracts = parseBlock('docs/sound-runtime-media-gate-2d-route-contract-source-map.md', 'sound-runtime-media-gate-2d-route-contract-source-map')
const gate2eResultPath = 'docs/sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result.md'
const gate2eResult = fs.existsSync(path.join(repoRoot, gate2eResultPath))
  ? parseBlock(gate2eResultPath, 'sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result')
  : undefined

assert(review.decision === decision, 'owner review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(paths.decision === decision, 'path approval decision mismatch')
assert(beta.decision === decision, 'beta boundary decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'claim policy decision mismatch')
assert(review.sourceVerification.pr760.status === 'merged', 'PR #760 must be merged')
assert(review.sourceVerification.pr760.decision === gate2dDecision, 'PR #760 decision mismatch')
assert(gate2d.decision === gate2dDecision, 'Gate 2D source decision mismatch')
assert(gate2d.planSurface.proposedSourceCreated === false, 'Gate 2D must not have created source')
assert(gate2dPaths.actualSourceCreated === false, 'Gate 2D actual source must be false')
assert(gate2dContracts.routeContracts.length === 4, 'Gate 2D route contract count mismatch')

for (const approvedPath of approvedPaths) {
  assert(acceptance.acceptedFutureSourcePaths.includes(approvedPath), `missing accepted path ${approvedPath}`)
  assert(paths.pathApprovals.some((row) => row.path === approvedPath && row.approvedForFutureGate2e === true && row.createdNow === false), `missing path approval ${approvedPath}`)
  const sourceExists = fs.existsSync(path.join(repoRoot, approvedPath))
  if (gate2eResult) {
    assert(gate2eResult.actualSourceCreated === true, 'Gate 2E result must document source creation')
    assert(gate2eResult.sourceFileCount === 3, 'Gate 2E source file count mismatch')
    assert(sourceExists, `Gate 2E source path missing after approved creation ${approvedPath}`)
  } else {
    assert(!sourceExists, `owner review must not create source path ${approvedPath}`)
  }
}

for (const jobType of expectedJobTypes) {
  assert(acceptance.acceptedJobTypes.includes(jobType), `missing accepted job type ${jobType}`)
  assert(gate2d.planSurface.jobTypes.includes(jobType), `Gate 2D missing job type ${jobType}`)
}

assert(review.ownerReviewResult.sourcePlanAcceptedForFutureGate2e === true, 'source plan must be accepted for Gate 2E')
assert(review.ownerReviewResult.proposedSourcePathCount === 3, 'proposed source path count mismatch')
assert(review.ownerReviewResult.routeContractCount === 4, 'route contract count mismatch')
assert(review.ownerReviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.ownerReviewResult.actualSourceCreatedToday === false, 'actual source must not be created today')
assert(review.ownerReviewResult.executionApprovedToday === false, 'execution must not be approved today')
assert(acceptance.acceptedForActualSourceCreationGate === true, 'actual source gate must be accepted')
assert(acceptance.acceptedForExecutionToday === 'none', 'execution must not be accepted today')
assert(paths.publicRoutePathApproved === false, 'public route path must not be approved')
assert(paths.serverRoutePathApproved === false, 'server route path must not be approved')
assert(paths.runtimeWorkerImplementationApproved === false, 'runtime worker implementation must not be approved')
assert(beta.betaBoundary.actualSyntheticRouteSourceGateMayProceed === true, 'Gate 2E must be allowed to proceed')
assert(beta.betaBoundary.controlledSyntheticRouteExecutionMayProceed === false, 'route execution must remain blocked')
assert(beta.betaBoundary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(beta.betaBoundary.externalBetaAllowed === false, 'external beta must remain blocked')
assert(beta.betaBoundary.paidProductionAllowed === false, 'production must remain blocked')
assert(blockers.blockers.some((row) => row.blockerId === 'actual_source_not_created' && row.status === 'next'), 'actual source next blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_route_execution_not_approved' && row.status === 'blocked'), 'route execution blocker missing')
assert(policy.allowedClaims.gate2dSourcePlanAcceptedForFutureGate2e === true, 'allowed Gate 2D acceptance claim missing')
assert(policy.forbiddenClaims.actualRouteSourceCreated === true, 'actual source creation must remain forbidden')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApproved === true, 'route execution must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const gate2ePrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2e-actual-synthetic-worker-route-source.md')
assert(gate2ePrompt.includes(decision), 'Gate 2E prompt must require owner-review decision')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-synthetic-route-source-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-review-diagnostics.mjs',
  'package script missing for source owner-review diagnostics',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_synthetic_route_source_owner_review_diagnostics_passed',
  decision,
  sourceHead: review.sourceVerification.sourceHead,
  pr760Verified: review.sourceVerification.pr760.status === 'merged',
  acceptedForActualSourceCreationGate: acceptance.acceptedForActualSourceCreationGate,
  sourceFilesCreatedToday: review.acceptedForToday.sourceFilesCreated,
  routeContractCount: review.ownerReviewResult.routeContractCount,
  rejectedPayloadFieldCount: review.ownerReviewResult.rejectedPayloadFieldCount,
  workerExecutionAcceptedToday: review.acceptedForToday.workerExecution,
  routeExecutionAcceptedToday: review.acceptedForToday.routeExecution,
  nextPrompt: review.nextPrompt,
}, null, 2))
