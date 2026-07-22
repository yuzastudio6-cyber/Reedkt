import { createHmac } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  canonicalDistributedMediaIngestIdempotencyKeyHash,
} from './canonical-distributed-media-ingest-state-port'
import {
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY,
  type CanonicalDistributedMediaIngestRpcClient,
  type CanonicalDistributedMediaIngestRpcClientResult,
} from './canonical-distributed-media-ingest-state-rpc-adapter'

export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_LOCAL_HTTP_CLIENT_VERSION =
  'canonical-distributed-media-ingest-local-http-client-v1' as const
export const CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_FUNCTION =
  'reeditpro_register_media_ingest_source_v1' as const

const allowedFunctions = new Set<string>([
  CANONICAL_DISTRIBUTED_MEDIA_INGEST_SOURCE_REGISTRATION_FUNCTION,
  ...Object.values(CANONICAL_DISTRIBUTED_MEDIA_INGEST_RPC_REGISTRY.functions),
])
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024
const LOCAL_HTTP_RPC_TIMEOUT_MS = 2 * 60_000

export interface CanonicalDistributedMediaIngestLocalHttpClient
  extends CanonicalDistributedMediaIngestRpcClient {
  readonly schemaVersion:
    typeof CANONICAL_DISTRIBUTED_MEDIA_INGEST_LOCAL_HTTP_CLIENT_VERSION
  readonly endpointOrigin: 'http://127.0.0.1:57431'
  readonly transport: 'postgrest_loopback_http'
  readonly automaticRetryAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly cloudDispatchAllowed: false
  readonly liveGcsObjectReadAllowed: false
  readonly productionAuthority: false
}

/**
 * Disposable local-reset transport. The authenticated user token and signing
 * secret stay inside this server-only closure. A fixed loopback origin and
 * fixed RPC allowlist prevent caller-selected SQL, remote Supabase targets,
 * cloud dispatch, or browser possession of the internal signing authority.
 */
export function createCanonicalDistributedMediaIngestLocalHttpClient(input: {
  readonly endpointOrigin: string
  readonly anonKey: string
  readonly authenticatedAccessToken: string
  readonly localInternalSigningSecret: string
}): CanonicalDistributedMediaIngestLocalHttpClient {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') invalid('origin_not_loopback')
  if (
    !isOpaqueCredential(input.anonKey)
    || !isJwt(input.authenticatedAccessToken)
    || !isOpaqueCredential(input.localInternalSigningSecret)
  ) invalid('credentials_invalid')

  const anonKey = input.anonKey
  const authenticatedAccessToken = input.authenticatedAccessToken
  const localInternalSigningSecret = input.localInternalSigningSecret

  return Object.freeze({
    schemaVersion: CANONICAL_DISTRIBUTED_MEDIA_INGEST_LOCAL_HTTP_CLIENT_VERSION,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    transport: 'postgrest_loopback_http' as const,
    automaticRetryAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    cloudDispatchAllowed: false as const,
    liveGcsObjectReadAllowed: false as const,
    productionAuthority: false as const,
    async rpc(
      functionName: string,
      parameters: {
        p_contract_version: 'canonical-distributed-media-ingest-state-port-v1'
        p_request: Record<string, unknown>
      },
    ): Promise<CanonicalDistributedMediaIngestRpcClientResult> {
      if (!allowedFunctions.has(functionName)) {
        return { data: null, error: { code: 'RPC_FUNCTION_NOT_ALLOWED', status: 403 } }
      }
      if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        return { data: null, error: { code: 'RPC_PARAMETERS_INVALID', status: 400 } }
      }
      const requestHash = safeScalar(parameters.p_request, 'requestHash')
      const idempotencyKey = parameters.p_request.idempotencyKey
      if (typeof requestHash !== 'string' || !/^[a-f0-9]{64}$/u.test(requestHash)) {
        return { data: null, error: { code: 'RPC_REQUEST_HASH_INVALID', status: 400 } }
      }
      if (
        typeof idempotencyKey !== 'string'
        || idempotencyKey.length < 16
        || idempotencyKey.length > 240
        || !/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u.test(idempotencyKey)
        || idempotencyKey.includes('..')
      ) {
        return { data: null, error: { code: 'RPC_IDEMPOTENCY_KEY_INVALID', status: 400 } }
      }
      const signature = createHmac('sha256', localInternalSigningSecret).update(
        `canonical_media_ingest_local_internal_v1:${requestHash}:`
          + canonicalDistributedMediaIngestIdempotencyKeyHash(idempotencyKey),
      ).digest('hex')

      let response: Response
      try {
        response = await fetch(
          `http://127.0.0.1:57431/rest/v1/rpc/${encodeURIComponent(functionName)}`,
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              apikey: anonKey,
              authorization: `Bearer ${authenticatedAccessToken}`,
              'content-type': 'application/json',
              'x-reeditpro-local-media-ingest-authority': signature,
            },
            body: JSON.stringify(parameters),
            cache: 'no-store',
            credentials: 'omit',
            redirect: 'error',
            signal: AbortSignal.timeout(LOCAL_HTTP_RPC_TIMEOUT_MS),
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

export function assertCanonicalDistributedMediaIngestLocalHttpClientIsNotProduction(
  client: CanonicalDistributedMediaIngestLocalHttpClient,
): never {
  void client
  invalid('local_http_client_cannot_be_promoted')
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4096
}

function isJwt(value: string): boolean {
  return isOpaqueCredential(value)
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

function safeScalar(value: unknown, field: string): string | number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const scalar = (value as Record<string, unknown>)[field]
  if (typeof scalar === 'number' && Number.isSafeInteger(scalar)) return scalar
  if (typeof scalar !== 'string') return null
  return /^[A-Za-z0-9_.:-]{1,120}$/u.test(scalar) ? scalar : null
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The canonical media-ingest local Postgres proof client is unavailable or unsafe.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      remoteMutationAttempted: false,
      cloudDispatchAttempted: false,
      liveGcsObjectReadAttempted: false,
      productionAuthority: false,
    },
  )
}
