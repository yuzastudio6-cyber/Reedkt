import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedPrePlanStudyMutationResponseIntegrity,
  assertCanonicalDistributedPrePlanStudyRecoveryResponseIntegrity,
  canonicalDistributedPrePlanStudyClaimRequestSchema,
  canonicalDistributedPrePlanStudyCompletionRequestSchema,
  canonicalDistributedPrePlanStudyControlRequestSchema,
  canonicalDistributedPrePlanStudyEnqueueRequestSchema,
  canonicalDistributedPrePlanStudyFailureRequestSchema,
  canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
  canonicalDistributedPrePlanStudyIdempotencyKeyHash,
  canonicalDistributedPrePlanStudyLeaseCredentialHash,
  canonicalDistributedPrePlanStudyLeaseCredentialSchema,
  canonicalDistributedPrePlanStudyMutationResponseSchema,
  canonicalDistributedPrePlanStudyRecoveryRequestSchema,
  canonicalDistributedPrePlanStudyRecoveryResponseSchema,
  canonicalDistributedPrePlanStudyRequestHash,
  createCanonicalDistributedPrePlanStudyLocalPostgresDescriptor,
  createCanonicalDistributedPrePlanStudyUnverifiedDatabaseAdapterDescriptor,
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
  type CanonicalDistributedPrePlanStudyMutationResponse,
  type CanonicalDistributedPrePlanStudyPortResult,
  type CanonicalDistributedPrePlanStudyRecoveryResponse,
  type CanonicalDistributedPrePlanStudyTransactionAdapter,
} from './canonical-distributed-pre-plan-study-state-port'

export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY_VERSION =
  'canonical-distributed-pre-plan-study-rpc-registry-v1' as const
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_CONTRACT_FIXTURE_VERSION =
  'canonical-distributed-pre-plan-study-rpc-contract-fixture-v1' as const
export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_LOCAL_POSTGRES_CAPABILITY_VERSION =
  'canonical-distributed-pre-plan-study-local-postgres-capability-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const rpcFunctionName = z.string().regex(/^[a-z][a-z0-9_]{15,127}$/u)

export const canonicalDistributedPrePlanStudyRpcRegistrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY_VERSION),
  requestEnvelopeVersion: z.literal(CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION),
  targetDatabase: z.literal('postgres_via_server_only_supabase_rpc'),
  functions: z.object({
    enqueue: rpcFunctionName,
    claimAndStart: rpcFunctionName,
    heartbeatAndCheckpoint: rpcFunctionName,
    complete: rpcFunctionName,
    fail: rpcFunctionName,
    control: rpcFunctionName,
    recoverExpiredLease: rpcFunctionName,
  }).strict(),
  oneRpcCallPerPortMethod: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  rawSqlAcceptedByAdapter: z.literal(false),
  callerSelectedRpcFunctionAllowed: z.literal(false),
  browserOrFrontendClientAllowed: z.literal(false),
  serviceRoleCredentialAcceptedAsMethodInput: z.literal(false),
  rawMediaPathSignedUrlProviderCredentialOrLocalPathAccepted: z.literal(false),
  customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded:
    z.literal(false),
  registryHash: sha256,
}).strict().superRefine((registry, context) => {
  const functionNames = Object.values(registry.functions)
  if (new Set(functionNames).size !== functionNames.length) {
    context.addIssue({
      code: 'custom',
      message: 'Pre-plan study RPC functions are duplicated.',
    })
  }
})

const registryPayload = {
  schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY_VERSION,
  requestEnvelopeVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    enqueue: 'reeditpro_enqueue_pre_plan_study_v1',
    claimAndStart: 'reeditpro_claim_and_start_pre_plan_study_v1',
    heartbeatAndCheckpoint: 'reeditpro_heartbeat_pre_plan_study_v1',
    complete: 'reeditpro_complete_pre_plan_study_v1',
    fail: 'reeditpro_fail_pre_plan_study_v1',
    control: 'reeditpro_control_pre_plan_study_v1',
    recoverExpiredLease: 'reeditpro_recover_expired_pre_plan_study_lease_v1',
  },
  oneRpcCallPerPortMethod: true as const,
  automaticTransportRetryAllowed: false as const,
  rawSqlAcceptedByAdapter: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
  rawMediaPathSignedUrlProviderCredentialOrLocalPathAccepted: false as const,
  customerPriceCreditsServiceFeeWalletBillingOrSettlementAuthorityIncluded:
    false as const,
}

