import { runVlmSgAuthRerun } from '../activation/vlm-sglang-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-SG-AUTH-RERUN fixed-kernel rerun CLI',
    'No execution performed.',
    'Pass --execute with auth-rerun, fixed-kernel, Cloud Build, import-smoke, L4, private GCS, and artifact-upload confirmations in the current shell.',
    'Execution stops before Cloud Build when noninteractive auth or permission preflight fails.',
    'This CLI never creates service-account keys, prints tokens, downloads new Qwen models, calls providers, processes real media, unlocks beta/production, or touches Track A.',
  ].join('\n'))
} else {
  const result = await runVlmSgAuthRerun({
    execute: true,
    keepTemp,
    runId,
    artifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C-SG-AUTH-RERUN completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Auth status: ${result.authPreflight.status}`,
      `Auth path used: ${result.authPreflight.authPathUsed}`,
      `Selected profile: ${result.fixedKernelResult?.selectedProfile?.id ?? 'none'}`,
      `Selected candidate: ${result.fixedKernelResult?.selectedCandidate?.modelId ?? 'none'}`,
      `Private QA prefix: ${result.privateQaPrefix}`,
      `VLM tool-family beta status: ${result.vlmToolFamilyBetaStatus}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.localArtifactDir}`,
    ].join('\n'))
  }
}
