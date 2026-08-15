import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuCloudTaskDispatchResult,
  assertCanonicalProfessionalGpuCloudTaskSpec,
  canonicalProfessionalGpuCloudTaskDispatchResultSchema,
  canonicalProfessionalGpuCloudTaskSpecSchema,
} from './canonical-professional-gpu-cloud-task-dispatch'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION =
  'canonical-professional-gpu-cloud-task-outbox-port-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RECORD_VERSION =
  'canonical-professional-gpu-cloud-task-outbox-record-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RESULT_VERSION =
  'canonical-professional-gpu-cloud-task-outbox-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const outboxRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RECORD_VERSION,
  ),
  source: z.literal(
    'canonical_postgres_professional_gpu_cloud_task_outbox_owner',
  ),
  outboxId: safeId,
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  queueEntryId: safeId,
  claimRef: evidenceRefSchema,
  cloudTaskSpec: canonicalProfessionalGpuCloudTaskSpecSchema,
  status: z.enum([
    'create_leased',
    'created',
    'not_created',
    'outcome_unknown',
  ]),
  createLeaseId: safeId,
  createLeaseExpiresAt: timestamp,
  dispatchResult: canonicalProfessionalGpuCloudTaskDispatchResultSchema
    .nullable(),
  externalCreateOutcome: z.enum([
    'not_started',
    'created',
    'not_created',
    'unknown',
  ]),
  databaseRecordPersistedBeforeCloudTasksCreate: z.literal(true),
  automaticCreateRetryAllowed: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  createdAt: timestamp,
  updatedAt: timestamp,
}).strict().superRefine((record, context) => {
  const expectedOutcome = record.status === 'create_leased'
    ? 'not_started'
    : record.status === 'outcome_unknown'
      ? 'unknown'
      : record.status
  if (record.externalCreateOutcome !== expectedOutcome
    || (record.status === 'create_leased') !==
      (record.dispatchResult === null)
    || Date.parse(record.updatedAt) < Date.parse(record.createdAt)
    || Date.parse(record.createLeaseExpiresAt) <= Date.parse(record.createdAt)
    || record.outboxId !==
      `gpu-task-outbox:${record.claimRef.contentHash.slice(7)}`
    || record.claimRef.id !== record.cloudTaskSpec.body.claimId
    || record.claimRef.contentHash !==
      `sha256:${record.cloudTaskSpec.body.claimHash}`
    || record.queueEntryId !== record.cloudTaskSpec.body.queueEntryId
    || record.queueId !== record.cloudTaskSpec.body.queueId
    || record.runtimeRegion !== record.cloudTaskSpec.body.runtimeRegion) {
    context.addIssue({
      code: 'custom',
      message: 'Professional GPU Cloud Task outbox lineage changed.',
    })
  }
  if (record.dispatchResult
    && record.dispatchResult.providerOutcome !== expectedOutcome) {
    context.addIssue({
      code: 'custom',
      message: 'Professional GPU Cloud Task outbox outcome changed.',
    })
  }
})
export const canonicalProfessionalGpuCloudTaskOutboxRecordSchema =
  outboxRecordWithoutHashSchema.extend({ recordHash: sha256 }).strict()
export type CanonicalProfessionalGpuCloudTaskOutboxRecord = z.infer<
  typeof canonicalProfessionalGpuCloudTaskOutboxRecordSchema
>

const baseRequestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
  ),
  requestId: safeId,
  requestDigestSha256: sha256,
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
}).strict()

export const canonicalProfessionalGpuCloudTaskOutboxBeginCreateRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('begin_create'),
    queueEntryId: safeId,
    claimRef: evidenceRefSchema,
    cloudTaskSpec: canonicalProfessionalGpuCloudTaskSpecSchema,
    dispatcherInstanceId: safeId,
    requestedAt: timestamp,
    leaseDurationSeconds: z.number().int().min(30).max(300),
  }).strict().superRefine((request, context) => {
    if (request.queueId !== request.cloudTaskSpec.body.queueId
      || request.runtimeRegion !== request.cloudTaskSpec.body.runtimeRegion
      || request.queueEntryId !== request.cloudTaskSpec.body.queueEntryId
      || request.claimRef.id !== request.cloudTaskSpec.body.claimId
      || request.claimRef.contentHash !==
        `sha256:${request.cloudTaskSpec.body.claimHash}`) {
      context.addIssue({
        code: 'custom',
        message: 'GPU Cloud Task begin-create request lost claim lineage.',
      })
    }
  })

