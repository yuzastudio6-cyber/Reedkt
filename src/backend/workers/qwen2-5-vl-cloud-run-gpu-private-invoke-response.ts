import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

type JsonRecord = Record<string, unknown>

export type Qwen25VlPrivateInvokeTransportBlocker =
  | 'auth_session_requires_reauth'
  | 'service_unavailable'
  | 'timeout'
  | 'network_blocked'
  | 'unknown_transport_error'

export type Qwen25VlPrivateInvokeResponseStatus =
  | 'blocked_transport_auth'
  | 'blocked_transport_unavailable'
  | 'blocked_request_too_large'
  | 'blocked_invalid_json'
  | 'blocked_runtime_contract_rejected'
  | 'blocked_contract_valid_inference_disabled'
  | 'blocked_unexpected_runtime_response'
  | 'accepted_future_metadata_output'

export interface Qwen25VlPrivateInvokeResponseInput {
  httpStatus?: number
  bodyJson?: unknown
  transportBlocker?: Qwen25VlPrivateInvokeTransportBlocker
}

export interface Qwen25VlPrivateInvokeResponseClassification {
  ok: boolean
  status: Qwen25VlPrivateInvokeResponseStatus
  decision: 'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_response_contract_defined_no_runtime_mutation'
  runtimeSchemaVersion: string
  httpStatus?: number
  serviceReason?: string
  contractSatisfiedForFutureRuntime: boolean
  acceptedForFutureMetadataOnly: boolean
  runtimeCanAdvanceNow: false
  persistOutputAllowedNow: false
  creditSpendAllowedNow: false
  retryAllowedNow: false
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeResponseRuntimeFlags
  warnings: string[]
}

export type Qwen25VlPrivateInvokeResponseRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_response_contract_defined_no_runtime_mutation' as const

const RUNTIME_SCHEMA_VERSION =
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion

const BASE_RUNTIME_FLAGS = {
  responseContractDefined: true,
  responseClassifiedLocally: true,
  transportAuthBlockerRecognized: false,
  currentServiceDisabledResponseRecognized: false,
  runtimeContractRejectedResponseRecognized: false,
  futureMetadataOutputShapeRecognized: false,
  runtimeCanAdvanceNow: false,
  persistOutputAllowedNow: false,
  retryScheduledNow: false,
  serviceRuntimeRequestSent: false,
  cloudRunInvocationAttempted: false,
  authHeaderCreated: false,
  identityTokenFetched: false,
  modelImportRun: false,
  modelLoadRun: false,
  vllmEngineInitialized: false,
  promptProcessed: false,
  forwardPassRun: false,
  inferenceRun: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
} as const

