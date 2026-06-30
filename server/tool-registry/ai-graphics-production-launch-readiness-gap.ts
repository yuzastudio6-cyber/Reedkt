import {
  AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION,
  type AiGraphicsBetaProductionReadinessRollup,
} from './ai-graphics-beta-production-readiness-rollup'
import {
  AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION,
  type AiGraphicsExternalBetaActivatedLaunchReadiness,
} from './ai-graphics-external-beta-activated-launch-readiness'
import {
  AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION,
  acceptedAiGraphicsProductionLaunchControls,
  type AiGraphicsProductionLaunchControls,
} from './ai-graphics-production-launch-controls'

export const AI_GRAPHICS_PRODUCTION_LAUNCH_READINESS_GAP_DECISION =
  'ai_graphics_production_launch_readiness_gap_prepared_external_beta_ready_production_blocked'

export type AiGraphicsProductionLaunchReadinessGapStatus =
  | 'missing_external_beta_activated_launch_readiness'
  | 'missing_beta_production_readiness_rollup'
  | 'beta_production_readiness_rollup_not_external_beta_ready'
  | 'production_launch_blocked_pending_production_controls'
  | 'production_launch_controls_accepted_pending_final_go_no_go'

export interface AiGraphicsProductionLaunchReadinessGapInput {
  sourceExternalBetaActivatedLaunchReadinessPacket?: AiGraphicsExternalBetaActivatedLaunchReadiness
  sourceBetaProductionReadinessRollupPacket?: AiGraphicsBetaProductionReadinessRollup
  sourceProductionLaunchControlsPacket?: AiGraphicsProductionLaunchControls
}

