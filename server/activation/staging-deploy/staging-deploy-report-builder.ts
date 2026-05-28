import { buildStagingCloudRunJobPlans } from './staging-cloud-run-job-plan'
import { buildStagingApiServicePlan } from './staging-cloud-run-service-plan'
import { buildStagingDeployCommandPlans } from './staging-deploy-command-plan'
import {
  buildStagingDeployImageRefs,
  parseStagingDeployConfig,
  validateStagingDeployConfig,
} from './staging-deploy-config'
import { buildStagingDeployBlockers } from './staging-deploy-blocker-policy'
import { validateStagingDeployPlan } from './staging-deploy-policy'
import { buildStagingHealthcheckSummary } from './staging-healthcheck-runner'
import { missingArchitectureEvidence } from './staging-image-architecture-check'
import type {
  BuildStagingDeployReportInput,
  StagingDeployReport,
  StagingDeployResult,
} from './staging-deploy-types'

export function buildStagingDeployReport(input: BuildStagingDeployReportInput = {}): StagingDeployReport {
  const config = parseStagingDeployConfig(input)
  const imageRefs = buildStagingDeployImageRefs(config)
  const architectureResults = input.architectureResults ?? imageRefs.map((imageRef) => missingArchitectureEvidence(imageRef.targetId, imageRef.fullImageRef))
  const servicePlan = buildStagingApiServicePlan(config, imageRefs.find((imageRef) => imageRef.targetId === 'api') ?? imageRefs[0])
  const jobPlans = buildStagingCloudRunJobPlans(config, imageRefs)
  const commandPlans = buildStagingDeployCommandPlans(servicePlan, jobPlans)
  const deployResults = input.deployLogs?.map(({ logPath, parsedLog }) => ({
    targetId: parsedLog.targetId ?? 'api',
    status: parsedLog.parsedStatus,
    serviceUrl: parsedLog.serviceUrl,
    logPath,
    parsedLog,
    warnings: parsedLog.warnings,
    blockers: [...parsedLog.errors, ...parsedLog.forbiddenFindings],
  } satisfies StagingDeployResult)) ?? plannedDeployResults()
  const deployedTargets = new Set(deployResults
    .filter((result) => result.status === 'ready' || result.status === 'deployed')
    .map((result) => result.targetId))
  const deployResultsReady = deployedTargets.has('api') &&
    deployedTargets.has('tool-readiness-job') &&
    deployedTargets.has('cpu-analysis-job') &&
    deployedTargets.has('qa-job') &&
    deployedTargets.has('render-job')
  const healthcheckSummary = buildStagingHealthcheckSummary({
    projectId: config.projectId,
    region: config.region,
    apiServiceReady: deployedTargets.has('api'),
    jobsReady: deployResultsReady,
    toolReadinessExecutionStatus: input.deployLogs?.some(({ logPath }) => logPath.includes('tool-readiness-execution')) ? 'passed' : 'skipped',
    blockers: deployResultsReady ? [] : ['Cloud Run deploy evidence is incomplete.'],
    warnings: deployResultsReady ? ['Healthcheck summary is derived from local deployment logs.'] : ['Tool-readiness job execution skipped.'],
  })
  const partialReport = {
    imageArchitectureResults: architectureResults,
    deployResults,
    gpuDeployed: false as const,
    productionReadyAllowed: false as const,
    externalBetaAllowed: false as const,
    realUserMediaTestingAllowed: false as const,
  }
  const evaluation = buildStagingDeployBlockers(partialReport)
  const planBlockers = [
    ...validateStagingDeployConfig(config),
    ...validateStagingDeployPlan({ config, servicePlan, jobPlans, commandPlans, architectureResults }),
  ].map((summary) => ({ id: 'staging-deploy-plan', summary }))
  const blockers = uniqueBlockers([...planBlockers, ...evaluation.blockers])
  const phase25Blockers = Array.from(new Set([...planBlockers.map((blocker) => blocker.summary), ...evaluation.phase25Readiness.blockers]))

  return {
    reportId: 'activation-phase-24b-staging-deploy-report',
    createdAt: input.createdAt ?? new Date().toISOString(),
    mode: blockers.some((blocker) => blocker.summary.includes('linux/amd64'))
      ? 'architecture_blocked'
      : input.deployLogs?.length
        ? 'report_from_logs'
        : 'static_plan',
    config,
    imageRefs,
    imageArchitectureResults: architectureResults,
    servicePlan,
    jobPlans,
    commandPlans,
    deployResults,
    healthcheckSummary,
    blockers,
    warnings: evaluation.warnings,
    phase25Readiness: {
      ...evaluation.phase25Readiness,
      readyForGeneratedFixtureE2E: evaluation.phase25Readiness.readyForGeneratedFixtureE2E && planBlockers.length === 0,
      blockers: phase25Blockers,
    },
    deploymentExecuted: Boolean(input.deployLogs?.length),
    cloudRunJobsExecuted: Boolean(input.deployLogs?.some(({ logPath }) => logPath.includes('execute-'))),
    gpuDeployed: false,
    providerExecuted: false,
    modelDownloadExecuted: false,
    mediaProcessingExecuted: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

function uniqueBlockers<T extends { summary: string }>(blockers: T[]): T[] {
  const seen = new Set<string>()
  return blockers.filter((blocker) => {
    if (seen.has(blocker.summary)) return false
    seen.add(blocker.summary)
    return true
  })
}

export function summarizeStagingDeployReport(report: StagingDeployReport): string {
  return [
    `Staging deploy report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Project: ${report.config.projectId}`,
    `Region: ${report.config.region}`,
    `Image tag: ${report.config.imageTag}`,
    `Command plans: ${report.commandPlans.length}`,
    `Architecture checks: ${report.imageArchitectureResults.length}`,
    `Blockers: ${report.blockers.length}`,
    `Deployment executed: ${report.deploymentExecuted}`,
    `Cloud Run jobs executed: ${report.cloudRunJobsExecuted}`,
    `GPU deployed: ${report.gpuDeployed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    `Phase 25 ready: ${report.phase25Readiness.readyForGeneratedFixtureE2E}`,
    '',
    'Architecture:',
    ...report.imageArchitectureResults.map((result) => `- ${result.targetId}: ${result.platforms.join(', ') || '(missing)'} compatible=${result.compatibleWithCloudRun}`),
    '',
    'Blockers:',
    ...(report.blockers.length > 0 ? report.blockers.map((blocker) => `- ${blocker.summary}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning.summary}`) : ['- none']),
  ].join('\n')
}

function plannedDeployResults(): StagingDeployResult[] {
  return [
    { targetId: 'api', status: 'blocked', warnings: [], blockers: ['Deployment not executed.'] },
    { targetId: 'tool-readiness-job', status: 'blocked', warnings: [], blockers: ['Deployment not executed.'] },
    { targetId: 'cpu-analysis-job', status: 'blocked', warnings: [], blockers: ['Deployment not executed.'] },
    { targetId: 'qa-job', status: 'blocked', warnings: [], blockers: ['Deployment not executed.'] },
    { targetId: 'render-job', status: 'blocked', warnings: [], blockers: ['Deployment not executed.'] },
  ]
}
