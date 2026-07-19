import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import type {
  CanonicalPrivatePackageWorkQueueDefinition,
  CanonicalPrivatePackageWorkQueueJobDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  canonicalCloudDispatchWorkerFailureEvidenceSchema,
  canonicalCloudDispatchWorkerTimeoutEvidenceSchema,
  type CanonicalCloudDispatchWorkerFailureEvidence,
  type CanonicalCloudDispatchWorkerTimeoutEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION,
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION,
  canonicalPrivatePackageWorkQueueAggregateSchema,
  canonicalPrivatePackageWorkQueueCompletedOutcomeSchema,
  type CanonicalPrivatePackageWorkQueueAggregate,
  type CanonicalPrivatePackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueCompletedOutcome,
  type CanonicalPrivatePackageWorkQueueEntry,
  type CanonicalPrivatePackageWorkQueueEvent,
  type CanonicalPrivatePackageWorkQueueDispatchFailure,
  type CanonicalPrivatePackageWorkQueueDispatchTimeout,
  type CanonicalPrivatePackageWorkQueueRelease,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-first-child-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-source-authority-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-master-timing-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION,
} from '../edit-architecture/professional-long-form-first-object-chunk-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-continuous-program-audio-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-cross-chunk-color-continuity-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-master-assembly-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID,
} from '../edit-architecture/professional-long-form-private-master-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION,
} from '../edit-architecture/professional-long-form-customer-delivery-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION,
} from '../edit-architecture/professional-long-form-customer-delivery-h264-qa-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION,
} from '../edit-architecture/professional-long-form-customer-delivery-mux-execution-contract'
import {
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION,
  PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION,
} from '../edit-architecture/professional-long-form-customer-delivery-decoded-qa-execution-contract'
import {
  isProfessionalLongFormContinuousProgramAudioAuthorization,
  isProfessionalLongFormContinuousProgramAudioAuthority,
  isProfessionalLongFormContinuousProgramAudioCompletion,
  isProfessionalLongFormCrossChunkColorAuthorization,
  isProfessionalLongFormCrossChunkColorAuthority,
  isProfessionalLongFormCrossChunkColorCompletion,
  isProfessionalLongFormMasterAssemblyAuthorization,
  isProfessionalLongFormMasterAssemblyAuthority,
  isProfessionalLongFormMasterAssemblyCompletion,
  isProfessionalLongFormPrivateMasterQaAuthorization,
  isProfessionalLongFormPrivateMasterQaAuthority,
  isProfessionalLongFormPrivateMasterQaCompletion,
  isProfessionalLongFormDeliveryH264Authorization,
  isProfessionalLongFormDeliveryH264Authority,
  isProfessionalLongFormDeliveryH264Completion,
  isProfessionalLongFormDeliveryH264QaAuthorization,
  isProfessionalLongFormDeliveryH264QaAuthority,
  isProfessionalLongFormDeliveryH264QaCompletion,
  isProfessionalLongFormDeliveryDecodedAudioQaAuthorization,
  isProfessionalLongFormDeliveryDecodedAudioQaAuthority,
  isProfessionalLongFormDeliveryDecodedAudioQaCompletion,
  isProfessionalLongFormDeliveryDecodedVideoQaAuthorization,
  isProfessionalLongFormDeliveryDecodedVideoQaAuthority,
  isProfessionalLongFormDeliveryDecodedVideoQaCompletion,
  isProfessionalLongFormDeliveryMuxAuthorization,
  isProfessionalLongFormDeliveryMuxAuthority,
  isProfessionalLongFormDeliveryMuxCompletion,
  isProfessionalLongFormDeliveryRootAuthorization,
  isProfessionalLongFormDeliveryRootAuthority,
  isProfessionalLongFormDeliveryRootCompletion,
  isProfessionalLongFormFirstChildAuthorization,
  isProfessionalLongFormFirstChildExecutionAuthority,
  isProfessionalLongFormFirstObjectChunkQaAuthorization,
  isProfessionalLongFormFirstObjectChunkQaAuthority,
  isProfessionalLongFormFirstObjectChunkRenderAuthorization,
  isProfessionalLongFormFirstObjectChunkRenderAuthority,
  isProfessionalLongFormFirstObjectChunkRenderCompletion,
  isProfessionalLongFormFirstObjectChunkQaCompletion,
  isProfessionalLongFormMasterTimingAuthorization,
  isProfessionalLongFormMasterTimingCompletion,
  isProfessionalLongFormMasterTimingExecutionAuthority,
  isProfessionalLongFormSourceAuthorityAuthorization,
  isProfessionalLongFormSourceAuthorityCompletion,
  isProfessionalLongFormSourceAuthorityExecutionAuthority,
  professionalLongFormAuthorizedChildAuthorizationReceiptSchema,
  professionalLongFormAuthorizedChildExecutionAttemptSchema,
  professionalLongFormAuthorizedChildExecutionAuthoritySchema,
  type ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
  type ProfessionalLongFormAuthorizedChildExecutionAttempt,
  type ProfessionalLongFormAuthorizedChildExecutionAuthority,
} from '../edit-architecture/professional-long-form-authorized-child-contract'
import {
  readPrivateAuthorityJsonBlob,
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalPrivatePackageStateLockAuthority,
  canonicalPrivatePackageStatePaths,
  withCanonicalPrivatePackageStateLock,
  type CanonicalPrivatePackageStateLockAuthority,
} from './private-canonical-package-state-transaction'

const STORE_RECORD_VERSION = 'private-canonical-package-work-queue-record-v1' as const
const STORE_RECORD_SOURCE = 'private_canonical_package_work_queue_store' as const
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
const MAX_QUEUE_EVENTS = 8_192

export interface CanonicalPrivatePackageWorkQueueStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  packageRecordId: string
  approvedPlanSnapshotId: string
}

interface PersistedQueueEnvelope {
  recordVersion: typeof STORE_RECORD_VERSION
  source: typeof STORE_RECORD_SOURCE
  ownerUserId: string
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  checksumSha256: string
}

export type CanonicalPrivatePackageWorkQueueClaimResult =
  | {
      disposition: 'claimed'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry & { activeClaim: CanonicalPrivatePackageWorkQueueClaim }
      claimCredential: string
    }
  | {
      disposition: 'completed'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry
      outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
    }
  | {
      disposition: 'already_leased' | 'dependency_blocked' | 'scheduled_wait' |
        'capability_blocked' | 'attempts_exhausted' | 'user_review_required'
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      entry: CanonicalPrivatePackageWorkQueueEntry
    }

export function clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke(): void {
  // Filesystem-backed package locks have no process cache to clear.
}

export async function ensurePrivateCanonicalPackageWorkQueue(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  now?: string
}): Promise<{ aggregate: CanonicalPrivatePackageWorkQueueAggregate; created: boolean }> {
  assertScope(input.scope)
  assertDefinitionScope(input.scope, input.definition)
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) => {
      const existing = await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
        lockAuthority,
        input.scope,
        input.definition,
      )
      if (existing) return { aggregate: existing, created: false }
      const createdAt = validTimestamp(input.now ?? new Date().toISOString(), 'queue creation')
      const entries = input.definition.jobs.map((definition) =>
        createQueuedEntry(definition, createdAt))
      const queueCreated = createEvent({
        priorEvents: [],
        eventType: 'queue_created',
        at: createdAt,
      })
      const aggregate = finalizeAggregate({
        schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_AGGREGATE_VERSION,
        source: 'private_canonical_package_work_queue_store',
        ownerUserId: input.scope.ownerUserId,
        definitionHash: input.definition.definitionHash,
        identity: { ...input.definition.identity },
        entries,
        events: [queueCreated],
        boundaries: queueBoundaries(),
        createdAt,
        updatedAt: createdAt,
      })
      await persistQueueAggregate(input.scope, aggregate)
      return { aggregate, created: true }
    },
  })
}

export async function readPrivateCanonicalPackageWorkQueue(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
}): Promise<CanonicalPrivatePackageWorkQueueAggregate | undefined> {
  assertScope(input.scope)
  assertDefinitionScope(input.scope, input.definition)
  return withCanonicalPrivatePackageStateLock({
    scope: input.scope,
    operation: async (lockAuthority) =>
      readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
        lockAuthority,
        input.scope,
        input.definition,
      ),
  })
}

export async function claimPrivateCanonicalPackageWorkQueueJob(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  workerIdentity: string
  workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
  now: string
  leaseDurationMs: number
}): Promise<CanonicalPrivatePackageWorkQueueClaimResult> {
  const now = validTimestamp(input.now, 'queue claim')
  assertWorkerIdentity(input.workerIdentity)
  assertLeaseDuration(input.leaseDurationMs)
  return mutateQueue(input.scope, input.definition, now, (aggregate) =>
    applyQueueClaimMutation(aggregate, { ...input, now }))
}

export async function authorizePrivateCanonicalPackageWorkQueueJob(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  authorization: ProfessionalLongFormAuthorizedChildAuthorizationReceipt
  executionAuthority: ProfessionalLongFormAuthorizedChildExecutionAuthority
  now: string
}): Promise<{
  disposition: 'authorized' | 'exact_replay'
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    professionalLongFormExecutionAuthorization:
      ProfessionalLongFormAuthorizedChildAuthorizationReceipt
  }
}> {
  const now = validTimestamp(input.now, 'professional long-form execution authorization')
  const authorization =
    professionalLongFormAuthorizedChildAuthorizationReceiptSchema.parse(
      input.authorization,
    )
  const executionAuthority =
    professionalLongFormAuthorizedChildExecutionAuthoritySchema.parse(
      input.executionAuthority,
    )
  const persistedAuthority = await readPrivateAuthorityJsonBlob({
    localStorageRoot: input.scope.localStorageRoot,
    ref: authorization.authorityRef,
  })
  assertPersistedProfessionalLongFormExecutionAuthority({
    definition: input.definition,
    authorization,
    executionAuthority,
    persistedAuthority,
  })
  if (Date.parse(authorization.reservationExpiresAt) <= Date.parse(now)) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'Professional long-form child authorization requires an unexpired funded reservation.',
      409,
    )
  }
  return mutateQueue(input.scope, input.definition, now, (aggregate) => {
    const entry = requiredEntry(aggregate, input.jobId)
    assertProfessionalLongFormAuthorizationTarget({
      aggregate,
      definition: input.definition,
      entry,
      authorization,
    })
    const existing = entry.professionalLongFormExecutionAuthorization
    if (existing) {
      if (stableAuthorityStringify(existing) !== stableAuthorityStringify(authorization)) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Professional long-form child already has different execution authorization.',
          409,
        )
      }
      return {
        disposition: 'exact_replay' as const,
        entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
          professionalLongFormExecutionAuthorization:
            ProfessionalLongFormAuthorizedChildAuthorizationReceipt
        },
      }
    }
    if (
      entry.state !== 'queued' ||
      entry.deliveryAttemptCount !== 0 ||
      entry.activeClaim ||
      entry.completion ||
      entry.lastRelease ||
      entry.professionalLongFormExecutionAttempt
    ) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Professional long-form child authorization requires one pristine exact queue entry.',
        503,
      )
    }
    entry.professionalLongFormExecutionAuthorization = authorization
    touchEntry(entry, now)
    appendEvent(aggregate, {
      eventType: 'job_execution_authorized',
      jobId: entry.definition.jobId,
      authorizationId: authorization.authorizationId,
      at: now,
    })
    return {
      disposition: 'authorized' as const,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        professionalLongFormExecutionAuthorization:
          ProfessionalLongFormAuthorizedChildAuthorizationReceipt
      },
    }
  })
}

