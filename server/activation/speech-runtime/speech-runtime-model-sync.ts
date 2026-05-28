import { getApprovedModelDownloadEvidence } from '../model-download/approved-model-download-evidence'
import { speechRuntimeConfig } from './speech-runtime-policy'

export function buildSpeechRuntimeModelSyncSummary() {
  const evidence = getApprovedModelDownloadEvidence()
  const blockers: string[] = []
  if (evidence.status !== 'verified') blockers.push('Phase 26B model download evidence is not verified.')
  if (evidence.modelWeightManifestId !== speechRuntimeConfig.modelManifestId) blockers.push('Approved model manifest mismatch.')
  if (evidence.stagingStoragePath !== speechRuntimeConfig.modelGcsPath) blockers.push('Approved model GCS path mismatch.')
  if (evidence.aggregateSha256 !== speechRuntimeConfig.modelAggregateSha256) blockers.push('Approved model checksum mismatch.')

  return {
    modelManifestId: speechRuntimeConfig.modelManifestId,
    modelGcsPath: speechRuntimeConfig.modelGcsPath,
    modelRuntimePath: speechRuntimeConfig.modelRuntimePath,
    expectedAggregateSha256: speechRuntimeConfig.modelAggregateSha256,
    blockers,
    warnings: ['Runtime sync must copy from private GCS only and must not call Hugging Face.'],
  }
}
