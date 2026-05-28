import {
  buildFirstRealVideoReport,
  summarizeFirstRealVideoReport,
} from '../activation/first-real-video'

const report = buildFirstRealVideoReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeFirstRealVideoReport(report))