export async function beginPrivateCanonicalPackageWorkQueueExecutionAttempt(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  now: string
}): Promise<{
  disposition: 'started' | 'exact_replay'
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    professionalLongFormExecutionAttempt:
      ProfessionalLongFormAuthorizedChildExecutionAttempt
  }
  executionAttempt: ProfessionalLongFormAuthorizedChildExecutionAttempt
}> {
  const now = validTimestamp(input.now, 'professional long-form execution attempt')
  return mutateQueue(input.scope, input.definition, now, (aggregate) => {
    const entry = requiredEntry(aggregate, input.jobId)
    const authorization = entry.professionalLongFormExecutionAuthorization
    if (!authorization || !isExactProfessionalLongFormAuthorizedChild(aggregate, entry)) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Professional long-form child lacks exact persisted operation authority.',
        503,
      )
    }
    if (Date.parse(authorization.reservationExpiresAt) <= Date.parse(now)) {
      throw new ApiError(
        'CREDITS_NOT_RESERVED',
        'Professional long-form child execution start requires an unexpired funded reservation.',
        409,
      )
    }
    const claim = requireActiveClaim(
      entry,
      input.claimId,
      input.claimCredential,
      now,
    )
    const existing = entry.professionalLongFormExecutionAttempt
    if (existing) {
      if (
        existing.authorizationId !== authorization.authorizationId ||
        existing.authorityHash !== authorization.authorityHash ||
        existing.jobId !== entry.definition.jobId ||
        existing.claimId !== claim.claimId ||
        existing.claimHash !== claim.claimHash ||
        existing.workerIdentityHash !== claim.workerIdentityHash ||
        existing.deliveryAttempt !== claim.deliveryAttempt ||
        stableAuthorityStringify(existing.operation) !==
          stableAuthorityStringify(authorization.operation)
      ) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Professional long-form child execution attempt already has different authority.',
          409,
        )
      }
      return {
        disposition: 'exact_replay' as const,
        entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
          professionalLongFormExecutionAttempt:
            ProfessionalLongFormAuthorizedChildExecutionAttempt
        },
        executionAttempt: existing,
      }
    }
    const sourceAuthorityAttempt =
      authorization.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID
    const masterTimingAttempt =
      authorization.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID
    const firstObjectChunkRenderAttempt =
      isProfessionalLongFormFirstObjectChunkRenderAuthorization(authorization)
    const firstObjectChunkQaAttempt =
      isProfessionalLongFormFirstObjectChunkQaAuthorization(authorization)
    const continuousProgramAudioAttempt =
      isProfessionalLongFormContinuousProgramAudioAuthorization(authorization)
    const crossChunkColorAttempt =
      isProfessionalLongFormCrossChunkColorAuthorization(authorization)
    const masterAssemblyAttempt =
      isProfessionalLongFormMasterAssemblyAuthorization(authorization)
    const privateMasterQaAttempt =
      isProfessionalLongFormPrivateMasterQaAuthorization(authorization)
    const deliveryRootAttempt =
      isProfessionalLongFormDeliveryRootAuthorization(authorization)
    const deliveryH264Attempt =
      isProfessionalLongFormDeliveryH264Authorization(authorization)
    const deliveryH264QaAttempt =
      isProfessionalLongFormDeliveryH264QaAuthorization(authorization)
    const deliveryMuxAttempt =
      isProfessionalLongFormDeliveryMuxAuthorization(authorization)
    const deliveryDecodedVideoQaAttempt =
      isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(authorization)
    const deliveryDecodedAudioQaAttempt =
      isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(authorization)
    const attemptWithoutHash = {
      schemaVersion: deliveryDecodedAudioQaAttempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_AUDIO_QA_ATTEMPT_VERSION
        : deliveryDecodedVideoQaAttempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_DECODED_VIDEO_QA_ATTEMPT_VERSION
        : deliveryMuxAttempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_MUX_ATTEMPT_VERSION
        : deliveryH264QaAttempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_H264_QA_ATTEMPT_VERSION
        : deliveryH264Attempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_H264_ATTEMPT_VERSION
        : deliveryRootAttempt
        ? PROFESSIONAL_LONG_FORM_DELIVERY_ROOT_ATTEMPT_VERSION
        : privateMasterQaAttempt
        ? PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_ATTEMPT_VERSION
        : masterAssemblyAttempt
        ? PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_ATTEMPT_VERSION
        : crossChunkColorAttempt
        ? PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_ATTEMPT_VERSION
        : continuousProgramAudioAttempt
        ? PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_ATTEMPT_VERSION
        : firstObjectChunkQaAttempt
        ? PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_QA_ATTEMPT_VERSION
        : firstObjectChunkRenderAttempt
          ? PROFESSIONAL_LONG_FORM_FIRST_OBJECT_CHUNK_RENDER_ATTEMPT_VERSION
          : masterTimingAttempt
            ? PROFESSIONAL_LONG_FORM_MASTER_TIMING_EXECUTION_ATTEMPT_VERSION
            : sourceAuthorityAttempt
              ? PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_EXECUTION_ATTEMPT_VERSION
              : PROFESSIONAL_LONG_FORM_FIRST_CHILD_EXECUTION_ATTEMPT_VERSION,
      source: 'private_canonical_package_work_queue_store' as const,
      executionAttemptId: `long-form-child-attempt-${sha256AuthorityValue({
        authorizationId: authorization.authorizationId,
        authorityHash: authorization.authorityHash,
        claimId: claim.claimId,
        claimHash: claim.claimHash,
        deliveryAttempt: claim.deliveryAttempt,
      }).slice(0, 40)}`,
      authorizationId: authorization.authorizationId,
      authorityHash: authorization.authorityHash,
      jobId: entry.definition.jobId,
      approvedWorkItemId: authorization.approvedWorkItemId,
      claimId: claim.claimId,
      claimHash: claim.claimHash,
      workerIdentityHash: claim.workerIdentityHash,
      deliveryAttempt: 1 as const,
      operation: authorization.operation,
      startedAt: now,
      dispatchConsumed: true as const,
      plaintextClaimCredentialPersisted: false as const,
    }
    const executionAttempt =
      professionalLongFormAuthorizedChildExecutionAttemptSchema.parse({
        ...attemptWithoutHash,
        attemptHash: sha256AuthorityValue(attemptWithoutHash),
      })
    if (claim.deliveryAttempt !== 1) {
      throw new ApiError(
        'WORKER_CLAIM_CONFLICT',
        'Professional long-form snapshot validation permits exactly one execution attempt.',
        409,
      )
    }
    entry.professionalLongFormExecutionAttempt = executionAttempt
    touchEntry(entry, now)
    appendEvent(aggregate, {
      eventType: 'job_execution_started',
      jobId: entry.definition.jobId,
      claimId: claim.claimId,
      authorizationId: authorization.authorizationId,
      executionAttemptId: executionAttempt.executionAttemptId,
      at: now,
    })
    return {
      disposition: 'started' as const,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        professionalLongFormExecutionAttempt:
          ProfessionalLongFormAuthorizedChildExecutionAttempt
      },
      executionAttempt,
    }
  })
}

export function preparePrivateCanonicalPackageWorkQueueJobClaim(input: {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  workerIdentity: string
  workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
  now: string
  leaseDurationMs: number
}): CanonicalPrivatePackageWorkQueueClaimResult {
  const now = validTimestamp(input.now, 'queue claim')
  assertWorkerIdentity(input.workerIdentity)
  assertLeaseDuration(input.leaseDurationMs)
  const aggregate = structuredClone(input.aggregate)
  const before = structuredClone(aggregate)
  const value = applyQueueClaimMutation(aggregate, { ...input, now })
  assertCompletedEntriesImmutable(before, aggregate)
  const finalized = stableAuthorityStringify(before) === stableAuthorityStringify(aggregate)
    ? aggregate
    : finalizeAggregate({
        ...aggregate,
        updatedAt: now,
        aggregateHash: undefined,
        summary: undefined,
      })
  return { ...value, aggregate: finalized } as CanonicalPrivatePackageWorkQueueClaimResult
}

export function preparePrivateCanonicalPackageWorkQueueDispatchCompletion(input: {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  queueClaimId: string
  queueClaimHash: string
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
  now: string
}): {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    completion: NonNullable<CanonicalPrivatePackageWorkQueueEntry['completion']>
  }
  disposition: 'completed' | 'exact_replay'
} {
  const now = validTimestamp(input.now, 'dispatch completion')
  const outcome = canonicalPrivatePackageWorkQueueCompletedOutcomeSchema.parse(input.outcome)
  const aggregate = structuredClone(input.aggregate)
  const before = structuredClone(aggregate)
  const entry = requiredEntry(aggregate, input.jobId)
  assertOutcomeMatchesDefinition(outcome, entry.definition)
  assertProfessionalLongFormCompletionEvidence(entry, outcome)
  if (entry.state === 'completed') {
    if (
      entry.completion?.claimId !== input.queueClaimId ||
      stableAuthorityStringify(entry.completion.outcome) !==
        stableAuthorityStringify(outcome)
    ) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Canonical dispatch completion already has different authority.',
        409,
      )
    }
    return {
      aggregate,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        completion: NonNullable<CanonicalPrivatePackageWorkQueueEntry['completion']>
      },
      disposition: 'exact_replay',
    }
  }
  const claim = entry.activeClaim
  if (
    entry.state !== 'leased' || !claim ||
    claim.claimId !== input.queueClaimId ||
    claim.claimHash !== input.queueClaimHash ||
    Date.parse(claim.expiresAt) <= Date.parse(now) ||
    Date.parse(claim.attemptDeadlineAt) <= Date.parse(now)
  ) throw workerLeaseExpired()
  const completionWithoutHash = {
    claimId: claim.claimId,
    credentialSha256: claim.credentialSha256,
    outcome,
    completedAt: now,
  }
  entry.state = 'completed'
  entry.activeClaim = undefined
  entry.completion = {
    ...completionWithoutHash,
    completionHash: sha256AuthorityValue(completionWithoutHash),
  }
  entry.lastRelease = undefined
  touchEntry(entry, now)
  appendEvent(aggregate, {
    eventType: 'job_completed',
    jobId: entry.definition.jobId,
    claimId: claim.claimId,
    at: now,
  })
  assertCompletedEntriesImmutable(before, aggregate)
  const finalized = finalizeAggregate({
    ...aggregate,
    updatedAt: now,
    aggregateHash: undefined,
    summary: undefined,
  })
  const completedEntry = finalized.entries.find((candidate) =>
    candidate.definition.jobId === input.jobId)
  if (!completedEntry?.completion) {
    throw invalidQueue('Canonical dispatch completion did not finalize exactly.')
  }
  return {
    aggregate: finalized,
    entry: completedEntry as CanonicalPrivatePackageWorkQueueEntry & {
      completion: NonNullable<CanonicalPrivatePackageWorkQueueEntry['completion']>
    },
    disposition: 'completed',
  }
}

