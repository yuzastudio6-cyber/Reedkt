import {
  AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION,
  buildAiGraphicsExternalBetaReadinessGate,
  type AiGraphicsExternalBetaReadinessEvidence,
} from './ai-graphics-external-beta-readiness-gate'
import {
  AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION,
  buildAiGraphicsExternalBetaEvidenceScaffoldPacket,
} from './ai-graphics-external-beta-evidence-scaffold'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION =
  'ai_graphics_external_beta_launch_gap_report_prepared_with_remaining_blocks'

export interface AiGraphicsExternalBetaLaunchToolGap {
  toolId: AiGraphicsCanonicalToolId
  runtimeTarget: string
  gpuRequiredForRuntime: boolean
  installReady: true
  productionMapped: true
  planningSelectable: true
  evidenceTemplatePrepared: true
  externalBetaCandidateWithProvidedEvidence: boolean
  externalBetaReadyNow: false
  productionReadyNow: false
  missingEvidenceBeforeExternalBeta: string[]
  remainingLaunchGates: string[]
  nextExternalBetaAction: string
}

export interface AiGraphicsExternalBetaLaunchGapReport {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION
  sourceExternalBetaReadinessGateDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION
  sourceEvidenceScaffoldDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  evidenceScaffoldRecordsPrepared: 21
  installReadyTools: 21
  productionMappedTools: 21
  planningSelectableTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  gpuRuntimeOnDemandOnly: true
  runtimeProofBridge: {
    checkedInRuntimeProofAcceptedWithProvidedEvidenceTools: 13
    checkedInBlockedPendingNativeGpuRuntimeProofTools: 8
    readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21
    readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8
    readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0
    sourcePacketFlag: '--external-beta-native-gpu-proof-collection-packet'
    sourceCollectionDecision:
      'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready'
    perToolRecheckDecision:
      'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks'
    gpuRuntimeShouldStartNow: false
  }
  launchCohorts: {
    cpuStaticAndBrowserCohortTools: 13
    nativeGpuModelCohortTools: 8
    allToolsCandidateAfterFullEvidence: 21
  }
  externalBetaCandidatesWithProvidedEvidenceTools: number
  externalBetaReadyNowTools: 0
  externalBetaBlockedNowTools: 21
  productionReadyNowTools: 0
  globalLaunchBlockers: string[]
  externalBetaLaunchSequence: string[]
  tools: AiGraphicsExternalBetaLaunchToolGap[]
  booleans: {
    externalBetaLaunchGapReportPrepared: true
    sourceExternalBetaReadinessGateAccepted: true
    sourceExternalBetaEvidenceScaffoldAccepted: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsInstalledForPlannedSurface: true
    all21ToolsMappedToProductionRegistry: true
    evidenceScaffoldPreparedForAll21Tools: true
    gpuRuntimeOnDemandOnly: true
    externalBetaCandidatesWithProvidedEvidence: boolean
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

const externalBetaLaunchSequence = [
  'Generate local-only external-beta evidence templates with ai-graphics:external-beta-evidence-scaffold.',
  'Replace all rejected public placeholders with private/backend evidence refs after real runtime soak, external QA, cost/concurrency/privacy/rollback, incident, and owner approval evidence exists.',
  'Validate the sanitized evidence with ai-graphics:external-beta-evidence-packet:validate.',
  'Feed the validated packet into ai-graphics:external-beta-readiness-gate with the already accepted shared, browser, GPU, and model-manifest evidence gates.',
  'Run a separate external-beta launch go/no-go that checks rollout cohort, cost ceiling, concurrency ceiling, rollback, incident response, private artifact handling, and support ownership before enabling user-facing tool calls.',
]

const finalLaunchGateBlockers = [
  'external beta launch switch is not approved',
  'external beta rollout cohort is not approved',
  'external beta cost and concurrency ceiling is not approved',
  'external beta rollback and incident-response runbook is not approved for live users',
  'external beta private artifact retention and support ownership are not approved',
]

function nextExternalBetaAction(input: {
  toolId: AiGraphicsCanonicalToolId
  candidateWithProvidedEvidence: boolean
  missingEvidence: readonly string[]
  gpuRequiredForRuntime: boolean
}): string {
  if (input.missingEvidence.length > 0) {
    return `Collect and validate private external-beta evidence refs for ${input.toolId}.`
  }
  if (input.gpuRequiredForRuntime) {
    return `Run ${input.toolId} through the external-beta launch go/no-go with on-demand GPU cost and concurrency limits before exposing it to users.`
  }
  if (input.candidateWithProvidedEvidence) {
    return `Run ${input.toolId} through the external-beta launch go/no-go before exposing it to users.`
  }
  return `Prepare external-beta evidence refs for ${input.toolId}.`
}

export function buildAiGraphicsExternalBetaLaunchGapReport(
  input: AiGraphicsExternalBetaReadinessEvidence = {},
): AiGraphicsExternalBetaLaunchGapReport {
  const readinessGate = buildAiGraphicsExternalBetaReadinessGate(input)
  const evidenceScaffold = buildAiGraphicsExternalBetaEvidenceScaffoldPacket()
  const externalBetaCandidatesWithProvidedEvidenceTools = readinessGate.tools
    .filter((tool) => tool.externalBetaReadyWithProvidedEvidence).length

  const tools = readinessGate.tools.map((tool): AiGraphicsExternalBetaLaunchToolGap => {
    const scaffoldRecord = evidenceScaffold.scaffoldRecords.find((record) => record.toolId === tool.toolId)
    if (!scaffoldRecord) {
      throw new Error(`Missing external-beta evidence scaffold record: ${tool.toolId}`)
    }

    return {
      toolId: tool.toolId,
      runtimeTarget: tool.runtimeTarget,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      installReady: true,
      productionMapped: true,
      planningSelectable: true,
      evidenceTemplatePrepared: true,
      externalBetaCandidateWithProvidedEvidence: tool.externalBetaReadyWithProvidedEvidence,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      missingEvidenceBeforeExternalBeta: [...tool.missingEvidenceBeforeExternalBeta],
      remainingLaunchGates: tool.externalBetaReadyWithProvidedEvidence
        ? [...finalLaunchGateBlockers]
        : [...tool.missingEvidenceBeforeExternalBeta, ...finalLaunchGateBlockers],
      nextExternalBetaAction: nextExternalBetaAction({
        toolId: tool.toolId,
        candidateWithProvidedEvidence: tool.externalBetaReadyWithProvidedEvidence,
        missingEvidence: tool.missingEvidenceBeforeExternalBeta,
        gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      }),
    }
  })

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION,
    sourceExternalBetaReadinessGateDecision: AI_GRAPHICS_EXTERNAL_BETA_READINESS_GATE_DECISION,
    sourceEvidenceScaffoldDecision: AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    evidenceScaffoldRecordsPrepared: evidenceScaffold.scaffoldRecordsPrepared,
    installReadyTools: readinessGate.installReadyTools,
    productionMappedTools: readinessGate.productionMappedTools,
    planningSelectableTools: readinessGate.planningSelectableTools,
    gpuRuntimeTargetedTools: readinessGate.gpuRuntimeTargetedTools,
    gpuRuntimeOnDemandOnly: true,
    runtimeProofBridge: {
      checkedInRuntimeProofAcceptedWithProvidedEvidenceTools: 13,
      checkedInBlockedPendingNativeGpuRuntimeProofTools: 8,
      readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools: 21,
      readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools: 8,
      readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools: 0,
      sourcePacketFlag: '--external-beta-native-gpu-proof-collection-packet',
      sourceCollectionDecision:
        'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready',
      perToolRecheckDecision:
        'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks',
      gpuRuntimeShouldStartNow: false,
    },
    launchCohorts: {
      cpuStaticAndBrowserCohortTools: 13,
      nativeGpuModelCohortTools: 8,
      allToolsCandidateAfterFullEvidence: 21,
    },
    externalBetaCandidatesWithProvidedEvidenceTools,
    externalBetaReadyNowTools: 0,
    externalBetaBlockedNowTools: 21,
    productionReadyNowTools: 0,
    globalLaunchBlockers: [
      ...readinessGate.externalBetaGlobalBlockers,
      ...finalLaunchGateBlockers,
    ],
    externalBetaLaunchSequence,
    tools,
    booleans: {
      externalBetaLaunchGapReportPrepared: true,
      sourceExternalBetaReadinessGateAccepted: true,
      sourceExternalBetaEvidenceScaffoldAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsInstalledForPlannedSurface: true,
      all21ToolsMappedToProductionRegistry: true,
      evidenceScaffoldPreparedForAll21Tools: true,
      gpuRuntimeOnDemandOnly: true,
      externalBetaCandidatesWithProvidedEvidence:
        externalBetaCandidatesWithProvidedEvidenceTools === 21,
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
