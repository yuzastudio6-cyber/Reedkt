import { buildControlledLiveSearchReport, summarizeControlledLiveSearchReport } from '../activation/controlled-live-search-capture-e2e/controlled-live-search-report-builder'

const json = process.argv.includes('--json')
const report = buildControlledLiveSearchReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeControlledLiveSearchReport(report))
}