export function preparePrivateCanonicalPackageWorkQueueDispatchFailure(input: {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  queueClaimId: string
  queueClaimHash: string
  workerReceiptHash: string
  failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence
  now: string
}): {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
      dispatchFailure: CanonicalPrivatePackageWorkQueueDispatchFailure
    }
  }
  disposition: 'released' | 'exact_replay'
} {
  const now = validTimestamp(input.now, 'dispatch failure')
  const failureEvidence = canonicalCloudDispatchWorkerFailureEvidenceSchema.parse(
    input.failureEvidence,
  )
  if (failureEvidence.executionState === 'completed_requires_reconciliation') {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'A post-commit worker failure requires completion reconciliation and cannot release the attempt.',
      503,
    )
  }
  const retryableFailureEvidence = failureEvidence as
    CanonicalCloudDispatchWorkerFailureEvidence & {
      executionState: 'released_before_execution' | 'failed_before_commit'
      failureCategory: Exclude<
        CanonicalCloudDispatchWorkerFailureEvidence['failureCategory'],
        'post_commit_reconciliation'
      >
    }
  const aggregate = structuredClone(input.aggregate)
  const before = structuredClone(aggregate)
  const entry = requiredEntry(aggregate, input.jobId)
  if (entry.professionalLongFormExecutionAttempt) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'A consumed professional long-form execution attempt cannot be released as a cloud-dispatch failure.',
      503,
    )
  }
  if (entry.state === 'completed') {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'A completed package attempt cannot be converted into a retryable worker failure.',
      503,
    )
  }
  const failureEvidenceHash = sha256AuthorityValue(failureEvidence)
  const dispatchFailure = createDispatchFailureAuthority({
    definition: entry.definition,
    deliveryAttemptCount: entry.deliveryAttemptCount,
    queueClaimHash: input.queueClaimHash,
    workerReceiptHash: input.workerReceiptHash,
    failureEvidenceHash,
    failureEvidence: retryableFailureEvidence,
  })
  if (entry.state === 'queued' && entry.lastRelease?.claimId === input.queueClaimId) {
    if (
      entry.lastRelease.dispatchFailure === undefined ||
      stableAuthorityStringify(entry.lastRelease.dispatchFailure) !==
        stableAuthorityStringify(dispatchFailure)
    ) throw workerLeaseExpired()
    return {
      aggregate,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
          dispatchFailure: CanonicalPrivatePackageWorkQueueDispatchFailure
        }
      },
      disposition: 'exact_replay',
    }
  }
  const claim = entry.activeClaim
  if (
    entry.state !== 'leased' || !claim ||
    claim.claimId !== input.queueClaimId ||
    claim.claimHash !== input.queueClaimHash ||
    Date.parse(claim.expiresAt) <= Date.parse(now) ||
    Date.parse(claim.attemptDeadlineAt) <= Date.parse(now)
  ) throw workerLeaseExpired()
  const reason = dispatchFailure.queueDisposition === 'user_review_required'
    ? 'unexpected_execution_failure'
    : 'approved_attempt_failure'
  releaseEntry(
    entry,
    claim.claimId,
    claim.credentialSha256,
    reason,
    now,
    dispatchFailure,
  )
  appendEvent(aggregate, {
    eventType: 'claim_released',
    jobId: entry.definition.jobId,
    claimId: claim.claimId,
    at: now,
  })
  assertCompletedEntriesImmutable(before, aggregate)
  const finalized = finalizeAggregate({
    ...aggregate,
    updatedAt: now,
    aggregateHash: undefined,
    summary: undefined,
  })
  const releasedEntry = finalized.entries.find((candidate) =>
    candidate.definition.jobId === input.jobId)
  if (!releasedEntry?.lastRelease?.dispatchFailure) {
    throw invalidQueue('Canonical dispatch failure did not finalize exactly.')
  }
  return {
    aggregate: finalized,
    entry: releasedEntry as CanonicalPrivatePackageWorkQueueEntry & {
      lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
        dispatchFailure: CanonicalPrivatePackageWorkQueueDispatchFailure
      }
    },
    disposition: 'released',
  }
}

export function preparePrivateCanonicalPackageWorkQueueDispatchTimeout(input: {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  queueClaimId: string
  queueClaimHash: string
  queueClaimInitialExpiresAt: string
  controllerReceiptHash: string
  workerReceiptHash: string
  timeoutEvidence: CanonicalCloudDispatchWorkerTimeoutEvidence
  now: string
}): {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  entry: CanonicalPrivatePackageWorkQueueEntry & {
    lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
      dispatchTimeout: CanonicalPrivatePackageWorkQueueDispatchTimeout
    }
  }
  disposition: 'released' | 'exact_replay'
} {
  const now = validTimestamp(input.now, 'dispatch timeout')
  const timeoutEvidence = canonicalCloudDispatchWorkerTimeoutEvidenceSchema.parse(
    input.timeoutEvidence,
  )
  const aggregate = structuredClone(input.aggregate)
  const before = structuredClone(aggregate)
  const entry = requiredEntry(aggregate, input.jobId)
  if (entry.professionalLongFormExecutionAttempt) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'A consumed professional long-form execution attempt cannot be released as a cloud-dispatch timeout.',
      503,
    )
  }
  if (entry.state === 'completed') {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'A completed package attempt cannot be converted into an accepted-worker timeout.',
      503,
    )
  }
  const timeoutEvidenceHash = sha256AuthorityValue(timeoutEvidence)
  const dispatchTimeout = createDispatchTimeoutAuthority({
    definition: entry.definition,
    deliveryAttemptCount: entry.deliveryAttemptCount,
    queueClaimHash: input.queueClaimHash,
    controllerReceiptHash: input.controllerReceiptHash,
    workerReceiptHash: input.workerReceiptHash,
    timeoutEvidenceHash,
    timeoutEvidence,
  })
  if (entry.state === 'queued' && entry.lastRelease?.claimId === input.queueClaimId) {
    if (
      entry.lastRelease.dispatchTimeout === undefined ||
      stableAuthorityStringify(entry.lastRelease.dispatchTimeout) !==
        stableAuthorityStringify(dispatchTimeout)
    ) throw workerLeaseExpired()
    return {
      aggregate,
      entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
        lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
          dispatchTimeout: CanonicalPrivatePackageWorkQueueDispatchTimeout
        }
      },
      disposition: 'exact_replay',
    }
  }
  const claim = entry.activeClaim
  const expectedTimeoutDetailHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-cloud-dispatch-accepted-worker-timeout:v1',
    jobId: entry.definition.jobId,
    packageDeliveryAttempt: entry.deliveryAttemptCount,
    queueClaimId: input.queueClaimId,
    initialQueueClaimHash: input.queueClaimHash,
    expiredQueueClaimHash: claim?.claimHash,
    initialQueueClaimExpiresAt: input.queueClaimInitialExpiresAt,
    expiredQueueClaimExpiresAt: claim?.expiresAt,
    queueClaimHeartbeatAt: claim?.heartbeatAt,
    queueClaimHeartbeatCount: claim?.heartbeatCount,
    queueClaimAttemptDeadlineAt: claim?.attemptDeadlineAt,
  })
  if (
    entry.state !== 'leased' || !claim ||
    claim.claimId !== input.queueClaimId ||
    claim.deliveryAttempt !== entry.deliveryAttemptCount ||
    Date.parse(claim.expiresAt) > Date.parse(now) ||
    timeoutEvidence.initialQueueClaimHash !== input.queueClaimHash ||
    timeoutEvidence.expiredQueueClaimHash !== claim.claimHash ||
    timeoutEvidence.initialQueueClaimExpiresAt !== input.queueClaimInitialExpiresAt ||
    timeoutEvidence.expiredQueueClaimExpiresAt !== claim.expiresAt ||
    timeoutEvidence.queueClaimHeartbeatAt !== claim.heartbeatAt ||
    timeoutEvidence.queueClaimHeartbeatCount !== claim.heartbeatCount ||
    timeoutEvidence.queueClaimAttemptDeadlineAt !== claim.attemptDeadlineAt ||
    timeoutEvidence.timeoutDetailHash !== expectedTimeoutDetailHash
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Accepted-worker timeout evidence does not match the exact expired queue claim.',
      409,
    )
  }
  entry.expiredClaimRecoveryCount += 1
  releaseEntry(
    entry,
    claim.claimId,
    claim.credentialSha256,
    'expired_claim_recovered',
    now,
    undefined,
    dispatchTimeout,
  )
  appendEvent(aggregate, {
    eventType: 'expired_claim_recovered',
    jobId: entry.definition.jobId,
    claimId: claim.claimId,
    at: now,
  })
  assertCompletedEntriesImmutable(before, aggregate)
  const finalized = finalizeAggregate({
    ...aggregate,
    updatedAt: now,
    aggregateHash: undefined,
    summary: undefined,
  })
  const releasedEntry = finalized.entries.find((candidate) =>
    candidate.definition.jobId === input.jobId)
  if (!releasedEntry?.lastRelease?.dispatchTimeout) {
    throw invalidQueue('Canonical dispatch timeout did not finalize exactly.')
  }
  return {
    aggregate: finalized,
    entry: releasedEntry as CanonicalPrivatePackageWorkQueueEntry & {
      lastRelease: CanonicalPrivatePackageWorkQueueRelease & {
        dispatchTimeout: CanonicalPrivatePackageWorkQueueDispatchTimeout
      }
    },
    disposition: 'released',
  }
}

export async function heartbeatPrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  now: string
  leaseDurationMs: number
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue heartbeat')
  assertLeaseDuration(input.leaseDurationMs)
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    const claim = requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    const expiresAtMs = Math.min(
      Date.parse(now) + input.leaseDurationMs,
      Date.parse(claim.attemptDeadlineAt),
    )
    if (expiresAtMs <= Date.parse(now)) {
      throw workerLeaseExpired()
    }
    const withoutHash = {
      ...claim,
      heartbeatAt: now,
      heartbeatCount: claim.heartbeatCount + 1,
      expiresAt: new Date(expiresAtMs).toISOString(),
    } as Omit<CanonicalPrivatePackageWorkQueueClaim, 'claimHash'> & { claimHash?: string }
    delete withoutHash.claimHash
    entry.activeClaim = {
      ...withoutHash,
      claimHash: sha256AuthorityValue(withoutHash),
    }
    touchEntry(entry, now)
    return { disposition: 'heartbeat' as const }
  })
  return result.aggregate
}

