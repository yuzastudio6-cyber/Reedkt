import {
  WORKER_RUNTIME_NOOP_DRY_RUN_REQUIRED_CONFIRMATIONS,
  executeWorkerRuntimeNoopDryRun,
  readWorkerRuntimeNoopDryRunSummary,
} from '../activation/worker-runtime-noop-dry-run'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: WORKER_RUNTIME_NOOP_DRY_RUN_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeWorkerRuntimeNoopDryRun({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readWorkerRuntimeNoopDryRunSummary(), null, 2))
process.exit(result.exitCode)
