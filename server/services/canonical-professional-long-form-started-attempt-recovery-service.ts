import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  describePrivateInternalAttemptCostEvidence,
  finalizePrivateInternalAttemptCostEvidenceForBoundedDuration,
  readPrivateInternalAttemptCostEvidence,
  type BeginPrivateInternalAttemptCostEvidenceInput,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
  type CanonicalProfessionalLongFormCurrentChildPackageAuthority,
} from './canonical-professional-long-form-child-package-promotion-service'
import {
  reconcilePrivateCanonicalPackageWorkQueueProfessionalLongFormAttemptFailure,
} from './private-canonical-package-work-queue-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'

export const CANONICAL_PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_RECOVERY_VERSION =
  'canonical-professional-long-form-started-attempt-recovery-v1' as const

export interface CanonicalProfessionalLongFormStartedAttemptRecoveryEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_RECOVERY_VERSION
  source: 'canonical_professional_long_form_started_attempt_recovery_service'
  status: 'failed_started_attempt_reconciled'
  disposition: 'reconciled' | 'exact_replay'
  selectedByServer: true
  jobId: string
  approvedWorkItemId: string
  executionAttemptId: string
  deliveryAttempt: 1 | 2
  failure: NonNullable<
    CanonicalPrivatePackageWorkQueueEntry['professionalLongFormExecutionFailures']
  >[number]
  attemptInternalCostEvidence: PrivateInternalAttemptCostEvidence
  queue: {
    totalJobCount: number
    queuedJobCount: number
    leasedJobCount: number
    completedJobCount: number
    totalDeliveryAttemptCount: number
    expiredClaimRecoveryCount: number
  }
  readiness: {
    exactStartedAttemptReopened: true
    failedAttemptCostRetained: true
    oneUseAttemptTerminallyFenced: true
    sameApprovedOperationRetryRequiresFreshClaim: true
    sameApprovedOperationRetryAvailable: boolean
    userReviewOrNewApprovalRequired: boolean
    automaticRetryStarted: false
    independentJobsMayContinue: true
    approvedSnapshotMutated: false
    customerPriceAuthorityIncluded: false
    customerCreditAuthorityIncluded: false
    serviceFeeAuthorityIncluded: false
    walletMutationAuthorized: false
    billingAuthorized: false
    distributedDatabaseVerified: false
    liveGoogleCloudVerified: false
    productReady: false
    productionReady: false
  }
  evidenceHash: string
}

export function createCanonicalProfessionalLongFormStartedAttemptRecoveryService(
  context: ServiceContext,
) {
  return {
    async reconcileNext(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<CanonicalProfessionalLongFormStartedAttemptRecoveryEvidence | null> {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Long-form recovery selection is server-owned and accepts no job, attempt, lease, cost, retry, or operation fields.',
          400,
        )
      }
      if (!context.auth?.userId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form attempt recovery requires authenticated authority.',
          401,
        )
      }
      const current = await createCanonicalProfessionalLongFormChildPackagePromotionService(
        context,
      ).loadCurrent(input)
      const observedAt = new Date().toISOString()
      const candidate = await selectRecoverableAttempt({
        context,
        current,
        observedAt,
      })
      if (!candidate) return null
      if (candidate.costEvidence?.outcome.status === 'completed') {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'A completed long-form attempt requires artifact and queue completion reconciliation, not retry.',
          503,
          {
            requiredGate:
              'canonical_professional_long_form_completed_attempt_reconciliation',
          },
        )
      }
      const attemptCost = candidate.costEvidence ??
        (await finalizePrivateInternalAttemptCostEvidenceForBoundedDuration(
          candidate.costInput,
          {
            status: 'failed',
            failureCategory: 'timeout',
            outputByteLength: null,
            linkedCanonicalOutcomeHash: null,
            startedAt: candidate.entry.professionalLongFormExecutionAttempt!
              .startedAt,
            finishedAt: candidate.entry.activeClaim!.expiresAt,
          },
        )).evidence
      assertExactCost(candidate, attemptCost)
      const reconciliationObservedAt = new Date().toISOString()
      const reconciled =
        await reconcilePrivateCanonicalPackageWorkQueueProfessionalLongFormAttemptFailure({
          scope: current.scope,
          definition: current.queueDefinition,
          jobId: candidate.entry.definition.jobId,
          executionAttemptId: candidate.entry
            .professionalLongFormExecutionAttempt!.executionAttemptId,
          observedAt: reconciliationObservedAt,
        })
      const attempt = candidate.entry.professionalLongFormExecutionAttempt!
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_STARTED_ATTEMPT_RECOVERY_VERSION,
        source:
          'canonical_professional_long_form_started_attempt_recovery_service' as const,
        status: 'failed_started_attempt_reconciled' as const,
        disposition: reconciled.disposition,
        selectedByServer: true as const,
        jobId: candidate.entry.definition.jobId,
        approvedWorkItemId: candidate.entry.definition.approvedWorkItemId,
        executionAttemptId: attempt.executionAttemptId,
        deliveryAttempt: attempt.deliveryAttempt,
        failure: reconciled.failure,
        attemptInternalCostEvidence: attemptCost,
        queue: {
          totalJobCount: reconciled.aggregate.summary.totalJobCount,
          queuedJobCount: reconciled.aggregate.summary.queuedJobCount,
          leasedJobCount: reconciled.aggregate.summary.leasedJobCount,
          completedJobCount: reconciled.aggregate.summary.completedJobCount,
          totalDeliveryAttemptCount:
            reconciled.aggregate.summary.totalDeliveryAttemptCount,
          expiredClaimRecoveryCount:
            reconciled.aggregate.summary.expiredClaimRecoveryCount,
        },
        readiness: {
          exactStartedAttemptReopened: true as const,
          failedAttemptCostRetained: true as const,
          oneUseAttemptTerminallyFenced: true as const,
          sameApprovedOperationRetryRequiresFreshClaim: true as const,
          sameApprovedOperationRetryAvailable:
            reconciled.failure.retry.queueDisposition === 'retry_available',
          userReviewOrNewApprovalRequired:
            reconciled.failure.retry.queueDisposition !== 'retry_available',
          automaticRetryStarted: false as const,
          independentJobsMayContinue: true as const,
          approvedSnapshotMutated: false as const,
          customerPriceAuthorityIncluded: false as const,
          customerCreditAuthorityIncluded: false as const,
          serviceFeeAuthorityIncluded: false as const,
          walletMutationAuthorized: false as const,
          billingAuthorized: false as const,
          distributedDatabaseVerified: false as const,
          liveGoogleCloudVerified: false as const,
          productReady: false as const,
          productionReady: false as const,
        },
      }
      return {
        ...stablePayload,
        evidenceHash: sha256AuthorityValue(stablePayload),
      }
    },
  }
}

