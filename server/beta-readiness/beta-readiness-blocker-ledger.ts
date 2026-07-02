import {
  buildBetaReadinessReport,
  type BuildBetaReadinessReportOptions,
} from './beta-readiness-report-builder'
import type {
  BetaReadinessReport,
  ToolBetaExecutionReadinessBlocker,
  ToolBetaExecutionReadinessPlatformBlocker,
} from './beta-readiness-types'
import {
  defaultAllowedForwardProgressScopes,
} from './scoped-blocker-forward-progress-policy'

export type BetaReadinessBlockerLedgerScope =
  | 'tool'
  | 'platform'
  | 'checklist'
  | 'go_no_go'

export type BetaReadinessBlockerLedgerMode =
  | 'scoped_unsafe_action_only'

export type BetaReadinessBlockerLedgerClearanceType =
  | 'source_review'
  | 'bounded_local_proof'
  | 'safe_preview'
  | 'diagnostics_or_qa'
  | 'deployed_platform_evidence'
  | 'owner_approval'
  | 'rollback_or_monitoring_plan'

export interface BetaReadinessBlockerLedgerRow {
  key: string
  scope: BetaReadinessBlockerLedgerScope
  blockerId: string
  subjectId: string
  subjectLabel: string
  blockerMode: BetaReadinessBlockerLedgerMode
  blocksSafeForwardProgress: false
  clearanceType: BetaReadinessBlockerLedgerClearanceType
  blockedActionScope: string[]
  missingEvidence: string
  safeForwardProgressScope: string
  nextSafeAction: string
}

export interface BetaReadinessBlockerLedgerReport {
  reportId: string
  createdAt: string
  sourceReportId: string
  totalRows: number
  toolRows: number
  platformRows: number
  checklistRows: number
  goNoGoRows: number
  duplicateRowKeys: string[]
  productReadyLocalOssCount: number
  externalBetaAllowed: boolean
  realUserMediaBetaAllowed: boolean
  paidProductionAllowed: boolean
  blockerPolicy: {
    intentionalBlanketBlocksAllowed: false
    blockerScope: 'named_unsafe_action_only'
    safeForwardProgressRequired: true
    nextSafeActionRequiredForBlockers: true
  }
  blockedActionScope: string[]
  allowedForwardProgressScopes: string[]
  rows: BetaReadinessBlockerLedgerRow[]
  warnings: string[]
}

