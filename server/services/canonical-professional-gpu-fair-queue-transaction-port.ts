import { z } from 'zod'

import {
  canonicalProfessionalGpuFairQueueCapacitySchema,
  canonicalProfessionalGpuFairQueueEntrySchema,
} from './canonical-professional-gpu-fair-queue-scheduler'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION =
  'canonical-professional-gpu-fair-queue-transaction-port-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_CLAIM_VERSION =
  'canonical-professional-gpu-fair-queue-durable-claim-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_TERMINAL_VERSION =
  'canonical-professional-gpu-fair-queue-durable-terminal-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_RESULT_VERSION =
  'canonical-professional-gpu-fair-queue-transaction-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const runtimeRegionSchema = z.enum(['us-central1', 'us-east1', 'europe-west1'])
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()

const durableClaimWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_CLAIM_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_fair_queue_owner'),
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  queueEntry: canonicalProfessionalGpuFairQueueEntrySchema,
  scheduleRef: evidenceRefSchema,
  claimId: safeId,
  claimedAt: timestamp,
  dispatchLeaseExpiresAt: timestamp,
  externalDispatchOutcome: z.literal('not_started'),
  cloudGpuDispatchStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  automaticRetryAllowed: z.literal(false),
}).strict().superRefine((claim, context) => {
  if (Date.parse(claim.claimedAt) < Date.parse(claim.queueEntry.enqueuedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Professional GPU claim cannot precede queue admission.',
    })
  }
  if (Date.parse(claim.dispatchLeaseExpiresAt) <= Date.parse(claim.claimedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'Professional GPU dispatch lease must expire after claim time.',
    })
  }
})
export const canonicalProfessionalGpuFairQueueDurableClaimSchema =
  durableClaimWithoutHashSchema.extend({ claimHash: sha256 }).strict()
export type CanonicalProfessionalGpuFairQueueDurableClaim = z.infer<
  typeof canonicalProfessionalGpuFairQueueDurableClaimSchema
>

const durableTerminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_DURABLE_TERMINAL_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_fair_queue_owner'),
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  queueEntryRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  claimRef: evidenceRefSchema,
  terminalEvidenceRef: evidenceRefSchema,
  disposition: z.enum(['completed', 'failed_reconciled']),
  terminalAt: timestamp,
  automaticRetryStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
export const canonicalProfessionalGpuFairQueueDurableTerminalSchema =
  durableTerminalWithoutHashSchema.extend({ terminalHash: sha256 }).strict()
export type CanonicalProfessionalGpuFairQueueDurableTerminal = z.infer<
  typeof canonicalProfessionalGpuFairQueueDurableTerminalSchema
>

const baseRequestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
  ),
  requestId: safeId,
  requestDigestSha256: sha256,
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
}).strict()

export const canonicalProfessionalGpuFairQueueEnqueueRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('enqueue'),
    entry: canonicalProfessionalGpuFairQueueEntrySchema,
    requestedAt: timestamp,
  }).strict()
export const canonicalProfessionalGpuFairQueueClaimRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('claim'),
    scheduleId: safeId,
    capacities: z.array(canonicalProfessionalGpuFairQueueCapacitySchema)
      .min(1).max(3),
    claimedAt: timestamp,
    dispatchLeaseDurationSeconds: z.number().int().min(30).max(600),
  }).strict()
export const canonicalProfessionalGpuFairQueueMarkDispatchedRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('mark_dispatched'),
    queueEntryId: safeId,
    executionAttemptRef: evidenceRefSchema,
    claimRef: evidenceRefSchema,
    cloudTaskDispatchReceiptRef: evidenceRefSchema,
    dispatchedAt: timestamp,
  }).strict()
export const canonicalProfessionalGpuFairQueueFinalizeRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('finalize'),
    queueEntryId: safeId,
    executionAttemptRef: evidenceRefSchema,
    claimRef: evidenceRefSchema,
    terminalEvidenceRef: evidenceRefSchema,
    disposition: z.enum(['completed', 'failed_reconciled']),
    terminalAt: timestamp,
  }).strict()