export const CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY = Object.freeze(
  canonicalDistributedPrePlanStudyRpcRegistrySchema.parse({
    ...registryPayload,
    registryHash: sha256AuthorityValue(registryPayload),
  }),
)

const rpcContractFixtureCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_CONTRACT_FIXTURE_VERSION,
  ),
  purpose: z.literal('injected_rpc_contract_fixture_only'),
  registryHash: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.registryHash,
  ),
  injectedClientOnly: z.literal(true),
  liveSupabaseOrPostgresCallAllowed: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  workerProviderCloudOrPrivateObjectCallAllowed: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalDistributedPrePlanStudyRpcContractFixtureCapability = z.infer<
  typeof rpcContractFixtureCapabilitySchema
>

export interface CanonicalDistributedPrePlanStudyRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface CanonicalDistributedPrePlanStudyRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version: typeof CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalDistributedPrePlanStudyRpcClientResult>
}

const rpcContractFixtureCapabilityBrands = new WeakSet<object>()
const rpcContractFixtureCapabilityClients = new WeakMap<
  object,
  CanonicalDistributedPrePlanStudyRpcClient
>()
const localPostgresCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_LOCAL_POSTGRES_CAPABILITY_VERSION,
  ),
  purpose: z.literal('canonical_v3_loopback_postgres_reset_and_rls_proof'),
  endpointOrigin: z.literal('http://127.0.0.1:57431'),
  registryHash: z.literal(
    CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.registryHash,
  ),
  loopbackOnly: z.literal(true),
  localPostgresCallAllowed: z.literal(true),
  remoteDatabaseMutationAllowed: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  authenticatedWorkerDispatchVerified: z.literal(false),
  livePrivateObjectReadVerified: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalDistributedPrePlanStudyLocalPostgresCapability = z.infer<
  typeof localPostgresCapabilitySchema
>

const localPostgresCapabilityBrands = new WeakSet<object>()
const localPostgresCapabilityClients = new WeakMap<
  object,
  CanonicalDistributedPrePlanStudyRpcClient
>()

export function createCanonicalDistributedPrePlanStudyRpcContractFixtureCapability(
  client: CanonicalDistributedPrePlanStudyRpcClient,
): CanonicalDistributedPrePlanStudyRpcContractFixtureCapability {
  if (!client || typeof client.rpc !== 'function') {
    throw atomicityError(
      'Pre-plan study RPC contract fixture requires one injected server-only RPC client.',
    )
  }
  const payload = {
    schemaVersion: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_CONTRACT_FIXTURE_VERSION,
    purpose: 'injected_rpc_contract_fixture_only' as const,
    registryHash: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.registryHash,
    injectedClientOnly: true as const,
    liveSupabaseOrPostgresCallAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    workerProviderCloudOrPrivateObjectCallAllowed: false as const,
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

export function createCanonicalDistributedPrePlanStudyRpcContractFixtureAdapter(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly capability: CanonicalDistributedPrePlanStudyRpcContractFixtureCapability
}): CanonicalDistributedPrePlanStudyTransactionAdapter {
  assertRpcContractFixtureCapability(input.capability, input.client)
  return createRpcAdapter(
    input.client,
    createCanonicalDistributedPrePlanStudyUnverifiedDatabaseAdapterDescriptor(
      'canonical_supabase_pre_plan_study_rpc_contract_fixture_v1',
    ),
  )
}

export function createCanonicalDistributedPrePlanStudyLocalPostgresCapability(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly endpointOrigin: string
}): CanonicalDistributedPrePlanStudyLocalPostgresCapability {
  if (!input.client || typeof input.client.rpc !== 'function') {
    throw atomicityError(
      'Local pre-plan study Postgres capability requires one injected server-only RPC client.',
    )
  }
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') {
    throw atomicityError('Local pre-plan study Postgres capability is loopback-only.')
  }
  const payload = {
    schemaVersion:
      CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_LOCAL_POSTGRES_CAPABILITY_VERSION,
    purpose: 'canonical_v3_loopback_postgres_reset_and_rls_proof' as const,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    registryHash: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.registryHash,
    loopbackOnly: true as const,
    localPostgresCallAllowed: true as const,
    remoteDatabaseMutationAllowed: false as const,
    multiReplicaDurabilityVerified: false as const,
    authenticatedWorkerDispatchVerified: false as const,
    livePrivateObjectReadVerified: false as const,
    productionAuthority: false as const,
  }
  const capability = Object.freeze(localPostgresCapabilitySchema.parse({
    ...payload,
    capabilityHash: sha256AuthorityValue(payload),
  }))
  localPostgresCapabilityBrands.add(capability)
  localPostgresCapabilityClients.set(capability, input.client)
  return capability
}

