import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  createCanonicalUploadTargetCredentialEscrow,
  credentialDigest,
  type CanonicalUploadTargetCredentialEscrow,
} from './canonical-durable-upload-target-authority'
import {
  canonicalUploadTargetCredentialEncryptedEnvelopeSchema,
  decryptCanonicalUploadTargetCredential,
  encryptCanonicalUploadTargetCredential,
  normalizeCanonicalUploadTargetCredential,
  type CanonicalUploadTargetCredentialKeyWrapCapability,
  assertCanonicalUploadTargetCredentialKeyWrapCapability,
} from './canonical-upload-target-credential-envelope'

export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION =
  'canonical-upload-target-credential-escrow-rpc-v1' as const
export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY_VERSION =
  'canonical-upload-target-credential-escrow-rpc-registry-v1' as const
export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_POSTGRES_CAPABILITY_VERSION =
  'canonical-upload-target-credential-escrow-local-postgres-capability-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const rpcFunctionName = z.string().regex(/^[a-z][a-z0-9_]{15,127}$/u)

const activeEscrowRecordSchema = z.object({
  schemaVersion: z.literal('canonical-upload-target-credential-escrow-record-v1'),
  recordId: identity,
  uploadIntentId: identity,
  attemptId: identity,
  credentialDigestSha256: sha256,
  expiresAt: timestamp,
  state: z.literal('active'),
  envelope: canonicalUploadTargetCredentialEncryptedEnvelopeSchema,
  createdAt: timestamp,
  deletedAt: z.null(),
  recordHash: sha256,
}).strict()

const deletedEscrowRecordSchema = activeEscrowRecordSchema.extend({
  state: z.literal('deleted'),
  envelope: z.null(),
  deletedAt: timestamp,
}).strict()

export const canonicalUploadTargetCredentialEscrowRecordSchema = z.discriminatedUnion(
  'state',
  [activeEscrowRecordSchema, deletedEscrowRecordSchema],
)

export type CanonicalUploadTargetCredentialEscrowRecord = z.infer<
  typeof canonicalUploadTargetCredentialEscrowRecordSchema
>

const putRequestSchema = z.object({
  recordId: identity,
  uploadIntentId: identity,
  attemptId: identity,
  credentialDigestSha256: sha256,
  expiresAt: timestamp,
  envelope: canonicalUploadTargetCredentialEncryptedEnvelopeSchema,
  requestedAt: timestamp,
}).strict()

const readRequestSchema = z.object({
  recordId: identity,
  uploadIntentId: identity,
  attemptId: identity,
}).strict()

const deleteRequestSchema = readRequestSchema.extend({
  requestedAt: timestamp,
}).strict()

const registrySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY_VERSION,
  ),
  requestEnvelopeVersion: z.literal(CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION),
  targetDatabase: z.literal('postgres_via_server_only_supabase_rpc'),
  functions: z.object({
    putEncryptedEnvelope: rpcFunctionName,
    readEncryptedEnvelope: rpcFunctionName,
    deleteEncryptedEnvelope: rpcFunctionName,
  }).strict(),
  oneRpcCallPerMethod: z.literal(true),
  automaticTransportRetryAllowed: z.literal(false),
  rawSqlAcceptedByAdapter: z.literal(false),
  callerSelectedRpcFunctionAllowed: z.literal(false),
  browserOrFrontendClientAllowed: z.literal(false),
  serviceRoleCredentialAcceptedAsMethodInput: z.literal(false),
  plaintextUploadCredentialAcceptedOrReturnedByRpc: z.literal(false),
  registryHash: sha256,
}).strict()

const registryPayload = {
  schemaVersion: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY_VERSION,
  requestEnvelopeVersion: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION,
  targetDatabase: 'postgres_via_server_only_supabase_rpc' as const,
  functions: {
    putEncryptedEnvelope: 'reeditpro_put_upload_target_credential_envelope_v1',
    readEncryptedEnvelope: 'reeditpro_read_upload_target_credential_envelope_v1',
    deleteEncryptedEnvelope: 'reeditpro_delete_upload_target_credential_envelope_v1',
  },
  oneRpcCallPerMethod: true as const,
  automaticTransportRetryAllowed: false as const,
  rawSqlAcceptedByAdapter: false as const,
  callerSelectedRpcFunctionAllowed: false as const,
  browserOrFrontendClientAllowed: false as const,
  serviceRoleCredentialAcceptedAsMethodInput: false as const,
  plaintextUploadCredentialAcceptedOrReturnedByRpc: false as const,
}

