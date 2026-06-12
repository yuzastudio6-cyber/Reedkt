import {
  MODEL_ORCHESTRATION_AUDIT_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationAudit,
  readModelOrchestrationAuditSummary,
} from '../activation/model-orchestration-qwen-deepseek-audit'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_metadata_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_AUDIT_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationAudit({
  execute: true,
  metadataOnly: process.argv.includes('--metadata-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readModelOrchestrationAuditSummary(), null, 2))
process.exit(result.exitCode)
