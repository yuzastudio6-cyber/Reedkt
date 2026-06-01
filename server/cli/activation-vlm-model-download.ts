import { writeFile } from 'node:fs/promises'
import {
  copyVlmModelDownloadSafeArtifacts,
  runVlmModelDownload,
  vlmModelDownloadEvidenceToTypeScript,
} from '../activation/vlm-model-download'

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
    'Phase 39B Qwen3-VL exact asset download/private staging CLI',
    'No execution performed.',
    'Pass --execute with the current-shell VLM download and private GCS upload confirmations set to download/checksum/upload the approved pinned assets.',
    'This CLI never runs vLLM, Transformers inference, GPU jobs, media processing, provider calls, Docker, Cloud Run, beta/production unlocks, or Track A code.',
  ].join('\n'))
} else {
  const result = await runVlmModelDownload({
    execute: true,
    cleanup: !keepTemp,
    runId,
  })
  if (artifactDir) await copyVlmModelDownloadSafeArtifacts({
    fromReportDir: result.localArtifacts.reportDir,
    toArtifactDir: artifactDir,
  })
  if (writeEvidenceModule) {
    await writeFile(
      new URL('../activation/vlm-model-download/approved-vlm-model-download-evidence.ts', import.meta.url),
      vlmModelDownloadEvidenceToTypeScript(result.evidence),
      'utf8',
    )
  }
  if (json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log([
      'Phase 39B Qwen3-VL exact asset private staging completed.',
      `Run root: ${result.localArtifacts.runRoot}`,
      `Report dir: ${result.localArtifacts.reportDir}`,
      `Model: ${result.evidence.modelId}`,
      `Revision: ${result.evidence.revision}`,
      `Files: ${result.evidence.fileCount}`,
      `Bytes: ${result.evidence.selectedTotalSizeBytes}`,
      `Aggregate SHA256: ${result.evidence.aggregateSha256}`,
      `Private GCS prefix: ${result.evidence.targetGcsPath}`,
      `Uploaded objects: ${result.evidence.uploadedObjectCount}`,
      `VLM runtime/inference: not run and blocked`,
      artifactDir ? `Safe artifact dir: ${artifactDir}` : 'Safe artifact dir: not requested',
      writeEvidenceModule ? 'Approved evidence module updated.' : 'Approved evidence module not updated; pass --emit-approved-evidence-module to write it.',
    ].join('\n'))
  }
}
