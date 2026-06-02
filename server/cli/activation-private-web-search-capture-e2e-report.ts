import { buildPrivateWebE2EReport, summarizePrivateWebE2EReport } from '../activation/private-web-search-capture-e2e'

const json = process.argv.includes('--json')
const report = buildPrivateWebE2EReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizePrivateWebE2EReport(report))
}
