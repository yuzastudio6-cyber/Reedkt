import { buildProviderModelsAuditReport } from '../activation/provider-gateway-models-audit'

const report = buildProviderModelsAuditReport()

assert(report.phase === 'PROVIDER-0', 'Phase must be PROVIDER-0.')
assert(report.evidence.some((entry) => entry.provider === 'deepseek' && entry.sourceType === 'official_docs'), 'DeepSeek official evidence must be present.')
assert(report.evidence.some((entry) => entry.provider === 'qwen' && entry.sourceType === 'official_docs'), 'Qwen official evidence must be present.')
assert(report.modelDecisions.some((model) => model.internalModelName === 'qwen_3_7_max' && model.providerModelId === 'qwen3.7-max'), 'Qwen model decision must target qwen3.7-max.')
assert(report.modelDecisions.some((model) => model.internalModelName === 'deepseek_v4_pro' && model.providerModelId === 'deepseek-v4-pro'), 'DeepSeek V4 Pro decision must be present.')
assert(report.modelDecisions.some((model) => model.internalModelName === 'deepseek_v4_flash' && model.providerModelId === 'deepseek-v4-flash'), 'DeepSeek V4 Flash decision must be present.')
assert(report.secretPolicy.frontendExposureAllowed === false, 'Provider secrets must not be frontend-exposed.')
assert(report.secretPolicy.secretValuesResolvedInProvider0 === false, 'PROVIDER-0 must not resolve provider secret values.')
assert(report.dataPolicy.rawProviderResponseStorageAllowed === false, 'Raw provider response storage must be blocked.')
assert(report.dataPolicy.signedUrlSourceOfTruthAllowed === false, 'Signed URL source-of-truth must be blocked.')
assert(report.costPolicy.providerBudgetsDefaultToZero, 'Provider budgets must default to zero.')
assert(report.costPolicy.providerCallsBlockedByDefault, 'Provider calls must be blocked by default.')
assert(report.executionPolicy.deepSeekCanDirectlyExecuteCode === false, 'DeepSeek direct code execution must be false.')
assert(report.executionPolicy.qwenCanDirectlyExecuteWorkersOrTools === false, 'Qwen direct worker/tool execution must be false.')
assert(report.executionPolicy.toolCallsAreModelOutputOnly, 'Provider tool calls must be treated as model output only.')
assert(report.phaseRoadmap.items.length >= 8, 'Phase roadmap must include PROVIDER-0 through PROVIDER-7+.')
assert(report.answers.length === 14, 'The audit must answer all 14 provider questions.')
assert(report.commandPlan.noProviderCalls && report.commandPlan.noRuntimeExecution, 'Command plan must block provider/runtime execution.')
assert(report.qa.gates.length >= 10, 'QA gates must be present.')
assert(report.qa.gates.every((gate) => gate.passed), `QA gate failed: ${report.qa.gates.filter((gate) => !gate.passed).map((gate) => gate.gateId).join(', ')}`)
assert(report.provider1Readiness === 'ready_for_provider_registry_secret_metadata_fixture' || report.provider1Readiness === 'blocked', 'PROVIDER-1 readiness must be valid.')

console.log('PROVIDER-0 provider gateway models audit smoke passed.')

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
