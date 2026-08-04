import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalCloudDispatchOutboxCurrentAttempt,
} from '../edit-architecture/canonical-cloud-dispatch-outbox-receiver-authority'
import {
  createCanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  describePrivateInternalAttemptCostEvidence,
  finalizePrivateInternalAttemptCostEvidenceForBoundedDuration,
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  privateInternalAttemptCostIdentitySchema,
  type BeginPrivateInternalAttemptCostEvidenceInput,
  type PrivateInternalAttemptCostEvidenceResult,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'
import type {
  CanonicalCloudDispatchOutboxEntry,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
  type CanonicalCloudDispatchOutboxStoreScope,
} from './private-canonical-cloud-dispatch-outbox-store'
import {
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  withCanonicalPrivatePackageStateLock,
} from './private-canonical-package-state-transaction'

const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const MAX_RECORD_BYTES = 64 * 1024

export const canonicalPrivateCloudDispatchAttemptStartEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-private-cloud-dispatch-attempt-start-evidence-v1'),
  source: z.literal('private_canonical_cloud_dispatch_attempt_start_store'),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClassification: z.literal('provisional_local_metered'),
  ownerUserId: identity,
  identity: privateInternalAttemptCostIdentitySchema,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
  resourceEnvelope: z.object({
    vcpuCount: z.union([z.literal(2), z.literal(4)]),
    memoryGib: z.literal(4),
    gpuCount: z.literal(0),
  }).strict(),
  dispatch: z.object({
    dispatchIntentId: identity,
    packageRecordId: identity,
    packageDeliveryAttempt: z.number().int().positive().max(10),
    queueDefinitionHash: sha256,
    handoffManifestHash: sha256,
    manifestEntryHash: sha256,
    queueClaimId: identity,
    queueClaimHash: sha256,
    queueClaimExpiresAt: timestamp,
    queueClaimAttemptDeadlineAt: timestamp,
    controllerReceiptHash: sha256,
    workerReceiptHash: sha256,
  }).strict(),
  startedAt: timestamp,
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  boundaries: z.object({
    approvedSnapshotAndWorkItemBound: z.literal(true),
    acceptedWorkerReceiptBound: z.literal(true),
    runtimeAllocationMeteringStarted: z.literal(true),
    terminalAttemptCostRecorded: z.literal(false),
    toolOrMediaOutcomeClaimed: z.literal(false),
    customerCommercialAuthorityIncluded: z.literal(false),
    automaticRetryAuthorized: z.literal(false),
    distributedAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const startedAt = Date.parse(value.startedAt)
  const expiresAt = Date.parse(value.dispatch.queueClaimExpiresAt)
  const deadlineAt = Date.parse(value.dispatch.queueClaimAttemptDeadlineAt)
  if (startedAt >= expiresAt || expiresAt > deadlineAt) {
    context.addIssue({
      code: 'custom',
      message: 'Cloud-dispatch attempt start is outside the immutable worker window.',
    })
  }
})

export type CanonicalPrivateCloudDispatchAttemptStartEvidence = z.infer<
  typeof canonicalPrivateCloudDispatchAttemptStartEvidenceSchema
>

type StoreScope = CanonicalPrivatePackageWorkQueueStoreScope &
  CanonicalCloudDispatchOutboxStoreScope

export async function recordPrivateCanonicalCloudDispatchAttemptStart(input: {
  scope: StoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  dispatchIntentId: string
  now: string
  validateAcceptedWorker: (entry: CanonicalCloudDispatchOutboxEntry) => void
}): Promise<{
  evidence: CanonicalPrivateCloudDispatchAttemptStartEvidence
  disposition: 'recorded' | 'exact_replay'
  packageStateRecoveryPerformed: boolean
}> {
  const now = validTimestamp(input.now, 'attempt start')
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority, recovery) => {
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
          'Canonical queue and dispatch outbox are required before a worker attempt can start.',
          404,
        )
      }
      const entry = outbox.entries.find((candidate) =>
        candidate.immutable.dispatchIntentId === input.dispatchIntentId)
      if (!entry) {
        throw new ApiError('JOB_NOT_FOUND', 'Cloud dispatch attempt was not found.', 404)
      }
      const queueEntry = queue.entries.find((candidate) =>
        candidate.definition.jobId === entry.immutable.jobId)
      if (!queueEntry) {
        throw new ApiError('JOB_NOT_FOUND', 'Cloud dispatch queue job was not found.', 404)
      }
      const attemptPlan = createCanonicalCloudWorkerDispatchAttemptPlan({
        manifest: input.manifest,
        jobId: entry.immutable.jobId,
        deliveryAttempt: entry.immutable.packageDeliveryAttempt,
      })
      assertCanonicalCloudDispatchOutboxCurrentAttempt({
        entry,
        queueDefinition: input.definition,
        queueAggregate: queue,
        manifest: input.manifest,
        attemptPlan,
        now,
      })
      if (
        entry.state !== 'worker_identity_accepted' ||
        !entry.controllerReceipt || !entry.workerReceipt ||
        queueEntry.state !== 'leased' || !queueEntry.activeClaim
      ) {
        throw invalid('Worker attempt start requires one accepted, actively leased dispatch attempt.')
      }
      input.validateAcceptedWorker(entry)
      if (
        Date.parse(now) < Date.parse(entry.workerReceipt.acceptedAt) ||
        Date.parse(now) >= Date.parse(queueEntry.activeClaim.expiresAt) ||
        Date.parse(now) >= Date.parse(queueEntry.activeClaim.attemptDeadlineAt)
      ) {
        throw new ApiError(
          'WORKER_LEASE_EXPIRED',
          'Worker runtime allocation cannot start outside the exact active claim window.',
          409,
        )
      }

      const costInput = costInputForAttempt({
        localStorageRoot: input.scope.localStorageRoot,
        definition: input.definition,
        manifest: input.manifest,
        entry,
      })
      const descriptor = describePrivateInternalAttemptCostEvidence(costInput)
      const relativePath = privateCanonicalCloudDispatchAttemptStartRelativePath({
        ownerUserId: input.scope.ownerUserId,
        workspaceId: input.scope.workspaceId,
        projectId: input.scope.projectId,
        editSessionId: input.scope.editSessionId,
        packageRecordId: input.scope.packageRecordId,
        approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
        dispatchIntentId: entry.immutable.dispatchIntentId,
      })
      const existing = await readPrivateCanonicalCloudDispatchAttemptStart({
        scope: input.scope,
        dispatchIntentId: entry.immutable.dispatchIntentId,
      })
      if (existing) {
        assertAttemptStartMatches({
          evidence: existing,
          scope: input.scope,
          definition: input.definition,
          manifest: input.manifest,
          entry,
          queueEntry,
          descriptor,
        })
        return {
          evidence: existing,
          disposition: 'exact_replay' as const,
          packageStateRecoveryPerformed: recovery.pendingTransactionRecovered,
        }
      }

      const payload = {
        schemaVersion: 'canonical-private-cloud-dispatch-attempt-start-evidence-v1' as const,
        source: 'private_canonical_cloud_dispatch_attempt_start_store' as const,
        boundary: 'internal_production_cost_only' as const,
        evidenceClassification: 'provisional_local_metered' as const,
        ownerUserId: input.scope.ownerUserId,
        identity: descriptor.identity,
        attemptIdentityHash: descriptor.attemptIdentityHash,
        attemptInputHash: descriptor.attemptInputHash,
        rateCardVersion: descriptor.rateCardVersion,
        resourceEnvelope: descriptor.resourceEnvelope,
        dispatch: {
          dispatchIntentId: entry.immutable.dispatchIntentId,
          packageRecordId: entry.immutable.packageRecordId,
          packageDeliveryAttempt: entry.immutable.packageDeliveryAttempt,
          queueDefinitionHash: entry.immutable.queueDefinitionHash,
          handoffManifestHash: entry.immutable.handoffManifestHash,
          manifestEntryHash: entry.immutable.manifestEntryHash,
          queueClaimId: entry.immutable.queueClaimId,
          queueClaimHash: entry.immutable.queueClaimHash,
          queueClaimExpiresAt: entry.immutable.queueClaimExpiresAt,
          queueClaimAttemptDeadlineAt: entry.immutable.queueClaimAttemptDeadlineAt,
          controllerReceiptHash: entry.controllerReceipt.receiptHash,
          workerReceiptHash: entry.workerReceipt.receiptHash,
        },
        startedAt: now,
        persistence: {
          privateLocalCreateOnly: true as const,
          databaseBacked: false as const,
          productionDurability: false as const,
        },
        boundaries: {
          approvedSnapshotAndWorkItemBound: true as const,
          acceptedWorkerReceiptBound: true as const,
          runtimeAllocationMeteringStarted: true as const,
          terminalAttemptCostRecorded: false as const,
          toolOrMediaOutcomeClaimed: false as const,
          customerCommercialAuthorityIncluded: false as const,
          automaticRetryAuthorized: false as const,
          distributedAuthority: false as const,
          productionAuthority: false as const,
        },
      }
      const evidence = canonicalPrivateCloudDispatchAttemptStartEvidenceSchema.parse({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.scope.localStorageRoot,
        relativePath,
        content: Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8'),
      })
      const persisted = await readPrivateCanonicalCloudDispatchAttemptStart({
        scope: input.scope,
        dispatchIntentId: entry.immutable.dispatchIntentId,
      })
      if (!persisted || persisted.evidenceHash !== evidence.evidenceHash) {
        throw invalid('Cloud-dispatch attempt start changed during create-only persistence.')
      }
      return {
        evidence: persisted,
        disposition: 'recorded' as const,
        packageStateRecoveryPerformed: recovery.pendingTransactionRecovered,
      }
    },
  })
}

