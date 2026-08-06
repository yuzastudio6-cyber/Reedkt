import { ApiError } from '../errors/api-error'
import {
  assertCanonicalServiceIdentityEvidence,
  assertCanonicalCloudDispatchOutboxCurrentAttempt,
  assertCanonicalCloudDispatchWorkerFailureReceiptReplay,
  assertCanonicalCloudDispatchWorkerTimeoutReceiptReplay,
  createCanonicalCloudDispatchControllerReceipt,
  createCanonicalCloudDispatchWorkerCompletionReceipt,
  createCanonicalCloudDispatchWorkerFailureReceipt,
  createCanonicalCloudDispatchWorkerInvocation,
  createCanonicalCloudDispatchWorkerReceipt,
  createCanonicalCloudDispatchWorkerTimeoutReceipt,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  canonicalCloudDispatchWorkerInvocationSchema,
  type CanonicalCloudDispatchOutboxAggregate,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchWorkerCompletionEvidence,
  type CanonicalCloudDispatchWorkerFailureEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  assertCanonicalVerifiedServiceIdentity,
  type CanonicalVerifiedServiceIdentity,
} from '../security/canonical-service-identity-verifier'
import {
  readPrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  readPrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  acceptPrivateCanonicalCloudDispatchController,
  acceptPrivateCanonicalCloudDispatchWorker,
  readPrivateCanonicalCloudDispatchOutbox,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt,
} from './private-canonical-package-cloud-dispatch-transaction-store'
import {
  reconcilePrivateCanonicalCloudDispatchCompletion,
} from './private-canonical-cloud-dispatch-completion-transaction-store'
import {
  reconcilePrivateCanonicalCloudDispatchFailure,
} from './private-canonical-cloud-dispatch-failure-transaction-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import {
  finalizePrivateCanonicalCloudDispatchTimedOutAttemptCost,
  readPrivateCanonicalCloudDispatchAttemptStart,
  recordPrivateCanonicalCloudDispatchAttemptStart,
} from './private-canonical-cloud-dispatch-attempt-start-store'
import {
  reconcilePrivateCanonicalCloudDispatchTimeout,
} from './private-canonical-cloud-dispatch-timeout-transaction-store'
import {
  withCanonicalPrivatePackageStateLock,
  type CanonicalPrivatePackageStateFaultStage,
} from './private-canonical-package-state-transaction'

export interface CanonicalPrivateCloudDispatchReceiverEvidence {
  aggregateHash: string
  totalEntryCount: number
  pendingControllerDeliveryCount: number
  controllerIdentityAcceptedCount: number
  workerIdentityAcceptedCount: number
  workerCompletionReconciledCount: number
  workerFailureReconciledCount: number
  workerTimeoutReconciledCount: number
  hostRestartRecoveryAvailable: true
  exactPackageAttemptRevalidatedAtEveryReceiver: true
  exactIdentityIssuerPrincipalAudienceAndExpiryRequired: true
  taskRedeliveryReplaysWithoutAnotherExecutionAttempt: true
  rawBearerTokenPersisted: false
  rawMediaPromptPathSignedUrlOrCredentialPersisted: false
  processBrandedVerifiedIdentityRequired: true
  cryptographicJwksVerifierCoreAvailable: true
  packageQueueOwnsApprovedAttempts: true
  packageAttemptSelectedByServer: true
  cooperativeCrossProcessPackageLockVerified: true
  singleHostCrashConsistentQueueClaimAndOutboxCommitVerified: true
  committedTransactionRecoveryVerified: true
  workerCompletionReconciliationVerified: true
  completionQueueAndOutboxWriteAheadCommitVerified: true
  workerFailureReconciliationVerified: true
  failureQueueAndOutboxWriteAheadCommitVerified: true
  acceptedWorkerTimeoutReconciliationVerified: true
  timeoutQueueAndOutboxWriteAheadCommitVerified: true
  timeoutAttemptCostEvidenceLoadedFromPrivateStore: true
  durableAttemptStartCostBindingVerified: true
  controllerOwnedTimeoutFinalizerVerified: true
  automaticTimeoutRetryStarted: false
  distributedWorkerDeathObserverVerified: false
  callerSuppliedTimeoutCostHashAccepted: false
  crossProcessAtomicClaimProven: true
  distributedOutboxTransactionVerified: false
  liveGoogleOidcAndIamVerified: false
  cloudTaskCreated: false
  cloudRunJobExecuted: false
  workerExecutionAuthorized: false
  cloudDispatchAuthorized: false
  productionAuthority: false
}

export interface CanonicalPrivateCloudDispatchTimeoutFinalizerResult {
  status: 'no_expired_attempts' | 'completed' | 'blocked'
  observedAt: string
  expiredCandidateCount: number
  selectedCandidateCount: number
  reconciledCount: number
  exactReplayCount: number
  blockedCount: number
  unresolvedCandidateCount: number
  outcomes: Array<{
    dispatchIntentId: string
    disposition: 'reconciled' | 'exact_replay' | 'blocked'
    requiredGate: string | null
    durableAttemptStartEvidenceHash: string | null
    attemptInternalCostEvidenceHash: string | null
    terminalCostCreatedByFinalizer: boolean
  }>
  boundaries: {
    packageScopeSelectedByServer: true
    dispatchIntentSelectedByController: true
    durableAttemptStartRequired: true
    attemptCostFinalizedAtImmutableLeaseExpiry: true
    automaticRetryStarted: false
    customerCommercialAuthorityIncluded: false
    distributedWorkerDeathObserverVerified: false
    cloudCallPerformed: false
    productionAuthority: false
  }
}

