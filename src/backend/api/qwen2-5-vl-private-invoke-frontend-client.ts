import type { ApiRequestEnvelope, ApiResponseEnvelope, ApiRuntimeContext } from './api-runtime-contracts'
import { callReeditProApi, getFrontendApiClientStatus } from './frontend-api-client'
import type {
  Qwen25VlPrivateInvokeDryRunInput,
  Qwen25VlPrivateInvokeDryRunResult,
} from '../workers/qwen2-5-vl-cloud-run-gpu-private-invoke-dry-run'

export const QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID =
  'jobs.qwen2_5_vl.privateInvoke.dryRun' as const

export interface Qwen25VlPrivateInvokeDryRunClientOptions {
  context?: Partial<ApiRuntimeContext>
}

export type Qwen25VlPrivateInvokeDryRunClientInput = Qwen25VlPrivateInvokeDryRunInput
export type Qwen25VlPrivateInvokeDryRunClientResponse =
  ApiResponseEnvelope<Qwen25VlPrivateInvokeDryRunResult>

export function getQwen25VlPrivateInvokeFrontendClientStatus() {
  const apiClient = getFrontendApiClientStatus()

  return {
    mode: 'qwen2_5_vl_private_invoke_frontend_client_mock_only' as const,
    routeId: QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID,
    apiClientMode: apiClient.mode,
    mockOnly: apiClient.mockOnly,
    mayResolveServiceUrl: false,
    mayCreateAuthHeader: false,
    mayFetchIdentityToken: false,
    mayInvokeCloudRun: false,
    mayRunInference: false,
    mayDispatchWorker: false,
    mayMutateSupabase: false,
    mayCreateGeneratedAsset: false,
    mayCreatePublicArtifact: false,
    mayCreateSignedUrl: false,
    warnings: [
      ...apiClient.warnings,
      'Qwen frontend client calls only the mock dry-run API route boundary.',
      'Real Cloud Run private invoke remains backend/worker-only and blocked until future runtime approval.',
    ],
  }
}

export async function callQwen25VlPrivateInvokeDryRun(
  input: Qwen25VlPrivateInvokeDryRunClientInput = {},
  options: Qwen25VlPrivateInvokeDryRunClientOptions = {},
): Promise<Qwen25VlPrivateInvokeDryRunClientResponse> {
  const context: Partial<ApiRequestEnvelope<Qwen25VlPrivateInvokeDryRunClientInput>['context']> = {
    requestId: `qwen-private-invoke-client-${Date.now()}`,
    ...options.context,
    mockOnly: true,
  }

  return callReeditProApi<
    Qwen25VlPrivateInvokeDryRunClientInput,
    Qwen25VlPrivateInvokeDryRunResult
  >(QWEN25_VL_PRIVATE_INVOKE_DRY_RUN_ROUTE_ID, input, { context })
}
