import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuApprovedFundingObservation,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_FUNDED_START_AUTHORITY_STORE_VERSION =
  'canonical-professional-gpu-funded-start-authority-store-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FUNDED_START_RECORD_VERSION =
  'canonical-professional-gpu-funded-start-record-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FUNDED_START_EXECUTION_INDEX_VERSION =
  'canonical-professional-gpu-funded-start-execution-index-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX = 'private/canonical-professional-gpu/v1/funded-starts'
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const timestamp = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const lookupSchema = z.object({
  workspaceId: safeId,
  snapshotId: safeId,
  workItemKey: safeId,
}).strict()
const recordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_START_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_start_authority_store',
  ),
  evidenceClass: z.literal('gcs_create_only_exact_reread'),
  approvedFunding: z.unknown(),
  attemptStart: z.unknown(),
  exactSnapshotWorkFundingAndAttemptPair: z.literal(true),
  authenticatedUserTriggerAndServerPlacementPreserved: z.literal(true),
  fallbackRequiresKnownNotExecutedPrimaryOutcome: z.literal(true),
  callerApprovalReservationRoutePriceOrRuntimeAccepted: z.literal(false),
  cloudJobCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  persistedAt: timestamp,
}).strict()
const recordSchema = recordWithoutHashSchema.extend({
  recordHash: sha256,
}).strict()
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const executionIndexWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_START_EXECUTION_INDEX_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_start_authority_store',
  ),
  evidenceClass: z.literal('gcs_create_only_execution_attempt_lookup'),
  executionAttemptRef: evidenceRefSchema,
  workspaceId: safeId,
  snapshotId: safeId,
  workItemKey: safeId,
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  fundedStartRecordHash: sha256,
  exactExecutionAttemptToFundedPairBinding: z.literal(true),
  callerLookupOrExecutionMaterialAccepted: z.literal(false),
  cloudJobCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  persistedAt: timestamp,
}).strict()
const executionIndexSchema = executionIndexWithoutHashSchema.extend({
  indexHash: sha256,
}).strict()

export interface CanonicalProfessionalGpuFundedStartAuthorityStore
  extends CanonicalProfessionalGpuApprovedFundingReadPort,
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_FUNDED_START_AUTHORITY_STORE_VERSION
  readonly evidenceClass: 'gcs_create_only_exact_reread_funded_start_pair'
  persistFundedAttemptStartCreateOnly(input: {
    readonly approvedFunding:
      CanonicalProfessionalGpuApprovedFundingObservation
    readonly attemptStart: CanonicalProfessionalGpuAttemptStartAuthority
    readonly persistedAt: string
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly recordHash: string
    readonly executionIndexHash: string
    readonly attemptOrdinal: 1 | 2
    readonly exactCreateOnlyRereadVerified: true
    readonly cloudJobCreated: false
    readonly customerCreditsMutated: false
  }>
  rereadFundedAttemptByExecutionAttemptRef(input: {
    readonly executionAttemptRef: {
      readonly id: string
      readonly version: number
      readonly contentHash: string
    }
    readonly at: string
  }): Promise<{
    readonly approvedFunding:
      CanonicalProfessionalGpuApprovedFundingObservation
    readonly attemptStart: CanonicalProfessionalGpuAttemptStartAuthority
    readonly fundedStartRecordHash: string
    readonly executionIndexHash: string
  } | null>
}

type PersistFundedStartInput = Parameters<
  CanonicalProfessionalGpuFundedStartAuthorityStore[
    'persistFundedAttemptStartCreateOnly'
  ]
>[0]
type FundingReadInput = Parameters<
  CanonicalProfessionalGpuApprovedFundingReadPort['rereadApprovedFunding']
>[0]
type AttemptReadInput = Parameters<
  CanonicalProfessionalGpuAttemptStartAuthorityReadPort[
    'rereadCreateOnlyAttemptStart'
  ]
>[0]
type ExecutionAttemptReadInput = Parameters<
  CanonicalProfessionalGpuFundedStartAuthorityStore[
    'rereadFundedAttemptByExecutionAttemptRef'
  ]
>[0]

/**
 * Restart-safe handoff between approval/credit ownership and the authenticated
 * GPU-start route. Funding and the server-selected attempt are persisted as
 * one immutable pair, so a route cannot combine approval from one edit with a
 * trigger, lease, route, or fallback disposition from another.
 */