interface TimeoutAttemptCostResolution {
  evidenceHash: string
  durableAttemptStartEvidenceHash: string | null
  terminalCostCreatedFromAttemptStart: boolean
}

export function createCanonicalPrivateCloudDispatchReceiverService(input: {
  context: ServiceContext
  ownerUserId: string
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  controllerAudience: string
  workerReceiverAudience: string
  now?: () => Date
}) {
  if (!isExplicitLocalInternalTestRuntime(input.context.env)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Cloud dispatch outbox receivers remain private/local until the distributed transaction and trusted Google identity verifier are deployed.',
      503,
      {
        requiredGates: [
          'distributed_package_queue_outbox_transaction',
          'trusted_google_oidc_verifier_adapter',
          'cloud_tasks_invoker_and_jobs_developer_iam',
          'deployed_private_controller_and_worker_identity',
        ],
      },
    )
  }
  if (!input.context.auth || input.context.auth.userId !== input.ownerUserId) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Cloud dispatch outbox owner authority does not match the authenticated context.',
      403,
    )
  }
  const controllerAudience = safePrivateAudience(
    input.controllerAudience,
    'controller audience',
  )
  const workerReceiverAudience = safePrivateAudience(
    input.workerReceiverAudience,
    'worker receiver audience',
  )
  const now = input.now ?? (() => new Date())
  const scope: CanonicalCloudDispatchOutboxStoreScope = {
    localStorageRoot: input.context.env.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.queueDefinition.identity.workspaceId,
    projectId: input.queueDefinition.identity.projectId,
    editSessionId: input.queueDefinition.identity.editSessionId,
    packageRecordId: input.queueDefinition.identity.packageRecordId,
    approvedPlanSnapshotId: input.queueDefinition.identity.approvedPlanSnapshotId,
  }
  const queueScope: CanonicalPrivatePackageWorkQueueStoreScope = { ...scope }

  type TimeoutRequest = {
    dispatchIntentId: string
    verifiedIdentity: CanonicalVerifiedServiceIdentity
    faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
  }

  const reconcileWorkerTimeoutAt = async (
    request: TimeoutRequest,
    timestamp: string,
    onCostResolved?: (resolution: TimeoutAttemptCostResolution) => void,
  ) => {
    if (Object.prototype.hasOwnProperty.call(
      request,
      'attemptInternalCostEvidenceHash',
    )) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Worker timeout reconciliation does not accept caller-supplied cost evidence hashes.',
        400,
        {
          requiredGate:
            'canonical_cloud_dispatch_server_resolved_timeout_cost_evidence',
        },
      )
    }
    const result = await reconcilePrivateCanonicalCloudDispatchTimeout({
      scope,
      definition: input.queueDefinition,
      manifest: input.manifest,
      dispatchIntentId: request.dispatchIntentId,
      resolveAttemptInternalCostEvidenceHash: async ({
        outboxEntry,
        queueEntry,
        expectedEvidenceHash,
      }) => {
        const resolution = await requirePersistedTimeoutAttemptCostEvidence({
          scope,
          definition: input.queueDefinition,
          manifest: input.manifest,
          outboxEntry,
          queueEntry,
          expectedEvidenceHash,
          timedOutAt: timestamp,
        })
        onCostResolved?.(resolution)
        return resolution.evidenceHash
      },
      now: timestamp,
      buildReceipt: ({
        entry,
        timeoutEvidence,
        queueRelease,
        timedOutAt,
      }) => createCanonicalCloudDispatchWorkerTimeoutReceipt({
        entry,
        timeoutEvidence,
        queueRelease,
        verifiedIdentity: request.verifiedIdentity,
        expectedAudience: controllerAudience,
        now: timestamp,
        timedOutAt,
        privateContractFixtureAllowed: true,
        trustedJwksContractFixtureAllowed: true,
        trustedGoogleVerifierOutputAllowed: false,
      }),
      validateReplayReceipt: ({ entry }) =>
        assertCanonicalCloudDispatchWorkerTimeoutReceiptReplay({
          entry,
          attemptInternalCostEvidenceHash:
            entry.timeoutReceipt?.attemptInternalCostEvidenceHash ?? '',
          verifiedIdentity: request.verifiedIdentity,
          expectedAudience: controllerAudience,
          now: timestamp,
          privateContractFixtureAllowed: true,
          trustedJwksContractFixtureAllowed: true,
          trustedGoogleVerifierOutputAllowed: false,
        }),
      faultInjectionForSmoke: request.faultInjectionForSmoke,
    })
    return {
      disposition: result.disposition,
      queueDisposition: result.queueDisposition,
      retryDisposition: result.retryDisposition,
      remainingAttempts: result.remainingAttempts,
      approvedMaxAttempts: result.approvedMaxAttempts,
      receipt: result.timeoutReceipt,
      outboxState: result.outboxEntry.state,
      recovery: result.recovery,
      boundaries: result.boundaries,
    }
  }

  return {
    async enqueueApprovedAttempt(request: { jobId: string }) {
      const timestamp = now().toISOString()
      const result = await claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt({
        scope,
        definition: input.queueDefinition,
        manifest: input.manifest,
        jobId: request.jobId,
        workerIdentity: input.context.env.workerInstanceId,
        now: timestamp,
        leaseDurationMs: boundedLeaseDurationMs(
          input.context.env.workerClaimLeaseSeconds * 1_000,
        ),
      })
      if (!('outboxEntry' in result)) {
        return {
          disposition: result.disposition,
          queueEntry: result.queueEntry,
          ...('outcome' in result ? { outcome: result.outcome } : {}),
          ...('requiredGate' in result && result.requiredGate
            ? { requiredGate: result.requiredGate }
            : {}),
          boundaries: receiverBoundaries(),
        }
      }
      return {
        disposition: result.disposition,
        outboxEntry: result.outboxEntry,
        attemptPlan: result.attemptPlan,
        boundaries: receiverBoundaries(),
      }
    },

    async receiveController(request: {
      taskBody: unknown
      verifiedIdentity: CanonicalVerifiedServiceIdentity
    }) {
      const timestamp = now().toISOString()
      const dispatchIntentId = opaqueDispatchIntentId(request.taskBody)
      const current = await requireCurrentEntry({
        scope,
        queueScope,
        queueDefinition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId,
        now: timestamp,
      })
      const result = await acceptPrivateCanonicalCloudDispatchController({
        scope,
        dispatchIntentId,
        now: timestamp,
        validateCurrentEntry: async (entry, lockAuthority) =>
          validateCurrentEntryUnderPackageStateLock({
            entry,
            lockAuthority,
            queueScope,
            queueDefinition: input.queueDefinition,
            manifest: input.manifest,
            now: timestamp,
          }),
        buildReceipt: (entry) => createCanonicalCloudDispatchControllerReceipt({
          entry,
          taskBody: request.taskBody,
          attemptPlan: current.attemptPlan,
          verifiedIdentity: request.verifiedIdentity,
          expectedAudience: controllerAudience,
          now: timestamp,
          privateContractFixtureAllowed: true,
          trustedJwksContractFixtureAllowed: true,
          trustedGoogleVerifierOutputAllowed: false,
        }),
      })
      return {
        disposition: result.disposition,
        receipt: result.receipt,
        outboxState: result.entry.state,
        cloudRunJobRequest: current.attemptPlan.cloudRunJob,
        boundaries: receiverBoundaries(),
      }
    },

    async createWorkerInvocation(dispatchIntentId: string) {
      const timestamp = now().toISOString()
      const current = await requireCurrentEntry({
        scope,
        queueScope,
        queueDefinition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId,
        now: timestamp,
      })
      return createCanonicalCloudDispatchWorkerInvocation({ entry: current.entry })
    },

    async receiveWorker(request: {
      invocation: unknown
      verifiedIdentity: CanonicalVerifiedServiceIdentity
    }) {
      const timestamp = now().toISOString()
      const invocation = canonicalCloudDispatchWorkerInvocationSchema.safeParse(
        request.invocation,
      )
      if (!invocation.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Cloud dispatch worker invocation is invalid.',
          400,
        )
      }
      await requireCurrentEntry({
        scope,
        queueScope,
        queueDefinition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId: invocation.data.dispatchIntentId,
        now: timestamp,
      })
      const result = await acceptPrivateCanonicalCloudDispatchWorker({
        scope,
        dispatchIntentId: invocation.data.dispatchIntentId,
        now: timestamp,
        validateCurrentEntry: async (entry, lockAuthority) =>
          validateCurrentEntryUnderPackageStateLock({
            entry,
            lockAuthority,
            queueScope,
            queueDefinition: input.queueDefinition,
            manifest: input.manifest,
            now: timestamp,
          }),
        buildReceipt: (entry) => createCanonicalCloudDispatchWorkerReceipt({
          entry,
          invocation: invocation.data,
          verifiedIdentity: request.verifiedIdentity,
          expectedAudience: workerReceiverAudience,
          now: timestamp,
          privateContractFixtureAllowed: true,
          trustedJwksContractFixtureAllowed: true,
          trustedGoogleVerifierOutputAllowed: false,
        }),
      })
      return {
        disposition: result.disposition,
        receipt: result.receipt,
        outboxState: result.entry.state,
        boundaries: receiverBoundaries(),
      }
    },

    async beginWorkerExecutionAttempt(request: {
      dispatchIntentId: string
      verifiedIdentity: CanonicalVerifiedServiceIdentity
    }) {
      assertExactOwnRequestKeys(
        request,
        ['dispatchIntentId', 'verifiedIdentity'],
        'worker attempt start',
      )
      const timestamp = now().toISOString()
      const result = await recordPrivateCanonicalCloudDispatchAttemptStart({
        scope,
        definition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId: request.dispatchIntentId,
        now: timestamp,
        validateAcceptedWorker: (entry) =>
          assertAcceptedWorkerStartIdentity({
            entry,
            verifiedIdentity: request.verifiedIdentity,
            expectedAudience: workerReceiverAudience,
            now: timestamp,
          }),
      })
      return {
        disposition: result.disposition,
        attemptStart: result.evidence,
        packageStateRecoveryPerformed: result.packageStateRecoveryPerformed,
        boundaries: {
          contractOnly: true as const,
          privateLocalCreateOnly: true as const,
          exactAcceptedWorkerAttemptRequired: true as const,
          durableRuntimeCostStartRecorded: true as const,
          toolOrMediaOutcomeClaimed: false as const,
          customerCommercialAuthorityIncluded: false as const,
          cloudExecutionAuthorized: false as const,
          productionAuthority: false as const,
        },
      }
    },

    async reconcileWorkerCompletion(request: {
      dispatchIntentId: string
      completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence
      verifiedIdentity: CanonicalVerifiedServiceIdentity
      faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    }) {
      const timestamp = now().toISOString()
      const result = await reconcilePrivateCanonicalCloudDispatchCompletion({
        scope,
        definition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId: request.dispatchIntentId,
        completionEvidence: request.completionEvidence,
        now: timestamp,
        buildReceipt: ({ entry, queueCompletion, completedAt }) =>
          createCanonicalCloudDispatchWorkerCompletionReceipt({
            entry,
            completionEvidence: request.completionEvidence,
            queueCompletion,
            verifiedIdentity: request.verifiedIdentity,
            expectedAudience: workerReceiverAudience,
            now: timestamp,
            completedAt,
            privateContractFixtureAllowed: true,
            trustedJwksContractFixtureAllowed: true,
            trustedGoogleVerifierOutputAllowed: false,
          }),
        faultInjectionForSmoke: request.faultInjectionForSmoke,
      })
      return {
        disposition: result.disposition,
        queueOutcome: result.queueOutcome,
        receipt: result.completionReceipt,
        outboxState: result.outboxEntry.state,
        recovery: result.recovery,
        boundaries: result.boundaries,
      }
    },

    async reconcileWorkerFailure(request: {
      dispatchIntentId: string
      failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence
      verifiedIdentity: CanonicalVerifiedServiceIdentity
      faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    }) {
      const timestamp = now().toISOString()
      const result = await reconcilePrivateCanonicalCloudDispatchFailure({
        scope,
        definition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId: request.dispatchIntentId,
        failureEvidence: request.failureEvidence,
        now: timestamp,
        buildReceipt: ({ entry, queueRelease, failedAt }) =>
          createCanonicalCloudDispatchWorkerFailureReceipt({
            entry,
            failureEvidence: request.failureEvidence,
            queueRelease,
            verifiedIdentity: request.verifiedIdentity,
            expectedAudience: workerReceiverAudience,
            now: timestamp,
            failedAt,
            privateContractFixtureAllowed: true,
            trustedJwksContractFixtureAllowed: true,
            trustedGoogleVerifierOutputAllowed: false,
          }),
        validateReplayReceipt: ({ entry }) =>
          assertCanonicalCloudDispatchWorkerFailureReceiptReplay({
            entry,
            failureEvidence: request.failureEvidence,
            verifiedIdentity: request.verifiedIdentity,
            expectedAudience: workerReceiverAudience,
            now: timestamp,
            privateContractFixtureAllowed: true,
            trustedJwksContractFixtureAllowed: true,
            trustedGoogleVerifierOutputAllowed: false,
          }),
        faultInjectionForSmoke: request.faultInjectionForSmoke,
      })
      return {
        disposition: result.disposition,
        queueDisposition: result.queueDisposition,
        retryDisposition: result.retryDisposition,
        remainingAttempts: result.remainingAttempts,
        approvedMaxAttempts: result.approvedMaxAttempts,
        receipt: result.failureReceipt,
        outboxState: result.outboxEntry.state,
        recovery: result.recovery,
        boundaries: result.boundaries,
      }
    },

    async reconcileWorkerTimeout(request: {
      dispatchIntentId: string
      verifiedIdentity: CanonicalVerifiedServiceIdentity
      faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    }) {
      return reconcileWorkerTimeoutAt(request, now().toISOString())
    },

    async finalizeExpiredWorkerTimeouts(request: {
      verifiedIdentity: CanonicalVerifiedServiceIdentity
    }): Promise<CanonicalPrivateCloudDispatchTimeoutFinalizerResult> {
      assertExactOwnRequestKeys(
        request,
        ['verifiedIdentity'],
        'worker timeout finalizer',
      )
      const timestamp = now().toISOString()
      assertControllerFinalizerIdentity({
        manifest: input.manifest,
        verifiedIdentity: request.verifiedIdentity,
        expectedAudience: controllerAudience,
        now: timestamp,
      })
      const candidates = await selectExpiredAcceptedWorkerAttempts({
        scope,
        definition: input.queueDefinition,
        now: timestamp,
      })
      const outcomes: CanonicalPrivateCloudDispatchTimeoutFinalizerResult['outcomes'] = []
      for (const candidate of candidates.selected) {
        const start = await readPrivateCanonicalCloudDispatchAttemptStart({
          scope,
          dispatchIntentId: candidate.dispatchIntentId,
        })
        let costResolution: TimeoutAttemptCostResolution | undefined
        try {
          const result = await reconcileWorkerTimeoutAt({
            dispatchIntentId: candidate.dispatchIntentId,
            verifiedIdentity: request.verifiedIdentity,
          }, timestamp, (resolution) => {
            costResolution = resolution
          })
          outcomes.push({
            dispatchIntentId: candidate.dispatchIntentId,
            disposition: result.disposition,
            requiredGate: null,
            durableAttemptStartEvidenceHash: start?.evidenceHash ?? null,
            attemptInternalCostEvidenceHash:
              result.receipt.attemptInternalCostEvidenceHash,
            terminalCostCreatedByFinalizer:
              costResolution?.terminalCostCreatedFromAttemptStart ?? false,
          })
        } catch (error) {
          if (error instanceof ApiError && error.code === 'JOB_DEPENDENCY_NOT_READY') {
            outcomes.push({
              dispatchIntentId: candidate.dispatchIntentId,
              disposition: 'blocked',
              requiredGate: requiredGateFromApiError(error) ??
                'canonical_cloud_dispatch_durable_attempt_start',
              durableAttemptStartEvidenceHash: start?.evidenceHash ?? null,
              attemptInternalCostEvidenceHash: null,
              terminalCostCreatedByFinalizer: false,
            })
            continue
          }
          throw error
        }
      }
      const reconciledCount = outcomes.filter((outcome) =>
        outcome.disposition === 'reconciled').length
      const exactReplayCount = outcomes.filter((outcome) =>
        outcome.disposition === 'exact_replay').length
      const blockedCount = outcomes.filter((outcome) =>
        outcome.disposition === 'blocked').length
      const unresolvedCandidateCount = blockedCount +
        Math.max(0, candidates.total - candidates.selected.length)
      return {
        status: candidates.total === 0
          ? 'no_expired_attempts'
          : unresolvedCandidateCount > 0
            ? 'blocked'
            : 'completed',
        observedAt: timestamp,
        expiredCandidateCount: candidates.total,
        selectedCandidateCount: candidates.selected.length,
        reconciledCount,
        exactReplayCount,
        blockedCount,
        unresolvedCandidateCount,
        outcomes,
        boundaries: {
          packageScopeSelectedByServer: true,
          dispatchIntentSelectedByController: true,
          durableAttemptStartRequired: true,
          attemptCostFinalizedAtImmutableLeaseExpiry: true,
          automaticRetryStarted: false,
          customerCommercialAuthorityIncluded: false,
          distributedWorkerDeathObserverVerified: false,
          cloudCallPerformed: false,
          productionAuthority: false,
        },
      }
    },

    async evidence(): Promise<CanonicalPrivateCloudDispatchReceiverEvidence> {
      const aggregate = await readPrivateCanonicalCloudDispatchOutbox({ scope })
      if (!aggregate) {
        throw new ApiError(
          'INTERNAL_ERROR',
          'Cloud dispatch outbox evidence is unavailable.',
          500,
        )
      }
      return {
        aggregateHash: aggregate.aggregateHash,
        totalEntryCount: aggregate.summary.totalEntryCount,
        pendingControllerDeliveryCount: aggregate.summary.pendingControllerDeliveryCount,
        controllerIdentityAcceptedCount:
          aggregate.summary.controllerIdentityAcceptedCount,
        workerIdentityAcceptedCount: aggregate.summary.workerIdentityAcceptedCount,
        workerCompletionReconciledCount:
          aggregate.summary.workerCompletionReconciledCount ?? 0,
        workerFailureReconciledCount:
          aggregate.summary.workerFailureReconciledCount ?? 0,
        workerTimeoutReconciledCount:
          aggregate.summary.workerTimeoutReconciledCount ?? 0,
        hostRestartRecoveryAvailable: true,
        exactPackageAttemptRevalidatedAtEveryReceiver: true,
        exactIdentityIssuerPrincipalAudienceAndExpiryRequired: true,
        taskRedeliveryReplaysWithoutAnotherExecutionAttempt: true,
        rawBearerTokenPersisted: false,
        rawMediaPromptPathSignedUrlOrCredentialPersisted: false,
        processBrandedVerifiedIdentityRequired: true,
        cryptographicJwksVerifierCoreAvailable: true,
        packageQueueOwnsApprovedAttempts: true,
        packageAttemptSelectedByServer: true,
        cooperativeCrossProcessPackageLockVerified: true,
        singleHostCrashConsistentQueueClaimAndOutboxCommitVerified: true,
        committedTransactionRecoveryVerified: true,
        workerCompletionReconciliationVerified: true,
        completionQueueAndOutboxWriteAheadCommitVerified: true,
        workerFailureReconciliationVerified: true,
        failureQueueAndOutboxWriteAheadCommitVerified: true,
        acceptedWorkerTimeoutReconciliationVerified: true,
        timeoutQueueAndOutboxWriteAheadCommitVerified: true,
        timeoutAttemptCostEvidenceLoadedFromPrivateStore: true,
        durableAttemptStartCostBindingVerified: true,
        controllerOwnedTimeoutFinalizerVerified: true,
        automaticTimeoutRetryStarted: false,
        distributedWorkerDeathObserverVerified: false,
        callerSuppliedTimeoutCostHashAccepted: false,
        crossProcessAtomicClaimProven: true,
        distributedOutboxTransactionVerified: false,
        liveGoogleOidcAndIamVerified: false,
        cloudTaskCreated: false,
        cloudRunJobExecuted: false,
        workerExecutionAuthorized: false,
        cloudDispatchAuthorized: false,
        productionAuthority: false,
      }
    },
  }
}