export async function readPrivateCanonicalCloudDispatchAttemptStart(input: {
  scope: StoreScope
  dispatchIntentId: string
}): Promise<CanonicalPrivateCloudDispatchAttemptStartEvidence | undefined> {
  const relativePath = privateCanonicalCloudDispatchAttemptStartRelativePath({
    ownerUserId: input.scope.ownerUserId,
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    packageRecordId: input.scope.packageRecordId,
    approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
    dispatchIntentId: input.dispatchIntentId,
  })
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > MAX_RECORD_BYTES) {
    throw invalid('Stored cloud-dispatch attempt start exceeds its byte boundary.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Stored cloud-dispatch attempt start is not valid JSON.')
  }
  const evidence = canonicalPrivateCloudDispatchAttemptStartEvidenceSchema.parse(decoded)
  const { evidenceHash, ...payload } = evidence
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    evidence.ownerUserId !== input.scope.ownerUserId ||
    evidence.identity.workspaceId !== input.scope.workspaceId ||
    evidence.identity.projectId !== input.scope.projectId ||
    evidence.dispatch.packageRecordId !== input.scope.packageRecordId ||
    evidence.identity.approvedPlanSnapshotId !== input.scope.approvedPlanSnapshotId ||
    evidence.dispatch.dispatchIntentId !== input.dispatchIntentId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Stored cloud-dispatch attempt start does not match the requested package attempt.',
      409,
      { requiredGate: 'canonical_cloud_dispatch_attempt_start_integrity' },
    )
  }
  return evidence
}

