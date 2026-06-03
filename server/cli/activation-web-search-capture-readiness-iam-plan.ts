import { buildWebSearchReadinessIamPlan, summarizeWebSearchReadinessIamPlan } from '../activation/web-search-capture-readiness'

const json = process.argv.includes('--json')
const plan = buildWebSearchReadinessIamPlan()

if (json) {
  console.log(JSON.stringify(plan, null, 2))
} else {
  console.log(summarizeWebSearchReadinessIamPlan(plan))
}
