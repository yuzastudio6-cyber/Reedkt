import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaToolRouteRuntimeProof,
} from './ai-graphics-external-beta-tool-route-runtime-proof'
import type { AiGraphicsGpuRuntimeProofResultPacket } from './ai-graphics-gpu-runtime-proof-result'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_RUNTIME_PROOF_DECISION =
  'ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks'

export type AiGraphicsExternalBetaPerToolRuntimeProofStatus =
  | 'missing_external_beta_tool_route_runtime_proof'
  | 'external_beta_tool_route_runtime_proof_rejected'
  | 'missing_external_beta_per_tool_runtime_proof_controls'
  | 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks'
  | 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks'

export interface AiGraphicsRuntimeProofPacket {
  decision?: string
  status?: string
  tools?: Array<{
    toolId?: string
    status?: string
    publicArtifactCreated?: boolean
    agentExecutableNow?: boolean
    routeExecutionUsed?: boolean
    workerExecutionUsed?: boolean
    providerRuntimeUsed?: boolean
  }>
  tool?: {
    toolId?: string
    status?: string
    publicArtifactCreated?: boolean
    agentExecutableNow?: boolean
    routeExecutionUsed?: boolean
    workerExecutionUsed?: boolean
    providerRuntimeUsed?: boolean
  }
  booleans?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaPerToolRuntimeProofInput {
  sourceToolRouteRuntimeProofPacket?: AiGraphicsExternalBetaToolRouteRuntimeProof
  nodeRuntimeProofPacket?: AiGraphicsRuntimeProofPacket
  browserRuntimeProofPacket?: AiGraphicsRuntimeProofPacket
  satoriFontRuntimeProofPacket?: AiGraphicsRuntimeProofPacket
  gpuRuntimeProofResultPacket?: AiGraphicsGpuRuntimeProofResultPacket
  externalBetaPerToolRuntimeProofPolicyRef?: string
  externalBetaPerToolRuntimeProofSchemaRef?: string
  externalBetaRuntimeProofEvidenceRef?: string
  externalBetaRuntimeProofTelemetryRef?: string
  externalBetaRuntimeProofRollbackRef?: string
}

export type AiGraphicsExternalBetaPerToolRuntimeProofSource =
  | 'node_runtime_proof'
  | 'browser_runtime_proof'
  | 'satori_font_runtime_proof'
  | 'native_gpu_runtime_proof'

export type AiGraphicsExternalBetaPerToolRuntimeProofRecordStatus =
  | 'runtime_proof_accepted_with_provided_evidence'
  | 'blocked_pending_native_gpu_runtime_proof'
  | 'blocked_missing_js_runtime_proof'
  | 'blocked_source_route_runtime_proof_missing'
  | 'blocked_runtime_proof_controls_missing'

export interface AiGraphicsExternalBetaPerToolRuntimeProofRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: string[]
  runtimeProofSource: AiGraphicsExternalBetaPerToolRuntimeProofSource
  runtimeProofStatus: AiGraphicsExternalBetaPerToolRuntimeProofRecordStatus
  sourceProofStatus: string | null
  routeRuntimeProofAccepted: boolean
  runtimeProofAcceptedWithProvidedEvidence: boolean
  blockedReason: string | null
  gpuRuntimeTargeted: boolean
  gpuRuntimeOnDemandOnly: true
  noIdleGpuRuntimeApproved: true
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  publicArtifactAllowed: false
  signedUrlAllowed: false
}

