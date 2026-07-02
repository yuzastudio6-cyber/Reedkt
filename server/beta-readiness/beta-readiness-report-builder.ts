import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import { buildToolBetaExecutionReadinessReport } from './tool-beta-execution-readiness'
import type {
  BetaReadinessChecklistEvidence,
  BetaReadinessChecklistItem,
  BetaReadinessReport,
  ToolBetaAcceptedExecutionEvidence,
  ToolBetaPlatformReadinessEvidence,
} from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  boundedToolExecutionReady?: boolean
  productionReadinessBlocked?: boolean
  checklistEvidence?: BetaReadinessChecklistEvidence[]
  acceptedToolEvidence?: ToolBetaAcceptedExecutionEvidence[]
  platformEvidence?: ToolBetaPlatformReadinessEvidence
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  legalApproved?: boolean
  monitoringApproved?: boolean
  supportApproved?: boolean
  realUserMediaBetaApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidenceReady?: boolean
  paidProductionApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  observabilityApproved?: boolean
  incidentRunbookApproved?: boolean
  finalDeliveryShareApproved?: boolean
  hardLaunchBlockersPresent?: boolean
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = applyChecklistEvidence(betaReadinessChecklist, options.checklistEvidence)
  const toolExecutionReadiness = buildToolBetaExecutionReadinessReport({
    acceptedEvidence: options.acceptedToolEvidence,
    platformEvidence: options.platformEvidence,
  })
  const productionReadinessBlocked = options.productionReadinessBlocked ?? !toolExecutionReadiness.externalBetaToolExecutionAllowed
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    boundedToolExecutionReady: options.boundedToolExecutionReady,
    productionReadinessBlocked,
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    legalApproved: options.legalApproved,
    monitoringApproved: options.monitoringApproved,
    supportApproved: options.supportApproved,
    realUserMediaBetaApproved: options.realUserMediaBetaApproved,
    privateMediaApproval: options.privateMediaApproval,
    artifactPrivacyEvidenceReady: options.artifactPrivacyEvidenceReady,
    paidProductionApproved: options.paidProductionApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    observabilityApproved: options.observabilityApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    finalDeliveryShareApproved: options.finalDeliveryShareApproved,
    hardLaunchBlockersPresent: options.hardLaunchBlockersPresent,
    checklist,
  })
  const productionReady = goNoGo.paidProductionAllowed
  const scenarioMatrix = buildBetaScenarioReadinessMatrix({ productionReady })
  const blockers = [
    ...goNoGo.blockers,
    ...scenarioMatrix.flatMap((scenario) => scenario.blockers),
    ...toolExecutionReadiness.platformBlockers.map((blocker) => `tool execution platform: ${blocker.message}`),
    ...toolExecutionReadiness.blockers.map((blocker) => `${blocker.toolId}: ${blocker.message}`),
  ]
  const warnings = [
    ...goNoGo.warnings,
    ...checklist.filter((item) => item.status === 'warning').map((item) => item.label),
  ]

  return {
    reportId: `beta-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus: goNoGo.internalDryRunTestingAllowed ? 'internal_testing_ready' : 'blocked',
    productionReady,
    checklist,
    scenarioMatrix,
    toolExecutionReadiness,
    goNoGo,
    launchStageDecisions: goNoGo.launchStageDecisions,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      'Run M16B dry-run E2E and M17 hardening smokes before any internal demo.',
      ...toolExecutionReadiness.nextActions,
      'Complete human security, cost, storage, deployment, model, legal, monitoring, and support reviews before external beta.',
      'Keep real user media beta and paid production closed until their evidence-driven gates explicitly pass.',
    ],
  }
}

function applyChecklistEvidence(
  checklist: BetaReadinessChecklistItem[],
  evidence: BetaReadinessChecklistEvidence[] = [],
): BetaReadinessChecklistItem[] {
  if (evidence.length === 0) return checklist

  const knownItemIds = new Set(checklist.map((item) => item.id))
  const evidenceByItemId = new Map<string, BetaReadinessChecklistEvidence>()

  for (const record of evidence) {
    if (!knownItemIds.has(record.itemId)) {
      throw new Error(`Beta checklist evidence references an unknown checklist item: ${record.itemId}`)
    }
    if (evidenceByItemId.has(record.itemId)) {
      throw new Error(`Duplicate beta checklist evidence for: ${record.itemId}`)
    }
    if (!record.sourceId.trim()) {
      throw new Error(`Beta checklist evidence for ${record.itemId} is missing sourceId.`)
    }
    if (record.notes.length === 0) {
      throw new Error(`Beta checklist evidence for ${record.itemId} must include notes.`)
    }
    evidenceByItemId.set(record.itemId, record)
  }

  return checklist.map((item) => {
    const record = evidenceByItemId.get(item.id)
    if (!record) return item
    return {
      ...item,
      status: record.status,
      notes: [
        ...item.notes,
        `Evidence ${record.sourceId} accepted status ${record.status}.`,
        ...record.notes,
      ],
    }
  })
}
