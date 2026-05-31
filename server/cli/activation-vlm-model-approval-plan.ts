import { buildVlmModelApprovalPlanText, buildVlmModelApprovalReport } from '../activation/vlm-model-approval'

const report = buildVlmModelApprovalReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report.plan, null, 2))
else console.log(buildVlmModelApprovalPlanText())
