import {
  WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS,
  executeWorkerRuntimeNoopDryRunExecution,
  readWorkerRuntimeNoopDryRunExecutionSummary,
} from '../activation/worker-runtime-noop-dry-run-execution'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_metadata_only_synthetic_only_flags_and_confirmations',
    requiredConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_EXECUTION_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeWorkerRuntimeNoopDryRunExecution({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  syntheticOnly: process.argv.includes('--synthetic-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readWorkerRuntimeNoopDryRunExecutionSummary(), null, 2))
process.exit(result.exitCode)
