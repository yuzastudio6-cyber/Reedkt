import { buildBiRefNetRuntimeReport, summarizeBiRefNetRuntimeReport } from '../activation/mask-runtime'

const report = buildBiRefNetRuntimeReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeBiRefNetRuntimeReport(report))
