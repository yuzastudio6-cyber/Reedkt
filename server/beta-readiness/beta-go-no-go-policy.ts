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
  privateMediaApproved?: boolean
  artifactPrivacyEvidenceReady?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  paidProductionApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  observabilityApproved?: boolean
  incidentRunbookApproved?: boolean
  finalDeliveryShareApproved?: boolean
  hardLaunchBlockersPresent?: boolean
  noHardLaunchBlockers?: boolean
  rawPromptSafetyPassed?: boolean
  secretSafetyPassed?: boolean
  signedUrlSourceTruthBlocked?: boolean
  approvedSnapshotPolicyApproved?: boolean
  creditReservationPolicyApproved?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const requiredBlockedItems = (options.checklist ?? []).filter(
    (item) => item.requiredForExternalBeta && item.status === 'blocked',
  )
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
    privateMediaApproval: options.privateMediaApproval ?? options.privateMediaApproved,
    artifactPrivacyEvidenceReady:
      options.artifactPrivacyEvidenceReady ?? options.artifactPrivacyEvidenceApproved,
    paidProductionApproved: options.paidProductionApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    observabilityApproved: options.observabilityApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    finalDeliveryShareApproved: options.finalDeliveryShareApproved,
    hardLaunchBlockersPresent:
      options.hardLaunchBlockersPresent ??
      (options.noHardLaunchBlockers === undefined ? undefined : !options.noHardLaunchBlockers),
    rawPromptSafetyPassed: options.rawPromptSafetyPassed,
    secretSafetyPassed: options.secretSafetyPassed,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked,
    approvedSnapshotPolicyApproved: options.approvedSnapshotPolicyApproved,
    creditReservationPolicyApproved: options.creditReservationPolicyApproved,
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
      'Internal testing with user media is limited to the explicitly approved private-media scope.',
      externalBetaAllowed
        ? 'External beta is allowed only for the approved scope represented by the supplied evidence.'
        : 'External beta and paid production remain blocked until their named evidence and owner-approval gates pass.',
    ],
  }
}
