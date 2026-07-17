import { ApiError } from '../errors/api-error'
import {
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
  CanonicalVerifiedServiceIdentity,
} from '../security/canonical-service-identity-verifier'
import {
  readPrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  acceptPrivateCanonicalCloudDispatchController,
  acceptPrivateCanonicalCloudDispatchWorker,
  readPrivateCanonicalCloudDispatchOutbox,
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
import {
  reconcilePrivateCanonicalCloudDispatchTimeout,
} from './private-canonical-cloud-dispatch-timeout-transaction-store'
import type { CanonicalPrivatePackageStateFaultStage } from
  './private-canonical-package-state-transaction'

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
  crossProcessAtomicClaimProven: true
  distributedOutboxTransactionVerified: false
  liveGoogleOidcAndIamVerified: false
  cloudTaskCreated: false
  cloudRunJobExecuted: false
  workerExecutionAuthorized: false
  cloudDispatchAuthorized: false
  productionAuthority: false
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
      attemptInternalCostEvidenceHash: string
      verifiedIdentity: CanonicalVerifiedServiceIdentity
      faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    }) {
      const timestamp = now().toISOString()
      const result = await reconcilePrivateCanonicalCloudDispatchTimeout({
        scope,
        definition: input.queueDefinition,
        manifest: input.manifest,
        dispatchIntentId: request.dispatchIntentId,
        attemptInternalCostEvidenceHash:
          request.attemptInternalCostEvidenceHash,
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
              request.attemptInternalCostEvidenceHash,
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
