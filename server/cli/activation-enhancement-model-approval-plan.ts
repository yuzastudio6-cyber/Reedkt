import {
  buildEnhancementModelApprovalPlan,
  summarizeEnhancementModelApprovalPlan,
} from '../activation/enhancement-model-approval'

const plan = buildEnhancementModelApprovalPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else console.log(summarizeEnhancementModelApprovalPlan(plan))
