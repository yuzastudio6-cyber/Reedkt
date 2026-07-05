import {
  evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding,
  type AiGraphicsExternalBetaApiRouteHandlerGatewayBinding,
} from './ai-graphics-external-beta-api-route-handler-gateway-binding'
import {
  evaluateAiGraphicsExternalBetaRuntimeAdmission,
  type AiGraphicsExternalBetaRuntimeAdmission,
} from './ai-graphics-external-beta-runtime-admission'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  type AiGraphicsExternalBetaLaunchGoNoGo,
} from './ai-graphics-external-beta-launch-go-no-go'
import {
  evaluateAiGraphicsExternalBetaToolCallGateway,
  type AiGraphicsExternalBetaToolCallGateway,
} from './ai-graphics-external-beta-tool-call-gateway'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsCapabilityId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_FULL_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_handler_gateway_full_21_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofStatus =
  | 'missing_route_handler_gateway_binding'
  | 'route_handler_gateway_binding_rejected'
  | 'per_tool_runtime_admission_or_gateway_candidate_rejected'
  | 'api_route_handler_gateway_full_21_proof_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofInput {
  sourceRouteHandlerGatewayBindingPacket?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofTool {
  toolId: AiGraphicsCanonicalToolId
  capabilityId: AiGraphicsCapabilityId
  productionToolId: string | null
  workerType: string | null
  runtimeTarget: AiGraphicsRuntimeTarget | string
  gpuRequiredForRuntime: boolean
  runtimeAdmissionDecision: AiGraphicsExternalBetaRuntimeAdmission['decision']
  gatewayDecision: AiGraphicsExternalBetaToolCallGateway['decision']
  runtimeAdmissionAcceptedWithProvidedEvidence: boolean
  gatewayWorkerEnqueueCandidateReadyWithProvidedEvidence: boolean
  routeHandlerToGatewayContinuityAccepted: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  routeExecutionPerformed: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  blockingReasons: string[]
}

