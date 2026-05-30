import {
  buildRealVideoSam2TemporalMaskReport,
  summarizeRealVideoSam2TemporalMaskReport,
} from '../activation/real-video-sam2-temporal-mask'

const json = process.argv.includes('--json')
const report = buildRealVideoSam2TemporalMaskReport()

console.log(json ? JSON.stringify(report, null, 2) : summarizeRealVideoSam2TemporalMaskReport(report))
