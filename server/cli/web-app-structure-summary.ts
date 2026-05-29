import {
  buildWebAppStructureReport,
  summarizeWebAppStructureReport,
} from '../platform'

const report = buildWebAppStructureReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeWebAppStructureReport(report))
