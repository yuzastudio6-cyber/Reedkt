import {
  buildModelOrchestrationProviderDryRunFixReports,
  writeModelOrchestrationProviderDryRunFixArtifacts,
} from '../activation/model-orchestration-provider-dry-run/provider-dry-run-fix'

const reports = buildModelOrchestrationProviderDryRunFixReports()
await writeModelOrchestrationProviderDryRunFixArtifacts(reports)
console.log(JSON.stringify(reports.qwenProviderFixSummary, null, 2))
