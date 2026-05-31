import { existsSync, readFileSync } from 'node:fs'
import { getApprovedProColorImageRuntimeEvidence } from './approved-pro-color-image-runtime-evidence'
import { buildProColorImageRuntimeCommandPlans } from './pro-color-image-runtime-command-plan'
import { buildProColorImageRuntimeFixturePlan } from './pro-color-image-runtime-fixture-plan'
import { buildProColorImageRuntimeIamPlan } from './pro-color-image-runtime-iam-plan'
import { proColorImageRuntimeConfig } from './pro-color-image-runtime-policy'
import { buildProColorImageRuntimeQaSummary } from './pro-color-image-runtime-qa-summary'
import { buildProColorImageRuntimeToolResolverSummary } from './pro-color-image-runtime-tool-resolver'
import type { ProColorImageRuntimeExecutionReport, ProColorImageRuntimeReport } from './pro-color-image-runtime-types'

export const PRO_COLOR_IMAGE_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/pro-color-image-runtime/phase40b/job-execution/pro-color-image-runtime-report.json'

export function buildProColorImageRuntimeReport(input: {
  executionReport?: ProColorImageRuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): ProColorImageRuntimeReport {
  const approvedEvidence = getApprovedProColorImageRuntimeEvidence()
  const executionReport = input.executionReport ?? readProColorImageRuntimeExecutionReport(input.reportPath ?? PRO_COLOR_IMAGE_RUNTIME_LOCAL_REPORT_PATH)
  const fixturePlan = buildProColorImageRuntimeFixturePlan()
  const toolResolver = buildProColorImageRuntimeToolResolverSummary()
  const qaSummary = buildProColorImageRuntimeQaSummary(executionReport)
  const approvedEvidenceOnly = approvedEvidence.status !== 'not_run' && !executionReport
  const qaBlockers = approvedEvidenceOnly ? [] : qaSummary.blockers
  const qaWarnings = approvedEvidenceOnly ? [] : qaSummary.warnings
  const approvedEvidenceBlockers = executionReport ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([
    ...fixturePlan.blockers,
    ...qaBlockers,
    ...approvedEvidenceBlockers,
  ]))
  const warnings = Array.from(new Set([
    ...fixturePlan.warnings,
    ...qaWarnings,
    ...approvedEvidence.warnings,
  ]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-40b-pro-color-image-runtime',
    createdAt: new Date().toISOString(),
    config: proColorImageRuntimeConfig,
    fixturePlan,
    toolResolver,
    iamPlan: buildProColorImageRuntimeIamPlan(),
    commandPlans: buildProColorImageRuntimeCommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    proColorImageRuntimeVerified: ready || approvedEvidence.status === 'verified',
    phase40CReadiness: {
      readyForControlledRealVideoProColorImageSample: ready || approvedEvidence.phase40CReadiness.readyForControlledRealVideoProColorImageSample,
      reason: executionReport && ready ? qaSummary.reason : approvedEvidence.phase40CReadiness.reason,
    },
    generatedFixtureOnly: true,
    realVideoInputAllowed: false,
    realUserMediaAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeProColorImageRuntimeReport(report: ProColorImageRuntimeReport): string {
  const toolLines = report.executionReport
    ? report.executionReport.tools.map((tool) => `- ${tool.toolId}: ${tool.status}; operation=${tool.operation}`)
    : Object.entries(report.approvedEvidence.toolResults).map(([toolId, status]) => `- ${toolId}: ${status}`)
  return [
    `Pro color/image runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Runtime mode: ${report.config.runtimeMode}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved runtime evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Blockers: ${report.blockers.length}`,
    `Runtime verified: ${report.proColorImageRuntimeVerified}`,
    `Phase 40C ready: ${report.phase40CReadiness.readyForControlledRealVideoProColorImageSample}`,
    `Generated fixtures only: ${report.generatedFixtureOnly}`,
    `Real video input allowed: ${report.realVideoInputAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Tool runtime results:',
    ...toolLines,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readProColorImageRuntimeExecutionReport(path: string): ProColorImageRuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as ProColorImageRuntimeExecutionReport
}

export function isProColorImageRuntimeExecutionVerified(report: ProColorImageRuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.phase === '40B'
      && report.projectId === proColorImageRuntimeConfig.projectId
      && report.runtimeMode === proColorImageRuntimeConfig.runtimeMode
      && report.compute.mode === 'cpu'
      && report.compute.gpuRequested === false
      && report.fixture.generated
      && report.fixture.frameCount === proColorImageRuntimeConfig.fixtureFrameCount
      && report.tools.every((tool) => tool.status === 'passed')
      && report.qa.status === 'passed'
      && report.safety.realMediaUsed === false
      && report.safety.realVideoUsed === false
      && report.safety.userMediaUsed === false
      && report.safety.providerExecuted === false
      && report.safety.revideoUsed === false
      && report.safety.publicAccessEnabled === false
      && report.safety.finalDeliveryCreated === false
      && report.safety.productionReadyAllowed === false
      && report.safety.externalBetaAllowed === false
      && report.safety.broadRealUserMediaAllowed === false,
  )
}
