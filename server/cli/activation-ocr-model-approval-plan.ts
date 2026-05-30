import { buildOcrModelApprovalPlanText, buildOcrModelApprovalReport } from '../activation/ocr-model-approval'

const report = buildOcrModelApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report.downloadCommandPlan, null, 2))
else console.log(buildOcrModelApprovalPlanText())
