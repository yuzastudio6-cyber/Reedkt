import {
  FASTER_WHISPER_TINY_MANIFEST_ID,
  MODEL_APPROVAL_REVIEWED_AT,
} from './model-candidate-registry'
import { evaluateModelApprovalPolicy } from './model-approval-policy'
import { evidenceForCandidate } from './model-license-evidence'
import { buildFasterWhisperTinyStoragePlan } from './model-storage-plan'
import type { ModelCandidateRecord, ModelWeightManifestRecord } from './model-approval-types'

export function buildModelWeightManifest(candidate: ModelCandidateRecord): ModelWeightManifestRecord {
  const storagePlan = buildFasterWhisperTinyStoragePlan()
  const decision = evaluateModelApprovalPolicy({
    candidate,
    evidence: evidenceForCandidate(candidate.candidateId),
    storagePlan,
  })
  const stagingApproved = decision.stagingSpeechCaptionAllowed

  return {
    modelWeightManifestId: stagingApproved ? FASTER_WHISPER_TINY_MANIFEST_ID : `${candidate.candidateId}_blocked`,
    toolId: candidate.toolId,
    modelName: candidate.modelName,
    modelVersion: candidate.modelVersion ?? 'pending_until_download',
    source: candidate.sourceUrl ? sourceNameFor(candidate.sourceUrl) : 'manual review pending',
    sourceUrl: candidate.sourceUrl ?? 'manual-review-required',
    expectedPath: candidate.expectedPath ?? `/opt/reeditpro/model-weights/${candidate.toolId}/${candidate.candidateId}`,
    stagingStoragePath: candidate.stagingStoragePath ?? `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/blocked/${candidate.candidateId}/`,
    license: stagingApproved ? 'mit' : 'unknown_or_unapproved',
    commercialUseAllowed: stagingApproved,
    redistributionAllowed: stagingApproved,
    requiresAttribution: stagingApproved,
    reviewStatus: stagingApproved ? 'staging_approved' : 'blocked',
    productionStatus: 'production_blocked',
    externalBetaStatus: 'blocked',
    paidProductionStatus: 'blocked',
    riskNotes: stagingApproved
      ? [
          'Approved only for staging speech/caption planning.',
          'Checksum is missing until an explicit future download/load phase.',
          'Production, paid production, external beta, and broad real-user-media testing remain blocked.',
        ]
      : [candidate.blockedReason ?? 'Not approved in Phase 26.'],
    checksum: 'missing_until_download',
    createdAt: MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MODEL_APPROVAL_REVIEWED_AT,
    approvedFor: stagingApproved ? candidate.approvedFor : [],
  }
}

export function buildBlockedModelWeightManifests(candidates: ModelCandidateRecord[]): ModelWeightManifestRecord[] {
  return candidates
    .filter((candidate) => candidate.status === 'blocked')
    .map((candidate) => buildModelWeightManifest(candidate))
}

function sourceNameFor(sourceUrl: string): string {
  if (sourceUrl.includes('huggingface.co')) return 'Hugging Face'
  if (sourceUrl.includes('github.com')) return 'GitHub'
  if (sourceUrl.includes('pypi.org')) return 'PyPI'
  return 'manual review'
}
