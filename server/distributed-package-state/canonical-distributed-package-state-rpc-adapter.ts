import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedMutationResponseIntegrity,
  canonicalDistributedAcceptControllerRequestSchema,
  canonicalDistributedAcceptWorkerAndStartRequestSchema,
  canonicalDistributedClaimAndEnqueueRequestSchema,
  canonicalDistributedCompletionRequestSchema,
  canonicalDistributedFailureRequestSchema,
  canonicalDistributedHeartbeatRequestSchema,
  canonicalDistributedPackageMutationResponseSchema,
  canonicalDistributedPackageStateRequestHash,
  canonicalDistributedPackageTimeoutBatchResponseSchema,
  canonicalDistributedPortResultSchema,
  canonicalDistributedTimeoutSweepRequestSchema,
  createCanonicalDistributedPackageStateUnverifiedDatabaseAdapterDescriptor,
  CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION,
  type CanonicalDistributedPackageMutationResponse,
  type CanonicalDistributedPackageStateTransactionPort,
  type CanonicalDistributedPackageTimeoutBatchResponse,
  type CanonicalDistributedPortResult,
} from './canonical-distributed-package-state-port'

export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY_VERSION =
  'canonical-distributed-package-state-rpc-registry-v1' as const
export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_CONTRACT_FIXTURE_VERSION =
  'canonical-distributed-package-state-rpc-contract-fixture-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const rpcFunctionName = z.string().regex(/^[a-z][a-z0-9_]{15,127}$/u)

export const canonicalDistributedPackageStateRpcRegistrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY_VERSION),
  requestEnvelopeVersion: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION),
  targetDatabase: z.literal('postgres_via_server_only_supabase_rpc'),
  functions: z.object({
    claimAndEnqueue: rpcFunctionName,
    acceptController: rpcFunctionName,
    acceptWorkerAndStart: rpcFunctionName,
    heartbeatWorker: rpcFunctionName,
    reconcileCompletion: rpcFunctionName,
    reconcileFailure: rpcFunctionName,
    finalizeExpiredTimeouts: rpcFunctionName,
  }).strict(),
  oneRpcCallPerPortMethod: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  rawSqlAcceptedByAdapter: z.literal(false),
  callerSelectedRpcFunctionAllowed: z.literal(false),
  browserOrFrontendClientAllowed: z.literal(false),
  serviceRoleCredentialAcceptedAsMethodInput: z.literal(false),
  registryHash: sha256,
}).strict().superRefine((registry, context) => {
  const functionNames = Object.values(registry.functions)
  if (new Set(functionNames).size !== functionNames.length) {
    context.addIssue({ code: 'custom', message: 'Package-state RPC functions are duplicated.' })
  }
})

const registryPayload = {
  schemaVersion: CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY_VERSION,
  requestEnvelopeVersion: CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    claimAndEnqueue: 'reeditpro_claim_and_enqueue_package_attempt_v1',
    acceptController: 'reeditpro_accept_package_controller_v1',
    acceptWorkerAndStart: 'reeditpro_accept_package_worker_and_start_v1',
    heartbeatWorker: 'reeditpro_heartbeat_package_worker_v1',
    reconcileCompletion: 'reeditpro_reconcile_package_completion_v1',
    reconcileFailure: 'reeditpro_reconcile_package_failure_v1',
    finalizeExpiredTimeouts: 'reeditpro_finalize_expired_package_attempts_v1',
  },
  oneRpcCallPerPortMethod: true as const,
  automaticTransportRetryAllowed: false as const,
  rawSqlAcceptedByAdapter: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
}

export const CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY = Object.freeze(
  canonicalDistributedPackageStateRpcRegistrySchema.parse({
    ...registryPayload,
    registryHash: sha256AuthorityValue(registryPayload),
  }),
)

const rpcContractFixtureCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_CONTRACT_FIXTURE_VERSION,
  ),
  purpose: z.literal('injected_rpc_contract_fixture_only'),
  registryHash: z.literal(CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY.registryHash),
  injectedClientOnly: z.literal(true),
  liveSupabaseOrPostgresCallAllowed: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalDistributedPackageStateRpcContractFixtureCapability = z.infer<
  typeof rpcContractFixtureCapabilitySchema
>

