import { buildBraveLiveApiValidationReport, summarizeBraveLiveApiValidationReport } from '../activation/brave-live-api-validation'

const json = process.argv.includes('--json')
const report = buildBraveLiveApiValidationReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeBraveLiveApiValidationReport(report))
}
