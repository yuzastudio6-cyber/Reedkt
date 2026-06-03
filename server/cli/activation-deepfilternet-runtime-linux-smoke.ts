import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
} from '../activation/deepfilternet-runtime-hardening'
import {
  executeDeepFilterNetLinuxRuntime,
  readDeepFilterNetLinuxRuntimeSummary,
  writeDeepFilterNetLinuxRuntimeStaticArtifacts,
} from '../activation/deepfilternet-runtime-hardening/deepfilternet-linux-runtime'

const execute = process.argv.includes('--execute')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR

if (execute) {
  console.log(JSON.stringify(await executeDeepFilterNetLinuxRuntime({ reportDir, smokeOnly: true }), null, 2))
} else {
  if (!existsSync(path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.json'))) {
    await writeDeepFilterNetLinuxRuntimeStaticArtifacts(reportDir)
  }
  console.log(JSON.stringify(await readDeepFilterNetLinuxRuntimeSummary(reportDir), null, 2))
}
