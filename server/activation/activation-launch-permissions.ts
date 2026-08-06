import {
  evaluateBetaLaunchStageGates,
  findBetaLaunchStageGate,
  type BetaLaunchGateEvidence,
  type BetaLaunchStageGate,
} from '../beta-readiness'

export interface ActivationLaunchPermissionEvidence extends BetaLaunchGateEvidence {
  phaseQaPassed?: boolean
  phaseReadinessReady?: boolean
  privateArtifactsOnly?: boolean
  publicAccessBlocked?: boolean
  broadMediaBlocked?: boolean
}

export interface ActivationLaunchPermissions {
  productionReadyAllowed: boolean
  externalBetaAllowed: boolean
  paidProductionAllowed: boolean
  blockers: string[]
  warnings: string[]
  launchStageGates: BetaLaunchStageGate[]
}

function phaseBlockers(input: ActivationLaunchPermissionEvidence): string[] {
  return [
    ...(input.phaseQaPassed ? [] : ['Activation phase QA evidence is missing.']),
    ...(input.phaseReadinessReady ? [] : ['Activation phase readiness evidence is missing.']),
    ...(input.privateArtifactsOnly ? [] : ['Private artifact boundary evidence is missing.']),
    ...(input.publicAccessBlocked ? [] : ['Public access must be blocked or explicitly reviewed.']),
    ...(input.broadMediaBlocked ? [] : ['Broad media scope must be blocked or explicitly reviewed.']),
  ]
}

export function createActivationLaunchPermissions(input: ActivationLaunchPermissionEvidence = {}): ActivationLaunchPermissions {
  const launchStageGates = evaluateBetaLaunchStageGates({
    e2eDryRunPassed: input.e2eDryRunPassed,
    safetyDocsExist: input.safetyDocsExist,
    costDocsExist: input.costDocsExist,
    productionReadinessBlocked: input.productionReadinessBlocked ?? true,
    approvedPlanSnapshotGatePresent: input.approvedPlanSnapshotGatePresent,
    creditEstimateGatePresent: input.creditEstimateGatePresent,
    creditReservationGatePresent: input.creditReservationGatePresent,
    idempotencyGatePresent: input.idempotencyGatePresent,
    rawPromptStorageBlocked: input.rawPromptStorageBlocked,
    secretScrubbingEnabled: input.secretScrubbingEnabled,
    signedUrlSourceTruthBlocked: input.signedUrlSourceTruthBlocked,
    licenseModelWeightReviewApproved: input.licenseModelWeightReviewApproved,
    deploymentApproved: input.deploymentApproved,
    securityApproved: input.securityApproved,
    storageApproved: input.storageApproved,
    modelLicensesApproved: input.modelLicensesApproved,
    privateMediaApproval: input.privateMediaApproval,
    artifactPrivacyEvidence: input.artifactPrivacyEvidence,
    productionDeploymentApproved: input.productionDeploymentApproved,
    billingLedgerPersistenceApproved: input.billingLedgerPersistenceApproved,
    costControlsApproved: input.costControlsApproved,
    incidentRunbookApproved: input.incidentRunbookApproved,
    observabilityApproved: input.observabilityApproved,
    legalApproval: input.legalApproval,
    checklist: input.checklist,
  })
  const externalBeta = findBetaLaunchStageGate(launchStageGates, 'external_beta')
  const paidProduction = findBetaLaunchStageGate(launchStageGates, 'paid_production')
  const activationBlockers = phaseBlockers(input)
  const externalBetaAllowed = externalBeta.allowed && activationBlockers.length === 0
  const paidProductionAllowed = paidProduction.allowed && activationBlockers.length === 0

  return {
    productionReadyAllowed: paidProductionAllowed,
    externalBetaAllowed,
    paidProductionAllowed,
    blockers: [...new Set([...activationBlockers, ...externalBeta.blockers, ...paidProduction.blockers])],
    warnings: [...new Set(launchStageGates.flatMap((gate) => gate.warnings))],
    launchStageGates,
  }
}

export const defaultActivationLaunchPermissions = createActivationLaunchPermissions()
