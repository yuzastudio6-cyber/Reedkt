import { buildWebSearchToolEvidence, summarizeWebSearchToolSummary } from '../activation/web-search-capture-approval'

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(buildWebSearchToolEvidence(), null, 2))
} else {
  console.log(summarizeWebSearchToolSummary())
}
