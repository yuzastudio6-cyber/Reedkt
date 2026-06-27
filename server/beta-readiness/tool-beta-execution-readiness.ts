import {
  PRODUCTION_TOOL_IDS,
  getProductionToolProfile,
  getToolsWithModelWeights,
  type ProductionToolId,
} from '../tool-registry'
import {
  buildToolCostOwnerCoverageMatrix,
  buildToolCostOwnerCoverageSummary,
  type ToolCostOwnerCoverageRecord,
} from '../tool-cost-metering'
import { runProductionToolReadiness } from '../workers/production-readiness'
import type {
  ProductionReadinessStatus,
  ProductionToolReadinessResult,
} from '../workers/production-readiness'
import type {
  ToolBetaAcceptedExecutionEvidence,
  ToolBetaExecutionReadinessBlocker,
  ToolBetaExecutionReadinessPlatformBlocker,
  ToolBetaExecutionReadinessRecord,
  ToolBetaExecutionReadinessReport,
  ToolBetaPlatformReadinessEvidence,
} from './beta-readiness-types'
import { buildAcceptedToolEvidenceMap } from './tool-beta-execution-evidence'

const executableStatuses = new Set<ProductionReadinessStatus>(['passed', 'warning'])

export interface BuildToolBetaExecutionReadinessReportOptions {
  acceptedEvidence?: ToolBetaAcceptedExecutionEvidence[]
  platformEvidence?: ToolBetaPlatformReadinessEvidence
}

