import type {
  ModelApprovalDecision,
  ModelCandidateRecord,
  ModelLicenseEvidence,
  ModelStoragePlan,
} from './model-approval-types'

export function evaluateModelApprovalPolicy(input: {
  candidate: ModelCandidateRecord
  evidence: ModelLicenseEvidence[]
  storagePlan: ModelStoragePlan
}): ModelApprovalDecision {
  const blockers: string[] = []
  const warnings: string[] = []
  const { candidate, evidence, storagePlan } = input

  if (candidate.candidateId !== 'systran_faster_whisper_tiny') {
    return {
      candidateId: candidate.candidateId,
      modelName: candidate.modelName,
      reviewStatus: candidate.status === 'evaluated_only' ? 'evaluated_only' : candidate.status === 'upstream_evidence' ? 'upstream_evidence' : 'blocked',
      stagingSpeechCaptionAllowed: false,
      productionAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      blockers: [candidate.blockedReason ?? `${candidate.modelName} is not approved in Phase 26.`],
      warnings: candidate.notes,
    }
  }

  if (!candidate.sourceUrl) blockers.push('Model source URL is missing.')
  if (!candidate.canApproveForStagingSpeechCaption) blockers.push('Candidate is not marked approvable for staging speech/caption.')
  if (!candidate.approvedFor.includes('staging_speech_caption')) blockers.push('Candidate is missing staging speech/caption approval scope.')
  if (!candidate.approvedFor.includes('phase28_first_real_video_speech_caption')) blockers.push('Candidate is missing Phase 28 speech/caption scope.')

  const directEvidence = evidence.filter((item) => item.modelCandidateId === candidate.candidateId)
  if (directEvidence.length === 0) blockers.push('License/model evidence is missing.')
  if (!directEvidence.some((item) => item.sourceUrl === candidate.sourceUrl)) blockers.push('Direct model source evidence is missing.')
  if (!directEvidence.some((item) => item.licenseClaim.toLowerCase() === 'mit')) blockers.push('Direct model MIT license claim is missing.')
  if (directEvidence.some((item) => item.commercialUseClaim === 'blocked')) blockers.push('Commercial use evidence is blocked.')
  if (directEvidence.some((item) => item.redistributionClaim === 'blocked')) blockers.push('Redistribution evidence is blocked.')
  if (!storagePlan.privateStorageRequired || storagePlan.publicAccessAllowed) blockers.push('Model storage must be private.')
  if (storagePlan.sourceMediaBucketAllowed || /source-media/i.test(storagePlan.stagingStoragePath)) blockers.push('Model storage must not use source-media buckets.')
  if (storagePlan.committedToGitAllowed) blockers.push('Model weights must not be committed to git.')
  if (storagePlan.signedUrlSourceOfTruthAllowed) blockers.push('Signed URLs must not be model-weight source of truth.')
  if (!candidate.modelVersion) warnings.push('Model revision is pending; record exact revision before future download.')

  return {
    candidateId: candidate.candidateId,
    modelName: candidate.modelName,
    reviewStatus: blockers.length === 0 ? 'staging_approved' : 'blocked',
    stagingSpeechCaptionAllowed: blockers.length === 0,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    blockers,
    warnings,
  }
}

export function productionApprovalBlockers(): string[] {
  return [
    'Production approval is blocked by Phase 26 scope.',
    'External beta remains blocked.',
    'Paid production remains blocked.',
    'Broad real user media testing remains blocked until Phase 28 explicitly approves speech/caption-only execution.',
  ]
}
