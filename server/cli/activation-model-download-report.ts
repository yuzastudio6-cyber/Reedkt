import {
  buildModelDownloadReport,
  summarizeModelDownloadReport,
} from '../activation/model-download'

const report = buildModelDownloadReport()
if (report.blockers.length > 0) process.exitCode = 1

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeModelDownloadReport(report))