export function createCanonicalProfessionalGpuFundedStartAuthorityStore(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalProfessionalGpuFundedStartAuthorityStore {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const readOrdinal = async (
    lookup: z.infer<typeof lookupSchema>,
    ordinal: 1 | 2,
    at: string,
  ): Promise<FundedStartRecord | null> => {
    const bytes = await input.objectPort.readExact(
      recordPath(prefix, lookup, ordinal),
    )
    if (!bytes) return null
    if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
      || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('funded_start_record_bytes_invalid')
    }
    let decoded: unknown
    try {
      decoded = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw conflict('funded_start_record_json_invalid')
    }
    const record = assertFundedStartRecord(decoded, at)
    if (stableAuthorityStringify(record) !== bytes.toString('utf8')) {
      throw conflict('funded_start_record_not_canonical')
    }
    assertRecordLookup(record, lookup, ordinal)
    return record
  }
  const readCurrent = async (
    untrusted: unknown,
  ): Promise<FundedStartRecord | null> => {
    assertPlainSerializedData(untrusted, 'gpu_funded_start_lookup')
    const query = lookupSchema.extend({ at: timestamp }).strict()
      .parse(untrusted)
    const lookup = lookupSchema.parse({
      workspaceId: query.workspaceId,
      snapshotId: query.snapshotId,
      workItemKey: query.workItemKey,
    })
    const fallback = await readOrdinal(lookup, 2, query.at)
    if (fallback) return fallback
    return readOrdinal(lookup, 1, query.at)
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FUNDED_START_AUTHORITY_STORE_VERSION,
    evidenceClass:
      'gcs_create_only_exact_reread_funded_start_pair' as const,
    async persistFundedAttemptStartCreateOnly(
      untrusted: PersistFundedStartInput,
    ) {
      assertPlainSerializedData(untrusted, 'gpu_funded_start_persistence')
      const request = z.object({
        approvedFunding: z.unknown(),
        attemptStart: z.unknown(),
        persistedAt: timestamp,
      }).strict().parse(untrusted)
      const funding =
        assertCanonicalProfessionalGpuApprovedFundingObservation(
          request.approvedFunding,
          request.persistedAt,
        )
      const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
        request.attemptStart,
        request.persistedAt,
      )
      assertExactPair(funding, attempt, request.persistedAt)
      const payload = recordWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_FUNDED_START_RECORD_VERSION,
        source:
          'canonical_server_professional_gpu_funded_start_authority_store',
        evidenceClass: 'gcs_create_only_exact_reread',
        approvedFunding: funding,
        attemptStart: attempt,
        exactSnapshotWorkFundingAndAttemptPair: true,
        authenticatedUserTriggerAndServerPlacementPreserved: true,
        fallbackRequiresKnownNotExecutedPrimaryOutcome: true,
        callerApprovalReservationRoutePriceOrRuntimeAccepted: false,
        cloudJobCreated: false,
        customerCreditsMutated: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        persistedAt: request.persistedAt,
      })
      const record = recordSchema.parse({
        ...payload,
        recordHash: sha256AuthorityValue(payload),
      })
      const lookup = lookupFromFunding(funding)
      if (attempt.attemptOrdinal === 2) {
        const primary = await readOrdinal(lookup, 1, request.persistedAt)
        if (!primary) throw conflict('fallback_primary_attempt_missing')
        assertFallbackFollowsPrimary(primary, {
          ...record,
          approvedFunding: funding,
          attemptStart: attempt,
        })
      }
      const body = serialize(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, lookup, attempt.attemptOrdinal),
        body,
        contentSha256: hashBytes(body),
      })
      const reread = await readOrdinal(
        lookup,
        attempt.attemptOrdinal,
        request.persistedAt,
      )
      if (!reread || reread.recordHash !== record.recordHash) {
        throw conflict('funded_start_create_only_reread_mismatch')
      }
      const executionIndex = await persistExecutionIndex({
        objectPort: input.objectPort,
        prefix,
        lookup,
        attempt,
        recordHash: record.recordHash,
        persistedAt: request.persistedAt,
      })
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        recordHash: record.recordHash,
        attemptOrdinal: attempt.attemptOrdinal,
        exactCreateOnlyRereadVerified: true as const,
        executionIndexHash: executionIndex.indexHash,
        cloudJobCreated: false as const,
        customerCreditsMutated: false as const,
      })
    },
    async rereadApprovedFunding(untrusted: FundingReadInput) {
      const record = await readCurrent(untrusted)
      return record ? structuredClone(record.approvedFunding) : null
    },
    async rereadCreateOnlyAttemptStart(untrusted: AttemptReadInput) {
      const record = await readCurrent(untrusted)
      return record ? structuredClone(record.attemptStart) : null
    },
    async rereadFundedAttemptByExecutionAttemptRef(
      untrusted: ExecutionAttemptReadInput,
    ) {
      assertPlainSerializedData(untrusted, 'gpu_funded_start_execution_lookup')
      const query = z.object({
        executionAttemptRef: evidenceRefSchema,
        at: timestamp,
      }).strict().parse(untrusted)
      const index = await readExecutionIndex({
        objectPort: input.objectPort,
        prefix,
        executionAttemptRef: query.executionAttemptRef,
        at: query.at,
      })
      if (!index) return null
      const lookup = lookupSchema.parse({
        workspaceId: index.workspaceId,
        snapshotId: index.snapshotId,
        workItemKey: index.workItemKey,
      })
      const record = await readOrdinal(lookup, index.attemptOrdinal, query.at)
      if (!record
        || record.recordHash !== index.fundedStartRecordHash
        || !sameRef(
          record.attemptStart.executionAttemptRef,
          query.executionAttemptRef,
        )) throw conflict('execution_index_record_lineage_invalid')
      return Object.freeze({
        approvedFunding: structuredClone(record.approvedFunding),
        attemptStart: structuredClone(record.attemptStart),
        fundedStartRecordHash: record.recordHash,
        executionIndexHash: index.indexHash,
      })
    },
  })
}

