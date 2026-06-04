import {
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  executeSignalsmithControlledRuntime,
  readSignalsmithControlledRuntimeSummary,
} from '../activation/signalsmith-stretch-runtime/controlled'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_CONTROLLED_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeSignalsmithControlledRuntime({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readSignalsmithControlledRuntimeSummary(reportDir), null, 2))
}