export const canonicalProfessionalGpuCloudTaskOutboxRecordOutcomeRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('record_create_outcome'),
    queueEntryId: safeId,
    claimRef: evidenceRefSchema,
    createLeaseId: safeId,
    cloudTaskSpecRef: evidenceRefSchema,
    dispatchResult: canonicalProfessionalGpuCloudTaskDispatchResultSchema,
    observedAt: timestamp,
  }).strict().superRefine((request, context) => {
    if (request.cloudTaskSpecRef.id !==
        request.dispatchResult.cloudTaskSpecRef.id
      || request.cloudTaskSpecRef.contentHash !==
        request.dispatchResult.cloudTaskSpecRef.contentHash) {
      context.addIssue({
        code: 'custom',
        message: 'GPU Cloud Task result no longer matches its task spec.',
      })
    }
  })

export type CanonicalProfessionalGpuCloudTaskOutboxRequest =
  | z.infer<
    typeof canonicalProfessionalGpuCloudTaskOutboxBeginCreateRequestSchema
  >
  | z.infer<
    typeof canonicalProfessionalGpuCloudTaskOutboxRecordOutcomeRequestSchema
  >
export type CanonicalProfessionalGpuCloudTaskOutboxRequestInput =
  CanonicalProfessionalGpuCloudTaskOutboxRequest extends infer TRequest
    ? TRequest extends CanonicalProfessionalGpuCloudTaskOutboxRequest
      ? Omit<TRequest, 'requestDigestSha256'>
      : never
    : never

const outboxResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_postgres_professional_gpu_cloud_task_outbox_owner',
  ),
  operation: z.enum(['begin_create', 'record_create_outcome']),
  requestId: safeId,
  requestDigestSha256: sha256,
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  disposition: z.enum([
    'create_admitted',
    'created_replay',
    'not_created_replay',
    'reconciliation_required',
    'outcome_recorded',
    'outcome_replay',
  ]),
  record: canonicalProfessionalGpuCloudTaskOutboxRecordSchema,
  sharedDurablePostgresTransactionPerformed: z.literal(true),
  browserOrFrontendClientAllowed: z.literal(false),
  automaticCreateRetryStarted: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  transactionCommittedAt: timestamp,
}).strict().superRefine((result, context) => {
  if (result.operation === 'record_create_outcome'
    && result.record.status === 'create_leased') {
    context.addIssue({
      code: 'custom',
      message: 'Recorded Cloud Task outcome remained unclassified.',
    })
  }
})
export const canonicalProfessionalGpuCloudTaskOutboxResultSchema =
  outboxResultWithoutHashSchema.extend({ resultDigestSha256: sha256 }).strict()
export type CanonicalProfessionalGpuCloudTaskOutboxResult = z.infer<
  typeof canonicalProfessionalGpuCloudTaskOutboxResultSchema
>

