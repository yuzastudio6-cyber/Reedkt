import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalProfessionalGpuCloudTaskOutboxRequest,
  assertCanonicalProfessionalGpuCloudTaskOutboxResult,
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
  type CanonicalProfessionalGpuCloudTaskOutboxAdapter,
  type CanonicalProfessionalGpuCloudTaskOutboxRequest,
} from './canonical-professional-gpu-cloud-task-outbox-port'

export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RPC_REGISTRY =
  Object.freeze({
    begin_create:
      'weeditpro_begin_professional_gpu_cloud_task_create_v1',
    record_create_outcome:
      'weeditpro_record_professional_gpu_cloud_task_outcome_v1',
  } as const)

export interface CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface CanonicalProfessionalGpuCloudTaskOutboxRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version:
        typeof CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult>
}

const localCapabilitySchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-cloud-task-outbox-local-capability-v1',
  ),
  purpose: z.literal('canonical_v3_loopback_cloud_task_outbox_proof'),
  endpointOrigin: z.literal('http://127.0.0.1:57431'),
  loopbackOnly: z.literal(true),
  browserOrFrontendClientAllowed: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  cloudTasksDispatchVerified: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()
export type CanonicalProfessionalGpuCloudTaskOutboxLocalCapability = z.infer<
  typeof localCapabilitySchema
>

const localCapabilities = new WeakMap<
  object,
  CanonicalProfessionalGpuCloudTaskOutboxRpcClient
>()
const productionCapabilities = new WeakMap<
  object,
  CanonicalProfessionalGpuCloudTaskOutboxRpcClient
>()