const rpcContractFixtureCapabilityBrands = new WeakSet<object>()
const rpcContractFixtureCapabilityClients = new WeakMap<
  object,
  CanonicalDistributedPackageStateRpcClient
>()

export function createCanonicalDistributedPackageStateRpcContractFixtureCapability(
  client: CanonicalDistributedPackageStateRpcClient,
):
CanonicalDistributedPackageStateRpcContractFixtureCapability {
  if (!client || typeof client.rpc !== 'function') {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Package-state RPC contract fixture requires one injected server-only RPC client.',
      503,
    )
  }
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_CONTRACT_FIXTURE_VERSION,
    purpose: 'injected_rpc_contract_fixture_only' as const,
    registryHash: CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY.registryHash,
    injectedClientOnly: true as const,
    liveSupabaseOrPostgresCallAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
  }
  const capability = Object.freeze(rpcContractFixtureCapabilitySchema.parse({
    ...payload,
    capabilityHash: sha256AuthorityValue(payload),
  }))
  rpcContractFixtureCapabilityBrands.add(capability)
  rpcContractFixtureCapabilityClients.set(capability, client)
  return capability
}

export interface CanonicalDistributedPackageStateRpcClientResult {
  data: unknown
  error: unknown
}

export interface CanonicalDistributedPackageStateRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version: typeof CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalDistributedPackageStateRpcClientResult>
}

export function createCanonicalDistributedPackageStateRpcContractFixtureAdapter(input: {
  client: CanonicalDistributedPackageStateRpcClient
  capability: CanonicalDistributedPackageStateRpcContractFixtureCapability
}): CanonicalDistributedPackageStateTransactionPort {
  assertRpcContractFixtureCapability(input.capability, input.client)
  const functions = CANONICAL_DISTRIBUTED_PACKAGE_STATE_RPC_REGISTRY.functions
  return Object.freeze({
    descriptor: createCanonicalDistributedPackageStateUnverifiedDatabaseAdapterDescriptor(
      'canonical-supabase-package-state-rpc-contract-fixture-v1',
    ),
    claimAndEnqueue: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'claim_and_enqueue',
      functionName: functions.claimAndEnqueue,
      requestSchema: canonicalDistributedClaimAndEnqueueRequestSchema,
      rawInput,
    }),
    acceptController: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'accept_controller',
      functionName: functions.acceptController,
      requestSchema: canonicalDistributedAcceptControllerRequestSchema,
      rawInput,
    }),
    acceptWorkerAndStart: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'accept_worker_and_start',
      functionName: functions.acceptWorkerAndStart,
      requestSchema: canonicalDistributedAcceptWorkerAndStartRequestSchema,
      rawInput,
    }),
    heartbeatWorker: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'heartbeat_worker',
      functionName: functions.heartbeatWorker,
      requestSchema: canonicalDistributedHeartbeatRequestSchema,
      rawInput,
    }),
    reconcileCompletion: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'reconcile_completion',
      functionName: functions.reconcileCompletion,
      requestSchema: canonicalDistributedCompletionRequestSchema,
      rawInput,
    }),
    reconcileFailure: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'reconcile_failure',
      functionName: functions.reconcileFailure,
      requestSchema: canonicalDistributedFailureRequestSchema,
      rawInput,
    }),
    finalizeExpiredTimeouts: (rawInput: unknown) => invokeTimeoutRpc({
      client: input.client,
      functionName: functions.finalizeExpiredTimeouts,
      rawInput,
    }),
  })
}

async function invokeMutationRpc<TRequest extends z.ZodType>(input: {
  client: CanonicalDistributedPackageStateRpcClient
  operation: CanonicalDistributedPackageMutationResponse['operation']
  functionName: string
  requestSchema: TRequest
  rawInput: unknown
}): Promise<CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>> {
  const request = parseAndVerifyRequest(input.operation, input.requestSchema, input.rawInput)
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  const result = parseRpcResult(
    input.functionName,
    canonicalDistributedPackageMutationResponseSchema,
    rpcResult.data,
  )
  assertCanonicalDistributedMutationResponseIntegrity(result.response)
  return result
}

