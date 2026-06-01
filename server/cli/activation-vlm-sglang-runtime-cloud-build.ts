import { runVlmSglangRuntimeCloudBuild } from '../activation/vlm-sglang-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-SG-BUILD Cloud Build CLI',
    'No execution performed.',
    'Pass --execute with current-shell confirmations for SGLang build unblock, Cloud Build, and Artifact Registry push.',
    'This CLI does not download models, process media, call providers, deploy production, unlock beta, or touch Track A.',
  ].join('\n'))
} else {
  const result = await runVlmSglangRuntimeCloudBuild({
    execute: true,
    keepTemp,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C-SG-BUILD Cloud Build completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Build: ${result.buildId ?? 'not recorded'} ${result.buildStatus ?? ''}`.trim(),
      `Image: ${result.imageRef}`,
      `Digest: ${result.imageDigest ?? 'not recorded'}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.artifactDir}`,
    ].join('\n'))
  }
}
