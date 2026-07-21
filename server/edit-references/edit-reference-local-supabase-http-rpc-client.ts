import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
} from './edit-reference-production-exact-edit-apply-boundary'
import {
  EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
} from './edit-reference-production-application-lifecycle'
import {
  editReferenceProductionPersistenceContract,
} from './edit-reference-production-persistence-contract'
import type {
  EditReferenceProductionRpcClient,
  EditReferenceProductionRpcClientResult,
} from './edit-reference-production-rpc-adapter'

export const EDIT_REFERENCE_LOCAL_SUPABASE_HTTP_RPC_CLIENT_VERSION =
  'edit-reference-local-supabase-http-rpc-client-v1' as const

const ALLOWED_RPC_FUNCTIONS = new Set<string>([
  EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RPC,
  EDIT_REFERENCE_PRODUCTION_APPLICATION_LIFECYCLE_RPC,
  editReferenceProductionPersistenceContract.planningAuthorityRead.name,
])
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

export interface EditReferenceLocalSupabaseHttpRpcClient
  extends EditReferenceProductionRpcClient {
  readonly schemaVersion: typeof EDIT_REFERENCE_LOCAL_SUPABASE_HTTP_RPC_CLIENT_VERSION
  readonly endpointOrigin: 'http://127.0.0.1:57431'
  readonly transport: 'postgrest_loopback_http'
  readonly automaticRetryAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
}

/**
 * Fixed local PostgREST transport for canonical V3 reset/RLS verification.
 * Credentials stay inside the closure and are never exposed in return values,
 * errors, logs, or receipt evidence. This transport cannot target a remote
 * Supabase project and cannot be promoted to production authority.
 */
export function createEditReferenceLocalSupabaseHttpRpcClient(input: {
  readonly endpointOrigin: string
  readonly anonKey: string
  readonly authenticatedAccessToken: string
}): EditReferenceLocalSupabaseHttpRpcClient {
  const endpointOrigin = assertCanonicalLoopbackOrigin(input.endpointOrigin)
  if (!isOpaqueCredential(input.anonKey) || !isJwt(input.authenticatedAccessToken)) {
    invalid('local_http_rpc_credentials_invalid')
  }
  const anonKey = input.anonKey
  const authenticatedAccessToken = input.authenticatedAccessToken

  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_HTTP_RPC_CLIENT_VERSION,
    endpointOrigin,
    transport: 'postgrest_loopback_http' as const,
    automaticRetryAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    productionAuthority: false as const,
    async rpc(
      functionName: string,
      parameters: Readonly<Record<string, unknown>>,
    ): Promise<EditReferenceProductionRpcClientResult> {
      if (!ALLOWED_RPC_FUNCTIONS.has(functionName)) {
        return { data: null, error: { code: 'RPC_FUNCTION_NOT_ALLOWED', status: 403 } }
      }
      if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        return { data: null, error: { code: 'RPC_PARAMETERS_INVALID', status: 400 } }
      }

      let response: Response
      try {
        response = await fetch(
          `${endpointOrigin}/rest/v1/rpc/${encodeURIComponent(functionName)}`,
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              apikey: anonKey,
              authorization: `Bearer ${authenticatedAccessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify(parameters),
            signal: AbortSignal.timeout(15_000),
          },
        )
      } catch {
        return { data: null, error: { code: 'LOCAL_HTTP_RPC_UNAVAILABLE', status: 503 } }
      }

      const contentLength = Number(response.headers.get('content-length') ?? 0)
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
        return { data: null, error: { code: 'LOCAL_HTTP_RPC_RESPONSE_TOO_LARGE', status: 502 } }
      }
      const body = await response.text()
      if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
        return { data: null, error: { code: 'LOCAL_HTTP_RPC_RESPONSE_TOO_LARGE', status: 502 } }
      }

      let payload: unknown
      try {
        payload = body.length > 0 ? JSON.parse(body) : null
      } catch {
        return { data: null, error: { code: 'LOCAL_HTTP_RPC_RESPONSE_INVALID', status: 502 } }
      }
      if (!response.ok) {
        return {
          data: null,
          error: {
            code: safeScalar(payload, 'code') ?? 'LOCAL_HTTP_RPC_REJECTED',
            status: response.status,
          },
        }
      }
      return { data: payload, error: null }
    },
  })
}

export function assertEditReferenceLocalSupabaseHttpRpcClientIsNotProduction(
  client: EditReferenceLocalSupabaseHttpRpcClient,
): never {
  void client
  invalid('local_http_rpc_client_cannot_be_promoted')
}

function assertCanonicalLoopbackOrigin(
  value: string,
): 'http://127.0.0.1:57431' {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    invalid('local_http_rpc_origin_invalid')
  }
  if (
    parsed.origin !== 'http://127.0.0.1:57431'
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || parsed.username
    || parsed.password
  ) invalid('local_http_rpc_origin_not_canonical_loopback')
  return 'http://127.0.0.1:57431'
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4096
}

function isJwt(value: string): boolean {
  return isOpaqueCredential(value)
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/.test(value)
}

function safeScalar(value: unknown, field: string): string | number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const scalar = (value as Record<string, unknown>)[field]
  if (typeof scalar === 'number' && Number.isSafeInteger(scalar)) return scalar
  if (typeof scalar !== 'string') return null
  return /^[A-Za-z0-9_.:-]{1,80}$/.test(scalar) ? scalar : null
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical V3 local HTTP RPC proof is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      remoteMutationAttempted: false,
      productionAuthority: false,
    },
  )
}
