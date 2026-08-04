import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type {
  CanonicalDistributedMediaIngestLocalHttpClient,
} from './canonical-distributed-media-ingest-local-supabase-http-rpc-client'
import {
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_FUNCTION,
} from './canonical-distributed-media-ingest-local-supabase-http-rpc-client'
import {
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
  canonicalDistributedMediaIngestRequestHash,
  canonicalDistributedMediaIngestSeedSchema,
  type CanonicalDistributedMediaIngestSeed,
} from './canonical-distributed-media-ingest-state-port'

export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_RECEIPT_VERSION =
  'canonical-v3-local-media-ingest-source-registration-receipt-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const sourceRegistrationReceiptSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_RECEIPT_VERSION,
  ),
  jobId: identity,
  seedHash: sha256,
  status: z.literal('registered'),
  disposition: z.enum(['inserted', 'idempotent_replay']),
  transaction: z.object({
    transactionId: z.string().uuid(),
    committedAt: z.string().datetime({ offset: true }),
    authenticatedTenantRlsVerified: z.literal(true),
    databaseTransactionVerified: z.literal(true),
  }).strict(),
  boundaries: z.object({
    localLoopbackOnly: z.literal(true),
    uploadAuthorityDerivedServerSide: z.literal(true),
    browserSuppliedUploadAuthorityAccepted: z.literal(false),
    rawMediaPathSignedUrlUploadCredentialOrBytesPersisted: z.literal(false),
    remoteMutationAllowed: z.literal(false),
    cloudDispatchAllowed: z.literal(false),
    liveGcsObjectReadPerformed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
}).strict()

export type CanonicalDistributedMediaIngestSourceRegistrationReceipt = z.infer<
  typeof sourceRegistrationReceiptSchema
>

/**
 * Registers one immutable, server-derived upload/finalization seed before the
 * fixed seven-operation state port may enqueue it. This prerequisite is not
 * an eighth queue mutation. The local Postgres proof deliberately stores only
 * digest-bound authority—not an object path, signed URL, credential, or media
 * bytes—and cannot be promoted to hosted production.
 */
export async function registerCanonicalDistributedMediaIngestSource(input: {
  readonly client: CanonicalDistributedMediaIngestLocalHttpClient
  readonly seed: CanonicalDistributedMediaIngestSeed
  readonly requestedAt: string
  readonly idempotencyKey?: string
}): Promise<CanonicalDistributedMediaIngestSourceRegistrationReceipt> {
  const seed = assertSeedIntegrity(input.seed)
  const requestWithoutHash = {
    jobId: seed.jobId,
    ownerUserId: seed.identity.ownerUserId,
    workspaceId: seed.identity.workspaceId,
    projectId: seed.identity.projectId,
    uploadIntentId: seed.identity.uploadIntentId,
    uploadPurpose: seed.identity.uploadPurpose,
    expectedSizeBytes: seed.identity.expectedSizeBytes,
    uploadAuthorityFingerprint: seed.identity.uploadAuthorityFingerprint,
    seed,
    idempotencyKey: input.idempotencyKey
      ?? `register-media-ingest:${seed.identity.workspaceId}:${seed.jobId}`,
    requestedAt: input.requestedAt,
  }
  const request = {
    ...requestWithoutHash,
    requestHash: canonicalDistributedMediaIngestRequestHash(
      'register_source',
      requestWithoutHash,
    ),
  }
  const result = await input.client.rpc(
    CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_FUNCTION,
    {
      p_contract_version: CANONICAL_DISTRIBUTED_MEDIA_INGEST_PORT_VERSION,
      p_request: request,
    },
  )
  if (result.error) throw sanitizedRpcError(result.error)
  const parsed = sourceRegistrationReceiptSchema.safeParse(result.data)
  if (
    !parsed.success
    || parsed.data.jobId !== seed.jobId
    || parsed.data.seedHash !== seed.seedHash
  ) throw atomicityError('media_ingest_source_registration_receipt_invalid')
  return parsed.data
}

function assertSeedIntegrity(
  rawSeed: CanonicalDistributedMediaIngestSeed,
): CanonicalDistributedMediaIngestSeed {
  const seed = canonicalDistributedMediaIngestSeedSchema.parse(rawSeed)
  const { identityHash, ...identityPayload } = seed.identity
  const { policyHash, ...policyPayload } = seed.policy
  const { seedHash, ...seedPayload } = seed
  if (
    identityHash !== sha256AuthorityValue(identityPayload)
    || policyHash !== sha256AuthorityValue(policyPayload)
    || seedHash !== sha256AuthorityValue(seedPayload)
  ) throw atomicityError('media_ingest_source_seed_integrity_invalid')
  return structuredClone(seed)
}

function sanitizedRpcError(error: unknown): ApiError {
  const safe = error && typeof error === 'object' && !Array.isArray(error)
    ? {
        code: cleanScalar((error as Record<string, unknown>).code),
        status: cleanScalar((error as Record<string, unknown>).status),
      }
    : { code: null, status: null }
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The server-derived large-media source was not registered atomically.',
    503,
    {
      rpcFunctionId: CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_FUNCTION,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_media_ingest_source_registration_rpc_error_v1',
        ...safe,
      }),
      automaticRetryStarted: false,
      remoteMutationAttempted: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 && cleaned.length <= 120 ? cleaned : null
}

function atomicityError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The large-media source is missing canonical local registration authority.',
    503,
    {
      reason,
      localLoopbackOnly: true,
      remoteMutationAllowed: false,
      cloudDispatchAllowed: false,
      liveGcsObjectReadPerformed: false,
      productionReady: false,
    },
  )
}
