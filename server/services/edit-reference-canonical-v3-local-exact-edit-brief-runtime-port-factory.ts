import { z } from 'zod'

import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
  type CanonicalDistributedPrePlanStudyLocalHttpClient,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  canonicalDistributedPrePlanStudyRequestHash,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceExactEditBriefRuntimePortFactory,
  EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_PORT_VERSION,
  type EditReferenceExactEditBriefAuthorityRecord,
  type EditReferenceExactEditBriefRuntimePort,
  type EditReferenceExactEditBriefRuntimePortFactory,
} from './edit-reference-exact-edit-brief-runtime-port'

export const EDIT_REFERENCE_CANONICAL_V3_LOCAL_EXACT_EDIT_BRIEF_FACTORY_VERSION =
  'edit-reference-canonical-v3-local-exact-edit-brief-factory-v1' as const

const CANONICAL_LOCAL_ENDPOINT = 'http://127.0.0.1:57431'
const SAVE_RPC = 'reeditpro_save_exact_edit_brief_v1'
const READ_RPC = 'reeditpro_read_exact_edit_brief_v1'
const identity = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

const recordSchema = z.object({
  id: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  briefText: z.string().trim().min(1).max(16_000),
  sourceStorageObjectRecordId: identity,
  sourceMediaAssetId: identity,
  revisionNumber: z.number().int().positive(),
  savedByUserId: identity,
  createdAt: timestamp,
  updatedAt: timestamp,
  contentDigestSha256: digest,
  persistenceAuthority: z.literal('canonical_v3_local_supabase_rls'),
  runtimeSource: z.literal('verified_live'),
  readbackVerified: z.literal(true),
  providerCallMade: z.literal(false),
  workerJobCreated: z.literal(false),
  renderJobCreated: z.literal(false),
  creditReservedOrSpent: z.literal(false),
  supabaseWriteMade: z.literal(true),
  gcsWriteMade: z.literal(false),
  remoteMutationMade: z.literal(false),
  productReady: z.literal(false),
  mockOnly: z.literal(false),
}).strict()

const boundariesSchema = z.object({
  localLoopbackOnly: z.literal(true),
  authenticatedRlsVerified: z.literal(true),
  browserSuppliedAuthorityAccepted: z.literal(false),
  remoteMutationAllowed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const saveReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-v3-local-exact-edit-brief-save-receipt-v1'),
  disposition: z.enum(['inserted', 'idempotent_replay']),
  record: recordSchema,
  transaction: z.object({
    transactionId: identity,
    committedAt: timestamp,
  }).strict(),
  boundaries: boundariesSchema,
}).strict()

const readReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-v3-local-exact-edit-brief-read-receipt-v1'),
  found: z.boolean(),
  record: recordSchema.nullable(),
  boundaries: boundariesSchema,
}).strict()

export function createEditReferenceCanonicalV3LocalExactEditBriefRuntimePortFactory(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
    readonly localInternalSigningSecret: string
  },
): EditReferenceExactEditBriefRuntimePortFactory {
  if (input.endpointOrigin !== CANONICAL_LOCAL_ENDPOINT) {
    throw unavailable('canonical_v3_exact_edit_brief_origin_not_loopback')
  }
  if (!isOpaqueCredential(input.anonKey)) {
    throw unavailable('canonical_v3_exact_edit_brief_anon_key_invalid')
  }
  if (!isSigningSecret(input.localInternalSigningSecret)) {
    throw unavailable('canonical_v3_exact_edit_brief_signing_secret_invalid')
  }
  const anonKey = input.anonKey
  const localInternalSigningSecret = input.localInternalSigningSecret

  return createEditReferenceExactEditBriefRuntimePortFactory({
    createForAuthenticatedRequest({ env, authority }) {
      if (!isCanonicalLocalRuntime(env)) {
        throw unavailable('canonical_v3_exact_edit_brief_runtime_not_local')
      }
      const client = createCanonicalDistributedPrePlanStudyLocalHttpClient({
        endpointOrigin: CANONICAL_LOCAL_ENDPOINT,
        anonKey,
        authenticatedAccessToken: authority.authenticatedAccessToken,
        localInternalSigningSecret,
      })
      return createRequestPort(client, authority.ownerUserId)
    },
  })
}

