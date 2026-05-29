import { getApprovedSam2ModelDownloadEvidence } from '../sam2-model-download'
import { sam2RuntimeConfig } from './sam2-runtime-policy'

export function buildSam2RuntimeModelResolverSummary(): {
  modelGcsPath: string
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
  expectedFileCount: number
  blockers: string[]
  warnings: string[]
} {
  const evidence = getApprovedSam2ModelDownloadEvidence()
  const blockers: string[] = []
  const warnings: string[] = []

  if (evidence.status !== 'verified') blockers.push('Phase 35B SAM2 model download evidence is not verified.')
  if (evidence.modelId !== sam2RuntimeConfig.modelId) blockers.push('Phase 35B model id does not match Phase 35C runtime policy.')
  if (evidence.targetGcsPath !== sam2RuntimeConfig.modelGcsPath) blockers.push('Phase 35B target GCS path does not match Phase 35C runtime policy.')
  if (evidence.checkpointSha256 !== sam2RuntimeConfig.checkpointSha256) blockers.push('Phase 35B checkpoint checksum does not match Phase 35C policy.')
  if (evidence.configSha256 !== sam2RuntimeConfig.configSha256) blockers.push('Phase 35B config checksum does not match Phase 35C policy.')
  if (evidence.aggregateSha256 !== sam2RuntimeConfig.aggregateSha256) blockers.push('Phase 35B aggregate checksum does not match Phase 35C policy.')
  if (evidence.uploadedObjectCount !== 5) blockers.push('Phase 35B uploaded object count should be exactly 5.')

  warnings.push('Model resolver only approves generated/synthetic runtime verification; real-video temporal tracking remains blocked.')

  return {
    modelGcsPath: sam2RuntimeConfig.modelGcsPath,
    checkpointSha256: sam2RuntimeConfig.checkpointSha256,
    configSha256: sam2RuntimeConfig.configSha256,
    aggregateSha256: sam2RuntimeConfig.aggregateSha256,
    expectedFileCount: 5,
    blockers,
    warnings,
  }
}
