import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionRequest,
  assertCanonicalProfessionalGpuFairQueueTransactionResult,
  CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
  type CanonicalProfessionalGpuFairQueueTransactionRequest,
} from './canonical-professional-gpu-fair-queue-transaction-port'

export const CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_POSTGRES_RPC_REGISTRY =
  Object.freeze({
    enqueue: 'weeditpro_enqueue_professional_gpu_fair_queue_v1',
    claim: 'weeditpro_claim_professional_gpu_fair_queue_v1',
    mark_dispatched: 'weeditpro_mark_professional_gpu_fair_queue_dispatched_v1',
    finalize: 'weeditpro_finalize_professional_gpu_fair_queue_v1',
    recover_expired_dispatch_leases:
      'weeditpro_recover_professional_gpu_fair_queue_leases_v1',
  } as const)

export interface CanonicalProfessionalGpuFairQueuePostgresRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface CanonicalProfessionalGpuFairQueuePostgresRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version:
        typeof CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalProfessionalGpuFairQueuePostgresRpcClientResult>
}

const localCapabilitySchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-fair-queue-local-postgres-capability-v1',
  ),
  purpose: z.literal('canonical_v3_loopback_gpu_queue_transaction_proof'),
  endpointOrigin: z.literal('http://127.0.0.1:57431'),
  loopbackOnly: z.literal(true),
  browserOrFrontendClientAllowed: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  cloudTasksDispatchVerified: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()
export type CanonicalProfessionalGpuFairQueueLocalPostgresCapability = z.infer<
  typeof localCapabilitySchema
>

const localCapabilities = new WeakMap<
  object,
  CanonicalProfessionalGpuFairQueuePostgresRpcClient
>()
const productionCapabilities = new WeakMap<
  object,
  CanonicalProfessionalGpuFairQueuePostgresRpcClient
>()

const productionCapabilitySchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-fair-queue-production-postgres-capability-v1',
  ),
  purpose: z.literal('canonical_production_gpu_queue_transaction_owner'),
  endpointOrigin: z.string().url().max(512),
  serverOnly: z.literal(true),
  browserOrFrontendClientAllowed: z.literal(false),
  sharedPostgresMultiReplicaDurabilityRequired: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()
export type CanonicalProfessionalGpuFairQueueProductionPostgresCapability =
  z.infer<typeof productionCapabilitySchema>

export function createCanonicalProfessionalGpuFairQueueLocalPostgresCapability(
  input: {
    readonly endpointOrigin: string
    readonly client: CanonicalProfessionalGpuFairQueuePostgresRpcClient
  },
): CanonicalProfessionalGpuFairQueueLocalPostgresCapability {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431'
    || !input.client || typeof input.client.rpc !== 'function') {
    invalid('local_postgres_capability_invalid')
  }
  const capability = Object.freeze(localCapabilitySchema.parse({
    schemaVersion:
      'canonical-professional-gpu-fair-queue-local-postgres-capability-v1',
    purpose: 'canonical_v3_loopback_gpu_queue_transaction_proof',
    endpointOrigin: 'http://127.0.0.1:57431',
    loopbackOnly: true,
    browserOrFrontendClientAllowed: false,
    remoteDatabaseMutationAllowed: false,
    multiReplicaDurabilityVerified: false,
    cloudTasksDispatchVerified: false,
    productionAuthority: false,
  }))
  localCapabilities.set(capability, input.client)
  return capability
}

export function createCanonicalProfessionalGpuFairQueueLocalPostgresAdapter(
  input: {
    readonly client: CanonicalProfessionalGpuFairQueuePostgresRpcClient
    readonly capability:
      CanonicalProfessionalGpuFairQueueLocalPostgresCapability
  },
): CanonicalProfessionalGpuFairQueueTransactionAdapter {
  if (localCapabilities.get(input.capability) !== input.client) {
    invalid('local_postgres_capability_not_bound_to_client')
  }
  localCapabilitySchema.parse(input.capability)
  const invoke = async (
    operation: CanonicalProfessionalGpuFairQueueTransactionRequest['operation'],
    rawRequest: unknown,
  ) => {
    const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
      rawRequest,
      operation,
    )
    let rpcResult: CanonicalProfessionalGpuFairQueuePostgresRpcClientResult
    try {
      rpcResult = await input.client.rpc(
        CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_POSTGRES_RPC_REGISTRY[operation],
        {
          p_contract_version:
            CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
          p_request: request as unknown as Record<string, unknown>,
        },
      )
    } catch {
      invalid('local_postgres_rpc_transport_failed')
    }
    if (!rpcResult || typeof rpcResult !== 'object' || rpcResult.error) {
      invalid('local_postgres_rpc_rejected')
    }
    const data = Array.isArray(rpcResult.data)
      ? rpcResult.data.length === 1 ? rpcResult.data[0] : null
      : rpcResult.data
    const result = assertCanonicalProfessionalGpuFairQueueTransactionResult(data)
    if (result.operation !== operation
      || result.requestId !== request.requestId
      || result.requestDigestSha256 !== request.requestDigestSha256
      || result.queueId !== request.queueId
      || result.runtimeRegion !== request.runtimeRegion) {
      invalid('local_postgres_rpc_lineage_changed')
    }
    return result
  }
  return Object.freeze({
    adapterId: 'canonical-v3-local-professional-gpu-fair-queue-postgres-v1',
    databaseBackend: 'postgres' as const,
    browserOrFrontendClientAllowed: false as const,
    automaticTransportRetryAllowed: false as const,
    sharedDurableTransactionPerformed: true as const,
    multiReplicaDurabilityVerified: false as const,
    cloudTasksDispatchVerified: false as const,
    productionAuthority: false as const,
    enqueue: (request: unknown) => invoke('enqueue', request),
    claim: (request: unknown) => invoke('claim', request),
    markDispatched: (request: unknown) => invoke('mark_dispatched', request),
    finalize: (request: unknown) => invoke('finalize', request),
    recoverExpiredDispatchLeases: (request: unknown) =>
      invoke('recover_expired_dispatch_leases', request),
  })
}

