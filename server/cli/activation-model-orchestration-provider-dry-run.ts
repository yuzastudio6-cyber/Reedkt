import {
  MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS,
  executeModelOrchestrationProviderDryRun,
  readModelOrchestrationProviderDryRunSummary,
} from '../activation/model-orchestration-provider-dry-run'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_synthetic_only_flag_and_provider_confirmations',
    requiredConfirmations: MODEL_ORCHESTRATION_PROVIDER_DRY_RUN_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeModelOrchestrationProviderDryRun({
  execute: true,
  syntheticOnly: process.argv.includes('--synthetic-only'),
  keepTemp: process.argv.includes('--keep-temp'),
})

console.log(JSON.stringify(readModelOrchestrationProviderDryRunSummary(), null, 2))
process.exit(result.exitCode)