async function validateCurrentEntryUnderPackageStateLock(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  lockAuthority: Parameters<
    typeof readPrivateCanonicalPackageWorkQueueForPackageStateTransaction
  >[0]
  queueScope: CanonicalPrivatePackageWorkQueueStoreScope
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  now: string
}): Promise<void> {
  const queueAggregate =
    await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
      input.lockAuthority,
      input.queueScope,
      input.queueDefinition,
    )
  if (!queueAggregate) {
    throw new ApiError(
      'JOB_NOT_FOUND',
      'Canonical package work queue is unavailable for cloud dispatch.',
      404,
    )
  }
  const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
    manifest: input.manifest,
    jobId: input.entry.immutable.jobId,
    deliveryAttempt: input.entry.immutable.packageDeliveryAttempt,
  })
  assertCanonicalCloudDispatchOutboxCurrentAttempt({
    entry: input.entry,
    queueDefinition: input.queueDefinition,
    queueAggregate,
    manifest: input.manifest,
    attemptPlan,
    now: input.now,
    allowReconciledCompletionReplay: true,
    allowReconciledFailureReplay: true,
    allowReconciledTimeoutReplay: true,
  })
}

async function requireCurrentEntry(input: {
  scope: CanonicalCloudDispatchOutboxStoreScope
  queueScope: CanonicalPrivatePackageWorkQueueStoreScope
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  dispatchIntentId: string
  now: string
}): Promise<{
  aggregate: CanonicalCloudDispatchOutboxAggregate
  entry: CanonicalCloudDispatchOutboxEntry
  attemptPlan: ReturnType<typeof createCanonicalCloudWorkerDispatchAttemptPlan>
}> {
  const aggregate = await readPrivateCanonicalCloudDispatchOutbox({ scope: input.scope })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.immutable.dispatchIntentId === input.dispatchIntentId)
  if (!aggregate || !entry) {
    throw new ApiError('JOB_NOT_FOUND', 'Cloud dispatch outbox intent was not found.', 404)
  }
  const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
    manifest: input.manifest,
    jobId: entry.immutable.jobId,
    deliveryAttempt: entry.immutable.packageDeliveryAttempt,
  })
  const queueAggregate = await requireQueueAggregate(
    input.queueScope,
    input.queueDefinition,
  )
  assertCanonicalCloudDispatchOutboxCurrentAttempt({
    entry,
    queueDefinition: input.queueDefinition,
    queueAggregate,
    manifest: input.manifest,
    attemptPlan,
    now: input.now,
    allowReconciledCompletionReplay: true,
    allowReconciledFailureReplay: true,
    allowReconciledTimeoutReplay: true,
  })
  return { aggregate, entry, attemptPlan }
}

