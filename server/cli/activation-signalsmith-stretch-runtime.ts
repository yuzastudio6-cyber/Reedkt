import {
  SIGNALSMITH_RUNTIME_REPORT_DIR,
  executeSignalsmithRuntime,
  readSignalsmithRuntimeSummary,
} from '../activation/signalsmith-stretch-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_RUNTIME_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeSignalsmithRuntime({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readSignalsmithRuntimeSummary(reportDir), null, 2))
}
