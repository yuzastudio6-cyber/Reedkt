import {
  runVlmL4CompatibleCandidateRecovery,
} from '../activation/vlm-l4-compatible-candidate'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--safe-artifact-dir='))
const safeArtifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39B-Q/39C-Q VLM L4-compatible candidate recovery CLI',
    'No execution performed.',
    'Plan/report/smoke modes are non-mutating by default.',
    'Pass --execute with current-shell confirmations for candidate approval, download, private GCS upload, runtime image build/push, and staging L4 Cloud Run execution.',
    'This CLI never processes real media, arbitrary media, raw prompts, provider calls, public artifacts, beta/production unlocks, or Track A code.',
  ].join('\n'))
} else {
  const result = await runVlmL4CompatibleCandidateRecovery({
    execute: true,
    keepTemp,
    runId,
    safeArtifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39B-Q/39C-Q VLM L4-compatible candidate recovery completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Selected candidate: ${result.selectedCandidate?.modelId ?? 'none'}`,
      `Private model prefix: ${result.privateModelPrefix ?? 'not verified'}`,
      `Private QA prefix: ${result.privateQaPrefix ?? 'not uploaded'}`,
      `Image digest: ${result.imageDigest ?? 'not recorded'}`,
      `VLM tool-family beta status: ${result.vlmToolFamilyBetaStatus}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.localArtifactDir}`,
    ].join('\n'))
  }
}