export function createCanonicalGcsProfessionalGpuFundedStartAuthorityStore(
  input: {
    readonly storage?: Storage
    readonly projectId?: string
    readonly bucketName?: string
    readonly prefix?: string
  } = {},
): CanonicalProfessionalGpuFundedStartAuthorityStore {
  const projectId = input.projectId ?? PROJECT_ID
  const bucketName = input.bucketName ?? CONTROL_PLANE_STATE_BUCKET
  return createCanonicalProfessionalGpuFundedStartAuthorityStore({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId }),
      bucketName,
    }),
    prefix: input.prefix,
  })
}

type FundedStartRecord = z.infer<typeof recordSchema> & {
  readonly approvedFunding:
    CanonicalProfessionalGpuApprovedFundingObservation
  readonly attemptStart: CanonicalProfessionalGpuAttemptStartAuthority
}

function assertFundedStartRecord(value: unknown, at: string): FundedStartRecord {
  assertPlainSerializedData(value, 'gpu_funded_start_record')
  const outer = recordSchema.parse(value)
  const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
    outer.approvedFunding,
    at,
  )
  const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
    outer.attemptStart,
    at,
  )
  const { recordHash, ...payload } = outer
  if (recordHash !== sha256AuthorityValue(payload)
    || Date.parse(outer.persistedAt) > Date.parse(at)) {
    throw conflict('funded_start_record_digest_or_time_invalid')
  }
  assertExactPair(funding, attempt, outer.persistedAt)
  return { ...outer, approvedFunding: funding, attemptStart: attempt }
}

function assertExactPair(
  funding: CanonicalProfessionalGpuApprovedFundingObservation,
  attempt: CanonicalProfessionalGpuAttemptStartAuthority,
  persistedAt: string,
): void {
  if (
    stableAuthorityStringify(funding.scope) !==
      stableAuthorityStringify(attempt.scope)
    || !sameRef(funding.approvedSnapshotRef, attempt.approvedSnapshotRef)
    || !sameRef(
      funding.approvedWorkItem.approvedWorkItemRef,
      attempt.approvedWorkItemRef,
    )
    || Date.parse(attempt.triggeredAt) < Date.parse(funding.observedAt)
    || Date.parse(attempt.expiresAt) > Date.parse(funding.reservationExpiresAt)
    || Date.parse(persistedAt) < Date.parse(attempt.triggeredAt)
    || Date.parse(persistedAt) >= Date.parse(attempt.expiresAt)
  ) throw conflict('funding_attempt_lineage_invalid')
}

function assertRecordLookup(
  record: FundedStartRecord,
  lookup: z.infer<typeof lookupSchema>,
  ordinal: 1 | 2,
): void {
  const observed = lookupFromFunding(record.approvedFunding)
  if (stableAuthorityStringify(observed) !== stableAuthorityStringify(lookup)
    || record.attemptStart.attemptOrdinal !== ordinal) {
    throw conflict('funded_start_lookup_mismatch')
  }
}

