import {
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from './ai-graphics-beta-readiness-gate'
import type {
  AiGraphicsGpuRuntimeProofResultPacket,
} from './ai-graphics-gpu-runtime-proof-result'
import type {
  AiGraphicsModelWeightManifestReviewPacket,
} from './ai-graphics-model-weight-manifest-readiness'
import {
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION =
  'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults'

export interface AiGraphicsBetaEvidenceBundleInput {
  approvedPlanSnapshotGatePassed?: boolean
  creditReservationGatePassed?: boolean
  artifactBoundaryGatePassed?: boolean
  toolRouteGatePassed?: boolean
  workerGatePassed?: boolean
  browserCanvasWebglSandboxPassed?: boolean
  internalBetaOwnerApprovalGranted?: boolean
  modelWeightManifestReviewPacket?: Partial<AiGraphicsModelWeightManifestReviewPacket>
  gpuRuntimeProofResultPacket?: Partial<AiGraphicsGpuRuntimeProofResultPacket>
  nodeRuntimeProofPacket?: Record<string, unknown>
  browserRuntimeProofPacket?: Record<string, unknown>
  satoriFontRuntimeProofPacket?: Record<string, unknown>
}

export interface AiGraphicsBetaEvidenceBundleToolRow {
  toolId: AiGraphicsCanonicalToolId
  installReadyForPlannedSurface: true
  productionMapped: true
  planningSelectable: true
  betaTestingReadyNow: boolean
  evidenceMissing: string[]
  blockers: string[]
}

export interface AiGraphicsBetaEvidenceBundle {
  decision: typeof AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION
  totalAiGraphicsTools: 21
  installReadyForPlannedSurfaceTools: 21
  productionMappedTools: 21
  planningSelectableTools: 21
  betaTestingReadyTools: number
  blockedTools: number
  all21BetaEvidenceReady: boolean
  all21TechnicalEvidenceReadyBeforeOwnerApproval: boolean
  evidence: Required<AiGraphicsBetaReadinessEvidence>
  evidenceSources: {
    jsRuntimeProofsAccepted: boolean
    nodeRuntimeProofPacketAccepted: boolean
    browserRuntimeProofPacketAccepted: boolean
    satoriFontRuntimeProofPacketAccepted: boolean
    nodeRuntimeProofPacketProvided: boolean
    browserRuntimeProofPacketProvided: boolean
    satoriFontRuntimeProofPacketProvided: boolean
    modelWeightManifestReviewPacketAccepted: boolean
    nativeGpuRuntimeProofResultPacketAccepted: boolean
    modelWeightManifestReviewPacketProvided: boolean
    nativeGpuRuntimeProofResultPacketProvided: boolean
  }
  tools: AiGraphicsBetaEvidenceBundleToolRow[]
  missingEvidence: string[]
  missingTechnicalEvidenceBeforeOwnerApproval: string[]
  booleans: {
    betaEvidenceBundleValidatorPrepared: true
    all21ToolsCovered: true
    all21ToolsInstallReadyForPlannedSurface: true
    all21ToolsMappedToProductionRegistry: true
    all21ToolsPlanningSelectable: true
    agentCanSelectForPlanning: true
    all21BetaEvidenceReady: boolean
    all21TechnicalEvidenceReadyBeforeOwnerApproval: boolean
    readyForInternalBetaOwnerGate: boolean
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    modelWeightManifestsApprovedNow: false
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

function packetProvided(value: unknown): boolean {
  return typeof value === 'object' && value !== null
}

function modelWeightPacketAccepted(
  packet: Partial<AiGraphicsModelWeightManifestReviewPacket> | undefined,
): boolean {
  return Boolean(
    packet &&
      packet.manifestRecordsProvided === 5 &&
      packet.schemaValidManifestRecords === 5 &&
      packet.reviewAcceptedManifestRecords === 5 &&
      packet.nativeGpuProofInputEligibleRecords === 5 &&
      packet.privateArtifactRefsLogged === 0 &&
      packet.booleans?.privateArtifactRefsNotLogged === true &&
      packet.booleans?.publicOrSignedArtifactRefsRejected === true,
  )
}

function gpuRuntimePacketAccepted(
  packet: Partial<AiGraphicsGpuRuntimeProofResultPacket> | undefined,
): boolean {
  return Boolean(
    packet &&
      packet.runtimeProofResultsProvided === 4 &&
      packet.runtimeProofResultsAcceptedForOwnerReview === 4 &&
      packet.nativeGpuRuntimeProofResultsAccepted === true &&
      packet.booleans?.nativeGpuRuntimeProofResultsAcceptedForOwnerReview === true &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.runtimeReadyNow === false,
  )
}

function booleanAt(packet: Record<string, unknown> | undefined, key: string): boolean {
  const booleans = packet?.booleans
  return typeof booleans === 'object' &&
    booleans !== null &&
    !Array.isArray(booleans) &&
    (booleans as Record<string, unknown>)[key] === true
}

function falseBooleanAt(packet: Record<string, unknown> | undefined, key: string): boolean {
  const booleans = packet?.booleans
  return typeof booleans === 'object' &&
    booleans !== null &&
    !Array.isArray(booleans) &&
    (booleans as Record<string, unknown>)[key] === false
}

function nodeRuntimeProofAccepted(packet: Record<string, unknown> | undefined): boolean {
  return Boolean(
    packet &&
      packet.decision === 'ai_graphics_node_runtime_proof_completed_with_warnings' &&
      packet.status === 'completed_with_warnings' &&
      Array.isArray(packet.tools) &&
      packet.tools.length === 13 &&
      booleanAt(packet, 'nodeRuntimeProofCompleted') &&
      booleanAt(packet, 'all13NodeGraphicsToolsProofAttempted') &&
      booleanAt(packet, 'd3NodeRuntimeProofPassed') &&
      booleanAt(packet, 'vegaLiteNodeCompilePassed') &&
      booleanAt(packet, 'vegaNodeParsePassed') &&
      booleanAt(packet, 'svgdotjsNodeSvgConstructionPassed') &&
      booleanAt(packet, 'vizJsNodeDotToSvgPassed') &&
      booleanAt(packet, 'satoriImportApiPassedFontFixturePending') &&
      falseBooleanAt(packet, 'agentCanExecuteToolsNow') &&
      falseBooleanAt(packet, 'runtimeBetaReadyNow'),
  )
}

function browserRuntimeProofAccepted(packet: Record<string, unknown> | undefined): boolean {
  return Boolean(
    packet &&
      packet.decision === 'ai_graphics_browser_runtime_proof_completed_with_warnings' &&
      packet.status === 'completed_with_warnings' &&
      Array.isArray(packet.tools) &&
      packet.tools.length === 7 &&
      booleanAt(packet, 'browserRuntimeProofCompleted') &&
      booleanAt(packet, 'all7BrowserRuntimeToolsProofAttempted') &&
      booleanAt(packet, 'all7BrowserRuntimeToolsProofPassed') &&
      booleanAt(packet, 'browserRuntimeExecutedInLocalProof') &&
      falseBooleanAt(packet, 'agentCanExecuteToolsNow') &&
      falseBooleanAt(packet, 'runtimeBetaReadyNow') &&
      falseBooleanAt(packet, 'publicArtifactCreated'),
  )
}

function satoriFontRuntimeProofAccepted(packet: Record<string, unknown> | undefined): boolean {
  const tool = packet?.tool
  const toolRecord = typeof tool === 'object' && tool !== null && !Array.isArray(tool)
    ? tool as Record<string, unknown>
    : {}

  return Boolean(
    packet &&
      packet.decision === 'ai_graphics_satori_font_runtime_proof_completed_with_warnings' &&
      packet.status === 'completed_with_warnings' &&
      toolRecord.toolId === 'satori' &&
      toolRecord.status === 'satori_font_fixture_svg_layout_proof_passed' &&
      booleanAt(packet, 'satoriFontRuntimeProofCompleted') &&
      booleanAt(packet, 'satoriTextSvgLayoutProofPassed') &&
      booleanAt(packet, 'all13JsGraphicsToolsHaveRuntimeProofEvidence') &&
      falseBooleanAt(packet, 'agentCanExecuteToolsNow') &&
      falseBooleanAt(packet, 'runtimeBetaReadyNow') &&
      falseBooleanAt(packet, 'publicArtifactCreated'),
  )
}

function buildMissingEvidence(
  evidence: Required<AiGraphicsBetaReadinessEvidence>,
  input: AiGraphicsBetaEvidenceBundleInput,
  jsRuntimeProofsAccepted: boolean,
): string[] {
  return [
    !nodeRuntimeProofAccepted(input.nodeRuntimeProofPacket) ? 'js_node_runtime_proof_packet' : undefined,
    !browserRuntimeProofAccepted(input.browserRuntimeProofPacket) ? 'js_browser_runtime_proof_packet' : undefined,
    !satoriFontRuntimeProofAccepted(input.satoriFontRuntimeProofPacket) ? 'satori_font_runtime_proof_packet' : undefined,
    !jsRuntimeProofsAccepted ? 'complete_js_runtime_proof_bundle' : undefined,
    !evidence.approvedPlanSnapshotGatePassed ? 'approved_plan_snapshot_gate' : undefined,
    !evidence.creditReservationGatePassed ? 'credit_reservation_gate' : undefined,
    !evidence.artifactBoundaryGatePassed ? 'artifact_boundary_gate' : undefined,
    !evidence.toolRouteGatePassed ? 'tool_route_gate' : undefined,
    !evidence.workerGatePassed ? 'worker_gate' : undefined,
    !evidence.browserCanvasWebglSandboxPassed ? 'browser_canvas_webgl_sandbox_proof' : undefined,
    !evidence.nativeGpuRuntimeProofPassed ? 'native_gpu_runtime_proof_packet' : undefined,
    !evidence.modelWeightManifestsApproved ? 'model_weight_manifest_review_packet' : undefined,
    !evidence.internalBetaOwnerApprovalGranted ? 'internal_beta_owner_approval' : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

function toolMissingEvidence(input: {
  toolId: AiGraphicsCanonicalToolId
  blockers: readonly string[]
  evidence: Required<AiGraphicsBetaReadinessEvidence>
  bundleInput: AiGraphicsBetaEvidenceBundleInput
  jsRuntimeProofsAccepted: boolean
}): string[] {
  const missing = buildMissingEvidence(input.evidence, input.bundleInput, input.jsRuntimeProofsAccepted)
  const toolBlockers = input.blockers.join('\n').toLowerCase()
  const gpuModelTools: readonly AiGraphicsCanonicalToolId[] = [
    'torch_torchvision',
    'transformers',
    'sam2',
    'birefnet',
    'real_esrgan',
    'kornia',
    'rembg',
    'transparent_background',
  ]

  return missing.filter((entry) => {
    if (
      entry === 'js_node_runtime_proof_packet' ||
      entry === 'js_browser_runtime_proof_packet' ||
      entry === 'satori_font_runtime_proof_packet' ||
      entry === 'complete_js_runtime_proof_bundle'
    ) {
      return !gpuModelTools.includes(input.toolId)
    }
    if (entry === 'browser_canvas_webgl_sandbox_proof') {
      return toolBlockers.includes('browser') ||
        toolBlockers.includes('canvas') ||
        toolBlockers.includes('webgl') ||
        toolBlockers.includes('animation')
    }
    if (entry === 'native_gpu_runtime_proof_packet') {
      return toolBlockers.includes('gpu') || toolBlockers.includes('nvidia')
    }
    if (entry === 'model_weight_manifest_review_packet') {
      return toolBlockers.includes('model-weight') || toolBlockers.includes('model weight')
    }
    return true
  })
}

export function buildAiGraphicsBetaEvidenceBundle(
  input: AiGraphicsBetaEvidenceBundleInput = {},
): AiGraphicsBetaEvidenceBundle {
  const nodeRuntimeProofPacketAccepted = nodeRuntimeProofAccepted(input.nodeRuntimeProofPacket)
  const browserRuntimeProofPacketAccepted = browserRuntimeProofAccepted(input.browserRuntimeProofPacket)
  const satoriFontRuntimeProofPacketAccepted = satoriFontRuntimeProofAccepted(input.satoriFontRuntimeProofPacket)
  const jsRuntimeProofsAccepted =
    nodeRuntimeProofPacketAccepted &&
    browserRuntimeProofPacketAccepted &&
    satoriFontRuntimeProofPacketAccepted
  const modelWeightManifestReviewPacketAccepted = modelWeightPacketAccepted(input.modelWeightManifestReviewPacket)
  const nativeGpuRuntimeProofResultPacketAccepted = gpuRuntimePacketAccepted(input.gpuRuntimeProofResultPacket)

  const evidence: Required<AiGraphicsBetaReadinessEvidence> = {
    approvedPlanSnapshotGatePassed: input.approvedPlanSnapshotGatePassed === true,
    creditReservationGatePassed: input.creditReservationGatePassed === true,
    artifactBoundaryGatePassed: input.artifactBoundaryGatePassed === true,
    toolRouteGatePassed: input.toolRouteGatePassed === true,
    workerGatePassed: input.workerGatePassed === true,
    browserCanvasWebglSandboxPassed: input.browserCanvasWebglSandboxPassed === true,
    nativeGpuRuntimeProofPassed: nativeGpuRuntimeProofResultPacketAccepted,
    modelWeightManifestsApproved: modelWeightManifestReviewPacketAccepted,
    modelWeightManifestReviewPacketAccepted,
    internalBetaOwnerApprovalGranted: input.internalBetaOwnerApprovalGranted === true,
  }

  const gate = buildAiGraphicsBetaReadinessGate(evidence)
  const technicalEvidenceBeforeOwnerApproval: Required<AiGraphicsBetaReadinessEvidence> = {
    ...evidence,
    internalBetaOwnerApprovalGranted: true,
  }
  const technicalGateBeforeOwnerApproval = buildAiGraphicsBetaReadinessGate(technicalEvidenceBeforeOwnerApproval)
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const tools = gate.tools.map((tool): AiGraphicsBetaEvidenceBundleToolRow => {
    const readiness = readinessRecords.find((record) => record.toolId === tool.toolId)
    if (!readiness) throw new Error(`Missing AI graphics readiness row for ${tool.toolId}`)

    return {
      toolId: tool.toolId,
      installReadyForPlannedSurface: true,
      productionMapped: true,
      planningSelectable: true,
      betaTestingReadyNow: tool.betaTestingReadyNow,
      evidenceMissing: toolMissingEvidence({
        toolId: tool.toolId,
        blockers: tool.blockers,
        evidence,
        bundleInput: input,
        jsRuntimeProofsAccepted,
      }),
      blockers: tool.blockers,
    }
  })
  const all21BetaEvidenceReady =
    gate.betaTestingReadyTools === 21 &&
    gate.blockedTools === 0 &&
    jsRuntimeProofsAccepted
  const all21TechnicalEvidenceReadyBeforeOwnerApproval =
    technicalGateBeforeOwnerApproval.betaTestingReadyTools === 21 &&
    technicalGateBeforeOwnerApproval.blockedTools === 0 &&
    jsRuntimeProofsAccepted
  const missingTechnicalEvidenceBeforeOwnerApproval = buildMissingEvidence(
    technicalEvidenceBeforeOwnerApproval,
    input,
    jsRuntimeProofsAccepted,
  )

  return {
    decision: AI_GRAPHICS_BETA_EVIDENCE_BUNDLE_DECISION,
    totalAiGraphicsTools: 21,
    installReadyForPlannedSurfaceTools: 21,
    productionMappedTools: 21,
    planningSelectableTools: 21,
    betaTestingReadyTools: gate.betaTestingReadyTools,
    blockedTools: gate.blockedTools,
    all21BetaEvidenceReady,
    all21TechnicalEvidenceReadyBeforeOwnerApproval,
    evidence,
    evidenceSources: {
      jsRuntimeProofsAccepted,
      nodeRuntimeProofPacketAccepted,
      browserRuntimeProofPacketAccepted,
      satoriFontRuntimeProofPacketAccepted,
      nodeRuntimeProofPacketProvided: packetProvided(input.nodeRuntimeProofPacket),
      browserRuntimeProofPacketProvided: packetProvided(input.browserRuntimeProofPacket),
      satoriFontRuntimeProofPacketProvided: packetProvided(input.satoriFontRuntimeProofPacket),
      modelWeightManifestReviewPacketAccepted,
      nativeGpuRuntimeProofResultPacketAccepted,
      modelWeightManifestReviewPacketProvided: packetProvided(input.modelWeightManifestReviewPacket),
      nativeGpuRuntimeProofResultPacketProvided: packetProvided(input.gpuRuntimeProofResultPacket),
    },
    tools,
    missingEvidence: buildMissingEvidence(evidence, input, jsRuntimeProofsAccepted),
    missingTechnicalEvidenceBeforeOwnerApproval,
    booleans: {
      betaEvidenceBundleValidatorPrepared: true,
      all21ToolsCovered: true,
      all21ToolsInstallReadyForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      all21ToolsPlanningSelectable: true,
      agentCanSelectForPlanning: true,
      all21BetaEvidenceReady,
      all21TechnicalEvidenceReadyBeforeOwnerApproval,
      readyForInternalBetaOwnerGate: all21TechnicalEvidenceReadyBeforeOwnerApproval,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      modelWeightManifestsApprovedNow: false,
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
