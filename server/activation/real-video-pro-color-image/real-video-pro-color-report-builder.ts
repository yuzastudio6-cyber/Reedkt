import { existsSync, readFileSync } from 'node:fs'
import { getApprovedRealVideoProColorImageEvidence } from './approved-real-video-pro-color-image-evidence'
import { buildRealVideoProColorImageCommandPlans } from './real-video-pro-color-command-plan'
import { buildRealVideoProColorImageIamPlan } from './real-video-pro-color-iam-plan'
import { realVideoProColorImageConfig } from './real-video-pro-color-image-policy'
import { buildRealVideoProColorImageQaSummary } from './real-video-pro-color-qa-summary'
import { buildRealVideoProColorPlanSnapshot } from './real-video-pro-color-plan-snapshot'
import { buildRealVideoProColorSamplePlan } from './real-video-pro-color-sample-plan'
import { buildRealVideoProColorSourceSummary } from './real-video-pro-color-source-resolver'
import type { RealVideoProColorImageExecutionReport, RealVideoProColorImageReport } from './real-video-pro-color-image-types'

export const REAL_VIDEO_PRO_COLOR_IMAGE_LOCAL_REPORT_PATH = 'activation-logs/real-video-pro-color-image/phase40c/job-execution/phase40c-report.json'

export function buildRealVideoProColorImageReport(input: {
  executionReport?: RealVideoProColorImageExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): RealVideoProColorImageReport {
  const approvedEvidence = getApprovedRealVideoProColorImageEvidence()
  const executionReport = input.executionReport ?? readRealVideoProColorImageExecutionReport(input.reportPath ?? REAL_VIDEO_PRO_COLOR_IMAGE_LOCAL_REPORT_PATH)
  const qaSummary = buildRealVideoProColorImageQaSummary(executionReport)
  const approvedEvidenceOnly = approvedEvidence.status !== 'not_run' && !executionReport
  const qaBlockers = approvedEvidenceOnly ? [] : qaSummary.blockers
  const qaWarnings = approvedEvidenceOnly ? [] : qaSummary.warnings
  const approvedEvidenceBlockers = executionReport ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([...qaBlockers, ...approvedEvidenceBlockers]))
  const warnings = Array.from(new Set([...qaWarnings, ...approvedEvidence.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-40c-real-video-pro-color-image',
    createdAt: new Date().toISOString(),
    config: realVideoProColorImageConfig,
    sourceSummary: buildRealVideoProColorSourceSummary(),
    samplePlan: buildRealVideoProColorSamplePlan(),
    planSnapshot: buildRealVideoProColorPlanSnapshot(input.runId ?? approvedEvidence.runId),
    iamPlan: buildRealVideoProColorImageIamPlan(),
    commandPlans: buildRealVideoProColorImageCommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    realVideoProColorSampleCompleted: ready || approvedEvidence.status === 'verified',
    phase40DReadiness: {
      readyForProColorImagePrivateFeatureE2EReadinessGate: ready || approvedEvidence.phase40DReadiness.readyForProColorImagePrivateFeatureE2EReadinessGate,
      reason: executionReport && ready ? qaSummary.reason : approvedEvidence.phase40DReadiness.reason,
    },
    fullVideoProcessingAllowed: false,
    full4KProcessingAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeRealVideoProColorImageReport(report: RealVideoProColorImageReport): string {
  const toolLines = report.executionReport
    ? report.executionReport.tools.map((tool) => `- ${tool.toolId}: ${tool.status}; operation=${tool.operation}`)
    : Object.entries(report.approvedEvidence.toolResults).map(([toolId, status]) => `- ${toolId}: ${status}`)
  const executionReportStatus = report.executionReport
    ? 'present'
    : report.approvedEvidence.status === 'verified'
      ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}`
      : 'missing'
  return [
    `Real-video pro color/image report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Runtime mode: ${report.config.runtimeMode}`,
    `Source: ${report.config.approvedInputVideoGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${executionReportStatus}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `Real-video sample completed: ${report.realVideoProColorSampleCompleted}`,
    `Phase 40D ready: ${report.phase40DReadiness.readyForProColorImagePrivateFeatureE2EReadinessGate}`,
    `Full-video processing allowed: ${report.fullVideoProcessingAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Tool results:',
    ...toolLines,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRealVideoProColorImageExecutionReport(path: string): RealVideoProColorImageExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoProColorImageExecutionReport
}

export function isRealVideoProColorImageExecutionVerified(report: RealVideoProColorImageExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.phase === '40C'
      && report.projectId === realVideoProColorImageConfig.projectId
      && report.runtimeMode === realVideoProColorImageConfig.runtimeMode
      && report.compute.mode === 'cpu'
      && report.compute.gpuRequested === false
      && report.source.inputVideoGcsUri === realVideoProColorImageConfig.approvedInputVideoGcsUri
      && report.sample.frameCount <= realVideoProColorImageConfig.maxFrameCount
      && report.sample.width <= realVideoProColorImageConfig.maxFrameWidth
      && report.sample.height <= realVideoProColorImageConfig.maxFrameHeight
      && report.tools.every((tool) => tool.status === 'passed')
      && report.qa.status === 'passed'
      && report.safety.approvedSourceOnly
      && report.safety.arbitraryMediaUsed === false
      && report.safety.fullVideoProcessed === false
      && report.safety.full4KFramesProcessed === false
      && report.safety.finalDeliveryCreated === false
      && report.safety.providerExecuted === false
      && report.safety.revideoUsed === false
      && report.safety.publicAccessEnabled === false
      && report.safety.productionReadyAllowed === false
      && report.safety.externalBetaAllowed === false
      && report.safety.broadRealUserMediaAllowed === false,
  )
}
