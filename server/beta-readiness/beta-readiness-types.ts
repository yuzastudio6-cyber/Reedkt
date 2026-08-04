export type BetaReadinessStatus = 'passed' | 'warning' | 'blocked' | 'not_started'

export interface BetaReadinessChecklistItem {
  id: string
  label: string
  status: BetaReadinessStatus
  requiredForExternalBeta: boolean
  notes: string[]
}

export type BetaLaunchStage =
  | 'internal_dry_run'
  | 'bounded_tool_execution'
  | 'external_beta'
  | 'real_user_media_beta'
  | 'paid_production'

export interface BetaLaunchStageGate {
  stage: BetaLaunchStage
  allowed: boolean
  blockers: string[]
  warnings: string[]
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
  boundedToolExecutionAllowed: boolean
  externalBetaAllowed: boolean
  realUserMediaBetaAllowed: boolean
  paidProductionAllowed: boolean
  launchStageGates: BetaLaunchStageGate[]
  blockers: string[]
  warnings: string[]
}

export interface BetaReadinessReport {
  reportId: string
  createdAt: string
  overallStatus: 'blocked' | 'internal_testing_ready' | 'external_beta_ready' | 'real_user_media_beta_ready' | 'paid_production_ready' | 'warning'
  productionReady: boolean
  productionReadinessBlocked: boolean
  checklist: BetaReadinessChecklistItem[]
  scenarioMatrix: BetaScenarioReadiness[]
  goNoGo: BetaGoNoGoDecision
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}