async function requireQueueAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
) {
  const aggregate = await readPrivateCanonicalPackageWorkQueue({ scope, definition })
  if (!aggregate) {
    throw new ApiError(
      'JOB_NOT_FOUND',
      'Canonical package work queue is unavailable for cloud dispatch.',
      404,
    )
  }
  return aggregate
}

function opaqueDispatchIntentId(taskBody: unknown): string {
  if (!taskBody || typeof taskBody !== 'object' || Array.isArray(taskBody)) {
    throw new ApiError('VALIDATION_FAILED', 'Cloud dispatch task body is invalid.', 400)
  }
  const value = (taskBody as { dispatchIntentId?: unknown }).dispatchIntentId
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 240 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(value) || value.includes('..')
  ) throw new ApiError('VALIDATION_FAILED', 'Cloud dispatch intent identity is invalid.', 400)
  return value
}

function safePrivateAudience(value: string, label: string): string {
  const normalized = value.trim()
  if (normalized.length < 1 || normalized.length > 1_024) {
    throw new ApiError('VALIDATION_FAILED', `Cloud dispatch ${label} is invalid.`, 400)
  }
  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    throw new ApiError('VALIDATION_FAILED', `Cloud dispatch ${label} is invalid.`, 400)
  }
  if (
    url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    normalized !== url.toString().replace(/\/$/u, normalized.endsWith('/') ? '/' : '')
  ) {
    throw new ApiError('VALIDATION_FAILED', `Cloud dispatch ${label} is unsafe.`, 400)
  }
  return normalized
}

