import {
  MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationQwenAuthRepair,
  readModelOrchestrationQwenAuthRepairSummary,
} from '../activation/model-orchestration-qwen-auth-repair'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_synthetic_only_flag_and_qwen_repair_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_QWEN_AUTH_REPAIR_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationQwenAuthRepair({
  execute: true,
  syntheticOnly: process.argv.includes('--synthetic-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readModelOrchestrationQwenAuthRepairSummary(), null, 2))
process.exit(result.exitCode)
