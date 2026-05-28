import { getApprovedMaskModelDownloadEvidence } from '../mask-model-download'
import { birefnetRuntimeConfig } from './birefnet-runtime-policy'
import type { BiRefNetRuntimeModelSyncSummary } from './birefnet-runtime-types'

export function buildBiRefNetRuntimeModelSyncSummary(): BiRefNetRuntimeModelSyncSummary {
  const evidence = getApprovedMaskModelDownloadEvidence()
  const blockers: string[] = []
  const warnings: string[] = []

  if (evidence.status !== 'verified') blockers.push('BiRefNet Phase 33B download evidence is not verified.')
  if (evidence.repoId !== 'ZhengPeng7/BiRefNet') blockers.push('Only ZhengPeng7/BiRefNet download evidence may be used.')
  if (evidence.resolvedRevision !== birefnetRuntimeConfig.modelRevision) blockers.push('BiRefNet revision evidence does not match Phase 33C policy.')
  if (evidence.aggregateSha256 !== birefnetRuntimeConfig.modelAggregateSha256) blockers.push('BiRefNet aggregate checksum evidence does not match Phase 33C policy.')
  if (evidence.stagingStoragePath !== birefnetRuntimeConfig.modelGcsPath) blockers.push('BiRefNet storage path does not match the approved private GCS prefix.')
  if (!evidence.hasSafetensorsOrBinWeights) blockers.push('BiRefNet safetensors/bin model weight evidence is missing.')
  if (evidence.hasCustomCode) warnings.push('BiRefNet custom code must be scanned before local-only runtime loading.')

  return {
    modelManifestId: birefnetRuntimeConfig.modelManifestId,
    modelGcsPath: birefnetRuntimeConfig.modelGcsPath,
    runtimePath: birefnetRuntimeConfig.modelRuntimePath,
    expectedRevision: birefnetRuntimeConfig.modelRevision,
    expectedAggregateSha256: birefnetRuntimeConfig.modelAggregateSha256,
    expectedFileCount: evidence.fileCount ?? 0,
    blockers,
    warnings,
  }
}
