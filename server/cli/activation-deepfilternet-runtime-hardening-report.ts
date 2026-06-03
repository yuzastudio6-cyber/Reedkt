import {
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
  readDeepFilterNetRuntimeHardeningSummary,
  writeDeepFilterNetRuntimeHardeningStaticArtifacts,
} from '../activation/deepfilternet-runtime-hardening'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR

if (writeArtifacts) {
  await writeDeepFilterNetRuntimeHardeningStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readDeepFilterNetRuntimeHardeningSummary(reportDir), null, 2))
