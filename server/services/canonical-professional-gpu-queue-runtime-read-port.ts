import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalProfessionalGpuCloudTaskOutboxRecord,
  canonicalProfessionalGpuCloudTaskOutboxRecordSchema,
} from './canonical-professional-gpu-cloud-task-outbox-port'
import {
  canonicalProfessionalGpuFairQueueDurableClaimSchema,
  canonicalProfessionalGpuFairQueueDurableTerminalSchema,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import {
  assertCanonicalProfessionalGpuFairQueueCapacity,
} from './canonical-professional-gpu-fair-queue-scheduler'
import {
  assertCanonicalSam31A100ServingCompleteSourceCapacityObservation,
  type CanonicalSam31A100ServingCompleteSourceCapacityReadPort,
} from './canonical-sam3_1-complete-source-capacity-owner'
import {
  assertCanonicalSam31VertexServingCapacityObservation,
  type CanonicalSam31VertexServingCapacityObservation,
} from './canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'
import type {
  CanonicalProfessionalGpuFairQueueCapacityReadPort,
} from './canonical-professional-gpu-cloud-task-scheduler-service'

export const CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION =
  'canonical-professional-gpu-queue-runtime-read-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_STATE_VERSION =
  'canonical-professional-gpu-queue-runtime-state-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_QUEUE_CONSUMPTION_VERSION =
  'canonical-professional-gpu-queue-consumption-bootstrap-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_QUEUE_DELIVERY_CONSUMPTION_VERSION =
  'canonical-professional-gpu-queue-delivery-consumption-v2' as const
export const CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_RPC_REGISTRY =
  Object.freeze({
    state: 'weeditpro_read_professional_gpu_queue_runtime_state_v1',
    consumption: 'weeditpro_read_professional_gpu_queue_consumption_v1',
    deliveryConsumption:
      'weeditpro_read_professional_gpu_queue_delivery_consumption_v2',
  } as const)

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const routeId = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const routeStateSchema = z.object({
  routeId,
  queuedCount: z.number().int().nonnegative().max(10_000),
  activeCount: z.number().int().nonnegative().max(64),
}).strict()
const stateWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_STATE_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_queue_read_owner'),
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  controlRevision: z.number().int().nonnegative().safe(),
  routeStates: z.tuple([
    routeStateSchema.extend({
      routeId: z.literal('a100_80gb_heavy_primary'),
    }).strict(),
    routeStateSchema.extend({
      routeId: z.literal('l4_heavy_fallback'),
    }).strict(),
    routeStateSchema.extend({
      routeId: z.literal('l4_standard_primary'),
    }).strict(),
  ]),
  queuedCount: z.number().int().nonnegative().max(10_000),
  activeCount: z.number().int().nonnegative().max(192),
  exactSharedPostgresStateReread: z.literal(true),
  callerCapacityAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((state, context) => {
  if (state.queuedCount !== state.routeStates.reduce(
    (sum, route) => sum + route.queuedCount,
    0,
  ) || state.activeCount !== state.routeStates.reduce(
    (sum, route) => sum + route.activeCount,
    0,
  )) {
    context.addIssue({
      code: 'custom',
      message: 'GPU queue route and aggregate counts differ.',
    })
  }
})
const stateSchema = stateWithoutHashSchema.extend({ stateHash: sha256 }).strict()
export type CanonicalProfessionalGpuQueueRuntimeState = z.infer<
  typeof stateSchema
>

const consumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_QUEUE_CONSUMPTION_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_queue_read_owner'),
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  queueEntryStatus: z.literal('dispatched'),
  claim: canonicalProfessionalGpuFairQueueDurableClaimSchema,
  outboxRecord: canonicalProfessionalGpuCloudTaskOutboxRecordSchema,
  exactDispatchedClaimAndCreatedTaskReread: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const claimRef = value.outboxRecord.claimRef
  if (value.outboxRecord.status !== 'created'
    || value.outboxRecord.queueEntryId !==
      value.claim.queueEntry.queueEntryId
    || claimRef.id !== value.claim.claimId
    || claimRef.contentHash !== `sha256:${value.claim.claimHash}`
    || value.outboxRecord.cloudTaskSpec.body.executionAttemptRef.id !==
      value.claim.queueEntry.executionAttemptRef.id
    || value.outboxRecord.dispatchResult?.providerOutcome !== 'created') {
    context.addIssue({
      code: 'custom',
      message: 'GPU queue consumption claim and created task differ.',
    })
  }
})
const consumptionSchema = consumptionWithoutHashSchema.extend({
  consumptionHash: sha256,
}).strict()
export type CanonicalProfessionalGpuQueueConsumptionBootstrap = z.infer<
  typeof consumptionSchema
