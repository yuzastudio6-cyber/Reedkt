import { writeFile } from 'node:fs/promises'
import {
  copyVlmRuntimeSafeArtifacts,
  runVlmRuntimeVerification,
  vlmRuntimeEvidenceToTypeScript,
} from '../activation/vlm-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const json = process.argv.includes('--json')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--safe-artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  console.log([
    'Phase 39C generated Qwen3-VL/vLLM runtime verification CLI',
    'No execution performed.',
    'Pass --execute with current-shell private GCS read, runtime execute, and private artifact upload confirmations set.',
    'This CLI never processes real media, arbitrary images/video, raw prompts, provider calls, public artifacts, beta/production unlocks, or Track A code.',
  ].join('\n'))
} else {
  const result = await runVlmRuntimeVerification({
    execute: true,
    keepTemp,
    runId,
  })
  if (artifactDir) await copyVlmRuntimeSafeArtifacts({
    fromReportDir: result.localArtifactDir,
    toArtifactDir: artifactDir,
  })
  if (writeEvidenceModule) {
    await writeFile(
      new URL('../activation/vlm-runtime/approved-vlm-runtime-evidence.ts', import.meta.url),
      vlmRuntimeEvidenceToTypeScript(result.evidence),
      'utf8',
    )
  }
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39C generated Qwen3-VL/vLLM runtime verification completed with recorded status.',
      `Run: ${result.evidence.runId}`,
      `Model: ${result.evidence.modelId}`,
      `Revision: ${result.evidence.revision}`,
      `Status: ${result.evidence.status}`,
      `VLM tool-family beta status: ${result.evidence.vlmToolFamilyBetaStatus}`,
      `Phase 39D ready: ${result.evidence.phase39DReadiness.readyForControlledRealFrameVlm}`,
      `Private artifact prefix: ${result.evidence.artifactPrefix ?? 'not uploaded'}`,
      `Uploaded artifacts: ${result.uploadedArtifacts.length}`,
      result.evidence.blockers.length ? `Blockers: ${result.evidence.blockers.join('; ')}` : 'Blockers: none',
      artifactDir ? `Safe artifact dir: ${artifactDir}` : 'Safe artifact dir: not requested',
      writeEvidenceModule ? 'Approved evidence module updated.' : 'Approved evidence module not updated; pass --emit-approved-evidence-module to write it.',
    ].join('\n'))
  }
}