async function invokeTimeoutRpc(input: {
  client: CanonicalDistributedPackageStateRpcClient
  functionName: string
  rawInput: unknown
}): Promise<CanonicalDistributedPortResult<CanonicalDistributedPackageTimeoutBatchResponse>> {
  const request = parseAndVerifyRequest(
    'finalize_expired_timeouts',
    canonicalDistributedTimeoutSweepRequestSchema,
    input.rawInput,
  )
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  return parseRpcResult(
    input.functionName,
    canonicalDistributedPackageTimeoutBatchResponseSchema,
    rpcResult.data,
  )
}

async function invokeExactlyOnce(
  client: CanonicalDistributedPackageStateRpcClient,
  functionName: string,
  request: Record<string, unknown>,
): Promise<CanonicalDistributedPackageStateRpcClientResult> {
  let result: CanonicalDistributedPackageStateRpcClientResult
  try {
    result = await client.rpc(functionName, {
      p_contract_version: CANONICAL_DISTRIBUTED_PACKAGE_STATE_PORT_VERSION,
      p_request: request,
    })
  } catch (error) {
    throw sanitizedRpcError(functionName, error)
  }
  if (!result || typeof result !== 'object' || result.error) {
    throw sanitizedRpcError(functionName, result?.error)
  }
  return result
}

function parseAndVerifyRequest<TRequest extends z.ZodType>(
  operation: CanonicalDistributedPackageMutationResponse['operation'] |
    'finalize_expired_timeouts',
  schema: TRequest,
  rawInput: unknown,
): z.infer<TRequest> & Record<string, unknown> {
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Package-state RPC request is invalid.',
      400,
      { callerSelectedRpcOrStateFieldsAllowed: false },
    )
  }
  const request = parsed.data as Record<string, unknown>
  const {
    idempotencyKey: _idempotencyKey,
    requestHash,
    ...requestPayload
  } = request
  void _idempotencyKey
  if (
    typeof requestHash !== 'string' ||
    requestHash !== canonicalDistributedPackageStateRequestHash({
      operation,
      request: requestPayload,
    })
  ) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_MISMATCH',
      'Package-state RPC request hash is invalid.',
      409,
    )
  }
  return parsed.data as z.infer<TRequest> & Record<string, unknown>
}

function normalizeRpcData(data: unknown): unknown {
  if (Array.isArray(data)) {
    if (data.length !== 1) {
      throw new ApiError(
        'IDEMPOTENCY_ATOMICITY_REQUIRED',
        'Package-state RPC returned an invalid result cardinality.',
        503,
      )
    }
    return data[0]
  }
  return data
}

function parseRpcResult<TResponse extends z.ZodType>(
  functionName: string,
  responseSchema: TResponse,
  data: unknown,
): CanonicalDistributedPortResult<z.infer<TResponse>> {
  const normalized = normalizeRpcData(data)
  const parsed = canonicalDistributedPortResultSchema(responseSchema).safeParse(normalized)
  if (!parsed.success) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Package-state RPC returned an invalid response contract.',
      503,
      {
        rpcFunctionId: functionName,
        issueCount: parsed.error.issues.length,
        automaticRetryStarted: false,
      },
    )
  }
  return parsed.data as CanonicalDistributedPortResult<z.infer<TResponse>>
}

function assertRpcContractFixtureCapability(
  capability: CanonicalDistributedPackageStateRpcContractFixtureCapability,
  client: CanonicalDistributedPackageStateRpcClient,
): void {
  if (
    !rpcContractFixtureCapabilityBrands.has(capability) ||
    rpcContractFixtureCapabilityClients.get(capability) !== client
  ) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Package-state RPC adapter requires its process-local contract-fixture capability.',
      503,
      { requiredGate: 'reviewed_database_adapter_activation_evidence' },
    )
  }
  const parsed = rpcContractFixtureCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Package-state RPC contract-fixture capability checksum is invalid.',
      503,
    )
  }
}

function sanitizedRpcError(functionName: string, error: unknown): ApiError {
  const safeFingerprintInput = error && typeof error === 'object'
    ? {
        code: cleanScalar((error as Record<string, unknown>).code),
        status: cleanScalar((error as Record<string, unknown>).status),
        kind: 'structured_rpc_error',
      }
    : { code: null, status: null, kind: typeof error }
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Package-state RPC transaction did not return validated atomic evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_distributed_package_state_rpc_error_v1',
        functionName,
        ...safeFingerprintInput,
      }),
      automaticRetryStarted: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return /^[A-Za-z0-9_.:-]{1,80}$/u.test(cleaned) ? cleaned : null
}
