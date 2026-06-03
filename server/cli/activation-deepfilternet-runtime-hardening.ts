import {
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
  executeDeepFilterNetRuntimeHardening,
  readDeepFilterNetRuntimeHardeningSummary,
} from '../activation/deepfilternet-runtime-hardening'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeDeepFilterNetRuntimeHardening({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readDeepFilterNetRuntimeHardeningSummary(reportDir), null, 2))
}