function receiverBoundaries() {
  return {
    contractOnly: true as const,
    privateLocalPersistenceOnly: true as const,
    packageAttemptSelectedByServer: true as const,
    cooperativeCrossProcessPackageLockVerified: true as const,
    singleHostCrashConsistentQueueClaimAndOutboxCommitVerified: true as const,
    committedTransactionRecoveryVerified: true as const,
    workerCompletionReconciliationVerified: true as const,
    completionQueueAndOutboxWriteAheadCommitVerified: true as const,
    workerFailureReconciliationVerified: true as const,
    failureQueueAndOutboxWriteAheadCommitVerified: true as const,
    acceptedWorkerTimeoutReconciliationVerified: true as const,
    timeoutQueueAndOutboxWriteAheadCommitVerified: true as const,
    timeoutAttemptCostEvidenceLoadedFromPrivateStore: true as const,
    durableAttemptStartCostBindingVerified: true as const,
    controllerOwnedTimeoutFinalizerVerified: true as const,
    automaticTimeoutRetryStarted: false as const,
    distributedWorkerDeathObserverVerified: false as const,
    callerSuppliedTimeoutCostHashAccepted: false as const,
    networkCallPerformed: false as const,
    cloudTaskCreated: false as const,
    cloudRunJobExecuted: false as const,
    rawAuthorizationHeaderAccepted: false as const,
    rawBearerTokenPersisted: false as const,
    processBrandedVerifiedIdentityRequired: true as const,
    cryptographicJwksVerifierCoreAvailable: true as const,
    trustedGoogleVerifierAdapterWired: false as const,
    distributedOutboxTransactionVerified: false as const,
    liveGoogleOidcAndIamVerified: false as const,
    workerExecutionAuthorized: false as const,
    cloudDispatchAuthorized: false as const,
    productionAuthority: false as const,
  }
}

