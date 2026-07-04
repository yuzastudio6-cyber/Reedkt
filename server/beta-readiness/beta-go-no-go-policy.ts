import type { BetaGoNoGoDecision, BetaReadinessChecklistItem } from './beta-readiness-types'

export interface EvaluateBetaGoNoGoOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  productionReadinessBlocked?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  privateMediaApproved?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  incidentRunbookApproved?: boolean
  observabilityApproved?: boolean
  noHardLaunchBlockers?: boolean
  rawPromptSafetyPassed?: boolean
  secretSafetyPassed?: boolean
  signedUrlSourceTruthBlocked?: boolean
  approvedSnapshotPolicyApproved?: boolean
  creditReservationPolicyApproved?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const rawPromptSafetyPassed = options.rawPromptSafetyPassed ?? true
  const secretSafetyPassed = options.secretSafetyPassed ?? true
  const signedUrlSourceTruthBlocked = options.signedUrlSourceTruthBlocked ?? true
  const noHardLaunchBlockers = options.noHardLaunchBlockers ?? false
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const hardSafetyBlockers = [
    ...(rawPromptSafetyPassed ? [] : ['Raw prompt safety gate failed.']),
    ...(secretSafetyPassed ? [] : ['Secret safety gate failed.']),
    ...(signedUrlSourceTruthBlocked ? [] : ['Signed URLs must not be used as source truth.']),
  ]
  const internalDryRunBlockers = [
    ...(e2eDryRunPassed ? [] : ['Dry-run E2E evidence is missing.']),
    ...(safetyDocsExist ? [] : ['Safety documentation is missing.']),
    ...(costDocsExist ? [] : ['Cost documentation is missing.']),
    ...hardSafetyBlockers,
  ]
  const boundedExecutionBlockers = [
    ...(options.approvedSnapshotPolicyApproved ? [] : ['Approved plan snapshot policy is missing.']),
    ...(options.creditReservationPolicyApproved ? [] : ['Credit estimate/reservation policy is missing.']),
    ...hardSafetyBlockers,
  ]
  const externalBetaBlockers = [
    ...internalDryRunBlockers,
    ...boundedExecutionBlockers,
    ...requiredBlockedItems.map((item) => `${item.label} blocks external beta.`),
    ...(productionReadinessBlocked ? ['Production readiness summary remains blocked.'] : []),
    ...(options.deploymentApproved ? [] : ['Human-run deployment approval is missing.']),
    ...(options.securityApproved ? [] : ['Security approval is missing.']),
    ...(options.storageApproved ? [] : ['Storage/privacy approval is missing.']),
    ...(options.modelLicensesApproved ? [] : ['Model weight and license approval is missing.']),
  ]
  const internalDryRunTestingAllowed = internalDryRunBlockers.length === 0
  const limitedLocalDevInternalTestingAllowed = internalDryRunTestingAllowed && boundedExecutionBlockers.length === 0
  const externalBetaAllowed = externalBetaBlockers.length === 0
  const realUserMediaBetaBlockers = [
    ...(externalBetaAllowed ? [] : ['External beta gate must pass before real-user-media beta.']),
    ...(options.privateMediaApproved ? [] : ['Private/user media approval is missing.']),
    ...(options.artifactPrivacyEvidenceApproved ? [] : ['Artifact privacy evidence is missing.']),
    ...hardSafetyBlockers,
  ]
  const realUserMediaBetaAllowed = realUserMediaBetaBlockers.length === 0
  const paidProductionBlockers = [
    ...(realUserMediaBetaAllowed ? [] : ['Real-user-media beta gate must pass before paid production.']),
    ...(options.productionDeploymentApproved ? [] : ['Production deployment approval is missing.']),
    ...(options.billingLedgerPersistenceApproved ? [] : ['Billing/ledger persistence approval is missing.']),
    ...(options.costControlsApproved ? [] : ['Cost controls approval is missing.']),
    ...(options.incidentRunbookApproved ? [] : ['Incident/runbook approval is missing.']),
    ...(options.observabilityApproved ? [] : ['Observability approval is missing.']),
    ...(noHardLaunchBlockers ? [] : ['Hard launch blockers remain open.']),
    ...hardSafetyBlockers,
  ]
  const paidProductionAllowed = paidProductionBlockers.length === 0
  const blockers = [
    ...externalBetaBlockers,
    ...realUserMediaBetaBlockers,
    ...paidProductionBlockers,
  ]

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed,
    externalBetaAllowed,
    realUserMediaBetaAllowed,
    paidProductionAllowed,
    blockers: [...new Set(blockers)],
    warnings: [
      'Internal local-dev fixture testing must not use arbitrary user media unless the real-user-media beta gate passes.',
      'External beta and paid production are computed from evidence; missing evidence blocks by default.',
    ],
  }
}
