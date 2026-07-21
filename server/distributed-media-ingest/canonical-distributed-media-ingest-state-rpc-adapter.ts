import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedMediaIngestMutationIntegrity,
  assertCanonicalDistributedMediaIngestTimeoutIntegrity,
  canonicalDistributedMediaIngestCancellationRequestSchema,
  canonicalDistributedMediaIngestClaimRequestSchema,
  canonicalDistributedMediaIngestCompletionRequestSchema,
  canonicalDistributedMediaIngestEnqueueRequestSchema,
  canonicalDistributedMediaIngestFailureRequestSchema,
  canonicalDistributedMediaIngestIdempotencyKeyHash,
  canonicalDistributedMediaIngestMutationResponseSchema,
  canonicalDistributedMediaIngestProgressRequestSchema,
  canonicalDistributedMediaIngestRequestHash,
  canonicalDistributedMediaIngestTimeoutRequestSchema,
  canonicalDistributedMediaIngestTimeoutResponseSchema,
  createCanonicalDistributedMediaIngestUnverifiedDatabaseAdapterDescriptor,
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
  type CanonicalDistributedMediaIngestMutationResponse,
  type CanonicalDistributedMediaIngestPortResult,
  type CanonicalDistributedMediaIngestTimeoutResponse,
  type CanonicalDistributedMediaIngestTransactionAdapter,
} from './canonical-distributed-media-ingest-state-port'

export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY_VERSION =
  'canonical-distributed-media-ingest-rpc-registry-v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_CONTRACT_FIXTURE_VERSION =
  'canonical-distributed-media-ingest-rpc-contract-fixture-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const rpcFunctionName = z.string().regex(/^[a-z][a-z0-9_]{15,127}$/u)

export const canonicalDistributedMediaIngestRpcRegistrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY_VERSION),
  requestEnvelopeVersion: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION),
  targetDatabase: z.literal('postgres_via_server_only_supabase_rpc'),
  functions: z.object({
    enqueue: rpcFunctionName,
    claimAndStart: rpcFunctionName,
    recordProgress: rpcFunctionName,
    reconcileCompletion: rpcFunctionName,
    reconcileFailure: rpcFunctionName,
    requestCancellation: rpcFunctionName,
    finalizeExpiredAttempt: rpcFunctionName,
  }).strict(),
  oneRpcCallPerPortMethod: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  rawSqlAcceptedByAdapter: z.literal(false),
  callerSelectedRpcFunctionAllowed: z.literal(false),
  browserOrFrontendClientAllowed: z.literal(false),
  serviceRoleCredentialAcceptedAsMethodInput: z.literal(false),
  rawMediaPathSignedUrlOrUploadCredentialAccepted: z.literal(false),
  registryHash: sha256,
}).strict().superRefine((registry, context) => {
  const functionNames = Object.values(registry.functions)
  if (new Set(functionNames).size !== functionNames.length) {
    context.addIssue({ code: 'custom', message: 'Media-ingest RPC functions are duplicated.' })
  }
})

const registryPayload = {
  schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY_VERSION,
  requestEnvelopeVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    enqueue: 'reeditpro_enqueue_media_ingest_v1',
    claimAndStart: 'reeditpro_claim_and_start_media_ingest_v1',
    recordProgress: 'reeditpro_record_media_ingest_progress_v1',
    reconcileCompletion: 'reeditpro_reconcile_media_ingest_completion_v1',
    reconcileFailure: 'reeditpro_reconcile_media_ingest_failure_v1',
    requestCancellation: 'reeditpro_request_media_ingest_cancellation_v1',
    finalizeExpiredAttempt: 'reeditpro_finalize_expired_media_ingest_attempt_v1',
  },
  oneRpcCallPerPortMethod: true as const,
  automaticTransportRetryAllowed: false as const,
  rawSqlAcceptedByAdapter: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
  rawMediaPathSignedUrlOrUploadCredentialAccepted: false as const,
}

export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY = Object.freeze(
  canonicalDistributedMediaIngestRpcRegistrySchema.parse({
    ...registryPayload,
    registryHash: sha256AuthorityValue(registryPayload),
  }),
)

const rpcContractFixtureCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_CONTRACT_FIXTURE_VERSION,
  ),
  purpose: z.literal('injected_rpc_contract_fixture_only'),
  registryHash: z.literal(CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.registryHash),
  injectedClientOnly: z.literal(true),
  liveSupabaseOrPostgresCallAllowed: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  cloudDispatchOrGcsByteReadAllowed: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalDistributedMediaIngestRpcContractFixtureCapability = z.infer<
  typeof rpcContractFixtureCapabilitySchema
