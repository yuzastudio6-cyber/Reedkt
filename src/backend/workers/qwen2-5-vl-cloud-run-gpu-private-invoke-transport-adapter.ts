import {
  buildQwen25VlPrivateInvokeEnvelope,
  type Qwen25VlPrivateInvokeEnvelope,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import {
  classifyQwen25VlPrivateInvokeResponse,
  type Qwen25VlPrivateInvokeResponseClassification,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-response'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-config'

type JsonRecord = Record<string, unknown>

export type Qwen25VlPrivateInvokeTransportStatus =
  | 'blocked_invalid_envelope'
  | 'blocked_transport_disabled'
  | 'blocked_runtime_approval_missing'
  | 'blocked_transport_dependencies_missing'
  | 'blocked_transport_preview_only'
  | 'completed_transport_response_classified'

export interface Qwen25VlPrivateInvokeRuntimeApproval {
  invocationEnabledNow: boolean
  authReverifyPassed: boolean
  cloudRunServiceDescribeVerified: boolean
  cloudRunIamPolicyVerified: boolean
  runtimeServiceAccountVerified: boolean
  projectInvokerPolicyVerified: boolean
}

export interface Qwen25VlPrivateInvokeTransportTarget {
  project: string
  region: string
  service: string
  runtimeIdentity: string
}

export interface Qwen25VlPrivateInvokeTransportResponse {
  httpStatus: number
  bodyJson?: unknown
}

export interface Qwen25VlPrivateInvokeTransportDependencies {
  resolveServiceUrl: (target: Qwen25VlPrivateInvokeTransportTarget) => Promise<string>
  resolveAudience: (input: {
    target: Qwen25VlPrivateInvokeTransportTarget
    serviceUrl: string
  }) => Promise<string>
  fetchIdentityToken: (audience: string) => Promise<string>
  sendRequest: (input: {
    serviceUrl: string
    audience: string
    identityToken: string
    envelope: Qwen25VlPrivateInvokeEnvelope
    timeoutMs: number
  }) => Promise<Qwen25VlPrivateInvokeTransportResponse>
}

export interface Qwen25VlPrivateInvokeTransportInput {
  queueFixture?: JsonRecord
  runtimeApproval?: Partial<Qwen25VlPrivateInvokeRuntimeApproval>
  dependencies?: Partial<Qwen25VlPrivateInvokeTransportDependencies>
}

export interface Qwen25VlPrivateInvokeTransportResult {
  ok: false
  status: Qwen25VlPrivateInvokeTransportStatus
  decision: 'qwen2_5_vl_cloud_run_gpu_private_invoke_transport_adapter_defined_fail_closed'
  envelopeAcceptedForFutureTransport: boolean
  missingApprovalGates: string[]
  missingDependencies: string[]
  responseClassification?: Qwen25VlPrivateInvokeResponseClassification
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeTransportRuntimeFlags
  warnings: string[]
}

export type Qwen25VlPrivateInvokeTransportRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_transport_adapter_defined_fail_closed' as const

const REQUIRED_APPROVAL_GATES: Array<keyof Qwen25VlPrivateInvokeRuntimeApproval> = [
  'invocationEnabledNow',
  'authReverifyPassed',
  'cloudRunServiceDescribeVerified',
  'cloudRunIamPolicyVerified',
  'runtimeServiceAccountVerified',
  'projectInvokerPolicyVerified',
]

const REQUIRED_DEPENDENCIES: Array<keyof Qwen25VlPrivateInvokeTransportDependencies> = [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
]

const BASE_RUNTIME_FLAGS = {
  transportAdapterDefined: true,
  localEnvelopeValidated: false,
  runtimeApprovalChecked: false,
  transportDependenciesChecked: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  authHeaderCreated: false,
  identityTokenFetched: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  responseClassifiedLocally: false,
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

const DEFAULT_RUNTIME_APPROVAL: Qwen25VlPrivateInvokeRuntimeApproval = {
  invocationEnabledNow: false,
  authReverifyPassed: false,
  cloudRunServiceDescribeVerified: false,
  cloudRunIamPolicyVerified: false,
  runtimeServiceAccountVerified: false,
  projectInvokerPolicyVerified: false,
}

export function createQwen25VlPrivateInvokeRuntimeApproval(
  overrides: Partial<Qwen25VlPrivateInvokeRuntimeApproval> = {},
): Qwen25VlPrivateInvokeRuntimeApproval {
  return {
    ...DEFAULT_RUNTIME_APPROVAL,
    ...overrides,
  }
}

export async function runQwen25VlPrivateInvokeTransportAdapter(
  input: Qwen25VlPrivateInvokeTransportInput = {},
): Promise<Qwen25VlPrivateInvokeTransportResult> {
  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope({
    queueFixture: input.queueFixture,
  })

  if (!envelopeResult.envelopeAcceptedForFutureTransport || !envelopeResult.envelope) {
    return buildBlockedResult({
      status: 'blocked_invalid_envelope',
      envelopeAcceptedForFutureTransport: false,
      message: 'Qwen private invoke transport refused the request before transport because the envelope is invalid.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  const runtimeApproval = createQwen25VlPrivateInvokeRuntimeApproval(input.runtimeApproval)
  const missingApprovalGates = REQUIRED_APPROVAL_GATES
    .filter((gate) => runtimeApproval[gate] !== true)

  if (!runtimeApproval.invocationEnabledNow) {
    return buildBlockedResult({
      status: 'blocked_transport_disabled',
      envelopeAcceptedForFutureTransport: true,
      missingApprovalGates,
      message:
        'Qwen private invoke transport is compiled, but runtime invocation is disabled by default.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
      },
      warnings: [
        'No transport dependency was called.',
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  if (missingApprovalGates.length > 0) {
    return buildBlockedResult({
      status: 'blocked_runtime_approval_missing',
      envelopeAcceptedForFutureTransport: true,
      missingApprovalGates,
      message:
        'Qwen private invoke transport refused before dependency calls because runtime approval gates are incomplete.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
      },
      warnings: [
        'Auth reverify and Cloud Run/IAM evidence must pass before private invocation.',
        'No transport dependency was called.',
      ],
    })
  }

  const dependencies = input.dependencies ?? {}
  const missingDependencies = REQUIRED_DEPENDENCIES
    .filter((dependency) => typeof dependencies[dependency] !== 'function')

  if (missingDependencies.length > 0) {
    return buildBlockedResult({
      status: 'blocked_transport_dependencies_missing',
      envelopeAcceptedForFutureTransport: true,
      missingDependencies,
      message:
        'Qwen private invoke transport refused before runtime calls because transport dependencies were not provided.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
        transportDependenciesChecked: true,
      },
      warnings: [
        'Backend runtime must provide service URL, audience, identity-token, and request dependencies.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  const target = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.targetService
  const serviceUrl = await dependencies.resolveServiceUrl!(target)
  const audience = await dependencies.resolveAudience!({ target, serviceUrl })
  const identityToken = await dependencies.fetchIdentityToken!(audience)
  const transportResponse = await dependencies.sendRequest!({
    serviceUrl,
    audience,
    identityToken,
    envelope: envelopeResult.envelope,
    timeoutMs:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.timeoutMs,
  })
  const responseClassification = classifyQwen25VlPrivateInvokeResponse({
    httpStatus: transportResponse.httpStatus,
    bodyJson: transportResponse.bodyJson,
  })

  return buildBlockedResult({
    status: 'completed_transport_response_classified',
    envelopeAcceptedForFutureTransport: true,
    responseClassification,
    message:
      'Qwen private invoke transport completed a backend transport response classification, but this adapter does not persist runtime state.',
    runtimeFlags: {
      ...BASE_RUNTIME_FLAGS,
      localEnvelopeValidated: true,
      runtimeApprovalChecked: true,
      transportDependenciesChecked: true,
      serviceUrlResolvedNow: true,
      audienceResolvedNow: true,
      authHeaderCreated: true,
      identityTokenFetched: true,
      cloudRunInvocationAttempted: true,
      serviceRuntimeRequestSent: true,
      responseClassifiedLocally: true,
    },
    warnings: [
      'This path is for future approved backend runtime only.',
      'No Supabase, credit, generated-asset, public-artifact, or signed-URL state is mutated by this adapter.',
    ],
  })
}

export function previewQwen25VlPrivateInvokeTransportAdapter(
  input: Qwen25VlPrivateInvokeTransportInput = {},
): Qwen25VlPrivateInvokeTransportResult {
  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope({
    queueFixture: input.queueFixture,
  })

  if (!envelopeResult.envelopeAcceptedForFutureTransport || !envelopeResult.envelope) {
    return buildBlockedResult({
      status: 'blocked_invalid_envelope',
      envelopeAcceptedForFutureTransport: false,
      message:
        'Qwen private invoke transport preview refused the request before transport because the envelope is invalid.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  const runtimeApproval = createQwen25VlPrivateInvokeRuntimeApproval(input.runtimeApproval)
  const missingApprovalGates = REQUIRED_APPROVAL_GATES
    .filter((gate) => runtimeApproval[gate] !== true)

  if (!runtimeApproval.invocationEnabledNow) {
    return buildBlockedResult({
      status: 'blocked_transport_disabled',
      envelopeAcceptedForFutureTransport: true,
      missingApprovalGates,
      message:
        'Qwen private invoke transport preview is fail-closed because runtime invocation is disabled by default.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
      },
      warnings: [
        'No transport dependency was called.',
        'No service URL was resolved.',
        'No identity token was fetched.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  if (missingApprovalGates.length > 0) {
    return buildBlockedResult({
      status: 'blocked_runtime_approval_missing',
      envelopeAcceptedForFutureTransport: true,
      missingApprovalGates,
      message:
        'Qwen private invoke transport preview refused before dependency checks because runtime approval gates are incomplete.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
      },
      warnings: [
        'Auth reverify and Cloud Run/IAM evidence must pass before private invocation.',
        'No transport dependency was called.',
      ],
    })
  }

  const dependencies = input.dependencies ?? {}
  const missingDependencies = REQUIRED_DEPENDENCIES
    .filter((dependency) => typeof dependencies[dependency] !== 'function')

  if (missingDependencies.length > 0) {
    return buildBlockedResult({
      status: 'blocked_transport_dependencies_missing',
      envelopeAcceptedForFutureTransport: true,
      missingDependencies,
      message:
        'Qwen private invoke transport preview refused before runtime calls because transport dependencies were not provided.',
      runtimeFlags: {
        ...BASE_RUNTIME_FLAGS,
        localEnvelopeValidated: true,
        runtimeApprovalChecked: true,
        transportDependenciesChecked: true,
      },
      warnings: [
        'Backend runtime must provide service URL, audience, identity-token, and request dependencies.',
        'No Cloud Run request was sent.',
      ],
    })
  }

  return buildBlockedResult({
    status: 'blocked_transport_preview_only',
    envelopeAcceptedForFutureTransport: true,
    message:
      'Qwen private invoke transport preview reached the future transport boundary but does not call injected dependencies.',
    runtimeFlags: {
      ...BASE_RUNTIME_FLAGS,
      localEnvelopeValidated: true,
      runtimeApprovalChecked: true,
      transportDependenciesChecked: true,
    },
    warnings: [
      'This preview path never resolves service URLs, fetches identity tokens, or sends Cloud Run requests.',
      'Use runQwen25VlPrivateInvokeTransportAdapter only in a future approved backend runtime prompt.',
    ],
  })
}

function buildBlockedResult(input: {
  status: Qwen25VlPrivateInvokeTransportStatus
  envelopeAcceptedForFutureTransport: boolean
  missingApprovalGates?: string[]
  missingDependencies?: string[]
  responseClassification?: Qwen25VlPrivateInvokeResponseClassification
  message: string
  runtimeFlags: Qwen25VlPrivateInvokeTransportRuntimeFlags
  warnings: string[]
}): Qwen25VlPrivateInvokeTransportResult {
  return {
    ok: false,
    status: input.status,
    decision: DECISION,
    envelopeAcceptedForFutureTransport: input.envelopeAcceptedForFutureTransport,
    missingApprovalGates: input.missingApprovalGates ?? [],
    missingDependencies: input.missingDependencies ?? [],
    responseClassification: input.responseClassification,
    message: input.message,
    runtimeFlags: input.runtimeFlags,
    warnings: input.warnings,
  }
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT = {
  adapterId: 'qwen2_5_vl_cloud_run_gpu_private_invoke_transport_adapter',
  decision: DECISION,
  targetService: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.targetService,
  defaultInvocationEnabledNow: false,
  requiresInjectedTransportDependencies: true,
  requiresAuthReverifyPassed: true,
  requiresCloudRunServiceDescribeVerified: true,
  requiresCloudRunIamPolicyVerified: true,
  requiresRuntimeServiceAccountVerified: true,
  requiresProjectInvokerPolicyVerified: true,
  persistsRuntimeOutput: false,
  mutatesSupabase: false,
  createsGeneratedAsset: false,
  createsPublicArtifact: false,
  createsSignedUrl: false,
  spendsCredits: false,
  unlocksBeta: false,
  unlocksProduction: false,
} as const
