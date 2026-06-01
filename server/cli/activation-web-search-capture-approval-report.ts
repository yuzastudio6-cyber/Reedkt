import { buildWebSearchCaptureApprovalReport, summarizeWebSearchCaptureApprovalReport } from '../activation/web-search-capture-approval'

const json = process.argv.includes('--json')
const report = buildWebSearchCaptureApprovalReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeWebSearchCaptureApprovalReport(report))
}
