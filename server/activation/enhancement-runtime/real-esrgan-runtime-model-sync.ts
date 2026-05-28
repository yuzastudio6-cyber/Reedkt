import { getApprovedEnhancementModelDownloadEvidence } from '../enhancement-model-download'
import { realEsrganRuntimeConfig } from './real-esrgan-runtime-policy'
import type { RealEsrganRuntimeModelSyncSummary } from './real-esrgan-runtime-types'

export function buildRealEsrganRuntimeModelSyncSummary(): RealEsrganRuntimeModelSyncSummary {
  const evidence = getApprovedEnhancementModelDownloadEvidence()
  const blockers: string[] = []
  const warnings: string[] = []

  if (evidence.status !== 'verified') blockers.push('RealESRGAN_x4plus Phase 34B download evidence is not verified.')
  if (evidence.modelName !== realEsrganRuntimeConfig.modelName) blockers.push('Only RealESRGAN_x4plus download evidence may be used.')
  if (evidence.releaseVersion !== realEsrganRuntimeConfig.releaseVersion) blockers.push('RealESRGAN_x4plus release evidence does not match Phase 34C policy.')
  if (evidence.fileSha256 !== realEsrganRuntimeConfig.modelFileSha256) blockers.push('RealESRGAN_x4plus file checksum evidence does not match Phase 34C policy.')
  if (evidence.aggregateSha256 !== realEsrganRuntimeConfig.modelAggregateSha256) blockers.push('RealESRGAN_x4plus aggregate checksum evidence does not match Phase 34C policy.')
  if (evidence.stagingStoragePath !== realEsrganRuntimeConfig.modelGcsPath) blockers.push('RealESRGAN_x4plus storage path does not match the approved private GCS prefix.')
  if (evidence.fileCount !== 1) blockers.push('RealESRGAN_x4plus evidence must contain exactly one model file.')
  if (evidence.modelWeightFiles.length !== 1 || evidence.modelWeightFiles[0] !== realEsrganRuntimeConfig.modelFileName) blockers.push('Only RealESRGAN_x4plus.pth may be present in the approved model evidence.')
  if (!evidence.hasPthWeight) blockers.push('RealESRGAN_x4plus .pth model evidence is missing.')
  warnings.push('Real-ESRGAN package dependencies may include GFPGAN/facexlib libraries, but Phase 34C must not use face enhancement or any GFPGAN/facexlib weights.')

  return {
    modelManifestId: realEsrganRuntimeConfig.modelManifestId,
    modelGcsPath: realEsrganRuntimeConfig.modelGcsPath,
    runtimePath: realEsrganRuntimeConfig.modelRuntimePath,
    expectedReleaseVersion: realEsrganRuntimeConfig.releaseVersion,
    expectedFileSha256: realEsrganRuntimeConfig.modelFileSha256,
    expectedAggregateSha256: realEsrganRuntimeConfig.modelAggregateSha256,
    expectedFileCount: evidence.fileCount ?? 0,
    blockers,
    warnings,
  }
}
