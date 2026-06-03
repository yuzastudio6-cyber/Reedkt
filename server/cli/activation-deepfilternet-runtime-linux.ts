import {
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
} from '../activation/deepfilternet-runtime-hardening'
import {
  executeDeepFilterNetLinuxRuntime,
  readDeepFilterNetLinuxRuntimeSummary,
} from '../activation/deepfilternet-runtime-hardening/deepfilternet-linux-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeDeepFilterNetLinuxRuntime({ reportDir, keepTemp }), null, 2))
} else {
  console.log(JSON.stringify(await readDeepFilterNetLinuxRuntimeSummary(reportDir), null, 2))
}
