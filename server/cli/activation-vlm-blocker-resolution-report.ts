import { buildVlmBlockerResolutionReport, summarizeVlmBlockerResolutionReport } from '../activation/vlm-blocker-resolution'

const json = process.argv.includes('--json')
const report = buildVlmBlockerResolutionReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeVlmBlockerResolutionReport(report))
}
