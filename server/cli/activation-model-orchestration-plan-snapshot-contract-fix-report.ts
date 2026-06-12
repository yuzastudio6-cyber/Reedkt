import {
  buildModelOrchestrationPlanSnapshotContractFixReports,
  writeModelOrchestrationPlanSnapshotContractFixArtifacts,
} from '../activation/model-orchestration-plan-snapshot-contract/contract-fix'

const reports = buildModelOrchestrationPlanSnapshotContractFixReports()
await writeModelOrchestrationPlanSnapshotContractFixArtifacts(reports)
console.log(JSON.stringify(reports.summary, null, 2))
