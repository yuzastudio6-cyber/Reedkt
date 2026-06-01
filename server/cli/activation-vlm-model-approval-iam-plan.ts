import { buildVlmModelApprovalIamPlan, summarizeVlmModelApprovalIamPlan } from '../activation/vlm-model-approval'

const report = buildVlmModelApprovalIamPlan()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeVlmModelApprovalIamPlan(report))
