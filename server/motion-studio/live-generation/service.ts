import {
  motionStudioDeterministicRouteCandidateV1Schema,
  motionStudioDeterministicRouteReviewV1Schema,
  motionStudioCurrencyExchangeRateSnapshotSchema,
  motionStudioMs010BExecutionAuthorityV1Schema,
  motionStudioMs010BFallbackEligibilityV1Schema,
  motionStudioMs010BOwnerAuthorizationV1Schema,
  motionStudioMs010BRetentionPolicyV1Schema,
  motionStudioMs010BStopPolicyV1Schema,
  motionStudioProviderNativeRateSnapshotSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioDeterministicRouteCandidateV1,
  MotionStudioDeterministicRouteReviewV1,
  MotionStudioCurrencyExchangeRateSnapshot,
  MotionStudioMs010BExecutionAuthorityV1,
  MotionStudioMs010BFallbackEligibilityV1,
  MotionStudioMs010BOwnerAuthorizationV1,
  MotionStudioMs010BRetentionPolicyV1,
  MotionStudioMs010BStopPolicyV1,
  MotionStudioProviderNativeRateSnapshot,
  ReviewMotionStudioLiveCandidateRequest,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createSingleUseTransportPermit } from '../generation/bounded-provider-transport'
import { hashMotionStudioLeaseCredential } from '../jobs/service'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { createSupabaseMotionStudioLiveGenerationRepository } from './repository'
import type {
  MotionStudioLiveGenerationRepository,
  MotionStudioLiveFollowupCallPurpose,
  MotionStudioLiveFollowupResultStatus,
  MotionStudioLiveOperationKind,
  MotionStudioLiveOperationRow,
  MotionStudioLiveProviderEventRow,
} from './types'

const LOCAL_WARNING = 'MS-010B live authority is persisted locally, but this service never resolves credentials, invokes provider transport, retries, purchases, bills customers, prices ReeditPro service fees, or mutates customer credits.'

export const MOTION_STUDIO_LIVE_EXECUTION_BOUNDARY = Object.freeze({
  providerCallMade: false as const,
  automaticRetryAllowed: false as const,
  automaticProviderSubmissionAllowed: false as const,
  automaticPurchaseAllowed: false as const,
  customerBillingAuthorized: false as const,
  customerPricingIncluded: false as const,
  customerCreditsIncluded: false as const,
})

export class MotionStudioLiveGenerationService {
  private readonly actorUserId: string
  private readonly repository: MotionStudioLiveGenerationRepository

  constructor(context: ServiceContext, repository?: MotionStudioLiveGenerationRepository) {
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioLiveGenerationRepository(ensureAdminClient(context))
  }

  async getWorkspace(productionId: string) {
    const [workspace, deterministicReplacement] = await Promise.all([
      this.repository.getWorkspace({ productionId, actorUserId: this.actorUserId }),
      this.repository.getDeterministicAcceptance({ productionId, actorUserId: this.actorUserId }),
    ])
    return boundaryResult({
      liveGenerationWorkspace: {
        ...workspace,
        ...(deterministicReplacement ? { deterministicReplacement } : {}),
      },
    })
  }

