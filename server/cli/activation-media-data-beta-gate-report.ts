import {
  MEDIA_DATA_BETA_GATE_REPORT_DIR,
  readMediaDataBetaGateSummary,
  writeMediaDataBetaGateStaticArtifacts,
} from '../activation/media-data-beta-gate'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_BETA_GATE_REPORT_DIR

if (writeArtifacts) {
  await writeMediaDataBetaGateStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readMediaDataBetaGateSummary(reportDir), null, 2))