export function buildToolBetaExecutionReadinessReport(
  options: BuildToolBetaExecutionReadinessReportOptions = {},
): ToolBetaExecutionReadinessReport {
  const ownerCoverage = buildToolCostOwnerCoverageMatrix()
  const ownerCoverageByToolId = new Map(ownerCoverage.map((record) => [record.toolId, record]))
  const ownerCoverageSummary = buildToolCostOwnerCoverageSummary(ownerCoverage)
  const readiness = runProductionToolReadiness({ dryRun: true })
  const readinessByToolId = new Map(readiness.results.map((result) => [result.toolId, result]))
  const modelWeightToolIds = new Set(getToolsWithModelWeights().map((profile) => profile.toolId))
  const evidenceByToolId = buildAcceptedToolEvidenceMap(options.acceptedEvidence)
  const tools = PRODUCTION_TOOL_IDS.map((toolId) => buildToolRecord({
    toolId,
    ownerCoverage: ownerCoverageByToolId.get(toolId),
    readiness: readinessByToolId.get(toolId),
    modelWeightsRequired: modelWeightToolIds.has(toolId),
    acceptedEvidence: evidenceByToolId.get(toolId),
  }))
  const blockers = [
    ...coverageBlockers(ownerCoverageSummary.missingToolIds, 'missing_tool_cost_owner_coverage'),
    ...coverageBlockers(ownerCoverageSummary.missingReadinessSpecToolIds, 'missing_readiness_spec'),
    ...tools.flatMap((tool) => tool.blockers),
  ]
  const platformBlockers = buildPlatformBlockers(ownerCoverageSummary.productionBillingPersistence, options.platformEvidence)
  const externalBetaToolExecutionAllowed = blockers.length === 0 &&
    platformBlockers.length === 0 &&
    tools.every((tool) => tool.executableForExternalBeta)
  const productionToolExecutionAllowed = externalBetaToolExecutionAllowed &&
    tools.every((tool) => tool.executableForProduction)

  return {
    reportId: `tool-beta-execution-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    totalTools: PRODUCTION_TOOL_IDS.length,
    ownerCoverageToolCount: ownerCoverageSummary.coveredToolCount,
    readinessSpecToolCount: ownerCoverageSummary.readinessSpecCoveredCount,
    productReadyLocalOssCount: tools.filter((tool) => tool.productReadyLocalOss).length,
    toolCostRateCardVersion: ownerCoverageSummary.rateCardVersion,
    productionBillingPersistence: ownerCoverageSummary.productionBillingPersistence,
    serviceFeeIncluded: false,
    readinessMode: evidenceByToolId.size > 0 ? 'evidence_review' : 'dry_run',
    allToolsHaveOwnerCoverage: ownerCoverageSummary.missingToolIds.length === 0 && ownerCoverageSummary.duplicateToolIds.length === 0,
    allToolsHaveReadinessSpecs: ownerCoverageSummary.missingReadinessSpecToolIds.length === 0 &&
      ownerCoverageSummary.duplicateReadinessSpecToolIds.length === 0,
    internalDryRunMonitoringAllowed: ownerCoverageSummary.missingToolIds.length === 0 &&
      ownerCoverageSummary.missingReadinessSpecToolIds.length === 0,
    externalBetaToolExecutionAllowed,
    productionToolExecutionAllowed,
    tools,
    platformBlockers,
    blockers: uniqueBlockers(blockers),
    nextActions: nextActionsForBlockers(blockers, platformBlockers),
    notes: [
      'This report answers whether registered ReEditPro production tools are executable for external beta or production.',
      'Current mode is dry-run only; command/import/Docker/model checks are not executed by this report.',
      'External beta tool execution requires passed real readiness checks, owner approvals, deployed billing persistence, deployment/storage/security approval, and model/license review.',
      'Product-ready local OSS remains 0 until a later gate accepts real runtime evidence.',
    ],
  }
}

function buildToolRecord(input: {
  toolId: ProductionToolId
  ownerCoverage?: ToolCostOwnerCoverageRecord
  readiness?: ProductionToolReadinessResult
  modelWeightsRequired: boolean
  acceptedEvidence?: ToolBetaAcceptedExecutionEvidence
}): ToolBetaExecutionReadinessRecord {
  const profile = getProductionToolProfile(input.toolId)
  const blockers = buildToolBlockers(input)
  const readinessStatus = input.acceptedEvidence?.readinessStatus ?? input.readiness?.status ?? 'not_checked'
  const readinessDryRun = input.acceptedEvidence?.realExecutionVerified ? false : (input.readiness?.dryRun ?? true)
  const productReadyLocalOss = input.acceptedEvidence?.productReadyLocalOss === true
  const executableForExternalBeta = blockers.length === 0 &&
    Boolean(input.ownerCoverage) &&
    (Boolean(input.readiness) || Boolean(input.acceptedEvidence)) &&
    executableStatuses.has(readinessStatus)

  return {
    toolId: input.toolId,
    displayName: profile?.displayName ?? input.toolId,
    productionStatus: profile?.productionStatus ?? 'blocked',
    meteringOwner: input.ownerCoverage?.meteringOwner ?? 'missing_owner_coverage',
    usageCategory: input.ownerCoverage?.usageCategory ?? 'other',
    providerType: input.ownerCoverage?.providerType ?? 'unknown',
    computeLevel: input.ownerCoverage?.computeLevel ?? 'standard',
    qualityLevel: input.ownerCoverage?.qualityLevel ?? 'preview',
    expectedWorkerTypes: input.ownerCoverage?.expectedWorkerTypes ?? [],
    imageRoles: input.ownerCoverage?.imageRoles ?? [],
    readinessStatus,
    readinessDryRun,
    productionRequired: input.ownerCoverage?.productionRequired ?? false,
    blocksProductionIfMissing: input.ownerCoverage?.blocksProductionIfMissing ?? true,
    modelWeightsRequired: input.modelWeightsRequired,
    productReadyLocalOss,
    executableForExternalBeta,
    executableForProduction: executableForExternalBeta && input.acceptedEvidence?.productionReadinessAccepted === true,
    blockers,
    nextAction: nextActionForTool(blockers),
  }
}

function buildToolBlockers(input: {
  toolId: ProductionToolId
  ownerCoverage?: ToolCostOwnerCoverageRecord
  readiness?: ProductionToolReadinessResult
  modelWeightsRequired: boolean
  acceptedEvidence?: ToolBetaAcceptedExecutionEvidence
}): ToolBetaExecutionReadinessBlocker[] {
  const blockers: ToolBetaExecutionReadinessBlocker[] = []
  const evidence = input.acceptedEvidence
  const readinessStatus = evidence?.readinessStatus ?? input.readiness?.status

  if (!input.ownerCoverage) {
    blockers.push(blocker(input.toolId, 'missing_tool_cost_owner_coverage', 'Tool cost owner coverage is missing.'))
  }

  if (!input.readiness) {
    if (!evidence) {
      blockers.push(blocker(input.toolId, 'missing_readiness_spec', 'Production readiness spec/result is missing.'))
    }
  } else if (!executableStatuses.has(readinessStatus ?? 'not_checked')) {
    blockers.push(blocker(
      input.toolId,
      'readiness_not_passed',
      `Readiness status is ${readinessStatus}, not passed/warning.`,
    ))
  }

  if (!evidence?.realExecutionVerified) {
    blockers.push(blocker(input.toolId, 'real_execution_not_verified', 'Only dry-run readiness has been evaluated.'))
  }

  if (input.readiness?.blocksProduction && evidence?.productionReadinessAccepted !== true) {
    blockers.push(blocker(input.toolId, 'production_readiness_blocked', 'Readiness policy says this tool blocks production when missing or unapproved.'))
  }

  if (input.modelWeightsRequired && evidence?.modelWeightsApproved !== true) {
    blockers.push(blocker(input.toolId, 'model_weight_approval_missing', 'Model/checkpoint approval is required before beta execution.'))
  }

  if (evidence?.productReadyLocalOss !== true) {
    blockers.push(blocker(input.toolId, 'product_ready_acceptance_missing', 'No product-ready local OSS acceptance exists for this tool.'))
  }

  return blockers
}

function blocker(
  toolId: ProductionToolId,
  blockerId: ToolBetaExecutionReadinessBlocker['blockerId'],
  message: string,
): ToolBetaExecutionReadinessBlocker {
  return { toolId, blockerId, message }
}

function coverageBlockers(
  toolIds: ProductionToolId[],
  blockerId: ToolBetaExecutionReadinessBlocker['blockerId'],
): ToolBetaExecutionReadinessBlocker[] {
  return toolIds.map((toolId) => blocker(toolId, blockerId, `${blockerId} for ${toolId}.`))
}

function buildPlatformBlockers(
  productionBillingPersistence: string,
  platformEvidence?: ToolBetaPlatformReadinessEvidence,
): ToolBetaExecutionReadinessPlatformBlocker[] {
  if (productionBillingPersistence === 'backend_required') {
    return [{
      blockerId: 'production_billing_deployment_unverified',
      requiredForExternalBeta: true,
      message: 'Durable tool cost event persistence is not implemented, so billable external beta execution remains blocked.',
    }]
  }

  if (productionBillingPersistence === 'supabase_tool_cost_events_implemented_pending_deployment') {
    const missingEvidence = missingPlatformEvidence(platformEvidence)
    if (missingEvidence.length === 0) return []

    return [{
      blockerId: 'production_billing_deployment_unverified',
      requiredForExternalBeta: true,
      message: `Supabase-backed tool_cost_events persistence is implemented in source, but platform evidence is incomplete: ${missingEvidence.join(', ')}.`,
    }]
  }

  return []
}

function missingPlatformEvidence(platformEvidence?: ToolBetaPlatformReadinessEvidence): string[] {
  if (!platformEvidence) {
    return [
      'platform evidence packet missing',
      'migration deployment unverified',
      'service-role write path unverified',
      'RLS member read path unverified',
      'idempotent replay unverified',
      'wallet settlement unverified',
      'Stripe boundary unverified',
      'monitoring unverified',
      'billing QA unverified',
      'deployment/security/storage/legal/support approvals missing',
    ]
  }

  const missing: string[] = []
  if (!platformEvidence.sourceId.trim()) missing.push('sourceId missing')
  if (platformEvidence.environment !== 'staging' && platformEvidence.environment !== 'production') missing.push('staging or production environment missing')
  if (!platformEvidence.toolCostEventsMigrationDeployed) missing.push('tool_cost_events migration not deployed')
  if (!platformEvidence.serviceRoleWritePathVerified) missing.push('service-role write path not verified')
  if (!platformEvidence.rlsMemberReadPathVerified) missing.push('RLS member read path not verified')
  if (!platformEvidence.idempotentReplayVerified) missing.push('idempotent replay not verified')
  if (!platformEvidence.walletSettlementVerified) missing.push('wallet settlement not verified')
  if (!platformEvidence.stripeBoundaryVerified) missing.push('Stripe boundary not verified')
  if (!platformEvidence.monitoringVerified) missing.push('monitoring not verified')
  if (!platformEvidence.billingQaVerified) missing.push('billing QA not verified')
  if (!platformEvidence.deploymentApproved) missing.push('deployment approval missing')
  if (!platformEvidence.securityApproved) missing.push('security approval missing')
  if (!platformEvidence.storageApproved) missing.push('storage approval missing')
  if (!platformEvidence.legalApproved) missing.push('legal approval missing')
  if (!platformEvidence.supportApproved) missing.push('support approval missing')
  if (platformEvidence.notes.length === 0) missing.push('notes missing')
  return missing
}

function uniqueBlockers(
  blockers: ToolBetaExecutionReadinessBlocker[],
): ToolBetaExecutionReadinessBlocker[] {
  const seen = new Set<string>()
  return blockers.filter((blockerItem) => {
    const key = `${blockerItem.toolId}:${blockerItem.blockerId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function nextActionForTool(blockers: ToolBetaExecutionReadinessBlocker[]): string {
  const blockerIds = new Set(blockers.map((item) => item.blockerId))

  if (blockerIds.has('missing_tool_cost_owner_coverage')) return 'Add missing tool cost owner coverage.'
  if (blockerIds.has('missing_readiness_spec')) return 'Add missing production readiness spec.'
  if (blockerIds.has('model_weight_approval_missing')) return 'Complete model/checkpoint source, license, checksum, and private staging approval.'
  if (blockerIds.has('readiness_not_passed')) return 'Run and pass the bounded real readiness check for this tool in the correct worker image.'
  if (blockerIds.has('product_ready_acceptance_missing')) return 'Run QA acceptance after real runtime evidence exists.'
  return 'No tool-specific blocker detected.'
}

function nextActionsForBlockers(
  blockers: ToolBetaExecutionReadinessBlocker[],
  platformBlockers: ToolBetaExecutionReadinessPlatformBlocker[],
): string[] {
  const blockerIds = new Set(blockers.map((item) => item.blockerId))
  const platformBlockerIds = new Set(platformBlockers.map((item) => item.blockerId))
  const actions: string[] = []

  if (blockerIds.has('missing_tool_cost_owner_coverage')) actions.push('Complete missing tool cost owner coverage before any beta execution.')
  if (blockerIds.has('missing_readiness_spec')) actions.push('Complete missing production readiness specs before beta execution.')
  if (blockerIds.has('readiness_not_passed') || blockerIds.has('real_execution_not_verified')) {
    actions.push('Run bounded real command/import/container readiness checks per worker image and record accepted evidence.')
  }
  if (blockerIds.has('model_weight_approval_missing')) {
    actions.push('Complete model/checkpoint source, license, checksum, and staging approvals for model-backed tools.')
  }
  if (platformBlockerIds.has('production_billing_deployment_unverified')) {
    actions.push('Deploy and verify the Supabase tool_cost_events migration, service-role write path, wallet settlement, Stripe boundary, monitoring, and billing QA before billable external beta.')
  }
  if (blockerIds.has('product_ready_acceptance_missing')) {
    actions.push('Run product QA acceptance after real runtime evidence and billing persistence are available.')
  }

  actions.push('Keep only the unsafe beta/production action blocked; continue bounded source reviews, local proofs, diagnostics, QA packets, and deployment preflights that can retire named blockers without bypassing the gate.')
  return [...new Set(actions)]
}
