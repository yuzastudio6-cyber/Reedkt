import type { StagingHealthcheckSummary } from './staging-deploy-types'

export function buildStagingHealthcheckSummary(input: {
  projectId?: string
  region?: string
  apiServiceReady?: boolean
  jobsReady?: boolean
  toolReadinessExecutionStatus?: StagingHealthcheckSummary['toolReadinessExecutionStatus']
  blockers?: string[]
  warnings?: string[]
} = {}): StagingHealthcheckSummary {
  const blockers = input.blockers ?? ['Cloud Run deploy was not executed; health checks are blocked.']
  return {
    reportId: 'activation-phase-24b-staging-healthcheck-summary',
    createdAt: new Date().toISOString(),
    projectId: input.projectId,
    region: input.region,
    apiServiceReady: input.apiServiceReady ?? false,
    jobsReady: input.jobsReady ?? false,
    toolReadinessExecutionStatus: input.toolReadinessExecutionStatus ?? 'skipped',
    blockers,
    warnings: input.warnings ?? ['Healthcheck summary is static unless deploy logs are provided.'],
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeStagingHealthcheckSummary(summary: StagingHealthcheckSummary): string {
  return [
    `Staging healthcheck summary: ${summary.reportId}`,
    `Project: ${summary.projectId ?? '(missing)'}`,
    `Region: ${summary.region ?? '(missing)'}`,
    `API service ready: ${summary.apiServiceReady}`,
    `Jobs ready: ${summary.jobsReady}`,
    `Tool-readiness execution: ${summary.toolReadinessExecutionStatus}`,
    `Production ready allowed: ${summary.productionReadyAllowed}`,
    `External beta allowed: ${summary.externalBetaAllowed}`,
    `Real user media testing allowed: ${summary.realUserMediaTestingAllowed}`,
    '',
    'Blockers:',
    ...(summary.blockers.length > 0 ? summary.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(summary.warnings.length > 0 ? summary.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