  async acceptDeterministicRoute(input: {
    productionId: string
    approvedSnapshotId: string
    candidate: MotionStudioDeterministicRouteCandidateV1
    review: MotionStudioDeterministicRouteReviewV1
    reviewedAt: string
    idempotencyKey: string
  }) {
    const candidate = parseContract(
      motionStudioDeterministicRouteCandidateV1Schema,
      input.candidate,
      'deterministic route candidate',
    )
    const review = parseContract(
      motionStudioDeterministicRouteReviewV1Schema,
      input.review,
      'deterministic route owner review',
    )
    if (
      candidate.productionId !== input.productionId ||
      candidate.approvedSnapshotId !== input.approvedSnapshotId
    ) blocked('Deterministic route acceptance must bind the exact production and approved snapshot.')
    const reviewedAt = new Date(input.reviewedAt).toISOString()
    const path = `/v1/internal/motion-studio/productions/${input.productionId}/deterministic-route-acceptance`
    const requestHash = requestDigest('POST', path, {
      approvedSnapshotId: input.approvedSnapshotId,
      candidate,
      review,
      reviewedAt,
    })
    const acceptance = await this.repository.acceptDeterministicRoute({
      productionId: input.productionId,
      approvedSnapshotId: input.approvedSnapshotId,
      candidate,
      review,
      reviewedAt,
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    return boundaryResult({ deterministicRouteAcceptance: acceptance })
  }

  async createAuthorization(input: {
    productionId: string
    approvedSnapshotId: string
    authorization: MotionStudioMs010BOwnerAuthorizationV1
    retentionPolicy: MotionStudioMs010BRetentionPolicyV1
    stopPolicy: MotionStudioMs010BStopPolicyV1
  }) {
    const authorization = parseContract(
      motionStudioMs010BOwnerAuthorizationV1Schema,
      input.authorization,
      'MS-010B owner authorization',
    )
    const retentionPolicy = parseContract(
      motionStudioMs010BRetentionPolicyV1Schema,
      input.retentionPolicy,
      'MS-010B retention policy',
    )
    const stopPolicy = parseContract(
      motionStudioMs010BStopPolicyV1Schema,
      input.stopPolicy,
      'MS-010B stop policy',
    )
    if (
      authorization.productionId !== input.productionId ||
      authorization.approvedSnapshotId !== input.approvedSnapshotId
    ) blocked('Owner authorization must match the exact production and approved snapshot.')
    const row = await this.repository.createAuthorization({
      productionId: input.productionId,
      approvedSnapshotId: input.approvedSnapshotId,
      authorization,
      retentionPolicy,
      stopPolicy,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ authorization: row })
  }

  async createProviderNativeRate(input: {
    authorizationId: string
    rate: MotionStudioProviderNativeRateSnapshot
  }) {
    const rate = parseContract(
      motionStudioProviderNativeRateSnapshotSchema,
      input.rate,
      'provider-native rate snapshot',
    )
    const row = await this.repository.createProviderNativeRate({
      authorizationId: input.authorizationId,
      rate,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ rateSnapshot: row })
  }

  async createCurrencyExchangeRate(input: {
    authorizationId: string
    rate: MotionStudioCurrencyExchangeRateSnapshot
  }) {
    const rate = parseContract(
      motionStudioCurrencyExchangeRateSnapshotSchema,
      input.rate,
      'CNY-to-USD rate snapshot',
    )
    const row = await this.repository.createCurrencyExchangeRate({
      authorizationId: input.authorizationId,
      rate,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ currencyExchangeRateSnapshot: row })
  }

  async createExecutionAuthority(input: {
    authorizationId: string
    wanNativeRateSnapshotId: string
    wanFxSnapshotId: string | null
    authority: MotionStudioMs010BExecutionAuthorityV1
  }) {
    const authority = parseContract(
      motionStudioMs010BExecutionAuthorityV1Schema,
      input.authority,
      'MS-010B execution authority',
    )
    if (
      authority.wanProviderNativeRateSnapshotId !== input.wanNativeRateSnapshotId ||
      authority.wanCurrencyExchangeRateSnapshotId !== input.wanFxSnapshotId
    ) blocked('Execution authority must bind the exact Wan rate and FX snapshots.')
    const row = await this.repository.createExecutionAuthority({
      authorizationId: input.authorizationId,
      wanNativeRateSnapshotId: input.wanNativeRateSnapshotId,
      wanFxSnapshotId: input.wanFxSnapshotId,
      authority,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ executionAuthority: row })
  }

  async createOperation(input: {
    executionAuthorityId: string
    operationId: string
    operationKind: MotionStudioLiveOperationKind
    jobId: string
    requestDigest: string
    dependencyOperationId?: string
    inputMediaAssetVersionId?: string
    fallbackEligibilityId?: string
    manualInvocationId?: string
  }) {
    assertDigest(input.requestDigest, 'requestDigest')
    assertOperationDependencyShape(input)
    const operation = await this.repository.createOperation({
      ...input,
      actorUserId: this.actorUserId,
    })
    assertOperationResult(input, operation)
    return boundaryResult({ operation })
  }

  async issuePermit(input: {
    operationId: string
    permitId: string
    leaseId: string
    leaseCredential: string
    executionAuthorityId: string
    executionAuthorityDigest: string
    providerAdapterId: MotionStudioLiveOperationRow['provider_adapter_id']
    requestDigest: string
    credentialReferenceId: string
    issuedAt: string
    expiresAt: string
  }) {
    assertDigest(input.executionAuthorityDigest, 'executionAuthorityDigest')
    assertDigest(input.requestDigest, 'requestDigest')
    const transportPermit = createSingleUseTransportPermit({
      permitId: input.permitId,
      executionAuthorityId: input.executionAuthorityId,
      executionAuthorityDigest: input.executionAuthorityDigest,
      operationId: input.operationId,
      providerAdapterId: input.providerAdapterId,
      requestDigest: input.requestDigest,
      credentialReferenceId: input.credentialReferenceId,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
    })
    const credentialBindingDigest = sha256CanonicalJson({
      executionAuthorityId: input.executionAuthorityId,
      executionAuthorityDigest: input.executionAuthorityDigest,
      providerAdapterId: input.providerAdapterId,
      credentialReferenceId: input.credentialReferenceId,
    })
    const persisted = await this.repository.issuePermit({
      operationId: input.operationId,
      permitId: input.permitId,
      leaseId: input.leaseId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      credentialBindingDigest,
      permitDigest: transportPermit.permitDigest,
      expiresAt: input.expiresAt,
      actorUserId: this.actorUserId,
    })
    if (
      persisted.operationId !== input.operationId ||
      persisted.permit.permit_digest !== transportPermit.permitDigest ||
      persisted.permit.request_digest !== input.requestDigest ||
      persisted.permit.credential_binding_digest !== credentialBindingDigest
    ) internalInvalid('Persisted live permit does not match the exact compiled transport permit.')
    return boundaryResult({ permit: persisted.permit, transportPermit })
  }

  async consumePermit(input: {
    permitId: string
    leaseId: string
    leaseCredential: string
    requestDigest: string
  }) {
    assertDigest(input.requestDigest, 'requestDigest')
    const consumption = await this.repository.consumePermit({
      permitId: input.permitId,
      leaseId: input.leaseId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      requestDigest: input.requestDigest,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ consumption })
  }

  async consumeFollowupCall(input: {
    operationId: string
    callId: string
    callPurpose: MotionStudioLiveFollowupCallPurpose
    callSequence: number
    leaseId: string
    leaseCredential: string
    executionAuthorityId: string
    executionAuthorityDigest: string
    providerAdapterId: MotionStudioLiveOperationRow['provider_adapter_id']
    requestDigest: string
    credentialReferenceId: string
    issuedAt: string
    expiresAt: string
  }) {
    assertDigest(input.executionAuthorityDigest, 'executionAuthorityDigest')
    assertDigest(input.requestDigest, 'requestDigest')
    if (input.providerAdapterId === 'openai_gpt_image_2_live_v1') {
      blocked('Synchronous GPT Image operations cannot create asynchronous follow-up calls.')
    }
    if (input.callPurpose === 'file_retrieve' && input.providerAdapterId !== 'minimax_hailuo_2_3_fast_i2v_live_v1') {
      blocked('File retrieval is valid only for the Hailuo asynchronous flow.')
    }
    if (!Number.isSafeInteger(input.callSequence) || input.callSequence < 1 || input.callSequence > 20) {
      blocked('Follow-up call sequence must be between 1 and 20.')
    }
    const transportPermit = createSingleUseTransportPermit({
      permitId: input.callId,
      executionAuthorityId: input.executionAuthorityId,
      executionAuthorityDigest: input.executionAuthorityDigest,
      operationId: input.operationId,
      providerAdapterId: input.providerAdapterId,
      requestDigest: input.requestDigest,
      credentialReferenceId: input.credentialReferenceId,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
    })
    const credentialBindingDigest = sha256CanonicalJson({
      executionAuthorityId: input.executionAuthorityId,
      executionAuthorityDigest: input.executionAuthorityDigest,
      providerAdapterId: input.providerAdapterId,
      credentialReferenceId: input.credentialReferenceId,
    })
    const consumed = await this.repository.consumeFollowupCall({
      operationId: input.operationId,
      callId: input.callId,
      callPurpose: input.callPurpose,
      callSequence: input.callSequence,
      leaseId: input.leaseId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      credentialBindingDigest,
      requestDigest: input.requestDigest,
      permitDigest: transportPermit.permitDigest,
      expiresAt: input.expiresAt,
      actorUserId: this.actorUserId,
    })
    if (
      consumed.followupCall.id !== input.callId ||
      consumed.followupCall.operation_id !== input.operationId ||
      consumed.followupCall.call_purpose !== input.callPurpose ||
      consumed.followupCall.call_sequence !== input.callSequence ||
      consumed.followupCall.request_digest !== input.requestDigest ||
      consumed.followupCall.permit_digest !== transportPermit.permitDigest ||
      consumed.maximumNetworkCalls !== 1 || consumed.automaticRetryAllowed || consumed.automaticLoopAllowed
    ) internalInvalid('Persisted follow-up call does not match the exact single-use transport permit.')
    return boundaryResult({ followupCall: consumed.followupCall, transportPermit, automaticLoopAllowed: false as const })
  }

  async recordFollowupCallResult(input: {
    callId: string
    leaseCredential: string
    resultStatus: MotionStudioLiveFollowupResultStatus
    eventDigest: string
    responseDigest: string
    occurredAt: string
  }) {
    assertDigest(input.eventDigest, 'eventDigest')
    assertDigest(input.responseDigest, 'responseDigest')
    const result = await this.repository.recordFollowupCallResult({
      callId: input.callId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      resultStatus: input.resultStatus,
      eventDigest: input.eventDigest,
      responseDigest: input.responseDigest,
      occurredAt: input.occurredAt,
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ followupResult: result })
  }

  async recordProviderEvent(input: {
    operationId: string
    eventSource: MotionStudioLiveProviderEventRow['event_source']
    normalizedStatus: MotionStudioLiveProviderEventRow['normalized_status']
    eventDigest: string
    responseDigest: string
    externalOperationIdHash?: string
    providerCostIncurred: boolean
    occurredAt: string
  }) {
    assertDigest(input.eventDigest, 'eventDigest')
    assertDigest(input.responseDigest, 'responseDigest')
    if (input.externalOperationIdHash) assertDigest(input.externalOperationIdHash, 'externalOperationIdHash')
    const event = await this.repository.recordProviderEvent({ ...input, actorUserId: this.actorUserId })
    return boundaryResult({ providerEvent: event })
  }

  async completeCandidate(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    mediaAssetId: string
    mediaAssetVersionId: string
    privateObjectIdentityHash: string
    mediaSha256: string
    byteLength: number
    mimeType: 'image/png' | 'video/mp4'
    width: number
    height: number
    durationFrames?: number
    fpsNumerator?: number
    fpsDenominator?: number
    provenanceDigest: string
    qaEvidenceDigest: string
    safetyStatus: 'passed' | 'review_required'
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    idempotencyKey: string
  }) {
    for (const [field, digest] of Object.entries({
      privateObjectIdentityHash: input.privateObjectIdentityHash,
      mediaSha256: input.mediaSha256,
      provenanceDigest: input.provenanceDigest,
      qaEvidenceDigest: input.qaEvidenceDigest,
      outcomeDigest: input.outcomeDigest,
    })) assertDigest(digest, field)
    const requestBody = { ...input, leaseCredential: undefined }
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${input.operationId}/candidates`,
      requestBody,
    )
    const candidate = await this.repository.completeCandidate({
      operationId: input.operationId,
      leaseId: input.leaseId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      mediaAssetId: input.mediaAssetId,
      mediaAssetVersionId: input.mediaAssetVersionId,
      privateObjectIdentityHash: input.privateObjectIdentityHash,
      mediaSha256: input.mediaSha256,
      byteLength: input.byteLength,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
      ...(input.durationFrames === undefined ? {} : { durationFrames: input.durationFrames }),
      ...(input.fpsNumerator === undefined ? {} : { fpsNumerator: input.fpsNumerator }),
      ...(input.fpsDenominator === undefined ? {} : { fpsDenominator: input.fpsDenominator }),
      provenanceDigest: input.provenanceDigest,
      qaEvidenceDigest: input.qaEvidenceDigest,
      safetyStatus: input.safetyStatus,
      usage: input.usage,
      outcomeDigest: input.outcomeDigest,
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    return boundaryResult(candidate)
  }

  async recoverCandidate(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    providerSourceMediaSha256: string
    readyResponseDigest: string
    failedDownloadResponseDigest: string
    mediaAssetId: string
    mediaAssetVersionId: string
    privateObjectIdentityHash: string
    mediaSha256: string
    byteLength: number
    mimeType: 'video/mp4'
    width: number
    height: number
    durationFrames: number
    fpsNumerator: number
    fpsDenominator: number
    provenanceDigest: string
    qaEvidenceDigest: string
    safetyStatus: 'passed' | 'review_required'
    usage: readonly MotionStudioAttemptUsageLine[]
    recoveryEvidenceDigest: string
    outcomeDigest: string
    occurredAt: string
    idempotencyKey: string
  }) {
    for (const [field, digest] of Object.entries({
      providerSourceMediaSha256: input.providerSourceMediaSha256,
      readyResponseDigest: input.readyResponseDigest,
      failedDownloadResponseDigest: input.failedDownloadResponseDigest,
      privateObjectIdentityHash: input.privateObjectIdentityHash,
      mediaSha256: input.mediaSha256,
      provenanceDigest: input.provenanceDigest,
      qaEvidenceDigest: input.qaEvidenceDigest,
      recoveryEvidenceDigest: input.recoveryEvidenceDigest,
      outcomeDigest: input.outcomeDigest,
    })) assertDigest(digest, field)
    const requestBody = { ...input, leaseCredential: undefined }
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${input.operationId}/local-media-recovery`,
      requestBody,
    )
    const candidate = await this.repository.recoverCandidate({
      ...input,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      actorUserId: this.actorUserId,
      requestHash,
    })
    return boundaryResult(candidate)
  }