function boundedLeaseDurationMs(value: number): number {
  if (!Number.isFinite(value)) return 300_000
  return Math.max(1_000, Math.min(86_400_000, Math.floor(value)))
}

function assertAcceptedWorkerStartIdentity(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  verifiedIdentity: CanonicalVerifiedServiceIdentity
  expectedAudience: string
  now: string
}): void {
  const receipt = input.entry.workerReceipt
  if (!receipt) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Accepted worker identity is unavailable for attempt start.',
      401,
    )
  }
  const verified = assertCanonicalVerifiedServiceIdentity(input.verifiedIdentity)
  const evidence = assertCanonicalServiceIdentityEvidence({
    value: verified,
    expectedMechanism: 'google_cloud_run_workload_identity',
    expectedPrincipalEmail: input.entry.immutable.workerServiceAccountEmail,
    expectedAudience: input.expectedAudience,
    now: input.now,
    privateContractFixtureAllowed: true,
    trustedJwksContractFixtureAllowed: true,
    trustedGoogleVerifierOutputAllowed: false,
  })
  if (
    receipt.identity.verificationMode !== evidence.verificationMode ||
    receipt.identity.authenticationMechanism !== evidence.authenticationMechanism ||
    receipt.identity.verifierId !== evidence.verifierId ||
    receipt.identity.issuerHash !== sha256AuthorityValue(evidence.issuer) ||
    receipt.identity.subjectHash !== sha256AuthorityValue(evidence.subject) ||
    receipt.identity.principalEmailHash !==
      sha256AuthorityValue(evidence.principalEmail) ||
    receipt.identity.audienceHash !== sha256AuthorityValue(evidence.audience)
  ) {
    throw new ApiError(
      'INTERNAL_SERVICE_AUTH_INVALID',
      'Attempt-start identity does not match the accepted worker principal.',
      401,
    )
  }
}

