import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  buildAiGraphicsExternalBetaLaunchGoNoGo,
  type AiGraphicsExternalBetaLaunchGoNoGo,
  type AiGraphicsExternalBetaLaunchGoNoGoInput,
} from './ai-graphics-external-beta-launch-go-no-go'
import {
  AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION,
  evaluateAiGraphicsOnDemandRuntimeAdmission,
  type AiGraphicsOnDemandRuntimeAdmission,
  type AiGraphicsOnDemandRuntimeAdmissionInput,
} from './ai-graphics-on-demand-runtime-admission'
export const AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION =
  'ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRuntimeAdmissionStatus =
  | 'planning_metadata_selected'
  | 'missing_external_beta_launch_go_no_go'
  | 'external_beta_runtime_admission_blocked'
  | 'external_beta_runtime_admission_ready_for_worker_enqueue'
  | 'requested_tool_eliminated'
  | 'invalid_capability_blocked'

export interface AiGraphicsExternalBetaRuntimeAdmissionInput
  extends AiGraphicsExternalBetaLaunchGoNoGoInput,
    AiGraphicsOnDemandRuntimeAdmissionInput {
  sourceExternalBetaLaunchGoNoGoPacket?: AiGraphicsExternalBetaLaunchGoNoGo
  externalBetaFeatureFlagEnabled?: boolean
  externalBetaFeatureFlagRef?: string
  externalBetaRuntimeAdmissionRef?: string
  externalBetaToolAllowlistRef?: string
  externalBetaTrafficScopeRef?: string
  externalBetaTelemetryRef?: string
  externalBetaSupportRef?: string
  externalBetaCostGuardrailRef?: string
  externalBetaWorkerPoolRef?: string
  externalBetaGpuConcurrencyRef?: string
}