export function classifyQwen25VlPrivateInvokeResponse(
  input: Qwen25VlPrivateInvokeResponseInput,
): Qwen25VlPrivateInvokeResponseClassification {
  if (input.transportBlocker) {
    const authBlocked = input.transportBlocker === 'auth_session_requires_reauth'
    return buildClassification({
      status: authBlocked ? 'blocked_transport_auth' : 'blocked_transport_unavailable',
      message: authBlocked
        ? 'Qwen private invocation response is blocked before transport by local auth reauthentication.'
        : 'Qwen private invocation response is blocked before service response handling by transport availability.',
      warnings: [
        'No service runtime request result can be accepted.',
        'No retry is scheduled by this classifier.',
        'No worker, credit, Supabase, asset, or public artifact state may advance.',
      ],
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        transportAuthBlockerRecognized: authBlocked,
      },
    })
  }

  const body = asJsonRecord(input.bodyJson)
  const reason = typeof body.reason === 'string' ? body.reason : undefined
  const contractSatisfied = body.contractSatisfiedForFutureRuntime === true

  if (input.httpStatus === 413 || reason === 'request_too_large') {
    return buildClassification({
      status: 'blocked_request_too_large',
      httpStatus: input.httpStatus,
      serviceReason: reason,
      message: 'Qwen runtime refused the request size before any model execution.',
      warnings: ['The approved-snapshot queue payload must stay within the max request body limit.'],
      runtimeFlags: BASE_RUNTIME_FLAGS,
    })
  }

  if (input.httpStatus === 400 || reason === 'invalid_json') {
    return buildClassification({
      status: 'blocked_invalid_json',
      httpStatus: input.httpStatus,
      serviceReason: reason,
      message: 'Qwen runtime refused a malformed JSON request before contract validation.',
      warnings: ['The backend transport must send only a JSON object envelope body.'],
      runtimeFlags: BASE_RUNTIME_FLAGS,
    })
  }

  if (reason === 'qwen_runtime_contract_rejected') {
    return buildClassification({
      status: 'blocked_runtime_contract_rejected',
      httpStatus: input.httpStatus,
      serviceReason: reason,
      contractSatisfiedForFutureRuntime: false,
      message: 'Qwen runtime rejected the request contract before any inference path.',
      warnings: [
        'Rejected runtime contracts must not create output, credit, asset, retry, or worker success state.',
      ],
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        runtimeContractRejectedResponseRecognized: true,
      },
    })
  }

  if (reason === 'qwen_inference_disabled_after_contract_check') {
    return buildClassification({
      status: 'blocked_contract_valid_inference_disabled',
      httpStatus: input.httpStatus,
      serviceReason: reason,
      contractSatisfiedForFutureRuntime: contractSatisfied,
      message:
        'Qwen runtime accepted the approved-snapshot contract for future execution but inference remains disabled.',
      warnings: [
        'This response is not model output.',
        'Do not persist generated findings or spend credits from an inference-disabled response.',
      ],
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        currentServiceDisabledResponseRecognized: true,
      },
    })
  }

  if (isFutureMetadataOutput(body)) {
    return buildClassification({
      ok: true,
      status: 'accepted_future_metadata_output',
      httpStatus: input.httpStatus,
      serviceReason: reason,
      contractSatisfiedForFutureRuntime: true,
      acceptedForFutureMetadataOnly: true,
      message:
        'Qwen response shape is acceptable for a future metadata-only visual understanding result, but this classifier does not persist it.',
      warnings: [
        'Future callers still need approved persistence, credit, QA, retry, and audit handling before runtime state can advance.',
      ],
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        futureMetadataOutputShapeRecognized: true,
      },
    })
  }

  return buildClassification({
    status: 'blocked_unexpected_runtime_response',
    httpStatus: input.httpStatus,
    serviceReason: reason,
    message: 'Qwen runtime response did not match any accepted fail-closed or future metadata shape.',
    warnings: [
      'Unexpected responses must not create output, credit, asset, retry, or worker success state.',
    ],
    runtimeFlags: BASE_RUNTIME_FLAGS,
  })
}

function buildClassification(input: {
  ok?: boolean
  status: Qwen25VlPrivateInvokeResponseStatus
  httpStatus?: number
  serviceReason?: string
  contractSatisfiedForFutureRuntime?: boolean
  acceptedForFutureMetadataOnly?: boolean
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeResponseRuntimeFlags
  warnings: string[]
}): Qwen25VlPrivateInvokeResponseClassification {
  return {
    ok: input.ok ?? false,
    status: input.status,
    decision: DECISION,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    httpStatus: input.httpStatus,
    serviceReason: input.serviceReason,
    contractSatisfiedForFutureRuntime: input.contractSatisfiedForFutureRuntime ?? false,
    acceptedForFutureMetadataOnly: input.acceptedForFutureMetadataOnly ?? false,
    runtimeCanAdvanceNow: false,
    persistOutputAllowedNow: false,
    creditSpendAllowedNow: false,
    retryAllowedNow: false,
    message: input.message,
    runtimeFlags: input.runtimeFlags,
    warnings: input.warnings,
  }
}

function asJsonRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function isFutureMetadataOutput(body: JsonRecord): boolean {
  return body.ok === true &&
    body.contractSchemaVersion === RUNTIME_SCHEMA_VERSION &&
    body.outputKind === 'metadata_only_visual_understanding' &&
    body.generatedAssetCreated === false &&
    body.publicArtifactCreated === false &&
    body.signedUrlCreated === false &&
    body.creditSpendCreated === false &&
    Array.isArray(body.findings)
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT = {
  decision: DECISION,
  runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
  classifiesCurrentFailClosedServiceResponses: true,
  recognizesTransportAuthBlockers: true,
  acceptsFutureMetadataOnlyOutputShape: true,
  runtimeCanAdvanceNow: false,
  persistOutputAllowedNow: false,
  creditSpendAllowedNow: false,
  retryAllowedNow: false,
  mutatesWorkerState: false,
  mutatesSupabase: false,
  createsGeneratedAsset: false,
  createsPublicArtifact: false,
  createsSignedUrl: false,
} as const