export interface AiGraphicsExternalBetaPerToolRuntimeProof {
  decision: AiGraphicsExternalBetaPerToolRuntimeProofStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_RUNTIME_PROOF_DECISION
  sourceToolRouteRuntimeProofAccepted: boolean
  missingPerToolRuntimeProofControls: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  runtimeProofRecordsPrepared: 21
  runtimeProofAcceptedWithProvidedEvidenceTools: number
  jsRuntimeProofAcceptedWithProvidedEvidenceTools: number
  nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: number
  blockedPendingNativeGpuRuntimeProofTools: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  acceptedPrivateRefNamespaces: string[]
  forbiddenRuntimeProofRefPatterns: string[]
  records: AiGraphicsExternalBetaPerToolRuntimeProofRecord[]
  policy: {
    sourceToolRouteRuntimeProofRequired: true
    nodeRuntimeProofRequiredForNodeStaticTools: true
    browserRuntimeProofRequiredForBrowserTools: true
    satoriFontRuntimeProofRequiredForSatori: true
    nativeGpuRuntimeProofRequiredForGpuTools: true
    runtimeProofPolicyRequired: true
    runtimeProofSchemaRequired: true
    runtimeProofEvidenceRequired: true
    runtimeProofTelemetryRequired: true
    runtimeProofRollbackRequired: true
    runtimeProofOnlyNoToolExecution: true
    runtimeProofOnlyNoRouteExecution: true
    runtimeProofOnlyNoWorkerDispatch: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresNativeGpuRuntimeProofFor8Tools: true
  }
  booleans: {
    externalBetaPerToolRuntimeProofPrepared: true
    sourceToolRouteRuntimeProofAccepted: boolean
    perToolRuntimeProofControlsAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all13JsRuntimeProofsAccepted: boolean
    all8NativeGpuRuntimeProofsAccepted: boolean
    nativeGpuRuntimeProofResultsAcceptedForOwnerReview: boolean
    blockedPendingNativeGpuRuntimeProofTools: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
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
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
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

const nodeRuntimeProofTools = {
  d3: 'node_runtime_proof_passed',
  vega_lite: 'node_runtime_compile_passed',
  vega: 'node_runtime_parse_passed',
  svgdotjs_svg_js: 'node_runtime_svg_construction_passed',
  viz_js: 'node_runtime_dot_to_svg_passed',
} as const satisfies Partial<Record<AiGraphicsCanonicalToolId, string>>

const browserRuntimeProofTools = {
  echarts: 'browser_svg_chart_runtime_proof_passed',
  lottie_web: 'browser_svg_animation_runtime_proof_passed',
  animejs: 'browser_dom_animation_runtime_proof_passed',
  three_js: 'browser_webgl_runtime_proof_passed',
  pixi_js: 'browser_canvas_webgl_runtime_proof_passed',
  konva: 'browser_canvas_runtime_proof_passed',
  babylonjs: 'browser_webgl_runtime_proof_passed',
} as const satisfies Partial<Record<AiGraphicsCanonicalToolId, string>>

const gpuRuntimeTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const gpuRuntimeToolSet = new Set<AiGraphicsCanonicalToolId>(gpuRuntimeTools)

const acceptedPrivateRefNamespaces = [
  'private://',
  'reeditpro-private://',
  'backend-evidence://',
  'external-beta-evidence://',
]

const forbiddenRuntimeProofRefPatterns = [
  'http://',
  'https://',
  'signed-url://',
  'public://',
  'gs://',
  'gcs://',
]

function productCapabilities(): string[] {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ))
}

