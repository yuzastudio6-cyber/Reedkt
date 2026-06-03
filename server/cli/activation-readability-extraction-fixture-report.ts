import { buildReadabilityExtractionReport, summarizeReadabilityExtractionReport } from '../activation/readability-extraction-fixture/readability-extraction-report-builder'

const json = process.argv.includes('--json')
const report = buildReadabilityExtractionReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeReadabilityExtractionReport(report))
}
