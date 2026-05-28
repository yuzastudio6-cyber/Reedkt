import {
  buildMaskModelApprovalPlan,
  summarizeMaskModelApprovalPlan,
} from '../activation/mask-model-approval'

const plan = buildMaskModelApprovalPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else console.log(summarizeMaskModelApprovalPlan(plan))