export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY = Object.freeze(
  registrySchema.parse({
    ...registryPayload,
    registryHash: sha256AuthorityValue(registryPayload),
  }),
)

export interface CanonicalUploadTargetCredentialEscrowRpcClientResult {
  readonly data: unknown
  readonly error: unknown
}

export interface CanonicalUploadTargetCredentialEscrowRpcClient {
  rpc(
    functionName: string,
    parameters: {
      p_contract_version: typeof CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION
      p_request: Record<string, unknown>
    },
  ): PromiseLike<CanonicalUploadTargetCredentialEscrowRpcClientResult>
}

const localCapabilitySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_POSTGRES_CAPABILITY_VERSION,
  ),
  purpose: z.literal('canonical_v3_loopback_encrypted_upload_target_credential_escrow'),
  endpointOrigin: z.literal('http://127.0.0.1:57431'),
  registryHash: z.literal(CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY.registryHash),
  loopbackOnly: z.literal(true),
  localPostgresCallAllowed: z.literal(true),
  encryptedEnvelopePersistenceAllowed: z.literal(true),
  plaintextUploadCredentialPersistenceAllowed: z.literal(false),
  restartRecoveryVerified: z.literal(true),
  multiReplicaRecoveryVerified: z.literal(false),
  liveCloudKmsVerified: z.literal(false),
  remoteDatabaseMutationAllowed: z.literal(false),
  productionAuthority: z.literal(false),
  capabilityHash: sha256,
}).strict()

export type CanonicalUploadTargetCredentialEscrowLocalPostgresCapability = z.infer<
  typeof localCapabilitySchema
>

const localCapabilityBrands = new WeakSet<object>()
const localCapabilityClients = new WeakMap<
  object,
  CanonicalUploadTargetCredentialEscrowRpcClient
>()

