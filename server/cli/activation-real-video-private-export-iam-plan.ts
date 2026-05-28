import { buildPhase30BIamPlan, summarizePhase30BIamPlan } from '../activation/real-video-private-export'

const plan = buildPhase30BIamPlan()
if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else console.log(summarizePhase30BIamPlan(plan))
