import { buildOcrRuntimeReport, summarizeOcrRuntimeReport } from '../activation/ocr-runtime'

const report = buildOcrRuntimeReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeOcrRuntimeReport(report))
