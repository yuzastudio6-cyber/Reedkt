import {
  WORKER_RUNTIME_REPO_AUDIT_REQUIRED_CONFIRMATIONS,
  executeWorkerRuntimeRepoAudit,
  readWorkerRuntimeRepoAuditSummary,
} from '../activation/worker-runtime-repo-audit'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: WORKER_RUNTIME_REPO_AUDIT_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeWorkerRuntimeRepoAudit({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readWorkerRuntimeRepoAuditSummary(), null, 2))
process.exit(result.exitCode)
