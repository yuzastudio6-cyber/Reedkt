import { createHash } from 'node:crypto'
import type {
  EditReferenceApplicationPreparationReceipt,
} from '../../src/types/edit-reference-production-application-preparation-api'
import {
  stableEditReferenceApplicationPreparationJson,
  validateEditReferenceApplicationPreparationReceipt,
} from './edit-reference-production-application-preparation-boundary'
import { EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION } from './edit-reference-production-persistence-contract'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION,
  type EditReferenceApplicationPreparationRuntimePort,
} from '../services/edit-reference-application-preparation-runtime-port'

export const EDIT_REFERENCE_LOCAL_SUPABASE_APPLICATION_PREPARATION_RPC =
  'prepare_edit_reference_application_v1' as const

export const EDIT_REFERENCE_LOCAL_SUPABASE_APPLICATION_PREPARATION_REQUEST_VERSION =
  'edit-reference-application-preparation-rpc-request-v1' as const

const CANONICAL_LOCAL_ORIGIN = 'http://127.0.0.1:57431' as const
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

/**
 * Constructs a loopback-only, server-credential-backed preparation port for
 * the isolated canonical V3 reset/RLS proof. The service-role credential is
 * retained only inside this closure and is never accepted by prepare().
 */
export function createEditReferenceLocalSupabaseApplicationPreparationPort(input: {
  readonly endpointOrigin: string
  readonly serviceRoleKey: string
}): EditReferenceApplicationPreparationRuntimePort {
  const endpointOrigin = assertCanonicalLoopbackOrigin(input.endpointOrigin)
  if (!isJwt(input.serviceRoleKey)) invalid('local_preparation_service_role_key_invalid')
  const serviceRoleKey = input.serviceRoleKey

  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_APPLICATION_PREPARATION_RUNTIME_PORT_VERSION,
    persistenceContractVersion: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
    authorityClass: 'canonical_preference_application_preparation' as const,
    runtimeClass: 'controlled_local_contract' as const,
    evidenceClass: 'isolated_local_supabase_rls_verified' as const,
    sourceAuthority: 'canonical_v3_local_supabase_rls' as const,
    tenantIsolationVerified: true,
    canonicalReferenceDnaQaAndTargetStudyReadVerified: true,
    durableIdempotentPreparationVerified: true,
    canonicalPreparedApplicationWriteVerified: true,
    browserApplicationRecordAccepted: false as const,
    noLegacyApplicationMutationFallback: true as const,
    applicationLifecycleMutationMade: false as const,
    providerOrWorkerExecutionStarted: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    sameReleaseReadinessEvidenceVerified: false,
    productionAuthority: false,

    async prepare(
      preparationInput: Parameters<EditReferenceApplicationPreparationRuntimePort['prepare']>[0],
    ) {
      const requestWithoutDigest = {
        schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_APPLICATION_PREPARATION_REQUEST_VERSION,
        rpcName: EDIT_REFERENCE_LOCAL_SUPABASE_APPLICATION_PREPARATION_RPC,
        actorUserId: preparationInput.actor.actorUserId,
        workspaceId: preparationInput.intent.workspaceId,
        projectId: preparationInput.projectId,
        editSessionId: preparationInput.editSessionId,
        intent: preparationInput.intent,
        idempotencyKeyHashSha256: preparationInput.idempotencyKeyHashSha256,
        preparationRequestDigestSha256:
          preparationInput.preparationRequestDigestSha256,
        requestedAt: new Date().toISOString(),
        authenticatedScopeReboundServerSide: true as const,
        browserApplicationRecordAccepted: false as const,
        applicationLifecycleMutationAllowed: false as const,
        customerPriceCalculated: false as const,
        customerCreditsMutated: false as const,
        serviceFeeIncluded: false as const,
        providerOrWorkerExecutionStarted: false as const,
      }
      const request = {
        ...requestWithoutDigest,
        rpcRequestDigestSha256: sha256(requestWithoutDigest),
      }
      const payload = await invokeLocalPreparationRpc({
        endpointOrigin,
        serviceRoleKey,
        parameters: {
          p_contract_version: EDIT_REFERENCE_PRODUCTION_PERSISTENCE_CONTRACT_VERSION,
          p_request: request,
        },
      })
      const receipt = firstReceipt(payload)
      validateEditReferenceApplicationPreparationReceipt(receipt)
      if (
        receipt.preparationRequestDigestSha256
          !== preparationInput.preparationRequestDigestSha256
        || receipt.applicationAuthority.workspaceId
          !== preparationInput.intent.workspaceId
        || receipt.applicationAuthority.projectId !== preparationInput.projectId
        || receipt.applicationAuthority.editSessionId !== preparationInput.editSessionId
        || receipt.applicationAuthority.editReferenceId
          !== preparationInput.intent.editReferenceId
        || receipt.applicationAuthority.studySessionId
          !== preparationInput.intent.studySessionId
        || receipt.applicationAuthority.dnaVersionId
          !== preparationInput.intent.dnaVersionId
        || receipt.applicationAuthority.targetUnderstandingPackageDigestSha256
          !== preparationInput.intent.targetUnderstandingPackageDigestSha256
      ) invalid('local_preparation_receipt_scope_mismatch')
      return structuredClone(receipt)
    },
  })
}

