import { buildSam2RuntimeReport, summarizeSam2RuntimeReport } from '../activation/sam2-runtime'

const report = buildSam2RuntimeReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeSam2RuntimeReport(report))
