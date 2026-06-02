import { runVlmSglangKernelCompat } from '../activation/vlm-sglang-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-SG-KERNEL import-smoke CLI',
    'No execution performed.',
    'The import-smoke phase is executed by the kernel compatibility CLI after Cloud Build profile images are ready.',
    'It does not copy model payloads, run inference, process images, call providers, unlock beta/production, or touch Track A.',
  ].join('\n'))
} else {
  const result = await runVlmSglangKernelCompat({
    execute: true,
    keepTemp,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result.importSmokeAttempts, null, 2))
  else {
    console.log([
      'Phase 39C-SG-KERNEL import-smoke matrix completed through the guarded compatibility runner.',
      `Run: ${result.runId}`,
      `Selected profile: ${result.selectedProfile?.id ?? 'none'}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
    ].join('\n'))
  }
}
