import {
  buildModelOrchestrationPlanSnapshotContractReadyReports,
  writeModelOrchestrationPlanSnapshotContractReadyArtifacts,
} from '../activation/model-orchestration-plan-snapshot-contract/contract-ready'

const reports = buildModelOrchestrationPlanSnapshotContractReadyReports()
await writeModelOrchestrationPlanSnapshotContractReadyArtifacts(reports)
console.log(JSON.stringify(reports.summary, null, 2))