export async function finalizePrivateCanonicalCloudDispatchTimedOutAttemptCost(input: {
  scope: StoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  outboxEntry: CanonicalCloudDispatchOutboxEntry
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  observedAt: string
}): Promise<{
  attemptStart: CanonicalPrivateCloudDispatchAttemptStartEvidence
  attemptCost: PrivateInternalAttemptCostEvidenceResult
}> {
  const observedAt = validTimestamp(input.observedAt, 'timeout observation')
  const attemptStart = await readPrivateCanonicalCloudDispatchAttemptStart({
    scope: input.scope,
    dispatchIntentId: input.outboxEntry.immutable.dispatchIntentId,
  })
  if (!attemptStart) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Accepted-worker timeout finalization requires an exact durable attempt-start record.',
      409,
      { requiredGate: 'canonical_cloud_dispatch_durable_attempt_start' },
    )
  }
  const costInput = costInputForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    definition: input.definition,
    manifest: input.manifest,
    entry: input.outboxEntry,
  })
  const descriptor = describePrivateInternalAttemptCostEvidence(costInput)
  assertAttemptStartMatches({
    evidence: attemptStart,
    scope: input.scope,
    definition: input.definition,
    manifest: input.manifest,
    entry: input.outboxEntry,
    queueEntry: input.queueEntry,
    descriptor,
  })
  if (Date.parse(attemptStart.dispatch.queueClaimExpiresAt) > Date.parse(observedAt)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Controller cannot finalize attempt cost before the accepted worker lease expires.',
      409,
    )
  }
  const attemptCost = await finalizePrivateInternalAttemptCostEvidenceForBoundedDuration(
    costInput,
    {
      startedAt: attemptStart.startedAt,
      finishedAt: attemptStart.dispatch.queueClaimExpiresAt,
      status: 'failed',
      failureCategory: 'timeout',
      outputByteLength: null,
      linkedCanonicalOutcomeHash: null,
    },
  )
  return { attemptStart, attemptCost }
}

