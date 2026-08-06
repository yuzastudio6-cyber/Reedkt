import { createHmac } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY,
  CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION,
  type CanonicalUploadTargetCredentialEscrowRpcClient,
  type CanonicalUploadTargetCredentialEscrowRpcClientResult,
} from './canonical-upload-target-credential-escrow-rpc-adapter'

export const CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_HTTP_CLIENT_VERSION =
  'canonical-upload-target-credential-escrow-local-http-client-v1' as const

const allowedFunctions = new Set<string>(
  Object.values(CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_REGISTRY.functions),
)
const MAX_RESPONSE_BYTES = 256 * 1024
const LOCAL_HTTP_TIMEOUT_MS = 30_000

export interface CanonicalUploadTargetCredentialEscrowLocalHttpClient
  extends CanonicalUploadTargetCredentialEscrowRpcClient {
  readonly schemaVersion:
    typeof CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_HTTP_CLIENT_VERSION
  readonly endpointOrigin: 'http://127.0.0.1:57431'
  readonly transport: 'postgrest_loopback_http'
  readonly automaticRetryAllowed: false
  readonly remoteDatabaseMutationAllowed: false
  readonly plaintextUploadCredentialAcceptedOrReturned: false
  readonly encryptedEnvelopeAcceptedOrReturned: true
  readonly productionAuthority: false
}

export function createCanonicalUploadTargetCredentialEscrowLocalHttpClient(input: {
  readonly endpointOrigin: string
  readonly anonKey: string
  readonly authenticatedAccessToken: string
  readonly localInternalSigningSecret: string
}): CanonicalUploadTargetCredentialEscrowLocalHttpClient {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431') invalid('origin_not_loopback')
  if (
    !isOpaqueCredential(input.anonKey) ||
    !isJwt(input.authenticatedAccessToken) ||
    !isOpaqueCredential(input.localInternalSigningSecret)
  ) invalid('credentials_invalid')

  const anonKey = input.anonKey
  const authenticatedAccessToken = input.authenticatedAccessToken
  const localInternalSigningSecret = input.localInternalSigningSecret
  return Object.freeze({
    schemaVersion: CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_LOCAL_HTTP_CLIENT_VERSION,
    endpointOrigin: 'http://127.0.0.1:57431' as const,
    transport: 'postgrest_loopback_http' as const,
    automaticRetryAllowed: false as const,
    remoteDatabaseMutationAllowed: false as const,
    plaintextUploadCredentialAcceptedOrReturned: false as const,
    encryptedEnvelopeAcceptedOrReturned: true as const,
    productionAuthority: false as const,
    async rpc(
      functionName: string,
      parameters: Parameters<CanonicalUploadTargetCredentialEscrowRpcClient['rpc']>[1],
    ): Promise<CanonicalUploadTargetCredentialEscrowRpcClientResult> {
      if (!allowedFunctions.has(functionName)) {
        return { data: null, error: { code: 'RPC_FUNCTION_NOT_ALLOWED', status: 403 } }
      }
      if (
        !parameters ||
        typeof parameters !== 'object' ||
        Array.isArray(parameters) ||
        parameters.p_contract_version !==
          CANONICAL_UPLOAD_TARGET_CREDENTIAL_ESCROW_RPC_VERSION
      ) return { data: null, error: { code: 'RPC_PARAMETERS_INVALID', status: 400 } }
      const requestHash = sha256AuthorityValue(parameters.p_request)
      const signature = createHmac('sha256', localInternalSigningSecret).update(
        `canonical_upload_target_local_internal_v1:${functionName}:${requestHash}`,
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
              'x-reeditpro-local-upload-target-authority': signature,
            },
            body: JSON.stringify(parameters),
            cache: 'no-store',
            credentials: 'omit',
            redirect: 'error',
            signal: AbortSignal.timeout(LOCAL_HTTP_TIMEOUT_MS),
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
        payload = body ? JSON.parse(body) : null
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

export function assertCanonicalUploadTargetCredentialEscrowLocalHttpClientIsNotProduction(
  client: CanonicalUploadTargetCredentialEscrowLocalHttpClient,
): never {
  void client
  invalid('local_encrypted_escrow_http_client_cannot_be_promoted')
}

function isOpaqueCredential(value: string): boolean {
  return typeof value === 'string' && value.length >= 20 && value.length <= 4096
}

function isJwt(value: string): boolean {
  return isOpaqueCredential(value) &&
    value.split('.').length === 3 &&
    /^[A-Za-z0-9._-]+$/u.test(value)
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
    'The canonical encrypted upload-target credential escrow client is local-only.',
    503,
    {
      reason,
      endpointClass: 'canonical_loopback_only',
      remoteMutationAttempted: false,
      plaintextUploadCredentialAcceptedOrReturned: false,
      liveCloudKmsVerified: false,
      productionAuthority: false,
    },
  )
}