export function assertEditReferenceLocalSupabaseApplicationPreparationPortIsNotProduction(
  port: EditReferenceApplicationPreparationRuntimePort,
): void {
  if (
    port.sourceAuthority !== 'canonical_v3_local_supabase_rls'
    || port.evidenceClass !== 'isolated_local_supabase_rls_verified'
    || port.productionAuthority
    || port.sameReleaseReadinessEvidenceVerified
  ) invalid('local_preparation_port_promotion_attempted')
}

async function invokeLocalPreparationRpc(input: {
  readonly endpointOrigin: typeof CANONICAL_LOCAL_ORIGIN
  readonly serviceRoleKey: string
  readonly parameters: Readonly<Record<string, unknown>>
}): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(
      `${input.endpointOrigin}/rest/v1/rpc/${EDIT_REFERENCE_LOCAL_SUPABASE_APPLICATION_PREPARATION_RPC}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          apikey: input.serviceRoleKey,
          authorization: `Bearer ${input.serviceRoleKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(input.parameters),
        signal: AbortSignal.timeout(15_000),
      },
    )
  } catch {
    invalid('local_preparation_rpc_unavailable')
  }
  const body = await response.text()
  if (
    Number(response.headers.get('content-length') ?? 0) > MAX_RESPONSE_BYTES
    || Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES
  ) invalid('local_preparation_rpc_response_too_large')
  let payload: unknown
  try {
    payload = body ? JSON.parse(body) : null
  } catch {
    invalid('local_preparation_rpc_response_invalid')
  }
  if (!response.ok) invalid(`local_preparation_rpc_rejected_${safeCode(payload)}`)
  return payload
}

function firstReceipt(value: unknown): EditReferenceApplicationPreparationReceipt {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    invalid('local_preparation_rpc_receipt_missing')
  }
  return candidate as EditReferenceApplicationPreparationReceipt
}

function assertCanonicalLoopbackOrigin(value: string): typeof CANONICAL_LOCAL_ORIGIN {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    invalid('local_preparation_origin_invalid')
  }
  if (
    parsed.origin !== CANONICAL_LOCAL_ORIGIN
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || parsed.username
    || parsed.password
  ) invalid('local_preparation_origin_not_canonical_loopback')
  return CANONICAL_LOCAL_ORIGIN
}

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(stableEditReferenceApplicationPreparationJson(value))
    .digest('hex')
}

function isJwt(value: string): boolean {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 4096
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/.test(value)
}

function safeCode(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'unknown'
  const code = (value as Record<string, unknown>).code
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(code)
    ? code
    : 'unknown'
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local application-preparation proof is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_server_only',
      browserServiceRoleCredentialAccepted: false,
      remoteMutationAttempted: false,
      productionAuthority: false,
    },
  )
}
