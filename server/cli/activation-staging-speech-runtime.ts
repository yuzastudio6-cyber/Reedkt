import { buildSpeechRuntimeReport, summarizeSpeechRuntimeReport } from '../activation/speech-runtime'

const report = buildSpeechRuntimeReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeSpeechRuntimeReport(report))
