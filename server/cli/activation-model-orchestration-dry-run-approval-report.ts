import {
  buildModelOrchestrationDryRunApprovalReports,
  writeModelOrchestrationDryRunApprovalArtifacts,
} from '../activation/model-orchestration-dry-run-approval'

const reports = buildModelOrchestrationDryRunApprovalReports()
await writeModelOrchestrationDryRunApprovalArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