export interface AiGraphicsProductionLaunchReadinessGap {
  decision: typeof AI_GRAPHICS_PRODUCTION_LAUNCH_READINESS_GAP_DECISION
  status: AiGraphicsProductionLaunchReadinessGapStatus
  sourceExternalBetaActivatedLaunchReadinessDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION | null
  sourceBetaProductionReadinessRollupDecision:
    typeof AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION | null
  sourceProductionLaunchControlsDecision:
    typeof AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  externalBetaReadyNowTools: 0 | 21
  runtimeReadyForOnDemandExternalBetaToolCallTools: 0 | 21
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  productionLaunchBlockers: string[]
  nextMilestones: string[]
  booleans: {
    productionLaunchReadinessGapPrepared: true
    sourceExternalBetaActivatedLaunchReadinessAccepted: boolean
    sourceBetaProductionReadinessRollupAccepted: boolean
    sourceProductionLaunchControlsAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21ExternalBetaReadyForControlledOnDemandToolCalls: boolean
    productionLaunchControlsAccepted: boolean
    productionSupportRunbookAccepted: boolean
    productionIncidentRollbackAccepted: boolean
    productionCostConcurrencyAccepted: boolean
    productionMonitoringAccepted: boolean
    productionCreditLedgerAccepted: boolean
    productionRouteWorkerDeploymentAccepted: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: boolean
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

function scopedNumber(
  packet: unknown,
  topLevelKey: string,
  scopeKey = topLevelKey,
): number | undefined {
  const record = packet as Record<string, unknown> | undefined
  const scope = record?.scope as Record<string, unknown> | undefined
  const topLevelValue = record?.[topLevelKey]
  const scopeValue = scope?.[scopeKey]
  return typeof topLevelValue === 'number'
    ? topLevelValue
    : typeof scopeValue === 'number'
      ? scopeValue
      : undefined
}

function externalBetaActivatedLaunchReadinessAccepted(
  packet?: AiGraphicsExternalBetaActivatedLaunchReadiness,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION &&
    packet.status ===
      'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls' &&
    scopedNumber(packet, 'totalAiGraphicsTools') === 21 &&
    scopedNumber(packet, 'totalProductFacingCapabilities', 'productFacingCapabilities') === 12 &&
    scopedNumber(packet, 'gpuRuntimeTargetedTools') === 8 &&
    scopedNumber(packet, 'externalBetaReadyNowTools') === 21 &&
    scopedNumber(packet, 'runtimeReadyForOnDemandExternalBetaToolCallTools') === 21 &&
    scopedNumber(packet, 'productionReadyNowTools') === 0 &&
    packet.booleans.externalBetaReadyNow === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.productionReadyNow === false
}

function betaProductionReadinessRollupAccepted(
  packet?: AiGraphicsBetaProductionReadinessRollup,
): boolean {
  const counts = (packet as unknown as {
    counts?: {
      totalAiGraphicsTools?: number
      totalProductFacingCapabilities?: number
      gpuRuntimeTargetedTools?: number
      externalBetaReadyNowTools?: number
      productionReadyNowTools?: number
    }
  } | undefined)?.counts
  const totalAiGraphicsTools = packet?.totalAiGraphicsTools ?? counts?.totalAiGraphicsTools
  const totalProductFacingCapabilities =
    packet?.totalProductFacingCapabilities ?? counts?.totalProductFacingCapabilities
  const gpuRuntimeTargetedTools =
    packet?.gpuRuntimeTargetedTools ?? counts?.gpuRuntimeTargetedTools
  const externalBetaReadyNowTools =
    packet?.externalBetaReadyNowTools ?? counts?.externalBetaReadyNowTools
  const productionReadyNowTools =
    packet?.productionReadyNowTools ?? counts?.productionReadyNowTools

  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION &&
    packet.status === 'owner_approved_worker_gates_ready_runtime_still_blocked' &&
    totalAiGraphicsTools === 21 &&
    totalProductFacingCapabilities === 12 &&
    gpuRuntimeTargetedTools === 8 &&
    externalBetaReadyNowTools === 21 &&
    productionReadyNowTools === 0 &&
    packet.booleans.externalBetaReadyNow === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerExecutionApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.productionReadyNow === false
}

function statusFromSources(input: {
  hasActivatedLaunch: boolean
  activatedLaunchAccepted: boolean
  hasBetaProductionRollup: boolean
  betaProductionRollupAccepted: boolean
  productionLaunchControlsAccepted: boolean
}): AiGraphicsProductionLaunchReadinessGapStatus {
  if (!input.hasActivatedLaunch || !input.activatedLaunchAccepted) {
    return 'missing_external_beta_activated_launch_readiness'
  }
  if (!input.hasBetaProductionRollup) return 'missing_beta_production_readiness_rollup'
  if (!input.betaProductionRollupAccepted) {
    return 'beta_production_readiness_rollup_not_external_beta_ready'
  }
  if (input.productionLaunchControlsAccepted) {
    return 'production_launch_controls_accepted_pending_final_go_no_go'
  }
  return 'production_launch_blocked_pending_production_controls'
}

export function buildAiGraphicsProductionLaunchReadinessGap(
  input: AiGraphicsProductionLaunchReadinessGapInput = {},
): AiGraphicsProductionLaunchReadinessGap {
  const sourceExternalBetaActivatedLaunchReadinessAccepted =
    externalBetaActivatedLaunchReadinessAccepted(
      input.sourceExternalBetaActivatedLaunchReadinessPacket,
    )
  const sourceBetaProductionReadinessRollupAccepted =
    betaProductionReadinessRollupAccepted(input.sourceBetaProductionReadinessRollupPacket)
  const sourceProductionLaunchControlsAccepted =
    acceptedAiGraphicsProductionLaunchControls(input.sourceProductionLaunchControlsPacket)
  const status = statusFromSources({
    hasActivatedLaunch: Boolean(input.sourceExternalBetaActivatedLaunchReadinessPacket),
    activatedLaunchAccepted: sourceExternalBetaActivatedLaunchReadinessAccepted,
    hasBetaProductionRollup: Boolean(input.sourceBetaProductionReadinessRollupPacket),
    betaProductionRollupAccepted: sourceBetaProductionReadinessRollupAccepted,
    productionLaunchControlsAccepted: sourceProductionLaunchControlsAccepted,
  })
  const externalBetaReady =
    status === 'production_launch_blocked_pending_production_controls' ||
    status === 'production_launch_controls_accepted_pending_final_go_no_go'

  return {
    decision: AI_GRAPHICS_PRODUCTION_LAUNCH_READINESS_GAP_DECISION,
    status,
    sourceExternalBetaActivatedLaunchReadinessDecision:
      input.sourceExternalBetaActivatedLaunchReadinessPacket?.decision ?? null,
    sourceBetaProductionReadinessRollupDecision:
      input.sourceBetaProductionReadinessRollupPacket?.decision ?? null,
    sourceProductionLaunchControlsDecision:
      input.sourceProductionLaunchControlsPacket?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    externalBetaReadyNowTools: externalBetaReady ? 21 : 0,
    runtimeReadyForOnDemandExternalBetaToolCallTools: externalBetaReady ? 21 : 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    productionLaunchBlockers: sourceProductionLaunchControlsAccepted
      ? [
        'final production go/no-go packet',
        'explicit production traffic cutover approval',
        'post-approval production execution remains future backend/worker runtime',
      ]
      : [
        'separate production launch owner approval',
        'production support and incident-response runbook',
        'production rollback and kill-switch plan',
        'production cost and concurrency ceilings',
        'production monitoring, alerting, and post-launch review',
        'production credit ledger and approval snapshot enforcement',
        'production Tool Route and Worker deployment acceptance',
        'production privacy, retention, and private artifact controls',
      ],
    nextMilestones: [
      'Create a production launch approval packet that accepts support, incident, rollback, monitoring, cost, privacy, credit-ledger, route, and worker deployment controls.',
      'Keep GPU runtime on-demand only; do not start GPU until a future accepted production worker job calls a GPU/model tool.',
      'Keep production-ready false until the production launch approval packet is accepted.',
    ],
    booleans: {
      productionLaunchReadinessGapPrepared: true,
      sourceExternalBetaActivatedLaunchReadinessAccepted,
      sourceBetaProductionReadinessRollupAccepted,
      sourceProductionLaunchControlsAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21ExternalBetaReadyForControlledOnDemandToolCalls: externalBetaReady,
      productionLaunchControlsAccepted: sourceProductionLaunchControlsAccepted,
      productionSupportRunbookAccepted: sourceProductionLaunchControlsAccepted,
      productionIncidentRollbackAccepted: sourceProductionLaunchControlsAccepted,
      productionCostConcurrencyAccepted: sourceProductionLaunchControlsAccepted,
      productionMonitoringAccepted: sourceProductionLaunchControlsAccepted,
      productionCreditLedgerAccepted: sourceProductionLaunchControlsAccepted,
      productionRouteWorkerDeploymentAccepted: sourceProductionLaunchControlsAccepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: externalBetaReady,
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
