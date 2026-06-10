import { buildProviderModelsAuditReport } from '../activation/provider-gateway-models-audit'

const report = buildProviderModelsAuditReport()
console.log('Provider gateway models summary')
console.log(`Phase: ${report.phase}`)
console.log(`Status: ${report.status}`)
console.log(`Official evidence entries: ${report.evidence.length}`)
console.log(`Qwen target: ${report.modelDecisions.find((model) => model.internalModelName === 'qwen_3_7_max')?.providerModelId}`)
console.log(`DeepSeek targets: ${report.modelDecisions.filter((model) => model.internalModelName.startsWith('deepseek')).map((model) => model.providerModelId).join(', ')}`)
console.log(`Provider calls: ${report.repoAudit.realProviderCallsBlocked ? 'blocked' : 'not blocked'}`)
console.log(`DeepSeek direct code execution: ${report.executionPolicy.deepSeekCanDirectlyExecuteCode ? 'allowed' : 'blocked'}`)
console.log(`Qwen direct worker/tool execution: ${report.executionPolicy.qwenCanDirectlyExecuteWorkersOrTools ? 'allowed' : 'blocked'}`)
console.log(`PROVIDER-1 readiness: ${report.provider1Readiness}`)
console.log(`Supabase milestone sync: ${report.supabaseSyncResult.status}`)
