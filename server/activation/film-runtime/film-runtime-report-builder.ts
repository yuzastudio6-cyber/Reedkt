import { existsSync, readFileSync } from 'node:fs'
import { getApprovedFilmRuntimeEvidence } from './approved-film-runtime-evidence'
import { buildFilmRuntimeCommandPlans } from './film-runtime-command-plan'
import { buildFilmRuntimeFixturePlan } from './film-runtime-fixture-plan'
import { buildFilmRuntimeIamPlan } from './film-runtime-iam-plan'
import { buildFilmRuntimeModelResolverSummary } from './film-runtime-model-resolver'
import { filmRuntimeConfig } from './film-runtime-policy'
import { buildFilmRuntimeQaSummary } from './film-runtime-qa-summary'
import type { FilmRuntimeExecutionReport, FilmRuntimeReport } from './film-runtime-types'

export const FILM_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/film-runtime/phase38c/job-execution/film-runtime-report.json'

export function buildFilmRuntimeReport(input: {
  executionReport?: FilmRuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): FilmRuntimeReport {
  const approvedEvidence = getApprovedFilmRuntimeEvidence()
  const executionReport = input.executionReport ?? readFilmRuntimeExecutionReport(input.reportPath ?? FILM_RUNTIME_LOCAL_REPORT_PATH)
  const modelResolver = buildFilmRuntimeModelResolverSummary()
  const fixturePlan = buildFilmRuntimeFixturePlan()
  const qaSummary = buildFilmRuntimeQaSummary(executionReport)
  const qaBlockers = approvedEvidence.status === 'verified' && !executionReport ? [] : qaSummary.blockers
  const qaWarnings = approvedEvidence.status === 'verified' && !executionReport ? [] : qaSummary.warnings
  const blockers = Array.from(new Set([
    ...modelResolver.blockers,
    ...fixturePlan.blockers,
    ...qaBlockers,
    ...approvedEvidence.blockers.filter((blocker) => approvedEvidence.status !== 'verified' && !executionReport ? blocker : false),
  ]))
  const warnings = Array.from(new Set([...modelResolver.warnings, ...fixturePlan.warnings, ...qaWarnings, ...approvedEvidence.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-38c-film-runtime',
    createdAt: new Date().toISOString(),
    config: filmRuntimeConfig,
    fixturePlan,
    iamPlan: buildFilmRuntimeIamPlan(),
    commandPlans: buildFilmRuntimeCommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    filmRuntimeVerified: ready || approvedEvidence.status === 'verified',
    phase38DReadiness: {
      readyForControlledSelectedRealVideoSlowMotionSample: ready || approvedEvidence.phase38DReadiness.readyForControlledSelectedRealVideoSlowMotionSample,
      reason: ready ? qaSummary.reason : approvedEvidence.phase38DReadiness.reason,
    },
    generatedFramesOnly: true,
    realVideoInputAllowed: false,
    realUserMediaAllowed: false,
    realVideoSlowMotionAllowed: false,
    fullVideoInterpolationAllowed: false,
    slowMotionAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeFilmRuntimeReport(report: FilmRuntimeReport): string {
  return [
    `FILM runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Model artifact: ${report.config.artifactId}`,
    `Model GCS path: ${report.config.artifactGcsPath}`,
    `Aggregate checksum: ${report.config.aggregateSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved runtime evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Blockers: ${report.blockers.length}`,
    `FILM runtime verified: ${report.filmRuntimeVerified}`,
    `Phase 38D ready: ${report.phase38DReadiness.readyForControlledSelectedRealVideoSlowMotionSample}`,
    `Generated frames only: ${report.generatedFramesOnly}`,
    `Real video input allowed: ${report.realVideoInputAllowed}`,
    `Full-video interpolation allowed: ${report.fullVideoInterpolationAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Interpolation output:',
    report.executionReport
      ? `- ${report.executionReport.interpolation.status}; interpolated frames=${report.executionReport.interpolation.interpolatedFrameUris.length}`
      : report.approvedEvidence.status === 'verified' && report.approvedEvidence.generatedFixture
        ? `- verified by approved evidence; generated frames=${report.approvedEvidence.generatedFixture.frameCount}`
        : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readFilmRuntimeExecutionReport(path: string): FilmRuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as FilmRuntimeExecutionReport
}

export function isFilmRuntimeExecutionVerified(report: FilmRuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.projectId === filmRuntimeConfig.projectId
      && report.compute.mode === filmRuntimeConfig.computeMode
      && report.compute.gpuRequested === false
      && report.model.artifactId === filmRuntimeConfig.artifactId
      && report.model.kerasMetadataSha256 === filmRuntimeConfig.kerasMetadataSha256
      && report.model.savedModelSha256 === filmRuntimeConfig.savedModelSha256
      && report.model.variablesDataSha256 === filmRuntimeConfig.variablesDataSha256
      && report.model.variablesIndexSha256 === filmRuntimeConfig.variablesIndexSha256
      && report.model.aggregateSha256 === filmRuntimeConfig.aggregateSha256
      && report.fixture.generated
      && report.fixture.frameCount === filmRuntimeConfig.fixtureFrameCount
      && report.interpolation.status === 'completed'
      && report.interpolation.interpolatedFrameUris.length === 1
      && report.qa.status !== 'blocked'
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.realMediaUsed === false
      && report.safety.realVideoInputUsed === false
      && report.safety.realVideoSlowMotionExecuted === false
      && report.safety.fullVideoInterpolationExecuted === false
      && report.safety.slowMotionExecuted === false
      && report.safety.revideoUsed === false
      && report.safety.publicAccessEnabled === false,
  )
}
