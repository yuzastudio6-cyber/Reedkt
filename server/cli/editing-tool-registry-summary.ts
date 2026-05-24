import {
  createEditingToolRegistrySummary,
  runEditingToolReadiness,
} from '../tools/editing-tool-readiness'

const readiness = await runEditingToolReadiness({ strict: false })
const summary = createEditingToolRegistrySummary(readiness)

console.log(JSON.stringify(summary, null, 2))
