import {
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from './ai-graphics-beta-readiness-gate'
import {
  AI_GRAPHICS_GPU_RUNTIME_PROOF_RESULT_DECISION,
  aiGraphicsExpectedGpuRuntimeTargetForTool,
  listAiGraphicsGpuRuntimeProofRequiredProfiles,
  listAiGraphicsExpectedGpuRuntimeTargets,
  type AiGraphicsGpuRuntimeProofResultPacket,
  type AiGraphicsGpuRuntimeProofResultValidation,
} from './ai-graphics-gpu-runtime-proof-result'
import {
  AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION,
  type AiGraphicsExternalBetaNativeGpuProofCollection,
} from './ai-graphics-external-beta-native-gpu-proof-collection'
import {
  AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION,
  AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
  listAiGraphicsModelWeightManifestRequiredTools,
  type AiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestValidationResult,
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
  sourceExternalBetaNativeGpuProofCollectionPacket?: Partial<AiGraphicsExternalBetaNativeGpuProofCollection>
  nodeRuntimeProofPacket?: Record<string, unknown>
  browserRuntimeProofPacket?: Record<string, unknown>
  satoriFontRuntimeProofPacket?: Record<string, unknown>
}

export interface AiGraphicsBetaEvidenceBundleToolRow {
  toolId: AiGraphicsCanonicalToolId
  installReadyForPlannedSurface: true
  productionMapped: true
  planningSelectable: true
  gpuRequiredForRuntime: boolean
  runtimeTargetForPlannedSurface: string | null
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
    nativeGpuProofCollectionPacketAccepted: boolean
    nativeGpuRuntimeProofTargetsExact: boolean
    privateArtifactRefNamespaceAccepted: boolean
    modelWeightManifestReviewPacketProvided: boolean
    nativeGpuRuntimeProofResultPacketProvided: boolean
    nativeGpuProofCollectionPacketProvided: boolean
  }
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  expectedGpuRuntimeTargets: Record<string, string>
  gpuRuntimePolicy: {
    onDemandOnly: true
    noIdleGpuRuntimeApproved: true
    startsOnlyForApprovedWorkerOrToolCall: true
    proofContainerIsEphemeral: true
    cpuFallbackAllowedForHeavyTools: false
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
    gpuRuntimeTargetsExact: true
    gpuRuntimeOnDemandOnly: true
    privateArtifactRefNamespaceRequired: true
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
  if (!packet) return false

  const requiredTools = listAiGraphicsModelWeightManifestRequiredTools()
  const validationResults = Array.isArray(packet.validationResults) ? packet.validationResults : []
  const perToolRowsAccepted =
    validationResults.length === requiredTools.length &&
    requiredTools.every((expected) => {
      const matches = validationResults.filter((result) => result.toolId === expected.toolId)
      if (matches.length !== 1) return false

      return modelWeightValidationResultAccepted(matches[0], expected)
    })

  return Boolean(
    packet.decision === AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION &&
      packet.sourceManifestReadinessDecision === AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION &&
      packet.manifestRecordsProvided === requiredTools.length &&
      packet.schemaValidManifestRecords === requiredTools.length &&
      packet.reviewAcceptedManifestRecords === requiredTools.length &&
      packet.nativeGpuProofInputEligibleRecords === requiredTools.length &&
      packet.privateArtifactRefsLogged === 0 &&
      packet.booleans?.privateArtifactRefNamespaceRequired === true &&
      packet.booleans?.privateArtifactRefsNotLogged === true &&
      packet.booleans?.publicOrSignedArtifactRefsRejected === true &&
      perToolRowsAccepted,
  )
}

function modelWeightValidationResultAccepted(
  result: AiGraphicsModelWeightManifestValidationResult,
  expected: ReturnType<typeof listAiGraphicsModelWeightManifestRequiredTools>[number],
): boolean {
  return Boolean(
    result.toolId === expected.toolId &&
      result.templateId === expected.templateId &&
      result.expectedTemplateId === expected.templateId &&
      result.manifestRecordProvided === true &&
      result.schemaValid === true &&
      result.reviewAccepted === true &&
      result.eligibleForNativeGpuProofInput === true &&
      result.approvedForAgentExecutionNow === false &&
      result.privateArtifactRefStatus === 'present_private_ref_not_logged' &&
      Array.isArray(result.errors) &&
      result.errors.length === 0,
  )
}

function gpuRuntimePacketAccepted(
  packet: Partial<AiGraphicsGpuRuntimeProofResultPacket> | undefined,
): boolean {
  if (!packet) return false

  const requiredProfiles = listAiGraphicsGpuRuntimeProofRequiredProfiles()
  const validationResults = Array.isArray(packet.validationResults) ? packet.validationResults : []
  const perProfileRowsAccepted =
    validationResults.length === requiredProfiles.length &&
    requiredProfiles.every((profileId) => {
      const matches = validationResults.filter((result) => result.profileId === profileId)
      if (matches.length !== 1) return false

      return gpuRuntimeValidationResultAccepted(matches[0], profileId)
    })

  return Boolean(
    packet.decision === AI_GRAPHICS_GPU_RUNTIME_PROOF_RESULT_DECISION &&
      packet.status === 'ready_for_owner_review_not_beta_ready' &&
      packet.runtimeProofResultsProvided === requiredProfiles.length &&
      packet.runtimeProofResultsAcceptedForOwnerReview === requiredProfiles.length &&
      packet.nativeGpuRuntimeProofResultsAccepted === true &&
      gpuRuntimeTargetsExact(packet) &&
      packet.booleans?.nativeGpuRuntimeProofResultsAcceptedForOwnerReview === true &&
      packet.booleans?.gpuRuntimeTargetsExact === true &&
      packet.booleans?.gpuRuntimeOnDemandOnly === true &&
      packet.booleans?.privateArtifactRefNamespaceRequired === true &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.runtimeReadyNow === false &&
      Array.isArray(packet.requiredProofChecks) &&
      packet.requiredProofChecks.includes('model_manifest_private_namespace_enforced') &&
      perProfileRowsAccepted,
  )
}

function expectedGpuRuntimeTargetsExact(
  actualTargets: unknown,
): boolean {
  const expectedTargets = listAiGraphicsExpectedGpuRuntimeTargets()
  if (typeof actualTargets !== 'object' || actualTargets === null || Array.isArray(actualTargets)) {
    return false
  }

  const actual = actualTargets as Record<string, unknown>
  const expectedEntries = Object.entries(expectedTargets)
  return expectedEntries.length === Object.keys(actual).length &&
    expectedEntries.every(([toolId, runtimeTarget]) => actual[toolId] === runtimeTarget)
}

function gpuRuntimeTargetsExact(
  packet: Partial<AiGraphicsGpuRuntimeProofResultPacket> | undefined,
): boolean {
  if (!packet) return false
  return expectedGpuRuntimeTargetsExact(packet.expectedGpuRuntimeTargets)
}

function nativeGpuProofCollectionAccepted(
  packet: Partial<AiGraphicsExternalBetaNativeGpuProofCollection> | undefined,
): boolean {
  if (!packet) return false

  const counts = packet.counts
  const booleans = packet.booleans
  return Boolean(
    packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION &&
      packet.decision === 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready' &&
      packet.sourcePerToolRuntimeProofAccepted === true &&
      packet.sourcePerToolRuntimeProofBridgeAccepted === true &&
      packet.sourceCloudRunResultCollectorAccepted === true &&
      counts?.totalAiGraphicsTools === 21 &&
      counts?.gpuRuntimeTargetedTools === 8 &&
      counts?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
      counts?.modelWeightManifestReviewAccepted === 5 &&
      counts?.modelWeightPrivateEvidenceIntakeAccepted === 5 &&
      counts?.nativeGpuRuntimeProofProfilesAccepted === 6 &&
      counts?.cloudRunResultCollectorProfilesAccepted === 6 &&
      counts?.nativeGpuRuntimeProofAcceptedTools === 8 &&
      counts?.blockedPendingPrivateManifestTools === 0 &&
      counts?.blockedPendingNativeGpuRuntimeProofTools === 0 &&
      counts?.externalBetaReadyNowTools === 0 &&
      counts?.productionReadyNowTools === 0 &&
      expectedGpuRuntimeTargetsExact(packet.expectedGpuRuntimeTargets) &&
      booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      booleans?.sourceNativeGpuProofCollectionBridgeAccepted === true &&
      booleans?.privateModelManifestsAcceptedForAll5ModelTools === true &&
      booleans?.privateModelWeightEvidenceIntakeAcceptedForAll5ModelTools === true &&
      booleans?.nativeGpuRuntimeProofResultsAcceptedForAll6Profiles === true &&
      booleans?.gpuRuntimeTargetsExact === true &&
      booleans?.gpuRuntimeOnDemandOnly === true &&
      booleans?.noIdleGpuRuntimeApproved === true &&
      booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
      booleans?.cpuFallbackAllowedForHeavyTools === false &&
      booleans?.privateArtifactRefsRequired === true &&
      booleans?.privateArtifactRefsNotLogged === true &&
      booleans?.readyForPerToolRuntimeProofRecheck === true &&
      booleans?.agentCanExecuteToolsNow === false &&
      booleans?.gpuRuntimeApprovedNow === false &&
      booleans?.gpuRuntimeShouldStartNow === false &&
      booleans?.runtimeReadyNow === false &&
      booleans?.externalBetaReadyNow === false &&
      booleans?.productionReadyNow === false,
  )
}

function gpuRuntimeValidationResultAccepted(
  result: AiGraphicsGpuRuntimeProofResultValidation,
  profileId: ReturnType<typeof listAiGraphicsGpuRuntimeProofRequiredProfiles>[number],
): boolean {
  return Boolean(
    result.profileId === profileId &&
      result.resultProvided === true &&
      result.acceptedForOwnerReview === true &&
      result.proofMetadataAccepted === true &&
      result.requiredImportsPresent === true &&
      result.nvidiaSmiAccepted === true &&
      result.cudaAccepted === true &&
      result.modelManifestChecksAccepted === true &&
      result.rawPrivateRefsNotLogged === true &&
      result.runtimeSideEffectsBlocked === true &&
      Array.isArray(result.errors) &&
      result.errors.length === 0,
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
    !nativeGpuProofCollectionAccepted(input.sourceExternalBetaNativeGpuProofCollectionPacket)
      ? 'external_beta_native_gpu_proof_collection_packet'
      : undefined,
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
  const nativeGpuRuntimeProofTargetsExact = gpuRuntimeTargetsExact(input.gpuRuntimeProofResultPacket)
  const nativeGpuProofCollectionPacketAccepted =
    nativeGpuProofCollectionAccepted(input.sourceExternalBetaNativeGpuProofCollectionPacket)
  const privateArtifactRefNamespaceAccepted =
    input.modelWeightManifestReviewPacket?.booleans?.privateArtifactRefNamespaceRequired === true &&
    input.gpuRuntimeProofResultPacket?.booleans?.privateArtifactRefNamespaceRequired === true &&
    input.sourceExternalBetaNativeGpuProofCollectionPacket?.booleans?.privateArtifactRefsRequired === true &&
    input.sourceExternalBetaNativeGpuProofCollectionPacket?.booleans?.privateArtifactRefsNotLogged === true
  const expectedGpuRuntimeTargets = listAiGraphicsExpectedGpuRuntimeTargets()

  const evidence: Required<AiGraphicsBetaReadinessEvidence> = {
    approvedPlanSnapshotGatePassed: input.approvedPlanSnapshotGatePassed === true,
    creditReservationGatePassed: input.creditReservationGatePassed === true,
    artifactBoundaryGatePassed: input.artifactBoundaryGatePassed === true,
    toolRouteGatePassed: input.toolRouteGatePassed === true,
    workerGatePassed: input.workerGatePassed === true,
    browserCanvasWebglSandboxPassed: input.browserCanvasWebglSandboxPassed === true,
    nativeGpuRuntimeProofPassed:
      nativeGpuRuntimeProofResultPacketAccepted && nativeGpuProofCollectionPacketAccepted,
    modelWeightManifestsApproved:
      modelWeightManifestReviewPacketAccepted && nativeGpuProofCollectionPacketAccepted,
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
      gpuRequiredForRuntime: aiGraphicsExpectedGpuRuntimeTargetForTool(tool.toolId) !== null,
      runtimeTargetForPlannedSurface: aiGraphicsExpectedGpuRuntimeTargetForTool(tool.toolId),
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
      nativeGpuProofCollectionPacketAccepted,
      nativeGpuRuntimeProofTargetsExact,
      privateArtifactRefNamespaceAccepted,
      modelWeightManifestReviewPacketProvided: packetProvided(input.modelWeightManifestReviewPacket),
      nativeGpuRuntimeProofResultPacketProvided: packetProvided(input.gpuRuntimeProofResultPacket),
      nativeGpuProofCollectionPacketProvided:
        packetProvided(input.sourceExternalBetaNativeGpuProofCollectionPacket),
    },
    gpuRuntimeTargetedTools: Object.keys(expectedGpuRuntimeTargets) as AiGraphicsCanonicalToolId[],
    expectedGpuRuntimeTargets,
    gpuRuntimePolicy: {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      proofContainerIsEphemeral: true,
      cpuFallbackAllowedForHeavyTools: false,
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
      gpuRuntimeTargetsExact: true,
      gpuRuntimeOnDemandOnly: true,
      privateArtifactRefNamespaceRequired: true,
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
