import {
  buildControlledRealVideoOcrExecutionEvidenceReport,
  summarizeControlledRealVideoOcrExecutionEvidenceReport,
} from '../activation/controlled-real-video-ocr-safe-zone'

const report = buildControlledRealVideoOcrExecutionEvidenceReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeControlledRealVideoOcrExecutionEvidenceReport(report))