export const canonicalProfessionalGpuFairQueueRecoverRequestSchema =
  baseRequestSchema.extend({
    operation: z.literal('recover_expired_dispatch_leases'),
    observedAt: timestamp,
    maximumEntries: z.number().int().min(1).max(192),
  }).strict()

export type CanonicalProfessionalGpuFairQueueTransactionRequest =
  | z.infer<typeof canonicalProfessionalGpuFairQueueEnqueueRequestSchema>
  | z.infer<typeof canonicalProfessionalGpuFairQueueClaimRequestSchema>
  | z.infer<
    typeof canonicalProfessionalGpuFairQueueMarkDispatchedRequestSchema
  >
  | z.infer<typeof canonicalProfessionalGpuFairQueueFinalizeRequestSchema>
  | z.infer<typeof canonicalProfessionalGpuFairQueueRecoverRequestSchema>
export type CanonicalProfessionalGpuFairQueueTransactionRequestInput =
  CanonicalProfessionalGpuFairQueueTransactionRequest extends infer TRequest
    ? TRequest extends CanonicalProfessionalGpuFairQueueTransactionRequest
      ? Omit<TRequest, 'requestDigestSha256'>
      : never
    : never

const transactionResultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_RESULT_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_fair_queue_owner'),
  operation: z.enum([
    'enqueue',
    'claim',
    'mark_dispatched',
    'finalize',
    'recover_expired_dispatch_leases',
  ]),
  requestId: safeId,
  requestDigestSha256: sha256,
  queueId: safeId,
  runtimeRegion: runtimeRegionSchema,
  disposition: z.enum([
    'queued',
    'queued_replay',
    'active_replay',
    'terminal_replay',
    'claims_created',
    'no_capacity_available',
    'dispatch_recorded',
    'dispatch_replay',
    'finalized',
    'recovery_completed',
  ]),
  queueEntryRef: evidenceRefSchema.nullable(),
  claims: z.array(canonicalProfessionalGpuFairQueueDurableClaimSchema).max(192),
  terminal: canonicalProfessionalGpuFairQueueDurableTerminalSchema.nullable(),
  queuedCount: z.number().int().nonnegative().max(10_000),
  activeCount: z.number().int().nonnegative().max(192),
  requeuedBeforeDispatchCount: z.number().int().nonnegative().max(192),
  reconciliationRequiredCount: z.number().int().nonnegative().max(192),
  transactionRevision: z.number().int().positive().safe(),
  transactionCommittedAt: timestamp,
  sharedDurablePostgresTransactionPerformed: z.literal(true),
  workspaceRoundRobinFairnessApplied: z.literal(true),
  maximumActiveAttemptsPerWorkspace: z.literal(2),
  cloudTasksDispatchStartedByQueueTransaction: z.literal(false),
  cpuSubstantiveFallbackAllowed: z.literal(false),
  automaticQualityReductionAllowed: z.literal(false),
  silentAdditionalCreditApprovalAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
export const canonicalProfessionalGpuFairQueueTransactionResultSchema =
  transactionResultWithoutHashSchema.extend({ resultDigestSha256: sha256 })
    .strict()
export type CanonicalProfessionalGpuFairQueueTransactionResult = z.infer<
  typeof canonicalProfessionalGpuFairQueueTransactionResultSchema
>

