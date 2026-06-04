import {
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  readSignalsmithControlledRuntimeSummary,
} from '../activation/signalsmith-stretch-runtime/controlled'
import { writeSignalsmithControlledFfmpegStaticArtifacts } from '../activation/signalsmith-stretch-runtime/ffmpeg-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_CONTROLLED_REPORT_DIR

if (writeArtifacts) {
  await writeSignalsmithControlledFfmpegStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readSignalsmithControlledRuntimeSummary(reportDir), null, 2))
