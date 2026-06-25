import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2y_controlled_server_route_execution_proof_plan_completed_with_warnings_ready_for_route_execution_plan_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_controlled_route_resolver_import_proof_owner_review_passed_with_warnings_ready_for_route_execution_proof_plan'
const gate2xDecision = 'sound_runtime_media_gate_2x_controlled_route_resolver_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceHead = '0628ba934c88dc498552ae72fd1ac7a56c637c23'

const docs = [
  'docs/sound-runtime-media-gate-2y-controlled-server-route-execution-proof-plan.md',
  'docs/sound-runtime-media-gate-2y-server-route-proof-scope-register.md',
  'docs/sound-runtime-media-gate-2y-server-route-preflight-checklist.md',
  'docs/sound-runtime-media-gate-2y-proposed-command-register.md',
  'docs/sound-runtime-media-gate-2y-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2y-runtime-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const plan = parsed['docs/sound-runtime-media-gate-2y-controlled-server-route-execution-proof-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr888.status === 'merged', 'PR #888 merge evidence missing')
assert(plan.sourceVerification.pr888.mergeCommit === sourceHead, 'PR #888 merge commit mismatch')
assert(plan.sourceVerification.pr888.decision === ownerDecision, 'PR #888 decision mismatch')
assert(plan.sourceVerification.pr884.status === 'merged', 'PR #884 merge evidence missing')
assert(plan.sourceVerification.pr884.decision === gate2xDecision, 'PR #884 decision mismatch')
assert(plan.planningMode === 'controlled_server_route_execution_proof_plan_only', 'planning mode mismatch')
assert(plan.targetSource.routeIndexPath === 'server/workers/sound-cpu/index.ts', 'route index path mismatch')
assert(plan.targetSource.routeDecisionPath === 'server/workers/sound-cpu/synthetic-route-decision.ts', 'route decision path mismatch')
assert(plan.plannedProofSurface.plannedResolverExport === 'resolveSoundCpuSyntheticRoute', 'resolver export mismatch')
assert(plan.plannedProofSurface.acceptedJobTypeCount === 4, 'job type count mismatch')
assert(plan.plannedProofSurface.minimumPlannedFixtureCount === 9, 'planned fixture count mismatch')
assert(plan.gate2yActions.planCreated === true, 'plan created flag missing')
assert(plan.gate2yActions.sourceImported === false, 'Gate 2Y must not import source')
assert(plan.gate2yActions.serverRouteExecuted === false, 'Gate 2Y must not execute server routes')
assert(plan.gate2yActions.resolverInvoked === false, 'Gate 2Y must not invoke resolver')
assert(plan.gate2yActions.routeReadinessClaimed === false, 'Gate 2Y must not claim readiness')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'owner-review source decision mismatch')
assert(ownerReview.sourceVerification.sourceHead === 'e1da4e59538364768598fe86c0c278ca8beddb7d', 'owner-review source head mismatch')
assert(ownerReview.sourceVerification.pr884.mergeCommit === 'e1da4e59538364768598fe86c0c278ca8beddb7d', 'owner-review PR #884 source mismatch')
assert(ownerReview.ownerReviewResult.routeExecutionProofPlanMayProceed === true, 'owner review did not allow proof planning')
assert(ownerReview.ownerReviewResult.serverRouteExecutedToday === false, 'owner review must not execute route')

const gate2x = parseJsonBlock('docs/sound-runtime-media-gate-2x-controlled-route-resolver-import-proof-result.md')
assert(gate2x.decision === gate2xDecision, 'Gate 2X decision mismatch')
assert(gate2x.controlledImportProof.proofStatus === 'passed', 'Gate 2X import proof must pass')
assert(gate2x.controlledImportProof.imported === true, 'Gate 2X import proof missing')
assert(gate2x.controlledImportProof.functionInvoked === false, 'Gate 2X function must not be invoked')
assert(gate2x.controlledImportProof.serverRouteExecuted === false, 'Gate 2X server route must not execute')
assert(gate2x.controlledImportProof.routeReadinessClaimed === false, 'Gate 2X readiness must remain false')

