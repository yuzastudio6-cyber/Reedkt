import {
  buildModelOrchestrationPlanSnapshotDryRunReports,
  writeModelOrchestrationPlanSnapshotDryRunArtifacts,
} from '../activation/model-orchestration-plan-snapshot-dry-run'

const reports = buildModelOrchestrationPlanSnapshotDryRunReports()
await writeModelOrchestrationPlanSnapshotDryRunArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
