import type { BetaGoNoGoDecision, BetaReadinessChecklistItem } from './beta-readiness-types'
import {
  evaluateBetaLaunchStageGates,
  findBetaLaunchStageGate,
  type BetaLaunchGateEvidence,
} from './beta-launch-gate-policy'

export interface EvaluateBetaGoNoGoOptions extends BetaLaunchGateEvidence {
  checklist?: BetaReadinessChecklistItem[]
  privateMediaApproved?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  noHardLaunchBlockers?: boolean
  rawPromptSafetyPassed?: boolean
  secretSafetyPassed?: boolean
  approvedSnapshotPolicyApproved?: boolean
  creditReservationPolicyApproved?: boolean
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const launchStageGates = evaluateBetaLaunchStageGates({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked: options.productionReadinessBlocked ?? true,
    approvedPlanSnapshotGatePresent: options.approvedPlanSnapshotGatePresent ?? options.approvedSnapshotPolicyApproved ?? true,
    creditEstimateGatePresent: options.creditEstimateGatePresent ?? true,
    creditReservationGatePresent: options.creditReservationGatePresent ?? options.creditReservationPolicyApproved ?? true,
    idempotencyGatePresent: options.idempotencyGatePresent ?? true,
    rawPromptStorageBlocked: options.rawPromptStorageBlocked ?? options.rawPromptSafetyPassed ?? true,
    secretScrubbingEnabled: options.secretScrubbingEnabled ?? options.secretSafetyPassed ?? true,
    signedUrlSourceTruthBlocked: options.signedUrlSourceTruthBlocked ?? true,
    licenseModelWeightReviewApproved: options.licenseModelWeightReviewApproved ?? false,
    deploymentApproved: options.deploymentApproved,
    securityApproved: options.securityApproved,
    storageApproved: options.storageApproved,
    modelLicensesApproved: options.modelLicensesApproved,
    privateMediaApproval: options.privateMediaApproval ?? options.privateMediaApproved,
    artifactPrivacyEvidence: options.artifactPrivacyEvidence ?? options.artifactPrivacyEvidenceApproved,
    productionDeploymentApproved: options.productionDeploymentApproved,
    billingLedgerPersistenceApproved: options.billingLedgerPersistenceApproved,
    costControlsApproved: options.costControlsApproved,
    incidentRunbookApproved: options.incidentRunbookApproved,
    observabilityApproved: options.observabilityApproved,
    legalApproval: options.legalApproval,
    checklist: options.checklist,
  })
  const internalDryRun = findBetaLaunchStageGate(launchStageGates, 'internal_dry_run')
  const boundedToolExecution = findBetaLaunchStageGate(launchStageGates, 'bounded_tool_execution')
  const externalBeta = findBetaLaunchStageGate(launchStageGates, 'external_beta')
  const realUserMediaBeta = findBetaLaunchStageGate(launchStageGates, 'real_user_media_beta')
  const paidProduction = findBetaLaunchStageGate(launchStageGates, 'paid_production')
  const blockers = [...new Set([
    ...externalBeta.blockers,
    ...realUserMediaBeta.blockers,
    ...paidProduction.blockers,
  ])]
  const warnings = [...new Set([
    ...launchStageGates.flatMap((gate) => gate.warnings),
    'Internal dry-run testing may proceed only inside approved backend/local gates.',
    'External beta, real-user-media beta, and paid production require explicit evidence, not default enablement.',
  ])]

  return {
    internalDryRunTestingAllowed: internalDryRun.allowed,
    limitedLocalDevInternalTestingAllowed: internalDryRun.allowed,
    boundedToolExecutionAllowed: boundedToolExecution.allowed,
    externalBetaAllowed: externalBeta.allowed,
    realUserMediaBetaAllowed: realUserMediaBeta.allowed,
    paidProductionAllowed: paidProduction.allowed,
    launchStageGates,
    blockers,
    warnings,
  }
}