function assertControllerFinalizerIdentity(input: {
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  verifiedIdentity: CanonicalVerifiedServiceIdentity
  expectedAudience: string
  now: string
}): void {
  const principals = [...new Set(input.manifest.entries.flatMap((entry) =>
    entry.taskOidcServiceAccountEmail ? [entry.taskOidcServiceAccountEmail] : []))]
  if (principals.length !== 1) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Timeout finalizer requires one server-owned controller service principal.',
      503,
    )
  }
  const verified = assertCanonicalVerifiedServiceIdentity(input.verifiedIdentity)
  assertCanonicalServiceIdentityEvidence({
    value: verified,
    expectedMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: principals[0]!,
    expectedAudience: input.expectedAudience,
    now: input.now,
    privateContractFixtureAllowed: true,
    trustedJwksContractFixtureAllowed: true,
    trustedGoogleVerifierOutputAllowed: false,
  })
}

async function selectExpiredAcceptedWorkerAttempts(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope &
    CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  now: string
}): Promise<{
  total: number
  selected: Array<{ dispatchIntentId: string; expiresAt: string }>
}> {
  const observedAt = Date.parse(input.now)
  if (!Number.isFinite(observedAt)) {
    throw new ApiError('VALIDATION_FAILED', 'Timeout finalizer time is invalid.', 400)
  }
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => {
      const queue = await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
        lockAuthority,
        input.scope,
        input.definition,
      )
      const outbox = await readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
        lockAuthority,
        input.scope,
      )
      if (!queue || !outbox) {
        throw new ApiError(
          'JOB_NOT_FOUND',
          'Timeout finalizer requires the canonical package queue and dispatch outbox.',
          404,
        )
      }
      const candidates: Array<{ dispatchIntentId: string; expiresAt: string }> = []
      for (const entry of outbox.entries) {
        if (entry.state !== 'worker_identity_accepted') continue
        const queueEntry = queue.entries.find((candidate) =>
          candidate.definition.jobId === entry.immutable.jobId)
        const claim = queueEntry?.activeClaim
        if (
          !queueEntry || queueEntry.state !== 'leased' || !claim ||
          claim.claimId !== entry.immutable.queueClaimId ||
          claim.claimHash !== entry.immutable.queueClaimHash ||
          claim.deliveryAttempt !== entry.immutable.packageDeliveryAttempt ||
          claim.expiresAt !== entry.immutable.queueClaimExpiresAt
        ) {
          throw new ApiError(
            'IDEMPOTENCY_ATOMICITY_REQUIRED',
            'Accepted-worker timeout candidate no longer matches the active package claim.',
            503,
          )
        }
        if (Date.parse(claim.expiresAt) <= observedAt) {
          candidates.push({
            dispatchIntentId: entry.immutable.dispatchIntentId,
            expiresAt: claim.expiresAt,
          })
        }
      }
      candidates.sort((left, right) =>
        left.expiresAt.localeCompare(right.expiresAt) ||
        left.dispatchIntentId.localeCompare(right.dispatchIntentId))
      return { total: candidates.length, selected: candidates.slice(0, 32) }
    },
  })
}

