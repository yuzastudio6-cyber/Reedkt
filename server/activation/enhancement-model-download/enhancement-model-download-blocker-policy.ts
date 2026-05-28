import { buildEnhancementModelApprovalReport } from '../enhancement-model-approval'
import { getApprovedEnhancementModelDownloadEvidence } from './approved-enhancement-model-download-evidence'
import { enhancementDownloadEvidenceHasChecksum } from './enhancement-model-checksum-builder'
import {
  APPROVED_ENHANCEMENT_MODEL_FILE,
  APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
} from './enhancement-model-download-policy'

export function buildEnhancementModelDownloadBlockers(): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = []
  const approvalReport = buildEnhancementModelApprovalReport()
  const evidence = getApprovedEnhancementModelDownloadEvidence()
  const approved = approvalReport.approvedModels[0]

  if (!approved || approved.modelWeightManifestId !== 'real_esrgan_x4plus_staging_v1') blockers.push('RealESRGAN_x4plus approval manifest is missing.')
  if (approvalReport.approvedModels.length !== 1) blockers.push(`Expected exactly one enhancement model approval; found ${approvalReport.approvedModels.length}.`)
  if (approvalReport.evaluatedOnlyModels.every((candidate) => candidate.candidateId !== 'google_research_film')) blockers.push('FILM must remain evaluated-only.')
  if (evidence.modelWeightManifestId !== 'real_esrgan_x4plus_staging_v1') blockers.push('Real-ESRGAN download evidence manifest ID is incorrect.')
  if (evidence.sourceUrl !== APPROVED_ENHANCEMENT_MODEL_SOURCE_URL) blockers.push('Real-ESRGAN download evidence source URL is not the approved release asset.')
  if (evidence.fileName !== APPROVED_ENHANCEMENT_MODEL_FILE) blockers.push('Real-ESRGAN download evidence file name is not approved.')
  if (evidence.status === 'verified' && !enhancementDownloadEvidenceHasChecksum(evidence)) blockers.push('Verified Real-ESRGAN evidence must include file and aggregate SHA-256 checksums.')
  if (evidence.status === 'verified' && evidence.modelWeightFiles.length !== 1) blockers.push('Verified Real-ESRGAN evidence must contain exactly one model weight file.')
  if (evidence.status === 'verified' && evidence.modelWeightFiles[0] !== APPROVED_ENHANCEMENT_MODEL_FILE) blockers.push('Verified Real-ESRGAN model weight file must be RealESRGAN_x4plus.pth.')
  if (evidence.stagingStoragePath.includes('source-media')) blockers.push('Real-ESRGAN model storage must not use source-media.')
  if (!evidence.stagingStoragePath.includes('reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/')) blockers.push('Real-ESRGAN model storage path is not the approved private generated-assets prefix.')

  warnings.push(...evidence.warnings)
  warnings.push('Phase 34B verifies private staging model storage only; it does not run Real-ESRGAN inference.')
  warnings.push('Enhancement execution, slow motion, production, external beta, and broad real media remain blocked.')

  return {
    blockers: Array.from(new Set([...blockers, ...evidence.blockers])),
    warnings: Array.from(new Set(warnings)),
  }
}
