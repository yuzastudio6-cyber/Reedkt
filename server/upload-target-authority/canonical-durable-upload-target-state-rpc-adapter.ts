import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION,
  canonicalDurableUploadIntentRecordSchema,
  canonicalDurableUploadIntentResolveRequestSchema,
  canonicalDurableUploadTargetClaimRequestSchema,
  canonicalDurableUploadTargetCommitRequestSchema,
  canonicalDurableUploadTargetMutationResultSchema,
  canonicalDurableUploadTargetReadRequestSchema,
  canonicalDurableUploadTargetUnknownRequestSchema,
  createDurableUploadTargetDescriptor,
  type CanonicalDurableUploadTargetMutationResult,
  type CanonicalDurableUploadTargetTransactionAdapter,
} from './canonical-durable-upload-target-authority'

export const CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY_VERSION =
  'canonical-durable-upload-target-rpc-registry-v1' as const
export const CANONICAL_DURABLE_UPLOAD_TARGET_LOCAL_POSTGRES_CAPABILITY_VERSION =
  'canonical-durable-upload-target-local-postgres-capability-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const rpcFunctionName = z.string().regex(/^[a-z][a-z0-9_]{15,127}$/u)

const registrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY_VERSION),
  requestEnvelopeVersion: z.literal(CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION),
  targetDatabase: z.literal('postgres_via_server_only_supabase_rpc'),
  functions: z.object({
    resolveIntent: rpcFunctionName,
    claimTarget: rpcFunctionName,
    commitTarget: rpcFunctionName,
    markTargetUnknown: rpcFunctionName,
    readIntent: rpcFunctionName,
  }).strict(),
  oneRpcCallPerPortMethod: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  rawSqlAcceptedByAdapter: z.literal(false),
  callerSelectedRpcFunctionAllowed: z.literal(false),
  browserOrFrontendClientAllowed: z.literal(false),
  serviceRoleCredentialAcceptedAsMethodInput: z.literal(false),
  rawUploadCredentialAcceptedOrReturned: z.literal(false),
  registryHash: sha256,
}).strict().superRefine((registry, context) => {
  const names = Object.values(registry.functions)
  if (new Set(names).size !== names.length) {
    context.addIssue({ code: 'custom', message: 'Upload-target RPC functions are duplicated.' })
  }
})

const registryPayload = {
  schemaVersion: CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY_VERSION,
  requestEnvelopeVersion: CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    resolveIntent: 'reeditpro_resolve_upload_intent_v1',
    claimTarget: 'reeditpro_claim_upload_target_v1',
    commitTarget: 'reeditpro_commit_upload_target_v1',
    markTargetUnknown: 'reeditpro_mark_upload_target_unknown_v1',
    readIntent: 'reeditpro_read_upload_intent_v1',
  },
  oneRpcCallPerPortMethod: true as const,
  automaticTransportRetryAllowed: false as const,
  rawSqlAcceptedByAdapter: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
  rawUploadCredentialAcceptedOrReturned: false as const,
}

export const CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY = Object.freeze(
  registrySchema.parse({
    ...registryPayload,
    registryHash: sha256AuthorityValue(registryPayload),
  }),
)

export interface CanonicalDurableUploadTargetRpcClientResult {
  data: unknown
  error: unknown
}

export interface CanonicalDurableUploadTargetRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version: typeof CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalDurableUploadTargetRpcClientResult>
}

const localCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DURABLE_UPLOAD_TARGET_LOCAL_POSTGRES_CAPABILITY_VERSION,
  ),
  purpose: z.literal('canonical_v3_loopback_postgres_upload_target_proof'),
  endpointOrigin: z.literal('http://127.0.0.1:57431'),
  registryHash: z.literal(CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY.registryHash),
  loopbackOnly: z.literal(true),
  localPostgresCallAllowed: z.literal(true),
  remoteDatabaseMutationAllowed: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  liveGcsSessionIssuanceVerified: z.literal(false),
  credentialEscrowAuthorityIncluded: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalDurableUploadTargetLocalPostgresCapability = z.infer<
  typeof localCapabilitySchema
