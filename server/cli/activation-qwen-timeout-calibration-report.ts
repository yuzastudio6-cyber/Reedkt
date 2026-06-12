import {
  buildQwenTimeoutCalibrationReports,
  writeQwenTimeoutCalibrationArtifacts,
} from '../activation/model-orchestration-qwen-timeout-calibration'

const reports = buildQwenTimeoutCalibrationReports()
await writeQwenTimeoutCalibrationArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