export async function completePrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome
  now: string
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue completion')
  const outcome = canonicalPrivatePackageWorkQueueCompletedOutcomeSchema.parse(input.outcome)
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    if (entry.state === 'completed') {
      if (
        entry.completion!.claimId !== input.claimId ||
        !constantTimeHashEquals(
          entry.completion!.credentialSha256,
          sha256Text(input.claimCredential),
        )
      ) throw workerLeaseExpired()
      if (stableAuthorityStringify(entry.completion!.outcome) !== stableAuthorityStringify(outcome)) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical queue completion already has different bytes.', 409)
      }
      return { disposition: 'completed_replay' as const }
    }
    requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    assertOutcomeMatchesDefinition(outcome, entry.definition)
    assertProfessionalLongFormCompletionEvidence(entry, outcome)
    const completionWithoutHash = {
      claimId: input.claimId,
      credentialSha256: sha256Text(input.claimCredential),
      outcome,
      completedAt: now,
    }
    entry.state = 'completed'
    entry.activeClaim = undefined
    entry.completion = {
      ...completionWithoutHash,
      completionHash: sha256AuthorityValue(completionWithoutHash),
    }
    entry.lastRelease = undefined
    touchEntry(entry, now)
    appendEvent(aggregate, {
      eventType: 'job_completed',
      jobId: entry.definition.jobId,
      claimId: input.claimId,
      at: now,
    })
    return { disposition: 'completed' as const }
  })
  return result.aggregate
}

export async function releasePrivateCanonicalPackageWorkQueueClaim(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  definition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  claimId: string
  claimCredential: string
  reason: Exclude<CanonicalPrivatePackageWorkQueueRelease['reason'], 'expired_claim_recovered'>
  now: string
}): Promise<CanonicalPrivatePackageWorkQueueAggregate> {
  const now = validTimestamp(input.now, 'queue release')
  const result = await mutateQueue(input.scope, input.definition, now, (aggregate) => {
    expireClaims(aggregate, now)
    const entry = requiredEntry(aggregate, input.jobId)
    if (entry.state === 'queued' && entry.lastRelease?.claimId === input.claimId) {
      if (
        entry.lastRelease.reason !== input.reason ||
        !constantTimeHashEquals(
          entry.lastRelease.credentialSha256,
          sha256Text(input.claimCredential),
        )
      ) throw workerLeaseExpired()
      return { disposition: 'release_replay' as const }
    }
    requireActiveClaim(entry, input.claimId, input.claimCredential, now)
    if (entry.professionalLongFormExecutionAttempt) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'A consumed professional long-form execution attempt cannot be released without terminal reconciliation.',
        503,
      )
    }
    releaseEntry(entry, input.claimId, sha256Text(input.claimCredential), input.reason, now)
    appendEvent(aggregate, {
      eventType: 'claim_released',
      jobId: entry.definition.jobId,
      claimId: input.claimId,
      at: now,
    })
    return { disposition: 'released' as const }
  })
  return result.aggregate
}

export function canonicalPrivatePackageWorkQueueAggregateRelativePath(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): string {
  assertScope(scope)
  return canonicalPrivatePackageStatePaths(scope).queueRelativePath
}

async function mutateQueue<T extends { disposition: string }>(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  now: string,
  mutation: (aggregate: CanonicalPrivatePackageWorkQueueAggregate) => T,
): Promise<T & { aggregate: CanonicalPrivatePackageWorkQueueAggregate }> {
  assertScope(scope)
  assertDefinitionScope(scope, definition)
  return withCanonicalPrivatePackageStateLock({
    scope,
    operation: async (lockAuthority) => {
      const current = await readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
        lockAuthority,
        scope,
        definition,
      )
      if (!current) throw invalidQueue('Canonical package work queue has not been created.')
      const before = structuredClone(current)
      const value = mutation(current)
      assertCompletedEntriesImmutable(before, current)
      if (stableAuthorityStringify(before) === stableAuthorityStringify(current)) {
        return { ...value, aggregate: current }
      }
      const aggregate = finalizeAggregate({
        ...current,
        updatedAt: now,
        aggregateHash: undefined,
        summary: undefined,
      })
      await persistQueueAggregate(scope, aggregate)
      return { ...value, aggregate }
    },
  })
}

function applyQueueClaimMutation(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  input: {
    jobId: string
    workerIdentity: string
    workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
    now: string
    leaseDurationMs: number
  },
) {
  expireClaims(aggregate, input.now)
  const entry = requiredEntry(aggregate, input.jobId)
  if (entry.definition.workerType !== input.workerType) {
    throw new ApiError(
      'WORKER_CLAIM_CONFLICT',
      'Canonical queue worker type does not match immutable resource placement.',
      409,
    )
  }
  if (entry.state === 'completed') {
    return {
      disposition: 'completed' as const,
      entry,
      outcome: entry.completion!.outcome,
    }
  }
  if (entry.state === 'leased') {
    return { disposition: 'already_leased' as const, entry }
  }
  if (entry.lastRelease?.dispatchFailure?.queueDisposition === 'user_review_required') {
    return { disposition: 'user_review_required' as const, entry }
  }
  if (entry.deliveryAttemptCount >= entry.definition.maxAttempts) {
    return { disposition: 'attempts_exhausted' as const, entry }
  }
  const professionalLongFormAuthorization =
    entry.professionalLongFormExecutionAuthorization
  const exactProfessionalLongFormChild =
    isExactProfessionalLongFormAuthorizedChild(aggregate, entry)
  if (
    !entry.definition.privateExecutionReady &&
    (!exactProfessionalLongFormChild ||
      !professionalLongFormAuthorization ||
      Date.parse(professionalLongFormAuthorization.reservationExpiresAt) <=
        Date.parse(input.now))
  ) {
    return { disposition: 'capability_blocked' as const, entry }
  }
  if (Date.parse(entry.definition.scheduledFor) > Date.parse(input.now)) {
    return { disposition: 'scheduled_wait' as const, entry }
  }
  const completedJobIds = new Set(aggregate.entries
    .filter((candidate) => candidate.state === 'completed')
    .map((candidate) => candidate.definition.jobId))
  if (entry.definition.dependencyJobIds.some((dependencyJobId) =>
    !completedJobIds.has(dependencyJobId))) {
    return { disposition: 'dependency_blocked' as const, entry }
  }

  const claimCredential = randomBytes(32).toString('base64url')
  const claimId = `queue_claim_${randomUUID()}`
  const deliveryAttempt = entry.deliveryAttemptCount + 1
  const attemptDeadlineAt = new Date(
    Date.parse(input.now) + entry.definition.attemptTimeoutSeconds * 1_000,
  ).toISOString()
  const expiresAt = new Date(Math.min(
    Date.parse(input.now) + input.leaseDurationMs,
    Date.parse(attemptDeadlineAt),
  )).toISOString()
  const claimWithoutHash = {
    claimId,
    credentialSha256: sha256Text(claimCredential),
    workerIdentityHash: sha256AuthorityValue({
      domain: 'reeditpro:canonical-private-package-work-queue-worker:v1',
      workerIdentity: input.workerIdentity,
    }),
    workerType: entry.definition.workerType,
    resourceClassId: entry.definition.resourceClassId,
    placementHash: entry.definition.placementHash,
    deliveryAttempt,
    claimedAt: input.now,
    heartbeatAt: input.now,
    heartbeatCount: 0,
    expiresAt,
    attemptDeadlineAt,
  }
  const claim: CanonicalPrivatePackageWorkQueueClaim = {
    ...claimWithoutHash,
    claimHash: sha256AuthorityValue(claimWithoutHash),
  }
  entry.state = 'leased'
  entry.deliveryAttemptCount = deliveryAttempt
  entry.activeClaim = claim
  entry.completion = undefined
  entry.lastRelease = undefined
  touchEntry(entry, input.now)
  appendEvent(aggregate, {
    eventType: 'job_claimed',
    jobId: entry.definition.jobId,
    claimId,
    at: input.now,
  })
  return {
    disposition: 'claimed' as const,
    entry: entry as CanonicalPrivatePackageWorkQueueEntry & {
      activeClaim: CanonicalPrivatePackageWorkQueueClaim
    },
    claimCredential,
  }
}

export async function readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): Promise<CanonicalPrivatePackageWorkQueueAggregate | undefined> {
  assertCanonicalPrivatePackageStateLockAuthority({ lockAuthority, scope })
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivatePackageWorkQueueAggregateRelativePath(scope),
  })
  if (!content) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_AGGREGATE_BYTES) {
    throw invalidQueue('Canonical package work-queue record exceeds its private bound.')
  }
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidQueue('Canonical package work-queue record is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidQueue('Canonical package work-queue record is invalid.')
  }
  const envelope = value as Partial<PersistedQueueEnvelope>
  const parsed = canonicalPrivatePackageWorkQueueAggregateSchema.safeParse(envelope.aggregate)
  if (
    envelope.recordVersion !== STORE_RECORD_VERSION ||
    envelope.source !== STORE_RECORD_SOURCE ||
    envelope.ownerUserId !== scope.ownerUserId ||
    typeof envelope.checksumSha256 !== 'string' ||
    !parsed.success ||
    envelope.checksumSha256 !== sha256AuthorityValue(parsed.data)
  ) throw invalidQueue('Canonical package work-queue persistence integrity is invalid.')
  assertAggregateIntegrity(parsed.data, definition, scope)
  return parsed.data
}

async function persistQueueAggregate(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
): Promise<void> {
  const content = serializePrivateCanonicalPackageWorkQueueAggregate({ scope, aggregate })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: canonicalPrivatePackageWorkQueueAggregateRelativePath(scope),
    content,
  })
}