>

const localCapabilityBrands = new WeakSet<object>()
const localCapabilityClients = new WeakMap<object, CanonicalDurableUploadTargetRpcClient>()

export function createCanonicalDurableUploadTargetLocalPostgresCapability(input: {
  readonly client: CanonicalDurableUploadTargetRpcClient
  readonly endpointOrigin: string
}): CanonicalDurableUploadTargetLocalPostgresCapability {
  if (!input.client || typeof input.client.rpc !== 'function') {
    throw atomicityError('Local upload-target Postgres capability requires one RPC client.')
  }
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') {
    throw atomicityError('Local upload-target Postgres capability is loopback-only.')
  }
  const payload = {
    schemaVersion: CANONICAL_DURABLE_UPLOAD_TARGET_LOCAL_POSTGRES_CAPABILITY_VERSION,
    purpose: 'canonical_v3_loopback_postgres_upload_target_proof' as const,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    registryHash: CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY.registryHash,
    loopbackOnly: true as const,
    localPostgresCallAllowed: true as const,
    remoteDatabaseMutationAllowed: false as const,
    multiReplicaDurabilityVerified: false as const,
    liveGcsSessionIssuanceVerified: false as const,
    credentialEscrowAuthorityIncluded: false as const,
    productionAuthority: false as const,
  }
  const capability = Object.freeze(localCapabilitySchema.parse({
    ...payload,
    capabilityHash: sha256AuthorityValue(payload),
  }))
  localCapabilityBrands.add(capability)
  localCapabilityClients.set(capability, input.client)
  return capability
}

export function createCanonicalDurableUploadTargetLocalPostgresAdapter(input: {
  readonly client: CanonicalDurableUploadTargetRpcClient
  readonly capability: CanonicalDurableUploadTargetLocalPostgresCapability
}): CanonicalDurableUploadTargetTransactionAdapter {
  assertLocalCapability(input.capability, input.client)
  const functions = CANONICAL_DURABLE_UPLOAD_TARGET_RPC_REGISTRY.functions
  const descriptor = createDurableUploadTargetDescriptor({
    schemaVersion: CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION,
    adapterId: 'canonical_durable_upload_target_local_postgres_v1',
    implementationClass: 'database_transaction_adapter',
    databaseBackend: 'postgres',
    serializableIntentAndIssuanceTransactionsVerified: true,
    durableIdempotencyResponseAssociationVerified: true,
    multiReplicaReadAfterWriteVerified: false,
    targetSideEffectOccursOnlyAfterIntentCommitVerified: true,
    unknownTargetOutcomeBlocksDuplicateIssuanceVerified: true,
    canonicalUploadLifecycleProjectionVerified: true,
    rawCredentialExcludedFromCanonicalPersistenceVerified: true,
    authenticatedTenantIsolationVerified: true,
    liveGcsSessionIssuanceVerified: false,
    liveReleaseEvidenceHash: null,
    productionAuthority: false,
  })
  return Object.freeze({
    descriptor,
    resolveIntent: (
      rawInput: Parameters<CanonicalDurableUploadTargetTransactionAdapter['resolveIntent']>[0],
    ) => invokeMutation({
      client: input.client,
      functionName: functions.resolveIntent,
      schema: canonicalDurableUploadIntentResolveRequestSchema,
      rawInput,
    }),
    claimTarget: (
      rawInput: Parameters<CanonicalDurableUploadTargetTransactionAdapter['claimTarget']>[0],
    ) => invokeMutation({
      client: input.client,
      functionName: functions.claimTarget,
      schema: canonicalDurableUploadTargetClaimRequestSchema,
      rawInput,
    }),
    commitTarget: (
      rawInput: Parameters<CanonicalDurableUploadTargetTransactionAdapter['commitTarget']>[0],
    ) => invokeMutation({
      client: input.client,
      functionName: functions.commitTarget,
      schema: canonicalDurableUploadTargetCommitRequestSchema,
      rawInput,
    }),
    markTargetUnknown: (
      rawInput: Parameters<CanonicalDurableUploadTargetTransactionAdapter['markTargetUnknown']>[0],
    ) => invokeMutation({
      client: input.client,
      functionName: functions.markTargetUnknown,
      schema: canonicalDurableUploadTargetUnknownRequestSchema,
      rawInput,
    }),
    async readIntent(
      rawInput: Parameters<CanonicalDurableUploadTargetTransactionAdapter['readIntent']>[0],
    ) {
      const request = parseRequest(canonicalDurableUploadTargetReadRequestSchema, rawInput)
      const rpcResult = await invokeExactlyOnce(
        input.client,
        functions.readIntent,
        request as Record<string, unknown>,
      )
      const normalized = normalizeRpcData(rpcResult.data)
      if (normalized === null) return undefined
      const parsed = canonicalDurableUploadIntentRecordSchema.safeParse(normalized)
      if (!parsed.success) throw invalidRpcResult(functions.readIntent, parsed.error.issues.length)
      return parsed.data
    },
  })
}

