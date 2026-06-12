import {
  buildModelOrchestrationQwenProviderDryRunRerunReports,
  writeModelOrchestrationQwenProviderDryRunRerunArtifacts,
} from '../activation/model-orchestration-provider-dry-run/qwen-provider-dry-run-rerun'

const reports = buildModelOrchestrationQwenProviderDryRunRerunReports()
await writeModelOrchestrationQwenProviderDryRunRerunArtifacts(reports)
console.log(JSON.stringify(reports.summary, null, 2))
