import { buildWebSearchUiApiGatingReport, summarizeWebSearchUiApiGatingReport } from '../activation/web-search-ui-api-gating'

const json = process.argv.includes('--json')
const report = buildWebSearchUiApiGatingReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeWebSearchUiApiGatingReport(report))
}
