import { buildProColorImageRuntimeReport, summarizeProColorImageRuntimeReport } from '../activation/pro-color-image-runtime'

const report = buildProColorImageRuntimeReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeProColorImageRuntimeReport(report))
