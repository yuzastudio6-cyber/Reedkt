import {
  AUDIO_TIMING_BETA_GATE_REPORT_DIR,
  executeAudioTimingBetaGate,
  readAudioTimingBetaGateSummary,
} from '../activation/audio-timing-beta-gate'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? AUDIO_TIMING_BETA_GATE_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeAudioTimingBetaGate({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readAudioTimingBetaGateSummary(reportDir), null, 2))
}