async function selectRecoverableAttempt(input: {
  context: ServiceContext
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  observedAt: string
}): Promise<{
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    activeClaim: NonNullable<CanonicalPrivatePackageWorkQueueEntry['activeClaim']>
    professionalLongFormExecutionAttempt: NonNullable<
      CanonicalPrivatePackageWorkQueueEntry[
        'professionalLongFormExecutionAttempt'
      ]
    >
  }
  costInput: BeginPrivateInternalAttemptCostEvidenceInput
  costEvidence: PrivateInternalAttemptCostEvidence | undefined
} | null> {
  for (const entry of input.current.queueAggregate.entries) {
    if (
      entry.state !== 'leased' ||
      !entry.activeClaim ||
      !entry.professionalLongFormExecutionAttempt
    ) continue
    const narrowedEntry = {
      ...entry,
      activeClaim: entry.activeClaim,
      professionalLongFormExecutionAttempt:
        entry.professionalLongFormExecutionAttempt,
    }
    const costInput = buildCostInput({
      current: input.current,
      entry: narrowedEntry,
    })
    const costEvidence = await readPrivateInternalAttemptCostEvidence({
      localStorageRoot: input.context.env.localStorageRoot,
      workspaceId: input.current.scope.workspaceId,
      projectId: input.current.scope.projectId,
      executionAttemptId:
        entry.professionalLongFormExecutionAttempt.executionAttemptId,
    })
    if (
      costEvidence ||
      Date.parse(entry.activeClaim.expiresAt) <= Date.parse(input.observedAt)
    ) {
      return {
        entry: narrowedEntry,
        costInput,
        costEvidence,
      }
    }
  }
  return null
}

function buildCostInput(input: {
  current: CanonicalProfessionalLongFormCurrentChildPackageAuthority
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    professionalLongFormExecutionAttempt: NonNullable<
      CanonicalPrivatePackageWorkQueueEntry[
        'professionalLongFormExecutionAttempt'
      ]
    >
  }
}): BeginPrivateInternalAttemptCostEvidenceInput {
  const attempt = input.entry.professionalLongFormExecutionAttempt
  const operationId = attempt.operation.operationId
  const toolId = operationId.startsWith('tool.ffmpeg.')
    ? 'ffmpeg'
    : operationId.startsWith('tool.ffprobe.')
      ? 'ffprobe'
      : operationId.startsWith('tool.remotion.')
        ? 'remotion'
        : 'reeditpro_internal'
  const candidate = {
    localStorageRoot: input.current.scope.localStorageRoot,
    workspaceId: input.current.scope.workspaceId,
    projectId: input.current.scope.projectId,
    editSessionId: input.current.scope.editSessionId,
    approvedPlanSnapshotId: input.current.scope.approvedPlanSnapshotId,
    approvedWorkItemId: input.entry.definition.approvedWorkItemId,
    jobId: input.entry.definition.jobId,
    executionAttemptId: attempt.executionAttemptId,
    retryAttempt: attempt.deliveryAttempt,
    toolId,
    operationId,
    workloadProfileId: attempt.operation.attemptCostProfileId,
  } as BeginPrivateInternalAttemptCostEvidenceInput
  describePrivateInternalAttemptCostEvidence(candidate)
  return candidate
}

function assertExactCost(
  candidate: {
    entry: CanonicalPrivatePackageWorkQueueEntry & {
      professionalLongFormExecutionAttempt: NonNullable<
        CanonicalPrivatePackageWorkQueueEntry[
          'professionalLongFormExecutionAttempt'
        ]
      >
    }
    costInput: BeginPrivateInternalAttemptCostEvidenceInput
  },
  evidence: PrivateInternalAttemptCostEvidence,
): void {
  const descriptor = describePrivateInternalAttemptCostEvidence(
    candidate.costInput,
  )
  if (
    evidence.attemptIdentityHash !== descriptor.attemptIdentityHash ||
    evidence.attemptInputHash !== descriptor.attemptInputHash ||
    evidence.identity.jobId !== candidate.entry.definition.jobId ||
    evidence.identity.executionAttemptId !== candidate.entry
      .professionalLongFormExecutionAttempt.executionAttemptId ||
    evidence.outcome.status !== 'failed' ||
    evidence.outcome.failureCategory === 'none' ||
    evidence.linkedCanonicalOutcomeHash !== null
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Professional long-form recovery cost evidence changed from the exact attempt.',
      503,
    )
  }
}
