import {
  buildModelOrchestrationPlanSnapshotContractReports,
  writeModelOrchestrationPlanSnapshotContractArtifacts,
} from '../activation/model-orchestration-plan-snapshot-contract'

const reports = buildModelOrchestrationPlanSnapshotContractReports()
await writeModelOrchestrationPlanSnapshotContractArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
