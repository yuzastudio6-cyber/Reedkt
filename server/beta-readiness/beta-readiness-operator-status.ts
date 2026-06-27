import type { BetaReadinessReport } from './beta-readiness-types'

export interface BetaReadinessBackendOperatorStatusOptions {
  workspaceId?: string
  evidencePacketCount?: number
}

export interface BetaReadinessBackendOperatorStatusReport {
  readyForExternalBeta: boolean
  readyForRealUserMediaBeta: boolean
  readyForPaidProduction: boolean
  evidenceSource: 'default_source_truth' | 'stored_workspace_evidence'
  workspaceId?: string
  evidencePacketCount: number
  currentGate: {
    totalTools: number
    ownerCoverageToolCount: number
    readinessSpecToolCount: number
    toolBlockers: number
    platformBlockers: number
    productReadyLocalOssCount: number
    externalBetaToolExecutionAllowed: boolean
    productionToolExecutionAllowed: boolean
    blockerPolicy: string
    blockerForwardProgressPolicy: {
      intentionalBlanketBlocksAllowed: false
      blockerScope: string
      safeForwardProgressRequired: true
      nextSafeActionRequiredForBlockers: true
    }
    safeBlockerReductionAllowed: boolean
    blockedActionScope: string[]
    allowedForwardProgressScopes: string[]
  }
  evidenceGaps: {
    goNoGoBlockers: string[]
    blockedChecklistItems: string[]
    toolBlockers: number
    platformBlockers: string[]
  }
  nextActions: string[]
  warnings: string[]
}

export function buildBetaReadinessBackendOperatorStatus(
  report: BetaReadinessReport,
  options: BetaReadinessBackendOperatorStatusOptions = {},
): BetaReadinessBackendOperatorStatusReport {
  const blockedChecklistItems = report.checklist
    .filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
    .map((item) => `${item.id}: ${item.label}`)
  const blockedActionScope = buildBlockedActionScope(report)

  return {
    readyForExternalBeta: report.goNoGo.externalBetaAllowed,
    readyForRealUserMediaBeta: report.goNoGo.realUserMediaBetaAllowed,
    readyForPaidProduction: report.goNoGo.paidProductionAllowed,
    evidenceSource: options.workspaceId ? 'stored_workspace_evidence' : 'default_source_truth',
    workspaceId: options.workspaceId,
    evidencePacketCount: options.evidencePacketCount ?? 0,
    currentGate: {
      totalTools: report.toolExecutionReadiness.totalTools,
      ownerCoverageToolCount: report.toolExecutionReadiness.ownerCoverageToolCount,
      readinessSpecToolCount: report.toolExecutionReadiness.readinessSpecToolCount,
      toolBlockers: report.toolExecutionReadiness.blockers.length,
      platformBlockers: report.toolExecutionReadiness.platformBlockers.length,
      productReadyLocalOssCount: report.toolExecutionReadiness.productReadyLocalOssCount,
      externalBetaToolExecutionAllowed: report.toolExecutionReadiness.externalBetaToolExecutionAllowed,
      productionToolExecutionAllowed: report.toolExecutionReadiness.productionToolExecutionAllowed,
      blockerPolicy: report.toolExecutionReadiness.blockerPolicy,
      blockerForwardProgressPolicy: report.toolExecutionReadiness.blockerForwardProgressPolicy,
      safeBlockerReductionAllowed: report.toolExecutionReadiness.safeBlockerReductionAllowed,
      blockedActionScope,
      allowedForwardProgressScopes: buildAllowedForwardProgressScopes(report.toolExecutionReadiness.safeBlockerReductionAllowed),
    },
    evidenceGaps: {
      goNoGoBlockers: report.goNoGo.blockers,
      blockedChecklistItems,
      toolBlockers: report.toolExecutionReadiness.blockers.length,
      platformBlockers: report.toolExecutionReadiness.platformBlockers.map((blocker) => blocker.message),
    },
    nextActions: buildNextActions(report, options.workspaceId),
    warnings: [
      'Read-only backend operator status; no beta readiness evidence was recorded.',
      'This status does not run tool checks, process media, call providers, write Supabase records, enable external beta, or enable production.',
      'Blocked action scopes protect only unsafe beta/production actions while bounded blocker-reduction work remains allowed.',
    ],
  }
}

