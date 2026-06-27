import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import { buildToolBetaExecutionReadinessReport } from './tool-beta-execution-readiness'
import type { BetaReadinessReport } from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = betaReadinessChecklist
  const scenarioMatrix = buildBetaScenarioReadinessMatrix()
  const toolExecutionReadiness = buildToolBetaExecutionReadinessReport()
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked: !toolExecutionReadiness.externalBetaToolExecutionAllowed,
    checklist,
  })
  const blockers = [
    ...goNoGo.blockers,
    ...scenarioMatrix.flatMap((scenario) => scenario.blockers),
    ...toolExecutionReadiness.blockers.map((blocker) => `${blocker.toolId}: ${blocker.message}`),
  ]
  const warnings = [
    ...goNoGo.warnings,
    ...checklist.filter((item) => item.status === 'warning').map((item) => item.label),
  ]

  return {
    reportId: `beta-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus: goNoGo.internalDryRunTestingAllowed ? 'internal_testing_ready' : 'blocked',
    productionReady: false,
    checklist,
    scenarioMatrix,
    toolExecutionReadiness,
    goNoGo,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      'Run M16B dry-run E2E and M17 hardening smokes before any internal demo.',
      ...toolExecutionReadiness.nextActions,
      'Complete human security, cost, storage, deployment, model, and legal reviews before external beta.',
      'Keep real user media beta and paid production blocked until readiness is explicitly approved.',
    ],
  }
}