function assertFallbackFollowsPrimary(
  primary: FundedStartRecord,
  fallback: FundedStartRecord,
): void {
  const first = primary.attemptStart
  const second = fallback.attemptStart
  if (
    first.attemptOrdinal !== 1
    || first.routeId !== 'a100_80gb_heavy_primary'
    || second.attemptOrdinal !== 2
    || second.routeId !== 'l4_heavy_fallback'
    || stableAuthorityStringify(primary.approvedFunding.scope) !==
      stableAuthorityStringify(fallback.approvedFunding.scope)
    || !sameRef(first.approvedSnapshotRef, second.approvedSnapshotRef)
    || !sameRef(first.approvedWorkItemRef, second.approvedWorkItemRef)
    || sameRef(first.workerLeaseRef, second.workerLeaseRef)
    || sameRef(first.executionAttemptRef, second.executionAttemptRef)
    || sameRef(first.userTriggerRecordRef, second.userTriggerRecordRef)
    || first.idempotencyKey === second.idempotencyKey
    || second.priorPrimaryTerminalReceiptRef === null
    || Date.parse(second.triggeredAt) < Date.parse(first.triggeredAt)
  ) throw conflict('fallback_attempt_history_invalid')
}

function lookupFromFunding(
  funding: CanonicalProfessionalGpuApprovedFundingObservation,
): z.infer<typeof lookupSchema> {
  return lookupSchema.parse({
    workspaceId: funding.scope.workspaceId,
    snapshotId: funding.approvedSnapshotRef.id,
    workItemKey: funding.approvedWorkItem.workItemKey,
  })
}

function recordPath(
  prefix: string,
  lookup: z.infer<typeof lookupSchema>,
  ordinal: 1 | 2,
): string {
  const key = hashBytes(Buffer.from(stableAuthorityStringify(lookup), 'utf8'))
  return `${prefix}/${key}/attempt-${ordinal}.json`
}

async function persistExecutionIndex(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix: string
  readonly lookup: z.infer<typeof lookupSchema>
  readonly attempt: CanonicalProfessionalGpuAttemptStartAuthority
  readonly recordHash: string
  readonly persistedAt: string
}): Promise<z.infer<typeof executionIndexSchema>> {
  const payload = executionIndexWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FUNDED_START_EXECUTION_INDEX_VERSION,
    source: 'canonical_server_professional_gpu_funded_start_authority_store',
    evidenceClass: 'gcs_create_only_execution_attempt_lookup',
    executionAttemptRef: input.attempt.executionAttemptRef,
    workspaceId: input.lookup.workspaceId,
    snapshotId: input.lookup.snapshotId,
    workItemKey: input.lookup.workItemKey,
    attemptOrdinal: input.attempt.attemptOrdinal,
    fundedStartRecordHash: input.recordHash,
    exactExecutionAttemptToFundedPairBinding: true,
    callerLookupOrExecutionMaterialAccepted: false,
    cloudJobCreated: false,
    customerCreditsMutated: false,
    productionAuthorityGranted: false,
    persistedAt: input.persistedAt,
  })
  const index = executionIndexSchema.parse({
    ...payload,
    indexHash: sha256AuthorityValue(payload),
  })
  const body = serialize(index)
  await input.objectPort.createOnly({
    objectPath: executionIndexPath(input.prefix, index.executionAttemptRef),
    body,
    contentSha256: hashBytes(body),
  })
  const reread = await readExecutionIndex({
    objectPort: input.objectPort,
    prefix: input.prefix,
    executionAttemptRef: index.executionAttemptRef,
    at: input.persistedAt,
  })
  if (!reread || reread.indexHash !== index.indexHash) {
    throw conflict('execution_index_create_only_reread_mismatch')
  }
  return reread
}

async function readExecutionIndex(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix: string
  readonly executionAttemptRef: z.infer<typeof evidenceRefSchema>
  readonly at: string
}): Promise<z.infer<typeof executionIndexSchema> | null> {
  const bytes = await input.objectPort.readExact(executionIndexPath(
    input.prefix,
    input.executionAttemptRef,
  ))
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('execution_index_bytes_invalid')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw conflict('execution_index_json_invalid')
  }
  const index = executionIndexSchema.parse(decoded)
  const { indexHash, ...payload } = index
  if (indexHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(index) !== bytes.toString('utf8')
    || Date.parse(index.persistedAt) > Date.parse(input.at)
    || !sameRef(index.executionAttemptRef, input.executionAttemptRef)) {
    throw conflict('execution_index_digest_scope_or_time_invalid')
  }
  return index
}

function executionIndexPath(
  prefix: string,
  executionAttemptRef: z.infer<typeof evidenceRefSchema>,
): string {
  const key = sha256AuthorityValue({
    domain: 'canonical_professional_gpu_funded_start_execution_index_v1',
    executionAttemptRef,
  })
  return `${prefix}/by-execution-attempt/${key}.json`
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('funded_start_record_size_invalid')
  }
  return body
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Professional GPU funded-start object port is unavailable.')
  }
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(reason: string): Error {
  return new Error(`Professional GPU funded start: ${reason}.`)
}