const scope = parsed['docs/sound-runtime-media-gate-2y-server-route-proof-scope-register.md']
assert(scope.allowedInGate2y.includes('docs_only_route_execution_proof_plan'), 'docs-only scope missing')
for (const value of Object.values(scope.notAllowedInGate2y)) {
  assert(value === true, 'notAllowedInGate2y entries must remain true')
}
assert(scope.futureGateProofBoundaries.mayUseStaticInMemoryPayloadsOnlyAfterOwnerReview === true, 'future static payload boundary missing')
assert(scope.currentGateExecutionState.serverRouteExecuted === false, 'scope route execution must be false')
assert(scope.currentGateExecutionState.resolverInvoked === false, 'scope resolver invocation must be false')

const preflight = parsed['docs/sound-runtime-media-gate-2y-server-route-preflight-checklist.md']
assert(
  preflight.requiredBeforeFutureExecutionProof.ownerReviewDecisionRequired ===
    'worker_runtime_jobs_sound_cpu_server_route_execution_proof_plan_owner_review_passed_with_warnings_ready_for_controlled_server_route_execution_proof',
  'future owner review decision mismatch'
)
assert(preflight.requiredBeforeFutureExecutionProof.cleanWorktreeRequired === true, 'clean worktree preflight missing')
assert(preflight.futureProofStopConditions.includes('dependency_hydration_unavailable'), 'dependency hydration stop condition missing')
assert(preflight.gate2yPreflightResult.futureExecutionAuthorizedInThisGate === false, 'Gate 2Y must not authorize execution')
for (const value of Object.values(preflight.futureProofExpectedFalseFlags)) {
  assert(value === false, 'future proof false flags must be false')
}

const commands = parsed['docs/sound-runtime-media-gate-2y-proposed-command-register.md']
assert(Array.isArray(commands.commandsExecutedInGate2y) && commands.commandsExecutedInGate2y.length === 0, 'Gate 2Y must execute no commands')
assert(commands.proposedNotExecutedCommands[0].mustRemainBlockedInGate2y === true, 'future command must remain blocked in Gate 2Y')
assert(commands.futureRunnerRequirements.mustNotDispatchWorkers === true, 'future runner must not dispatch workers')
assert(commands.futureRunnerRequirements.mustNotTouchSupabaseOrSql === true, 'future runner must not touch Supabase/SQL')
assert(commands.gate2yCommandResult.futureCommandRun === false, 'future command must not run in Gate 2Y')
assert(commands.gate2yCommandResult.serverRouteExecuted === false, 'command register route execution must be false')

const blockers = parsed['docs/sound-runtime-media-gate-2y-blocker-follow-up-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'controlled_server_route_execution_proof_plan_pending'), 'resolved plan blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_execution_plan_owner_review_pending'), 'owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_server_route_execution_proof_not_run'), 'proof-not-run blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/sound-runtime-media-gate-2y-runtime-claim-policy.md']
assert(policy.allowedClaims.serverRouteExecutionProofPlanCreated === true, 'plan-created claim missing')
assert(policy.allowedClaims.routeExecutionPlanOwnerReviewMayProceed === true, 'owner review may proceed claim missing')
assert(policy.allowedClaims.serverRouteExecuted === false, 'server route execution claim must be false')
assert(policy.allowedClaims.resolverInvoked === false, 'resolver invocation claim must be false')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'readiness claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner prompt must require Gate 2Y decision')
assert(ownerPrompt.includes('must not execute server routes'), 'owner prompt must block route execution')
assert(ownerPrompt.includes('SOUND-RUNTIME-MEDIA-GATE-2Z'), 'owner prompt must name Gate 2Z next prompt')
assert(ownerPrompt.includes('no worker/media/Supabase execution'), 'owner prompt must preserve bounded scope')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2y:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2y-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2y_diagnostics_passed',
  decision,
  sourceHead,
  serverRouteExecutionProofPlanCreated: true,
  serverRouteExecuted: false,
  resolverInvoked: false,
  routeReadinessClaimed: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-SERVER-ROUTE-EXECUTION-PROOF-PLAN-OWNER-REVIEW: review controlled route execution proof plan, no execution'
}, null, 2))