export interface CanonicalProfessionalGpuCloudTaskOutboxAdapter {
  readonly adapterId: string
  readonly databaseBackend: 'postgres'
  readonly browserOrFrontendClientAllowed: false
  readonly automaticTransportRetryAllowed: false
  readonly sharedDurableTransactionPerformed: true
  readonly multiReplicaDurabilityVerified: boolean
  readonly cloudTasksDispatchVerified: boolean
  readonly productionAuthority: false
  beginCreate(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuCloudTaskOutboxResult>
  recordCreateOutcome(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuCloudTaskOutboxResult>
}

export function sealCanonicalProfessionalGpuCloudTaskOutboxRequest<
  T extends CanonicalProfessionalGpuCloudTaskOutboxRequestInput,
>(request: T): T & { readonly requestDigestSha256: string } {
  const sealed = {
    ...request,
    requestDigestSha256: sha256AuthorityValue({
      domain: 'canonical_professional_gpu_cloud_task_outbox_request_v1',
      operation: request.operation,
      request,
    }),
  } as T & { readonly requestDigestSha256: string }
  Object.freeze(sealed)
  return sealed
}

export function assertCanonicalProfessionalGpuCloudTaskOutboxRequest(
  value: unknown,
  operation: CanonicalProfessionalGpuCloudTaskOutboxRequest['operation'],
): CanonicalProfessionalGpuCloudTaskOutboxRequest {
  const schema = operation === 'begin_create'
    ? canonicalProfessionalGpuCloudTaskOutboxBeginCreateRequestSchema
    : canonicalProfessionalGpuCloudTaskOutboxRecordOutcomeRequestSchema
  const parsed = schema.parse(clonePlain(value)) as
    CanonicalProfessionalGpuCloudTaskOutboxRequest
  const { requestDigestSha256, ...request } = parsed
  if (requestDigestSha256 !== sha256AuthorityValue({
    domain: 'canonical_professional_gpu_cloud_task_outbox_request_v1',
    operation,
    request,
  })) {
    throw new TypeError('Professional GPU Cloud Task outbox request changed.')
  }
  if (parsed.operation === 'begin_create') {
    assertCanonicalProfessionalGpuCloudTaskSpec(parsed.cloudTaskSpec)
  } else {
    assertCanonicalProfessionalGpuCloudTaskDispatchResult(
      parsed.dispatchResult,
    )
  }
  return parsed
}

export function assertCanonicalProfessionalGpuCloudTaskOutboxRecord(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskOutboxRecord {
  const parsed = canonicalProfessionalGpuCloudTaskOutboxRecordSchema.parse(
    clonePlain(value),
  )
  const { recordHash, ...record } = parsed
  if (recordHash !== sha256AuthorityValue(record)) {
    throw new TypeError('Professional GPU Cloud Task outbox record changed.')
  }
  const spec = assertCanonicalProfessionalGpuCloudTaskSpec(
    parsed.cloudTaskSpec,
  )
  if (parsed.dispatchResult) {
    const result = assertCanonicalProfessionalGpuCloudTaskDispatchResult(
      parsed.dispatchResult,
    )
    if (result.cloudTaskSpecRef.id !== spec.cloudTaskName
      || result.cloudTaskSpecRef.contentHash !==
        `sha256:${spec.specDigestSha256}`) {
      throw new TypeError('GPU Cloud Task result/spec lineage changed.')
    }
  }
  return parsed
}

export function assertCanonicalProfessionalGpuCloudTaskOutboxResult(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskOutboxResult {
  const parsed = canonicalProfessionalGpuCloudTaskOutboxResultSchema.parse(
    clonePlain(value),
  )
  const { resultDigestSha256, ...result } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(result)) {
    throw new TypeError('Professional GPU Cloud Task outbox result changed.')
  }
  assertCanonicalProfessionalGpuCloudTaskOutboxRecord(parsed.record)
  return parsed
}

function clonePlain<T>(value: T, seen = new Set<object>(), depth = 0): T {
  if (depth > 32) throw new TypeError('GPU Cloud Task outbox is too deep.')
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
    || typeof value === 'string') return value
  if (!value || typeof value !== 'object' || seen.has(value)) {
    throw new TypeError('GPU Cloud Task outbox is not serialized data.')
  }
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype
        || value.length > 10_000) {
        throw new TypeError('GPU Cloud Task outbox array is invalid.')
      }
      return value.map((item) => clonePlain(item, seen, depth + 1)) as T
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError('GPU Cloud Task outbox object is not plain.')
    }
    const result: Record<string, unknown> = {}
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') {
        throw new TypeError('GPU Cloud Task outbox symbol keys are forbidden.')
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new TypeError('GPU Cloud Task outbox accessors are forbidden.')
      }
      result[key] = clonePlain(descriptor.value, seen, depth + 1)
    }
    return result as T
  } finally {
    seen.delete(value)
  }
}
