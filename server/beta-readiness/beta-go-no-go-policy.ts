import type { BetaGoNoGoDecision, BetaReadinessChecklistItem } from './beta-readiness-types'
import { evaluateBetaReadinessGatePolicy } from './beta-readiness-gate-policy'

export interface EvaluateBetaGoNoGoOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  boundedToolExecutionReady?: boolean
  productionReadinessBlocked?: boolean
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
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const launchStageDecisions = evaluateBetaReadinessGatePolicy({
    e2eDryRunPassed: options.e2eDryRunPassed,
    safetyDocsExist: options.safetyDocsExist,
    costDocsExist: options.costDocsExist,
    boundedToolExecutionReady: options.boundedToolExecutionReady,
    requiredChecklistBlocked: requiredBlockedItems.length > 0,
    productionReadinessBlocked: options.productionReadinessBlocked,
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
  })
  const internalDryRunTestingAllowed = launchStageDecisions.internal_dry_run.allowed
  const limitedLocalDevInternalTestingAllowed = launchStageDecisions.bounded_tool_execution.allowed
  const externalBetaAllowed = launchStageDecisions.external_beta.allowed
  const realUserMediaBetaAllowed = launchStageDecisions.real_user_media_beta.allowed
  const paidProductionAllowed = launchStageDecisions.paid_production.allowed
  const blockers = [
    ...requiredBlockedItems.map((item) => `${item.label} blocks external beta.`),
    ...launchStageDecisions.external_beta.blockers,
    ...launchStageDecisions.real_user_media_beta.blockers,
    ...launchStageDecisions.paid_production.blockers,
  ]

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed,
    externalBetaAllowed,
    realUserMediaBetaAllowed,
    paidProductionAllowed,
    launchStageDecisions,
    blockers: [...new Set(blockers)],
    warnings: [
      'Internal local-dev fixture testing must not use arbitrary user media.',
      externalBetaAllowed
        ? 'External beta gate is allowed only for the approved scope represented by the supplied evidence.'
        : 'External beta and paid production remain blocked until their named evidence and owner-approval gates pass.',
    ],
  }
}
