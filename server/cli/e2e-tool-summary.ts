import {
  createCanonicalPrivateToolSummary,
} from '../workers/canonical-private-tool-summary'

const summary = createCanonicalPrivateToolSummary()
console.log(JSON.stringify(summary, null, 2))
