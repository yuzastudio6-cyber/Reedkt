import { buildWebSearchCaptureReadinessReport, summarizeWebSearchCaptureReadinessReport } from '../activation/web-search-capture-readiness'

const json = process.argv.includes('--json')
const report = buildWebSearchCaptureReadinessReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeWebSearchCaptureReadinessReport(report))
}
