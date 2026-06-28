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
  boundedExternalBetaScorecardApproved?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

export function evaluateBetaGoNoGo(options: EvaluateBetaGoNoGoOptions = {}): BetaGoNoGoDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const productionReadinessBlocked = options.productionReadinessBlocked ?? true
  const boundedExternalBetaScorecardApproved = options.boundedExternalBetaScorecardApproved ?? true
  const requiredBlockedItems = (options.checklist ?? []).filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
  const internalDryRunTestingAllowed = e2eDryRunPassed && safetyDocsExist && costDocsExist
  const externalBetaAllowed = internalDryRunTestingAllowed && boundedExternalBetaScorecardApproved && requiredBlockedItems.length === 0
  const blockers = [
    ...(productionReadinessBlocked ? ['Production readiness summary remains blocked for paid production, production launch, and real-user media beta.'] : []),
    ...requiredBlockedItems.map((item) => `${item.label} blocks bounded external beta.`),
    ...(options.deploymentApproved ? [] : ['Human-run deployment approval remains required before real-user media beta or production.']),
    ...(options.securityApproved ? [] : ['Security approval remains required before real-user media beta or production.']),
    ...(options.storageApproved ? [] : ['Storage/privacy approval remains required before real-user media beta or production.']),
    ...(options.modelLicensesApproved ? [] : ['Model weight and license approval remains required before model-backed real-user media beta or production.']),
  ]

  return {
    internalDryRunTestingAllowed,
    limitedLocalDevInternalTestingAllowed: internalDryRunTestingAllowed,
    externalBetaAllowed,
    realUserMediaBetaAllowed: false,
    paidProductionAllowed: false,
    blockers,
    warnings: [
      'Bounded external beta scorecard is allowed only for no-runtime, no-real-user-media verification.',
      'Real user media beta and paid production remain blocked until human-run deployment, storage, model/license, security, and cost approvals pass.',
    ],
  }
}
