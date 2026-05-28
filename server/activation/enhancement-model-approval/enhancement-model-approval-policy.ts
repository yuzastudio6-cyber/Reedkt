import type {
  EnhancementModelApprovalDecision,
  EnhancementModelCandidateRecord,
  EnhancementModelLicenseEvidence,
  EnhancementModelStoragePlan,
} from './enhancement-model-approval-types'

export function evaluateEnhancementModelApprovalPolicy(input: {
  candidate: EnhancementModelCandidateRecord
  evidence: EnhancementModelLicenseEvidence[]
  storagePlan: EnhancementModelStoragePlan
}): EnhancementModelApprovalDecision {
  const { candidate, evidence, storagePlan } = input
  if (candidate.candidateId !== 'xinntao_real_esrgan_x4plus') {
    return blockedDecision(candidate, candidate.blockedReason ?? `${candidate.modelName} is not approved for Phase 34A execution.`)
  }

  const blockers: string[] = []
  const warnings: string[] = []
  if (!candidate.sourceUrl) blockers.push('Real-ESRGAN source URL is missing.')
  if (!candidate.releaseAssetUrl) blockers.push('RealESRGAN_x4plus release asset URL is missing.')
  if (!candidate.canApproveForStagingSampleFirstEnhancement) blockers.push('RealESRGAN_x4plus is not marked approvable for staging sample-first enhancement.')
  if (!candidate.approvedFor.includes('staging_sample_first_enhancement')) blockers.push('RealESRGAN_x4plus is missing staging sample-first enhancement approval scope.')
  if (!candidate.approvedFor.includes('phase34_enhancement_runtime_verification')) blockers.push('RealESRGAN_x4plus is missing Phase 34 runtime verification scope.')

  const directEvidence = evidence.filter((item) => item.modelCandidateId === candidate.candidateId)
  if (directEvidence.length === 0) blockers.push('Real-ESRGAN license/model evidence is missing.')
  if (!directEvidence.some((item) => item.sourceUrl === candidate.sourceUrl)) blockers.push('Real-ESRGAN GitHub repository evidence is missing.')
  if (!directEvidence.some((item) => item.sourceType === 'release_asset')) warnings.push('RealESRGAN_x4plus release asset evidence should be recorded before Phase 34B.')
  if (!directEvidence.some((item) => item.licenseClaim.toLowerCase().includes('bsd-3-clause'))) blockers.push('Real-ESRGAN BSD-3-Clause license claim is missing.')
  if (directEvidence.some((item) => item.commercialUseClaim === 'blocked' || item.commercialUseClaim === 'unknown')) blockers.push('Real-ESRGAN commercial-use evidence is blocked or unknown.')
  if (directEvidence.some((item) => item.redistributionClaim === 'blocked' || item.redistributionClaim === 'unknown')) blockers.push('Real-ESRGAN redistribution evidence is blocked or unknown.')
  if (directEvidence.some((item) => item.commercialUseClaim === 'requires_manual_review')) warnings.push('RealESRGAN_x4plus release asset remains staging-only; runtime and production use require later verification/review.')
  if (directEvidence.some((item) => item.confidence === 'low')) warnings.push('Real-ESRGAN evidence contains low-confidence records; keep staging-only scope.')

  if (!storagePlan.privateStorageRequired || storagePlan.publicAccessAllowed) blockers.push('Real-ESRGAN model storage must be private.')
  if (storagePlan.sourceMediaBucketAllowed || /source-media/i.test(storagePlan.stagingStoragePath)) blockers.push('Real-ESRGAN model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('Real-ESRGAN model weights must not be committed to git.')
  if (storagePlan.signedUrlSourceOfTruthAllowed) blockers.push('Signed URLs must not be model-weight source of truth.')

  return {
    candidateId: candidate.candidateId,
    modelName: candidate.modelName,
    reviewStatus: blockers.length === 0 ? 'staging_approved_for_sample_first_enhancement' : 'blocked',
    stagingSampleFirstEnhancementAllowed: blockers.length === 0,
    realEsrganExecutionAllowed: false,
    fullVideoEnhancementAllowed: false,
    filmExecutionAllowed: false,
    filmDownloadAllowed: false,
    slowMotionExecutionAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    blockers,
    warnings: [
      ...warnings,
      'Approval is limited to staging sample-first enhancement planning.',
      'Real-ESRGAN execution, full-video enhancement, FILM, slow motion, production, external beta, and broad real media remain blocked.',
    ],
  }
}

export function enhancementProductionApprovalBlockers(): string[] {
  return [
    'Production approval is blocked by Phase 34A scope.',
    'External beta remains blocked.',
    'Paid production remains blocked.',
    'Broad real user media testing remains blocked.',
    'Full-video blind enhancement remains blocked.',
    'Real-ESRGAN execution remains blocked until Phase 34C runtime verification.',
    'FILM download/execution and slow motion remain blocked until a separate approval/download/runtime phase.',
  ]
}

function blockedDecision(candidate: EnhancementModelCandidateRecord, reason: string): EnhancementModelApprovalDecision {
  const evaluated = candidate.statuses.includes('evaluated_only')
  return {
    candidateId: candidate.candidateId,
    modelName: candidate.modelName,
    reviewStatus: evaluated ? 'evaluated_only' : 'blocked',
    stagingSampleFirstEnhancementAllowed: false,
    realEsrganExecutionAllowed: false,
    fullVideoEnhancementAllowed: false,
    filmExecutionAllowed: false,
    filmDownloadAllowed: false,
    slowMotionExecutionAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    blockers: [reason],
    warnings: candidate.notes,
  }
}
