import { ApiError } from '../errors/api-error'
import {
  CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_POSTGRES_RPC_REGISTRY,
  type CanonicalProfessionalGpuFairQueuePostgresRpcClient,
  type CanonicalProfessionalGpuFairQueuePostgresRpcClientResult,
} from './canonical-professional-gpu-fair-queue-postgres-rpc-adapter'

const allowedFunctions = new Set<string>(
  Object.values(CANONICAL_PROFESSIONAL_GPU_FAIR_QUEUE_POSTGRES_RPC_REGISTRY),
)
const maximumResponseBytes = 8 * 1024 * 1024

/** Server-only production PostgREST transport; the credential never escapes. */
export function createCanonicalProfessionalGpuFairQueueServerHttpClient(input: {
  readonly endpointOrigin: string
  readonly serviceRoleKey: string
}): CanonicalProfessionalGpuFairQueuePostgresRpcClient {
  const endpointOrigin = exactHttpsOrigin(input.endpointOrigin)
  if (!isJwt(input.serviceRoleKey)) invalid('service_role_credential_invalid')
  const serviceRoleKey = input.serviceRoleKey
  return Object.freeze({
    async rpc(
      functionName: string,
      parameters: {
        p_contract_version:
          'canonical-professional-gpu-fair-queue-transaction-port-v1'
        p_request: Record<string, unknown>
      },
    ): Promise<CanonicalProfessionalGpuFairQueuePostgresRpcClientResult> {
      if (!allowedFunctions.has(functionName)) {
        return { data: null, error: { code: 'RPC_FUNCTION_NOT_ALLOWED' } }
      }
      let response: Response
      try {
        response = await fetch(
          `${endpointOrigin}/rest/v1/rpc/${encodeURIComponent(functionName)}`,
          {
            method: 'POST',
            redirect: 'error',
            headers: {
              accept: 'application/json',
              apikey: serviceRoleKey,
              authorization: `Bearer ${serviceRoleKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify(parameters),
            signal: AbortSignal.timeout(120_000),
          },
        )
      } catch {
        return { data: null, error: { code: 'POSTGRES_RPC_UNAVAILABLE' } }
      }
      const contentLength = Number(response.headers.get('content-length') ?? 0)
      if ((Number.isFinite(contentLength)
          && contentLength > maximumResponseBytes)) {
        return { data: null, error: { code: 'RPC_RESPONSE_TOO_LARGE' } }
      }
      const body = await response.text()
      if (Buffer.byteLength(body, 'utf8') > maximumResponseBytes) {
        return { data: null, error: { code: 'RPC_RESPONSE_TOO_LARGE' } }
      }
      let data: unknown
      try {
        data = body.length > 0 ? JSON.parse(body) : null
      } catch {
        return { data: null, error: { code: 'RPC_RESPONSE_INVALID' } }
      }
      return response.ok
        ? { data, error: null }
        : {
            data: null,
            error: {
              code: safeErrorCode(data),
              status: response.status,
            },
          }
    },
  })
}

function exactHttpsOrigin(value: string): string {
  let endpoint: URL
  try {
    endpoint = new URL(value)
  } catch {
    invalid('postgres_origin_invalid')
  }
  if (endpoint.protocol !== 'https:'
    || endpoint.username.length > 0
    || endpoint.password.length > 0
    || endpoint.pathname !== '/'
    || endpoint.search.length > 0
    || endpoint.hash.length > 0) invalid('postgres_origin_not_exact_https')
  return endpoint.origin
}

function isJwt(value: string): boolean {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 4096
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

function safeErrorCode(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'POSTGRES_RPC_REJECTED'
  }
  const code = (value as Record<string, unknown>).code
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/u.test(code)
    ? code
    : 'POSTGRES_RPC_REJECTED'
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The server-only professional GPU queue transport is unavailable.',
    503,
    {
      reason,
      browserOrFrontendClientAllowed: false,
      automaticRetryStarted: false,
    },
  )
}
