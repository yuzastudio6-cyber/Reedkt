import {
  buildModelOrchestrationQwenDeepseekSecretSetupReports,
  writeModelOrchestrationQwenDeepseekSecretSetupArtifacts,
} from '../activation/model-orchestration-provider-dry-run/qwen-deepseek-secret-setup'

const reports = buildModelOrchestrationQwenDeepseekSecretSetupReports()
await writeModelOrchestrationQwenDeepseekSecretSetupArtifacts(reports)
console.log(JSON.stringify(reports.qwenSecretSetupSummary, null, 2))
