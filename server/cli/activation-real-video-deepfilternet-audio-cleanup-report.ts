import {
  buildRealVideoDeepFilterNetReport,
  summarizeRealVideoDeepFilterNetReport,
} from '../activation/real-video-deepfilternet-audio-cleanup'

const report = buildRealVideoDeepFilterNetReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoDeepFilterNetReport(report))
