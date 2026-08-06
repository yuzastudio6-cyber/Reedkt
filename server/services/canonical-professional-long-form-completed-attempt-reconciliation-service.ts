import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  buildProfessionalLongFormCompletionProposal,
  type ProfessionalLongFormCompletionProposal,
} from '../edit-architecture/professional-long-form-completed-attempt-reconciliation-contract'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
  type CanonicalPrivatePackageWorkQueueAggregate,
  type CanonicalPrivatePackageWorkQueueCompletedOutcome,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  readPrivateInternalAttemptCostEvidence,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  readPrivateCanonicalPackageWorkQueue,
  reconcilePrivateCanonicalPackageWorkQueueProfessionalLongFormAttemptCompletion,
  verifyPrivateCanonicalPackageWorkQueueProfessionalLongFormCompletionProposal,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  persistPrivateProfessionalLongFormCompletionProposal,
  readPrivateProfessionalLongFormCompletionProposal,
} from './private-professional-long-form-completion-proposal-store'
import {
  createCanonicalProfessionalLongFormChildPackagePromotionService,
} from './canonical-professional-long-form-child-package-promotion-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_LONG_FORM_COMPLETED_ATTEMPT_RECONCILIATION_VERSION =
  'canonical-professional-long-form-completed-attempt-reconciliation-v1' as const

export type ProfessionalLongFormCompletionFaultStage =
  'after_completion_proposal_persisted'

export interface CanonicalProfessionalLongFormCompletionFaultForSmoke {
  (input: {
    stage: ProfessionalLongFormCompletionFaultStage
    jobId: string
    executionAttemptId: string
    proposalHash: string
  }): void
}

export interface CanonicalProfessionalLongFormCompletedAttemptRecoveryEvidence {
  schemaVersion:
    typeof CANONICAL_PROFESSIONAL_LONG_FORM_COMPLETED_ATTEMPT_RECONCILIATION_VERSION
  source:
    'canonical_professional_long_form_completed_attempt_reconciliation_service'
  status: 'completed_started_attempt_reconciled'
  disposition: 'reconciled' | 'exact_replay'
  selectedByServer: true
  jobId: string
  approvedWorkItemId: string
  executionAttemptId: string
  deliveryAttempt: 1 | 2
  proposalHash: string
  attemptInternalCostEvidence: PrivateInternalAttemptCostEvidence
  queueCompletionHash: string
  queue: {
    totalJobCount: number
    queuedJobCount: number
    leasedJobCount: number
    completedJobCount: number
    totalDeliveryAttemptCount: number
    expiredClaimRecoveryCount: number
  }
  readiness: {
    immutableCompletionProposalReopened: true
    exactTerminalAndArtifactEvidenceReopened: true
    completedAttemptCostReopened: true
    activeOrExpiredClaimCompletedWithoutPlaintextCredential: true
    secondToolExecutionStarted: false
    secondInternalCostAttemptCreated: false
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

export async function completePrivateCanonicalPackageWorkQueueProfessionalLongFormClaim(
  input: {
    scope: CanonicalPrivatePackageWorkQueueStoreScope
    definition: CanonicalPrivatePackageWorkQueueDefinition
    jobId: string
    claimId: string
    claimCredential: string
    outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
    now: string
    faultInjectionForSmoke?:
      CanonicalProfessionalLongFormCompletionFaultForSmoke
  },
): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const outcome = canonicalPrivatePackageWorkQueueCompletedOutcomeSchema.parse(
    input.outcome,
  )
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.definition,
  })
  const entry = queue?.entries.find((candidate) =>
    candidate.definition.jobId === input.jobId)
  const attempt = entry?.professionalLongFormExecutionAttempt
  const authorization = entry?.professionalLongFormExecutionAuthorization
  const claim = entry?.activeClaim
  if (
    !queue || !entry || entry.state !== 'leased' || !attempt ||
    !authorization || !claim || claim.claimId !== input.claimId ||
    attempt.claimId !== claim.claimId ||
    attempt.authorizationId !== authorization.authorizationId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Professional long-form completion requires one exact active execution attempt.',
      503,
    )
  }
  const proposal = buildProfessionalLongFormCompletionProposal({
    identity: {
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
      packageRecordId: input.scope.packageRecordId,
      queueDefinitionHash: input.definition.definitionHash,
      jobId: entry.definition.jobId,
      approvedWorkItemId: entry.definition.approvedWorkItemId,
      workItemKey: entry.definition.workItemKey,
      authorizationId: authorization.authorizationId,
      authorityHash: authorization.authorityHash,
      executionAttemptId: attempt.executionAttemptId,
      executionAttemptHash: attempt.attemptHash,
      executionStartedAt: attempt.startedAt,
      claimId: claim.claimId,
      initialClaimHash: attempt.claimHash,
      claimHashAtProposal: claim.claimHash,
      deliveryAttempt: attempt.deliveryAttempt,
    },
    outcome,
    recordedAt: input.now,
  })
  const verifiedAuthority =
    await verifyPrivateCanonicalPackageWorkQueueProfessionalLongFormCompletionProposal({
      scope: input.scope,
      definition: input.definition,
      proposal,
      observedAt: input.now,
      claimCredential: input.claimCredential,
    })
  const persisted =
    await persistPrivateProfessionalLongFormCompletionProposal({
      scope: input.scope,
      proposal,
    })
  input.faultInjectionForSmoke?.({
    stage: 'after_completion_proposal_persisted',
    jobId: proposal.identity.jobId,
    executionAttemptId: proposal.identity.executionAttemptId,
    proposalHash: proposal.proposalHash,
  })
  const reconciled =
    await reconcilePrivateCanonicalPackageWorkQueueProfessionalLongFormAttemptCompletion({
      scope: input.scope,
      definition: input.definition,
      proposal: persisted.proposal,
      verifiedAuthority,
      observedAt: input.now,
    })
  return reconciled.aggregate
}