function buildAllowedForwardProgressScopes(safeBlockerReductionAllowed: boolean): string[] {
  if (!safeBlockerReductionAllowed) return []

  return [
    'source_review',
    'local_dependency_install_proof',
    'bounded_command_import_container_proof',
    'safe_blocker_reduction_preview',
    'diagnostics_and_qa_packets',
    'deployment_preflight_and_platform_evidence_collection',
    'owner_approval_packet_collection',
    'rollback_monitoring_support_planning',
  ]
}

function buildBlockedActionScope(report: BetaReadinessReport): string[] {
  const blockedActions = new Set(report.toolExecutionReadiness.blockedActionScope)
  if (!report.goNoGo.externalBetaAllowed) blockedActions.add('external_beta_launch')
  if (!report.goNoGo.realUserMediaBetaAllowed) blockedActions.add('real_user_media_beta')
  if (!report.goNoGo.paidProductionAllowed) blockedActions.add('paid_production_launch')
  return [...blockedActions]
}

function buildNextActions(report: BetaReadinessReport, workspaceId?: string): string[] {
  const actions: string[] = []

  if (!workspaceId) {
    actions.push('Supply workspaceId to read stored beta-readiness evidence for a deployed workspace.')
  }
  if (!report.toolExecutionReadiness.externalBetaToolExecutionAllowed) {
    actions.push('Run npm run beta:tools:core-real-check-preview locally to preview bounded per-tool evidence without writing backend records; for Python-backed core tools, run npm run tools:readiness:install-core-python and npm run beta:tools:core-real-check-preview:hydrated. Then record accepted evidence through /v1/beta-readiness/evidence/core-real-check after real staging checks pass.')
    actions.push('For libass, run npm run beta:tools:libass-container-proof-preflight against an approved render/tool-readiness image to reduce subtitle-filter execution evidence without claiming product-ready caption burn-in.')
    actions.push('After libass filter proof passes, run npm run beta:tools:libass-synthetic-burnin-qa-preflight to collect synthetic-only caption burn-in/font QA evidence before any product-ready local OSS acceptance is recorded.')
    actions.push('After synthetic libass QA passes, run npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight, then npm run beta:tools:libass-synthetic-burnin-qa-evidence against deployed staging to record the accepted libass evidence packet.')
  }
  if (report.toolExecutionReadiness.platformBlockers.length > 0) {
    actions.push('Record deployed platform evidence through /v1/beta-readiness/platform-deployed-evidence/probe after migration, RLS, wallet, monitoring, billing QA, and owner approvals pass.')
  }
  if (!report.goNoGo.externalBetaAllowed) {
    actions.push('Complete the named checklist and owner approval blockers before external beta launch.')
    actions.push('After accepted tool evidence, deployed platform evidence, and launch approvals are ready, run npm run beta:readiness:external-beta-evidence-collector against staging to sequence evidence recording and require final external-beta operator-status readback.')
  }
  if (!report.goNoGo.realUserMediaBetaAllowed) {
    actions.push('After external beta is ready, run beta:readiness:scope-approval-evidence-preflight in real_user_media_beta mode, then record real-user-media beta approval evidence.')
  }
  if (!report.goNoGo.paidProductionAllowed) {
    actions.push('After real-user-media beta is ready, run beta:readiness:scope-approval-evidence-preflight in paid_production mode, then record paid-production approval evidence; when both real-user-media beta and paid-production approvals are available, run npm run beta:readiness:scope-approval-sequence to record both in order and require final paid-production readback.')
  }
  actions.push('Rerun the operator status API and local smoke checks from the final source SHA after evidence changes.')

  return [...new Set(actions)]
}
