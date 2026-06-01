import { buildVlmModelApprovalReport, summarizeVlmModelApprovalReport } from '../activation/vlm-model-approval'

const report = buildVlmModelApprovalReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeVlmModelApprovalReport(report))