export function privateCanonicalCloudDispatchAttemptStartRelativePath(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
  dispatchIntentId: string
}): string {
  const hash = createHash('sha256').update(stableAuthorityStringify({
    domain: 'canonical_cloud_dispatch_attempt_start_identity_v1',
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    packageRecordId: input.packageRecordId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    dispatchIntentId: input.dispatchIntentId,
  })).digest('hex')
  return `canonical-cloud-dispatch-attempt-start/private-v1/${hash.slice(0, 2)}/${hash}.json`
}

function costInputForAttempt(input: {
  localStorageRoot: string
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  entry: CanonicalCloudDispatchOutboxEntry
}): BeginPrivateInternalAttemptCostEvidenceInput {
  const manifestEntry = input.manifest.entries.find((candidate) =>
    candidate.jobId === input.entry.immutable.jobId)
  const queueJob = input.definition.jobs.find((candidate) =>
    candidate.jobId === input.entry.immutable.jobId)
  const operationId = manifestEntry?.approvedToolOperationIds[0]
  if (
    !manifestEntry || !queueJob || !operationId ||
    manifestEntry.approvedToolOperationIds.length !== 1 ||
    input.definition.definitionHash !== input.entry.immutable.queueDefinitionHash ||
    queueJob.definitionHash !== input.entry.immutable.queueJobDefinitionHash ||
    queueJob.approvedWorkItemId !== manifestEntry.approvedWorkItemId ||
    manifestEntry.entryHash !== input.entry.immutable.manifestEntryHash ||
    input.manifest.manifestHash !== input.entry.immutable.handoffManifestHash ||
    input.manifest.identity.approvedPlanSnapshotId !==
      input.definition.identity.approvedPlanSnapshotId
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Cloud-dispatch attempt no longer matches one immutable metered tool operation.',
      409,
    )
  }
  const common = {
    localStorageRoot: input.localStorageRoot,
    workspaceId: input.definition.identity.workspaceId,
    projectId: input.definition.identity.projectId,
    editSessionId: input.definition.identity.editSessionId,
    approvedPlanSnapshotId: input.definition.identity.approvedPlanSnapshotId,
    approvedWorkItemId: manifestEntry.approvedWorkItemId,
    jobId: manifestEntry.jobId,
    executionAttemptId: input.entry.immutable.dispatchIntentId,
    retryAttempt: input.entry.immutable.packageDeliveryAttempt - 1,
  }
  if (
    manifestEntry.approvedToolId === 'deepfilternet' &&
    operationId === 'tool.deepfilternet.enhance_voice.v1'
  ) {
    return { ...common, toolId: 'deepfilternet', operationId }
  }
  if (
    manifestEntry.approvedToolId === 'remotion' &&
    operationId === 'tool.remotion.render_approved_composition.v1'
  ) {
    return {
      ...common,
      toolId: 'remotion',
      operationId,
      workloadProfileId:
        PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk,
    }
  }
  if (
    manifestEntry.approvedToolId === 'ffmpeg' &&
    operationId === 'tool.ffmpeg.execute_approved_media_recipe.v1'
  ) {
    return {
      ...common,
      toolId: 'ffmpeg',
      operationId,
      workloadProfileId:
        PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization,
    }
  }
  throw new ApiError(
    'TOOL_NOT_READY',
    'Cloud-dispatch attempt start requires an approved durable internal-cost workload profile.',
    503,
    {
      requiredGate: 'canonical_cloud_dispatch_durable_attempt_cost_profile',
      canonicalToolId: manifestEntry.approvedToolId,
      operationId,
    },
  )
}

