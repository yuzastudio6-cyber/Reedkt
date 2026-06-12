import {
  QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS,
  executeQwenTimeoutCalibration,
  readQwenTimeoutCalibrationSummary,
} from '../activation/model-orchestration-qwen-timeout-calibration'

if (!process.argv.includes('--execute')) {
  console.log(JSON.stringify({
    status: 'skipped',
    reason: 'execution_requires_explicit_execute_flag_and_qwen_timeout_calibration_confirmation',
    requiredConfirmations: QWEN_TIMEOUT_REQUIRED_CONFIRMATIONS,
  }, null, 2))
  process.exit(0)
}

const result = await executeQwenTimeoutCalibration({ execute: true })
console.log(JSON.stringify(readQwenTimeoutCalibrationSummary(), null, 2))
process.exit(result.exitCode)