>

const deliveryConsumptionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_QUEUE_DELIVERY_CONSUMPTION_VERSION,
  ),
  source: z.literal('canonical_postgres_professional_gpu_queue_read_owner'),
  queueId: z.literal('weeditpro-professional-gpu-production-v1'),
  runtimeRegion: z.literal('us-central1'),
  queueEntryStatus: z.enum([
    'dispatched',
    'completed',
    'failed_reconciled',
  ]),
  claim: canonicalProfessionalGpuFairQueueDurableClaimSchema,
  outboxRecord: canonicalProfessionalGpuCloudTaskOutboxRecordSchema,
  terminal: canonicalProfessionalGpuFairQueueDurableTerminalSchema.nullable(),
  exactClaimCreatedTaskAndTerminalReread: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const terminal = value.queueEntryStatus !== 'dispatched'
  const claimRef = value.outboxRecord.claimRef
  if (terminal !== (value.terminal !== null)
    || value.outboxRecord.status !== 'created'
    || value.outboxRecord.queueEntryId !==
      value.claim.queueEntry.queueEntryId
    || claimRef.id !== value.claim.claimId
    || claimRef.contentHash !== `sha256:${value.claim.claimHash}`
    || value.outboxRecord.cloudTaskSpec.body.executionAttemptRef.id !==
      value.claim.queueEntry.executionAttemptRef.id
    || value.outboxRecord.dispatchResult?.providerOutcome !== 'created'
    || (value.terminal !== null && (
      value.terminal.disposition !== value.queueEntryStatus
      || value.terminal.claimRef.id !== value.claim.claimId
      || value.terminal.claimRef.contentHash !==
        `sha256:${value.claim.claimHash}`
      || value.terminal.executionAttemptRef.id !==
        value.claim.queueEntry.executionAttemptRef.id
    ))) {
    context.addIssue({
      code: 'custom',
      message: 'GPU queue delivery consumption lineage changed.',
    })
  }
})
const deliveryConsumptionSchema = deliveryConsumptionWithoutHashSchema.extend({
  consumptionHash: sha256,
}).strict()
export type CanonicalProfessionalGpuQueueDeliveryConsumption = z.infer<
  typeof deliveryConsumptionSchema
>

export interface CanonicalProfessionalGpuQueueRuntimeReadRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface CanonicalProfessionalGpuQueueRuntimeReadRpcClient {
  rpc(
    functionName: string,
    parameters: Record<string, string>,
  ): PromiseLike<CanonicalProfessionalGpuQueueRuntimeReadRpcClientResult>
}

export interface CanonicalProfessionalGpuQueueRuntimeReadPort {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION
  readonly serverOnly: true
  readonly sharedPostgresRereadRequired: true
  readonly browserOrFrontendClientAllowed: false
  readonly productionAuthority: false
  readState(input: {
    readonly queueId: 'weeditpro-professional-gpu-production-v1'
    readonly runtimeRegion: 'us-central1'
  }): Promise<CanonicalProfessionalGpuQueueRuntimeState>
  readConsumption(input: {
    readonly queueId: 'weeditpro-professional-gpu-production-v1'
    readonly runtimeRegion: 'us-central1'
    readonly claimId: string
  }): Promise<CanonicalProfessionalGpuQueueConsumptionBootstrap | null>
  readDeliveryConsumption(input: {
    readonly queueId: 'weeditpro-professional-gpu-production-v1'
    readonly runtimeRegion: 'us-central1'
    readonly claimId: string
  }): Promise<CanonicalProfessionalGpuQueueDeliveryConsumption | null>
}

