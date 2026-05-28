import {
  buildRealVideoPrivateExportReport,
  summarizeRealVideoPrivateExportReport,
} from '../activation/real-video-private-export'

const report = buildRealVideoPrivateExportReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoPrivateExportReport(report))
