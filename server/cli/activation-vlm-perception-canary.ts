import { runVlmPerceptionCanaryRecovery } from '../activation/vlm-perception-canary'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--safe-artifact-dir='))
const safeArtifactDir = artifactDirArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C-Q-SO3 VLM perception canary decomposed QA CLI',
    'No execution performed.',
    'Plan/report/IAM/cost/smoke modes are non-mutating by default.',
    'Pass --execute with current-shell confirmations for private GCS read, runtime image build/push, staging L4 Cloud Run execution, and private artifact upload.',
    'This CLI never downloads new models, uploads new model weights, processes real media, accepts raw prompts, calls providers, creates public artifacts, unlocks beta/production, or touches Track A.',
  ].join('\n'))
} else {
  const result = await runVlmPerceptionCanaryRecovery({
    execute: true,
    keepTemp,
    runId,
    safeArtifactDir,
  })
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C-Q-SO3 VLM perception canary decomposed QA completed with recorded status.',
      `Run: ${result.runId}`,
      `Status: ${result.status}`,
      `Selected candidate: ${result.selectedCandidate?.modelId ?? 'none'}`,
      `Private QA prefix: ${result.privateQaPrefix ?? 'not uploaded'}`,
      `Image digest: ${result.imageDigest ?? 'not recorded'}`,
      `VLM tool-family beta status: ${result.vlmToolFamilyBetaStatus}`,
      result.blockers.length ? `Blockers: ${result.blockers.join('; ')}` : 'Blockers: none',
      `Safe artifact dir: ${result.localArtifactDir}`,
    ].join('\n'))
  }
}