export function createCanonicalProfessionalGpuQueueRuntimeReadPort(input: {
  readonly client: CanonicalProfessionalGpuQueueRuntimeReadRpcClient
}): CanonicalProfessionalGpuQueueRuntimeReadPort {
  if (!input.client || typeof input.client.rpc !== 'function') {
    invalid('runtime_read_client_invalid')
  }
  return Object.freeze({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION,
    serverOnly: true as const,
    sharedPostgresRereadRequired: true as const,
    browserOrFrontendClientAllowed: false as const,
    productionAuthority: false as const,
    async readState(query: {
      readonly queueId: 'weeditpro-professional-gpu-production-v1'
      readonly runtimeRegion: 'us-central1'
    }) {
      const data = await invoke(input.client, 'state', {
        p_contract_version:
          CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION,
        p_queue_id: query.queueId,
        p_runtime_region: query.runtimeRegion,
      })
      return assertCanonicalProfessionalGpuQueueRuntimeState(data)
    },
    async readConsumption(query: {
      readonly queueId: 'weeditpro-professional-gpu-production-v1'
      readonly runtimeRegion: 'us-central1'
      readonly claimId: string
    }) {
      const claimId = safeId.parse(query.claimId)
      const data = await invoke(input.client, 'consumption', {
        p_contract_version:
          CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION,
        p_queue_id: query.queueId,
        p_runtime_region: query.runtimeRegion,
        p_claim_id: claimId,
      })
      return data === null
        ? null
        : assertCanonicalProfessionalGpuQueueConsumptionBootstrap(data)
    },
    async readDeliveryConsumption(query: {
      readonly queueId: 'weeditpro-professional-gpu-production-v1'
      readonly runtimeRegion: 'us-central1'
      readonly claimId: string
    }) {
      const claimId = safeId.parse(query.claimId)
      const data = await invoke(input.client, 'deliveryConsumption', {
        p_contract_version:
          CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_VERSION,
        p_queue_id: query.queueId,
        p_runtime_region: query.runtimeRegion,
        p_claim_id: claimId,
      })
      return data === null
        ? null
        : assertCanonicalProfessionalGpuQueueDeliveryConsumption(data)
    },
  })
}

export function createCanonicalSam31ProductionGpuQueueCapacityReadPort(input: {
  readonly queueRuntimeReadPort:
    Pick<CanonicalProfessionalGpuQueueRuntimeReadPort, 'readState'>
  readonly a100QuotaReadPort:
    CanonicalSam31A100ServingCompleteSourceCapacityReadPort
  readonly a100EndpointCapacityReadPort: {
    rereadCurrent(): Promise<CanonicalSam31VertexServingCapacityObservation>
  }
}): CanonicalProfessionalGpuFairQueueCapacityReadPort {
  return Object.freeze({
    schemaVersion:
      'canonical-professional-gpu-fair-queue-capacity-read-port-v1' as const,
    serverOwnedCurrentQuotaRuntimeAndActiveCounts: true as const,
    callerCapacityAccepted: false as const,
    productionAuthority: false as const,
    async rereadCurrent(query: {
      readonly queueId: 'weeditpro-professional-gpu-production-v1'
      readonly runtimeRegion: 'us-central1'
      readonly observedAt: string
    }) {
      const [state, rawQuota, rawEndpoint] = await Promise.all([
        input.queueRuntimeReadPort.readState({
          queueId: query.queueId,
          runtimeRegion: query.runtimeRegion,
        }),
        input.a100QuotaReadPort.rereadCurrent(),
        input.a100EndpointCapacityReadPort.rereadCurrent(),
      ])
      const quota =
        assertCanonicalSam31A100ServingCompleteSourceCapacityObservation(
          rawQuota,
        )
      const endpoint = assertCanonicalSam31VertexServingCapacityObservation(
        rawEndpoint,
        query.observedAt,
      )
      if (Date.parse(query.observedAt) >= Date.parse(quota.expiresAt)
        || quota.reconciling
        || !quota.exactCloudQuotaPreferenceAndQuotaInfoReread
        || quota.endpointOrGpuJobStarted
        || !endpoint.exactCurrentEndpointModelVersionTrafficAndCapacityReread
        || endpoint.endpointOrGpuJobStarted) {
        throw new TypeError('SAM 3.1 A100 queue capacity is stale or pending.')
      }
      const a100 = state.routeStates[0]
      const maximum = Math.min(
        quota.grantedValue,
        endpoint.maximumReplicaCount,
        16,
      )
      if (maximum < 1 || a100.activeCount > maximum) {
        throw new TypeError('SAM 3.1 A100 queue capacity is unavailable.')
      }
      return [assertCanonicalProfessionalGpuFairQueueCapacity({
        routeId: 'a100_80gb_heavy_primary',
        capacityObservationRef: {
          id: `sam31-a100-queue-capacity:${state.controlRevision}`,
          version: 1,
          contentHash: `sha256:${sha256AuthorityValue({
            stateHash: state.stateHash,
            quotaObservationHash: quota.observationHash,
            endpointCapacityObservationHash: endpoint.observationHash,
            maximumConcurrentAttempts: maximum,
            currentActiveAttempts: a100.activeCount,
          })}`,
        },
        maximumConcurrentAttempts: maximum,
        currentActiveAttempts: a100.activeCount,
        minimumIdleGpuInstances: 0,
        exactCurrentQuotaAndRuntimeCapacityReread: true,
      })]
    },
  })
}