>

export interface CanonicalDistributedMediaIngestRpcClientResult {
  data: unknown
  error: unknown
}

export interface CanonicalDistributedMediaIngestRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version: typeof CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalDistributedMediaIngestRpcClientResult>
}

const rpcContractFixtureCapabilityBrands = new WeakSet<object>()
const rpcContractFixtureCapabilityClients = new WeakMap<
  object,
  CanonicalDistributedMediaIngestRpcClient
>()

export function createCanonicalDistributedMediaIngestRpcContractFixtureCapability(
  client: CanonicalDistributedMediaIngestRpcClient,
): CanonicalDistributedMediaIngestRpcContractFixtureCapability {
  if (!client || typeof client.rpc !== 'function') {
    throw atomicityError(
      'Media-ingest RPC contract fixture requires one injected server-only RPC client.',
    )
  }
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_CONTRACT_FIXTURE_VERSION,
    purpose: 'injected_rpc_contract_fixture_only' as const,
    registryHash: CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.registryHash,
    injectedClientOnly: true as const,
    liveSupabaseOrPostgresCallAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    cloudDispatchOrGcsByteReadAllowed: false as const,
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

export function createCanonicalDistributedMediaIngestRpcContractFixtureAdapter(input: {
  client: CanonicalDistributedMediaIngestRpcClient
  capability: CanonicalDistributedMediaIngestRpcContractFixtureCapability
}): CanonicalDistributedMediaIngestTransactionAdapter {
  assertRpcContractFixtureCapability(input.capability, input.client)
  const functions = CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.functions
  return Object.freeze({
    descriptor: createCanonicalDistributedMediaIngestUnverifiedDatabaseAdapterDescriptor(
      'canonical_supabase_media_ingest_rpc_contract_fixture_v1',
    ),
    enqueue: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'enqueue',
      functionName: functions.enqueue,
      requestSchema: canonicalDistributedMediaIngestEnqueueRequestSchema,
      rawInput,
    }),
    claimAndStart: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'claim_and_start',
      functionName: functions.claimAndStart,
      requestSchema: canonicalDistributedMediaIngestClaimRequestSchema,
      rawInput,
    }),
    recordProgress: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'record_progress',
      functionName: functions.recordProgress,
      requestSchema: canonicalDistributedMediaIngestProgressRequestSchema,
      rawInput,
    }),
    reconcileCompletion: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'reconcile_completion',
      functionName: functions.reconcileCompletion,
      requestSchema: canonicalDistributedMediaIngestCompletionRequestSchema,
      rawInput,
    }),
    reconcileFailure: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'reconcile_failure',
      functionName: functions.reconcileFailure,
      requestSchema: canonicalDistributedMediaIngestFailureRequestSchema,
      rawInput,
    }),
    requestCancellation: (rawInput: unknown) => invokeMutationRpc({
      client: input.client,
      operation: 'request_cancellation',
      functionName: functions.requestCancellation,
      requestSchema: canonicalDistributedMediaIngestCancellationRequestSchema,
      rawInput,
    }),
    finalizeExpiredAttempt: (rawInput: unknown) => invokeTimeoutRpc({
      client: input.client,
      functionName: functions.finalizeExpiredAttempt,
      rawInput,
    }),
  })
}

async function invokeMutationRpc<TRequest extends z.ZodType>(input: {
  client: CanonicalDistributedMediaIngestRpcClient
  operation: CanonicalDistributedMediaIngestMutationResponse['operation']
  functionName: string
  requestSchema: TRequest
  rawInput: unknown
}): Promise<CanonicalDistributedMediaIngestPortResult<
  CanonicalDistributedMediaIngestMutationResponse
>> {
  const request = parseAndVerifyRequest(input.operation, input.requestSchema, input.rawInput)
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  const result = parseRpcResult(
    input.functionName,
    canonicalDistributedMediaIngestMutationResponseSchema,
    rpcResult.data,
  )
  const response = assertCanonicalDistributedMediaIngestMutationIntegrity(result.response)
  assertResponseLineage(input.operation, request, response)
  return { ...result, response }
}

async function invokeTimeoutRpc(input: {
  client: CanonicalDistributedMediaIngestRpcClient
  functionName: string
  rawInput: unknown
}): Promise<CanonicalDistributedMediaIngestPortResult<
  CanonicalDistributedMediaIngestTimeoutResponse