function requiredGateFromApiError(error: ApiError): string | null {
  if (!error.details || typeof error.details !== 'object' || Array.isArray(error.details)) {
    return null
  }
  const value = (error.details as { requiredGate?: unknown }).requiredGate
  return typeof value === 'string' && /^[a-z0-9_:-]{1,160}$/u.test(value)
    ? value
    : null
}

function assertExactOwnRequestKeys(
  value: unknown,
  expectedKeys: string[],
  label: string,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', `Cloud-dispatch ${label} request is invalid.`, 400)
  }
  const keys = Reflect.ownKeys(value)
  const expected = [...expectedKeys].sort()
  const actual = keys.filter((key): key is string => typeof key === 'string').sort()
  if (
    actual.length !== keys.length ||
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `Cloud-dispatch ${label} accepts only its server-owned identity inputs.`,
      400,
    )
  }
}

async function requirePersistedTimeoutAttemptCostEvidence(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope &
    CanonicalCloudDispatchOutboxStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  outboxEntry: CanonicalCloudDispatchOutboxEntry
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  expectedEvidenceHash: string | null
  timedOutAt: string
}): Promise<TimeoutAttemptCostResolution> {
  let durableAttemptStartEvidenceHash: string | null = null
  let terminalCostCreatedFromAttemptStart = false
  let evidence = await readPrivateInternalAttemptCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    workspaceId: input.definition.identity.workspaceId,
    projectId: input.definition.identity.projectId,
    executionAttemptId: input.outboxEntry.immutable.dispatchIntentId,
  })
  if (!evidence) {
    const finalized = await finalizePrivateCanonicalCloudDispatchTimedOutAttemptCost({
      scope: input.scope,
      definition: input.definition,
      manifest: input.manifest,
      outboxEntry: input.outboxEntry,
      queueEntry: input.queueEntry,
      observedAt: input.timedOutAt,
    })
    evidence = finalized.attemptCost.evidence
    durableAttemptStartEvidenceHash = finalized.attemptStart.evidenceHash
    terminalCostCreatedFromAttemptStart =
      finalized.attemptCost.idempotencyStatus === 'inserted'
  }
  const manifestEntry = input.manifest.entries.find((entry) =>
    entry.jobId === input.outboxEntry.immutable.jobId)
  const workerReceipt = input.outboxEntry.workerReceipt
  const evidenceIdentity = evidence.identity
  const expectedOperationId = manifestEntry?.approvedToolOperationIds[0]
  if (
    !manifestEntry || !workerReceipt || !manifestEntry.approvedToolId ||
    !expectedOperationId || manifestEntry.approvedToolOperationIds.length !== 1 ||
    input.queueEntry.definition.jobId !== input.outboxEntry.immutable.jobId ||
    input.queueEntry.definition.approvedWorkItemId !==
      manifestEntry.approvedWorkItemId ||
    evidenceIdentity.workspaceId !== input.definition.identity.workspaceId ||
    evidenceIdentity.projectId !== input.definition.identity.projectId ||
    evidenceIdentity.editSessionId !== input.definition.identity.editSessionId ||
    evidenceIdentity.approvedPlanSnapshotId !==
      input.definition.identity.approvedPlanSnapshotId ||
    evidenceIdentity.approvedWorkItemId !== manifestEntry.approvedWorkItemId ||
    evidenceIdentity.jobId !== manifestEntry.jobId ||
    evidenceIdentity.executionAttemptId !==
      input.outboxEntry.immutable.dispatchIntentId ||
    evidenceIdentity.retryAttempt !==
      input.outboxEntry.immutable.packageDeliveryAttempt - 1 ||
    evidenceIdentity.toolId !== manifestEntry.approvedToolId ||
    evidenceIdentity.operationId !== expectedOperationId ||
    evidence.outcome.status !== 'failed' ||
    evidence.outcome.failureCategory !== 'timeout' ||
    evidence.resourceUsage.outputByteLength !== null ||
    evidence.linkedCanonicalOutcomeHash !== null ||
    Date.parse(evidence.createdAt) < Date.parse(workerReceipt.acceptedAt) ||
    Date.parse(evidence.createdAt) > Date.parse(input.timedOutAt) ||
    (input.expectedEvidenceHash !== null &&
      evidence.evidenceHash !== input.expectedEvidenceHash)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Persisted timeout attempt-cost evidence does not match the exact accepted worker attempt.',
      409,
      {
        requiredGate:
          'canonical_cloud_dispatch_timeout_persisted_attempt_cost_evidence_integrity',
      },
    )
  }
  return {
    evidenceHash: evidence.evidenceHash,
    durableAttemptStartEvidenceHash,
    terminalCostCreatedFromAttemptStart,
  }
}
