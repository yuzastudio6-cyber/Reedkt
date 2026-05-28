import { buildRealEsrganRuntimeReport, summarizeRealEsrganRuntimeReport } from '../activation/enhancement-runtime'

const report = buildRealEsrganRuntimeReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealEsrganRuntimeReport(report))