  async finishAttempt(input: {
    operationId: string
    leaseId: string
    leaseCredential: string
    outcome: 'failed' | 'cancelled'
    failureCategory?: string
    usage: readonly MotionStudioAttemptUsageLine[]
    outcomeDigest: string
    idempotencyKey: string
  }) {
    assertDigest(input.outcomeDigest, 'outcomeDigest')
    if (input.outcome === 'failed' && !input.failureCategory) {
      blocked('Failed live operations require an exact failure category.')
    }
    if (input.outcome === 'cancelled' && input.failureCategory) {
      blocked('Cancelled live operations cannot carry a failure category.')
    }
    const requestBody = { ...input, leaseCredential: undefined }
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/job-leases/${input.leaseId}/live-operations/${input.operationId}/attempt-result`,
      requestBody,
    )
    const result = await this.repository.finishAttempt({
      operationId: input.operationId,
      leaseId: input.leaseId,
      credentialHash: hashMotionStudioLeaseCredential(input.leaseCredential),
      outcome: input.outcome,
      ...(input.failureCategory ? { failureCategory: input.failureCategory } : {}),
      usage: input.usage,
      outcomeDigest: input.outcomeDigest,
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    return boundaryResult({ terminalAttempt: result })
  }

  async reconcileAttempt(input: {
    operationId: string
    decision: 'no_side_effect' | 'side_effect_observed' | 'manual_review'
    usage: readonly MotionStudioAttemptUsageLine[]
    evidenceDigest: string
    idempotencyKey: string
  }) {
    assertDigest(input.evidenceDigest, 'evidenceDigest')
    if (input.decision === 'side_effect_observed' ? input.usage.length === 0 : input.usage.length !== 0) {
      blocked('Only an observed provider side effect may carry exact reconciliation usage.')
    }
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${input.operationId}/reconciliation`,
      input,
    )
    const result = await this.repository.reconcileAttempt({
      ...input,
      actorUserId: this.actorUserId,
      requestHash,
    })
    return boundaryResult({ reconciliation: result })
  }

  async reviewCandidate(input: {
    candidateId: string
    decision: 'approved' | 'rejected'
    rejectionCategory?: 'reference_adherence' | 'continuity' | 'visual_artifact' | 'intent_alignment' | 'safety'
    qaEvidenceArtifactId: string
    qaEvidenceVersionId: string
    qaEvidenceContentDigest: string
    reviewDigest: string
    fallbackEligibility?: MotionStudioMs010BFallbackEligibilityV1
  }) {
    assertDigest(input.qaEvidenceContentDigest, 'qaEvidenceContentDigest')
    assertDigest(input.reviewDigest, 'reviewDigest')
    let fallbackEligibility: MotionStudioMs010BFallbackEligibilityV1 | undefined
    if (input.fallbackEligibility) {
      fallbackEligibility = parseContract(
        motionStudioMs010BFallbackEligibilityV1Schema,
        input.fallbackEligibility,
        'manual-only Hailuo fallback eligibility',
      )
    }
    if (input.decision === 'approved' && (input.rejectionCategory || fallbackEligibility)) {
      blocked('Approved candidates cannot create fallback authority.')
    }
    if (input.decision === 'rejected' && !input.rejectionCategory) {
      blocked('Rejected candidates require an explicit QA rejection category.')
    }
    if (fallbackEligibility && fallbackEligibility.primaryCandidateId !== input.candidateId) {
      blocked('Fallback eligibility must bind the exact rejected Wan candidate.')
    }
    const review = await this.repository.reviewCandidate({
      ...input,
      ...(fallbackEligibility ? { fallbackEligibility } : {}),
      actorUserId: this.actorUserId,
    })
    return boundaryResult({ candidateReview: review })
  }

  async reviewCandidateByOwner(input: {
    candidateId: string
    review: ReviewMotionStudioLiveCandidateRequest
    idempotencyKey: string
  }) {
    const reviewedAt = new Date().toISOString()
    const path = `/v1/motion-studio/live-candidates/${input.candidateId}/human-reviews`
    const requestHash = requestDigest('POST', path, input.review)
    const result = await this.repository.reviewCandidateByOwner({
      candidateId: input.candidateId,
      review: input.review,
      reviewedAt,
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    return boundaryResult({
      candidateReview: {
        decision: result.review.decision,
        ...(result.review.rejection_category ? { rejectionCategory: result.review.rejection_category } : {}),
        reviewedAt: result.review.reviewed_at,
      },
      liveGenerationWorkspace: result.workspace,
      automaticFallbackSubmitted: result.automaticFallbackSubmitted,
    })
  }
}

export function createMotionStudioLiveGenerationService(context: ServiceContext) {
  return new MotionStudioLiveGenerationService(context)
}

function boundaryResult<T extends Record<string, unknown>>(data: T) {
  return {
    data: { ...data, executionBoundary: MOTION_STUDIO_LIVE_EXECUTION_BOUNDARY },
    warnings: [LOCAL_WARNING],
  }
}

function parseContract<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }, value: unknown, label: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `${label} is invalid.`, 400)
  return parsed.data
}

