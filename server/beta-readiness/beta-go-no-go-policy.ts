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
  privateMediaApproval?: boolean
  artifactPrivacyEvidenceApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  walletLifecycleApproved?: boolean
  stripeBoundaryConfirmed?: boolean
  costControlsApproved?: boolean
  observabilityAlertsApproved?: boolean
  rollbackKillSwitchesApproved?: boolean
  rateConcurrencyLimitsApproved?: boolean
  finalOwnerSignoffApproved?: boolean
  approvedPlanSnapshotGateConfirmed?: boolean
  creditReservationGateConfirmed?: boolean
  idempotencyGateConfirmed?: boolean
  rawPromptBlocked?: boolean
  secretsBlocked?: boolean
  signedUrlSourceTruthBlocked?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const internalDryRunTestingAllowed = e2eDryRunPassed && safetyDocsExist && costDocsExist
  const hardSafetyBlockers = [
    ...(options.approvedPlanSnapshotGateConfirmed ? [] : ['Approved plan snapshot gate is missing.']),
    ...(options.creditReservationGateConfirmed ? [] : ['Credit estimate/reservation gate is missing.']),
    ...(options.idempotencyGateConfirmed ? [] : ['Idempotency gate is missing.']),
    ...(options.rawPromptBlocked === true ? [] : ['Raw prompt execution block is missing.']),
    ...(options.secretsBlocked === true ? [] : ['Secret/service-role/provider-key block is missing.']),
    ...(options.signedUrlSourceTruthBlocked === true ? [] : ['Signed URL source-of-truth block is missing.']),
  ]
  const externalBetaBlockers = [
    ...(internalDryRunTestingAllowed ? [] : ['Internal dry-run testing prerequisites are missing.']),
    ...(productionReadinessBlocked ? ['Production readiness summary remains blocked.'] : []),
    ...requiredBlockedItems.map((item) => `${item.label} blocks external beta.`),
    ...(options.deploymentApproved ? [] : ['Human-run deployment approval is missing.']),
    ...(options.securityApproved ? [] : ['Security approval is missing.']),
    ...(options.storageApproved ? [] : ['Storage/privacy approval is missing.']),
    ...(options.modelLicensesApproved ? [] : ['Model weight and license approval is missing.']),
    ...hardSafetyBlockers,
  ]
  const externalBetaAllowed = externalBetaBlockers.length === 0
  const realUserMediaBetaBlockers = [
    ...(externalBetaAllowed ? [] : ['External beta gate has not passed.']),
    ...(options.privateMediaApproval ? [] : ['Private/user-media beta approval is missing.']),
    ...(options.artifactPrivacyEvidenceApproved ? [] : ['Private artifact/privacy evidence is missing.']),
    ...hardSafetyBlockers,
  ]
  const realUserMediaBetaAllowed = realUserMediaBetaBlockers.length === 0
  const paidProductionBlockers = [
    ...(realUserMediaBetaAllowed ? [] : ['Real-user-media beta gate has not passed.']),
    ...(options.productionDeploymentApproved ? [] : ['Production deployment approval is missing.']),
    ...(options.billingLedgerPersistenceApproved ? [] : ['Billing/tool-cost ledger persistence approval is missing.']),
    ...(options.walletLifecycleApproved ? [] : ['Wallet reserve/spend/release/refund approval is missing.']),
    ...(options.stripeBoundaryConfirmed ? [] : ['Stripe boundary confirmation is missing.']),
    ...(options.costControlsApproved ? [] : ['Cost-control approval is missing.']),
    ...(options.observabilityAlertsApproved ? [] : ['Observability/alert approval is missing.']),
    ...(options.rollbackKillSwitchesApproved ? [] : ['Rollback/kill-switch approval is missing.']),
    ...(options.rateConcurrencyLimitsApproved ? [] : ['Rate/concurrency-limit approval is missing.']),
    ...(options.finalOwnerSignoffApproved ? [] : ['Final owner signoff is missing.']),
    ...hardSafetyBlockers,
  ]
  const paidProductionAllowed = paidProductionBlockers.length === 0
  const blockers = [...new Set([
    ...externalBetaBlockers,
    ...realUserMediaBetaBlockers,
    ...paidProductionBlockers,
  ])]

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed: internalDryRunTestingAllowed,
    externalBetaAllowed,
    realUserMediaBetaAllowed,
    paidProductionAllowed,
    externalBetaBlockers,
    realUserMediaBetaBlockers,
    paidProductionBlockers,
    blockers,
    warnings: [
      'Internal local-dev fixture testing must not use arbitrary user media.',
      paidProductionAllowed
        ? 'Paid production is allowed only for requests that still satisfy approved snapshot, credit reservation, idempotency, privacy, billing, and ops gates.'
        : 'External beta and paid production remain blocked until the named evidence and owner approvals pass.',
    ],
  }
}
