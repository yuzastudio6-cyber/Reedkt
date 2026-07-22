import { z } from 'zod'

import type { EditReferenceLongFormStudyPlan } from '../edit-references/edit-reference-long-form-study-contract'
import { ApiError } from '../errors/api-error'
import type { EditReferenceLongFormStudySourceBinding } from '../services/edit-reference-production-long-form-runtime-port'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type {
  CanonicalDistributedPrePlanStudyLocalHttpClient,
} from './canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
  canonicalDistributedPrePlanStudyRequestHash,
} from './canonical-distributed-pre-plan-study-state-port'

export const CANONICAL_PRE_PLAN_SOURCE_REGISTRATION_RPC_FUNCTION =
  'reeditpro_register_pre_plan_source_v1' as const
export const CANONICAL_PRE_PLAN_SOURCE_REGISTRATION_RECEIPT_VERSION =
  'canonical-v3-local-preference-asset-source-registration-receipt-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sourceRegistrationReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRE_PLAN_SOURCE_REGISTRATION_RECEIPT_VERSION),
  sourceAssetId: identity,
  status: z.literal('registered'),
  disposition: z.enum(['inserted', 'idempotent_replay']),
  transaction: z.object({
    transactionId: z.string().uuid(),
    committedAt: z.string().datetime({ offset: true }),
    authenticatedRlsVerified: z.literal(true),
    databaseTransactionVerified: z.literal(true),
  }).strict(),
  boundaries: z.object({
    localLoopbackOnly: z.literal(true),
    privateEvidenceIdentityVerified: z.literal(true),
    browserSuppliedStorageAuthorityAccepted: z.literal(false),
    rawMediaPathSignedUrlOrCredentialReturned: z.literal(false),
    remoteMutationAllowed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
}).strict()

export type CanonicalPrePlanSourceRegistrationReceipt = z.infer<
  typeof sourceRegistrationReceiptSchema
>

/**
 * Registers the exact, already-finalized and independently inspected source
 * for the local V3 pre-plan transaction. The fixed loopback client keeps the
 * authenticated user token and local HMAC inside the server process.
 */
export async function registerCanonicalPrePlanStudySource(input: {
  readonly client: CanonicalDistributedPrePlanStudyLocalHttpClient
  readonly ownerUserId: string
  readonly plan: EditReferenceLongFormStudyPlan
  readonly sourceBinding: EditReferenceLongFormStudySourceBinding
}): Promise<CanonicalPrePlanSourceRegistrationReceipt> {
  const binding = input.sourceBinding
  const plan = input.plan
  if (
    binding.sourceAuthority !== 'preference_asset'
    || !binding.sourceAssetId
    || !binding.sourceStorageObjectRecordId
    || !binding.sourceMediaAssetId
    || !binding.sourceStorageObjectId
    || !binding.sourceStorageGeneration
    || !binding.sourceStorageEtag
    || !input.ownerUserId
    || plan.source.privateMediaArtifactId !== binding.sourceStorageObjectRecordId
  ) {
    throw atomicityError('canonical_pre_plan_source_registration_binding_invalid')
  }

  const requestWithoutHash = {
    ownerUserId: input.ownerUserId,
    workspaceId: plan.workspaceId,
    editReferenceId: plan.editReferenceId,
    studySessionId: plan.studySessionId,
    sourceAssetId: binding.sourceAssetId,
    sourcePrivateMediaArtifactId: plan.source.privateMediaArtifactId,
    sourceStorageObjectRecordId: binding.sourceStorageObjectRecordId,
    sourceMediaAssetId: binding.sourceMediaAssetId,
    sourceStorageObjectId: binding.sourceStorageObjectId,
    sourceStorageGeneration: binding.sourceStorageGeneration,
    sourceStorageEtag: binding.sourceStorageEtag,
    sourceChecksumSha256: plan.source.mediaChecksumSha256,
    sourceSizeBytes: plan.source.sizeBytes,
    sourceDurationMilliseconds: Math.round(plan.source.durationSeconds * 1_000),
    sourceMimeType: plan.source.mimeType,
    sourceHasAudio: plan.source.hasAudio,
    idempotencyKey: `register-source:${plan.workspaceId}:${binding.sourceAssetId}`,
    requestedAt: plan.createdAt,
  }
  const request = {
    ...requestWithoutHash,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(
      'register_source',
      requestWithoutHash,
    ),
  }
  const result = await input.client.rpc(
    CANONICAL_PRE_PLAN_SOURCE_REGISTRATION_RPC_FUNCTION,
    {
      p_contract_version: CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_PORT_VERSION,
      p_request: request,
    },
  )
  if (result.error) throw sanitizedRpcError(result.error)
  const parsed = sourceRegistrationReceiptSchema.safeParse(result.data)
  if (!parsed.success || parsed.data.sourceAssetId !== binding.sourceAssetId) {
    throw atomicityError('canonical_pre_plan_source_registration_receipt_invalid')
  }
  return parsed.data
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
    'The finalized reference source was not registered with validated atomic evidence.',
    503,
    {
      rpcFunctionId: CANONICAL_PRE_PLAN_SOURCE_REGISTRATION_RPC_FUNCTION,
      errorEvidenceHash: sha256AuthorityValue({
        domain: 'canonical_pre_plan_source_registration_rpc_error_v1',
        ...safe,
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

function atomicityError(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The finalized reference source is missing canonical registration authority.',
    503,
    {
      reason,
      localLoopbackOnly: true,
      remoteMutationAllowed: false,
      productionReady: false,
    },
  )
}
