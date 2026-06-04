import {
  AUDIO_TIMING_BETA_GATE_REPORT_DIR,
  readAudioTimingBetaGateSummary,
  writeAudioTimingBetaGateStaticArtifacts,
} from '../activation/audio-timing-beta-gate'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? AUDIO_TIMING_BETA_GATE_REPORT_DIR

if (writeArtifacts) {
  await writeAudioTimingBetaGateStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readAudioTimingBetaGateSummary(reportDir), null, 2))
