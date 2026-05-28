import { buildMaskModelApprovalReport } from '../mask-model-approval'
import { getApprovedMaskModelDownloadEvidence } from './approved-mask-model-download-evidence'
import { maskDownloadEvidenceHasChecksum } from './mask-model-checksum-builder'
import { validateMaskModelGcsStoragePath } from './mask-model-gcs-uploader'

export function buildMaskModelDownloadBlockers(): { blockers: string[]; warnings: string[] } {
  const approvalReport = buildMaskModelApprovalReport()
  const evidence = getApprovedMaskModelDownloadEvidence()
  const blockers: string[] = []
  const warnings: string[] = []

  if (!approvalReport.approvedModels.some((model) => model.modelWeightManifestId === 'birefnet_main_staging_v1')) {
    blockers.push('Phase 33A approval for birefnet_main_staging_v1 is missing.')
  }
  if (approvalReport.approvedModels.some((model) => model.toolId === 'sam2')) blockers.push('SAM2 must not be approved for Phase 33B.')
  if (evidence.status !== 'verified') blockers.push('Approved BiRefNet model download/upload evidence is not verified.')
  if (!maskDownloadEvidenceHasChecksum(evidence)) blockers.push('BiRefNet aggregate checksum evidence is missing or invalid.')
  if (!evidence.resolvedRevision) blockers.push('Resolved BiRefNet revision evidence is missing.')
  if (!evidence.fileCount || evidence.fileCount <= 0) blockers.push('Downloaded BiRefNet file count is missing.')
  if (!evidence.totalSizeBytes || evidence.totalSizeBytes <= 0) blockers.push('Downloaded BiRefNet total size is missing.')
  if (!evidence.hasSafetensorsOrBinWeights) blockers.push('BiRefNet safetensors/bin model weight evidence is missing.')
  blockers.push(...validateMaskModelGcsStoragePath(evidence.stagingStoragePath))
  if (!evidence.gcsManifestPath || !evidence.gcsChecksumPath) blockers.push('GCS checksum/manifest evidence paths are missing.')

  if (evidence.hasCustomCode) warnings.push('BiRefNet snapshot contains custom code files; Phase 33B records but does not execute them.')
  warnings.push('Phase 33B does not verify BiRefNet runtime execution.')
  warnings.push('Phase 33D real-video mask/text-behind-subject remains blocked until Phase 33C runtime verification and mask QA pass.')
  warnings.push(...evidence.warnings)

  return {
    blockers: Array.from(new Set([...blockers, ...evidence.blockers])),
    warnings: Array.from(new Set(warnings)),
  }
}