>> {
  const request = parseAndVerifyRequest(
    'finalize_expired_attempt',
    canonicalDistributedMediaIngestTimeoutRequestSchema,
    input.rawInput,
  )
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  const result = parseRpcResult(
    input.functionName,
    canonicalDistributedMediaIngestTimeoutResponseSchema,
    rpcResult.data,
  )
  const response = assertCanonicalDistributedMediaIngestTimeoutIntegrity(result.response)
  const expectedIdempotencyKeyHash = canonicalDistributedMediaIngestIdempotencyKeyHash(
    request.idempotencyKey,
  )
  if (
    response.jobId !== request.jobId ||
    response.requestHash !== request.requestHash ||
    response.idempotencyKeyHash !== expectedIdempotencyKeyHash
  ) throw atomicityError('Media-ingest timeout RPC changed request lineage.')
  return { ...result, response }
}

async function invokeExactlyOnce(
  client: CanonicalDistributedMediaIngestRpcClient,
  functionName: string,
  request: Record<string, unknown>,
): Promise<CanonicalDistributedMediaIngestRpcClientResult> {
  let result: CanonicalDistributedMediaIngestRpcClientResult
  try {
    result = await client.rpc(functionName, {
      p_contract_version: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
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
  operation: CanonicalDistributedMediaIngestMutationResponse['operation'] |
    'finalize_expired_attempt',
  schema: TRequest,
  rawInput: unknown,
): z.infer<TRequest> & Record<string, unknown> & {
  jobId: string
  idempotencyKey: string
  requestHash: string
} {
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Media-ingest RPC request is invalid.',
      400,
      { callerSelectedRpcOrStateFieldsAllowed: false },
    )
  }
  const request = parsed.data as Record<string, unknown>
  const requestHash = request.requestHash
  if (
    typeof requestHash !== 'string' ||
    requestHash !== canonicalDistributedMediaIngestRequestHash(operation, request)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Media-ingest RPC request hash is invalid.',
      409,
    )
  }
  return parsed.data as z.infer<TRequest> & Record<string, unknown> & {
    jobId: string
    idempotencyKey: string
    requestHash: string
  }
}

function parseRpcResult<TResponse extends z.ZodType>(
  functionName: string,
  responseSchema: TResponse,
  data: unknown,
): CanonicalDistributedMediaIngestPortResult<z.infer<TResponse>> {
  const normalized = normalizeRpcData(data)
  const parsed = z.object({
    idempotencyStatus: z.enum(['inserted', 'exact_replay']),
    response: responseSchema,
  }).strict().safeParse(normalized)
  if (!parsed.success) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Media-ingest RPC returned an invalid response contract.',
      503,
      {
        rpcFunctionId: functionName,
        issueCount: parsed.error.issues.length,
        automaticRetryStarted: false,
      },
    )
  }
  return parsed.data as CanonicalDistributedMediaIngestPortResult<z.infer<TResponse>>
}

function normalizeRpcData(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length !== 1) {
    throw atomicityError('Media-ingest RPC returned an invalid result cardinality.')
  }
  return data[0]
}

function assertResponseLineage(
  operation: CanonicalDistributedMediaIngestMutationResponse['operation'],
  request: { jobId: string; idempotencyKey: string; requestHash: string },
  response: CanonicalDistributedMediaIngestMutationResponse,
): void {
  if (
    response.operation !== operation ||
    response.job.jobId !== request.jobId ||
    response.transaction.requestHash !== request.requestHash ||
    response.transaction.idempotencyKeyHash !==
      canonicalDistributedMediaIngestIdempotencyKeyHash(request.idempotencyKey)
  ) throw atomicityError('Media-ingest RPC changed request lineage.')
}

function assertRpcContractFixtureCapability(
  capability: CanonicalDistributedMediaIngestRpcContractFixtureCapability,
  client: CanonicalDistributedMediaIngestRpcClient,
): void {
  if (
    !rpcContractFixtureCapabilityBrands.has(capability) ||
    rpcContractFixtureCapabilityClients.get(capability) !== client
  ) {
    throw atomicityError(
      'Media-ingest RPC adapter requires its process-local contract-fixture capability.',
    )
  }
  const parsed = rpcContractFixtureCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Media-ingest RPC contract-fixture capability checksum is invalid.')
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
    'Media-ingest RPC transaction did not return validated atomic evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_distributed_media_ingest_rpc_error_v1',
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

function atomicityError(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503, {
    requiredGate: 'reviewed_distributed_media_ingest_database_adapter_activation_evidence',
    automaticRetryStarted: false,
  })
}
