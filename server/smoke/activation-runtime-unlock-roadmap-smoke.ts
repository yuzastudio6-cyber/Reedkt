import { buildRuntimeUnlockReport } from '../activation/runtime-unlock-roadmap'

const report = buildRuntimeUnlockReport()

assert(report.ladder.stages.length === 10, 'Expected 10 unlock ladder stages.')
assert(report.ladder.stages[0]?.stageId === 'blocked', 'Unlock ladder must start at blocked.')
assert(report.ladder.stages.at(-1)?.stageId === 'production_candidate', 'Unlock ladder must end at production_candidate.')
assert(report.ownerAcceptanceMatrix.rows.length === 12, 'Owner matrix must cover 12 workstreams.')
assert(report.ownerRepoAuditPrompts.length === 12, 'Owner repo-audit prompts must cover 12 workstreams.')
assert(report.blockedScopePolicy.rawPromptExecutionPolicy === 'blocked_as_direct_execution_forever', 'Raw prompt execution must remain blocked forever.')
assert(report.blockedScopePolicy.signedUrlSourceOfTruthPolicy === 'blocked_forever', 'Signed URL source-of-truth must remain blocked forever.')
assert(report.ownerRepoAuditPrompts.every((prompt) => prompt.noImplementationUntilAudit), 'Owner repo-audit prompts must prohibit implementation.')
assert(report.ownerAcceptanceMatrix.rows.every((row) => row.supabaseUpdateClassification.sqlExecuted === false && row.supabaseUpdateClassification.migrationDeployed === false), 'Owner matrix must keep SQL/migration false.')
assert(report.commandPlan.noRuntimeExecution, 'Command plan must block runtime execution.')
assert(report.qa.gates.length >= 10, 'QA gates must be present.')
assert(report.qa.gates.every((gate) => gate.passed), `QA gate failed: ${report.qa.gates.filter((gate) => !gate.passed).map((gate) => gate.gateId).join(', ')}`)
assert(report.phase53BReadiness === 'blocked' || report.phase53BReadiness === 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits', 'Phase53B readiness must be valid.')

console.log('Phase 53A runtime unlock roadmap smoke passed.')

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