export function createCanonicalProfessionalLongFormCompletedAttemptRecoveryService(
  context: ServiceContext,
) {
  return {
    async reconcileNext(input: {
      workspaceId: string
      approvedPlanSnapshotId: string
    }): Promise<
      CanonicalProfessionalLongFormCompletedAttemptRecoveryEvidence | null
    > {
      if (
        !input || typeof input !== 'object' ||
        Object.keys(input).sort().join('|') !==
          'approvedPlanSnapshotId|workspaceId'
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Completed-attempt recovery selection is server-owned and accepts no job, attempt, lease, artifact, cost, or operation fields.',
          400,
        )
      }
      if (!context.auth?.userId) {
        throw new ApiError(
          'AUTH_REQUIRED',
          'Professional long-form completed-attempt recovery requires authenticated authority.',
          401,
        )
      }
      const current =
        await createCanonicalProfessionalLongFormChildPackagePromotionService(
          context,
        ).loadCurrent(input)
      const selected = await selectNextProposal({
        scope: current.scope,
        definition: current.queueDefinition,
        queue: current.queueAggregate,
      })
      if (!selected) return null
      const observedAt = new Date().toISOString()
      const verifiedAuthority =
        await verifyPrivateCanonicalPackageWorkQueueProfessionalLongFormCompletionProposal({
          scope: current.scope,
          definition: current.queueDefinition,
          proposal: selected.proposal,
          observedAt,
        })
      const reconciled =
        await reconcilePrivateCanonicalPackageWorkQueueProfessionalLongFormAttemptCompletion({
          scope: current.scope,
          definition: current.queueDefinition,
          proposal: selected.proposal,
          verifiedAuthority,
          observedAt,
        })
      const costEvidence = await readPrivateInternalAttemptCostEvidence({
        localStorageRoot: current.scope.localStorageRoot,
        workspaceId: current.scope.workspaceId,
        projectId: current.scope.projectId,
        executionAttemptId: selected.proposal.identity.executionAttemptId,
      })
      if (!costEvidence) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'Completed-attempt recovery lost exact internal-cost evidence.',
          503,
        )
      }
      const summary = reconciled.aggregate.summary
      const stablePayload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_LONG_FORM_COMPLETED_ATTEMPT_RECONCILIATION_VERSION,
        source:
          'canonical_professional_long_form_completed_attempt_reconciliation_service' as const,
        status: 'completed_started_attempt_reconciled' as const,
        disposition: reconciled.disposition,
        selectedByServer: true as const,
        jobId: selected.proposal.identity.jobId,
        approvedWorkItemId: selected.proposal.identity.approvedWorkItemId,
        executionAttemptId: selected.proposal.identity.executionAttemptId,
        deliveryAttempt: selected.proposal.identity.deliveryAttempt,
        proposalHash: selected.proposal.proposalHash,
        attemptInternalCostEvidence: costEvidence,
        queueCompletionHash: reconciled.entry.completion.completionHash,
        queue: {
          totalJobCount: summary.totalJobCount,
          queuedJobCount: summary.queuedJobCount,
          leasedJobCount: summary.leasedJobCount,
          completedJobCount: summary.completedJobCount,
          totalDeliveryAttemptCount: summary.totalDeliveryAttemptCount,
          expiredClaimRecoveryCount: summary.expiredClaimRecoveryCount,
        },
        readiness: {
          immutableCompletionProposalReopened: true as const,
          exactTerminalAndArtifactEvidenceReopened: true as const,
          completedAttemptCostReopened: true as const,
          activeOrExpiredClaimCompletedWithoutPlaintextCredential: true as const,
          secondToolExecutionStarted: false as const,
          secondInternalCostAttemptCreated: false as const,
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

async function selectNextProposal(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  queue: CanonicalPrivatePackageWorkQueueAggregate
}): Promise<{
  proposal: ProfessionalLongFormCompletionProposal
} | null> {
  if (input.queue.definitionHash !== input.definition.definitionHash) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Completed-attempt recovery queue definition changed.',
      409,
    )
  }
  for (const entry of input.queue.entries) {
    if (entry.state !== 'leased' || !entry.professionalLongFormExecutionAttempt) {
      continue
    }
    const executionAttemptId =
      entry.professionalLongFormExecutionAttempt.executionAttemptId
    const proposal =
      await readPrivateProfessionalLongFormCompletionProposal({
        scope: input.scope,
        executionAttemptId,
      })
    if (proposal) return { proposal }
    const costEvidence = await readPrivateInternalAttemptCostEvidence({
      localStorageRoot: input.scope.localStorageRoot,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      executionAttemptId,
    })
    if (costEvidence?.outcome.status === 'completed') {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Completed professional long-form cost evidence lacks its immutable completion proposal.',
        503,
        {
          requiredGate:
            'canonical_professional_long_form_completed_attempt_proposal_reconciliation',
        },
      )
    }
  }
  return null
}