export function serializePrivateCanonicalPackageWorkQueueAggregate(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
}): string {
  const envelope: PersistedQueueEnvelope = {
    recordVersion: STORE_RECORD_VERSION,
    source: STORE_RECORD_SOURCE,
    ownerUserId: input.scope.ownerUserId,
    aggregate: input.aggregate,
    checksumSha256: sha256AuthorityValue(input.aggregate),
  }
  const content = `${stableAuthorityStringify(envelope)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_AGGREGATE_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical package work queue exceeded its bounded private persistence capacity.',
      503,
    )
  }
  return content
}

export async function persistPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
  lockAuthority: CanonicalPrivatePackageStateLockAuthority,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
): Promise<void> {
  assertCanonicalPrivatePackageStateLockAuthority({ lockAuthority, scope })
  await persistQueueAggregate(scope, aggregate)
}

function finalizeAggregate(input: Omit<CanonicalPrivatePackageWorkQueueAggregate, 'summary' | 'aggregateHash'> & {
  summary?: undefined
  aggregateHash?: undefined
}): CanonicalPrivatePackageWorkQueueAggregate {
  const entries = input.entries.map((entry) => finalizeEntry(entry))
  const summary = {
    totalJobCount: entries.length,
    queuedJobCount: entries.filter((entry) => entry.state === 'queued').length,
    leasedJobCount: entries.filter((entry) => entry.state === 'leased').length,
    completedJobCount: entries.filter((entry) => entry.state === 'completed').length,
    totalDeliveryAttemptCount: entries.reduce((total, entry) => total + entry.deliveryAttemptCount, 0),
    expiredClaimRecoveryCount: entries.reduce((total, entry) =>
      total + entry.expiredClaimRecoveryCount, 0),
    releasedClaimCount: input.events.filter((event) => event.eventType === 'claim_released').length,
    eventCount: input.events.length,
  }
  const payload = { ...input, entries, summary }
  return canonicalPrivatePackageWorkQueueAggregateSchema.parse({
    ...payload,
    aggregateHash: sha256AuthorityValue(payload),
  })
}

function finalizeEntry(
  input: Omit<CanonicalPrivatePackageWorkQueueEntry, 'entryHash'> & { entryHash?: string },
): CanonicalPrivatePackageWorkQueueEntry {
  const payload = { ...input }
  delete payload.entryHash
  return {
    ...payload,
    entryHash: sha256AuthorityValue(payload),
  }
}

function createQueuedEntry(
  definition: CanonicalPrivatePackageWorkQueueJobDefinition,
  now: string,
): CanonicalPrivatePackageWorkQueueEntry {
  return finalizeEntry({
    definition,
    state: 'queued',
    deliveryAttemptCount: 0,
    expiredClaimRecoveryCount: 0,
    updatedAt: now,
  })
}

function touchEntry(entry: CanonicalPrivatePackageWorkQueueEntry, now: string): void {
  entry.updatedAt = now
  entry.entryHash = ''
}

function expireClaims(aggregate: CanonicalPrivatePackageWorkQueueAggregate, now: string): void {
  const nowMs = Date.parse(now)
  for (const entry of aggregate.entries) {
    const claim = entry.activeClaim
    if (entry.state !== 'leased' || !claim || Date.parse(claim.expiresAt) > nowMs) continue
    if (entry.professionalLongFormExecutionAttempt) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Expired professional long-form execution requires a future terminal-attempt recovery authority.',
        503,
        {
          requiredGate:
            'canonical_professional_long_form_started_attempt_timeout_reconciliation',
        },
      )
    }
    entry.expiredClaimRecoveryCount += 1
    releaseEntry(
      entry,
      claim.claimId,
      claim.credentialSha256,
      'expired_claim_recovered',
      now,
    )
    appendEvent(aggregate, {
      eventType: 'expired_claim_recovered',
      jobId: entry.definition.jobId,
      claimId: claim.claimId,
      at: now,
    })
  }
}

function releaseEntry(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  claimId: string,
  credentialSha256: string,
  reason: CanonicalPrivatePackageWorkQueueRelease['reason'],
  now: string,
  dispatchFailure?: CanonicalPrivatePackageWorkQueueDispatchFailure,
  dispatchTimeout?: CanonicalPrivatePackageWorkQueueDispatchTimeout,
): void {
  const releaseWithoutHash = {
    claimId,
    credentialSha256,
    reason,
    ...(dispatchFailure ? { dispatchFailure } : {}),
    ...(dispatchTimeout ? { dispatchTimeout } : {}),
    releasedAt: now,
  }
  entry.state = 'queued'
  entry.activeClaim = undefined
  entry.completion = undefined
  entry.lastRelease = {
    ...releaseWithoutHash,
    releaseHash: sha256AuthorityValue(releaseWithoutHash),
  }
  touchEntry(entry, now)
}

function createDispatchTimeoutAuthority(input: {
  definition: CanonicalPrivatePackageWorkQueueJobDefinition
  deliveryAttemptCount: number
  queueClaimHash: string
  controllerReceiptHash: string
  workerReceiptHash: string
  timeoutEvidenceHash: string
  timeoutEvidence: CanonicalCloudDispatchWorkerTimeoutEvidence
}): CanonicalPrivatePackageWorkQueueDispatchTimeout {
  const remainingAttempts = Math.max(
    0,
    input.definition.maxAttempts - input.deliveryAttemptCount,
  )
  const queueDisposition = remainingAttempts === 0
    ? 'attempts_exhausted' as const
    : 'retry_available' as const
  return {
    queueClaimHash: input.queueClaimHash,
    expiredQueueClaimHash: input.timeoutEvidence.expiredQueueClaimHash,
    controllerReceiptHash: input.controllerReceiptHash,
    workerReceiptHash: input.workerReceiptHash,
    timeoutEvidenceHash: input.timeoutEvidenceHash,
    timeoutDetailHash: input.timeoutEvidence.timeoutDetailHash,
    queueClaimExpiresAt: input.timeoutEvidence.expiredQueueClaimExpiresAt,
    queueClaimAttemptDeadlineAt:
      input.timeoutEvidence.queueClaimAttemptDeadlineAt,
    attemptInternalCostEvidenceHash:
      input.timeoutEvidence.attemptInternalCostEvidenceHash,
    failureCategory: 'execution_timeout',
    failureCode: 'WORKER_LEASE_EXPIRED',
    executionState: 'failed_before_commit',
    retryDisposition: queueDisposition === 'retry_available'
      ? 'retry_same_approved_operation'
      : 'fallback_or_user_review_required',
    queueDisposition,
    approvedMaxAttempts: input.definition.maxAttempts,
    remainingAttempts,
  }
}

function createDispatchFailureAuthority(input: {
  definition: CanonicalPrivatePackageWorkQueueJobDefinition
  deliveryAttemptCount: number
  queueClaimHash: string
  workerReceiptHash: string
  failureEvidenceHash: string
  failureEvidence: CanonicalCloudDispatchWorkerFailureEvidence & {
    executionState: 'released_before_execution' | 'failed_before_commit'
    failureCategory: Exclude<
      CanonicalCloudDispatchWorkerFailureEvidence['failureCategory'],
      'post_commit_reconciliation'
    >
  }
}): CanonicalPrivatePackageWorkQueueDispatchFailure {
  const remainingAttempts = Math.max(
    0,
    input.definition.maxAttempts - input.deliveryAttemptCount,
  )
  const userReviewRequired = ['authority_changed', 'unknown_internal'].includes(
    input.failureEvidence.failureCategory,
  )
  const queueDisposition = userReviewRequired
    ? 'user_review_required' as const
    : remainingAttempts === 0
      ? 'attempts_exhausted' as const
      : 'retry_available' as const
  return {
    queueClaimHash: input.queueClaimHash,
    workerReceiptHash: input.workerReceiptHash,
    failureEvidenceHash: input.failureEvidenceHash,
    attemptInternalCostEvidenceHash:
      input.failureEvidence.attemptInternalCostEvidenceHash,
    executionState: input.failureEvidence.executionState,
    failureCategory: input.failureEvidence.failureCategory,
    retryDisposition: queueDisposition === 'retry_available'
      ? 'retry_same_approved_operation'
      : 'fallback_or_user_review_required',
    queueDisposition,
    approvedMaxAttempts: input.definition.maxAttempts,
    remainingAttempts,
  }
}

function appendEvent(
  aggregate: Pick<CanonicalPrivatePackageWorkQueueAggregate, 'events'>,
  input: {
    eventType: CanonicalPrivatePackageWorkQueueEvent['eventType']
    jobId?: string
    claimId?: string
    authorizationId?: string
    executionAttemptId?: string
    at: string
  },
): void {
  if (aggregate.events.length >= MAX_QUEUE_EVENTS) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical package work-queue event capacity is exhausted.',
      503,
    )
  }
  aggregate.events.push(createEvent({ priorEvents: aggregate.events, ...input }))
}

function createEvent(input: {
  priorEvents: CanonicalPrivatePackageWorkQueueEvent[]
  eventType: CanonicalPrivatePackageWorkQueueEvent['eventType']
  jobId?: string
  claimId?: string
  authorizationId?: string
  executionAttemptId?: string
  at: string
}): CanonicalPrivatePackageWorkQueueEvent {
  const withoutHash = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_EVENT_VERSION,
    sequence: input.priorEvents.length + 1,
    eventType: input.eventType,
    ...(input.jobId ? { jobId: input.jobId } : {}),
    ...(input.claimId ? { claimId: input.claimId } : {}),
    ...(input.authorizationId ? { authorizationId: input.authorizationId } : {}),
    ...(input.executionAttemptId
      ? { executionAttemptId: input.executionAttemptId }
      : {}),
    at: input.at,
    previousEventHash: input.priorEvents.at(-1)?.eventHash ?? null,
  }
  return { ...withoutHash, eventHash: sha256AuthorityValue(withoutHash) }
}

function requireActiveClaim(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  claimId: string,
  claimCredential: string,
  now: string,
): CanonicalPrivatePackageWorkQueueClaim {
  const claim = entry.activeClaim
  if (
    entry.state !== 'leased' || !claim || claim.claimId !== claimId ||
    Date.parse(claim.expiresAt) <= Date.parse(now) ||
    !constantTimeHashEquals(claim.credentialSha256, sha256Text(claimCredential))
  ) throw workerLeaseExpired()
  return claim
}

function requiredEntry(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  jobId: string,
): CanonicalPrivatePackageWorkQueueEntry {
  const entry = aggregate.entries.find((candidate) => candidate.definition.jobId === jobId)
  if (!entry) throw new ApiError('JOB_NOT_FOUND', 'Canonical package work-queue job was not found.', 404)
  return entry
}

function assertAggregateIntegrity(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
): void {
  const { aggregateHash, ...aggregatePayload } = aggregate
  if (
    aggregateHash !== sha256AuthorityValue(aggregatePayload) ||
    aggregate.ownerUserId !== scope.ownerUserId ||
    aggregate.definitionHash !== definition.definitionHash ||
    stableAuthorityStringify(aggregate.identity) !== stableAuthorityStringify(definition.identity) ||
    aggregate.entries.length !== definition.jobs.length ||
    aggregate.entries.some((entry, index) => {
      const { entryHash, ...entryPayload } = entry
      return entryHash !== sha256AuthorityValue(entryPayload) ||
        stableAuthorityStringify(entry.definition) !== stableAuthorityStringify(definition.jobs[index]) ||
        !nestedHashesValid(entry)
    }) ||
    aggregate.events.some((event) => {
      const { eventHash, ...eventPayload } = event
      return eventHash !== sha256AuthorityValue(eventPayload)
    })
  ) throw invalidQueue('Canonical package work-queue authority or hash lineage is invalid.')
}

function nestedHashesValid(entry: CanonicalPrivatePackageWorkQueueEntry): boolean {
  if (entry.activeClaim) {
    const { claimHash, ...payload } = entry.activeClaim
    if (claimHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.professionalLongFormExecutionAuthorization) {
    const { receiptHash, ...payload } = entry.professionalLongFormExecutionAuthorization
    if (receiptHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.professionalLongFormExecutionAttempt) {
    const { attemptHash, ...payload } = entry.professionalLongFormExecutionAttempt
    if (attemptHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.completion) {
    const { completionHash, ...payload } = entry.completion
    if (completionHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.lastRelease) {
    const { releaseHash, ...payload } = entry.lastRelease
    if (releaseHash !== sha256AuthorityValue(payload)) return false
  }
  return true
}

function assertCompletedEntriesImmutable(
  before: CanonicalPrivatePackageWorkQueueAggregate,
  after: CanonicalPrivatePackageWorkQueueAggregate,
): void {
  for (const prior of before.entries.filter((entry) => entry.state === 'completed')) {
    const current = after.entries.find((entry) => entry.definition.jobId === prior.definition.jobId)
    if (!current || stableAuthorityStringify(current) !== stableAuthorityStringify(prior)) {
      throw invalidQueue('Canonical package work-queue completion is immutable.')
    }
  }
  if (
    after.events.length < before.events.length ||
    before.events.some((event, index) =>
      stableAuthorityStringify(event) !== stableAuthorityStringify(after.events[index]))
  ) throw invalidQueue('Canonical package work-queue event history is append-only.')
}

function assertOutcomeMatchesDefinition(
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome,
  definition: CanonicalPrivatePackageWorkQueueJobDefinition,
): void {
  if (
    outcome.jobId !== definition.jobId ||
    outcome.approvedWorkItemId !== definition.approvedWorkItemId ||
    outcome.workItemKey !== definition.workItemKey ||
    outcome.required !== definition.required ||
    stableAuthorityStringify(outcome.dependencyJobIds) !==
      stableAuthorityStringify(definition.dependencyJobIds)
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical queue completion does not match job authority.', 409)
}

function assertProfessionalLongFormAuthorizationTarget(input: {
  aggregate: CanonicalPrivatePackageWorkQueueAggregate
  definition: CanonicalPrivatePackageWorkQueueDefinition
  entry: CanonicalPrivatePackageWorkQueueEntry
  authorization: ProfessionalLongFormAuthorizedChildAuthorizationReceipt
}): void {
  const { aggregate, definition, entry, authorization } = input
  const deliveryAuthorization =
    isProfessionalLongFormDeliveryRootAuthorization(authorization) ||
    isProfessionalLongFormDeliveryH264Authorization(authorization) ||
    isProfessionalLongFormDeliveryH264QaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryMuxAuthorization(authorization)
  if (
    (deliveryAuthorization
      ? definition.source !==
        'canonical_professional_long_form_private_master_qa_delivery_package'
      : definition.source !==
        'canonical_professional_long_form_child_package_promotion') ||
    aggregate.definitionHash !== definition.definitionHash ||
    !exactProfessionalLongFormAuthorizationMatches(
      aggregate,
      entry,
      authorization,
    )
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form authorization does not match the exact canonical child or its completed dependencies.',
      409,
    )
  }
}

function assertPersistedProfessionalLongFormExecutionAuthority(input: {
  definition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: ProfessionalLongFormAuthorizedChildAuthorizationReceipt
  executionAuthority: ProfessionalLongFormAuthorizedChildExecutionAuthority
  persistedAuthority: Record<string, unknown> | unknown[]
}): void {
  const targetDefinition = input.definition.jobs.find((job) =>
    job.jobId === input.authorization.jobId)
  const { authorityHash, ...authorityPayload } = input.executionAuthority
  const commonInvalid =
    authorityHash !== sha256AuthorityValue(authorityPayload) ||
    input.authorization.authorityHash !== authorityHash ||
    input.authorization.authorityRef.sha256 !==
      sha256AuthorityValue(input.executionAuthority) ||
    stableAuthorityStringify(input.persistedAuthority) !==
      stableAuthorityStringify(input.executionAuthority) ||
    input.executionAuthority.identity.workspaceId !==
      input.definition.identity.workspaceId ||
    input.executionAuthority.identity.projectId !==
      input.definition.identity.projectId ||
    input.executionAuthority.identity.editSessionId !==
      input.definition.identity.editSessionId ||
    input.executionAuthority.identity.approvedPlanSnapshotId !==
      input.definition.identity.approvedPlanSnapshotId ||
    input.executionAuthority.identity.approvedPlanSnapshotHash !==
      input.definition.identity.snapshotHash ||
    input.executionAuthority.identity.packageRecordId !==
      input.definition.identity.packageRecordId ||
    input.executionAuthority.identity.jobId !== input.authorization.jobId ||
    input.executionAuthority.identity.approvedWorkItemId !==
      input.authorization.approvedWorkItemId ||
    input.executionAuthority.identity.expectedOutputIdentity !==
      input.authorization.expectedOutputIdentity ||
    input.executionAuthority.lineage.queueDefinitionHash !==
      input.definition.definitionHash ||
    input.executionAuthority.authorizedAt !== input.authorization.authorizedAt
    || input.executionAuthority.approval.reservationExpiresAt !==
      input.authorization.reservationExpiresAt
  let pairInvalid = true
  if (isProfessionalLongFormFirstChildAuthorization(input.authorization)) {
    pairInvalid = !isProfessionalLongFormFirstChildExecutionAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.rootJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.rootPlacementHash !==
        input.authorization.placementHash
  } else if (
    isProfessionalLongFormDeliveryRootAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormDeliveryRootAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.rootJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.rootPlacementHash !==
        input.authorization.placementHash
  } else if (
    isProfessionalLongFormDeliveryH264Authorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormDeliveryH264Authority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.h264JobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.h264PlacementHash !==
        input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        input.executionAuthority.approvedChunk.chunkIndex * 2 - 1 ||
      input.executionAuthority.approvedChunk.expectedH264ObjectIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormDeliveryH264QaAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormDeliveryH264QaAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.qaJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.qaPlacementHash !==
        input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        input.executionAuthority.h264Artifact.chunkIndex * 2 ||
      `${input.executionAuthority.h264Artifact.objectIdentity}:qa` !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormDeliveryMuxAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormDeliveryMuxAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.muxJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.muxPlacementHash !==
        input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        input.executionAuthority.approvedMuxPlan.chunkCount * 2 + 1 ||
      input.executionAuthority.approvedMuxPlan.privateObjectIdentityHash !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(
      input.authorization,
    )
  ) {
    const deliveryChunkCount =
      input.definition.identity.professionalLongFormCustomerDeliveryAuthority
        ?.chunkCount
    pairInvalid = !isProfessionalLongFormDeliveryDecodedVideoQaAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.qaJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.qaPlacementHash !==
      input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        (deliveryChunkCount ?? -1) * 2 + 2 ||
      `${input.executionAuthority.muxArtifact.objectIdentity}:decoded-video-qa` !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(
      input.authorization,
    )
  ) {
    const deliveryChunkCount =
      input.definition.identity.professionalLongFormCustomerDeliveryAuthority
        ?.chunkCount
    pairInvalid = !isProfessionalLongFormDeliveryDecodedAudioQaAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.qaJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.qaPlacementHash !==
      input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        (deliveryChunkCount ?? -1) * 2 + 3 ||
      `${input.executionAuthority.muxArtifact.objectIdentity}:decoded-audio-qa` !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormSourceAuthorityAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormSourceAuthorityExecutionAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.sourceJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.sourcePlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.lineage.sourceRangesHash !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormMasterTimingAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormMasterTimingExecutionAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.timingJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.timingPlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.lineage.timingHash !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormPrivateMasterQaAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormPrivateMasterQaAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.qaJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.qaPlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.identity.expectedOutputIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormMasterAssemblyAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormMasterAssemblyAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.finalizationJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.finalizationPlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.identity.expectedOutputIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormCrossChunkColorAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormCrossChunkColorAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.colorJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.colorPlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.identity.expectedOutputIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormContinuousProgramAudioAuthorization(
      input.authorization,
    )
  ) {
    pairInvalid = !isProfessionalLongFormContinuousProgramAudioAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.audioJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.audioPlacementHash !==
        input.authorization.placementHash ||
      input.executionAuthority.identity.expectedOutputIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormFirstObjectChunkRenderAuthorization(
      input.authorization,
    )
  ) {
    pairInvalid = !isProfessionalLongFormFirstObjectChunkRenderAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.renderJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.renderPlacementHash !==
        input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        input.executionAuthority.approvedChunk.chunkIndex * 2 + 1 ||
      input.executionAuthority.approvedChunk.expectedObject.objectIdentity !==
        input.authorization.expectedOutputIdentity
  } else if (
    isProfessionalLongFormFirstObjectChunkQaAuthorization(input.authorization)
  ) {
    pairInvalid = !isProfessionalLongFormFirstObjectChunkQaAuthority(
      input.executionAuthority,
    ) || input.executionAuthority.lineage.qaJobDefinitionHash !==
      input.authorization.jobDefinitionHash ||
      input.executionAuthority.lineage.qaPlacementHash !==
        input.authorization.placementHash ||
      targetDefinition?.canonicalOrder !==
        input.executionAuthority.approvedChunk.chunkIndex * 2 + 2 ||
      input.executionAuthority.renderArtifact.objectIdentity + ':qa' !==
        input.authorization.expectedOutputIdentity
  }
  if (commonInvalid || pairInvalid) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Persisted professional long-form execution authority does not match its queue receipt.',
      409,
    )
  }
}

function isExactProfessionalLongFormAuthorizedChild(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  entry: CanonicalPrivatePackageWorkQueueEntry,
): boolean {
  const authorization = entry.professionalLongFormExecutionAuthorization
  if (!authorization) return false
  return exactProfessionalLongFormAuthorizationMatches(
    aggregate,
    entry,
    authorization,
  )
}

function exactProfessionalLongFormAuthorizationMatches(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  entry: CanonicalPrivatePackageWorkQueueEntry,
  authorization: ProfessionalLongFormAuthorizedChildAuthorizationReceipt,
): boolean {
  const { receiptHash, ...receiptPayload } = authorization
  const commonMatches = Boolean(
    aggregate.identity.professionalLongFormAuthority ||
    aggregate.identity.professionalLongFormCustomerDeliveryAuthority,
  ) &&
    authorization.queueDefinitionHash === aggregate.definitionHash &&
    receiptHash === sha256AuthorityValue(receiptPayload) &&
    entry.definition.jobId === authorization.jobId &&
    entry.definition.approvedWorkItemId === authorization.approvedWorkItemId &&
    entry.definition.definitionHash === authorization.jobDefinitionHash &&
    entry.definition.placementHash === authorization.placementHash &&
    entry.definition.expectedOutputIdentity ===
      authorization.expectedOutputIdentity &&
    !entry.definition.privateExecutionReady &&
    entry.definition.providerExecutionMode === 'none' &&
    authorization.authorityRef.sha256.length === 64
  if (!commonMatches) return false
  if (isProfessionalLongFormDeliveryRootAuthorization(authorization)) {
    const delivery =
      aggregate.identity.professionalLongFormCustomerDeliveryAuthority
    return Boolean(delivery) &&
      entry.definition.workerType === 'api_service' &&
      entry.definition.resourceClassId === 'control_plane_cpu_v1' &&
      entry.definition.maxAttempts === 1 &&
      entry.definition.attemptTimeoutSeconds === 300 &&
      entry.definition.canonicalOrder === 0 &&
      entry.definition.dependencyJobIds.length === 0 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds[0] ===
        delivery?.sourcePrivateMasterQaJobId &&
      authorization.expectedOutputIdentity.length === 64
  }
  if (isProfessionalLongFormDeliveryH264Authorization(authorization)) {
    const delivery =
      aggregate.identity.professionalLongFormCustomerDeliveryAuthority
    const root = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === entry.definition.dependencyJobIds[0])
    const rootCompletion = root?.completion?.outcome
      .professionalLongFormExecution
    const chunkIndex = (entry.definition.canonicalOrder + 1) / 2
    return Boolean(delivery) &&
      entry.definition.workerType === 'render_worker' &&
      entry.definition.resourceClassId === 'render_cpu_high_memory_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 21_600 &&
      Number.isInteger(chunkIndex) && chunkIndex >= 1 &&
      chunkIndex <= (delivery?.chunkCount ?? 0) &&
      entry.definition.dependencyJobIds.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      root?.definition.canonicalOrder === 0 && root.state === 'completed' &&
      Boolean(rootCompletion &&
        isProfessionalLongFormDeliveryRootCompletion(rootCompletion)) &&
      /^[a-f0-9]{64}$/u.test(authorization.expectedOutputIdentity)
  }
  if (isProfessionalLongFormDeliveryH264QaAuthorization(authorization)) {
    const delivery =
      aggregate.identity.professionalLongFormCustomerDeliveryAuthority
    const h264 = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === entry.definition.dependencyJobIds[0])
    const h264Completion = h264?.completion?.outcome
      .professionalLongFormExecution
    const chunkIndex = entry.definition.canonicalOrder / 2
    return Boolean(delivery) &&
      entry.definition.workerType === 'qa_worker' &&
      entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 3_600 &&
      Number.isInteger(chunkIndex) && chunkIndex >= 1 &&
      chunkIndex <= (delivery?.chunkCount ?? 0) &&
      entry.definition.dependencyJobIds.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      h264?.definition.canonicalOrder === entry.definition.canonicalOrder - 1 &&
      h264.state === 'completed' &&
      Boolean(h264Completion &&
        isProfessionalLongFormDeliveryH264Completion(h264Completion)) &&
      authorization.expectedOutputIdentity ===
        `${h264.definition.expectedOutputIdentity}:qa`
  }
  if (isProfessionalLongFormDeliveryMuxAuthorization(authorization)) {
    const delivery =
      aggregate.identity.professionalLongFormCustomerDeliveryAuthority
    const dependencies = entry.definition.dependencyJobIds.map((jobId) =>
      aggregate.entries.find((candidate) => candidate.definition.jobId === jobId))
    return Boolean(delivery) &&
      entry.definition.workerType === 'render_worker' &&
      entry.definition.resourceClassId === 'render_cpu_high_memory_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 21_600 &&
      entry.definition.canonicalOrder === (delivery?.chunkCount ?? 0) * 2 + 1 &&
      entry.definition.dependencyJobIds.length === delivery?.chunkCount &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      dependencies.length === delivery?.chunkCount &&
      dependencies.every((dependency, index) => {
        const completion = dependency?.completion?.outcome
          .professionalLongFormExecution
        return dependency?.definition.canonicalOrder === (index + 1) * 2 &&
          dependency.state === 'completed' &&
          Boolean(completion &&
            isProfessionalLongFormDeliveryH264QaCompletion(completion))
      }) &&
      /^[a-f0-9]{64}$/u.test(authorization.expectedOutputIdentity)
  }
  if (
    isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(authorization) ||
    isProfessionalLongFormDeliveryDecodedAudioQaAuthorization(authorization)
  ) {
    const delivery =
      aggregate.identity.professionalLongFormCustomerDeliveryAuthority
    const mux = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === entry.definition.dependencyJobIds[0])
    const muxCompletion = mux?.completion?.outcome
      .professionalLongFormExecution
    const videoQa =
      isProfessionalLongFormDeliveryDecodedVideoQaAuthorization(authorization)
    return Boolean(delivery) &&
      entry.definition.workerType === 'qa_worker' &&
      entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 21_600 &&
      entry.definition.canonicalOrder ===
        (delivery?.chunkCount ?? 0) * 2 + (videoQa ? 2 : 3) &&
      entry.definition.dependencyJobIds.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      mux?.definition.canonicalOrder === (delivery?.chunkCount ?? 0) * 2 + 1 &&
      mux.state === 'completed' &&
      Boolean(muxCompletion &&
        isProfessionalLongFormDeliveryMuxCompletion(muxCompletion)) &&
      authorization.expectedOutputIdentity ===
        `${muxCompletion &&
          isProfessionalLongFormDeliveryMuxCompletion(muxCompletion)
          ? muxCompletion.outputArtifact.objectIdentity
          : ''}:${videoQa ? 'decoded-video-qa' : 'decoded-audio-qa'}`
  }
  if (isProfessionalLongFormFirstChildAuthorization(authorization)) {
    return entry.definition.workerType === 'api_service' &&
      entry.definition.resourceClassId === 'control_plane_cpu_v1' &&
      entry.definition.maxAttempts === 1 &&
      entry.definition.attemptTimeoutSeconds === 300 &&
      entry.definition.canonicalOrder === 0 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID &&
      entry.definition.dependencyJobIds.length === 0 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 1 &&
      authorization.expectedOutputIdentity === aggregate.identity.snapshotHash
  }
  const hasCompletedRootDependency = (): boolean => {
    const rootDependencyJobId = entry.definition.dependencyJobIds[0]
    const rootDependency = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === rootDependencyJobId)
    return rootDependency?.definition.canonicalOrder === 0 &&
      rootDependency.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_FIRST_CHILD_WORK_ITEM_ID &&
      rootDependency.state === 'completed' &&
      rootDependency.completion?.outcome.professionalLongFormExecution !== undefined
  }
  if (isProfessionalLongFormSourceAuthorityAuthorization(authorization)) {
    return entry.definition.workerType === 'api_service' &&
      entry.definition.resourceClassId === 'control_plane_cpu_v1' &&
      entry.definition.maxAttempts === 1 &&
      entry.definition.attemptTimeoutSeconds === 300 &&
      entry.definition.canonicalOrder === 1 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID &&
      entry.definition.dependencyJobIds.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      authorization.expectedOutputIdentity.length === 64 &&
      hasCompletedRootDependency()
  }
  if (isProfessionalLongFormMasterAssemblyAuthorization(authorization)) {
    const dependencies = entry.definition.dependencyJobIds.map((jobId) =>
      aggregate.entries.find((candidate) => candidate.definition.jobId === jobId))
    const chunkQaCount = dependencies.filter((dependency) => {
      const completion = dependency?.completion?.outcome
        .professionalLongFormExecution
      return completion && isProfessionalLongFormFirstObjectChunkQaCompletion(
        completion,
      )
    }).length
    return entry.definition.workerType === 'render_worker' &&
      entry.definition.resourceClassId === 'render_cpu_high_memory_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 3_600 &&
      chunkQaCount >= 2 && chunkQaCount <= 124 &&
      dependencies.length === chunkQaCount + 3 &&
      entry.definition.canonicalOrder === chunkQaCount * 2 + 5 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      dependencies.every((dependency) =>
        dependency?.state === 'completed' &&
        dependency.completion?.outcome.professionalLongFormExecution !==
          undefined) &&
      dependencies.some((dependency) => {
        const completion = dependency?.completion?.outcome
          .professionalLongFormExecution
        return completion &&
          isProfessionalLongFormContinuousProgramAudioCompletion(completion)
      }) &&
      dependencies.some((dependency) => {
        const completion = dependency?.completion?.outcome
          .professionalLongFormExecution
        return completion && isProfessionalLongFormCrossChunkColorCompletion(
          completion,
        )
      }) &&
      dependencies.some((dependency) =>
        dependency?.definition.approvedWorkItemId ===
          PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID &&
        dependency.state === 'completed') &&
      authorization.expectedOutputIdentity ===
        `${aggregate.identity.approvedPlanSnapshotId}:private-4k-master`
  }
  if (isProfessionalLongFormPrivateMasterQaAuthorization(authorization)) {
    const assembly = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === entry.definition.dependencyJobIds[0])
    const assemblyCompletion = assembly?.completion?.outcome
      .professionalLongFormExecution
    const chunkCount = (entry.definition.canonicalOrder - 6) / 2
    return entry.definition.workerType === 'qa_worker' &&
      entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 3_600 &&
      Number.isInteger(chunkCount) && chunkCount >= 2 && chunkCount <= 124 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_PRIVATE_MASTER_QA_WORK_ITEM_ID &&
      entry.definition.dependencyJobIds.length === 1 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      assembly?.definition.canonicalOrder ===
        entry.definition.canonicalOrder - 1 &&
      assembly.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_MASTER_ASSEMBLY_WORK_ITEM_ID &&
      assembly.state === 'completed' &&
      Boolean(assemblyCompletion &&
        isProfessionalLongFormMasterAssemblyCompletion(assemblyCompletion)) &&
      authorization.expectedOutputIdentity ===
        `${aggregate.identity.approvedPlanSnapshotId}:private-4k-master-qa`
  }
  if (isProfessionalLongFormCrossChunkColorAuthorization(authorization)) {
    const dependencies = entry.definition.dependencyJobIds.map((jobId) =>
      aggregate.entries.find((candidate) => candidate.definition.jobId === jobId))
    return entry.definition.workerType === 'qa_worker' &&
      entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 1_800 &&
      dependencies.length >= 2 && dependencies.length <= 124 &&
      entry.definition.canonicalOrder === dependencies.length * 2 + 4 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_CROSS_CHUNK_COLOR_WORK_ITEM_ID &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      dependencies.every((dependency, index) => {
        const completion = dependency?.completion?.outcome
          .professionalLongFormExecution
        return dependency?.definition.canonicalOrder === index * 2 + 4 &&
          dependency.state === 'completed' &&
          Boolean(completion &&
            isProfessionalLongFormFirstObjectChunkQaCompletion(completion))
      }) &&
      authorization.expectedOutputIdentity ===
        `${aggregate.identity.approvedPlanSnapshotId}:color-continuity`
  }
  if (isProfessionalLongFormContinuousProgramAudioAuthorization(authorization)) {
    const sourceDependency = aggregate.entries.find((candidate) =>
      candidate.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_SOURCE_AUTHORITY_WORK_ITEM_ID)
    const timingDependency = aggregate.entries.find((candidate) =>
      candidate.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID)
    const sourceCompletion = sourceDependency?.completion?.outcome
      .professionalLongFormExecution
    const timingCompletion = timingDependency?.completion?.outcome
      .professionalLongFormExecution
    return entry.definition.workerType === 'cpu_analysis_worker' &&
      entry.definition.resourceClassId === 'cpu_analysis_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 3_600 &&
      entry.definition.canonicalOrder > 2 &&
      entry.definition.approvedWorkItemId ===
        PROFESSIONAL_LONG_FORM_CONTINUOUS_PROGRAM_AUDIO_WORK_ITEM_ID &&
      entry.definition.dependencyJobIds.length === 2 &&
      entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
      stableAuthorityStringify(entry.definition.dependencyJobIds) ===
        stableAuthorityStringify([
          sourceDependency?.definition.jobId,
          timingDependency?.definition.jobId,
        ]) &&
      sourceDependency?.state === 'completed' &&
      timingDependency?.state === 'completed' &&
      Boolean(sourceCompletion &&
        isProfessionalLongFormSourceAuthorityCompletion(sourceCompletion)) &&
      Boolean(timingCompletion &&
        isProfessionalLongFormMasterTimingCompletion(timingCompletion)) &&
      authorization.expectedOutputIdentity ===
        `${aggregate.identity.approvedPlanSnapshotId}:continuous-audio`
  }
  if (isProfessionalLongFormFirstObjectChunkRenderAuthorization(authorization)) {
    const dependencies = entry.definition.dependencyJobIds.map((jobId) =>
      aggregate.entries.find((candidate) => candidate.definition.jobId === jobId))
    return entry.definition.workerType === 'render_worker' &&
      entry.definition.resourceClassId === 'render_cpu_high_memory_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 3_600 &&
      entry.definition.canonicalOrder >= 3 &&
      entry.definition.canonicalOrder <= 249 &&
      entry.definition.canonicalOrder % 2 === 1 &&
      entry.definition.dependencyJobIds.length === 3 &&
      dependencies.length === 3 &&
      dependencies.every((dependency) =>
        dependency?.state === 'completed' &&
        dependency.completion?.outcome.professionalLongFormExecution !==
          undefined) &&
      stableAuthorityStringify(dependencies.map((dependency) =>
        dependency?.definition.canonicalOrder)) ===
        stableAuthorityStringify([0, 1, 2]) &&
      /^[a-f0-9]{64}$/u.test(authorization.expectedOutputIdentity)
  }
  if (isProfessionalLongFormFirstObjectChunkQaAuthorization(authorization)) {
    const render = aggregate.entries.find((candidate) =>
      candidate.definition.jobId === entry.definition.dependencyJobIds[0])
    const renderCompletion = render?.completion?.outcome
      .professionalLongFormExecution
    return entry.definition.workerType === 'qa_worker' &&
      entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
      entry.definition.maxAttempts === 2 &&
      entry.definition.attemptTimeoutSeconds === 900 &&
      entry.definition.canonicalOrder >= 4 &&
      entry.definition.canonicalOrder <= 250 &&
      entry.definition.canonicalOrder % 2 === 0 &&
      entry.definition.dependencyJobIds.length === 1 &&
      render?.definition.canonicalOrder ===
        entry.definition.canonicalOrder - 1 &&
      render.state === 'completed' &&
      Boolean(renderCompletion &&
        isProfessionalLongFormFirstObjectChunkRenderCompletion(
          renderCompletion,
        )) &&
      authorization.expectedOutputIdentity ===
        `${render?.definition.expectedOutputIdentity}:qa`
  }
  if (!isProfessionalLongFormMasterTimingAuthorization(authorization)) {
    return false
  }
  return entry.definition.workerType === 'qa_worker' &&
    entry.definition.resourceClassId === 'qa_cpu_standard_v1' &&
    entry.definition.maxAttempts === 1 &&
    entry.definition.attemptTimeoutSeconds === 900 &&
    entry.definition.canonicalOrder === 2 &&
    entry.definition.approvedWorkItemId ===
      PROFESSIONAL_LONG_FORM_MASTER_TIMING_WORK_ITEM_ID &&
    entry.definition.dependencyJobIds.length === 1 &&
    entry.definition.satisfiedPromotionDependencyJobIds?.length === 0 &&
    authorization.expectedOutputIdentity.length === 64 &&
    hasCompletedRootDependency()
}

function assertProfessionalLongFormCompletionEvidence(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  outcome: CanonicalPrivatePackageWorkQueueCompletedOutcome,
): void {
  const authorization = entry.professionalLongFormExecutionAuthorization
  const attempt = entry.professionalLongFormExecutionAttempt
  const completion = outcome.professionalLongFormExecution
  if (!authorization && !attempt && !completion) return
  const exactArtifactMatches = completion &&
    (isProfessionalLongFormDeliveryDecodedVideoQaCompletion(completion) ||
      isProfessionalLongFormDeliveryDecodedAudioQaCompletion(completion))
    ? outcome.contentType === 'application/json' &&
      outcome.sha256 === completion.validationArtifactRef.sha256
    : completion && isProfessionalLongFormDeliveryMuxCompletion(completion)
    ? outcome.contentType === 'video/mp4' &&
      outcome.artifactId === completion.outputArtifact.objectIdentity &&
      outcome.sha256 === completion.outputArtifact.sha256
    : completion && isProfessionalLongFormDeliveryH264QaCompletion(completion)
    ? outcome.contentType === 'application/json' &&
      outcome.sha256 === completion.validationArtifactRef.sha256
    : completion && isProfessionalLongFormDeliveryH264Completion(completion)
    ? outcome.contentType === 'video/mp4' &&
      outcome.artifactId === completion.outputArtifact.objectIdentity &&
      outcome.sha256 === completion.outputArtifact.sha256
    : completion && isProfessionalLongFormDeliveryRootCompletion(completion)
    ? outcome.contentType === 'application/json' &&
      outcome.sha256 === completion.validationArtifactRef.sha256
    : completion && isProfessionalLongFormPrivateMasterQaCompletion(completion)
    ? outcome.contentType === 'application/json' &&
      outcome.sha256 === completion.validationArtifactRef.sha256
    : completion && isProfessionalLongFormMasterAssemblyCompletion(completion)
    ? outcome.contentType === 'video/x-matroska' &&
      outcome.artifactId === completion.outputArtifact.objectIdentity &&
      outcome.sha256 === completion.outputArtifact.sha256
    : completion && isProfessionalLongFormCrossChunkColorCompletion(completion)
    ? outcome.contentType === 'application/json' &&
      outcome.sha256 === completion.validationArtifactRef.sha256
    : completion && isProfessionalLongFormContinuousProgramAudioCompletion(completion)
    ? outcome.contentType === 'audio/flac' &&
      outcome.artifactId === completion.outputArtifact.objectIdentity &&
      outcome.sha256 === completion.outputArtifact.sha256
    : completion && isProfessionalLongFormFirstObjectChunkRenderCompletion(completion)
    ? outcome.contentType === 'video/x-matroska' &&
      outcome.artifactId === completion.outputArtifact.objectIdentity &&
      outcome.sha256 === completion.outputArtifact.sha256
    : completion && isProfessionalLongFormFirstObjectChunkQaCompletion(completion)
      ? outcome.contentType === 'application/json' &&
        outcome.sha256 === completion.validationArtifactRef.sha256
      : completion && 'validationArtifactRef' in completion &&
        outcome.contentType === 'application/json' &&
        outcome.sha256 === completion.validationArtifactRef.sha256
  if (
    !authorization ||
    !attempt ||
    !completion ||
    completion.authorizationId !== authorization.authorizationId ||
    completion.authorityHash !== authorization.authorityHash ||
    completion.executionAttemptId !== attempt.executionAttemptId ||
    completion.operation.operationId !== authorization.operation.operationId ||
    completion.operation.runnerClass !== authorization.operation.runnerClass ||
    completion.operation.attemptCostProfileId !==
      authorization.operation.attemptCostProfileId ||
    !exactArtifactMatches ||
    outcome.adapterReplayed
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Professional long-form child completion lacks exact artifact, QA, reconciliation, cost, and attempt authority.',
      409,
    )
  }
}

function assertDefinitionScope(
  scope: CanonicalPrivatePackageWorkQueueStoreScope,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): void {
  if (
    definition.identity.workspaceId !== scope.workspaceId ||
    definition.identity.projectId !== scope.projectId ||
    definition.identity.editSessionId !== scope.editSessionId ||
    definition.identity.packageRecordId !== scope.packageRecordId ||
    definition.identity.approvedPlanSnapshotId !== scope.approvedPlanSnapshotId
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue scope is invalid.', 400)
}

function assertScope(scope: CanonicalPrivatePackageWorkQueueStoreScope): void {
  if (
    !scope.localStorageRoot.trim() ||
    [
      scope.ownerUserId,
      scope.workspaceId,
      scope.projectId,
      scope.editSessionId,
      scope.packageRecordId,
      scope.approvedPlanSnapshotId,
    ].some((value) => !safeIdentity(value))
  ) throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue persistence scope is invalid.', 400)
}

function assertWorkerIdentity(value: string): void {
  const normalized = value.trim()
  if (!normalized || normalized.length > 240) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue worker identity is invalid.', 400)
  }
}

function assertLeaseDuration(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 86_400_000) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical package work-queue lease duration is invalid.', 400)
  }
}

function validTimestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new ApiError('VALIDATION_FAILED', `Canonical ${label} timestamp is invalid.`, 400)
  }
  return value
}

function safeIdentity(value: string): boolean {
  return value.length > 0 && value.length <= 240 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) && !value.includes('..')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function constantTimeHashEquals(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'hex')
  const rightBytes = Buffer.from(right, 'hex')
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

function queueBoundaries() {
  return {
    privateLocalPersistence: true as const,
    tenantAndPackageScoped: true as const,
    checksumProtected: true as const,
    atomicAggregateReplacement: true as const,
    hostRestartClaimRecovery: true as const,
    completedJobsAreTerminal: true as const,
    plaintextClaimCredentialsPersisted: false as const,
    claimCredentialDigestsPersisted: true as const,
    browserClaimAllowed: false as const,
    crossProcessAtomicClaimProven: true as const,
    distributedTransactionProven: false as const,
    cloudServiceIdentityVerified: false as const,
    cloudDispatchAuthorized: false as const,
    productionAuthority: false as const,
  }
}

function invalidQueue(message: string): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}

function workerLeaseExpired(): ApiError {
  return new ApiError(
    'WORKER_LEASE_EXPIRED',
    'Canonical package work-queue claim is unavailable, expired, or invalid.',
    409,
  )
}
