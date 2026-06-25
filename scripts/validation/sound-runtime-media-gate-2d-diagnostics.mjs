#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const decision = 'sound_runtime_media_gate_2d_synthetic_worker_route_source_plan_completed_with_warnings_ready_for_source_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_route_proof_owner_review_passed_with_warnings_ready_for_synthetic_route_source_plan'
const gate2cDecision = 'sound_runtime_media_gate_2c_controlled_synthetic_worker_route_proof_passed_with_warnings_ready_for_route_proof_owner_review'

const docs = [
  ['docs/sound-runtime-media-gate-2d-synthetic-worker-route-source-plan.md', 'sound-runtime-media-gate-2d-synthetic-worker-route-source-plan'],
  ['docs/sound-runtime-media-gate-2d-source-path-register.md', 'sound-runtime-media-gate-2d-source-path-register'],
  ['docs/sound-runtime-media-gate-2d-route-contract-source-map.md', 'sound-runtime-media-gate-2d-route-contract-source-map'],
  ['docs/sound-runtime-media-gate-2d-fail-closed-source-policy.md', 'sound-runtime-media-gate-2d-fail-closed-source-policy'],
  ['docs/sound-runtime-media-gate-2d-source-creation-blocker-register.md', 'sound-runtime-media-gate-2d-source-creation-blocker-register'],
  ['docs/sound-runtime-media-gate-2d-runtime-claim-policy.md', 'sound-runtime-media-gate-2d-runtime-claim-policy'],
]

const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

const proposedSourcePaths = [
  'server/workers/sound-cpu/synthetic-route-types.ts',
  'server/workers/sound-cpu/synthetic-route-decision.ts',
  'server/workers/sound-cpu/index.ts',
]

