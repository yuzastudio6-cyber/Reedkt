import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL } from '../mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-approval'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT,
  runQwen25VlCloudRunGpuFailClosedDispatchAdapter,
} from './qwen2-5-vl-cloud-run-gpu-dispatch-adapter'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT,
  buildQwen25VlPrivateInvokeEnvelope,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT } from './qwen2-5-vl-cloud-run-gpu-private-invoke-config'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT,
  createQwen25VlPrivateInvokeRuntimeApproval,
  previewQwen25VlPrivateInvokeTransportAdapter,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT,
  classifyQwen25VlPrivateInvokeResponse,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-response'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_implemented_preflight_required' as const

const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CJ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-PREFLIGHT: verify controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement preflight, no Cloud Run invocation/no inference/no generated assets/no beta' as const

type DependencyEvidence =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.acceptedDependencyPlanEvidence[number]

export type Qwen25VlControlledRealDispatchTransportDependencyEnablementSurfaceId =
  DependencyEvidence['id']

export interface Qwen25VlControlledRealDispatchTransportDependencyEnablementSurface {
  id: Qwen25VlControlledRealDispatchTransportDependencyEnablementSurfaceId
  owner: DependencyEvidence['owner']
  implemented: true
  enabledNow: false
  executionAllowedNow: false
  acceptedForImplementation: true
  requiredEvidence: readonly string[]
}

export interface Qwen25VlControlledRealDispatchTransportDependencyEnablementResult {
  ok: false
  mode: 'qwen2_5_vl_controlled_real_dispatch_transport_dependency_enablement_implementation'
  decision: typeof DECISION
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalDecision:
    typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.decision
  selectedRuntime:
    typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.approvedRuntimePosture
  implementationRecorded: true
  implementationPreflightRequired: true
  dependenciesEnabledNow: false
  readyForRealWorkerDispatch: false
  dependencySurfaces: Qwen25VlControlledRealDispatchTransportDependencyEnablementSurface[]
  dependencyContracts: {
    dispatchAdapterDecision: typeof QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.decision
    privateInvokeEnvelopeDecision: typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT.decision
    privateInvokeConfigMode: typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.mode
    privateInvokeTransportAdapterDecision:
      typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT.decision
    privateInvokeResponseDecision: typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT.decision
  }
  localContractPreview: {
    dispatchAdapterStatus: ReturnType<typeof runQwen25VlCloudRunGpuFailClosedDispatchAdapter>['status']
    dispatchAdapterAcceptsValidatedQueue: boolean
    privateInvokeEnvelopeStatus: ReturnType<typeof buildQwen25VlPrivateInvokeEnvelope>['status']
    privateInvokeEnvelopeAcceptedForFutureTransport: boolean
    privateInvokeTransportPreviewStatus: ReturnType<typeof previewQwen25VlPrivateInvokeTransportAdapter>['status']
    privateInvokeTransportEnvelopeAcceptedForFutureTransport: boolean
    responseClassificationStatus: ReturnType<typeof classifyQwen25VlPrivateInvokeResponse>['status']
    responseClassificationRuntimeCanAdvanceNow: false
  }
  transportDependencyShape: {
    requiredInjectedDependencies: readonly [
      'resolveServiceUrl',
      'resolveAudience',
      'fetchIdentityToken',
      'sendRequest',
    ]
    injectedDependencyCallsAllowedNow: false
    serviceUrlResolutionAllowedNow: false
    audienceResolutionAllowedNow: false
    identityTokenFetchAllowedNow: false
    requestSendAllowedNow: false
  }
  sourceOfTruthRules:
    typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.sourceOfTruthRules
  runtimeFlags: Qwen25VlControlledRealDispatchTransportDependencyEnablementRuntimeFlags
  warnings: readonly string[]
  nextPrompt: typeof NEXT_PROMPT
}

export type Qwen25VlControlledRealDispatchTransportDependencyEnablementRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const BASE_RUNTIME_FLAGS = {
  controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalAccepted:
    true,
  controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRequired:
    false,
  controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRecorded:
    true,
  controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired:
    true,
  serviceRoleLeaseClaimDependencyImplemented: true,
  idempotencyRuntimeMessageDependencyImplemented: true,
  qwenDispatchAdapterDependencyImplemented: true,
  privateInvokeEnvelopeDependencyImplemented: true,
  privateInvokeTransportDependencyImplemented: true,
  responseClassificationDependencyImplemented: true,
  qaAuditCostCreditDependencyImplemented: true,
  cleanupRollbackDependencyImplemented: true,
  betaProductionPublicArtifactLockImplemented: true,
  selectedGpuL4Accepted: true,
  scaleToZeroCostPostureAccepted: true,
  minInstancesZeroAccepted: true,
  initialMaxInstancesOneAccepted: true,
  cpuFallbackDisabledAccepted: true,
  readyForRealWorkerDispatch: false,
  transportDependenciesEnabledNow: false,
  realJobCreated: false,
  realLeaseClaimed: false,
  idempotencyRowCreated: false,
  jobEventCreated: false,
  backendRuntimeMessageCreated: false,
  workerClaimCreated: false,
  storageObjectRecordCreated: false,
  signedUrlEventCreated: false,
  qaReportCreated: false,
  auditEventCreated: false,
  creditMutationCreated: false,
  cloudRunInvocationAttempted: false,
  serviceRuntimeRequestSent: false,
  serviceUrlResolvedNow: false,
  audienceResolvedNow: false,
  identityTokenFetched: false,
  authHeaderCreated: false,
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
  mediaProcessingRun: false,
  renderExportRun: false,
  betaReady: false,
  productionReady: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
} as const