export function createCanonicalUploadTargetCredentialEscrowLocalPostgresCapability(input: {
  readonly client: CanonicalUploadTargetCredentialEscrowRpcClient
  readonly endpointOrigin: string
}): CanonicalUploadTargetCredentialEscrowLocalPostgresCapability {
  if (!input.client || typeof input.client.rpc !== 'function') {
    throw escrowError('local_escrow_rpc_client_missing')
  }
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') {
    throw escrowError('local_escrow_postgres_capability_not_loopback')
  }
  const payload = {
    schemaVersion:
      CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_POSTGRES_CAPABILITY_VERSION,
    purpose: 'canonical_v3_loopback_encrypted_upload_target_credential_escrow' as const,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    registryHash: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY.registryHash,
    loopbackOnly: true as const,
    localPostgresCallAllowed: true as const,
    encryptedEnvelopePersistenceAllowed: true as const,
    plaintextUploadCredentialPersistenceAllowed: false as const,
    restartRecoveryVerified: true as const,
    multiReplicaRecoveryVerified: false as const,
    liveCloudKmsVerified: false as const,
    remoteDatabaseMutationAllowed: false as const,
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

export function createCanonicalUploadTargetCredentialEscrowLocalPostgresAdapter(input: {
  readonly client: CanonicalUploadTargetCredentialEscrowRpcClient
  readonly capability: CanonicalUploadTargetCredentialEscrowLocalPostgresCapability
  readonly keyWrapCapability: CanonicalUploadTargetCredentialKeyWrapCapability
  readonly now?: () => string
}): CanonicalUploadTargetCredentialEscrow {
  assertLocalCapability(input.capability, input.client)
  assertCanonicalUploadTargetCredentialKeyWrapCapability(input.keyWrapCapability)
  const now = input.now ?? (() => new Date().toISOString())
  const functions = CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY.functions

  return createCanonicalUploadTargetCredentialEscrow(Object.freeze({
    descriptor: Object.freeze({
      schemaVersion: 'canonical-upload-target-credential-escrow-v1' as const,
      implementationClass: 'server_envelope_encrypted_ephemeral_store' as const,
      multiReplicaRecoveryVerified: false,
      envelopeEncryptionVerified: true,
      expiryAndDeletionVerified: true,
      rawCredentialLoggedOrStoredInCanonicalDatabase: false as const,
      productionAuthority: false,
    }),
    async put(rawInput: Parameters<CanonicalUploadTargetCredentialEscrow['put']>[0]) {
      const requestedAt = timestamp.parse(now())
      const requestIdentity = putRequestSchema.pick({
        recordId: true,
        uploadIntentId: true,
        attemptId: true,
        credentialDigestSha256: true,
        expiresAt: true,
        requestedAt: true,
      }).parse({
        recordId: rawInput.recordId,
        uploadIntentId: rawInput.uploadIntentId,
        attemptId: rawInput.attemptId,
        credentialDigestSha256: rawInput.credentialDigestSha256,
        expiresAt: rawInput.expiresAt,
        requestedAt,
      })
      const target = normalizeCanonicalUploadTargetCredential(rawInput.target)
      if (
        credentialDigest(target) !== requestIdentity.credentialDigestSha256 ||
        target.expiresAt !== requestIdentity.expiresAt
      ) throw escrowError('put_target_digest_or_expiry_mismatch')
      const envelope = await encryptCanonicalUploadTargetCredential({
        ...requestIdentity,
        target,
        keyWrapCapability: input.keyWrapCapability,
      })
      const request = putRequestSchema.parse({ ...requestIdentity, envelope })
      const record = await invokeRecord(
        input.client,
        functions.putEncryptedEnvelope,
        request,
      )
      if (!record || record.state !== 'active') throw escrowError('put_record_not_active')
      assertRecordIdentity(record, requestIdentity)
      const storedTarget = await decryptRecord(record, input.keyWrapCapability)
      if (fullTargetDigest(storedTarget) !== fullTargetDigest(target)) {
        throw escrowError('put_exact_replay_target_mismatch')
      }
    },
    async read(rawInput: Parameters<CanonicalUploadTargetCredentialEscrow['read']>[0]) {
      const request = readRequestSchema.parse(rawInput)
      const record = await invokeRecord(
        input.client,
        functions.readEncryptedEnvelope,
        request,
      )
      if (!record || record.state === 'deleted') return undefined
      assertRecordIdentity(record, request)
      const currentTime = timestamp.parse(now())
      if (Date.parse(currentTime) >= Date.parse(record.expiresAt)) {
        const deleted = await invokeRecord(
          input.client,
          functions.deleteEncryptedEnvelope,
          deleteRequestSchema.parse({ ...request, requestedAt: currentTime }),
        )
        if (!deleted || deleted.state !== 'deleted') {
          throw escrowError('expired_record_scrub_not_verified')
        }
        assertRecordIdentity(deleted, request)
        return undefined
      }
      return decryptRecord(record, input.keyWrapCapability)
    },
    async delete(rawInput: Parameters<CanonicalUploadTargetCredentialEscrow['delete']>[0]) {
      const request = deleteRequestSchema.parse({
        ...rawInput,
        requestedAt: timestamp.parse(now()),
      })
      const record = await invokeRecord(
        input.client,
        functions.deleteEncryptedEnvelope,
        request,
      )
      if (!record) return
      if (record.state !== 'deleted' || record.envelope !== null) {
        throw escrowError('deleted_record_retains_encrypted_envelope')
      }
      assertRecordIdentity(record, request)
    },
  }))
}

async function invokeRecord(
  client: CanonicalUploadTargetCredentialEscrowRpcClient,
  functionName: string,
  request: Record<string, unknown>,
): Promise<CanonicalUploadTargetCredentialEscrowRecord | undefined> {
  let rpcResult: CanonicalUploadTargetCredentialEscrowRpcClientResult
  try {
    rpcResult = await client.rpc(functionName, {
      p_contract_version: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION,
      p_request: request,
    })
  } catch (error) {
    throw sanitizedRpcError(functionName, error)
  }
  if (!rpcResult || typeof rpcResult !== 'object' || rpcResult.error) {
    throw sanitizedRpcError(functionName, rpcResult?.error)
  }
  const normalized = normalizeRpcData(rpcResult.data)
  if (normalized === null) return undefined
  const parsed = canonicalUploadTargetCredentialEscrowRecordSchema.safeParse(normalized)
  if (!parsed.success) {
    throw escrowError(`rpc_record_contract_invalid_${parsed.error.issues.length}`)
  }
  assertRecordHash(parsed.data)
  return parsed.data
}

async function decryptRecord(
  record: Extract<CanonicalUploadTargetCredentialEscrowRecord, { state: 'active' }>,
  keyWrapCapability: CanonicalUploadTargetCredentialKeyWrapCapability,
) {
  return decryptCanonicalUploadTargetCredential({
    recordId: record.recordId,
    uploadIntentId: record.uploadIntentId,
    attemptId: record.attemptId,
    credentialDigestSha256: record.credentialDigestSha256,
    expiresAt: record.expiresAt,
    envelope: record.envelope,
    keyWrapCapability,
  })
}

function assertRecordIdentity(
  record: CanonicalUploadTargetCredentialEscrowRecord,
  request: {
    readonly recordId: string
    readonly uploadIntentId: string
    readonly attemptId: string
    readonly credentialDigestSha256?: string
    readonly expiresAt?: string
  },
): void {
  if (
    record.recordId !== request.recordId ||
    record.uploadIntentId !== request.uploadIntentId ||
    record.attemptId !== request.attemptId ||
    (
      request.credentialDigestSha256 !== undefined &&
      record.credentialDigestSha256 !== request.credentialDigestSha256
    ) ||
    (request.expiresAt !== undefined && record.expiresAt !== request.expiresAt)
  ) throw escrowError('escrow_record_scope_or_lineage_mismatch')
}

function assertRecordHash(record: CanonicalUploadTargetCredentialEscrowRecord): void {
  const { recordHash, ...payload } = record
  if (recordHash !== sha256AuthorityValue(payload)) {
    throw escrowError('escrow_record_hash_invalid')
  }
}

function fullTargetDigest(target: ReturnType<typeof normalizeCanonicalUploadTargetCredential>) {
  return sha256AuthorityValue({
    schemaVersion: 'canonical-upload-target-full-credential-identity-v1',
    target,
  })
}

function normalizeRpcData(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  if (data.length !== 1) throw escrowError('escrow_rpc_result_cardinality_invalid')
  return data[0]
}

function assertLocalCapability(
  capability: CanonicalUploadTargetCredentialEscrowLocalPostgresCapability,
  client: CanonicalUploadTargetCredentialEscrowRpcClient,
): void {
  if (
    !localCapabilityBrands.has(capability) ||
    localCapabilityClients.get(capability) !== client
  ) throw escrowError('local_escrow_capability_copied_or_rebound')
  const parsed = localCapabilitySchema.parse(capability)
  const { capabilityHash, ...payload } = parsed
  if (capabilityHash !== sha256AuthorityValue(payload)) {
    throw escrowError('local_escrow_capability_hash_invalid')
  }
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
    'Encrypted upload-target credential escrow RPC did not return validated evidence.',
    503,
    {
      rpcFunctionId: functionName,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_upload_target_credential_escrow_rpc_error_v1',
        functionName,
        ...safe,
      }),
      plaintextUploadCredentialAcceptedOrReturnedByRpc: false,
      automaticRetryStarted: false,
      productionAuthority: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  return /^[A-Za-z0-9_.:-]{1,120}$/u.test(value) ? value : null
}

function escrowError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'Encrypted upload-target credential escrow evidence is invalid or unavailable.',
    503,
    {
      reason,
      rawCredentialLoggedOrStoredInCanonicalDatabase: false,
      multiReplicaRecoveryVerified: false,
      liveCloudKmsVerified: false,
      productionAuthority: false,
    },
  )
}