export function createCanonicalDistributedPrePlanStudyLocalPostgresAdapter(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly capability: CanonicalDistributedPrePlanStudyLocalPostgresCapability
}): CanonicalDistributedPrePlanStudyTransactionAdapter {
  assertLocalPostgresCapability(input.capability, input.client)
  return createRpcAdapter(
    input.client,
    createCanonicalDistributedPrePlanStudyLocalPostgresDescriptor(),
  )
}

function createRpcAdapter(
  client: CanonicalDistributedPrePlanStudyRpcClient,
  descriptor: CanonicalDistributedPrePlanStudyTransactionAdapter['descriptor'],
): CanonicalDistributedPrePlanStudyTransactionAdapter {
  const functions = CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_RPC_REGISTRY.functions
  return Object.freeze({
    descriptor,
    enqueue: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'enqueue',
      functionName: functions.enqueue,
      requestSchema: canonicalDistributedPrePlanStudyEnqueueRequestSchema,
      rawInput,
    }),
    claimAndStart: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'claim_and_start',
      functionName: functions.claimAndStart,
      requestSchema: canonicalDistributedPrePlanStudyClaimRequestSchema,
      rawInput,
    }),
    heartbeatAndCheckpoint: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'heartbeat_and_checkpoint',
      functionName: functions.heartbeatAndCheckpoint,
      requestSchema: canonicalDistributedPrePlanStudyHeartbeatRequestSchema,
      rawInput,
    }),
    complete: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'complete',
      functionName: functions.complete,
      requestSchema: canonicalDistributedPrePlanStudyCompletionRequestSchema,
      rawInput,
    }),
    fail: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'fail',
      functionName: functions.fail,
      requestSchema: canonicalDistributedPrePlanStudyFailureRequestSchema,
      rawInput,
    }),
    control: (rawInput: unknown) => invokeMutationRpc({
      client,
      operation: 'control',
      functionName: functions.control,
      requestSchema: canonicalDistributedPrePlanStudyControlRequestSchema,
      rawInput,
    }),
    recoverExpiredLease: (rawInput: unknown) => invokeRecoveryRpc({
      client,
      functionName: functions.recoverExpiredLease,
      rawInput,
    }),
  })
}

async function invokeMutationRpc<TRequest extends z.ZodType>(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly operation: CanonicalDistributedPrePlanStudyMutationResponse['operation']
  readonly functionName: string
  readonly requestSchema: TRequest
  readonly rawInput: unknown
}): Promise<CanonicalDistributedPrePlanStudyPortResult<
  CanonicalDistributedPrePlanStudyMutationResponse
>> {
  const request = parseAndVerifyRequest(
    input.operation,
    input.requestSchema,
    input.rawInput,
  )
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  const result = parseMutationRpcResult(input.functionName, rpcResult.data)
  const response = assertCanonicalDistributedPrePlanStudyMutationResponseIntegrity(
    result.response,
  )
  assertMutationResponseLineage(input.operation, request, response)
  assertTransientLease(input.operation, result, response)
  return { ...result, response }
}

