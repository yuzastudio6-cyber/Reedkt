import { buildWebSearchUiApiIamPlan, summarizeWebSearchUiApiIamPlan } from '../activation/web-search-ui-api-gating'

const json = process.argv.includes('--json')
const plan = buildWebSearchUiApiIamPlan()

if (json) {
  console.log(JSON.stringify(plan, null, 2))
} else {
  console.log(summarizeWebSearchUiApiIamPlan(plan))
}