export interface AiGraphicsExternalBetaRuntimeAdmission {
  decision: AiGraphicsExternalBetaRuntimeAdmissionStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION
  sourceExternalBetaLaunchGoNoGoDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION
  sourceOnDemandRuntimeAdmissionDecision: typeof AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceLaunchGoNoGoAccepted: boolean
  sourceLaunchGoNoGoRuntimeProofBridgeAccepted: boolean
  sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted: boolean
  onDemandRuntimeAdmission: AiGraphicsOnDemandRuntimeAdmission
  sourceLaunchGoNoGo: AiGraphicsExternalBetaLaunchGoNoGo
  missingExternalBetaRuntimeGates: string[]
  externalBetaRuntimeAdmissionReadyWithProvidedEvidence: boolean
  externalBetaWorkerEnqueueAllowedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  runtimeAdmissionPolicy: {
    externalBetaFeatureFlagRequired: true
    rolloutScopeRequired: true
    privateArtifactManifestRequired: true
    toolRouteAndWorkerRequired: true
    creditReservationRequired: true
    costGuardrailRequired: true
    supportAndTelemetryRequired: true
    gpuConcurrencyLimitRequiredForGpuTools: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
    sideEffectFreeAdmissionCheck: true
  }
  booleans: {
    externalBetaRuntimeAdmissionContractPrepared: true
    sourceExternalBetaLaunchGoNoGoAccepted: boolean
    sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted: boolean
    sourceExternalBetaLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted: boolean
    sourceOnDemandRuntimeAdmissionAccepted: boolean
    externalBetaRuntimeAdmissionReadyWithProvidedEvidence: boolean
    externalBetaWorkerEnqueueAllowedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
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
    routeExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const runtimeAdmissionPolicy = {
  externalBetaFeatureFlagRequired: true,
  rolloutScopeRequired: true,
  privateArtifactManifestRequired: true,
  toolRouteAndWorkerRequired: true,
  creditReservationRequired: true,
  costGuardrailRequired: true,
  supportAndTelemetryRequired: true,
  gpuConcurrencyLimitRequiredForGpuTools: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
  sideEffectFreeAdmissionCheck: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function launchGoNoGoRuntimeProofBridgeAccepted(packet: AiGraphicsExternalBetaLaunchGoNoGo): boolean {
  return packet.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted === true &&
    packet.booleans.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted === true
}

function sourceLaunchGoNoGoAccepted(packet: AiGraphicsExternalBetaLaunchGoNoGo): boolean {
  return launchGoNoGoRuntimeProofBridgeAccepted(packet) &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.sourceServiceRoleQueueSmokeProof?.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    hasValue(packet.sourceServiceRoleQueueSmokeProof?.evidence?.serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
    packet.booleans.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted === true &&
    packet.sourceServiceRoleQueueSmokePreflight?.status ===
      'ready_to_execute_non_production_service_role_queue_smoke' &&
    packet.sourceServiceRoleQueueSmokePreflight?.readyToExecuteLiveNonProductionSmoke === true &&
    packet.booleans.sourceExternalBetaServiceRoleQueueSmokeProofAccepted === true &&
    packet.sourceServiceRoleQueueSmokeProof?.decision ===
      'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks' &&
    packet.sourceServiceRoleQueueSmokeProof?.proofAcceptedWithProvidedEvidence === true &&
    packet.status === 'external_beta_launch_go_no_go_approved_runtime_still_blocked' &&
    packet.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
    packet.booleans.all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0
}

function missingExternalRuntimeGates(input: {
  input: AiGraphicsExternalBetaRuntimeAdmissionInput
  launchAccepted: boolean
  onDemandAdmission: AiGraphicsOnDemandRuntimeAdmission
}): string[] {
  const selectedTool = input.onDemandAdmission.selectedTool
  return [
    !input.launchAccepted ? 'external beta launch go/no-go approval is missing' : undefined,
    input.input.externalBetaFeatureFlagEnabled !== true || !hasValue(input.input.externalBetaFeatureFlagRef)
      ? 'external beta feature flag approval is missing'
      : undefined,
    !hasValue(input.input.externalBetaRuntimeAdmissionRef)
      ? 'external beta runtime admission reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaToolAllowlistRef)
      ? 'external beta tool allowlist reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaTrafficScopeRef)
      ? 'external beta rollout traffic scope reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaTelemetryRef)
      ? 'external beta telemetry reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaSupportRef)
      ? 'external beta support ownership reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaCostGuardrailRef)
      ? 'external beta cost guardrail reference is missing'
      : undefined,
    !hasValue(input.input.externalBetaWorkerPoolRef)
      ? 'external beta worker pool reference is missing'
      : undefined,
    selectedTool?.gpuRequiredForRuntime === true &&
      !hasValue(input.input.externalBetaGpuConcurrencyRef)
      ? 'external beta GPU concurrency reference is missing'
      : undefined,
    !input.onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence
      ? 'on-demand runtime job admission is not ready with provided evidence'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function decisionFromInput(input: {
  executionRequested: boolean
  onDemandAdmission: AiGraphicsOnDemandRuntimeAdmission
  launchAccepted: boolean
  ready: boolean
}): AiGraphicsExternalBetaRuntimeAdmissionStatus {
  if (!input.onDemandAdmission.validCapability) return 'invalid_capability_blocked'
  if (!input.onDemandAdmission.selectedTool) return 'requested_tool_eliminated'
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.launchAccepted) return 'missing_external_beta_launch_go_no_go'
  return input.ready
    ? 'external_beta_runtime_admission_ready_for_worker_enqueue'
    : 'external_beta_runtime_admission_blocked'
}

export function evaluateAiGraphicsExternalBetaRuntimeAdmission(
  input: AiGraphicsExternalBetaRuntimeAdmissionInput,
): AiGraphicsExternalBetaRuntimeAdmission {
  const sourceLaunchGoNoGo =
    input.sourceExternalBetaLaunchGoNoGoPacket ??
    buildAiGraphicsExternalBetaLaunchGoNoGo(input)
  const onDemandAdmission = evaluateAiGraphicsOnDemandRuntimeAdmission(input)
  const launchRuntimeProofBridgeAccepted =
    launchGoNoGoRuntimeProofBridgeAccepted(sourceLaunchGoNoGo)
  const sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted =
    sourceLaunchGoNoGo.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    sourceLaunchGoNoGo.sourceServiceRoleQueueSmokeProof?.booleans
      ?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    hasValue(
      sourceLaunchGoNoGo.sourceServiceRoleQueueSmokeProof?.evidence
        ?.serviceRoleQueueSmokeAuthorizationRef ?? undefined,
    )
  const launchAccepted = sourceLaunchGoNoGoAccepted(sourceLaunchGoNoGo)
  const missingExternalBetaRuntimeGates = input.executionRequested === true
    ? missingExternalRuntimeGates({ input, launchAccepted, onDemandAdmission })
    : []
  const externalBetaRuntimeAdmissionReadyWithProvidedEvidence =
    input.executionRequested === true &&
    launchAccepted &&
    onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence &&
    missingExternalBetaRuntimeGates.length === 0
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    externalBetaRuntimeAdmissionReadyWithProvidedEvidence &&
    onDemandAdmission.gpuRuntimeStartAllowedForAcceptedJob

  return {
    decision: decisionFromInput({
      executionRequested: input.executionRequested === true,
      onDemandAdmission,
      launchAccepted,
      ready: externalBetaRuntimeAdmissionReadyWithProvidedEvidence,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_RUNTIME_ADMISSION_DECISION,
    sourceExternalBetaLaunchGoNoGoDecision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
    sourceOnDemandRuntimeAdmissionDecision: AI_GRAPHICS_ON_DEMAND_RUNTIME_ADMISSION_DECISION,
    capabilityId: input.capabilityId,
    requestedToolId: input.requestedToolId ?? null,
    executionRequested: input.executionRequested === true,
    sourceLaunchGoNoGoAccepted: launchAccepted,
    sourceLaunchGoNoGoRuntimeProofBridgeAccepted: launchRuntimeProofBridgeAccepted,
    sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted,
    onDemandRuntimeAdmission: onDemandAdmission,
    sourceLaunchGoNoGo,
    missingExternalBetaRuntimeGates,
    externalBetaRuntimeAdmissionReadyWithProvidedEvidence,
    externalBetaWorkerEnqueueAllowedWithProvidedEvidence:
      externalBetaRuntimeAdmissionReadyWithProvidedEvidence,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    runtimeAdmissionPolicy,
    booleans: {
      externalBetaRuntimeAdmissionContractPrepared: true,
      sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
      sourceExternalBetaLaunchGoNoGoRuntimeProofBridgeAccepted:
        launchRuntimeProofBridgeAccepted,
      sourceExternalBetaLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted:
        sourceLaunchGoNoGoServiceRoleQueueSmokeAuthorizationAccepted,
      sourceOnDemandRuntimeAdmissionAccepted:
        onDemandAdmission.runtimeJobAdmissionReadyWithProvidedEvidence,
      externalBetaRuntimeAdmissionReadyWithProvidedEvidence,
      externalBetaWorkerEnqueueAllowedWithProvidedEvidence:
        externalBetaRuntimeAdmissionReadyWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
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
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

export function buildAiGraphicsExternalBetaRuntimeAdmissionExamples(
  sourceExternalBetaLaunchGoNoGoPacket?: AiGraphicsExternalBetaLaunchGoNoGo,
): AiGraphicsExternalBetaRuntimeAdmission[] {
  const sourcePacketInput = sourceExternalBetaLaunchGoNoGoPacket
    ? { sourceExternalBetaLaunchGoNoGoPacket }
    : {}
  const externalBetaRefs = {
    externalBetaFeatureFlagEnabled: true,
    externalBetaFeatureFlagRef: 'external-beta-runtime://feature-flag-ai-graphics',
    externalBetaRuntimeAdmissionRef: 'external-beta-runtime://runtime-admission',
    externalBetaToolAllowlistRef: 'external-beta-runtime://tool-allowlist',
    externalBetaTrafficScopeRef: 'external-beta-runtime://traffic-scope',
    externalBetaTelemetryRef: 'external-beta-runtime://telemetry',
    externalBetaSupportRef: 'external-beta-runtime://support',
    externalBetaCostGuardrailRef: 'external-beta-runtime://cost-guardrail',
    externalBetaWorkerPoolRef: 'external-beta-runtime://worker-pool',
    externalBetaGpuConcurrencyRef: 'external-beta-runtime://gpu-concurrency',
  } as const
  const commonRuntimeRefs = {
    approvedPlanSnapshotId: 'approved_snapshot_external_beta_fixture',
    creditReservationId: 'credit_reservation_external_beta_fixture',
    artifactBoundaryApprovalRef: 'artifact_boundary_approval_external_beta_fixture',
    toolRouteApprovalRef: 'tool_route_approval_external_beta_fixture',
    workerApprovalRef: 'worker_approval_external_beta_fixture',
    runtimeEnqueueApprovalRef: 'runtime_enqueue_approval_external_beta_fixture',
    ownerRuntimeApprovalRef: 'owner_runtime_approval_external_beta_fixture',
    privateArtifactManifestRef: 'private://ai-graphics/external-beta/artifact-manifest.json',
  } as const

  return [
    evaluateAiGraphicsExternalBetaRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
      ...sourcePacketInput,
    }),
    evaluateAiGraphicsExternalBetaRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
      executionRequested: true,
      ...sourcePacketInput,
    }),
    evaluateAiGraphicsExternalBetaRuntimeAdmission({
      capabilityId: 'background_removal',
      requestedToolId: 'sam2',
      executionRequested: true,
      ...sourcePacketInput,
      ...commonRuntimeRefs,
      ...externalBetaRefs,
      nativeGpuRuntimeProofRef: 'private://ai-graphics/gpu-proof/sam2-proof.json',
      modelWeightManifestRef: 'private://ai-graphics/model-manifests/sam2.json',
    }),
    evaluateAiGraphicsExternalBetaRuntimeAdmission({
      capabilityId: 'chart_overlay',
      requestedToolId: 'd3',
      executionRequested: true,
      ...sourcePacketInput,
      ...commonRuntimeRefs,
      ...externalBetaRefs,
      nodeRuntimeProofRef: 'private://ai-graphics/node-static-proof/d3.json',
    }),
  ]
}