async function invokeRecoveryRpc(input: {
  readonly client: CanonicalDistributedPrePlanStudyRpcClient
  readonly functionName: string
  readonly rawInput: unknown
}): Promise<CanonicalDistributedPrePlanStudyPortResult<
  CanonicalDistributedPrePlanStudyRecoveryResponse
>> {
  const request = parseAndVerifyRequest(
    'recover_expired_lease',
    canonicalDistributedPrePlanStudyRecoveryRequestSchema,
    input.rawInput,
  )
  const rpcResult = await invokeExactlyOnce(input.client, input.functionName, request)
  const result = parseRecoveryRpcResult(input.functionName, rpcResult.data)
  const response = assertCanonicalDistributedPrePlanStudyRecoveryResponseIntegrity(
    result.response,
  )
  assertRecoveryResponseLineage(request, response)
  return { ...result, response }
}

async function invokeExactlyOnce(
  client: CanonicalDistributedPrePlanStudyRpcClient,
  functionName: string,
  request: Record<string, unknown>,
): Promise<CanonicalDistributedPrePlanStudyRpcClientResult> {
  let result: CanonicalDistributedPrePlanStudyRpcClientResult
  try {
    result = await client.rpc(functionName, {
      p_contract_version: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
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
  operation: CanonicalDistributedPrePlanStudyMutationResponse['operation']
    | 'recover_expired_lease',
  schema: TRequest,
  rawInput: unknown,
): z.infer<TRequest> & Record<string, unknown> & {
  runId: string
  studyIdentityHash: string
  idempotencyKey: string
  requestHash: string
} {
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Pre-plan study RPC request is invalid.',
      400,
      { callerSelectedRpcOrStateFieldsAllowed: false },
    )
  }
  const request = parsed.data as Record<string, unknown>
  if (
    typeof request.requestHash !== 'string'
    || request.requestHash !== canonicalDistributedPrePlanStudyRequestHash(
      operation,
      request,
    )
  ) {
    throw new ApiError(
      'IDEMPOTENCY_KEY_MISMATCH',
      'Pre-plan study RPC request hash is invalid.',
      409,
    )
  }
  return parsed.data as z.infer<TRequest> & Record<string, unknown> & {
    runId: string
    studyIdentityHash: string
    idempotencyKey: string
    requestHash: string
  }
}

const mutationRpcResultSchema = z.object({
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  response: canonicalDistributedPrePlanStudyMutationResponseSchema,
  transientLeaseCredential: canonicalDistributedPrePlanStudyLeaseCredentialSchema.nullable(),
}).strict()

const recoveryRpcResultSchema = z.object({
  idempotencyStatus: z.enum(['inserted', 'exact_replay']),
  response: canonicalDistributedPrePlanStudyRecoveryResponseSchema,
  transientLeaseCredential: z.null(),
}).strict()

function parseMutationRpcResult(
  functionName: string,
  data: unknown,
): z.infer<typeof mutationRpcResultSchema> {
  const parsed = mutationRpcResultSchema.safeParse(normalizeRpcData(data))
  if (!parsed.success) throw invalidRpcResponse(functionName, parsed.error.issues.length)
  return parsed.data
}

function parseRecoveryRpcResult(
  functionName: string,
  data: unknown,
): z.infer<typeof recoveryRpcResultSchema> {
  const parsed = recoveryRpcResultSchema.safeParse(normalizeRpcData(data))
  if (!parsed.success) throw invalidRpcResponse(functionName, parsed.error.issues.length)
  return parsed.data
}

function normalizeRpcData(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length !== 1) {
    throw atomicityError('Pre-plan study RPC returned an invalid result cardinality.')
  }
  return data[0]
}

