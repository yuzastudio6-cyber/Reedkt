export type BetaReadinessStatus = 'passed' | 'warning' | 'blocked' | 'not_started'

export interface BetaReadinessChecklistItem {
  id: string
  label: string
  status: BetaReadinessStatus
  requiredForExternalBeta: boolean
  notes: string[]
}

export interface BetaScenarioReadiness {
  scenarioId: string
  dryRunReady: boolean
  localDevFixtureReady: boolean
  productionReady: boolean
  blockers: string[]
  nextActions: string[]
}

export interface BetaGoNoGoDecision {
  internalDryRunTestingAllowed: boolean
  limitedLocalDevInternalTestingAllowed: boolean
  externalBetaAllowed: boolean
  realUserMediaBetaAllowed: boolean
  paidProductionAllowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface BetaReadinessReport {
  reportId: string
  createdAt: string
  overallStatus: 'blocked' | 'internal_testing_ready' | 'external_beta_ready' | 'real_user_media_beta_ready' | 'paid_production_ready' | 'warning'
  productionReady: boolean
  checklist: BetaReadinessChecklistItem[]
  scenarioMatrix: BetaScenarioReadiness[]
  goNoGo: BetaGoNoGoDecision
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}
