import { buildProviderModelApprovalReport } from '../activation/provider-model-approval-policy'

const report = buildProviderModelApprovalReport()

assert(report.phase === 'PROVIDER-1', 'Phase must be PROVIDER-1.')
assert(report.evidence.some((entry) => entry.provider === 'deepseek' && entry.evidenceId.includes('deepseek')), 'DeepSeek official evidence must be present.')
assert(report.evidence.some((entry) => entry.provider === 'qwen' && entry.evidenceId.includes('qwen')), 'Qwen official evidence must be present.')
assert(report.roleApprovals.some((role) => role.providerModelIds.includes('deepseek-v4-pro')), 'DeepSeek V4-Pro approval must be present.')
assert(report.roleApprovals.some((role) => role.providerModelIds.includes('deepseek-v4-flash')), 'DeepSeek V4-Flash candidate must be present.')
assert(report.roleApprovals.some((role) => role.providerModelIds.includes('qwen3.7-max')), 'Qwen3.7-Max approval must be present.')
assert(report.roleApprovals.some((role) => role.providerModelIds.includes('qwen3.7-max-2026-06-08')), 'Qwen newest snapshot must be present.')
assert(report.roleApprovals.some((role) => role.providerModelIds.includes('qwen3.7-max-2026-05-20')), 'Qwen older snapshot must be present.')
assert(report.secretPolicy.secretManagerOnly, 'Provider secrets must be Secret Manager only.')
assert(report.secretPolicy.frontendExposureAllowed === false, 'Provider secrets must not be frontend-exposed.')
assert(report.secretPolicy.secretValuesResolvedInProvider1 === false, 'PROVIDER-1 must not resolve provider secret values.')
assert(report.dataPolicy.rawProviderPayloadStorageAllowed === false, 'Raw provider payload storage must be blocked.')
assert(report.dataPolicy.signedUrlSourceOfTruthAllowed === false, 'Signed URL source-of-truth must be blocked.')
assert(report.costPolicy.provider1BudgetUsd === 0, 'PROVIDER-1 budget must be zero.')
assert(report.costPolicy.providerCallsBlockedByDefault, 'Provider calls must be blocked by default.')
assert(report.costPolicy.liveValidationDefaults.maxCallsPerPhase === 1, 'Future live validation must default to one call.')
assert(report.costPolicy.liveValidationDefaults.retryLimit === 0, 'Future live validation retry limit must default to zero.')
assert(report.routingPolicy.qwenCanExecuteToolsOrWorkers === false, 'Qwen direct tool/worker execution must be false.')
assert(report.routingPolicy.deepSeekCanExecuteCodeOrTools === false, 'DeepSeek direct code/tool execution must be false.')
assert(report.routingPolicy.workerExecutionSource === 'approved_plan_snapshots_only', 'Workers must execute approved plan snapshots only.')
assert(report.storagePolicy.privateGcsOnly, 'Artifacts must remain private GCS only.')
assert(report.storagePolicy.publicArtifactsAllowed === false, 'Public artifacts must remain blocked.')
assert(report.nextPhasePlan.items.length === 5, 'PROVIDER-2 through PROVIDER-6 roadmap must be present.')
assert(report.crossChatOwnershipCheck.owner === 'PROVIDER_GATEWAY_MODELS', 'Ownership check must identify Provider Gateway Models.')
assert(report.commandPlan.noProviderCalls && report.commandPlan.noRuntimeExecution, 'Command plan must block provider/runtime execution.')
assert(report.qa.gates.length >= 11, 'QA gates must be present.')
assert(report.qa.gates.every((gate) => gate.passed), `QA gate failed: ${report.qa.gates.filter((gate) => !gate.passed).map((gate) => gate.gateId).join(', ')}`)
assert(report.provider2Readiness === 'ready_for_provider_fixture_adapters_normalizers' || report.provider2Readiness === 'blocked', 'PROVIDER-2 readiness must be valid.')

console.log('PROVIDER-1 provider model approval policy smoke passed.')

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
