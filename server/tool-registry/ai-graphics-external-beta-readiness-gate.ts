import {
  buildAiGraphicsBetaReadinessGate,
  type AiGraphicsBetaReadinessEvidence,
} from './ai-graphics-beta-readiness-gate'
import {
  buildAiGraphicsBetaToolCallReadiness,
  type AiGraphicsBetaToolCallReadiness,
} from './ai-graphics-beta-tool-call-readiness'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION =
  'ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks'

export interface AiGraphicsExternalBetaReadinessEvidence extends AiGraphicsBetaReadinessEvidence {
  internalBetaRuntimeSoakAccepted?: boolean
  externalBetaQaAccepted?: boolean
  externalBetaCostConcurrencyPrivacyRollbackAccepted?: boolean
  externalBetaIncidentResponseAccepted?: boolean
  externalBetaOwnerApprovalGranted?: boolean
}

export interface AiGraphicsExternalBetaReadinessToolGate {
  toolId: AiGraphicsCanonicalToolId
  installReady: true
  productionMapped: true
  planningSelectable: true
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  betaTestingReadyWithProvidedEvidence: boolean
  externalBetaReadyWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  missingEvidenceBeforeExternalBeta: string[]
  blockersBeforeExternalBetaLaunch: string[]
}

export interface AiGraphicsExternalBetaReadinessGate {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION
  sourceBetaReadinessDecision: string
  sourceBetaToolCallReadinessDecision: string
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  installReadyTools: 21
  productionMappedTools: 21
  planningSelectableTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  heavyToolsIncorrectlyTargetingCpu: 0
  betaTestingReadyWithProvidedEvidenceTools: number
  externalBetaReadyWithProvidedEvidenceTools: number
  externalBetaReadyNowTools: 0
  externalBetaBlockedNowTools: 21
  productionReadyNowTools: 0
  sourceBetaReadinessGateAccepted: boolean
  sourceToolCallReadinessSeparated: boolean
  evidence: Required<AiGraphicsExternalBetaReadinessEvidence>
  requiredExternalBetaGates: string[]
  externalBetaGlobalBlockers: string[]
  tools: AiGraphicsExternalBetaReadinessToolGate[]
  booleans: {
    externalBetaReadinessGatePrepared: true
    sourceBetaReadinessGateAccepted: boolean
    sourceBetaToolCallReadinessAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsInstalledForPlannedSurface: boolean
    all21ToolsMappedToProductionRegistry: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    externalBetaToolCallReadinessSeparated: boolean
    externalBetaReadyWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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

const defaultExternalEvidence: Required<AiGraphicsExternalBetaReadinessEvidence> = {
  approvedPlanSnapshotGatePassed: false,
  creditReservationGatePassed: false,
  artifactBoundaryGatePassed: false,
  toolRouteGatePassed: false,
  workerGatePassed: false,
  browserCanvasWebglSandboxPassed: false,
  nativeGpuRuntimeProofPassed: false,
  modelWeightManifestsApproved: false,
  modelWeightManifestReviewPacketAccepted: false,
  internalBetaOwnerApprovalGranted: false,
  internalBetaRuntimeSoakAccepted: false,
  externalBetaQaAccepted: false,
  externalBetaCostConcurrencyPrivacyRollbackAccepted: false,
  externalBetaIncidentResponseAccepted: false,
  externalBetaOwnerApprovalGranted: false,
}

const requiredExternalBetaGates = [
  'all 21 tools properly installed for the planned ReeditPro surface',
  'all 21 tools mapped to production tool IDs with no duplicate AI graphics mappings',
  'internal beta technical evidence accepted for all 21 tools',
  'internal beta runtime soak accepted with real worker/tool-call evidence',
  'external-beta QA accepted with rollback-ready evidence',
  'cost, concurrency, privacy, rollback, and incident-response gates accepted',
  'external-beta owner approval granted after runtime soak',
]

function normalizeEvidence(
  evidence: AiGraphicsExternalBetaReadinessEvidence = {},
): Required<AiGraphicsExternalBetaReadinessEvidence> {
  return {
    ...defaultExternalEvidence,
    ...evidence,
  }
}

function buildExternalGlobalBlockers(
  evidence: Required<AiGraphicsExternalBetaReadinessEvidence>,
  betaTestingReadyWithProvidedEvidenceTools: number,
): string[] {
  return [
    betaTestingReadyWithProvidedEvidenceTools !== 21
      ? 'internal beta technical evidence is not accepted for all 21 tools'
      : undefined,
    !evidence.internalBetaRuntimeSoakAccepted
      ? 'internal beta runtime soak evidence is not accepted'
      : undefined,
    !evidence.externalBetaQaAccepted
      ? 'external-beta QA evidence is not accepted'
      : undefined,
    !evidence.externalBetaCostConcurrencyPrivacyRollbackAccepted
      ? 'external-beta cost, concurrency, privacy, and rollback evidence is not accepted'
      : undefined,
    !evidence.externalBetaIncidentResponseAccepted
      ? 'external-beta incident-response evidence is not accepted'
      : undefined,
    !evidence.externalBetaOwnerApprovalGranted
      ? 'external-beta owner approval is not granted'
      : undefined,
  ].filter((blocker): blocker is string => Boolean(blocker))
}

function buildToolMissingEvidence(
  toolId: AiGraphicsCanonicalToolId,
  betaTestingReadyWithProvidedEvidence: boolean,
  evidence: Required<AiGraphicsExternalBetaReadinessEvidence>,
): string[] {
  return [
    !betaTestingReadyWithProvidedEvidence
      ? `${toolId}: internal beta technical evidence accepted for this tool`
      : undefined,
    !evidence.internalBetaRuntimeSoakAccepted
      ? `${toolId}: real internal beta runtime soak evidence`
      : undefined,
    !evidence.externalBetaQaAccepted
      ? `${toolId}: external-beta QA acceptance`
      : undefined,
    !evidence.externalBetaCostConcurrencyPrivacyRollbackAccepted
      ? `${toolId}: external-beta cost, concurrency, privacy, and rollback acceptance`
      : undefined,
    !evidence.externalBetaIncidentResponseAccepted
      ? `${toolId}: external-beta incident-response acceptance`
      : undefined,
    !evidence.externalBetaOwnerApprovalGranted
      ? `${toolId}: external-beta owner approval`
      : undefined,
  ].filter((blocker): blocker is string => Boolean(blocker))
}

function betaToolCallReadinessAccepted(
  toolCallReadiness: AiGraphicsBetaToolCallReadiness,
): boolean {
  return toolCallReadiness.totalAiGraphicsTools === 21 &&
    toolCallReadiness.totalProductFacingCapabilities === 12 &&
    toolCallReadiness.booleans.externalBetaToolCallReadinessSeparated === true &&
    toolCallReadiness.externalBetaToolCallableNowTools === 0 &&
    toolCallReadiness.externalBetaToolCallBlockedTools === 21
}

export function buildAiGraphicsExternalBetaReadinessGate(
  input: AiGraphicsExternalBetaReadinessEvidence = {},
): AiGraphicsExternalBetaReadinessGate {
  const evidence = normalizeEvidence(input)
  const betaReadiness = buildAiGraphicsBetaReadinessGate(evidence)
  const betaToolCallReadiness = buildAiGraphicsBetaToolCallReadiness({
    evidenceBundleInput: evidence,
  })
  const externalBetaGlobalBlockers = buildExternalGlobalBlockers(
    evidence,
    betaReadiness.betaTestingReadyTools,
  )
  const externalBetaReadyWithProvidedEvidence =
    betaReadiness.betaTestingReadyTools === 21 && externalBetaGlobalBlockers.length === 0

  const tools = betaReadiness.tools.map((tool): AiGraphicsExternalBetaReadinessToolGate => {
    const missingEvidenceBeforeExternalBeta = buildToolMissingEvidence(
      tool.toolId,
      tool.betaTestingReadyNow,
      evidence,
    )

    return {
      toolId: tool.toolId,
      installReady: true,
      productionMapped: true,
      planningSelectable: true,
      runtimeTarget: tool.runtimeTarget,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      betaTestingReadyWithProvidedEvidence: tool.betaTestingReadyNow,
      externalBetaReadyWithProvidedEvidence:
        tool.betaTestingReadyNow && missingEvidenceBeforeExternalBeta.length === 0,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      missingEvidenceBeforeExternalBeta,
      blockersBeforeExternalBetaLaunch: [
        ...tool.blockers,
        ...tool.externalBetaBlockers,
        ...missingEvidenceBeforeExternalBeta,
      ],
    }
  })

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION,
    sourceBetaReadinessDecision: betaReadiness.decision,
    sourceBetaToolCallReadinessDecision: betaToolCallReadiness.decision,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    installReadyTools: betaReadiness.installReadyTools,
    productionMappedTools: betaReadiness.productionMappedTools,
    planningSelectableTools: betaReadiness.planningSelectableTools,
    gpuRuntimeTargetedTools: betaReadiness.gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    betaTestingReadyWithProvidedEvidenceTools: betaReadiness.betaTestingReadyTools,
    externalBetaReadyWithProvidedEvidenceTools: externalBetaReadyWithProvidedEvidence ? 21 : 0,
    externalBetaReadyNowTools: 0,
    externalBetaBlockedNowTools: 21,
    productionReadyNowTools: 0,
    sourceBetaReadinessGateAccepted:
      betaReadiness.installReadyTools === 21 &&
      betaReadiness.productionMappedTools === 21 &&
      betaReadiness.gpuRuntimeTargetedTools.length === 8 &&
      betaReadiness.heavyToolsIncorrectlyTargetingCpu === 0,
    sourceToolCallReadinessSeparated: betaToolCallReadinessAccepted(betaToolCallReadiness),
    evidence,
    requiredExternalBetaGates,
    externalBetaGlobalBlockers,
    tools,
    booleans: {
      externalBetaReadinessGatePrepared: true,
      sourceBetaReadinessGateAccepted:
        betaReadiness.installReadyTools === 21 &&
        betaReadiness.productionMappedTools === 21 &&
        betaReadiness.gpuRuntimeTargetedTools.length === 8 &&
        betaReadiness.heavyToolsIncorrectlyTargetingCpu === 0,
      sourceBetaToolCallReadinessAccepted: betaToolCallReadinessAccepted(betaToolCallReadiness),
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsInstalledForPlannedSurface: betaReadiness.installReadyTools === 21,
      all21ToolsMappedToProductionRegistry: betaReadiness.productionMappedTools === 21,
      all8GpuToolsTargetGpuRuntime: betaReadiness.gpuRuntimeTargetedTools.length === 8,
      gpuRuntimeOnDemandOnly: true,
      externalBetaToolCallReadinessSeparated: betaToolCallReadinessAccepted(betaToolCallReadiness),
      externalBetaReadyWithProvidedEvidence,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
