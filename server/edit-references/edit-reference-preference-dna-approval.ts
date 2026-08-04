import { createHash } from 'node:crypto'
import type {
  PreferenceDNAQAResultRecord,
  PreferenceDNAReasoningApprovalSnapshot,
  PreferenceDNAReasoningReviewAcknowledgementRequest,
  PreferenceDNAReasoningReviewSummary,
  PreferenceDNAVersionRecord,
} from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import {
  validateEditReferenceQwenDnaVersionAttemptBinding,
} from './edit-reference-preference-dna-candidate-materialization'
import type { EditReferencePreferenceDnaReasoningAttemptRecord } from './edit-reference-preference-dna-reasoning-attempt-contract'

export const EDIT_REFERENCE_QWEN_DNA_REVIEW_VERSION = 'edit-reference-qwen-dna-review-v1' as const
export const EDIT_REFERENCE_QWEN_DNA_APPROVAL_REQUEST_VERSION = 'edit-reference-qwen-dna-approval-request-v1' as const
export const EDIT_REFERENCE_QWEN_DNA_APPROVAL_VERSION = 'edit-reference-qwen-dna-approval-v1' as const

export function createEditReferencePreferenceDnaReasoningReviewSummary(input: {
  version: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord
}): PreferenceDNAReasoningReviewSummary {
  assertReasoningApprovalInputs(input)
  const provenance = input.version.reasoningProvenance
  if (!provenance) throw invalidReasoningApproval('The AI-assisted review provenance is unavailable.')
  return {
    schemaVersion: EDIT_REFERENCE_QWEN_DNA_REVIEW_VERSION,
    sourceLabel: 'AI-assisted synthesis',
    overallConfidence: input.version.overallConfidence,
    overallConfidenceBand: input.version.overallConfidenceBand,
    missingEvidenceKinds: [...provenance.missingEvidenceKinds],
    limitations: [...provenance.limitations],
    requiresUserReview: provenance.candidateRequiresUserReview
      || provenance.missingEvidenceKinds.length > 0
      || provenance.limitations.length > 0
      || input.qaResult.status === 'requires_user_review',
    approvalBindingDigestSha256: calculateEditReferencePreferenceDnaApprovalBinding(input),
  }
}

export function createEditReferencePreferenceDnaReasoningApprovalSnapshot(input: {
  version: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord
  acknowledgement: PreferenceDNAReasoningReviewAcknowledgementRequest | undefined
}): PreferenceDNAReasoningApprovalSnapshot {
  const summary = createEditReferencePreferenceDnaReasoningReviewSummary(input)
  const acknowledgement = input.acknowledgement
  if (
    !acknowledgement
    || acknowledgement.schemaVersion !== EDIT_REFERENCE_QWEN_DNA_APPROVAL_REQUEST_VERSION
    || acknowledgement.expectedApprovalBindingDigestSha256 !== summary.approvalBindingDigestSha256
    || acknowledgement.acknowledgeAiAssistedSynthesis !== true
    || acknowledgement.acknowledgeConfidenceAndLimitations !== true
  ) {
    throw invalidReasoningApproval('Review and acknowledge the AI-assisted confidence and limitations for this exact version before approval.')
  }
  const immutableContent = {
    schemaVersion: EDIT_REFERENCE_QWEN_DNA_APPROVAL_VERSION,
    approvalBindingDigestSha256: summary.approvalBindingDigestSha256,
    sourceLabel: summary.sourceLabel,
    confidenceAtApproval: summary.overallConfidence,
    confidenceBandAtApproval: summary.overallConfidenceBand,
    missingEvidenceCount: summary.missingEvidenceKinds.length,
    limitationCount: summary.limitations.length,
    acknowledgedAiAssistedSynthesis: true as const,
    acknowledgedConfidenceAndLimitations: true as const,
    acknowledgedDeterministicQA: true as const,
  }
  return {
    ...immutableContent,
    contentDigestSha256: sha256(stableStringify(immutableContent)),
  }
}

