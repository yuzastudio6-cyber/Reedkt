import { existsSync, readFileSync } from 'node:fs'
import { phase32DoesNotDo, realVideoColorCorrectionConfig, validateRealVideoColorRuntimeReport } from './real-video-color-correction-policy'
import { buildRealVideoColorCorrectionPlan } from './real-video-color-plan-builder'
import { resolvePhase32ApprovedArtifactUris } from './real-video-color-source-resolver'
import { REAL_VIDEO_COLOR_CORRECTION_LOCAL_REPORT_PATH } from './real-video-color-correction-runner'
import type { RealVideoColorCorrectionReport, RealVideoColorRuntimeReport } from './real-video-color-correction-types'

export function buildRealVideoColorCorrectionReport(input: { reportPath?: string } = {}): RealVideoColorCorrectionReport {
  const runtimeReport = readRuntimeReport(input.reportPath ?? REAL_VIDEO_COLOR_CORRECTION_LOCAL_REPORT_PATH)
  const blockers = validateRealVideoColorRuntimeReport(runtimeReport)
  const ready = Boolean(runtimeReport) && blockers.length === 0 && runtimeReport?.qa.status !== 'blocked'
  return {
    reportId: 'activation-phase-32-real-video-color-correction',
    createdAt: new Date().toISOString(),
    config: realVideoColorCorrectionConfig,
    runtimeReport,
    status: runtimeReport ? (blockers.length === 0 ? 'ready' : 'blocked') : 'planned',
    blockers: runtimeReport ? blockers : ['Phase 32 color correction has not run yet.'],
    warnings: runtimeReport
      ? runtimeReport.warnings
      : [
          'Phase 32 is limited to FFmpeg-only clean/no-op/minimal color correction.',
          ...phase32DoesNotDo,
        ],
    phase33Readiness: {
      readyForControlledReview: ready,
      reason: ready
        ? 'Private color-corrected export exists, color QA has no blocking findings, and all launch gates remain blocked.'
        : 'Phase 33 remains blocked until Phase 32 creates a private color-corrected export and color QA has no blockers.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeRealVideoColorCorrectionReport(report: RealVideoColorCorrectionReport): string {
  const runtime = report.runtimeReport
  const uris = resolvePhase32ApprovedArtifactUris(runtime?.runId ?? 'phase32-planned')
  const plan = buildRealVideoColorCorrectionPlan({ runId: runtime?.runId ?? 'phase32-planned' })
  return [
    `Real video color correction report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 31 run: ${runtime?.sourcePhase31RunId ?? realVideoColorCorrectionConfig.phase31RunId}`,
    `Input export: ${runtime?.inputColorSourceObject ?? uris.input}`,
    `Correction decision: ${runtime?.colorGradeRecipe.decision ?? '(pending)'}`,
    `Correction filter: ${runtime?.colorGradeRecipe.ffmpegFilter ?? 'none'}`,
    `Sampled frames: ${runtime?.colorAnalysis.sampledFrameCount ?? '(pending)'}`,
    `Color export: ${runtime?.colorCorrectedExport?.gcsUri ?? plan.output.colorCorrectedExportGcsUri}`,
    `QA status: ${runtime?.qa.status ?? '(pending)'}`,
    `Phase 33 ready: ${report.phase33Readiness.readyForControlledReview}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Artifacts:',
    ...(runtime?.artifacts.length ? runtime.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- pending']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

function readRuntimeReport(path: string): RealVideoColorRuntimeReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoColorRuntimeReport
}