function createRequestPort(
  client: CanonicalDistributedPrePlanStudyLocalHttpClient,
  ownerUserId: string,
): EditReferenceExactEditBriefRuntimePort {
  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_EXACT_EDIT_BRIEF_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_exact_edit_brief' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    requestScopedAuthenticatedUserAuthority: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    remoteMutationAllowed: false as const,
    productionAuthority: false as const,

    async save(
      input: Parameters<EditReferenceExactEditBriefRuntimePort['save']>[0],
    ) {
      const requestWithoutHash = {
        ownerUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        briefText: input.briefText,
        sourceStorageObjectRecordId: input.sourceStorageObjectRecordId,
        sourceMediaAssetId: input.sourceMediaAssetId,
        idempotencyKey: input.idempotencyKey,
      }
      const request = withHash('save_exact_edit_brief', requestWithoutHash)
      const response = await client.rpc(SAVE_RPC, {
        p_contract_version: 'canonical-distributed-pre-plan-study-state-port-v1',
        p_request: request,
      })
      if (response.error) throw rpcError(SAVE_RPC, response.error)
      const parsed = saveReceiptSchema.safeParse(response.data)
      if (!parsed.success || !matchesScope(parsed.data.record, ownerUserId, input)) {
        throw unavailable('canonical_v3_exact_edit_brief_save_receipt_invalid')
      }
      return {
        record: parsed.data.record,
        disposition: parsed.data.disposition,
      }
    },

    async read(
      input: Parameters<EditReferenceExactEditBriefRuntimePort['read']>[0],
    ) {
      const requestWithoutHash = {
        ownerUserId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        idempotencyKey: readIdempotencyKey(input),
      }
      const request = withHash('read_exact_edit_brief', requestWithoutHash)
      const response = await client.rpc(READ_RPC, {
        p_contract_version: 'canonical-distributed-pre-plan-study-state-port-v1',
        p_request: request,
      })
      if (response.error) throw rpcError(READ_RPC, response.error)
      const parsed = readReceiptSchema.safeParse(response.data)
      if (!parsed.success || parsed.data.found !== Boolean(parsed.data.record)) {
        throw unavailable('canonical_v3_exact_edit_brief_read_receipt_invalid')
      }
      if (
        parsed.data.record
        && !matchesScope(parsed.data.record, ownerUserId, input)
      ) throw unavailable('canonical_v3_exact_edit_brief_read_scope_changed')
      return parsed.data.record ?? undefined
    },
  })
}

function withHash(
  operation: string,
  request: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...request,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(operation, request),
  }
}

function readIdempotencyKey(input: {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}): string {
  return `read-exact-brief:${input.workspaceId}:${input.projectId}:${input.editSessionId}`
}

function matchesScope(
  record: EditReferenceExactEditBriefAuthorityRecord,
  ownerUserId: string,
  input: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  },
): boolean {
  return record.savedByUserId === ownerUserId
    && record.workspaceId === input.workspaceId
    && record.projectId === input.projectId
    && record.editSessionId === input.editSessionId
}

function rpcError(functionName: string, error: unknown): ApiError {
  const safe = error && typeof error === 'object' && !Array.isArray(error)
    ? {
        code: cleanScalar((error as Record<string, unknown>).code),
        status: cleanScalar((error as Record<string, unknown>).status),
      }
    : { code: null, status: null }
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The exact Edit Brief could not be committed through canonical local authority.',
    503,
    {
      functionName,
      ...safe,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}

function cleanScalar(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 && cleaned.length <= 120 ? cleaned : null
}

function isCanonicalLocalRuntime(
  env: Parameters<
    EditReferenceExactEditBriefRuntimePortFactory['createForAuthenticatedRequest']
  >[0]['env'],
): boolean {
  return env.nodeEnv !== 'production'
    && (env.mode === 'local' || env.mode === 'mock')
    && env.storageMode === 'local'
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4_096
}

function isSigningSecret(value: string): boolean {
  return typeof value === 'string' && value.length >= 32 && value.length <= 4_096
}

function unavailable(reason: string): ApiError {
  return new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical local exact Edit Brief runtime is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}
