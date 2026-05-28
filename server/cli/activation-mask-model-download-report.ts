import {
  buildMaskModelDownloadReport,
  summarizeMaskModelDownloadReport,
} from '../activation/mask-model-download'

const report = buildMaskModelDownloadReport()
if (report.blockers.length > 0) process.exitCode = 1

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeMaskModelDownloadReport(report))