function assertMutationResponseLineage(
  operation: CanonicalDistributedPrePlanStudyMutationResponse['operation'],
  request: {
    runId: string
    studyIdentityHash: string
    idempotencyKey: string
    requestHash: string
  },
  response: CanonicalDistributedPrePlanStudyMutationResponse,
): void {
  if (
    response.operation !== operation
    || response.run.runId !== request.runId
    || response.run.studyIdentityHash !== request.studyIdentityHash
    || response.transaction.requestHash !== request.requestHash
    || response.transaction.idempotencyKeyHash !==
      canonicalDistributedPrePlanStudyIdempotencyKeyHash(request.idempotencyKey)
  ) throw atomicityError('Pre-plan study RPC changed request or tenant lineage.')
}

function assertRecoveryResponseLineage(
  request: {
    runId: string
    studyIdentityHash: string
    idempotencyKey: string
    requestHash: string
  },
  response: CanonicalDistributedPrePlanStudyRecoveryResponse,
): void {
  if (
    response.runId !== request.runId
    || response.studyIdentityHash !== request.studyIdentityHash
    || response.requestHash !== request.requestHash
    || response.idempotencyKeyHash !==
      canonicalDistributedPrePlanStudyIdempotencyKeyHash(request.idempotencyKey)
  ) throw atomicityError('Pre-plan study recovery RPC changed request or tenant lineage.')
}

function assertTransientLease(
  operation: CanonicalDistributedPrePlanStudyMutationResponse['operation'],
  result: z.infer<typeof mutationRpcResultSchema>,
  response: CanonicalDistributedPrePlanStudyMutationResponse,
): void {
  if (operation !== 'claim_and_start') {
    if (result.transientLeaseCredential !== null) {
      throw atomicityError('Only a pre-plan study claim may return a lease credential.')
    }
    return
  }
  const credentialHash = result.transientLeaseCredential
    ? canonicalDistributedPrePlanStudyLeaseCredentialHash(
      result.transientLeaseCredential,
    )
    : null
  if (
    !response.attempt
    || credentialHash !== response.attempt.attemptStart.leaseCredentialHashSha256
  ) throw atomicityError('Pre-plan study claim returned the wrong lease credential.')
}

function assertRpcContractFixtureCapability(
  capability: CanonicalDistributedPrePlanStudyRpcContractFixtureCapability,
  client: CanonicalDistributedPrePlanStudyRpcClient,
): void {
  if (
    !rpcContractFixtureCapabilityBrands.has(capability)
    || rpcContractFixtureCapabilityClients.get(capability) !== client
  ) {
    throw atomicityError(
      'Pre-plan study RPC adapter requires its process-local contract-fixture capability.',
    )
  }
  const parsed = rpcContractFixtureCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Pre-plan study RPC capability checksum is invalid.')
  }
}

function assertLocalPostgresCapability(
  capability: CanonicalDistributedPrePlanStudyLocalPostgresCapability,
  client: CanonicalDistributedPrePlanStudyRpcClient,
): void {
  if (
    !localPostgresCapabilityBrands.has(capability)
    || localPostgresCapabilityClients.get(capability) !== client
  ) {
    throw atomicityError(
      'Local pre-plan study adapter requires its exact process-local Postgres capability.',
    )
  }
  const parsed = localPostgresCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Local pre-plan study Postgres capability checksum is invalid.')
  }
}

function invalidRpcResponse(functionName: string, issueCount: number): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Pre-plan study RPC returned an invalid response contract.',
    503,
    {
      rpcFunctionId: functionName,
      issueCount,
      automaticRetryStarted: false,
    },
  )
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
    'Pre-plan study RPC transaction did not return validated atomic evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_distributed_pre_plan_study_rpc_error_v1',
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
  return cleaned.length > 0 && cleaned.length <= 120 ? cleaned : null
}

function atomicityError(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503, {
    requiredGates: [
      'reviewed_pre_plan_study_database_transaction_adapter',
      'disposable_postgres_pre_plan_study_conformance',
      'multi_replica_lease_and_recovery_evidence',
      'authenticated_worker_dispatch_and_private_object_evidence',
    ],
  })
}
