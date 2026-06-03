import {
  SIGNALSMITH_RUNTIME_REPORT_DIR,
  readSignalsmithRuntimeSummary,
  writeSignalsmithRuntimeStaticArtifacts,
} from '../activation/signalsmith-stretch-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? SIGNALSMITH_RUNTIME_REPORT_DIR

if (writeArtifacts) {
  await writeSignalsmithRuntimeStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readSignalsmithRuntimeSummary(reportDir), null, 2))
