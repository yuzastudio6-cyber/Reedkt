import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseAuthenticatedHealthEvidence } from './staging-fixture-api-client'
import { mergeArtifactVerification } from './staging-fixture-artifact-tracker'
import type {
  StagingFixtureE2EConfig,
  StagingFixtureE2EMode,
  StagingFixtureE2EReport,
  StagingFixtureJobResult,
} from './staging-fixture-e2e-types'
import { buildStagingFixtureQASummary } from './staging-fixture-qa-summary'
import { buildFixturePrefix, stagingFixtureBuckets } from './staging-fixture-storage-client'
import { parseExecutionId, stagingFixtureJobOrder } from './staging-fixture-job-runner'

export const STAGING_FIXTURE_E2E_REPORT_ID = 'activation-phase-25-staging-generated-fixture-e2e'

export function buildStagingFixtureE2EConfig(input: {
  projectId?: string
  region?: string
  imageTag?: string
  mode?: StagingFixtureE2EMode
  runId?: string
  logDir?: string
  env?: NodeJS.ProcessEnv
}): StagingFixtureE2EConfig {
  const env = input.env ?? process.env
  const imageTag = input.imageTag ?? env.REEDITPRO_IMAGE_TAG ?? 'staging-fixture-001'
  return {
    projectId: input.projectId ?? env.GCP_PROJECT_ID ?? 'reeditpro',
    region: input.region ?? env.GCP_REGION ?? 'us-central1',
    environment: 'staging',
    imageTag,
    confirmE2E: env.REEDITPRO_CONFIRM_STAGING_E2E === 'true',
    mode: input.mode ?? 'plan',
    runId: input.runId ?? env.STAGING_FIXTURE_RUN_ID ?? 'latest',
    logDir: input.logDir ?? path.join('activation-logs', 'staging-fixture-e2e', 'phase25'),
  }
}

export function validateStagingFixtureE2EConfig(config: StagingFixtureE2EConfig): string[] {
  const blockers: string[] = []
  if (config.projectId !== 'reeditpro') blockers.push('GCP project must be exactly reeditpro.')
  if (config.region !== 'us-central1') blockers.push('GCP region must be us-central1.')
  if (config.environment !== 'staging') blockers.push('REEDITPRO_ENV must be staging.')
  if (/production/i.test(`${config.projectId} ${config.environment}`)) blockers.push('Production-looking env/project is forbidden.')
  if (config.mode === 'execute' && !config.confirmE2E) blockers.push('REEDITPRO_CONFIRM_STAGING_E2E=true is required for execution.')
  return blockers
}