export function assertCanonicalProfessionalGpuQueueRuntimeState(
  value: unknown,
): CanonicalProfessionalGpuQueueRuntimeState {
  assertPlainSerializedData(value, 'professional_gpu_queue_runtime_state')
  const parsed = stateSchema.parse(value)
  const { stateHash, ...payload } = parsed
  if (stateHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU queue runtime state changed.')
  }
  return structuredClone(parsed)
}

export function assertCanonicalProfessionalGpuQueueConsumptionBootstrap(
  value: unknown,
): CanonicalProfessionalGpuQueueConsumptionBootstrap {
  assertPlainSerializedData(value, 'professional_gpu_queue_consumption')
  const parsed = consumptionSchema.parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU queue consumption changed.')
  }
  const { claimHash, ...claimPayload } = parsed.claim
  if (claimHash !== sha256AuthorityValue(claimPayload)) {
    throw new TypeError('Professional GPU queue claim changed.')
  }
  assertCanonicalProfessionalGpuCloudTaskOutboxRecord(parsed.outboxRecord)
  return structuredClone(parsed)
}

export function assertCanonicalProfessionalGpuQueueDeliveryConsumption(
  value: unknown,
): CanonicalProfessionalGpuQueueDeliveryConsumption {
  assertPlainSerializedData(value, 'professional_gpu_queue_delivery')
  const parsed = deliveryConsumptionSchema.parse(value)
  const { consumptionHash, ...payload } = parsed
  if (consumptionHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU queue delivery changed.')
  }
  const { claimHash, ...claimPayload } = parsed.claim
  if (claimHash !== sha256AuthorityValue(claimPayload)) {
    throw new TypeError('Professional GPU queue delivery claim changed.')
  }
  assertCanonicalProfessionalGpuCloudTaskOutboxRecord(parsed.outboxRecord)
  if (parsed.terminal) {
    const { terminalHash, ...terminalPayload } = parsed.terminal
    if (terminalHash !== sha256AuthorityValue(terminalPayload)) {
      throw new TypeError('Professional GPU queue terminal changed.')
    }
  }
  return structuredClone(parsed)
}

async function invoke(
  client: CanonicalProfessionalGpuQueueRuntimeReadRpcClient,
  operation: keyof typeof CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_RPC_REGISTRY,
  parameters: Record<string, string>,
): Promise<unknown> {
  let result: CanonicalProfessionalGpuQueueRuntimeReadRpcClientResult
  try {
    result = await client.rpc(
      CANONICAL_PROFESSIONAL_GPU_QUEUE_RUNTIME_READ_RPC_REGISTRY[operation],
      parameters,
    )
  } catch {
    invalid('runtime_read_rpc_transport_failed')
  }
  if (!result || typeof result !== 'object' || result.error) {
    invalid('runtime_read_rpc_rejected')
  }
  return Array.isArray(result.data)
    ? result.data.length === 1 ? result.data[0] : null
    : result.data
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The professional GPU queue runtime reread is unavailable.',
    503,
    {
      reason,
      browserOrFrontendClientAllowed: false,
      productionAuthority: false,
    },
  )
}
