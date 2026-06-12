import {
  WORKER_RUNTIME_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS,
  executeWorkerRuntimeDryRunApproval,
  readWorkerRuntimeDryRunApprovalSummary,
} from '../activation/worker-runtime-dry-run-approval'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: WORKER_RUNTIME_DRY_RUN_APPROVAL_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeWorkerRuntimeDryRunApproval({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readWorkerRuntimeDryRunApprovalSummary(), null, 2))
process.exit(result.exitCode)
