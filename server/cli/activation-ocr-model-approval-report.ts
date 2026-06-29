import { buildOcrModelApprovalReport, summarizeOcrModelApprovalReport } from '../activation/ocr-model-approval'

const report = buildOcrModelApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeOcrModelApprovalReport(report))