export function createCanonicalProfessionalGpuFairQueueProductionPostgresCapability(
  input: {
    readonly endpointOrigin: string
    readonly client: CanonicalProfessionalGpuFairQueuePostgresRpcClient
  },
): CanonicalProfessionalGpuFairQueueProductionPostgresCapability {
  let endpoint: URL
  try {
    endpoint = new URL(input.endpointOrigin)
  } catch {
    invalid('production_postgres_origin_invalid')
  }
  if (endpoint.protocol !== 'https:'
    || endpoint.username.length > 0
    || endpoint.password.length > 0
    || endpoint.search.length > 0
    || endpoint.hash.length > 0
    || endpoint.pathname !== '/'
    || !input.client
    || typeof input.client.rpc !== 'function') {
    invalid('production_postgres_capability_invalid')
  }
  const capability = Object.freeze(productionCapabilitySchema.parse({
    schemaVersion:
      'canonical-professional-gpu-fair-queue-production-postgres-capability-v1',
    purpose: 'canonical_production_gpu_queue_transaction_owner',
    endpointOrigin: endpoint.origin,
    serverOnly: true,
    browserOrFrontendClientAllowed: false,
    sharedPostgresMultiReplicaDurabilityRequired: true,
    automaticTransportRetryAllowed: false,
    productionAuthority: false,
  }))
  productionCapabilities.set(capability, input.client)
  return capability
}

export function createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter(
  input: {
    readonly client: CanonicalProfessionalGpuFairQueuePostgresRpcClient
    readonly capability:
      CanonicalProfessionalGpuFairQueueProductionPostgresCapability
  },
): CanonicalProfessionalGpuFairQueueTransactionAdapter {
  if (productionCapabilities.get(input.capability) !== input.client) {
    invalid('production_postgres_capability_not_bound_to_client')
  }
  productionCapabilitySchema.parse(input.capability)
  const invoke = async (
    operation: CanonicalProfessionalGpuFairQueueTransactionRequest['operation'],
    rawRequest: unknown,
  ) => {
    const request = assertCanonicalProfessionalGpuFairQueueTransactionRequest(
      rawRequest,
      operation,
    )
    let rpcResult: CanonicalProfessionalGpuFairQueuePostgresRpcClientResult
    try {
      rpcResult = await input.client.rpc(
        CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_POSTGRES_RPC_REGISTRY[operation],
        {
          p_contract_version:
            CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_TRANSACTION_PORT_VERSION,
          p_request: request as unknown as Record<string, unknown>,
        },
      )
    } catch {
      invalid('production_postgres_rpc_transport_failed')
    }
    if (!rpcResult || typeof rpcResult !== 'object' || rpcResult.error) {
      invalid('production_postgres_rpc_rejected')
    }
    const data = Array.isArray(rpcResult.data)
      ? rpcResult.data.length === 1 ? rpcResult.data[0] : null
      : rpcResult.data
    const result = assertCanonicalProfessionalGpuFairQueueTransactionResult(data)
    if (result.operation !== operation
      || result.requestId !== request.requestId
      || result.requestDigestSha256 !== request.requestDigestSha256
      || result.queueId !== request.queueId
      || result.runtimeRegion !== request.runtimeRegion) {
      invalid('production_postgres_rpc_lineage_changed')
    }
    return result
  }
  return Object.freeze({
    adapterId: 'canonical-professional-gpu-fair-queue-production-postgres-v1',
    databaseBackend: 'postgres' as const,
    browserOrFrontendClientAllowed: false as const,
    automaticTransportRetryAllowed: false as const,
    sharedDurableTransactionPerformed: true as const,
    multiReplicaDurabilityVerified: true,
    cloudTasksDispatchVerified: false,
    productionAuthority: false as const,
    enqueue: (request: unknown) => invoke('enqueue', request),
    claim: (request: unknown) => invoke('claim', request),
    markDispatched: (request: unknown) => invoke('mark_dispatched', request),
    finalize: (request: unknown) => invoke('finalize', request),
    recoverExpiredDispatchLeases: (request: unknown) =>
      invoke('recover_expired_dispatch_leases', request),
  })
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The professional GPU fair-queue Postgres transaction is unavailable.',
    503,
    {
      reason,
      browserOrFrontendClientAllowed: false,
      automaticRetryStarted: false,
      productionAuthority: false,
    },
  )
}