const REQUIRED_INJECTED_DEPENDENCIES = [
  'resolveServiceUrl',
  'resolveAudience',
  'fetchIdentityToken',
  'sendRequest',
] as const

function buildDependencySurfaces(): Qwen25VlControlledRealDispatchTransportDependencyEnablementSurface[] {
  return QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL
    .acceptedDependencyPlanEvidence
    .map((entry) => ({
      id: entry.id,
      owner: entry.owner,
      implemented: true,
      enabledNow: false,
      executionAllowedNow: false,
      acceptedForImplementation: true,
      requiredEvidence: entry.requiredEvidence,
    }))
}

export function implementQwen25VlControlledRealDispatchTransportDependencyEnablement():
  Qwen25VlControlledRealDispatchTransportDependencyEnablementResult {
  const queueFixture =
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const dispatchPreview = runQwen25VlCloudRunGpuFailClosedDispatchAdapter({ queueFixture })
  const envelopePreview = buildQwen25VlPrivateInvokeEnvelope({ queueFixture })
  const transportPreview = previewQwen25VlPrivateInvokeTransportAdapter({
    queueFixture,
    runtimeApproval: createQwen25VlPrivateInvokeRuntimeApproval(),
  })
  const responsePreview = classifyQwen25VlPrivateInvokeResponse({
    httpStatus: 403,
    bodyJson: {
      ok: false,
      reason: 'qwen_inference_disabled_after_contract_check',
      contractSatisfiedForFutureRuntime: true,
      generatedAssetCreated: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      creditSpendCreated: false,
    },
  })

  return {
    ok: false,
    mode: 'qwen2_5_vl_controlled_real_dispatch_transport_dependency_enablement_implementation',
    decision: DECISION,
    upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalDecision:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.decision,
    selectedRuntime:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.approvedRuntimePosture,
    implementationRecorded: true,
    implementationPreflightRequired: true,
    dependenciesEnabledNow: false,
    readyForRealWorkerDispatch: false,
    dependencySurfaces: buildDependencySurfaces(),
    dependencyContracts: {
      dispatchAdapterDecision: QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.decision,
      privateInvokeEnvelopeDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_ENVELOPE_CONTRACT.decision,
      privateInvokeConfigMode: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.mode,
      privateInvokeTransportAdapterDecision:
        QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_TRANSPORT_ADAPTER_CONTRACT.decision,
      privateInvokeResponseDecision: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_RESPONSE_CONTRACT.decision,
    },
    localContractPreview: {
      dispatchAdapterStatus: dispatchPreview.status,
      dispatchAdapterAcceptsValidatedQueue: dispatchPreview.localQueueAcceptedForFutureDispatch,
      privateInvokeEnvelopeStatus: envelopePreview.status,
      privateInvokeEnvelopeAcceptedForFutureTransport:
        envelopePreview.envelopeAcceptedForFutureTransport,
      privateInvokeTransportPreviewStatus: transportPreview.status,
      privateInvokeTransportEnvelopeAcceptedForFutureTransport:
        transportPreview.envelopeAcceptedForFutureTransport,
      responseClassificationStatus: responsePreview.status,
      responseClassificationRuntimeCanAdvanceNow: responsePreview.runtimeCanAdvanceNow,
    },
    transportDependencyShape: {
      requiredInjectedDependencies: REQUIRED_INJECTED_DEPENDENCIES,
      injectedDependencyCallsAllowedNow: false,
      serviceUrlResolutionAllowedNow: false,
      audienceResolutionAllowedNow: false,
      identityTokenFetchAllowedNow: false,
      requestSendAllowedNow: false,
    },
    sourceOfTruthRules:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_APPROVAL.sourceOfTruthRules,
    runtimeFlags: BASE_RUNTIME_FLAGS,
    warnings: [
      'Dependency surfaces are implemented for a future preflight, but no dependency is enabled now.',
      'The private invoke transport preview does not resolve service URLs, fetch identity tokens, or send requests.',
      'Real worker dispatch, Qwen inference, generated assets, beta, and production remain blocked.',
    ],
    nextPrompt: NEXT_PROMPT,
  }
}

export const QWEN2_5_VL_CONTROLLED_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_IMPLEMENTATION =
  implementQwen25VlControlledRealDispatchTransportDependencyEnablement()