function assertAttemptStartMatches(input: {
  evidence: CanonicalPrivateCloudDispatchAttemptStartEvidence
  scope: StoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  entry: CanonicalCloudDispatchOutboxEntry
  queueEntry: CanonicalPrivatePackageWorkQueueEntry
  descriptor: ReturnType<typeof describePrivateInternalAttemptCostEvidence>
}): void {
  const evidence = input.evidence
  const dispatch = evidence.dispatch
  const entry = input.entry
  const activeClaim = input.queueEntry.activeClaim
  const timeoutRelease = input.queueEntry.lastRelease?.dispatchTimeout
  const exactQueueAttempt = (
    activeClaim?.claimId === dispatch.queueClaimId &&
    activeClaim.claimHash === dispatch.queueClaimHash &&
    activeClaim.expiresAt === dispatch.queueClaimExpiresAt
  ) || (
    input.queueEntry.lastRelease?.claimId === dispatch.queueClaimId &&
    timeoutRelease?.queueClaimHash === dispatch.queueClaimHash &&
    timeoutRelease.queueClaimExpiresAt === dispatch.queueClaimExpiresAt
  )
  if (
    evidence.ownerUserId !== input.scope.ownerUserId ||
    stableAuthorityStringify(evidence.identity) !==
      stableAuthorityStringify(input.descriptor.identity) ||
    evidence.attemptIdentityHash !== input.descriptor.attemptIdentityHash ||
    evidence.attemptInputHash !== input.descriptor.attemptInputHash ||
    stableAuthorityStringify(evidence.resourceEnvelope) !==
      stableAuthorityStringify(input.descriptor.resourceEnvelope) ||
    dispatch.dispatchIntentId !== entry.immutable.dispatchIntentId ||
    dispatch.packageRecordId !== entry.immutable.packageRecordId ||
    dispatch.packageDeliveryAttempt !== entry.immutable.packageDeliveryAttempt ||
    dispatch.queueDefinitionHash !== input.definition.definitionHash ||
    dispatch.handoffManifestHash !== input.manifest.manifestHash ||
    dispatch.manifestEntryHash !== entry.immutable.manifestEntryHash ||
    dispatch.queueClaimId !== entry.immutable.queueClaimId ||
    dispatch.queueClaimHash !== entry.immutable.queueClaimHash ||
    dispatch.queueClaimExpiresAt !== entry.immutable.queueClaimExpiresAt ||
    dispatch.queueClaimAttemptDeadlineAt !== entry.immutable.queueClaimAttemptDeadlineAt ||
    dispatch.controllerReceiptHash !== entry.controllerReceipt?.receiptHash ||
    dispatch.workerReceiptHash !== entry.workerReceipt?.receiptHash ||
    input.queueEntry.definition.jobId !== entry.immutable.jobId ||
    !exactQueueAttempt
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Durable cloud-dispatch attempt start does not match the exact accepted worker attempt.',
      409,
      { requiredGate: 'canonical_cloud_dispatch_attempt_start_integrity' },
    )
  }
}

function validTimestamp(value: string, label: string): string {
  if (!timestamp.safeParse(value).success) {
    throw new ApiError('VALIDATION_FAILED', `Cloud-dispatch ${label} timestamp is invalid.`, 400)
  }
  return value
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_cloud_dispatch_durable_attempt_start',
  })
}
