import {
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  readSignalsmithControlledRuntimeSummary,
} from '../activation/signalsmith-stretch-runtime/controlled'
import { executeSignalsmithControlledFfmpegRuntime } from '../activation/signalsmith-stretch-runtime/ffmpeg-runtime'

const execute = process.argv.includes('--execute')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_CONTROLLED_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeSignalsmithControlledFfmpegRuntime({ reportDir, smokeOnly: true }), null, 2))
} else {
  console.log(JSON.stringify(await readSignalsmithControlledRuntimeSummary(reportDir), null, 2))
}