async function invokeMutation<TSchema extends z.ZodType>(input: {
  readonly client: CanonicalDurableUploadTargetRpcClient
  readonly functionName: string
  readonly schema: TSchema
  readonly rawInput: unknown
}): Promise<CanonicalDurableUploadTargetMutationResult> {
  const request = parseRequest(input.schema, input.rawInput)
  const rpcResult = await invokeExactlyOnce(
    input.client,
    input.functionName,
    request as Record<string, unknown>,
  )
  const parsed = canonicalDurableUploadTargetMutationResultSchema.safeParse(
    normalizeRpcData(rpcResult.data),
  )
  if (!parsed.success) throw invalidRpcResult(input.functionName, parsed.error.issues.length)
  return parsed.data
}

function parseRequest<TSchema extends z.ZodType>(
  schema: TSchema,
  rawInput: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Durable upload-target RPC request is invalid.',
      400,
      { callerSelectedRpcOrStateFieldsAllowed: false },
    )
  }
  return parsed.data
}

async function invokeExactlyOnce(
  client: CanonicalDurableUploadTargetRpcClient,
  functionName: string,
  request: Record<string, unknown>,
): Promise<CanonicalDurableUploadTargetRpcClientResult> {
  let result: CanonicalDurableUploadTargetRpcClientResult
  try {
    result = await client.rpc(functionName, {
      p_contract_version: CANONICAL_DURABLE_UPLOAD_TARGET_PORT_VERSION,
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

function normalizeRpcData(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length !== 1) {
    throw atomicityError('Upload-target RPC returned invalid result cardinality.')
  }
  return data[0]
}

function assertLocalCapability(
  capability: CanonicalDurableUploadTargetLocalPostgresCapability,
  client: CanonicalDurableUploadTargetRpcClient,
): void {
  if (
    !localCapabilityBrands.has(capability) ||
    localCapabilityClients.get(capability) !== client
  ) throw atomicityError('Local upload-target capability is copied or bound to another client.')
  const parsed = localCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw atomicityError('Local upload-target capability checksum is invalid.')
  }
}

function invalidRpcResult(functionName: string, issueCount: number): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Durable upload-target RPC returned an invalid response contract.',
    503,
    { rpcFunctionId: functionName, issueCount, automaticRetryStarted: false },
  )
}

function sanitizedRpcError(functionName: string, error: unknown): ApiError {
  const safe = error && typeof error === 'object'
    ? {
        code: cleanScalar((error as Record<string, unknown>).code),
        status: cleanScalar((error as Record<string, unknown>).status),
      }
    : { code: null, status: null }
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Durable upload-target RPC did not return validated atomic evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_durable_upload_target_rpc_error_v1',
        functionName,
        ...safe,
      }),
      automaticRetryStarted: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  return /^[A-Za-z0-9_.:-]{1,80}$/u.test(value) ? value : null
}

function atomicityError(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_ATOMICITY_REQUIRED', message, 503, {
    requiredGate: 'canonical_durable_upload_target_local_postgres_adapter',
    productionAuthority: false,
  })
}
