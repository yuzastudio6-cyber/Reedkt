import {
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
} from '../activation/deepfilternet-runtime-hardening'
import {
  readDeepFilterNetLinuxRuntimeSummary,
  writeDeepFilterNetLinuxRuntimeStaticArtifacts,
} from '../activation/deepfilternet-runtime-hardening/deepfilternet-linux-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR

if (writeArtifacts) {
  await writeDeepFilterNetLinuxRuntimeStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readDeepFilterNetLinuxRuntimeSummary(reportDir), null, 2))
