import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  buildAiGraphicsCrossOwnerCoordinationPacket,
  type AiGraphicsCrossOwnerCoordinationPacket,
} from './ai-graphics-cross-owner-coordination'
import {
  buildAiGraphicsExternalBetaReadinessGate,
  type AiGraphicsExternalBetaReadinessEvidence,
  type AiGraphicsExternalBetaReadinessGate,
} from './ai-graphics-external-beta-readiness-gate'
import {
  buildAiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
  type AiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
} from './ai-graphics-external-beta-service-role-queue-smoke-preflight'
import type {
  AiGraphicsExternalBetaServiceRoleQueueSmokeProof,
} from './ai-graphics-external-beta-service-role-queue-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaWorkerDispatchSmokeProof,
} from './ai-graphics-external-beta-worker-dispatch-smoke-proof'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_BETA_END_TO_END_READINESS_DECISION =
  'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks'

export type AiGraphicsExternalBetaEndToEndReadinessStatus =
  | 'installed_and_mapped_runtime_blocked'
  | 'external_beta_candidate_with_provided_evidence_runtime_still_blocked'

export interface AiGraphicsExternalBetaEndToEndReadinessInput
  extends AiGraphicsExternalBetaReadinessEvidence {
  externalBetaServiceRoleQueueSmokePreflight?:
    AiGraphicsExternalBetaServiceRoleQueueSmokePreflight
  externalBetaServiceRoleQueueSmokeProof?: AiGraphicsExternalBetaServiceRoleQueueSmokeProof
}

export interface AiGraphicsExternalBetaEndToEndToolReadiness {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId | null
  workerType: ProductionRegistryWorkerType | 'none'
  runtimeTarget: string
  installSurface: string
  installReadyForPlannedSurface: true
  productionMapped: boolean
  rankingSelectionReadyForPlanning: true
  gpuRequiredForRuntime: boolean
  cpuFallbackAllowedForHeavyTool: false
  betaTechnicalEvidenceReadyWithProvidedEvidence: boolean
  externalBetaCandidateReadyWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  missingEndToEndGates: string[]
  nextProofMilestone: string
}

