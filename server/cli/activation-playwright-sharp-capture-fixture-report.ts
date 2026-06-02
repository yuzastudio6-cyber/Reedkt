import { buildPlaywrightSharpCaptureReport, summarizePlaywrightSharpCaptureReport } from '../activation/playwright-sharp-capture-fixture'

const json = process.argv.includes('--json')
const report = buildPlaywrightSharpCaptureReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizePlaywrightSharpCaptureReport(report))
}
