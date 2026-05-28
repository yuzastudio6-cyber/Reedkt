import {
  buildRealVideoColorCorrectionReport,
  summarizeRealVideoColorCorrectionReport,
} from '../activation/real-video-color-correction'

const report = buildRealVideoColorCorrectionReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoColorCorrectionReport(report))
