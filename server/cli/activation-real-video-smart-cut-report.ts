import {
  buildRealVideoSmartCutReport,
  summarizeRealVideoSmartCutReport,
} from '../activation/real-video-smart-cut'

const report = buildRealVideoSmartCutReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoSmartCutReport(report))
