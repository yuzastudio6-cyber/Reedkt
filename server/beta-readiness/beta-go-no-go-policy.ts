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
  legalApproved?: boolean
  monitoringApproved?: boolean
  supportApproved?: boolean
  realUserMediaBetaApproved?: boolean
  paidProductionApproved?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const internalDryRunTestingAllowed = e2eDryRunPassed && safetyDocsExist && costDocsExist
  const missingApprovals = [
    ...(options.deploymentApproved ? [] : ['Human-run deployment approval is missing.']),
    ...(options.securityApproved ? [] : ['Security approval is missing.']),
    ...(options.storageApproved ? [] : ['Storage/privacy approval is missing.']),
    ...(options.modelLicensesApproved ? [] : ['Model weight and license approval is missing.']),
    ...(options.legalApproved ? [] : ['Legal approval is missing.']),
    ...(options.monitoringApproved ? [] : ['Monitoring/observability approval is missing.']),
    ...(options.supportApproved ? [] : ['Support/incident-response approval is missing.']),
  ]
  const blockers = [
    ...(productionReadinessBlocked ? ['Production readiness summary remains blocked.'] : []),
    ...requiredBlockedItems.map((item) => `${item.label} blocks external beta.`),
    ...missingApprovals,
  ]
  const externalBetaAllowed = internalDryRunTestingAllowed &&
    !productionReadinessBlocked &&
    requiredBlockedItems.length === 0 &&
    missingApprovals.length === 0
  const realUserMediaBetaAllowed = externalBetaAllowed && options.realUserMediaBetaApproved === true
  const paidProductionAllowed = realUserMediaBetaAllowed && options.paidProductionApproved === true

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed: internalDryRunTestingAllowed,
    externalBetaAllowed,
    realUserMediaBetaAllowed,
    paidProductionAllowed,
    blockers,
    warnings: [
      'Internal local-dev fixture testing must not use arbitrary user media.',
      externalBetaAllowed
        ? 'External beta gate is allowed only for the approved scope represented by the supplied evidence.'
        : 'External beta and paid production remain blocked until human approvals pass.',
    ],
  }
}