export interface AiGraphicsExternalBetaEndToEndReadiness {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_END_TO_END_READINESS_DECISION
  status: AiGraphicsExternalBetaEndToEndReadinessStatus
  sourceExternalBetaReadinessGateDecision: AiGraphicsExternalBetaReadinessGate['decision']
  sourceCrossOwnerCoordinationDecision: AiGraphicsCrossOwnerCoordinationPacket['decision']
  counts: {
    totalAiGraphicsTools: 21
    totalProductFacingCapabilities: 12
    installReadyTools: number
    productionMappedTools: number
    planningSelectableTools: number
    gpuRuntimeTargetedTools: number
    heavyToolsIncorrectlyTargetingCpu: 0
    duplicateCanonicalToolIds: number
    duplicateAiGraphicsProductionToolIds: number
    missingProductionProfiles: number
    trackAExcludedOverlaps: number
    nonAiGraphicsReservedOverlaps: number
    betaTechnicalEvidenceReadyWithProvidedEvidenceTools: number
    externalBetaCandidateReadyWithProvidedEvidenceTools: number
    serviceRoleQueueSmokePreflightPayloadsPrepared: number
    serviceRoleQueueSmokePreflightReadyToExecute: 0 | 1
    serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence: number
    serviceRoleQueueSmokeProofLiveQueueWritesAcceptedWithProvidedEvidence: number
    workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence: number
    workerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence: number
    workerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence: number
    externalBetaLaunchControlsAcceptedWithProvidedEvidence: 0 | 1
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  runtimePolicy: {
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    cpuFallbackAllowedForHeavyTools: false
    externalBetaCandidateDoesNotStartRuntime: true
  }
  requiredEndToEndGates: string[]
  globalBlockers: string[]
  sourceExternalBetaReadinessGate: AiGraphicsExternalBetaReadinessGate
  serviceRoleQueueSmokePreflight: AiGraphicsExternalBetaServiceRoleQueueSmokePreflight
  serviceRoleQueueSmokeProof: AiGraphicsExternalBetaServiceRoleQueueSmokeProof | null
  workerDispatchSmokeProof: AiGraphicsExternalBetaWorkerDispatchSmokeProof | null
  crossOwnerCoordination: AiGraphicsCrossOwnerCoordinationPacket
  tools: AiGraphicsExternalBetaEndToEndToolReadiness[]
  nextMilestones: string[]
  booleans: {
    externalBetaEndToEndReadinessPrepared: true
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all21ToolsInstalledForPlannedSurface: boolean
    all21ToolsMappedToProductionRegistry: boolean
    noDuplicateAiGraphicsProductionMappings: boolean
    noCrossOwnerProductionMappingConflicts: boolean
    rankingSystemConnectedForToolCalls: true
    all8GpuToolsTargetGpuRuntime: boolean
    heavyToolsIncorrectlyTargetingCpuAbsent: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    serviceRoleQueueSmokePreflightPrepared: true
    serviceRoleQueueSmokePayloadsPreparedForAll21Tools: boolean
    serviceRoleQueueSmokeEnvironmentReady: boolean
    serviceRoleQueueSmokeFlagsReady: boolean
    serviceRoleQueueSmokeReadyToExecute: boolean
    serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence: boolean
    serviceRoleQueueSmokeProofQueueWritesAcceptedWithProvidedEvidence: boolean
    serviceRoleQueueSmokeProofWorkerClaimsAcceptedWithProvidedEvidence: boolean
    workerDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
    workerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence: boolean
    workerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence: boolean
    externalBetaLaunchControlsAcceptedWithProvidedEvidence: boolean
    externalBetaCandidateReadyWithProvidedEvidence: boolean
    externalBetaReadyNow: false
    productionReadyNow: false
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

const requiredEndToEndGates = [
  'all 21 tools installed or install-proof-targeted on the correct ReeditPro runtime surface',
  'all 21 tools mapped to unique production tool IDs without Track A or Track B ownership conflicts',
  'canonical ranking/selection contract connected to tool-call readiness for all 12 product-facing capabilities',
  'approved plan snapshot gate accepted for every external-beta tool call',
  'credit reservation gate accepted for every external-beta tool call',
  'private artifact boundary accepted for every external-beta tool call',
  'Tool Route and Worker gates accepted for every external-beta tool call',
  'service-role queue smoke preflight ready with all 21 payload previews and non-production env/flags',
  'saved service-role queue smoke proof accepted with 21 queue writes, 21 worker claims, cleanup, and no tool execution',
  'native NVIDIA L4 runtime proof accepted for all eight GPU/model tools',
  'private model-weight or model-cache manifests accepted for model-backed tools',
  'external-beta worker dispatch smoke proof accepted without tool execution',
  'external-beta QA, cost, concurrency, privacy, rollback, incident-response, and owner approval accepted',
]

const nextMilestones = [
  'Collect or feed accepted native NVIDIA L4 runtime proof for the eight GPU/model tools; do not permit CPU fallback for heavy model paths.',
  'Feed accepted model-weight and private artifact manifests for SAM2, BiRefNet, Real-ESRGAN, rembg, and transparent-background.',
  'Run the service-role queue smoke preflight in the non-production server environment; verify all env vars, flags, and 21 payload previews before live smoke.',
  'Run the non-production service-role queue and worker dispatch smokes, then validate saved proof packets without executing tools.',
  'Bind external-beta feature flag, rollout, cost/concurrency, privacy, rollback, incident, support, and owner approval refs.',
  'Only after those gates pass, promote tool calls through the approved worker path with on-demand GPU startup per accepted job.',
]

function gateByTool(
  gate: AiGraphicsExternalBetaReadinessGate,
): Map<AiGraphicsCanonicalToolId, AiGraphicsExternalBetaReadinessGate['tools'][number]> {
  return new Map(gate.tools.map((tool) => [tool.toolId, tool]))
}

function buildToolMissingGates(input: {
  sourceGateTool: AiGraphicsExternalBetaReadinessGate['tools'][number] | undefined
  gpuRequiredForRuntime: boolean
}): string[] {
  const fromGate = input.sourceGateTool?.blockersBeforeExternalBetaLaunch ?? [
    'source external-beta readiness gate did not include this tool',
  ]
  const extra = [
    input.gpuRequiredForRuntime
      ? 'GPU/model runtime must stay native NVIDIA L4 and on-demand only'
      : undefined,
    'live Tool Route, Worker dispatch, provider/model runtime, browser/canvas/WebGL runtime, GPU runtime, storage, public artifact, signed URL, external beta traffic, and production remain disabled until final approval',
  ].filter((item): item is string => Boolean(item))

  return [...new Set([...fromGate, ...extra])]
}

function statusFromGate(input: {
  gate: AiGraphicsExternalBetaReadinessGate
  serviceRoleQueueSmokePreflight: AiGraphicsExternalBetaServiceRoleQueueSmokePreflight
  serviceRoleQueueSmokeProofAccepted: boolean
  workerDispatchSmokeProofAccepted: boolean
}):
  AiGraphicsExternalBetaEndToEndReadinessStatus {
  return input.gate.externalBetaReadyWithProvidedEvidenceTools === 21 &&
    input.serviceRoleQueueSmokePreflight.readyToExecuteLiveNonProductionSmoke === true &&
    input.serviceRoleQueueSmokeProofAccepted &&
    input.workerDispatchSmokeProofAccepted
    ? 'external_beta_candidate_with_provided_evidence_runtime_still_blocked'
    : 'installed_and_mapped_runtime_blocked'
}

function serviceRoleQueueSmokeProofAccepted(
  packet: AiGraphicsExternalBetaServiceRoleQueueSmokeProof | undefined,
): packet is AiGraphicsExternalBetaServiceRoleQueueSmokeProof {
  return Boolean(
    packet &&
      packet.decision === 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks' &&
      packet.proofAcceptedWithProvidedEvidence === true &&
      packet.counts.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
      packet.counts.sourceLiveQueueWritesAcceptedWithProvidedEvidence === 21 &&
      packet.counts.sourceWorkerClaimRowsAcceptedWithProvidedEvidence === 21 &&
      packet.counts.sourceWorkerDispatchesAcceptedWithProvidedEvidence === 0 &&
      packet.counts.sourceToolExecutionsAcceptedWithProvidedEvidence === 0 &&
      packet.counts.cleanupPersistedRowsAfterSmoke === 0 &&
      packet.counts.externalBetaReadyNowTools === 0 &&
      packet.counts.productionReadyNowTools === 0 &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

function workerDispatchSmokeProofAccepted(
  packet: AiGraphicsExternalBetaWorkerDispatchSmokeProof | undefined,
): packet is AiGraphicsExternalBetaWorkerDispatchSmokeProof {
  return Boolean(
    packet &&
      packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_PROOF_DECISION &&
      packet.decision === 'external_beta_worker_dispatch_smoke_proof_accepted_with_runtime_blocks' &&
      packet.proofAcceptedWithProvidedEvidence === true &&
      packet.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
      packet.counts.sourceSmokeJobsCompletedWithProvidedEvidence === 21 &&
      packet.counts.sourceCapabilityScenariosCompletedWithProvidedEvidence === 12 &&
      packet.counts.sourceInMemoryLeaseRecordsCreated === 21 &&
      packet.counts.sourceInMemoryLeaseRecordsReleased === 21 &&
      packet.counts.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
      packet.counts.sourceLiveWorkerLeasesCreatedNow === 0 &&
      packet.counts.sourceLiveWorkerDispatchesNow === 0 &&
      packet.counts.sourceLiveToolExecutionsNow === 0 &&
      packet.counts.externalBetaReadyNowTools === 0 &&
      packet.counts.productionReadyNowTools === 0 &&
      packet.evidence.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === true &&
      packet.booleans.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function buildAiGraphicsExternalBetaEndToEndReadiness(
  input: AiGraphicsExternalBetaEndToEndReadinessInput = {},
): AiGraphicsExternalBetaEndToEndReadiness {
  const sourceExternalBetaReadinessGate = buildAiGraphicsExternalBetaReadinessGate(input)
  const serviceRoleQueueSmokePreflight =
    input.externalBetaServiceRoleQueueSmokePreflight ??
    buildAiGraphicsExternalBetaServiceRoleQueueSmokePreflight()
  const serviceRoleQueueSmokeProof = input.externalBetaServiceRoleQueueSmokeProof ?? null
  const sourceServiceRoleQueueSmokeProofAccepted = serviceRoleQueueSmokeProofAccepted(
    input.externalBetaServiceRoleQueueSmokeProof,
  )
  const workerDispatchSmokeProof = input.externalBetaWorkerDispatchSmokeProof ?? null
  const sourceWorkerDispatchSmokeProofAccepted = workerDispatchSmokeProofAccepted(
    input.externalBetaWorkerDispatchSmokeProof,
  )
  const crossOwnerCoordination = buildAiGraphicsCrossOwnerCoordinationPacket()
  const sourceGateToolsById = gateByTool(sourceExternalBetaReadinessGate)
  const readinessRecords = listAiGraphicsToolCallReadiness()

  const tools = readinessRecords.map((record): AiGraphicsExternalBetaEndToEndToolReadiness => {
    const sourceGateTool = sourceGateToolsById.get(record.toolId)
    const externalBetaCandidateReadyWithProvidedEvidence =
      sourceGateTool?.externalBetaReadyWithProvidedEvidence === true &&
      serviceRoleQueueSmokePreflight.readyToExecuteLiveNonProductionSmoke === true &&
      sourceServiceRoleQueueSmokeProofAccepted &&
      sourceWorkerDispatchSmokeProofAccepted
    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: record.productionWorkerType,
      runtimeTarget: record.runtimeTarget,
      installSurface: record.installSurface,
      installReadyForPlannedSurface: true,
      productionMapped: record.productionToolId !== null,
      rankingSelectionReadyForPlanning: true,
      gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      cpuFallbackAllowedForHeavyTool: false,
      betaTechnicalEvidenceReadyWithProvidedEvidence:
        sourceGateTool?.betaTestingReadyWithProvidedEvidence === true,
      externalBetaCandidateReadyWithProvidedEvidence,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      missingEndToEndGates: buildToolMissingGates({
        sourceGateTool,
        gpuRequiredForRuntime: record.gpuRequiredForRuntime,
      }),
      nextProofMilestone: record.nextProofMilestone,
    }
  })

  const productionMappedTools = tools.filter((tool) => tool.productionMapped).length
  const gpuRuntimeTargetedTools = tools.filter((tool) => tool.gpuRequiredForRuntime).length
  const all21ToolsCovered =
    tools.length === 21 &&
    AI_GRAPHICS_CANONICAL_TOOL_IDS.every((toolId) => tools.some((tool) => tool.toolId === toolId))
  const globalBlockers = [
    ...sourceExternalBetaReadinessGate.externalBetaGlobalBlockers,
    crossOwnerCoordination.booleans.crossOwnerCoordinationVerified
      ? undefined
      : 'cross-owner coordination packet is not accepted',
    crossOwnerCoordination.booleans.allAiGraphicsProductionMappingsUnique
      ? undefined
      : 'duplicate AI graphics production tool mapping exists',
    crossOwnerCoordination.booleans.trackAExcludedToolsNotClaimed
      ? undefined
      : 'AI graphics overlaps with Track A render/export ownership',
    crossOwnerCoordination.booleans.nonAiGraphicsReservedToolIdsNotClaimed
      ? undefined
      : 'AI graphics overlaps with non-AI-graphics reserved production tool IDs',
    serviceRoleQueueSmokePreflight.all21PayloadsPrepared
      ? undefined
      : 'service-role queue smoke preflight did not prepare all 21 payload previews',
    serviceRoleQueueSmokePreflight.missingEnvironment.length === 0
      ? undefined
      : `service-role queue smoke preflight missing environment: ${serviceRoleQueueSmokePreflight.missingEnvironment.join(', ')}`,
    serviceRoleQueueSmokePreflight.missingFlags.length === 0
      ? undefined
      : `service-role queue smoke preflight missing flags: ${serviceRoleQueueSmokePreflight.missingFlags.join(', ')}`,
    serviceRoleQueueSmokePreflight.sourceRuntimeQueueServiceProofBridgeAccepted
      ? undefined
      : 'service-role queue smoke preflight missing accepted runtime queue service proof bridge',
    sourceServiceRoleQueueSmokeProofAccepted
      ? undefined
      : 'saved service-role queue smoke proof is not accepted with provided evidence',
    sourceWorkerDispatchSmokeProofAccepted
      ? undefined
      : 'saved worker-dispatch smoke proof is not accepted with provided evidence',
  ].filter((blocker): blocker is string => Boolean(blocker))

  const externalBetaCandidateReadyWithProvidedEvidence =
    sourceExternalBetaReadinessGate.externalBetaReadyWithProvidedEvidenceTools === 21 &&
    serviceRoleQueueSmokePreflight.readyToExecuteLiveNonProductionSmoke === true &&
    sourceServiceRoleQueueSmokeProofAccepted &&
    sourceWorkerDispatchSmokeProofAccepted &&
    globalBlockers.length === 0

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_END_TO_END_READINESS_DECISION,
    status: statusFromGate({
      gate: sourceExternalBetaReadinessGate,
      serviceRoleQueueSmokePreflight,
      serviceRoleQueueSmokeProofAccepted: sourceServiceRoleQueueSmokeProofAccepted,
      workerDispatchSmokeProofAccepted: sourceWorkerDispatchSmokeProofAccepted,
    }),
    sourceExternalBetaReadinessGateDecision: sourceExternalBetaReadinessGate.decision,
    sourceCrossOwnerCoordinationDecision: crossOwnerCoordination.decision,
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      installReadyTools: sourceExternalBetaReadinessGate.installReadyTools,
      productionMappedTools,
      planningSelectableTools: sourceExternalBetaReadinessGate.planningSelectableTools,
      gpuRuntimeTargetedTools,
      heavyToolsIncorrectlyTargetingCpu: 0,
      duplicateCanonicalToolIds: crossOwnerCoordination.counts.duplicateCanonicalToolIds,
      duplicateAiGraphicsProductionToolIds:
        crossOwnerCoordination.counts.duplicateProductionToolIds,
      missingProductionProfiles: crossOwnerCoordination.counts.missingProductionProfiles,
      trackAExcludedOverlaps: crossOwnerCoordination.counts.trackAExcludedOverlaps,
      nonAiGraphicsReservedOverlaps: crossOwnerCoordination.counts.nonAiGraphicsReservedOverlaps,
      betaTechnicalEvidenceReadyWithProvidedEvidenceTools:
        sourceExternalBetaReadinessGate.betaTestingReadyWithProvidedEvidenceTools,
      externalBetaCandidateReadyWithProvidedEvidenceTools:
        externalBetaCandidateReadyWithProvidedEvidence
          ? sourceExternalBetaReadinessGate.externalBetaReadyWithProvidedEvidenceTools
          : 0,
      serviceRoleQueueSmokePreflightPayloadsPrepared:
        serviceRoleQueueSmokePreflight.payloadPreviews.length,
      serviceRoleQueueSmokePreflightReadyToExecute:
        serviceRoleQueueSmokePreflight.readyToExecuteLiveNonProductionSmoke ? 1 : 0,
      serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence:
        sourceServiceRoleQueueSmokeProofAccepted && serviceRoleQueueSmokeProof
          ? serviceRoleQueueSmokeProof.counts.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence
          : 0,
      serviceRoleQueueSmokeProofLiveQueueWritesAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokeProofAccepted && serviceRoleQueueSmokeProof
          ? serviceRoleQueueSmokeProof.counts.sourceLiveQueueWritesAcceptedWithProvidedEvidence
          : 0,
      workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted && workerDispatchSmokeProof
          ? workerDispatchSmokeProof.counts.workerDispatchSmokeProofAcceptedToolsWithProvidedEvidence
          : 0,
      workerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted && workerDispatchSmokeProof
          ? workerDispatchSmokeProof.counts.sourceSmokeJobsCompletedWithProvidedEvidence
          : 0,
      workerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted && workerDispatchSmokeProof
          ? workerDispatchSmokeProof.counts.sourceInMemoryLeaseRecordsCreated
          : 0,
      externalBetaLaunchControlsAcceptedWithProvidedEvidence:
        sourceExternalBetaReadinessGate.evidence.externalBetaLaunchControlsAccepted ? 1 : 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    runtimePolicy: {
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      externalBetaCandidateDoesNotStartRuntime: true,
    },
    requiredEndToEndGates,
    globalBlockers,
    sourceExternalBetaReadinessGate,
    serviceRoleQueueSmokePreflight,
    serviceRoleQueueSmokeProof,
    workerDispatchSmokeProof,
    crossOwnerCoordination,
    tools,
    nextMilestones,
    booleans: {
      externalBetaEndToEndReadinessPrepared: true,
      all21ToolsCovered,
      all12CapabilitiesCovered:
        sourceExternalBetaReadinessGate.totalProductFacingCapabilities === 12,
      all21ToolsInstalledForPlannedSurface:
        sourceExternalBetaReadinessGate.installReadyTools === 21,
      all21ToolsMappedToProductionRegistry: productionMappedTools === 21,
      noDuplicateAiGraphicsProductionMappings:
        crossOwnerCoordination.counts.duplicateProductionToolIds === 0,
      noCrossOwnerProductionMappingConflicts:
        crossOwnerCoordination.counts.trackAExcludedOverlaps === 0 &&
        crossOwnerCoordination.counts.nonAiGraphicsReservedOverlaps === 0,
      rankingSystemConnectedForToolCalls: true,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      heavyToolsIncorrectlyTargetingCpuAbsent: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      serviceRoleQueueSmokePreflightPrepared: true,
      serviceRoleQueueSmokePayloadsPreparedForAll21Tools:
        serviceRoleQueueSmokePreflight.all21PayloadsPrepared,
      serviceRoleQueueSmokeEnvironmentReady:
        serviceRoleQueueSmokePreflight.missingEnvironment.length === 0,
      serviceRoleQueueSmokeFlagsReady:
        serviceRoleQueueSmokePreflight.missingFlags.length === 0,
      serviceRoleQueueSmokeReadyToExecute:
        serviceRoleQueueSmokePreflight.readyToExecuteLiveNonProductionSmoke,
      serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokeProofAccepted,
      serviceRoleQueueSmokeProofQueueWritesAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokeProofAccepted &&
        serviceRoleQueueSmokeProof?.counts.sourceLiveQueueWritesAcceptedWithProvidedEvidence === 21,
      serviceRoleQueueSmokeProofWorkerClaimsAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokeProofAccepted &&
        serviceRoleQueueSmokeProof?.counts.sourceWorkerClaimRowsAcceptedWithProvidedEvidence === 21,
      workerDispatchSmokeProofAcceptedWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted,
      workerDispatchSmokeProofSmokeJobsAcceptedWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted &&
        workerDispatchSmokeProof?.counts.sourceSmokeJobsCompletedWithProvidedEvidence === 21,
      workerDispatchSmokeProofInMemoryLeasesAcceptedWithProvidedEvidence:
        sourceWorkerDispatchSmokeProofAccepted &&
        workerDispatchSmokeProof?.counts.sourceInMemoryLeaseRecordsCreated === 21 &&
        workerDispatchSmokeProof?.counts.sourceInMemoryLeaseRecordsReleased === 21,
      externalBetaLaunchControlsAcceptedWithProvidedEvidence:
        sourceExternalBetaReadinessGate.evidence.externalBetaLaunchControlsAccepted,
      externalBetaCandidateReadyWithProvidedEvidence,
      externalBetaReadyNow: false,
      productionReadyNow: false,
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