export function buildStagingFixtureE2EReport(config: StagingFixtureE2EConfig): StagingFixtureE2EReport {
  const configBlockers = validateStagingFixtureE2EConfig(config)
  const healthEvidence = readLog(config.logDir, 'api-health.log')
  const health = parseAuthenticatedHealthEvidence(healthEvidence)
  const verifiedObjects = readVerifiedObjects(config.logDir)
  const artifacts = mergeArtifactVerification(config.runId, verifiedObjects)
  const jobs = buildJobResults(config.logDir)
  const qaSummary = buildStagingFixtureQASummary(artifacts)
  const fixtureObject = `${buildFixturePrefix(config.runId)}/fixture.mp4`
  const executionAttempted = jobs.some((job) => job.status === 'passed' || job.status === 'failed' || job.status === 'blocked')
  const blockers = [
    ...configBlockers,
    ...(config.mode === 'report' && health.status !== 'passed' ? health.warnings : []),
    ...jobs.flatMap((job) => job.blockers),
    ...qaSummary.blockingGateFailures,
  ]
  const warnings = [
    ...health.warnings.filter((warning) => !blockers.includes(warning)),
    ...jobs.flatMap((job) => job.warnings),
    ...qaSummary.warnings,
    'Phase 25 generated-fixture E2E does not allow real user media testing.',
  ]

  return {
    reportId: STAGING_FIXTURE_E2E_REPORT_ID,
    createdAt: new Date().toISOString(),
    mode: config.mode,
    config,
    buckets: stagingFixtureBuckets,
    apiHealthStatus: health.status,
    fixtureLocalPath: fileExists(config.logDir, 'fixture.mp4') ? path.join(config.logDir, 'fixture.mp4') : undefined,
    fixtureGcsObject: `gs://${stagingFixtureBuckets.source}/${fixtureObject}`,
    jobs,
    artifacts,
    qaSummary,
    cleanupStatus: executionAttempted ? 'passed' : 'planned',
    blockers,
    warnings,
    phase26Readiness: {
      ready: blockers.length === 0 && health.status === 'passed' && qaSummary.status === 'passed',
      reason: blockers.length === 0 && health.status === 'passed' && qaSummary.status === 'passed'
        ? 'Generated-fixture staging E2E completed with private artifacts and passing QA summary.'
        : 'Generated-fixture staging E2E is incomplete or blocked.',
    },
    phase28Readiness: {
      ready: false,
      reason: 'First real video testing remains blocked until explicit approval after generated-fixture evidence review.',
    },
    providerExecuted: false,
    modelDownloadExecuted: false,
    gpuExecuted: false,
    realUserMediaUsed: false,
    publicAccessGranted: false,
    secretValuesCreated: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeStagingFixtureE2EReport(report: StagingFixtureE2EReport): string {
  return [
    `Staging fixture E2E report: ${report.reportId}`,
    `Mode: ${report.mode}`,
    `Project: ${report.config.projectId}`,
    `Region: ${report.config.region}`,
    `Run ID: ${report.config.runId}`,
    `API health: ${report.apiHealthStatus}`,
    `Jobs passed: ${report.jobs.filter((job) => job.status === 'passed').length}/${report.jobs.length}`,
    `Artifacts verified: ${report.artifacts.filter((artifact) => artifact.exists).length}/${report.artifacts.length}`,
    `QA status: ${report.qaSummary.status}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 26 ready: ${report.phase26Readiness.ready}`,
    'Production ready allowed: false',
    'External beta allowed: false',
    'Real user media testing allowed: false',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

function buildJobResults(logDir: string): StagingFixtureJobResult[] {
  return [
    jobResult(logDir, 'execute-tool-readiness.log', 'reeditpro-staging-tool-readiness-job', 'tool-readiness'),
    jobResult(logDir, 'execute-cpu.log', 'reeditpro-staging-cpu-analysis-job', 'cpu'),
    jobResult(logDir, 'execute-render.log', 'reeditpro-staging-render-job', 'render'),
    jobResult(logDir, 'execute-qa.log', 'reeditpro-staging-qa-job', 'qa'),
  ]
}

function jobResult(
  logDir: string,
  fileName: string,
  jobName: (typeof stagingFixtureJobOrder)[number],
  stage: StagingFixtureJobResult['stage'],
): StagingFixtureJobResult {
  const logPath = path.join(logDir, fileName)
  if (!existsSync(logPath)) {
    return { jobName, stage, status: 'planned', logPath, blockers: [], warnings: [`No execution log found for ${jobName}.`] }
  }
  const text = readFileSync(logPath, 'utf8')
  const executionId = parseExecutionId(text)
  const failed = /ERROR:|Traceback|NonZeroExitCode|exit code:\s*[1-9]|completed with failed|Task .* failed|runningState['"]?\s*:\s*['"]?Failed|status:\s*False/i.test(text)
  const passed = /completed successfully|succeededCount['"]?\s*:\s*1|runningState['"]?\s*:\s*['"]?Succeeded|Execution completed successfully/i.test(text) && !failed
  return {
    jobName,
    stage,
    executionId,
    status: passed ? 'passed' : failed ? 'failed' : 'warning',
    logPath,
    blockers: failed ? [`${jobName} execution failed; see ${logPath}.`] : [],
    warnings: passed ? [] : [`${jobName} execution log was present but did not include a clear success marker.`],
  }
}

function readVerifiedObjects(logDir: string): string[] {
  const text = readLog(logDir, 'artifact-verification.json')
  if (!text) return []
  try {
    const parsed = JSON.parse(text) as { objects?: string[] }
    return parsed.objects ?? []
  } catch {
    return []
  }
}

function readLog(logDir: string, fileName: string): string {
  const logPath = path.join(logDir, fileName)
  return existsSync(logPath) ? readFileSync(logPath, 'utf8') : ''
}

function fileExists(logDir: string, fileName: string): boolean {
  return existsSync(path.join(logDir, fileName))
}
