import { betaReadinessChecklist } from './beta-readiness-checklist'
import { evaluateBetaGoNoGo } from './beta-go-no-go-policy'
import { buildBetaScenarioReadinessMatrix } from './beta-scenario-readiness-matrix'
import type { BetaReadinessReport } from './beta-readiness-types'

export interface BuildBetaReadinessReportOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
}

export function buildBetaReadinessReport(options: BuildBetaReadinessReportOptions = {}): BetaReadinessReport {
  const checklist = betaReadinessChecklist
  const scenarioMatrix = buildBetaScenarioReadinessMatrix()
  const goNoGo = evaluateBetaGoNoGo({
    e2eDryRunPassed: options.e2eDryRunPassed ?? true,
    safetyDocsExist: options.safetyDocsExist ?? true,
    costDocsExist: options.costDocsExist ?? true,
    productionReadinessBlocked: true,
    checklist,
  })
  const blockers = [
    ...goNoGo.blockers,
    ...scenarioMatrix.flatMap((scenario) => scenario.blockers),
  ]
  const warnings = [
    ...goNoGo.warnings,
    ...checklist.filter((item) => item.status === 'warning').map((item) => item.label),
  ]

  return {
    reportId: `beta-readiness-${new Date().toISOString()}`,
    createdAt: new Date().toISOString(),
    overallStatus: goNoGo.externalBetaAllowed ? 'warning' : goNoGo.internalDryRunTestingAllowed ? 'internal_testing_ready' : 'blocked',
    productionReady: false,
    checklist,
    scenarioMatrix,
    goNoGo,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    nextActions: [
      'Use bounded external beta only as a no-runtime, no-real-user-media scorecard state.',
      'Complete human security, cost, storage, deployment, model, and legal reviews before real-user media beta.',
      'Keep real user media beta and paid production blocked until readiness is explicitly approved.',
    ],
  }
}
