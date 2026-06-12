import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationPlanSnapshotContract,
  readModelOrchestrationPlanSnapshotContractSummary,
} from '../activation/model-orchestration-plan-snapshot-contract'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_CONTRACT_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationPlanSnapshotContract({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
  reconcileProviderEvidence: process.argv.includes('--reconcile-provider-evidence'),
})

console.log(JSON.stringify(readModelOrchestrationPlanSnapshotContractSummary(), null, 2))
process.exit(result.exitCode)
