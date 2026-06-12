import {
  buildModelOrchestrationProviderDryRunReports,
  writeModelOrchestrationProviderDryRunArtifacts,
} from '../activation/model-orchestration-provider-dry-run'

const reports = buildModelOrchestrationProviderDryRunReports()
await writeModelOrchestrationProviderDryRunArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
