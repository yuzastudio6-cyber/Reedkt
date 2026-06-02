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
    'Phase 39C-SG-KERNEL SGLang kernel compatibility CLI',
    'No execution performed.',
    'Plan/report/cost/smoke modes are non-mutating by default.',
    'Pass --execute with current-shell confirmations for Cloud Build, import-smoke Cloud Run L4, and generated runtime only after import smoke passes.',
    'This CLI never downloads new models, uploads model weights, processes real media, accepts raw prompts, calls providers, creates public artifacts, unlocks beta/production, or touches Track A.',
  ].join('\n'))
} else {
  const result = await runVlmSglangKernelCompat({
    execute: true,
    keepTemp,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C-SG-KERNEL SGLang compatibility completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Selected profile: ${result.selectedProfile?.id ?? 'none'}`,
      `Selected candidate: ${result.selectedCandidate?.modelId ?? 'none'}`,
      `Private QA prefix: ${result.privateQaPrefix}`,
      `VLM tool-family beta status: ${result.vlmToolFamilyBetaStatus}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.localArtifactDir}`,
    ].join('\n'))
  }
}