const forbiddenClaimPatterns = [
  /actualRouteSourceCreated\s*[:=]\s*(true|passed|ready)/i,
  /workerExecutionApproved\s*[:=]\s*(false|no|none)/i,
  /routeExecutionApproved\s*[:=]\s*(false|no|none)/i,
  /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
  /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
  /externalBetaAllowed\s*[:=]\s*true/i,
  /paidProductionAllowed\s*[:=]\s*true/i,
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

const plan = parseBlock(docs[0][0], docs[0][1])
const paths = parseBlock(docs[1][0], docs[1][1])
const contracts = parseBlock(docs[2][0], docs[2][1])
const failClosed = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-proof-owner-review')
const gate2c = parseBlock('docs/sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result.md', 'sound-runtime-media-gate-2c-controlled-synthetic-worker-route-proof-result')

assert(plan.decision === decision, 'Gate 2D plan decision mismatch')
assert(paths.decision === decision, 'Gate 2D path decision mismatch')
assert(contracts.decision === decision, 'Gate 2D contract decision mismatch')
assert(failClosed.decision === decision, 'Gate 2D fail-closed decision mismatch')
assert(blockers.decision === decision, 'Gate 2D blocker decision mismatch')
assert(policy.decision === decision, 'Gate 2D claim policy decision mismatch')
assert(plan.sourceVerification.pr756.status === 'merged', 'PR #756 must be merged')
assert(plan.sourceVerification.pr756.decision === ownerDecision, 'PR #756 decision mismatch')
assert(plan.sourceVerification.pr752.decision === gate2cDecision, 'PR #752 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'route proof owner-review source decision mismatch')
assert(gate2c.decision === gate2cDecision, 'Gate 2C source decision mismatch')
assert(gate2c.proofResult.routeDecisionProofRun === true, 'Gate 2C route proof must have run')
assert(gate2c.proofResult.routeDecisionCount === 4, 'Gate 2C route decision count mismatch')
assert(gate2c.proofResult.workerExecutionRun === false, 'Gate 2C worker execution must not run')

for (const jobType of expectedJobTypes) {
  assert(plan.planSurface.jobTypes.includes(jobType), `missing plan job type ${jobType}`)
  assert(contracts.routeContracts.some((row) => row.jobType === jobType), `missing contract job type ${jobType}`)
}

for (const proposedPath of proposedSourcePaths) {
  assert(paths.proposedFutureSourcePaths.some((row) => row.path === proposedPath && row.createdInGate2d === false), `missing proposed source path ${proposedPath}`)
  assert(!fs.existsSync(path.join(repoRoot, proposedPath)), `Gate 2D must not create proposed source path ${proposedPath}`)
}

assert(paths.actualSourceCreated === false, 'actual source must not be created')
assert(paths.publicRouteCreated === false, 'public route must not be created')
assert(paths.workerImplementationCreated === false, 'worker implementation must not be created')
assert(plan.planSurface.proposedSourceCreated === false, 'plan must not create source')
assert(plan.planSurface.workerExecutionRun === false, 'worker execution must not run')
assert(plan.planSurface.routeExecutionRun === false, 'route execution must not run')
assert(plan.planSurface.toolExecutionRun === false, 'tool execution must not run')
assert(plan.planSurface.mediaProcessingRun === false, 'media processing must not run')
assert(contracts.routeContracts.length === 4, 'route contract count mismatch')
assert(contracts.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')

for (const field of ['rawPrompt', 'uploadedMediaUri', 'signedUrl', 'publicArtifactUrl', 'mediaFilePath', 'providerOutputBlob', 'secretValue', 'serviceRolePayload', 'modelWeightPath', 'artifactWriteTarget', 'supabaseMutation', 'sqlText', 'dockerCommand', 'gcpCommand']) {
  assert(failClosed.requiredRejectedPayloadFields.includes(field), `missing rejected field ${field}`)
}

for (const [flag, value] of Object.entries(failClosed.requiredRuntimeFlags)) {
  assert(value === false, `runtime flag must stay false: ${flag}`)
}

assert(blockers.blockers.some((row) => row.blockerId === 'source_owner_review_not_complete' && row.status === 'next'), 'source owner review blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_route_execution_not_approved' && row.status === 'blocked'), 'route execution blocker missing')
assert(policy.allowedClaims.syntheticRouteSourcePlanCreated === true, 'allowed planning claim missing')
assert(policy.forbiddenClaims.actualRouteSourceCreated === true, 'actual source creation must remain forbidden')
assert(policy.forbiddenClaims.workerExecutionApproved === true, 'worker execution must remain forbidden')
assert(policy.forbiddenClaims.routeExecutionApproved === true, 'route execution must remain forbidden')
assert(policy.forbiddenClaims.internalBetaUnlock === true, 'internal beta unlock must remain forbidden')
assert(policy.forbiddenClaims.externalBetaUnlock === true, 'external beta unlock must remain forbidden')
assert(policy.forbiddenClaims.productionUnlock === true, 'production unlock must remain forbidden')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-source-owner-review.md')
assert(ownerPrompt.includes(decision), 'source owner-review prompt must require Gate 2D decision')
const gate2ePrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2e-actual-synthetic-worker-route-source.md')
assert(gate2ePrompt.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-SYNTHETIC-ROUTE-SOURCE-OWNER-REVIEW'), 'Gate 2E prompt must require source owner review')

for (const [relativePath] of docs) {
  const text = read(relativePath)
  for (const pattern of forbiddenClaimPatterns) {
    assert(!pattern.test(text), `unsafe readiness/source claim in ${relativePath}: ${pattern}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2d:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2d-diagnostics.mjs',
  'package script missing for Gate 2D diagnostics',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2d_diagnostics_passed',
  decision,
  sourceHead: plan.sourceVerification.sourceHead,
  pr756Verified: plan.sourceVerification.pr756.status === 'merged',
  proposedSourceCreated: plan.planSurface.proposedSourceCreated,
  proposedSourcePathCount: paths.proposedFutureSourcePaths.length,
  routeContractCount: contracts.routeContracts.length,
  rejectedPayloadFieldCount: contracts.rejectedPayloadFieldCount,
  workerExecutionRun: plan.planSurface.workerExecutionRun,
  routeExecutionRun: plan.planSurface.routeExecutionRun,
  mediaProcessingRun: plan.planSurface.mediaProcessingRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
