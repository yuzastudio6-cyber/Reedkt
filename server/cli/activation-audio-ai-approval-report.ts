import {
  buildAudioAiApprovalReport,
  summarizeAudioAiApprovalReport,
} from '../activation/audio-ai-approval'

const report = buildAudioAiApprovalReport()
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeAudioAiApprovalReport(report))
