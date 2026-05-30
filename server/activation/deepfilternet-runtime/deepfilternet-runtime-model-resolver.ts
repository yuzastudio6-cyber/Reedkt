import { getApprovedDeepFilterNetDownloadEvidence } from '../audio-ai-download'
import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'

export function buildDeepFilterNetRuntimeModelResolverSummary() {
  const download = getApprovedDeepFilterNetDownloadEvidence()
  const blockers: string[] = []
  const warnings: string[] = []
  if (download.status !== 'verified') blockers.push('Phase 36B DeepFilterNet artifact evidence is not verified.')
  if (download.targetGcsPath !== deepFilterNetRuntimeConfig.artifactGcsPath) blockers.push('Phase 36B DeepFilterNet artifact path does not match Phase 36C runtime policy.')
  if (download.cliSha256 !== deepFilterNetRuntimeConfig.cliSha256) blockers.push('Phase 36B CLI checksum does not match Phase 36C policy.')
  if (download.modelArchiveSha256 !== deepFilterNetRuntimeConfig.modelArchiveSha256) blockers.push('Phase 36B model archive checksum does not match Phase 36C policy.')
  if (download.aggregateSha256 !== deepFilterNetRuntimeConfig.aggregateSha256) blockers.push('Phase 36B aggregate checksum does not match Phase 36C policy.')
  if (download.uploadedObjectCount !== 7) blockers.push('Phase 36B did not verify the expected seven private DeepFilterNet objects.')
  warnings.push('Phase 36C must copy artifacts from private GCS and must not download DeepFilterNet from external hosts.')
  return { download, blockers, warnings }
}
