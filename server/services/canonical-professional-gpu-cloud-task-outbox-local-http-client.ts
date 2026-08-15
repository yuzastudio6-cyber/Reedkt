import { ApiError } from '../errors/api-error'
import {
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RPC_REGISTRY,
  type CanonicalProfessionalGpuCloudTaskOutboxRpcClient,
  type CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult,
} from './canonical-professional-gpu-cloud-task-outbox-postgres-rpc-adapter'

const allowedFunctions = new Set<string>(
  Object.values(CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_OUTBOX_RPC_REGISTRY),
)

export function createCanonicalProfessionalGpuCloudTaskOutboxLocalHttpClient(
  input: {
    readonly endpointOrigin: string
    readonly serviceRoleKey: string
  },
): CanonicalProfessionalGpuCloudTaskOutboxRpcClient {
  if (input.endpointOrigin !== 'http://127.0.0.1:57431'
    || !isJwt(input.serviceRoleKey)) {
    invalid('loopback_origin_or_server_credential_invalid')
  }
  const serviceRoleKey = input.serviceRoleKey
  return Object.freeze({
    async rpc(
      functionName: string,
      parameters: {
        p_contract_version:
          'canonical-professional-gpu-cloud-task-outbox-port-v1'
        p_request: Record<string, unknown>
      },
    ): Promise<CanonicalProfessionalGpuCloudTaskOutboxRpcClientResult> {
      if (!allowedFunctions.has(functionName)) {
        return { data: null, error: { code: 'RPC_FUNCTION_NOT_ALLOWED' } }
      }
      let response: Response
      try {
        response = await fetch(
          `http://127.0.0.1:57431/rest/v1/rpc/${encodeURIComponent(functionName)}`,
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
        return { data: null, error: { code: 'LOCAL_RPC_UNAVAILABLE' } }
      }
      const body = await response.text()
      if (Buffer.byteLength(body, 'utf8') > 8 * 1024 * 1024) {
        return { data: null, error: { code: 'LOCAL_RPC_RESPONSE_TOO_LARGE' } }
      }
      let data: unknown
      try {
        data = body.length > 0 ? JSON.parse(body) : null
      } catch {
        return { data: null, error: { code: 'LOCAL_RPC_RESPONSE_INVALID' } }
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

function isJwt(value: string): boolean {
  return typeof value === 'string'
    && value.length >= 20
    && value.length <= 4096
    && value.split('.').length === 3
    && /^[A-Za-z0-9._-]+$/u.test(value)
}

function safeErrorCode(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'LOCAL_RPC_REJECTED'
  }
  const code = (value as Record<string, unknown>).code
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/u.test(code)
    ? code
    : 'LOCAL_RPC_REJECTED'
}

function invalid(reason: string): never {
  throw new ApiError(
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
    'The local professional GPU Cloud Task outbox client is unavailable.',
    503,
    { reason, endpointClass: 'canonical_loopback_only' },
  )
}
