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
  privateMediaApproved?: boolean
  artifactPrivacyEvidenceReady?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  paidProductionApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  incidentRunbookApproved?: boolean
  observabilityApproved?: boolean
  finalDeliveryShareApproved?: boolean
  hardLaunchBlockersPresent?: boolean
  noHardLaunchBlockers?: boolean
  rawPromptSafetyPassed?: boolean
  secretSafetyPassed?: boolean
  signedUrlSourceTruthBlocked?: boolean
  approvedSnapshotPolicyApproved?: boolean
  creditReservationPolicyApproved?: boolean
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
    boundedToolExecutionReady:
      options.boundedToolExecutionReady ?? toolExecutionReadiness.internalDryRunMonitoringAllowed,
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
    privateMediaApproved: options.privateMediaApproved,
    artifactPrivacyEvidenceReady: options.artifactPrivacyEvidenceReady,
    artifactPrivacyEvidenceApproved: options.artifactPrivacyEvidenceApproved,
    paidProductionApproved: options.paidProductionApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    observabilityApproved: options.observabilityApproved,
    finalDeliveryShareApproved: options.finalDeliveryShareApproved,
    hardLaunchBlockersPresent: options.hardLaunchBlockersPresent,
    noHardLaunchBlockers: options.noHardLaunchBlockers,
    rawPromptSafetyPassed: options.rawPromptSafetyPassed,
    secretSafetyPassed: options.secretSafetyPassed,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked,
    approvedSnapshotPolicyApproved: options.approvedSnapshotPolicyApproved,
    creditReservationPolicyApproved: options.creditReservationPolicyApproved,
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
    overallStatus: goNoGo.paidProductionAllowed
      ? 'paid_production_ready'
      : goNoGo.realUserMediaBetaAllowed
        ? 'real_user_media_beta_ready'
        : goNoGo.externalBetaAllowed
          ? 'external_beta_ready'
          : goNoGo.internalDryRunTestingAllowed
            ? 'internal_testing_ready'
            : 'blocked',
    productionReady,
    checklist,
    scenarioMatrix,
    toolExecutionReadiness,
    goNoGo,
    launchStageDecisions: goNoGo.launchStageDecisions,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      goNoGo.internalDryRunTestingAllowed
        ? 'Internal dry-run evidence is present; continue monitoring for regressions.'
        : 'Run M16B dry-run E2E and safety/cost checks before any internal demo.',
      ...toolExecutionReadiness.nextActions,
      goNoGo.externalBetaAllowed
        ? 'External beta gate is allowed by supplied evidence; keep rollout owner-scoped and monitored.'
        : 'Complete human security, cost, storage, deployment, model/license, and readiness reviews before external beta.',
      goNoGo.realUserMediaBetaAllowed
        ? 'Real-user-media beta gate is allowed by supplied evidence; preserve artifact privacy and retention controls.'
        : 'Keep real user media blocked until private-media approval and artifact privacy evidence pass.',
      goNoGo.paidProductionAllowed
        ? 'Paid production gate is allowed by supplied evidence; preserve billing ledger, incident, and observability controls.'
        : 'Keep paid production blocked until deployment, billing ledger, cost controls, incident, observability, and hard launch gates pass.',
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
