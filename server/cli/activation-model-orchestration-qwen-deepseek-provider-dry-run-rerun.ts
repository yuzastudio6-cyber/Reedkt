import {
  MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationQwenProviderDryRunRerun,
  readModelOrchestrationQwenProviderDryRunRerunSummary,
} from '../activation/model-orchestration-provider-dry-run/qwen-provider-dry-run-rerun'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_synthetic_only_flag_and_qwen_provider_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_QWEN_PROVIDER_DRY_RUN_RERUN_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationQwenProviderDryRunRerun({
  execute: true,
  syntheticOnly: process.argv.includes('--synthetic-only'),
})

console.log(JSON.stringify(readModelOrchestrationQwenProviderDryRunRerunSummary(), null, 2))
process.exit(result.exitCode)
