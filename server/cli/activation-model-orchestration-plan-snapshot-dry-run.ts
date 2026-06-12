import {
  MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationPlanSnapshotDryRun,
  readModelOrchestrationPlanSnapshotDryRunSummary,
} from '../activation/model-orchestration-plan-snapshot-dry-run'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_PLAN_SNAPSHOT_DRY_RUN_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationPlanSnapshotDryRun({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readModelOrchestrationPlanSnapshotDryRunSummary(), null, 2))
process.exit(result.exitCode)
