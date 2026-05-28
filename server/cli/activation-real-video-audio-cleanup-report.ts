import {
  buildRealVideoAudioCleanupReport,
  summarizeRealVideoAudioCleanupReport,
} from '../activation/real-video-audio-cleanup'

const report = buildRealVideoAudioCleanupReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeRealVideoAudioCleanupReport(report))
