import {
  getMaskModelApprovalCandidate,
  listMaskModelLicenseEvidence,
} from '../mask-model-approval'
import type {
  Sam2EvidenceSource,
  Sam2ModelCandidateEvidence,
  Sam2ModelEvidence,
} from './sam2-model-approval-types'

const SAM2_CANDIDATE_IDS = ['facebook_sam2_hiera_tiny', 'meta_sam2_official_checkpoints'] as const

function evidenceSourcesFor(candidateId: string): Sam2EvidenceSource[] {
  return listMaskModelLicenseEvidence()
    .filter((evidence) => evidence.modelCandidateId === candidateId)
    .map((evidence) => ({
      evidenceId: evidence.evidenceId,
      candidateId: evidence.modelCandidateId,
      sourceName: evidence.sourceName,
      sourceUrl: evidence.sourceUrl,
      licenseClaim: evidence.licenseClaim,
      commercialUseClaim: evidence.commercialUseClaim,
      redistributionClaim: evidence.redistributionClaim,
      confidence: evidence.confidence,
      notes: evidence.notes,
    }))
}

function buildCandidateEvidence(candidateId: typeof SAM2_CANDIDATE_IDS[number]): Sam2ModelCandidateEvidence {
  const candidate = getMaskModelApprovalCandidate(candidateId)
  const sourceEvidence = evidenceSourcesFor(candidateId)

  return {
    candidateId,
    modelName: candidate?.modelName ?? candidateId,
    sourceUrl: candidate?.sourceUrl,
    officialGithubUrl: candidate?.officialGithubUrl,
    intendedCapability: candidate?.task ?? 'temporal segmentation / video object tracking / mask propagation',
    currentStatus: 'evaluated_only',
    checkpointProvenance: sourceEvidence.length > 0
      ? 'Public source/license evidence is recorded from Phase 33A, but no checkpoint has Phase 35A human approval.'
      : 'Checkpoint provenance evidence is missing and must be reviewed before any download phase.',
    approvedCheckpointSource: null,
    approvedChecksum: null,
    approvedStoragePath: null,
    approvedRuntimeImage: null,
    approvalBlockers: [
      'No explicit human legal/model approval artifact exists for SAM2.',
      'No exact SAM2 checkpoint is approved for download.',
      'No SAM2 checkpoint checksum is approved.',
      'No private SAM2 model storage artifact exists.',
      'No SAM2 runtime image or job is approved.',
    ],
    sourceEvidence,
  }
}

export const sam2ModelEvidence: Sam2ModelEvidence = {
  modelFamily: 'SAM2 / Segment Anything Model 2',
  intendedCapability: 'temporal segmentation / video object tracking / mask propagation',
  currentState: 'evaluated_only',
  candidates: SAM2_CANDIDATE_IDS.map(buildCandidateEvidence),
  noWeightsDownloaded: true,
  noRuntimeExecuted: true,
  noTemporalTrackingTested: true,
  birefnetOnlyRuntimeProvenSoFar: true,
}

export function listSam2ModelCandidateEvidence(): Sam2ModelCandidateEvidence[] {
  return [...sam2ModelEvidence.candidates]
}
