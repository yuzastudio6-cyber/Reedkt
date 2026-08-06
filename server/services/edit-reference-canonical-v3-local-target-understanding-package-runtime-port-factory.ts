import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  createCanonicalDistributedPrePlanStudyLocalHttpClient,
  type CanonicalDistributedPrePlanStudyLocalHttpClient,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-local-supabase-http-rpc-client'
import {
  canonicalDistributedPrePlanStudyRequestHash,
} from '../distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port'
import {
  validateTargetVideoUnderstandingPackage,
} from '../edit-references/edit-reference-target-video-understanding-contract'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import { ApiError } from '../errors/api-error'
import {
  createEditReferenceTargetUnderstandingPackageRuntimePortFactory,
  EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_PORT_VERSION,
  type EditReferenceTargetUnderstandingPackageRuntimePort,
  type EditReferenceTargetUnderstandingPackageRuntimePortFactory,
} from './edit-reference-target-understanding-package-runtime-port'

export const EDIT_REFERENCE_CANONICAL_V3_LOCAL_TARGET_UNDERSTANDING_PACKAGE_FACTORY_VERSION =
  'edit-reference-canonical-v3-local-target-understanding-package-factory-v1' as const

const CANONICAL_LOCAL_ENDPOINT = 'http://127.0.0.1:57431'
const SAVE_RPC = 'reeditpro_save_target_understanding_package_v1'
const READ_RPC = 'reeditpro_read_latest_target_understanding_package_v1'