function assertOperationDependencyShape(input: {
  operationKind: MotionStudioLiveOperationKind
  dependencyOperationId?: string
  inputMediaAssetVersionId?: string
  fallbackEligibilityId?: string
  manualInvocationId?: string
}): void {
  if (input.operationKind === 'gpt_image_generation') {
    if (input.dependencyOperationId || input.inputMediaAssetVersionId || input.fallbackEligibilityId || input.manualInvocationId) {
      blocked('GPT Image generation cannot carry dependency or fallback authority.')
    }
    return
  }
  if (!input.dependencyOperationId || !input.inputMediaAssetVersionId) {
    blocked('Dependent live operations require an exact prior operation and immutable input asset version.')
  }
  if (input.operationKind === 'hailuo_image_to_video_fallback') {
    if (!input.fallbackEligibilityId || !input.manualInvocationId) {
      blocked('Hailuo requires persisted Wan QA rejection and a separate manual invocation.')
    }
  } else if (input.fallbackEligibilityId || input.manualInvocationId) {
    blocked('Fallback authority is valid only for the conditional Hailuo operation.')
  }
}

function assertOperationResult(input: {
  executionAuthorityId: string
  operationId: string
  operationKind: MotionStudioLiveOperationKind
  jobId: string
  requestDigest: string
}, operation: MotionStudioLiveOperationRow): void {
  if (
    operation.id !== input.operationId ||
    operation.execution_authority_id !== input.executionAuthorityId ||
    operation.operation_kind !== input.operationKind ||
    operation.job_id !== input.jobId ||
    operation.request_digest !== input.requestDigest ||
    operation.call_count !== 0 ||
    operation.state !== 'created'
  ) internalInvalid('Persisted live operation does not match the exact immutable request authority.')
}

function assertDigest(value: string, field: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a lowercase SHA-256 digest.`, 400)
  }
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'MS-010B durable authority requires a verified bearer identity.', 401)
  }
  return userId
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function internalInvalid(message: string): never {
  throw new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
