import {
  BIREFNET_MANIFEST_ID,
  MASK_MODEL_APPROVAL_REVIEWED_AT,
} from './mask-model-candidate-registry'
import { evaluateMaskModelApprovalPolicy } from './mask-model-approval-policy'
import { maskEvidenceForCandidate } from './mask-model-license-evidence'
import { buildBiRefNetMaskModelStoragePlan } from './mask-model-storage-plan'
import type { MaskModelCandidateRecord, MaskModelWeightManifestRecord } from './mask-model-approval-types'

export function buildMaskModelWeightManifest(candidate: MaskModelCandidateRecord): MaskModelWeightManifestRecord {
  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  const decision = evaluateMaskModelApprovalPolicy({
    candidate,
    evidence: maskEvidenceForCandidate(candidate.candidateId),
    storagePlan,
  })
  const approved = decision.stagingSingleFrameBackgroundRemovalAllowed
  return {
    modelWeightManifestId: approved ? BIREFNET_MANIFEST_ID : manifestIdForBlockedCandidate(candidate),
    toolId: candidate.toolId,
    modelName: candidate.modelName,
    modelVersion: approved ? 'staging-v1' : 'pending_separate_approval',
    source: candidate.sourceUrl ? sourceNameFor(candidate.sourceUrl) : 'manual review pending',
    sourceUrl: candidate.sourceUrl ?? 'manual-review-required',
    expectedPath: candidate.expectedPath ?? `/opt/reeditpro/model-weights/${candidate.toolId}/${candidate.candidateId}`,
    runtimeTempPath: candidate.runtimeTempPath,
    stagingStoragePath: candidate.stagingStoragePath ?? `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/blocked/${candidate.candidateId}/`,
    license: approved ? 'mit' : candidate.candidateId.includes('sam2') || candidate.toolId === 'sam2' ? 'apache-2.0_evaluated_only' : 'unknown_or_unapproved',
    commercialUseAllowed: approved ? 'likely_allowed_after_review' : 'blocked',
    redistributionAllowed: approved ? 'likely_allowed_after_review' : 'blocked',
    requiresAttribution: approved || candidate.toolId === 'sam2',
    reviewStatus: decision.reviewStatus,
    productionStatus: 'production_blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    broadRealMediaStatus: 'blocked',
    riskNotes: approved
      ? [
          'Approved only for staging representative-frame/single-frame background-removal planning.',
          'Checksum is missing until Phase 33B explicit download/load.',
          'Mask execution, text-behind-subject execution, production, external beta, paid production, and broad real media remain blocked.',
        ]
      : [candidate.blockedReason ?? 'Not approved for Phase 33A execution.'],
    checksum: 'missing_until_download',
    createdAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    approvedFor: approved ? candidate.approvedFor : [],
  }
}

export function buildBlockedMaskModelWeightManifests(candidates: MaskModelCandidateRecord[]): MaskModelWeightManifestRecord[] {
  return candidates
    .filter((candidate) => candidate.statuses.includes('blocked'))
    .map((candidate) => buildMaskModelWeightManifest(candidate))
}

export function buildEvaluatedMaskModelWeightManifests(candidates: MaskModelCandidateRecord[]): MaskModelWeightManifestRecord[] {
  return candidates
    .filter((candidate) => candidate.candidateId === 'facebook_sam2_hiera_tiny' || candidate.candidateId === 'meta_sam2_official_checkpoints')
    .map((candidate) => buildMaskModelWeightManifest(candidate))
}

function manifestIdForBlockedCandidate(candidate: MaskModelCandidateRecord): string {
  if (candidate.candidateId === 'facebook_sam2_hiera_tiny') return 'sam2_hiera_tiny_evaluated_only'
  if (candidate.candidateId === 'meta_sam2_official_checkpoints') return 'sam2_official_checkpoints_evaluated_only'
  return `${candidate.candidateId}_blocked`
}

function sourceNameFor(sourceUrl: string): string {
  if (sourceUrl.includes('huggingface.co')) return 'Hugging Face'
  if (sourceUrl.includes('github.com')) return 'GitHub'
  return 'manual review'
}
