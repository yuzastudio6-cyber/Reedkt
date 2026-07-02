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
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const internalDryRunTestingAllowed = e2eDryRunPassed && safetyDocsExist && costDocsExist
  const blockers = [
    ...(productionReadinessBlocked ? ['Production readiness summary remains blocked.'] : []),
    ...requiredBlockedItems.map((item) => `${item.label} blocks external beta.`),
    ...(options.deploymentApproved ? [] : ['Human-run deployment approval is missing.']),
    ...(options.securityApproved ? [] : ['Security approval is missing.']),
    ...(options.storageApproved ? [] : ['Storage/privacy approval is missing.']),
    ...(options.modelLicensesApproved ? [] : ['Model weight and license approval is missing.']),
  ]

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed: internalDryRunTestingAllowed,
    externalBetaAllowed: false,
    realUserMediaBetaAllowed: false,
    paidProductionAllowed: false,
    blockers,
    warnings: [
      'Internal local-dev fixture testing must not use arbitrary user media.',
      'External beta and paid production remain blocked until human approvals pass.',
    ],
  }
}