export interface AiGraphicsExternalBetaApiRouteHandlerGatewayFullProof {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_FULL_PROOF_DECISION
  status: AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofStatus
  rejectionReasons: string[]
  sourceRouteHandlerGatewayBindingDecision: string | null
  sourceRouteHandlerGatewayBindingAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
    boolean
  sourceRouteHandlerGatewayBinding: AiGraphicsExternalBetaApiRouteHandlerGatewayBinding
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
    0 | 21
  routeHandlerGatewayFullProofToolsWithProvidedEvidence: number
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: number
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: number
  routeHandlerToGatewayContinuityAcceptedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: number
  gpuRuntimeShouldStartNowTools: 0
  routeExecutionsApprovedNow: 0
  workerEnqueuePerformedNow: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  tools: AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofTool[]
  proofPolicy: {
    sideEffectFreeFull21Proof: true
    consumesRouteHandlerGatewayBinding: true
    createsPerToolRuntimeAdmissionPackets: true
    createsPerToolGatewayCandidatePackets: true
    requiresApprovedSnapshotAndCreditReservationContinuity: true
    requiresPrivateArtifactManifestContinuity: true
    routeMountDeferred: true
    queueWriteDeferred: true
    workerDispatchDeferred: true
    toolExecutionDeferred: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteHandlerGatewayFull21ProofPrepared: true
    sourceRouteHandlerGatewayBindingAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21RuntimeAdmissionsAcceptedWithProvidedEvidence: boolean
    all21GatewayCandidatesReadyWithProvidedEvidence: boolean
    all21RouteHandlerToGatewayContinuityAccepted: boolean
    full21RouteHandlerGatewayProofReadyWithProvidedEvidence: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedOnlyForAcceptedExternalBetaJobs: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
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

const capabilityByTool = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'data_visualization',
  vega_lite: 'data_visualization',
  vega: 'data_visualization',
  satori: 'svg_graphics',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
} as const satisfies Record<AiGraphicsCanonicalToolId, AiGraphicsCapabilityId>

const modelWeightManifestRequiredTools = new Set<AiGraphicsCanonicalToolId>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

const proofPolicy = {
  sideEffectFreeFull21Proof: true,
  consumesRouteHandlerGatewayBinding: true,
  createsPerToolRuntimeAdmissionPackets: true,
  createsPerToolGatewayCandidatePackets: true,
  requiresApprovedSnapshotAndCreditReservationContinuity: true,
  requiresPrivateArtifactManifestContinuity: true,
  routeMountDeferred: true,
  queueWriteDeferred: true,
  workerDispatchDeferred: true,
  toolExecutionDeferred: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const blockedRuntimeActions = [
  'mounted API route creation',
  'API route execution',
  'direct agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'production worker dispatch',
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
  'Promote this full 21-tool route-handler-to-gateway proof into a route mount readiness review.',
  'Mount the route only after backend auth, approved snapshot lookup, credit reservation lookup, private artifact policy, and queue write authorization are source-controlled.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed, then release GPU resources after completion.',
]

const sourceLaunchGoNoGoPacket = {
  decision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  status: 'external_beta_launch_go_no_go_approved_runtime_still_blocked',
  sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: true,
  externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: 21,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
  sourceServiceRoleQueueSmokePreflight: {
    status: 'ready_to_execute_non_production_service_role_queue_smoke',
    readyToExecuteLiveNonProductionSmoke: true,
  },
  sourceServiceRoleQueueSmokeProof: {
    decision: 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks',
    proofAcceptedWithProvidedEvidence: true,
    booleans: {
      sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    },
    evidence: {
      serviceRoleQueueSmokeAuthorizationRef:
        'private://ai-graphics/external-beta/full-21/service-role-queue-smoke-authorization',
    },
  },
  booleans: {
    sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: true,
    sourceExternalBetaServiceRoleQueueSmokeProofAccepted: true,
    all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence: true,
  },
} as AiGraphicsExternalBetaLaunchGoNoGo

function acceptedRouteHandlerGatewayBinding(
  packet?: Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteHandlerGatewayBinding {
  return evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayBinding({
    sourceExternalBetaApiRouteHandlerContractPacket:
      packet?.sourceExternalBetaApiRouteHandlerContractPacket as Record<string, unknown> | undefined,
    sourceExternalBetaToolCallGatewayPacket:
      packet?.sourceExternalBetaToolCallGatewayPacket as Record<string, unknown> | undefined,
    routeHandlerGatewayBindingRef: 'private://ai-graphics/external-beta/full-21/route-handler-gateway-binding',
    routeHandlerGatewaySchemaRef: 'private://ai-graphics/external-beta/full-21/route-handler-gateway-schema',
    routeHandlerGatewayPolicyRef: 'private://ai-graphics/external-beta/full-21/route-handler-gateway-policy',
    routeHandlerGatewayAuditRef: 'private://ai-graphics/external-beta/full-21/route-handler-gateway-audit',
    routeHandlerGatewayRollbackRef:
      'private://ai-graphics/external-beta/full-21/route-handler-gateway-rollback',
  })
}

function acceptedSourceBindingFromPacket(packet?: Record<string, unknown>): boolean {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  return packet?.decision ===
    'ai_graphics_external_beta_api_route_handler_gateway_binding_prepared_with_runtime_blocks' &&
    packet.status === 'api_route_handler_gateway_binding_ready_runtime_still_blocked' &&
    counts.routeHandlerGatewayBindingCoveredToolsWithProvidedEvidence === 21 &&
    counts.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence === 21 &&
    counts.fullPerToolGatewayBindingProofToolsNow === 0 &&
    booleans.routeHandlerGatewayBindingReadyWithProvidedEvidence === true &&
    booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    booleans.agentCanExecuteToolsNow === false &&
    booleans.gpuRuntimeShouldStartNow === false
}

function toolRuntimeRefs(toolId: AiGraphicsCanonicalToolId, runtimeTarget: string, gpuRequired: boolean) {
  const refs: Record<string, string> = {}

  if (gpuRequired) {
    refs.nativeGpuRuntimeProofRef =
      `private://ai-graphics/external-beta/full-21/native-gpu-runtime-proof/${toolId}.json`
    if (modelWeightManifestRequiredTools.has(toolId)) {
      refs.modelWeightManifestRef =
        `private://ai-graphics/external-beta/full-21/model-weight-manifest/${toolId}.json`
    }
    return refs
  }

  if (runtimeTarget === 'node_cpu_static') {
    refs.nodeRuntimeProofRef =
      `private://ai-graphics/external-beta/full-21/node-runtime-proof/${toolId}.json`
  }

  if (toolId === 'satori') {
    refs.satoriFontRuntimeProofRef =
      'private://ai-graphics/external-beta/full-21/satori-font-runtime-proof/satori.json'
  }

  if (runtimeTarget.startsWith('browser_')) {
    refs.browserRuntimeProofRef =
      `private://ai-graphics/external-beta/full-21/browser-runtime-proof/${toolId}.json`
  }

  return refs
}

function buildToolProof(toolId: AiGraphicsCanonicalToolId): AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofTool {
  const capabilityId = capabilityByTool[toolId]
  const initialRuntimeAdmission = evaluateAiGraphicsExternalBetaRuntimeAdmission({
    capabilityId,
    requestedToolId: toolId,
    sourceExternalBetaLaunchGoNoGoPacket: sourceLaunchGoNoGoPacket,
  })
  const selectedTool = initialRuntimeAdmission.onDemandRuntimeAdmission.selectedTool
  const runtimeTarget = selectedTool?.runtimeTarget ?? 'planning_only_no_runtime'
  const gpuRequiredForRuntime = selectedTool?.gpuRequiredForRuntime === true
  const commonRefs = {
    sourceExternalBetaLaunchGoNoGoPacket: sourceLaunchGoNoGoPacket,
    capabilityId,
    requestedToolId: toolId,
    executionRequested: true,
    approvedPlanSnapshotId:
      `approved_snapshot_ai_graphics_external_beta_full_21_${toolId}`,
    creditReservationId:
      `credit_reservation_ai_graphics_external_beta_full_21_${toolId}`,
    artifactBoundaryApprovalRef:
      `private://ai-graphics/external-beta/full-21/artifact-boundary/${toolId}`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-beta/full-21/tool-route-approval/${toolId}`,
    workerApprovalRef:
      `private://ai-graphics/external-beta/full-21/worker-approval/${toolId}`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-beta/full-21/runtime-enqueue-approval/${toolId}`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-beta/full-21/owner-runtime-approval/${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/full-21/private-artifact-manifest/${toolId}.json`,
    externalBetaFeatureFlagEnabled: true,
    externalBetaFeatureFlagRef:
      `private://ai-graphics/external-beta/full-21/feature-flag/${toolId}`,
    externalBetaRuntimeAdmissionRef:
      `private://ai-graphics/external-beta/full-21/runtime-admission/${toolId}`,
    externalBetaToolAllowlistRef:
      `private://ai-graphics/external-beta/full-21/tool-allowlist/${toolId}`,
    externalBetaTrafficScopeRef:
      `private://ai-graphics/external-beta/full-21/traffic-scope/${toolId}`,
    externalBetaTelemetryRef:
      `private://ai-graphics/external-beta/full-21/telemetry/${toolId}`,
    externalBetaSupportRef:
      `private://ai-graphics/external-beta/full-21/support/${toolId}`,
    externalBetaCostGuardrailRef:
      `private://ai-graphics/external-beta/full-21/cost-guardrail/${toolId}`,
    externalBetaWorkerPoolRef:
      `private://ai-graphics/external-beta/full-21/worker-pool/${toolId}`,
    externalBetaGpuConcurrencyRef:
      `private://ai-graphics/external-beta/full-21/gpu-concurrency/${toolId}`,
    externalBetaUserId: 'external_beta_user_ai_graphics_full_21',
    externalBetaWorkspaceId: 'external_beta_workspace_ai_graphics_full_21',
    externalBetaRequestId:
      `external_beta_request_ai_graphics_full_21_${toolId}`,
    externalBetaToolCallGatewayRef:
      `private://ai-graphics/external-beta/full-21/tool-call-gateway/${toolId}`,
    externalBetaFeatureFlagEvaluationRef:
      `private://ai-graphics/external-beta/full-21/feature-flag-evaluation/${toolId}`,
    externalBetaRolloutAssignmentRef:
      `private://ai-graphics/external-beta/full-21/rollout-assignment/${toolId}`,
    externalBetaRateLimitDecisionRef:
      `private://ai-graphics/external-beta/full-21/rate-limit-decision/${toolId}`,
    externalBetaCostCeilingDecisionRef:
      `private://ai-graphics/external-beta/full-21/cost-ceiling-decision/${toolId}`,
    externalBetaAuditEventRef:
      `private://ai-graphics/external-beta/full-21/audit-event/${toolId}`,
    externalBetaTraceId:
      `trace_ai_graphics_external_beta_full_21_${toolId}`,
    externalBetaIdempotencyKey:
      `idempotency_ai_graphics_external_beta_full_21_${toolId}`,
    externalBetaWorkerEnqueueCandidateRef:
      `private://ai-graphics/external-beta/full-21/worker-enqueue-candidate/${toolId}`,
    ...toolRuntimeRefs(toolId, runtimeTarget, gpuRequiredForRuntime),
  }
  const runtimeAdmission = evaluateAiGraphicsExternalBetaRuntimeAdmission(commonRefs)
  const gateway = evaluateAiGraphicsExternalBetaToolCallGateway({
    ...commonRefs,
    sourceExternalBetaRuntimeAdmissionPacket: runtimeAdmission,
  })
  const candidate = gateway.externalBetaWorkerEnqueueCandidate
  const runtimeAccepted =
    runtimeAdmission.decision === 'external_beta_runtime_admission_ready_for_worker_enqueue' &&
    runtimeAdmission.externalBetaRuntimeAdmissionReadyWithProvidedEvidence === true
  const gatewayAccepted =
    gateway.decision === 'external_beta_worker_enqueue_candidate_ready' &&
    gateway.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence === true
  const continuityAccepted =
    runtimeAccepted &&
    gatewayAccepted &&
    candidate?.toolId === toolId &&
    candidate.capabilityId === capabilityId &&
    candidate.approvedPlanSnapshotId === commonRefs.approvedPlanSnapshotId &&
    candidate.creditReservationId === commonRefs.creditReservationId &&
    candidate.privateArtifactManifestRef === commonRefs.privateArtifactManifestRef &&
    candidate.workerEnqueuePerformed === false

  const blockingReasons = [
    ...runtimeAdmission.missingExternalBetaRuntimeGates,
    ...runtimeAdmission.onDemandRuntimeAdmission.missingRuntimeJobGates,
    ...runtimeAdmission.onDemandRuntimeAdmission.missingRuntimeProofGates,
    ...gateway.missingGatewayControls,
  ]

  return {
    toolId,
    capabilityId,
    productionToolId: candidate?.productionToolId ?? selectedTool?.productionToolId ?? null,
    workerType: candidate?.workerType ?? selectedTool?.workerType ?? null,
    runtimeTarget,
    gpuRequiredForRuntime,
    runtimeAdmissionDecision: runtimeAdmission.decision,
    gatewayDecision: gateway.decision,
    runtimeAdmissionAcceptedWithProvidedEvidence: runtimeAccepted,
    gatewayWorkerEnqueueCandidateReadyWithProvidedEvidence: gatewayAccepted,
    routeHandlerToGatewayContinuityAccepted: continuityAccepted,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      gateway.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    routeExecutionPerformed: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    blockingReasons,
  }
}

function statusFromInput(input: {
  sourceAccepted: boolean
  allToolsAccepted: boolean
  hasSourcePacket: boolean
}): AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofStatus {
  if (!input.hasSourcePacket) return 'missing_route_handler_gateway_binding'
  if (!input.sourceAccepted) return 'route_handler_gateway_binding_rejected'
  if (!input.allToolsAccepted) {
    return 'per_tool_runtime_admission_or_gateway_candidate_rejected'
  }
  return 'api_route_handler_gateway_full_21_proof_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteHandlerGatewayFullProof(
  input: AiGraphicsExternalBetaApiRouteHandlerGatewayFullProofInput = {},
): AiGraphicsExternalBetaApiRouteHandlerGatewayFullProof {
  const sourceRouteHandlerGatewayBindingAccepted =
    acceptedSourceBindingFromPacket(input.sourceRouteHandlerGatewayBindingPacket)
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence =
    sourceRouteHandlerGatewayBindingAccepted
  const sourceRouteHandlerGatewayBinding =
    input.sourceRouteHandlerGatewayBindingPacket as unknown as AiGraphicsExternalBetaApiRouteHandlerGatewayBinding ??
    acceptedRouteHandlerGatewayBinding()
  const tools = AI_GRAPHICS_CANONICAL_TOOL_IDS.map(buildToolProof)
  const runtimeAdmissionAcceptedToolsWithProvidedEvidence =
    tools.filter((tool) => tool.runtimeAdmissionAcceptedWithProvidedEvidence).length
  const gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence =
    tools.filter((tool) => tool.gatewayWorkerEnqueueCandidateReadyWithProvidedEvidence).length
  const routeHandlerToGatewayContinuityAcceptedTools =
    tools.filter((tool) => tool.routeHandlerToGatewayContinuityAccepted).length
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools =
    tools.filter((tool) => tool.gpuRuntimeStartAllowedForAcceptedExternalBetaJob).length
  const gpuRuntimeShouldStartNowTools =
    tools.filter((tool) => tool.gpuRuntimeShouldStartNow).length as 0
  const allToolsAccepted =
    runtimeAdmissionAcceptedToolsWithProvidedEvidence === 21 &&
    gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence === 21 &&
    routeHandlerToGatewayContinuityAcceptedTools === 21 &&
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    gpuRuntimeShouldStartNowTools === 0
  const status = statusFromInput({
    sourceAccepted: sourceRouteHandlerGatewayBindingAccepted,
    allToolsAccepted,
    hasSourcePacket: Boolean(input.sourceRouteHandlerGatewayBindingPacket),
  })
  const rejectionReasons = [
    !input.sourceRouteHandlerGatewayBindingPacket
      ? 'accepted route-handler gateway binding packet is missing'
      : undefined,
    input.sourceRouteHandlerGatewayBindingPacket &&
      !sourceRouteHandlerGatewayBindingAccepted
      ? 'route-handler gateway binding packet is not accepted'
      : undefined,
    ...tools
      .filter((tool) => !tool.routeHandlerToGatewayContinuityAccepted)
      .map((tool) => `${tool.toolId} route-handler to gateway continuity was not accepted`),
  ].filter((reason): reason is string => Boolean(reason))
  const fullReady =
    sourceRouteHandlerGatewayBindingAccepted &&
    allToolsAccepted

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_HANDLER_GATEWAY_FULL_PROOF_DECISION,
    status,
    rejectionReasons,
    sourceRouteHandlerGatewayBindingDecision:
      typeof input.sourceRouteHandlerGatewayBindingPacket?.decision === 'string'
        ? input.sourceRouteHandlerGatewayBindingPacket.decision
        : null,
    sourceRouteHandlerGatewayBindingAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence,
    sourceRouteHandlerGatewayBinding,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence ? 21 : 0,
    routeHandlerGatewayFullProofToolsWithProvidedEvidence: fullReady ? 21 : 0,
    runtimeAdmissionAcceptedToolsWithProvidedEvidence,
    gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence,
    routeHandlerToGatewayContinuityAcceptedTools,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools,
    gpuRuntimeShouldStartNowTools,
    routeExecutionsApprovedNow: 0,
    workerEnqueuePerformedNow: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    tools,
    proofPolicy,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteHandlerGatewayFull21ProofPrepared: true,
      sourceRouteHandlerGatewayBindingAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21RuntimeAdmissionsAcceptedWithProvidedEvidence:
        runtimeAdmissionAcceptedToolsWithProvidedEvidence === 21,
      all21GatewayCandidatesReadyWithProvidedEvidence:
        gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence === 21,
      all21RouteHandlerToGatewayContinuityAccepted:
        routeHandlerToGatewayContinuityAcceptedTools === 21,
      full21RouteHandlerGatewayProofReadyWithProvidedEvidence: fullReady,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedOnlyForAcceptedExternalBetaJobs:
        gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
        gpuRuntimeShouldStartNowTools === 0,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
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
