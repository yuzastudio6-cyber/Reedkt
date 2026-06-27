import {
  buildQwen25VlPrivateInvokeEnvelope,
  type BuildQwen25VlPrivateInvokeEnvelopeInput,
  type Qwen25VlPrivateInvokeEnvelopeResult,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import {
  classifyQwen25VlPrivateInvokeResponse,
  type Qwen25VlPrivateInvokeResponseClassification,
  type Qwen25VlPrivateInvokeResponseInput,
  type Qwen25VlPrivateInvokeTransportBlocker,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import {
  previewQwen25VlPrivateInvokeTransportAdapter,
  type Qwen25VlPrivateInvokeTransportResult,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'

export type Qwen25VlPrivateInvokeDryRunStatus =
  | 'blocked_envelope_not_accepted'
  | 'blocked_transport_not_attempted'
  | 'blocked_response_not_runtime_advanceable'

export interface Qwen25VlPrivateInvokeDryRunInput
  extends BuildQwen25VlPrivateInvokeEnvelopeInput {
  simulatedResponse?: Qwen25VlPrivateInvokeResponseInput
  transportBlocker?: Qwen25VlPrivateInvokeTransportBlocker
}

export interface Qwen25VlPrivateInvokeDryRunResult {
  ok: false
  status: Qwen25VlPrivateInvokeDryRunStatus
  decision: 'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_coordinator_defined_no_transport'
  envelopeResult: Qwen25VlPrivateInvokeEnvelopeResult
  transportAdapterPreview: Qwen25VlPrivateInvokeTransportResult
  responseClassification: Qwen25VlPrivateInvokeResponseClassification
  runtimeCanAdvanceNow: false
  transportAttemptedNow: false
  invocationAllowedNow: false
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeDryRunRuntimeFlags
  warnings: string[]
}

export type Qwen25VlPrivateInvokeDryRunRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_dry_run_coordinator_defined_no_transport' as const

const BASE_RUNTIME_FLAGS = {
  dryRunCoordinatorDefined: true,
  envelopeAttemptedLocally: true,
  envelopeAcceptedForFutureTransport: false,
  transportAdapterPreviewed: false,
  responseClassifiedLocally: false,
  simulatedResponseUsed: false,
  transportBlockerRecognized: false,
  runtimeCanAdvanceNow: false,
  transportAttemptedNow: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  authHeaderCreated: false,
  identityTokenFetched: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  dispatchSubmitted: false,
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

export function runQwen25VlPrivateInvokeDryRun(
  input: Qwen25VlPrivateInvokeDryRunInput = {},
): Qwen25VlPrivateInvokeDryRunResult {
  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope(input)
  const transportAdapterPreview = previewQwen25VlPrivateInvokeTransportAdapter({
    queueFixture: input.queueFixture,
  })

  if (!envelopeResult.envelopeAcceptedForFutureTransport) {
    const responseClassification = classifyQwen25VlPrivateInvokeResponse({
      transportBlocker: 'unknown_transport_error',
    })
    return {
      ok: false,
      status: 'blocked_envelope_not_accepted',
      decision: DECISION,
      envelopeResult,
      transportAdapterPreview,
      responseClassification,
      runtimeCanAdvanceNow: false,
      transportAttemptedNow: false,
      invocationAllowedNow: false,
      message:
        'Qwen private invoke dry run stopped before transport because the envelope was not accepted.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        transportAdapterPreviewed: true,
        responseClassifiedLocally: true,
      },
      warnings: [
        'No service URL was resolved.',
        'No auth header or identity token was created.',
        'No Cloud Run request was sent.',
      ],
    }
  }

  const responseInput = input.simulatedResponse ?? {
    transportBlocker: input.transportBlocker ?? 'service_unavailable',
  }
  const responseClassification = classifyQwen25VlPrivateInvokeResponse(responseInput)

  return {
    ok: false,
    status: input.simulatedResponse
      ? 'blocked_response_not_runtime_advanceable'
      : 'blocked_transport_not_attempted',
    decision: DECISION,
    envelopeResult,
    transportAdapterPreview,
    responseClassification,
    runtimeCanAdvanceNow: false,
    transportAttemptedNow: false,
    invocationAllowedNow: false,
    message:
      'Qwen private invoke dry run composed envelope and response classification without transport.',
    runtimeFlags: {
      ...BASE_RUNTIME_FLAGS,
      envelopeAcceptedForFutureTransport: true,
      transportAdapterPreviewed: true,
      responseClassifiedLocally: true,
      simulatedResponseUsed: input.simulatedResponse !== undefined,
      transportBlockerRecognized: responseInput.transportBlocker !== undefined,
    },
    warnings: [
      'Dry run coordinator does not resolve service URL or audience.',
      'Dry run coordinator does not create auth headers or fetch identity tokens.',
      'Dry run coordinator does not send Cloud Run requests or persist response output.',
    ],
  }
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_DRY_RUN_CONTRACT = {
  decision: DECISION,
  coordinatesEnvelopeAndResponseClassification: true,
  requiresApprovedSnapshotQueueEnvelope: true,
  defaultTransportBlocker: 'service_unavailable',
  transportAttemptedNow: false,
  invocationAllowedNow: false,
  runtimeCanAdvanceNow: false,
  resolvesServiceUrl: false,
  createsAuthHeader: false,
  fetchesIdentityToken: false,
  invokesCloudRun: false,
  persistsOutput: false,
  mutatesWorkerState: false,
  mutatesSupabase: false,
  spendsCredits: false,
  createsGeneratedAsset: false,
  createsPublicArtifact: false,
  createsSignedUrl: false,
} as const
