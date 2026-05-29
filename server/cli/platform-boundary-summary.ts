import {
  buildPlatformBoundaryReport,
  summarizePlatformBoundaryReport,
} from '../platform'

const report = buildPlatformBoundaryReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizePlatformBoundaryReport(report))
