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

export type ToolBetaExecutionReadinessBlockerId =
  | 'missing_tool_cost_owner_coverage'
  | 'missing_readiness_spec'
  | 'readiness_not_passed'
  | 'real_execution_not_verified'
  | 'production_readiness_blocked'
  | 'model_weight_approval_missing'
  | 'production_billing_persistence_missing'
  | 'product_ready_acceptance_missing'

export type ToolBetaExecutionReadinessPlatformBlockerId =
  | 'production_billing_deployment_unverified'

export interface ToolBetaExecutionReadinessBlocker {
  toolId: string
  blockerId: ToolBetaExecutionReadinessBlockerId
  message: string
}

export interface ToolBetaExecutionReadinessPlatformBlocker {
  blockerId: ToolBetaExecutionReadinessPlatformBlockerId
  message: string
  requiredForExternalBeta: true
}

export interface ToolBetaExecutionReadinessRecord {
  toolId: string
  displayName: string
  productionStatus: string
  meteringOwner: string
  usageCategory: string
  providerType: string
  computeLevel: string
  qualityLevel: string
  expectedWorkerTypes: string[]
  imageRoles: string[]
  readinessStatus: string
  readinessDryRun: boolean
  productionRequired: boolean
  blocksProductionIfMissing: boolean
  modelWeightsRequired: boolean
  productReadyLocalOss: false
  executableForExternalBeta: boolean
  executableForProduction: false
  blockers: ToolBetaExecutionReadinessBlocker[]
  nextAction: string
}

export interface ToolBetaExecutionReadinessReport {
  reportId: string
  createdAt: string
  totalTools: number
  ownerCoverageToolCount: number
  readinessSpecToolCount: number
  productReadyLocalOssCount: 0
  toolCostRateCardVersion: string
  productionBillingPersistence: string
  serviceFeeIncluded: false
  readinessMode: 'dry_run'
  allToolsHaveOwnerCoverage: boolean
  allToolsHaveReadinessSpecs: boolean
  internalDryRunMonitoringAllowed: boolean
  externalBetaToolExecutionAllowed: boolean
  productionToolExecutionAllowed: boolean
  tools: ToolBetaExecutionReadinessRecord[]
  platformBlockers: ToolBetaExecutionReadinessPlatformBlocker[]
  blockers: ToolBetaExecutionReadinessBlocker[]
  nextActions: string[]
  notes: string[]
}

export interface BetaReadinessReport {
  reportId: string
  createdAt: string
  overallStatus: 'blocked' | 'internal_testing_ready' | 'warning'
  productionReady: boolean
  checklist: BetaReadinessChecklistItem[]
  scenarioMatrix: BetaScenarioReadiness[]
  toolExecutionReadiness: ToolBetaExecutionReadinessReport
  goNoGo: BetaGoNoGoDecision
  blockers: string[]
  warnings: string[]
  nextActions: string[]
}
