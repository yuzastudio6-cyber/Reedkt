import {
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  readSignalsmithControlledRuntimeSummary,
  writeSignalsmithControlledRuntimeStaticArtifacts,
} from '../activation/signalsmith-stretch-runtime/controlled'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_CONTROLLED_REPORT_DIR

if (writeArtifacts) {
  await writeSignalsmithControlledRuntimeStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readSignalsmithControlledRuntimeSummary(reportDir), null, 2))
