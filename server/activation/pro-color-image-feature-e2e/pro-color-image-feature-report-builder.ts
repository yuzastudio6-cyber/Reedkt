import { existsSync, readFileSync } from 'node:fs'
import { getApprovedProColorImageFeatureE2EEvidence } from './approved-pro-color-image-feature-e2e-evidence'
import { buildProColorImageFeatureE2ECommandPlans } from './pro-color-image-feature-command-plan'
import { buildProColorImageFeatureE2EIamPlan } from './pro-color-image-feature-iam-plan'
import { proColorImageFeatureE2EConfig } from './pro-color-image-feature-e2e-policy'
import { buildProColorImageFeatureE2EQaSummary } from './pro-color-image-feature-qa-summary'
import { buildProColorImageFeaturePlanSnapshot } from './pro-color-image-feature-plan-snapshot'
import { buildProColorImageFeatureSamplePlan } from './pro-color-image-feature-sample-plan'
import { buildProColorImageFeatureSourceSummary } from './pro-color-image-feature-source-resolver'
import type { ProColorImageFeatureE2EExecutionReport, ProColorImageFeatureE2EReport } from './pro-color-image-feature-e2e-types'

export const PRO_COLOR_IMAGE_FEATURE_E2E_LOCAL_REPORT_PATH = 'activation-logs/pro-color-image-feature-e2e/phase40d/job-execution/phase40d-report.json'

export function buildProColorImageFeatureE2EReport(input: {
  executionReport?: ProColorImageFeatureE2EExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): ProColorImageFeatureE2EReport {
  const approvedEvidence = getApprovedProColorImageFeatureE2EEvidence()
  const executionReport = input.executionReport ?? readProColorImageFeatureE2EExecutionReport(input.reportPath ?? PRO_COLOR_IMAGE_FEATURE_E2E_LOCAL_REPORT_PATH)
  const qaSummary = buildProColorImageFeatureE2EQaSummary(executionReport)
  const approvedEvidenceOnly = approvedEvidence.status !== 'not_run' && !executionReport
  const qaBlockers = approvedEvidenceOnly ? [] : qaSummary.blockers
  const qaWarnings = approvedEvidenceOnly ? [] : qaSummary.warnings
  const approvedEvidenceBlockers = executionReport ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([...qaBlockers, ...approvedEvidenceBlockers]))
  const warnings = Array.from(new Set([...qaWarnings, ...approvedEvidence.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-40d-pro-color-image-feature-e2e',
    createdAt: new Date().toISOString(),
    config: proColorImageFeatureE2EConfig,
    sourceSummary: buildProColorImageFeatureSourceSummary(),
    samplePlan: buildProColorImageFeatureSamplePlan(),
    planSnapshot: buildProColorImageFeaturePlanSnapshot(input.runId ?? approvedEvidence.runId),
    iamPlan: buildProColorImageFeatureE2EIamPlan(),
    commandPlans: buildProColorImageFeatureE2ECommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    proColorImageFeatureE2ECompleted: ready || approvedEvidence.status === 'verified',
    featureReadiness: {
      readyForInternalProColorImageFeatureTesting: ready || approvedEvidence.featureReadiness.readyForInternalProColorImageFeatureTesting,
      reason: executionReport && ready ? qaSummary.reason : approvedEvidence.featureReadiness.reason,
    },
    phase45AReadiness: {
      readyForLibassCaptionBurnInValidation: ready || approvedEvidence.phase45AReadiness.readyForLibassCaptionBurnInValidation,
      reason: executionReport && ready ? 'Phase 40D passed; Phase 45A may start libass caption burn-in validation only.' : approvedEvidence.phase45AReadiness.reason,
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

export function summarizeProColorImageFeatureE2EReport(report: ProColorImageFeatureE2EReport): string {
  const toolLines = report.executionReport
    ? report.executionReport.tools.map((tool) => `- ${tool.toolId}: ${tool.status}; operation=${tool.operation}`)
    : Object.entries(report.approvedEvidence.toolResults).map(([toolId, status]) => `- ${toolId}: ${status}`)
  const executionReportStatus = report.executionReport
    ? 'present'
    : report.approvedEvidence.status === 'verified'
      ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}`
      : 'missing'
  return [
    `Pro color/image feature E2E report: ${report.reportId}`,
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
    `Feature E2E completed: ${report.proColorImageFeatureE2ECompleted}`,
    `Internal feature testing ready: ${report.featureReadiness.readyForInternalProColorImageFeatureTesting}`,
    `Phase 45A ready: ${report.phase45AReadiness.readyForLibassCaptionBurnInValidation}`,
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

export function readProColorImageFeatureE2EExecutionReport(path: string): ProColorImageFeatureE2EExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as ProColorImageFeatureE2EExecutionReport
}

export function isProColorImageFeatureE2EExecutionVerified(report: ProColorImageFeatureE2EExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.phase === '40D'
      && report.projectId === proColorImageFeatureE2EConfig.projectId
      && report.runtimeMode === proColorImageFeatureE2EConfig.runtimeMode
      && report.compute.mode === 'cpu'
      && report.compute.gpuRequested === false
      && report.source.inputVideoGcsUri === proColorImageFeatureE2EConfig.approvedInputVideoGcsUri
      && report.sample.frameCount <= proColorImageFeatureE2EConfig.maxFrameCount
      && report.sample.width <= proColorImageFeatureE2EConfig.maxFrameWidth
      && report.sample.height <= proColorImageFeatureE2EConfig.maxFrameHeight
      && report.tools.every((tool) => tool.status === 'passed')
      && report.qa.status === 'passed'
      && report.planSnapshot.approvedPlanSnapshot === true
      && report.planSnapshot.rawPromptExecution === false
      && Boolean(report.reviewArtifacts.reviewManifestUri)
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
