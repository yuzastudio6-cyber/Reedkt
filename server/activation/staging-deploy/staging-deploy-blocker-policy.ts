import type {
  StagingDeployBlocker,
  StagingDeployReport,
  StagingDeployWarning,
  StagingPhase25Readiness,
} from './staging-deploy-types'

export function buildStagingDeployBlockers(report: Pick<StagingDeployReport, 'imageArchitectureResults' | 'deployResults' | 'gpuDeployed' | 'productionReadyAllowed' | 'externalBetaAllowed' | 'realUserMediaTestingAllowed'>): {
  blockers: StagingDeployBlocker[]
  warnings: StagingDeployWarning[]
  phase25Readiness: StagingPhase25Readiness
} {
  const blockers: StagingDeployBlocker[] = []
  const warnings: StagingDeployWarning[] = []
  for (const architecture of report.imageArchitectureResults) {
    for (const blocker of architecture.blockers) blockers.push({ id: `architecture-${architecture.targetId}`, targetId: architecture.targetId, summary: blocker })
    for (const warning of architecture.warnings) warnings.push({ id: `architecture-warning-${architecture.targetId}`, targetId: architecture.targetId, summary: warning })
  }
  for (const result of report.deployResults) {
    if (['failed', 'blocked'].includes(result.status)) blockers.push({ id: `deploy-${result.targetId}`, targetId: result.targetId, summary: `${result.targetId} deploy status is ${result.status}.` })
  }
  if (report.gpuDeployed) blockers.push({ id: 'gpu-deployed', targetId: 'gpu-ai-job', summary: 'GPU job must not be deployed in Phase 24B.' })
  if (report.productionReadyAllowed) blockers.push({ id: 'production-ready', summary: 'Production readiness must remain false.' })
  if (report.externalBetaAllowed) blockers.push({ id: 'external-beta', summary: 'External beta must remain false.' })
  if (report.realUserMediaTestingAllowed) blockers.push({ id: 'real-media', summary: 'Real user media testing must remain false.' })

  return {
    blockers,
    warnings,
    phase25Readiness: {
      readyForGeneratedFixtureE2E: blockers.length === 0 && report.deployResults.filter((result) => result.status === 'ready' || result.status === 'deployed').length >= 5,
      blockers: blockers.map((blocker) => blocker.summary),
      warnings: warnings.map((warning) => warning.summary),
    },
  }
}
