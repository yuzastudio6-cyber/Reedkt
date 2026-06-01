import { buildVlmModelWeightSummary } from '../activation/vlm-model-approval'
import { getApprovedVlmModelDownloadEvidence } from '../activation/vlm-model-download'

const evidence = getApprovedVlmModelDownloadEvidence()

if (evidence.status === 'verified') {
  console.log([
    'Qwen3-VL model weight summary',
    `Candidate model: ${evidence.modelId}`,
    `Candidate family: ${evidence.modelFamily}`,
    `Exact revision: ${evidence.revision}`,
    `Private storage: ${evidence.targetGcsPath}`,
    `Selected files: ${evidence.fileCount ?? evidence.selectedAssets.length}`,
    `Selected bytes: ${evidence.selectedTotalSizeBytes ?? Object.values(evidence.assetSizeBytes).reduce((sum, value) => sum + value, 0)}`,
    `Aggregate SHA256: ${evidence.aggregateSha256 ?? 'missing'}`,
    `Uploaded objects: ${evidence.uploadedObjectCount ?? evidence.uploadedObjects.length}`,
    `Status: ${evidence.status}`,
    'Runtime execution allowed now: false',
    'Phase 39C ready: true for generated VLM runtime verification only',
    'Production/beta/broad media/provider/runtime auto-download remain blocked.',
  ].join('\n'))
} else {
  console.log(buildVlmModelWeightSummary())
}
