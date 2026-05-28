import {
  ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
  REAL_ESRGAN_X4PLUS_MANIFEST_ID,
} from './enhancement-model-candidate-registry'
import { evaluateEnhancementModelApprovalPolicy } from './enhancement-model-approval-policy'
import { enhancementEvidenceForCandidate } from './enhancement-model-license-evidence'
import { buildRealEsrganEnhancementModelStoragePlan } from './enhancement-model-storage-plan'
import { getApprovedEnhancementModelDownloadEvidence } from '../enhancement-model-download/approved-enhancement-model-download-evidence'
import type {
  EnhancementModelCandidateRecord,
  EnhancementModelWeightManifestRecord,
} from './enhancement-model-approval-types'

export function buildEnhancementModelWeightManifest(candidate: EnhancementModelCandidateRecord): EnhancementModelWeightManifestRecord {
  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  const decision = evaluateEnhancementModelApprovalPolicy({
    candidate,
    evidence: enhancementEvidenceForCandidate(candidate.candidateId),
    storagePlan,
  })
  const approved = decision.stagingSampleFirstEnhancementAllowed
  const downloadEvidence = candidate.candidateId === 'xinntao_real_esrgan_x4plus'
    ? getApprovedEnhancementModelDownloadEvidence()
    : undefined
  const verifiedDownload = downloadEvidence?.status === 'verified'
  return {
    modelWeightManifestId: approved ? REAL_ESRGAN_X4PLUS_MANIFEST_ID : manifestIdForBlockedCandidate(candidate),
    toolId: candidate.toolId,
    modelName: candidate.modelName,
    modelVersion: verifiedDownload ? downloadEvidence.releaseVersion : approved ? 'staging-v1' : 'pending_separate_approval',
    resolvedRevision: verifiedDownload ? downloadEvidence.releaseVersion : undefined,
    source: candidate.sourceUrl ? sourceNameFor(candidate.sourceUrl) : 'manual review pending',
    sourceUrl: verifiedDownload ? downloadEvidence.sourceUrl : candidate.releaseAssetUrl ?? candidate.sourceUrl ?? 'manual-review-required',
    expectedPath: candidate.expectedPath ?? `/opt/reeditpro/model-weights/${candidate.toolId}/${candidate.candidateId}`,
    runtimeTempPath: candidate.runtimeTempPath,
    stagingStoragePath: candidate.stagingStoragePath ?? `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/blocked/${candidate.candidateId}/`,
    license: approved ? 'BSD-3-Clause repo evidence; model asset license evidence pending review if distinct' : candidate.toolId === 'film' ? 'Apache-2.0_repo_evaluated_only' : 'unknown_or_unapproved',
    commercialUseAllowed: approved ? 'likely_allowed_after_review' : 'blocked',
    redistributionAllowed: approved ? 'likely_allowed_after_review' : 'blocked',
    requiresAttribution: approved || candidate.toolId === 'film',
    reviewStatus: decision.reviewStatus,
    executionStatus: 'blocked',
    downloadStatus: approved ? 'future_phase_only' : 'blocked',
    productionStatus: 'production_blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    broadRealMediaStatus: 'blocked',
    riskNotes: approved
      ? [
          'Approved only for staging sample-first enhancement planning.',
          'Checksum is missing until Phase 34B explicit download/load.',
          'Hallucinated detail risk.',
          'Oversharpening risk.',
          'Plastic skin risk.',
          'Full-video flicker risk.',
          'Full-video blind enhancement, slow motion, production, external beta, paid production, and broad real media remain blocked.',
        ]
      : [candidate.blockedReason ?? 'Not approved for Phase 34A execution.'],
    checksum: verifiedDownload ? downloadEvidence.fileSha256 ?? 'missing_until_download' : 'missing_until_download',
    createdAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    approvedFor: approved ? candidate.approvedFor : [],
  }
}

export function buildBlockedEnhancementModelWeightManifests(candidates: EnhancementModelCandidateRecord[]): EnhancementModelWeightManifestRecord[] {
  return candidates
    .filter((candidate) => candidate.statuses.includes('blocked'))
    .map((candidate) => buildEnhancementModelWeightManifest(candidate))
}

export function buildEvaluatedEnhancementModelWeightManifests(candidates: EnhancementModelCandidateRecord[]): EnhancementModelWeightManifestRecord[] {
  return candidates
    .filter((candidate) => candidate.statuses.includes('evaluated_only'))
    .map((candidate) => buildEnhancementModelWeightManifest(candidate))
}

function manifestIdForBlockedCandidate(candidate: EnhancementModelCandidateRecord): string {
  if (candidate.candidateId === 'google_research_film') return 'film_frame_interpolation_evaluated_only_v1'
  if (candidate.candidateId === 'realesrgan_smaller_general_alternatives') return 'real_esrgan_smaller_general_evaluated_only_v1'
  return `${candidate.candidateId}_blocked`
}

function sourceNameFor(sourceUrl: string): string {
  if (sourceUrl.includes('github.com/xinntao/Real-ESRGAN')) return 'xinntao/Real-ESRGAN release/model zoo'
  if (sourceUrl.includes('github.com/google-research/frame-interpolation')) return 'google-research/frame-interpolation'
  if (sourceUrl.includes('github.com')) return 'GitHub'
  return 'manual review'
}
