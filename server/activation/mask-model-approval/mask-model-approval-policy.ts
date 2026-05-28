import type {
  MaskModelApprovalDecision,
  MaskModelCandidateRecord,
  MaskModelLicenseEvidence,
  MaskModelStoragePlan,
} from './mask-model-approval-types'

export function evaluateMaskModelApprovalPolicy(input: {
  candidate: MaskModelCandidateRecord
  evidence: MaskModelLicenseEvidence[]
  storagePlan: MaskModelStoragePlan
}): MaskModelApprovalDecision {
  const { candidate, evidence, storagePlan } = input
  if (candidate.candidateId !== 'zhengpeng7_birefnet') {
    return blockedDecision(candidate, candidate.blockedReason ?? `${candidate.modelName} is not approved for Phase 33A execution.`)
  }

  const blockers: string[] = []
  const warnings: string[] = []
  if (!candidate.sourceUrl) blockers.push('BiRefNet model source URL is missing.')
  if (!candidate.officialGithubUrl) blockers.push('BiRefNet official GitHub URL is missing.')
  if (!candidate.canApproveForStagingSingleFrameBackgroundRemoval) blockers.push('BiRefNet is not marked approvable for staging single-frame background removal.')
  if (!candidate.approvedFor.includes('staging_single_frame_background_removal')) blockers.push('BiRefNet is missing staging single-frame background-removal approval scope.')
  if (!candidate.approvedFor.includes('phase33_mask_model_runtime_verification')) blockers.push('BiRefNet is missing Phase 33 runtime verification scope.')

  const directEvidence = evidence.filter((item) => item.modelCandidateId === candidate.candidateId)
  if (directEvidence.length === 0) blockers.push('BiRefNet license/model evidence is missing.')
  if (!directEvidence.some((item) => item.sourceUrl === candidate.sourceUrl)) blockers.push('BiRefNet Hugging Face model evidence is missing.')
  if (!directEvidence.some((item) => item.sourceUrl === candidate.officialGithubUrl)) blockers.push('BiRefNet official GitHub evidence is missing.')
  if (!directEvidence.some((item) => item.licenseClaim.toLowerCase() === 'mit')) blockers.push('BiRefNet MIT license claim is missing.')
  if (directEvidence.some((item) => item.commercialUseClaim === 'blocked' || item.commercialUseClaim === 'unknown')) blockers.push('BiRefNet commercial-use evidence is blocked or unknown.')
  if (directEvidence.some((item) => item.redistributionClaim === 'blocked' || item.redistributionClaim === 'unknown')) blockers.push('BiRefNet redistribution evidence is blocked or unknown.')
  if (directEvidence.some((item) => item.confidence === 'low')) warnings.push('BiRefNet evidence contains low-confidence records; keep staging-only scope.')

  if (!storagePlan.privateStorageRequired || storagePlan.publicAccessAllowed) blockers.push('BiRefNet model storage must be private.')
  if (storagePlan.sourceMediaBucketAllowed || /source-media/i.test(storagePlan.stagingStoragePath)) blockers.push('BiRefNet model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('BiRefNet model weights must not be committed to git.')
  if (storagePlan.signedUrlSourceOfTruthAllowed) blockers.push('Signed URLs must not be model-weight source of truth.')

  return {
    candidateId: candidate.candidateId,
    modelName: candidate.modelName,
    reviewStatus: blockers.length === 0 ? 'staging_approved_for_single_frame_mask_test' : 'blocked',
    stagingSingleFrameBackgroundRemovalAllowed: blockers.length === 0,
    sam2ExecutionAllowed: false,
    textBehindSubjectExecutionAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    blockers,
    warnings: [
      ...warnings,
      'Approval is limited to staging representative-frame/single-frame background-removal planning.',
      'Mask execution, text-behind-subject execution, production, external beta, and broad real media remain blocked.',
    ],
  }
}

export function maskProductionApprovalBlockers(): string[] {
  return [
    'Production approval is blocked by Phase 33A scope.',
    'External beta remains blocked.',
    'Paid production remains blocked.',
    'Broad real user media testing remains blocked.',
    'SAM2 execution remains blocked until a separate video tracking approval phase.',
    'Text-behind-subject execution remains blocked until runtime mask QA passes.',
  ]
}

function blockedDecision(candidate: MaskModelCandidateRecord, reason: string): MaskModelApprovalDecision {
  const evaluated = candidate.statuses.includes('evaluated_only')
  const upstream = candidate.statuses.includes('upstream_evidence')
  return {
    candidateId: candidate.candidateId,
    modelName: candidate.modelName,
    reviewStatus: upstream ? 'upstream_evidence' : evaluated ? 'evaluated_only' : 'blocked',
    stagingSingleFrameBackgroundRemovalAllowed: false,
    sam2ExecutionAllowed: false,
    textBehindSubjectExecutionAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    blockers: [reason],
    warnings: candidate.notes,
  }
}
