import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_QA_DECISION,
} from './ai-graphics-external-beta-api-route-mount-implementation-qa'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_CONTRACT_DECISION =
  'ai_graphics_external_beta_api_route_backend_adapter_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteBackendAdapterContractStatus =
  | 'missing_route_mount_implementation_qa_packet'
  | 'route_mount_implementation_qa_rejected'
  | 'missing_backend_adapter_contract_refs'
  | 'backend_adapter_contract_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteBackendAdapterContractInput {
  sourceRouteMountImplementationQaPacket?: Record<string, unknown>
  approvedSnapshotLookupAdapterRef?: string
  creditReservationLookupAdapterRef?: string
  privateArtifactPolicyAdapterRef?: string
  assetManifestBindingAdapterRef?: string
  dependencyReadinessAdapterRef?: string
  asyncCheckbackAdapterRef?: string
  queueSubmissionAuthorizationAdapterRef?: string
  workerEnqueueAuthorizationAdapterRef?: string
  serviceRoleBoundaryAdapterRef?: string
  idempotencyAdapterRef?: string
  rateLimitAdapterRef?: string
  costGuardrailAdapterRef?: string
  auditTelemetryAdapterRef?: string
  killSwitchAdapterRef?: string
  rollbackPlanRef?: string
}

export interface AiGraphicsExternalBetaApiRouteBackendAdapterContract {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_CONTRACT_DECISION
  status: AiGraphicsExternalBetaApiRouteBackendAdapterContractStatus
  rejectionReasons: string[]
  sourceRouteMountImplementationQaDecision: string | null
  sourceRouteMountImplementationQaAccepted: boolean
  backendAdapterContractRefsAccepted: boolean
  missingBackendAdapterContractRefs: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  backendAdapterContractReadyToolsWithProvidedEvidence: 0 | 21
  routeMountImplementationQaAcceptedToolsWithProvidedEvidence: 0 | 21
  apiRouteMountImplementationReadyToolsWithProvidedEvidence: 0 | 21
  apiRouteMountReadyToolsWithProvidedEvidence: 0 | 21
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: 0 | 21
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: 0 | 21
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  liveQueueWriteApprovedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  backendAdapterContract: {
    routePath: '/api/ai-graphics/external-beta/tool-call'
    routeMountStillDeferred: true
    approvedSnapshotLookupRequired: true
    creditReservationLookupRequired: true
    privateArtifactPolicyRequired: true
    assetManifestBindingRequired: true
    dependencyReadinessRequired: true
    asyncCheckbackRequired: true
    queueSubmissionAuthorizationRequired: true
    workerEnqueueAuthorizationRequired: true
    serviceRoleBoundaryRequired: true
    idempotencyRequired: true
    rateLimitRequired: true
    costGuardrailRequired: true
    auditTelemetryRequired: true
    killSwitchRequired: true
    rollbackRequired: true
    approvedSnapshotLookupAdapterRef: string
    creditReservationLookupAdapterRef: string
    privateArtifactPolicyAdapterRef: string
    assetManifestBindingAdapterRef: string
    dependencyReadinessAdapterRef: string
    asyncCheckbackAdapterRef: string
    queueSubmissionAuthorizationAdapterRef: string
    workerEnqueueAuthorizationAdapterRef: string
    serviceRoleBoundaryAdapterRef: string
    idempotencyAdapterRef: string
    rateLimitAdapterRef: string
    costGuardrailAdapterRef: string
    auditTelemetryAdapterRef: string
    killSwitchAdapterRef: string
    rollbackPlanRef: string
  } | null
  adapterPolicy: {
    contractOnly: true
    sourceRouteMountImplementationQaAccepted: boolean
    appMountDeferred: true
    apiRouteExecutionDeferred: true
    approvedSnapshotRequiredBeforeExecution: true
    creditReservationRequiredBeforeExecution: true
    privateArtifactManifestRequiredBeforeExecution: true
    dependencyReadinessRequiredBeforeExecution: true
    asyncCheckbackRequiredBeforeExecution: true
    queueAuthorizationRequiredBeforeExecution: true
    workerAuthorizationRequiredBeforeExecution: true
    noCreditReservationMutationByContract: true
    noPrivateArtifactWriteByContract: true
    noQueueWriteByContract: true
    noWorkerEnqueueByContract: true
    noToolExecutionByContract: true
    noProviderRuntimeByContract: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteBackendAdapterContractPrepared: true
    sourceRouteMountImplementationQaAccepted: boolean
    backendAdapterContractRefsAccepted: boolean
    approvedSnapshotLookupAdapterContractAccepted: boolean
    creditReservationLookupAdapterContractAccepted: boolean
    privateArtifactPolicyAdapterContractAccepted: boolean
    assetManifestBindingAdapterContractAccepted: boolean
    dependencyReadinessAdapterContractAccepted: boolean
    asyncCheckbackAdapterContractAccepted: boolean
    queueSubmissionAuthorizationAdapterContractAccepted: boolean
    workerEnqueueAuthorizationAdapterContractAccepted: boolean
    serviceRoleBoundaryAdapterContractAccepted: boolean
    routeMountBlockedUntilAdapterQa: true
    backendAdapterContractReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerEnqueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const requiredAdapterRefs = [
  'approvedSnapshotLookupAdapterRef',
  'creditReservationLookupAdapterRef',
  'privateArtifactPolicyAdapterRef',
  'assetManifestBindingAdapterRef',
  'dependencyReadinessAdapterRef',
  'asyncCheckbackAdapterRef',
  'queueSubmissionAuthorizationAdapterRef',
  'workerEnqueueAuthorizationAdapterRef',
  'serviceRoleBoundaryAdapterRef',
  'idempotencyAdapterRef',
  'rateLimitAdapterRef',
  'costGuardrailAdapterRef',
  'auditTelemetryAdapterRef',
  'killSwitchAdapterRef',
  'rollbackPlanRef',
] as const

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'approved snapshot mutation',
  'credit reservation mutation',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'QA the backend adapter contract while the route remains unmounted.',
  'Implement no-write backend adapter stubs for approved snapshot lookup, credit reservation lookup, private artifact policy, dependency readiness, queue authorization, and worker enqueue authorization.',
  'Only after adapter QA, mount the route behind feature flags while keeping route execution, queue writes, worker enqueue, and tool execution separately gated.',
]

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  const countValue = counts[key]
  return typeof value === 'number' ? value :
    typeof countValue === 'number' ? countValue :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function acceptedRouteMountImplementationQa(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_QA_DECISION &&
    packet.status === 'route_mount_implementation_qa_passed_runtime_still_blocked' &&
    countFrom(packet, 'routeMountImplementationQaAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'apiRouteMountImplementationReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'routeImplementationContractQaAccepted') === true &&
    booleanFrom(packet, 'appMountStillDeferred') === true &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function isBackendRef(value: unknown): value is string {
  return typeof value === 'string' &&
    (value.startsWith('backend://') || value.startsWith('private-backend://'))
}

function missingAdapterRefs(
  input: AiGraphicsExternalBetaApiRouteBackendAdapterContractInput,
): string[] {
  return requiredAdapterRefs.filter((key) => !isBackendRef(input[key]))
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
  missingRefs: string[]
}): AiGraphicsExternalBetaApiRouteBackendAdapterContractStatus {
  if (!input.hasSource) return 'missing_route_mount_implementation_qa_packet'
  if (!input.sourceAccepted) return 'route_mount_implementation_qa_rejected'
  if (input.missingRefs.length > 0) return 'missing_backend_adapter_contract_refs'
  return 'backend_adapter_contract_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteBackendAdapterContract(
  input: AiGraphicsExternalBetaApiRouteBackendAdapterContractInput = {},
): AiGraphicsExternalBetaApiRouteBackendAdapterContract {
  const sourceAccepted = acceptedRouteMountImplementationQa(
    input.sourceRouteMountImplementationQaPacket,
  )
  const missingRefs = missingAdapterRefs(input)
  const refsAccepted = sourceAccepted && missingRefs.length === 0
  const status = statusFromInput({
    hasSource: Boolean(input.sourceRouteMountImplementationQaPacket),
    sourceAccepted,
    missingRefs,
  })
  const rejectionReasons = [
    !input.sourceRouteMountImplementationQaPacket
      ? 'accepted route mount implementation QA packet is missing'
      : undefined,
    input.sourceRouteMountImplementationQaPacket && !sourceAccepted
      ? 'route mount implementation QA packet is not accepted'
      : undefined,
    sourceAccepted && missingRefs.length > 0
      ? `backend adapter contract refs are missing: ${missingRefs.join(', ')}`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BACKEND_ADAPTER_CONTRACT_DECISION,
    status,
    rejectionReasons,
    sourceRouteMountImplementationQaDecision:
      typeof input.sourceRouteMountImplementationQaPacket?.decision === 'string'
        ? input.sourceRouteMountImplementationQaPacket.decision
        : null,
    sourceRouteMountImplementationQaAccepted: sourceAccepted,
    backendAdapterContractRefsAccepted: refsAccepted,
    missingBackendAdapterContractRefs: missingRefs,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    backendAdapterContractReadyToolsWithProvidedEvidence: refsAccepted ? 21 : 0,
    routeMountImplementationQaAcceptedToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    apiRouteMountImplementationReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    apiRouteMountReadyToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    runtimeAdmissionAcceptedToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      sourceAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    backendAdapterContract: refsAccepted
      ? {
          routePath: '/api/ai-graphics/external-beta/tool-call',
          routeMountStillDeferred: true,
          approvedSnapshotLookupRequired: true,
          creditReservationLookupRequired: true,
          privateArtifactPolicyRequired: true,
          assetManifestBindingRequired: true,
          dependencyReadinessRequired: true,
          asyncCheckbackRequired: true,
          queueSubmissionAuthorizationRequired: true,
          workerEnqueueAuthorizationRequired: true,
          serviceRoleBoundaryRequired: true,
          idempotencyRequired: true,
          rateLimitRequired: true,
          costGuardrailRequired: true,
          auditTelemetryRequired: true,
          killSwitchRequired: true,
          rollbackRequired: true,
          approvedSnapshotLookupAdapterRef: input.approvedSnapshotLookupAdapterRef!,
          creditReservationLookupAdapterRef: input.creditReservationLookupAdapterRef!,
          privateArtifactPolicyAdapterRef: input.privateArtifactPolicyAdapterRef!,
          assetManifestBindingAdapterRef: input.assetManifestBindingAdapterRef!,
          dependencyReadinessAdapterRef: input.dependencyReadinessAdapterRef!,
          asyncCheckbackAdapterRef: input.asyncCheckbackAdapterRef!,
          queueSubmissionAuthorizationAdapterRef: input.queueSubmissionAuthorizationAdapterRef!,
          workerEnqueueAuthorizationAdapterRef: input.workerEnqueueAuthorizationAdapterRef!,
          serviceRoleBoundaryAdapterRef: input.serviceRoleBoundaryAdapterRef!,
          idempotencyAdapterRef: input.idempotencyAdapterRef!,
          rateLimitAdapterRef: input.rateLimitAdapterRef!,
          costGuardrailAdapterRef: input.costGuardrailAdapterRef!,
          auditTelemetryAdapterRef: input.auditTelemetryAdapterRef!,
          killSwitchAdapterRef: input.killSwitchAdapterRef!,
          rollbackPlanRef: input.rollbackPlanRef!,
        }
      : null,
    adapterPolicy: {
      contractOnly: true,
      sourceRouteMountImplementationQaAccepted: sourceAccepted,
      appMountDeferred: true,
      apiRouteExecutionDeferred: true,
      approvedSnapshotRequiredBeforeExecution: true,
      creditReservationRequiredBeforeExecution: true,
      privateArtifactManifestRequiredBeforeExecution: true,
      dependencyReadinessRequiredBeforeExecution: true,
      asyncCheckbackRequiredBeforeExecution: true,
      queueAuthorizationRequiredBeforeExecution: true,
      workerAuthorizationRequiredBeforeExecution: true,
      noCreditReservationMutationByContract: true,
      noPrivateArtifactWriteByContract: true,
      noQueueWriteByContract: true,
      noWorkerEnqueueByContract: true,
      noToolExecutionByContract: true,
      noProviderRuntimeByContract: true,
      onDemandGpuOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteBackendAdapterContractPrepared: true,
      sourceRouteMountImplementationQaAccepted: sourceAccepted,
      backendAdapterContractRefsAccepted: refsAccepted,
      approvedSnapshotLookupAdapterContractAccepted: refsAccepted,
      creditReservationLookupAdapterContractAccepted: refsAccepted,
      privateArtifactPolicyAdapterContractAccepted: refsAccepted,
      assetManifestBindingAdapterContractAccepted: refsAccepted,
      dependencyReadinessAdapterContractAccepted: refsAccepted,
      asyncCheckbackAdapterContractAccepted: refsAccepted,
      queueSubmissionAuthorizationAdapterContractAccepted: refsAccepted,
      workerEnqueueAuthorizationAdapterContractAccepted: refsAccepted,
      serviceRoleBoundaryAdapterContractAccepted: refsAccepted,
      routeMountBlockedUntilAdapterQa: true,
      backendAdapterContractReadyWithProvidedEvidence: refsAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerEnqueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

export function buildAiGraphicsExternalBetaApiRouteBackendAdapterContractInput(
  sourceRouteMountImplementationQaPacket: Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteBackendAdapterContractInput {
  return {
    sourceRouteMountImplementationQaPacket,
    approvedSnapshotLookupAdapterRef:
      'backend://ai-graphics/external-beta/approved-snapshot-lookup-contract',
    creditReservationLookupAdapterRef:
      'backend://ai-graphics/external-beta/credit-reservation-lookup-contract',
    privateArtifactPolicyAdapterRef:
      'backend://ai-graphics/external-beta/private-artifact-policy-contract',
    assetManifestBindingAdapterRef:
      'backend://ai-graphics/external-beta/asset-manifest-binding-contract',
    dependencyReadinessAdapterRef:
      'backend://ai-graphics/external-beta/dependency-readiness-contract',
    asyncCheckbackAdapterRef:
      'backend://ai-graphics/external-beta/async-checkback-contract',
    queueSubmissionAuthorizationAdapterRef:
      'backend://ai-graphics/external-beta/queue-submission-authorization-contract',
    workerEnqueueAuthorizationAdapterRef:
      'backend://ai-graphics/external-beta/worker-enqueue-authorization-contract',
    serviceRoleBoundaryAdapterRef:
      'backend://ai-graphics/external-beta/service-role-boundary-contract',
    idempotencyAdapterRef:
      'backend://ai-graphics/external-beta/idempotency-contract',
    rateLimitAdapterRef:
      'backend://ai-graphics/external-beta/rate-limit-contract',
    costGuardrailAdapterRef:
      'backend://ai-graphics/external-beta/cost-guardrail-contract',
    auditTelemetryAdapterRef:
      'backend://ai-graphics/external-beta/audit-telemetry-contract',
    killSwitchAdapterRef:
      'backend://ai-graphics/external-beta/kill-switch-contract',
    rollbackPlanRef:
      'backend://ai-graphics/external-beta/rollback-contract',
  }
}
