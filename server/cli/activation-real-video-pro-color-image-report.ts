import { buildRealVideoProColorImageReport, summarizeRealVideoProColorImageReport } from '../activation/real-video-pro-color-image'

const report = buildRealVideoProColorImageReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoProColorImageReport(report))
