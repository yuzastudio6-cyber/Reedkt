import {
  MEDIA_DATA_BETA_GATE_REPORT_DIR,
  executeMediaDataBetaGate,
  readMediaDataBetaGateSummary,
} from '../activation/media-data-beta-gate'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_BETA_GATE_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeMediaDataBetaGate({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readMediaDataBetaGateSummary(reportDir), null, 2))
}
