import { existsSync, readFileSync } from 'node:fs'
import { getApprovedSam2RuntimeEvidence } from './approved-sam2-runtime-evidence'
import { buildSam2RuntimeCommandPlans } from './sam2-runtime-command-plan'
import { buildSam2RuntimeFixturePlan } from './sam2-runtime-fixture-plan'
import { buildSam2RuntimeIamPlan } from './sam2-runtime-iam-plan'
import { buildSam2RuntimeModelResolverSummary } from './sam2-runtime-model-resolver'
import { sam2RuntimeConfig } from './sam2-runtime-policy'
import { buildSam2RuntimeQaSummary } from './sam2-runtime-qa-summary'
import type { Sam2RuntimeExecutionReport, Sam2RuntimeReport } from './sam2-runtime-types'

export const SAM2_RUNTIME_LOCAL_REPORT_PATH = 'activation-logs/sam2-runtime/phase35c/job-execution/sam2-runtime-report.json'

export function buildSam2RuntimeReport(input: {
  executionReport?: Sam2RuntimeExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): Sam2RuntimeReport {
  const approvedEvidence = getApprovedSam2RuntimeEvidence()
  const executionReport = input.executionReport ?? readSam2RuntimeExecutionReport(input.reportPath ?? SAM2_RUNTIME_LOCAL_REPORT_PATH)
  const modelResolver = buildSam2RuntimeModelResolverSummary()
  const fixturePlan = buildSam2RuntimeFixturePlan()
  const qaSummary = buildSam2RuntimeQaSummary(executionReport)
  const qaBlockers = approvedEvidence.status === 'verified' && !executionReport ? [] : qaSummary.blockers
  const blockers = Array.from(new Set([...modelResolver.blockers, ...fixturePlan.blockers, ...qaBlockers, ...approvedEvidence.blockers.filter((blocker) => approvedEvidence.status !== 'verified' && !executionReport ? blocker : false)]))
  const warnings = Array.from(new Set([...modelResolver.warnings, ...fixturePlan.warnings, ...qaSummary.warnings, ...approvedEvidence.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-35c-sam2-runtime',
    createdAt: new Date().toISOString(),
    config: sam2RuntimeConfig,
    fixturePlan,
    iamPlan: buildSam2RuntimeIamPlan(),
    commandPlans: buildSam2RuntimeCommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    sam2RuntimeVerified: ready || approvedEvidence.status === 'verified',
    phase35DReadiness: {
      readyForControlledShortRealVideoTemporalMaskTracking: ready || approvedEvidence.phase35DReadiness.readyForControlledShortRealVideoTemporalMaskTracking,
      reason: ready ? qaSummary.reason : approvedEvidence.phase35DReadiness.reason,
    },
    generatedFixtureOnly: true,
    realVideoInputAllowed: false,
    realUserMediaAllowed: false,
    temporalTrackingOnRealVideoAllowed: false,
    sam2TemporalTrackingAllowed: false,
    sam2FullVideoMaskAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeSam2RuntimeReport(report: Sam2RuntimeReport): string {
  return [
    `SAM2 runtime report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Model: ${report.config.modelId}`,
    `Checkpoint checksum: ${report.config.checkpointSha256}`,
    `Config checksum: ${report.config.configSha256}`,
    `Aggregate checksum: ${report.config.aggregateSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved runtime evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 35D ready: ${report.phase35DReadiness.readyForControlledShortRealVideoTemporalMaskTracking}`,
    `Generated fixture only: ${report.generatedFixtureOnly}`,
    `Real video input allowed: ${report.realVideoInputAllowed}`,
    `Full-video mask allowed: ${report.sam2FullVideoMaskAllowed}`,
    `Full-video text-behind-subject allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Mask output:',
    report.executionReport
      ? `- ${report.executionReport.masks.status}; masks=${report.executionReport.masks.maskUris.length}; overlays=${report.executionReport.masks.overlayUris.length}`
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

export function readSam2RuntimeExecutionReport(path: string): Sam2RuntimeExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as Sam2RuntimeExecutionReport
}

export function isSam2RuntimeExecutionVerified(report: Sam2RuntimeExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.projectId === sam2RuntimeConfig.projectId
      && report.model.modelId === sam2RuntimeConfig.modelId
      && report.model.checkpointSha256 === sam2RuntimeConfig.checkpointSha256
      && report.model.configSha256 === sam2RuntimeConfig.configSha256
      && report.model.aggregateSha256 === sam2RuntimeConfig.aggregateSha256
      && report.fixture.generated
      && report.fixture.frameCount === sam2RuntimeConfig.fixtureFrameCount
      && report.masks.status === 'completed'
      && report.masks.maskUris.length === sam2RuntimeConfig.fixtureFrameCount
      && report.qa.status !== 'blocked'
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.realMediaUsed === false
      && report.safety.realVideoInputUsed === false
      && report.safety.fullVideoMaskExecuted === false
      && report.safety.fullVideoTextBehindSubjectExecuted === false
      && report.safety.revideoUsed === false
      && report.safety.publicAccessEnabled === false,
  )
}