export interface CanonicalProfessionalGpuFairQueueTransactionAdapter {
  readonly adapterId: string
  readonly databaseBackend: 'postgres'
  readonly browserOrFrontendClientAllowed: false
  readonly automaticTransportRetryAllowed: false
  readonly sharedDurableTransactionPerformed: true
  readonly multiReplicaDurabilityVerified: boolean
  readonly cloudTasksDispatchVerified: boolean
  readonly productionAuthority: false
  enqueue(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuFairQueueTransactionResult>
  claim(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuFairQueueTransactionResult>
  markDispatched(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuFairQueueTransactionResult>
  finalize(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuFairQueueTransactionResult>
  recoverExpiredDispatchLeases(
    request: unknown,
  ): Promise<CanonicalProfessionalGpuFairQueueTransactionResult>
}

export function sealCanonicalProfessionalGpuFairQueueTransactionRequest<
  T extends CanonicalProfessionalGpuFairQueueTransactionRequestInput,
>(request: T): T & { readonly requestDigestSha256: string } {
  const sealedRequest = {
    ...request,
    requestDigestSha256: sha256AuthorityValue({
      domain: 'canonical_professional_gpu_fair_queue_transaction_request_v1',
      operation: request.operation,
      request,
    }),
  } as T & { readonly requestDigestSha256: string }

  Object.freeze(sealedRequest)
  return sealedRequest
}

export function assertCanonicalProfessionalGpuFairQueueTransactionRequest(
  value: unknown,
  operation: CanonicalProfessionalGpuFairQueueTransactionRequest['operation'],
): CanonicalProfessionalGpuFairQueueTransactionRequest {
  const schema = operation === 'enqueue'
    ? canonicalProfessionalGpuFairQueueEnqueueRequestSchema
    : operation === 'claim'
      ? canonicalProfessionalGpuFairQueueClaimRequestSchema
      : operation === 'mark_dispatched'
        ? canonicalProfessionalGpuFairQueueMarkDispatchedRequestSchema
        : operation === 'finalize'
          ? canonicalProfessionalGpuFairQueueFinalizeRequestSchema
          : canonicalProfessionalGpuFairQueueRecoverRequestSchema
  const parsed = schema.parse(clonePlain(value)) as
    CanonicalProfessionalGpuFairQueueTransactionRequest
  const { requestDigestSha256, ...request } = parsed
  const expected = sha256AuthorityValue({
    domain: 'canonical_professional_gpu_fair_queue_transaction_request_v1',
    operation,
    request,
  })
  if (requestDigestSha256 !== expected) {
    throw new Error('Professional GPU fair-queue request digest changed.')
  }
  return parsed
}

export function assertCanonicalProfessionalGpuFairQueueTransactionResult(
  value: unknown,
): CanonicalProfessionalGpuFairQueueTransactionResult {
  const parsed = canonicalProfessionalGpuFairQueueTransactionResultSchema.parse(
    clonePlain(value),
  )
  const { resultDigestSha256, ...result } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(result)) {
    throw new Error('Professional GPU fair-queue transaction result changed.')
  }
  for (const claim of parsed.claims) {
    const { claimHash, ...payload } = claim
    if (claimHash !== sha256AuthorityValue(payload)) {
      throw new Error('Professional GPU fair-queue durable claim changed.')
    }
  }
  if (parsed.terminal) {
    const { terminalHash, ...payload } = parsed.terminal
    if (terminalHash !== sha256AuthorityValue(payload)) {
      throw new Error('Professional GPU fair-queue terminal changed.')
    }
  }
  return parsed
}

function clonePlain(value: unknown): unknown {
  if (value === null || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
    || typeof value === 'string') return value
  if (!value || typeof value !== 'object') {
    throw new Error('Professional GPU fair-queue value is not serialized data.')
  }
  const prototype = Object.getPrototypeOf(value)
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype || value.length > 10_000) {
      throw new Error('Professional GPU fair-queue array is invalid.')
    }
    return value.map(clonePlain)
  }
  if (prototype !== Object.prototype) {
    throw new Error('Professional GPU fair-queue object is not plain.')
  }
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (Reflect.ownKeys(value).some((key) => typeof key !== 'string')) {
    throw new Error('Professional GPU fair-queue object has symbol keys.')
  }
  const result: Record<string, unknown> = {}
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!('value' in descriptor)) {
      throw new Error('Professional GPU fair-queue accessors are forbidden.')
    }
    result[key] = clonePlain(descriptor.value)
  }
  return result
}