const productionCapabilitySchema = z.object({
  schemaVersion: z.literal(
    'canonical-professional-gpu-cloud-task-outbox-production-capability-v1',
  ),
  purpose: z.literal('canonical_production_gpu_cloud_task_outbox_owner'),
  endpointOrigin: z.string().url().max(512),
  serverOnly: z.literal(true),
  browserOrFrontendClientAllowed: z.literal(false),
  sharedPostgresMultiReplicaDurabilityRequired: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()
export type CanonicalProfessionalGpuCloudTaskOutboxProductionCapability =
  z.infer<typeof productionCapabilitySchema>

export function createCanonicalProfessionalGpuCloudTaskOutboxLocalCapability(
  input: {
    readonly endpointOrigin: string
    readonly client: CanonicalProfessionalGpuCloudTaskOutboxRpcClient
  },
): CanonicalProfessionalGpuCloudTaskOutboxLocalCapability {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431'
    || !input.client || typeof input.client.rpc !== 'function') {
    invalid('local_outbox_capability_invalid')
  }
  const capability = Object.freeze(localCapabilitySchema.parse({
    schemaVersion:
      'canonical-professional-gpu-cloud-task-outbox-local-capability-v1',
    purpose: 'canonical_v3_loopback_cloud_task_outbox_proof',
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

export function createCanonicalProfessionalGpuCloudTaskOutboxLocalAdapter(
  input: {
    readonly client: CanonicalProfessionalGpuCloudTaskOutboxRpcClient
    readonly capability:
      CanonicalProfessionalGpuCloudTaskOutboxLocalCapability
  },
): CanonicalProfessionalGpuCloudTaskOutboxAdapter {
  if (localCapabilities.get(input.capability) !== input.client) {
    invalid('local_outbox_capability_not_bound_to_client')
  }
  localCapabilitySchema.parse(input.capability)
  const invoke = async (
    operation: CanonicalProfessionalGpuCloudTaskOutboxRequest['operation'],
    rawRequest: unknown,
  ) => {
    const request = assertCanonicalProfessionalGpuCloudTaskOutboxRequest(
      rawRequest,
      operation,
    )
    let rpcResult: CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult
    try {
      rpcResult = await input.client.rpc(
        CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RPC_REGISTRY[operation],
        {
          p_contract_version:
            CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
          p_request: request as unknown as Record<string, unknown>,
        },
      )
    } catch {
      invalid('local_outbox_rpc_transport_failed')
    }
    if (!rpcResult || typeof rpcResult !== 'object' || rpcResult.error) {
      invalid('local_outbox_rpc_rejected')
    }
    const data = Array.isArray(rpcResult.data)
      ? rpcResult.data.length === 1 ? rpcResult.data[0] : null
      : rpcResult.data
    const result = assertCanonicalProfessionalGpuCloudTaskOutboxResult(data)
    if (result.operation !== operation
      || result.requestId !== request.requestId
      || result.requestDigestSha256 !== request.requestDigestSha256
      || result.queueId !== request.queueId
      || result.runtimeRegion !== request.runtimeRegion) {
      invalid('local_outbox_rpc_lineage_changed')
    }
    return result
  }
  return Object.freeze({
    adapterId: 'canonical-v3-local-professional-gpu-cloud-task-outbox-v1',
    databaseBackend: 'postgres' as const,
    browserOrFrontendClientAllowed: false as const,
    automaticTransportRetryAllowed: false as const,
    sharedDurableTransactionPerformed: true as const,
    multiReplicaDurabilityVerified: false as const,
    cloudTasksDispatchVerified: false as const,
    productionAuthority: false as const,
    beginCreate: (request: unknown) => invoke('begin_create', request),
    recordCreateOutcome: (request: unknown) =>
      invoke('record_create_outcome', request),
  })
}

export function createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability(
  input: {
    readonly endpointOrigin: string
    readonly client: CanonicalProfessionalGpuCloudTaskOutboxRpcClient
  },
): CanonicalProfessionalGpuCloudTaskOutboxProductionCapability {
  let endpoint: URL
  try {
    endpoint = new URL(input.endpointOrigin)
  } catch {
    invalid('production_outbox_origin_invalid')
  }
  if (endpoint.protocol !== 'https:'
    || endpoint.username.length > 0
    || endpoint.password.length > 0
    || endpoint.search.length > 0
    || endpoint.hash.length > 0
    || endpoint.pathname !== '/'
    || !input.client
    || typeof input.client.rpc !== 'function') {
    invalid('production_outbox_capability_invalid')
  }
  const capability = Object.freeze(productionCapabilitySchema.parse({
    schemaVersion:
      'canonical-professional-gpu-cloud-task-outbox-production-capability-v1',
    purpose: 'canonical_production_gpu_cloud_task_outbox_owner',
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

export function createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter(
  input: {
    readonly client: CanonicalProfessionalGpuCloudTaskOutboxRpcClient
    readonly capability:
      CanonicalProfessionalGpuCloudTaskOutboxProductionCapability
  },
): CanonicalProfessionalGpuCloudTaskOutboxAdapter {
  if (productionCapabilities.get(input.capability) !== input.client) {
    invalid('production_outbox_capability_not_bound_to_client')
  }
  productionCapabilitySchema.parse(input.capability)
  const invoke = async (
    operation: CanonicalProfessionalGpuCloudTaskOutboxRequest['operation'],
    rawRequest: unknown,
  ) => {
    const request = assertCanonicalProfessionalGpuCloudTaskOutboxRequest(
      rawRequest,
      operation,
    )
    let rpcResult: CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult
    try {
      rpcResult = await input.client.rpc(
        CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RPC_REGISTRY[operation],
        {
          p_contract_version:
            CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_PORT_VERSION,
          p_request: request as unknown as Record<string, unknown>,
        },
      )
    } catch {
      invalid('production_outbox_rpc_transport_failed')
    }
    if (!rpcResult || typeof rpcResult !== 'object' || rpcResult.error) {
      invalid('production_outbox_rpc_rejected')
    }
    const data = Array.isArray(rpcResult.data)
      ? rpcResult.data.length === 1 ? rpcResult.data[0] : null
      : rpcResult.data
    const result = assertCanonicalProfessionalGpuCloudTaskOutboxResult(data)
    if (result.operation !== operation
      || result.requestId !== request.requestId
      || result.requestDigestSha256 !== request.requestDigestSha256
      || result.queueId !== request.queueId
      || result.runtimeRegion !== request.runtimeRegion) {
      invalid('production_outbox_rpc_lineage_changed')
    }
    return result
  }
  return Object.freeze({
    adapterId: 'canonical-professional-gpu-cloud-task-outbox-production-v1',
    databaseBackend: 'postgres' as const,
    browserOrFrontendClientAllowed: false as const,
    automaticTransportRetryAllowed: false as const,
    sharedDurableTransactionPerformed: true as const,
    multiReplicaDurabilityVerified: true,
    cloudTasksDispatchVerified: false,
    productionAuthority: false as const,
    beginCreate: (request: unknown) => invoke('begin_create', request),
    recordCreateOutcome: (request: unknown) =>
      invoke('record_create_outcome', request),
  })
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The professional GPU Cloud Task outbox is unavailable.',
    503,
    {
      reason,
      browserOrFrontendClientAllowed: false,
      automaticRetryStarted: false,
      productionAuthority: false,
    },
  )
}
