import { existsSync, readFileSync } from 'node:fs'
import { phase30DoesNotDo, realVideoPrivateExportConfig, validateRealVideoPrivateExportRuntimeReport } from './real-video-private-export-policy'
import { buildRealVideoPrivateExportRenderPlan } from './real-video-private-export-render-plan-builder'
import { resolvePhase30ApprovedArtifactUris } from './real-video-private-export-source-resolver'
import { REAL_VIDEO_PRIVATE_EXPORT_LOCAL_REPORT_PATH } from './real-video-private-export-runner'
import type { RealVideoPrivateExportReport, RealVideoPrivateExportRuntimeReport } from './real-video-private-export-types'

export function buildRealVideoPrivateExportReport(input: {
  reportPath?: string
} = {}): RealVideoPrivateExportReport {
  const runtimeReport = readRuntimeReport(input.reportPath ?? REAL_VIDEO_PRIVATE_EXPORT_LOCAL_REPORT_PATH)
  const blockers = validateRealVideoPrivateExportRuntimeReport(runtimeReport)
  const ready = Boolean(runtimeReport) && blockers.length === 0 && runtimeReport?.qa.status !== 'blocked'
  return {
    reportId: 'activation-phase-30-real-video-private-export',
    createdAt: new Date().toISOString(),
    config: realVideoPrivateExportConfig,
    runtimeReport,
    status: runtimeReport ? (blockers.length === 0 ? 'ready' : 'blocked') : 'planned',
    blockers: runtimeReport ? blockers : ['Phase 30 private export has not run yet.'],
    warnings: runtimeReport
      ? runtimeReport.warnings
      : [
          'Phase 30 defaults to caption sidecars; caption burn-in remains skipped until the real-video libass path is validated.',
          ...phase30DoesNotDo,
        ],
    phase31Readiness: {
      readyForPrivateReview: ready,
      reason: ready
        ? 'Private final_export exists, export QA has no blocking findings, and all launch gates remain blocked.'
        : 'Phase 31 remains blocked until Phase 30 creates a private final export and export QA has no blockers.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeRealVideoPrivateExportReport(report: RealVideoPrivateExportReport): string {
  const runtime = report.runtimeReport
  const uris = resolvePhase30ApprovedArtifactUris()
  const plan = buildRealVideoPrivateExportRenderPlan({ runId: runtime?.runId ?? 'phase30-planned' })
  return [
    `Real video private export report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 28 run: ${runtime?.sourcePhase28RunId ?? realVideoPrivateExportConfig.phase28RunId}`,
    `Source Phase 29 run: ${runtime?.sourcePhase29RunId ?? realVideoPrivateExportConfig.phase29RunId}`,
    `Source object: ${runtime?.sourceVideoObject ?? uris.source}`,
    `Timeline duration seconds: ${runtime?.timelineDurationSeconds ?? plan.timelineDurationSeconds}`,
    `Keep segments: ${runtime?.keepSegmentCount ?? plan.keepSegments.length}`,
    `Remove segments: ${runtime?.removeSegmentCount ?? plan.removeSegments.length}`,
    `Caption handling: ${runtime?.captionHandling ?? plan.captionHandling.mode}`,
    `Final export: ${runtime?.finalExport?.gcsUri ?? '(pending)'}`,
    `QA status: ${runtime?.qa.status ?? '(pending)'}`,
    `Phase 31 ready: ${report.phase31Readiness.readyForPrivateReview}`,
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

function readRuntimeReport(path: string): RealVideoPrivateExportRuntimeReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoPrivateExportRuntimeReport
}
