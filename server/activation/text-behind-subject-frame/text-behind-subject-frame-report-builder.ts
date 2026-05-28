import { existsSync, readFileSync } from 'node:fs'
import { buildStaticDepthCompositionFrameManifest } from './depth-composition-frame-manifest-builder'
import { buildTextBehindSubjectFrameCommandPlans } from './text-behind-subject-frame-renderer'
import { textBehindSubjectFrameConfig, validateTextBehindSubjectFrameReport } from './text-behind-subject-frame-policy'
import { buildStaticTextLayerFramePlan } from './text-layer-frame-plan-builder'
import type { TextBehindSubjectFrameExecutionReport, TextBehindSubjectFrameReport } from './text-behind-subject-frame-types'

export const PHASE33E_LOCAL_REPORT_PATH = 'activation-logs/text-behind-subject-frame/phase33e/phase33e-report.json'

export function buildTextBehindSubjectFrameReport(input: {
  executionReport?: TextBehindSubjectFrameExecutionReport
  reportPath?: string
  runId?: string
  renderImageDigest?: string
} = {}): TextBehindSubjectFrameReport {
  const executionReport = input.executionReport ?? readTextBehindSubjectFrameExecutionReport(input.reportPath ?? PHASE33E_LOCAL_REPORT_PATH)
  const runId = input.runId ?? executionReport?.runId ?? 'phase33e-pending'
  const blockers = validateTextBehindSubjectFrameReport(executionReport)
  const warnings = Array.from(new Set([
    ...(executionReport?.warnings ?? []),
    'Phase 33E is single-frame preview only; full-video text-behind-subject remains blocked.',
    'Production, external beta, broad real media, providers, GPU, model downloads, public URLs, and Revideo remain blocked.',
  ]))
  const ready = Boolean(executionReport) && blockers.length === 0
  return {
    reportId: 'activation-phase-33e-text-behind-subject-frame-preview',
    createdAt: new Date().toISOString(),
    config: textBehindSubjectFrameConfig,
    commandPlans: buildTextBehindSubjectFrameCommandPlans(runId, input.renderImageDigest),
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    phase34Readiness: {
      ready,
      reason: ready
        ? 'The approved Phase 33D frame/mask/cutout set produced a private text-behind-subject preview PNG, depth composition manifest, and QA with no blocking failures.'
        : 'Phase 34 remains blocked until the private Phase 33E preview PNG, depth manifest, and non-blocking QA exist.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
  }
}

export function summarizeTextBehindSubjectFrameReport(report: TextBehindSubjectFrameReport): string {
  const depthManifest = report.executionReport?.artifacts.find((artifact) => artifact.object.endsWith('/manifests/depth-composition-manifest.json'))?.gcsUri
  return [
    `Text-behind-subject frame preview report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 33D run: ${report.config.phase33dRunId}`,
    `Frame: ${report.config.representativeFrameGcsUri}`,
    `Mask: ${report.config.maskGcsUri}`,
    `Cutout: ${report.config.cutoutGcsUri}`,
    `Text: ${report.config.approvedText}`,
    `Preview: ${report.executionReport?.preview.gcsUri ?? '(pending)'}`,
    `Depth manifest: ${depthManifest ?? '(pending)'}`,
    `Blockers: ${report.blockers.length}`,
    `Phase 34 ready: ${report.phase34Readiness.ready}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Full-video text-behind-subject allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function buildStaticTextBehindSubjectFramePreviewPlan() {
  return {
    textLayerPlan: buildStaticTextLayerFramePlan(),
    depthCompositionManifest: buildStaticDepthCompositionFrameManifest(),
    config: textBehindSubjectFrameConfig,
  }
}

export function readTextBehindSubjectFrameExecutionReport(path: string): TextBehindSubjectFrameExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as TextBehindSubjectFrameExecutionReport
}