export function buildBetaReadinessBlockerLedger(
  options: BuildBetaReadinessReportOptions = {},
): BetaReadinessBlockerLedgerReport {
  const report = buildBetaReadinessReport(options)
  const rows = [
    ...buildToolRows(report),
    ...buildPlatformRows(report),
    ...buildChecklistRows(report),
    ...buildGoNoGoRows(report),
  ]
  const duplicateRowKeys = findDuplicates(rows.map((row) => row.key))

  return {
    reportId: `beta-readiness-blocker-ledger-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    sourceReportId: report.reportId,
    totalRows: rows.length,
    toolRows: rows.filter((row) => row.scope === 'tool').length,
    platformRows: rows.filter((row) => row.scope === 'platform').length,
    checklistRows: rows.filter((row) => row.scope === 'checklist').length,
    goNoGoRows: rows.filter((row) => row.scope === 'go_no_go').length,
    duplicateRowKeys,
    productReadyLocalOssCount: report.toolExecutionReadiness.productReadyLocalOssCount,
    externalBetaAllowed: report.goNoGo.externalBetaAllowed,
    realUserMediaBetaAllowed: report.goNoGo.realUserMediaBetaAllowed,
    paidProductionAllowed: report.goNoGo.paidProductionAllowed,
    blockerPolicy: report.toolExecutionReadiness.blockerForwardProgressPolicy,
    blockedActionScope: report.toolExecutionReadiness.blockedActionScope,
    allowedForwardProgressScopes: allowedForwardProgressScopes(report),
    rows,
    warnings: [
      'This ledger is source/readiness metadata only; it does not run tools, write evidence, process media, enable beta, or enable production.',
      'Rows are keyed so duplicate blockers are visible before teams create duplicate PRs or duplicate evidence packets.',
      'Each row names the unsafe action still blocked plus a safe forward lane that can reduce the blocker without bypassing approval gates.',
      'Every row is scoped to unsafe beta/production actions only; safe blocker-reduction work must remain allowed.',
    ],
  }
}

function buildToolRows(report: BetaReadinessReport): BetaReadinessBlockerLedgerRow[] {
  const toolById = new Map(report.toolExecutionReadiness.tools.map((tool) => [tool.toolId, tool]))

  return report.toolExecutionReadiness.blockers.map((blocker) => {
    const tool = toolById.get(blocker.toolId)
    const safeForwardProgressScope = toolSafeForwardScope(blocker)
    return {
      key: `tool:${blocker.toolId}:${blocker.blockerId}`,
      scope: 'tool',
      blockerId: blocker.blockerId,
      subjectId: blocker.toolId,
      subjectLabel: tool?.displayName ?? blocker.toolId,
      ...scopedBlockerFields(safeForwardProgressScope),
      blockedActionScope: tool?.blockedActionScope.length ? tool.blockedActionScope : ['external_beta_tool_execution', 'paid_production_tool_execution'],
      missingEvidence: blocker.message,
      safeForwardProgressScope,
      nextSafeAction: tool?.nextAction ?? toolNextSafeAction(blocker),
    }
  })
}

function buildPlatformRows(report: BetaReadinessReport): BetaReadinessBlockerLedgerRow[] {
  const safeForwardProgressScope = 'deployment_preflight_and_platform_evidence_collection'
  return report.toolExecutionReadiness.platformBlockers.map((blocker) => ({
    key: `platform:${blocker.blockerId}`,
    scope: 'platform',
    blockerId: blocker.blockerId,
    subjectId: 'tool_beta_platform',
    subjectLabel: 'Tool beta platform readiness',
    ...scopedBlockerFields(safeForwardProgressScope),
    blockedActionScope: ['external_beta_tool_execution', 'paid_production_tool_execution'],
    missingEvidence: blocker.message,
    safeForwardProgressScope,
    nextSafeAction: platformNextSafeAction(blocker),
  }))
}

function buildChecklistRows(report: BetaReadinessReport): BetaReadinessBlockerLedgerRow[] {
  const safeForwardProgressScope = 'owner_approval_packet_collection'
  return report.checklist
    .filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
    .map((item) => ({
      key: `checklist:${item.id}`,
      scope: 'checklist',
      blockerId: 'external_beta_checklist_item_blocked',
      subjectId: item.id,
      subjectLabel: item.label,
      ...scopedBlockerFields(safeForwardProgressScope),
      blockedActionScope: ['external_beta_launch', 'real_user_media_beta', 'paid_production_launch'],
      missingEvidence: item.notes.join(' ') || `${item.label} evidence is missing.`,
      safeForwardProgressScope,
      nextSafeAction: 'Collect the named owner approval/evidence note, then run npm run beta:readiness:launch-approval-evidence-preflight before recording launch approval evidence.',
    }))
}

function buildGoNoGoRows(report: BetaReadinessReport): BetaReadinessBlockerLedgerRow[] {
  return report.goNoGo.blockers.map((blocker) => {
    const normalized = normalizeId(blocker)
    const safeForwardProgressScope = goNoGoSafeForwardScope(blocker)
    return {
      key: `go_no_go:${normalized}`,
      scope: 'go_no_go',
      blockerId: 'beta_go_no_go_blocker',
      subjectId: normalized,
      subjectLabel: blocker,
      ...scopedBlockerFields(safeForwardProgressScope),
      blockedActionScope: ['external_beta_launch', 'real_user_media_beta', 'paid_production_launch'],
      missingEvidence: blocker,
      safeForwardProgressScope,
      nextSafeAction: goNoGoNextSafeAction(blocker),
    }
  })
}

function allowedForwardProgressScopes(report: BetaReadinessReport): string[] {
  if (!report.toolExecutionReadiness.safeBlockerReductionAllowed) return []
  return report.toolExecutionReadiness.allowedForwardProgressScopes.length > 0
    ? report.toolExecutionReadiness.allowedForwardProgressScopes
    : defaultAllowedForwardProgressScopes()
}

function scopedBlockerFields(safeForwardProgressScope: string): {
  blockerMode: BetaReadinessBlockerLedgerMode
  blocksSafeForwardProgress: false
  clearanceType: BetaReadinessBlockerLedgerClearanceType
} {
  return {
    blockerMode: 'scoped_unsafe_action_only',
    blocksSafeForwardProgress: false,
    clearanceType: clearanceTypeForSafeScope(safeForwardProgressScope),
  }
}

function clearanceTypeForSafeScope(
  safeForwardProgressScope: string,
): BetaReadinessBlockerLedgerClearanceType {
  switch (safeForwardProgressScope) {
    case 'source_review':
      return 'source_review'
    case 'local_dependency_install_proof':
    case 'bounded_command_import_container_proof':
      return 'bounded_local_proof'
    case 'safe_blocker_reduction_preview':
      return 'safe_preview'
    case 'diagnostics_and_qa_packets':
      return 'diagnostics_or_qa'
    case 'deployment_preflight_and_platform_evidence_collection':
      return 'deployed_platform_evidence'
    case 'owner_approval_packet_collection':
      return 'owner_approval'
    case 'rollback_monitoring_support_planning':
      return 'rollback_or_monitoring_plan'
    default:
      return 'diagnostics_or_qa'
  }
}

function toolSafeForwardScope(blocker: ToolBetaExecutionReadinessBlocker): string {
  switch (blocker.blockerId) {
    case 'missing_tool_cost_owner_coverage':
    case 'production_readiness_blocked':
    case 'model_weight_approval_missing':
      return 'owner_approval_packet_collection'
    case 'missing_readiness_spec':
      return 'source_review'
    case 'readiness_not_passed':
    case 'real_execution_not_verified':
      return 'bounded_command_import_container_proof'
    case 'production_billing_persistence_missing':
      return 'deployment_preflight_and_platform_evidence_collection'
    case 'product_ready_acceptance_missing':
      return 'diagnostics_and_qa_packets'
  }
}

function toolNextSafeAction(blocker: ToolBetaExecutionReadinessBlocker): string {
  switch (blocker.blockerId) {
    case 'missing_tool_cost_owner_coverage':
      return 'Add a metering owner coverage record for this tool before accepting beta evidence.'
    case 'missing_readiness_spec':
      return 'Add a production readiness spec for this tool before accepting beta evidence.'
    case 'readiness_not_passed':
      return 'Run the bounded command/import/container proof lane for this tool and record only passed or warning evidence.'
    case 'real_execution_not_verified':
      return 'Run real bounded command/import/container evidence for this tool before external beta execution.'
    case 'production_readiness_blocked':
      return 'Resolve the readiness policy blocker or collect the required owner approval before production acceptance.'
    case 'model_weight_approval_missing':
      return 'Collect model source, license, checksum, staging, and owner approval evidence before beta execution.'
    case 'production_billing_persistence_missing':
      return 'Complete deployed tool-cost persistence, wallet settlement, and billing QA evidence before beta execution.'
    case 'product_ready_acceptance_missing':
      return 'Run QA acceptance for this exact tool and record product-ready local OSS evidence only after the bounded proof passes.'
  }
}

function platformNextSafeAction(blocker: ToolBetaExecutionReadinessPlatformBlocker): string {
  if (blocker.blockerId === 'production_billing_deployment_unverified') {
    return 'Run npm run beta:platform:staging-evidence-preflight, then record deployed platform evidence only after migration, service-role write, RLS readback, wallet settlement, Stripe boundary, monitoring, billing QA, and owner approvals pass.'
  }
  return 'Collect the deployed platform evidence packet required for this blocker.'
}

function goNoGoSafeForwardScope(blocker: string): string {
  const text = blocker.toLowerCase()
  if (text.includes('deployment') || text.includes('storage') || text.includes('monitoring')) {
    return 'deployment_preflight_and_platform_evidence_collection'
  }
  if (text.includes('tool') || text.includes('production readiness')) {
    return 'bounded_command_import_container_proof'
  }
  if (text.includes('approval') || text.includes('legal') || text.includes('security') || text.includes('support') || text.includes('model')) {
    return 'owner_approval_packet_collection'
  }
  return 'diagnostics_and_qa_packets'
}

function goNoGoNextSafeAction(blocker: string): string {
  const text = blocker.toLowerCase()
  if (text.includes('real user media')) {
    return 'After external beta is ready, run beta:readiness:scope-approval-evidence-preflight in real_user_media_beta mode and record the explicit approval evidence.'
  }
  if (text.includes('paid production')) {
    return 'After real-user-media beta is ready, run beta:readiness:scope-approval-evidence-preflight in paid_production mode and record the explicit approval evidence.'
  }
  if (text.includes('tool')) {
    return 'Record accepted per-tool evidence and deployed platform evidence, then rerun operator status before any launch approval.'
  }
  return 'Collect the named evidence or owner approval, then rerun npm run beta:readiness:operator-status before recording launch or scope approval evidence.'
}

function normalizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'unknown'
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}
