import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC,
  EDIT_REFERENCE_DOMAIN_COMMAND_RPC,
  EDIT_REFERENCE_DOMAIN_IDEMPOTENCY_LOOKUP_RPC,
} from './edit-reference-domain-command-contract'
import type {
  EditReferenceProductionRpcClient,
  EditReferenceProductionRpcClientResult,
} from './edit-reference-production-rpc-adapter'

export const EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_HTTP_RPC_CLIENT_VERSION =
  'edit-reference-local-supabase-domain-http-rpc-client-v1' as const

const ALLOWED_RPC_FUNCTIONS = new Set<string>([
  EDIT_REFERENCE_DOMAIN_AGGREGATE_READ_RPC,
  EDIT_REFERENCE_DOMAIN_COMMAND_RPC,
  EDIT_REFERENCE_DOMAIN_IDEMPOTENCY_LOOKUP_RPC,
])
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024

export interface EditReferenceLocalSupabaseDomainHttpRpcClient
  extends EditReferenceProductionRpcClient {
  readonly schemaVersion: typeof EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_HTTP_RPC_CLIENT_VERSION
  readonly endpointOrigin: 'http://127.0.0.1:57431'
  readonly transport: 'postgrest_loopback_service_role_http'
  readonly automaticRetryAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly productionAuthority: false
}

/**
 * Server-only local-reset transport. The service-role credential remains in
 * this closure and only the two explicit domain RPCs can be invoked.
 */
export function createEditReferenceLocalSupabaseDomainHttpRpcClient(input: {
  readonly endpointOrigin: string
  readonly serviceRoleKey: string
}): EditReferenceLocalSupabaseDomainHttpRpcClient {
  const endpointOrigin = assertCanonicalLoopbackOrigin(input.endpointOrigin)
  if (!isJwt(input.serviceRoleKey)) invalid('local_domain_http_credential_invalid')
  const serviceRoleKey = input.serviceRoleKey

  return Object.freeze({
    schemaVersion: EDIT_REFERENCE_LOCAL_SUPABASE_DOMAIN_HTTP_RPC_CLIENT_VERSION,
    endpointOrigin,
    transport: 'postgrest_loopback_service_role_http' as const,
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
              apikey: serviceRoleKey,
              authorization: `Bearer ${serviceRoleKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify(parameters),
            signal: AbortSignal.timeout(15_000),
          },
        )
      } catch {
        return { data: null, error: { code: 'LOCAL_DOMAIN_HTTP_RPC_UNAVAILABLE', status: 503 } }
      }

      const contentLength = Number(response.headers.get('content-length') ?? 0)
      if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
        return { data: null, error: { code: 'LOCAL_DOMAIN_HTTP_RESPONSE_TOO_LARGE', status: 502 } }
      }
      const body = await response.text()
      if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
        return { data: null, error: { code: 'LOCAL_DOMAIN_HTTP_RESPONSE_TOO_LARGE', status: 502 } }
      }
      let payload: unknown
      try {
        payload = body.length > 0 ? JSON.parse(body) : null
      } catch {
        return { data: null, error: { code: 'LOCAL_DOMAIN_HTTP_RESPONSE_INVALID', status: 502 } }
      }
      if (!response.ok) {
        return {
          data: null,
          error: {
            code: safeScalar(payload, 'code') ?? 'LOCAL_DOMAIN_HTTP_RPC_REJECTED',
            status: response.status,
          },
        }
      }
      return { data: payload, error: null }
    },
  })
}

export function assertEditReferenceLocalSupabaseDomainHttpRpcClientIsNotProduction(
  client: EditReferenceLocalSupabaseDomainHttpRpcClient,
): never {
  void client
  return invalid('local_domain_http_client_cannot_be_promoted')
}

function assertCanonicalLoopbackOrigin(
  value: string,
): 'http://127.0.0.1:57431' {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return invalid('local_domain_http_origin_invalid')
  }
  if (
    parsed.origin !== 'http://127.0.0.1:57431'
    || parsed.pathname !== '/'
    || parsed.search
    || parsed.hash
    || parsed.username
    || parsed.password
  ) invalid('local_domain_http_origin_not_canonical_loopback')
  return 'http://127.0.0.1:57431'
}

function isJwt(value: string): boolean {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 4096
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
    'The canonical V3 local Edit Reference domain HTTP proof is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_service_role_only',
      remoteMutationAttempted: false,
      productionAuthority: false,
    },
  )
}