export function validateEditReferencePreferenceDnaReasoningApprovalSnapshot(input: {
  version: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord
  snapshot: PreferenceDNAReasoningApprovalSnapshot
}): void {
  const summary = createEditReferencePreferenceDnaReasoningReviewSummary(input)
  const immutableContent = {
    schemaVersion: input.snapshot.schemaVersion,
    approvalBindingDigestSha256: input.snapshot.approvalBindingDigestSha256,
    sourceLabel: input.snapshot.sourceLabel,
    confidenceAtApproval: input.snapshot.confidenceAtApproval,
    confidenceBandAtApproval: input.snapshot.confidenceBandAtApproval,
    missingEvidenceCount: input.snapshot.missingEvidenceCount,
    limitationCount: input.snapshot.limitationCount,
    acknowledgedAiAssistedSynthesis: input.snapshot.acknowledgedAiAssistedSynthesis,
    acknowledgedConfidenceAndLimitations: input.snapshot.acknowledgedConfidenceAndLimitations,
    acknowledgedDeterministicQA: input.snapshot.acknowledgedDeterministicQA,
  }
  if (
    input.snapshot.schemaVersion !== EDIT_REFERENCE_QWEN_DNA_APPROVAL_VERSION
    || input.snapshot.approvalBindingDigestSha256 !== summary.approvalBindingDigestSha256
    || input.snapshot.sourceLabel !== summary.sourceLabel
    || input.snapshot.confidenceAtApproval !== summary.overallConfidence
    || input.snapshot.confidenceBandAtApproval !== summary.overallConfidenceBand
    || input.snapshot.missingEvidenceCount !== summary.missingEvidenceKinds.length
    || input.snapshot.limitationCount !== summary.limitations.length
    || input.snapshot.acknowledgedAiAssistedSynthesis !== true
    || input.snapshot.acknowledgedConfidenceAndLimitations !== true
    || input.snapshot.acknowledgedDeterministicQA !== true
    || input.snapshot.contentDigestSha256 !== sha256(stableStringify(immutableContent))
  ) throw new Error('AI-assisted Preference DNA approval snapshot is invalid.')
}

function calculateEditReferencePreferenceDnaApprovalBinding(input: {
  version: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord
}): string {
  return sha256(stableStringify({
    schemaVersion: 'edit-reference-qwen-dna-approval-binding-v1',
    dnaVersionId: input.version.id,
    dnaVersionNumber: input.version.version,
    dnaContentDigestSha256: input.version.contentDigest,
    inputEvidenceDigestSha256: input.version.inputEvidenceDigest,
    overallConfidence: input.version.overallConfidence,
    overallConfidenceBand: input.version.overallConfidenceBand,
    reasoningProvenance: input.version.reasoningProvenance,
    qaResultId: input.qaResult.id,
    qaVersion: input.qaResult.qaVersion,
    qaContentDigestSha256: input.qaResult.contentDigest,
    qaStatus: input.qaResult.status,
  }))
}

function assertReasoningApprovalInputs(input: {
  version: PreferenceDNAVersionRecord
  qaResult: PreferenceDNAQAResultRecord
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord
}): void {
  try {
    validateEditReferenceQwenDnaVersionAttemptBinding(input.version, input.attempt)
  } catch {
    throw invalidReasoningApproval('The AI-assisted review is no longer bound to its exact evidence and reasoning result.')
  }
  const providerCheck = input.qaResult.checks.find((check) => check.checkId === 'provider_provenance')
  if (
    input.version.synthesisVersion !== 'edit-reference-qwen-dna-synthesis-v1'
    || input.version.qaResultId !== input.qaResult.id
    || input.version.qaStatus !== input.qaResult.status
    || input.qaResult.qaVersion !== 'edit-reference-dna-qa-v2'
    || input.qaResult.dnaVersionId !== input.version.id
    || input.qaResult.dnaContentDigest !== input.version.contentDigest
    || input.qaResult.status === 'blocked'
    || input.qaResult.blockingCheckIds.length > 0
    || !providerCheck
    || providerCheck.status === 'blocked'
  ) throw invalidReasoningApproval('The exact AI-assisted version has not passed deterministic provenance and safety review.')
}

function invalidReasoningApproval(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
