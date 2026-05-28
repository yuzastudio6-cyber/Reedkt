import { buildRealVideoMaskReport, summarizeRealVideoMaskReport } from '../activation/real-video-mask'

const json = process.argv.includes('--json')
const report = buildRealVideoMaskReport()

if (json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeRealVideoMaskReport(report))
}

if (report.blockers.length > 0 && (report.frameExtractionReport || report.birefnetFrameMaskReport)) {
  process.exitCode = 1
}