const boundariesSchema = z.object({
  localLoopbackOnly: z.literal(true),
  authenticatedRlsVerified: z.literal(true),
  exactTargetSourceAndBriefLineageVerified: z.literal(true),
  canonicalPrePlanRunLineageVerified: z.literal(true),
  browserSuppliedAuthorityAccepted: z.literal(false),
  rawMediaTranscriptFrameOrProviderPayloadPersisted: z.literal(false),
  remoteMutationAllowed: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const saveReceiptSchema = z.object({
  schemaVersion: z.literal(
    'canonical-v3-local-target-understanding-package-save-receipt-v1',
  ),
  disposition: z.enum(['inserted', 'idempotent_replay']),
  package: z.unknown(),
  transaction: z.object({
    transactionId: z.string().uuid(),
    committedAt: z.string().datetime({ offset: true }),
  }).strict(),
  boundaries: boundariesSchema,
}).strict()

const readReceiptSchema = z.object({
  schemaVersion: z.literal(
    'canonical-v3-local-target-understanding-package-read-receipt-v1',
  ),
  found: z.boolean(),
  package: z.unknown().nullable(),
  boundaries: boundariesSchema,
}).strict()

export function createEditReferenceCanonicalV3LocalTargetUnderstandingPackageRuntimePortFactory(
  input: {
    readonly endpointOrigin: string
    readonly anonKey: string
    readonly localInternalSigningSecret: string
  },
): EditReferenceTargetUnderstandingPackageRuntimePortFactory {
  if (input.endpointOrigin !== CANONICAL_LOCAL_ENDPOINT) {
    throw unavailable('canonical_v3_target_package_origin_not_loopback')
  }
  if (!isOpaqueCredential(input.anonKey)) {
    throw unavailable('canonical_v3_target_package_anon_key_invalid')
  }
  if (!isSigningSecret(input.localInternalSigningSecret)) {
    throw unavailable('canonical_v3_target_package_signing_secret_invalid')
  }
  const anonKey = input.anonKey
  const localInternalSigningSecret = input.localInternalSigningSecret

  return createEditReferenceTargetUnderstandingPackageRuntimePortFactory({
    createForAuthenticatedRequest({ env, authority }) {
      if (!isCanonicalLocalRuntime(env)) {
        throw unavailable('canonical_v3_target_package_runtime_not_local')
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
): EditReferenceTargetUnderstandingPackageRuntimePort {
  return Object.freeze({
    schemaVersion:
      EDIT_REFERENCE_TARGET_UNDERSTANDING_PACKAGE_RUNTIME_PORT_VERSION,
    authorityClass: 'canonical_target_understanding_package' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    evidenceClass: 'isolated_local_rls_proof_unreleased' as const,
    requestScopedAuthenticatedUserAuthority: true as const,
    browserSuppliedAuthorityAccepted: false as const,
    rawMediaAccepted: false as const,
    remoteMutationAllowed: false as const,
    productionAuthority: false as const,
    persistence: 'canonical_v3_local_supabase_rls' as const,

    async save(
      input: Parameters<
        EditReferenceTargetUnderstandingPackageRuntimePort['save']
      >[0],
    ) {
      validateTargetVideoUnderstandingPackage(input.package)
      if (
        input.scope.ownerUserId !== ownerUserId
        || input.scope.workspaceId !== input.package.workspaceId
      ) throw unavailable('canonical_v3_target_package_save_scope_invalid')
      const idempotencyKey = packageIdempotencyKey(input.package)
      const request = withHash('save_target_understanding_package', {
        ownerUserId,
        package: structuredClone(input.package),
        idempotencyKey,
      })
      const response = await client.rpc(SAVE_RPC, {
        p_contract_version: 'canonical-distributed-pre-plan-study-state-port-v1',
        p_request: request,
      })
      if (response.error) throw rpcError(SAVE_RPC, response.error)
      const parsed = saveReceiptSchema.safeParse(response.data)
      if (!parsed.success) {
        throw unavailable('canonical_v3_target_package_save_receipt_invalid')
      }
      const packageRecord = parsePackage(parsed.data.package)
      if (!samePackage(packageRecord, input.package)) {
        throw unavailable('canonical_v3_target_package_save_readback_changed')
      }
      const disposition: 'created' | 'idempotent_replay' =
        parsed.data.disposition === 'inserted'
          ? 'created'
          : 'idempotent_replay'
      return {
        package: packageRecord,
        disposition,
        persistence: 'canonical_v3_local_supabase_rls' as const,
        rawMediaPersisted: false as const,
        rawTranscriptPersisted: false as const,
        signedUrlPersisted: false as const,
        localFilePathPersisted: false as const,
        customerPriceCalculated: false as const,
        customerCreditsMutated: false as const,
        remoteMutationMade: false as const,
      }
    },

    async readLatest(
      input: Parameters<
        EditReferenceTargetUnderstandingPackageRuntimePort['readLatest']
      >[0],
    ) {
      if (input.scope.ownerUserId !== ownerUserId) {
        throw unavailable('canonical_v3_target_package_read_scope_invalid')
      }
      const request = withHash('read_latest_target_understanding_package', {
        ownerUserId,
        workspaceId: input.scope.workspaceId,
        ...structuredClone(input.binding),
        idempotencyKey: readIdempotencyKey(ownerUserId, input),
      })
      const response = await client.rpc(READ_RPC, {
        p_contract_version: 'canonical-distributed-pre-plan-study-state-port-v1',
        p_request: request,
      })
      if (response.error) throw rpcError(READ_RPC, response.error)
      const parsed = readReceiptSchema.safeParse(response.data)
      if (
        !parsed.success
        || parsed.data.found !== (parsed.data.package !== null)
      ) throw unavailable('canonical_v3_target_package_read_receipt_invalid')
      if (!parsed.data.package) return undefined
      const packageRecord = parsePackage(parsed.data.package)
      if (!matchesBinding(packageRecord, input.scope.workspaceId, input.binding)) {
        throw unavailable('canonical_v3_target_package_read_scope_changed')
      }
      return packageRecord
    },
  })
}

function parsePackage(value: unknown): TargetVideoUnderstandingPackage {
  const packageRecord = structuredClone(value) as TargetVideoUnderstandingPackage
  try {
    validateTargetVideoUnderstandingPackage(packageRecord)
  } catch {
    throw unavailable('canonical_v3_target_package_record_invalid')
  }
  return packageRecord
}

function samePackage(
  left: TargetVideoUnderstandingPackage,
  right: TargetVideoUnderstandingPackage,
): boolean {
  return left.packageId === right.packageId
    && left.packageDigestSha256 === right.packageDigestSha256
    && stableStringify(left) === stableStringify(right)
}

function matchesBinding(
  packageRecord: TargetVideoUnderstandingPackage,
  workspaceId: string,
  binding: Parameters<
    EditReferenceTargetUnderstandingPackageRuntimePort['readLatest']
  >[0]['binding'],
): boolean {
  return packageRecord.workspaceId === workspaceId
    && packageRecord.projectId === binding.projectId
    && packageRecord.editSessionId === binding.editSessionId
    && packageRecord.editReferenceId === binding.editReferenceId
    && packageRecord.studySessionId === binding.studySessionId
    && packageRecord.source.storageObjectRecordId
      === binding.storageObjectRecordId
    && packageRecord.declaredContext.editBriefDigestSha256
      === binding.editBriefDigestSha256
}

function withHash(
  operation: string,
  request: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...request,
    requestHash: canonicalDistributedPrePlanStudyRequestHash(
      operation,
      request,
    ),
  }
}

function packageIdempotencyKey(
  packageRecord: TargetVideoUnderstandingPackage,
): string {
  return `persist-target-package:${packageRecord.packageId}:${packageRecord.packageDigestSha256}`
}

function readIdempotencyKey(
  ownerUserId: string,
  input: Parameters<
    EditReferenceTargetUnderstandingPackageRuntimePort['readLatest']
  >[0],
): string {
  return `read-target-package:${sha256(stableStringify({
    ownerUserId,
    workspaceId: input.scope.workspaceId,
    binding: input.binding,
  }))}`
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
    'The target-video understanding package could not be committed through canonical local authority.',
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
    EditReferenceTargetUnderstandingPackageRuntimePortFactory['createForAuthenticatedRequest']
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
    'The canonical local target-video understanding package runtime is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}
