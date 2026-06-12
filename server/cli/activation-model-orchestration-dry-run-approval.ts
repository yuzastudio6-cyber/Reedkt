import {
  MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationDryRunApproval,
  readModelOrchestrationDryRunApprovalSummary,
} from '../activation/model-orchestration-dry-run-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationDryRunApproval({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readModelOrchestrationDryRunApprovalSummary(), null, 2))
process.exit(result.exitCode)