function productCapabilityCount(): 12 {
  return productCapabilities().length as 12
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafePrivateRef(value?: string | null): boolean {
  if (!hasValue(value ?? undefined)) return false
  const ref = String(value).trim()
  if (forbiddenRuntimeProofRefPatterns.some((pattern) => ref.startsWith(pattern))) return false
  const acceptedPrefix = acceptedPrivateRefNamespaces.find((prefix) => ref.startsWith(prefix))
  if (!acceptedPrefix) return false
  const suffix = ref.slice(acceptedPrefix.length)
  return suffix.length > 0 && /^[a-z0-9_.:/-]+$/i.test(suffix)
}

function sourceRouteAccepted(packet?: AiGraphicsExternalBetaToolRouteRuntimeProof): boolean {
  return Boolean(packet) &&
    packet?.decision === 'external_beta_tool_route_runtime_proof_ready_with_runtime_blocks' &&
    packet.sourcePrivateArtifactManifestAccepted === true &&
    packet.toolRouteRuntimeProofReadyWithProvidedEvidence === true &&
    packet.toolRouteRecordsPrepared === 21 &&
    packet.toolRouteRecordsReadyWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function missingControls(input: AiGraphicsExternalBetaPerToolRuntimeProofInput): string[] {
  return [
    !isSafePrivateRef(input.externalBetaPerToolRuntimeProofPolicyRef)
      ? 'external beta per-tool runtime proof policy ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaPerToolRuntimeProofSchemaRef)
      ? 'external beta per-tool runtime proof schema ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRuntimeProofEvidenceRef)
      ? 'external beta runtime proof evidence ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRuntimeProofTelemetryRef)
      ? 'external beta runtime proof telemetry ref is missing or not private'
      : undefined,
    !isSafePrivateRef(input.externalBetaRuntimeProofRollbackRef)
      ? 'external beta runtime proof rollback ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function proofToolStatus(
  packet: AiGraphicsRuntimeProofPacket | undefined,
  toolId: AiGraphicsCanonicalToolId,
): string | null {
  const match = packet?.tools?.find((tool) => tool.toolId === toolId)
  return match?.status ?? null
}

function proofToolSideEffectsFalse(
  packet: AiGraphicsRuntimeProofPacket | undefined,
  toolId: AiGraphicsCanonicalToolId,
): boolean {
  const match = packet?.tools?.find((tool) => tool.toolId === toolId) ?? packet?.tool
  if (!match) return false
  return match.publicArtifactCreated === false &&
    match.agentExecutableNow === false &&
    match.routeExecutionUsed === false &&
    match.workerExecutionUsed === false &&
    match.providerRuntimeUsed === false
}

function nodeProofAccepted(
  packet: AiGraphicsRuntimeProofPacket | undefined,
  toolId: AiGraphicsCanonicalToolId,
): boolean {
  const expectedStatus = nodeRuntimeProofTools[toolId as keyof typeof nodeRuntimeProofTools]
  if (!expectedStatus) return false
  return packet?.decision === 'ai_graphics_node_runtime_proof_completed_with_warnings' &&
    proofToolStatus(packet, toolId) === expectedStatus &&
    proofToolSideEffectsFalse(packet, toolId) &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.runtimeBetaReadyNow === false
}

function browserProofAccepted(
  packet: AiGraphicsRuntimeProofPacket | undefined,
  toolId: AiGraphicsCanonicalToolId,
): boolean {
  const expectedStatus = browserRuntimeProofTools[toolId as keyof typeof browserRuntimeProofTools]
  const match = packet?.tools?.find((tool) => tool.toolId === toolId)
  if (!expectedStatus) return false
  return packet?.decision === 'ai_graphics_browser_runtime_proof_completed_with_warnings' &&
    proofToolStatus(packet, toolId) === expectedStatus &&
    match?.publicArtifactCreated === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.toolRouteExecutionReadyNow === false &&
    packet.booleans?.workerExecutionReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false
}

function satoriProofAccepted(packet?: AiGraphicsRuntimeProofPacket): boolean {
  return packet?.decision === 'ai_graphics_satori_font_runtime_proof_completed_with_warnings' &&
    packet.tool?.toolId === 'satori' &&
    packet.tool?.status === 'satori_font_fixture_svg_layout_proof_passed' &&
    packet.tool?.publicArtifactCreated === false &&
    packet.tool?.agentExecutableNow === false &&
    packet.tool?.routeExecutionUsed === false &&
    packet.tool?.workerExecutionUsed === false &&
    packet.tool?.providerRuntimeUsed === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalBetaReadyNow === false
}

function gpuProofAccepted(packet?: AiGraphicsGpuRuntimeProofResultPacket): boolean {
  return Boolean(packet) &&
    packet?.decision === 'ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results' &&
    packet.status === 'ready_for_owner_review_not_beta_ready' &&
    packet.runtimeProofResultsAcceptedForOwnerReview === 6 &&
    packet.nativeGpuRuntimeProofResultsAccepted === true &&
    packet.booleans.nativeGpuRuntimeProofResultsAcceptedForOwnerReview === true &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.modelWeightsLoaded === false &&
    packet.booleans.modelInferencePerformed === false &&
    packet.booleans.externalBetaReadyNow === false
}

function proofSourceForTool(
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalBetaPerToolRuntimeProofSource {
  if (toolId === 'satori') return 'satori_font_runtime_proof'
  if (toolId in nodeRuntimeProofTools) return 'node_runtime_proof'
  if (toolId in browserRuntimeProofTools) return 'browser_runtime_proof'
  return 'native_gpu_runtime_proof'
}

function statusFromInput(input: {
  hasRouteProof: boolean
  routeAccepted: boolean
  controlsAccepted: boolean
  acceptedTools: number
  gpuBlockedTools: number
}): AiGraphicsExternalBetaPerToolRuntimeProofStatus {
  if (!input.hasRouteProof) return 'missing_external_beta_tool_route_runtime_proof'
  if (!input.routeAccepted) return 'external_beta_tool_route_runtime_proof_rejected'
  if (!input.controlsAccepted) return 'missing_external_beta_per_tool_runtime_proof_controls'
  return input.acceptedTools === 21 && input.gpuBlockedTools === 0
    ? 'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks'
    : 'external_beta_per_tool_runtime_proof_ready_with_gpu_blocks'
}

export function buildAiGraphicsExternalBetaPerToolRuntimeProof(
  input: AiGraphicsExternalBetaPerToolRuntimeProofInput = {},
): AiGraphicsExternalBetaPerToolRuntimeProof {
  const routeAccepted = sourceRouteAccepted(input.sourceToolRouteRuntimeProofPacket)
  const missing = routeAccepted ? missingControls(input) : []
  const controlsAccepted = routeAccepted && missing.length === 0
  const nativeGpuAccepted = gpuProofAccepted(input.gpuRuntimeProofResultPacket)

  const records = listAiGraphicsToolCallReadiness().map((tool): AiGraphicsExternalBetaPerToolRuntimeProofRecord => {
    if (!tool.productionToolId) throw new Error(`AI graphics tool ${tool.toolId} is missing a productionToolId.`)
    const source = proofSourceForTool(tool.toolId)
    let sourceStatus: string | null = null
    let sourceAccepted = false
    let blockedReason: string | null = null

    if (!routeAccepted) {
      blockedReason = 'external beta Tool Route runtime proof is missing or rejected'
    } else if (!controlsAccepted) {
      blockedReason = 'external beta per-tool runtime proof controls are missing'
    } else if (source === 'node_runtime_proof') {
      sourceStatus = proofToolStatus(input.nodeRuntimeProofPacket, tool.toolId)
      sourceAccepted = nodeProofAccepted(input.nodeRuntimeProofPacket, tool.toolId)
      if (!sourceAccepted) blockedReason = 'node runtime proof is missing or rejected'
    } else if (source === 'browser_runtime_proof') {
      sourceStatus = proofToolStatus(input.browserRuntimeProofPacket, tool.toolId)
      sourceAccepted = browserProofAccepted(input.browserRuntimeProofPacket, tool.toolId)
      if (!sourceAccepted) blockedReason = 'browser runtime proof is missing or rejected'
    } else if (source === 'satori_font_runtime_proof') {
      sourceStatus = input.satoriFontRuntimeProofPacket?.tool?.status ?? null
      sourceAccepted = satoriProofAccepted(input.satoriFontRuntimeProofPacket)
      if (!sourceAccepted) blockedReason = 'Satori font runtime proof is missing or rejected'
    } else {
      sourceStatus = input.gpuRuntimeProofResultPacket?.status ?? null
      sourceAccepted = nativeGpuAccepted
      if (!sourceAccepted) {
        blockedReason = 'native linux/amd64 NVIDIA L4 GPU runtime proof and private model manifests are still pending'
      }
    }

    const runtimeProofAcceptedWithProvidedEvidence = routeAccepted && controlsAccepted && sourceAccepted
    const runtimeProofStatus: AiGraphicsExternalBetaPerToolRuntimeProofRecordStatus =
      runtimeProofAcceptedWithProvidedEvidence
        ? 'runtime_proof_accepted_with_provided_evidence'
        : !routeAccepted
          ? 'blocked_source_route_runtime_proof_missing'
          : !controlsAccepted
            ? 'blocked_runtime_proof_controls_missing'
            : source === 'native_gpu_runtime_proof'
              ? 'blocked_pending_native_gpu_runtime_proof'
              : 'blocked_missing_js_runtime_proof'

    return {
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.productionWorkerType === 'none' ? 'planning_only' : tool.productionWorkerType,
      runtimeTarget: tool.runtimeTarget,
      capabilityIds: tool.capabilities.filter((capability) => (
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred'
      )),
      runtimeProofSource: source,
      runtimeProofStatus,
      sourceProofStatus: sourceStatus,
      routeRuntimeProofAccepted: routeAccepted,
      runtimeProofAcceptedWithProvidedEvidence,
      blockedReason,
      gpuRuntimeTargeted: gpuRuntimeToolSet.has(tool.toolId),
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      routeExecutionApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
    }
  })

  const acceptedRecords = records.filter((record) => record.runtimeProofAcceptedWithProvidedEvidence)
  const acceptedJsRecords = acceptedRecords.filter((record) => record.runtimeProofSource !== 'native_gpu_runtime_proof')
  const acceptedGpuRecords = acceptedRecords.filter((record) => record.runtimeProofSource === 'native_gpu_runtime_proof')
  const blockedGpuRecords = records.filter((record) => record.runtimeProofStatus === 'blocked_pending_native_gpu_runtime_proof')

  return {
    decision: statusFromInput({
      hasRouteProof: Boolean(input.sourceToolRouteRuntimeProofPacket),
      routeAccepted,
      controlsAccepted,
      acceptedTools: acceptedRecords.length,
      gpuBlockedTools: blockedGpuRecords.length,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_RUNTIME_PROOF_DECISION,
    sourceToolRouteRuntimeProofAccepted: routeAccepted,
    missingPerToolRuntimeProofControls: missing,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productCapabilityCount(),
    gpuRuntimeTargetedTools: gpuRuntimeTools.length as 8,
    runtimeProofRecordsPrepared: AI_GRAPHICS_CANONICAL_TOOL_IDS.length as 21,
    runtimeProofAcceptedWithProvidedEvidenceTools: acceptedRecords.length,
    jsRuntimeProofAcceptedWithProvidedEvidenceTools: acceptedJsRecords.length,
    nativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: acceptedGpuRecords.length,
    blockedPendingNativeGpuRuntimeProofTools: blockedGpuRecords.length,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    acceptedPrivateRefNamespaces,
    forbiddenRuntimeProofRefPatterns,
    records,
    policy: {
      sourceToolRouteRuntimeProofRequired: true,
      nodeRuntimeProofRequiredForNodeStaticTools: true,
      browserRuntimeProofRequiredForBrowserTools: true,
      satoriFontRuntimeProofRequiredForSatori: true,
      nativeGpuRuntimeProofRequiredForGpuTools: true,
      runtimeProofPolicyRequired: true,
      runtimeProofSchemaRequired: true,
      runtimeProofEvidenceRequired: true,
      runtimeProofTelemetryRequired: true,
      runtimeProofRollbackRequired: true,
      runtimeProofOnlyNoToolExecution: true,
      runtimeProofOnlyNoRouteExecution: true,
      runtimeProofOnlyNoWorkerDispatch: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresNativeGpuRuntimeProofFor8Tools: true,
    },
    booleans: {
      externalBetaPerToolRuntimeProofPrepared: true,
      sourceToolRouteRuntimeProofAccepted: routeAccepted,
      perToolRuntimeProofControlsAccepted: controlsAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all13JsRuntimeProofsAccepted: acceptedJsRecords.length === 13,
      all8NativeGpuRuntimeProofsAccepted: acceptedGpuRecords.length === 8,
      nativeGpuRuntimeProofResultsAcceptedForOwnerReview: nativeGpuAccepted,
      blockedPendingNativeGpuRuntimeProofTools: blockedGpuRecords.length === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
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
