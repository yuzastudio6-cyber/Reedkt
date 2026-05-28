import { existsSync, readFileSync } from 'node:fs'
import { realVideoSmartCutConfig, phase29DoesNotDo, validateRealVideoSmartCutRuntimeReport } from './real-video-smart-cut-policy'
import { resolvePhase28ArtifactUris } from './real-video-smart-cut-source-resolver'
import { REAL_VIDEO_SMART_CUT_LOCAL_REPORT_PATH } from './real-video-smart-cut-runner'
import type { RealVideoSmartCutReport, RealVideoSmartCutRuntimeReport } from './real-video-smart-cut-types'

export function buildRealVideoSmartCutReport(input: {
  reportPath?: string
} = {}): RealVideoSmartCutReport {
  const runtimeReport = readRuntimeReport(input.reportPath ?? REAL_VIDEO_SMART_CUT_LOCAL_REPORT_PATH)
  const blockers = validateRealVideoSmartCutRuntimeReport(runtimeReport)
  const ready = Boolean(runtimeReport) && blockers.length === 0 && runtimeReport?.qa.status !== 'blocked'
  return {
    reportId: 'activation-phase-29-real-video-smart-cut-caption',
    createdAt: new Date().toISOString(),
    config: realVideoSmartCutConfig,
    runtimeReport,
    status: runtimeReport ? (blockers.length === 0 ? 'ready' : 'blocked') : 'planned',
    blockers: runtimeReport ? blockers : ['Phase 29 execution has not run yet.'],
    warnings: runtimeReport
      ? runtimeReport.warnings
      : [
          'Phase 29 is metadata/timeline execution only by default; proxy preview is skipped unless a safe existing path is present.',
          ...phase29DoesNotDo,
        ],
    phase30Readiness: {
      readyForPrivatePreviewOrRenderPlanning: ready,
      reason: ready
        ? 'SmartCutPlan, TimelineManifest, caption refs, and QA exist privately with no blocking findings.'
        : 'Phase 30 remains blocked until Phase 29 produces private smart-cut/timeline artifacts and QA has no blockers.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeRealVideoSmartCutReport(report: RealVideoSmartCutReport): string {
  const runtime = report.runtimeReport
  const uris = resolvePhase28ArtifactUris()
  return [
    `Real video smart-cut report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 28 run: ${runtime?.sourcePhase28RunId ?? realVideoSmartCutConfig.phase28RunId}`,
    `Source object: ${runtime?.sourceVideoObject ?? uris.source}`,
    `Transcript segments: ${runtime?.transcriptSegmentCount ?? '(pending)'}`,
    `Word timestamps: ${runtime?.wordTimestampCount ?? '(pending)'}`,
    `Caption segments: ${runtime?.captionSegmentCount ?? '(pending)'}`,
    `Keep segments: ${runtime?.smartCut.keepSegmentCount ?? '(pending)'}`,
    `Remove segments: ${runtime?.smartCut.removeSegmentCount ?? '(pending)'}`,
    `Protected segments: ${runtime?.smartCut.protectedSegmentCount ?? '(pending)'}`,
    `Timeline duration seconds: ${runtime?.timeline.durationSeconds ?? '(pending)'}`,
    `Preview: ${runtime ? `${runtime.smartCut.previewStatus} (${runtime.smartCut.previewReason})` : 'planned skip'}`,
    `QA status: ${runtime?.qa.status ?? '(pending)'}`,
    `Phase 30 ready: ${report.phase30Readiness.readyForPrivatePreviewOrRenderPlanning}`,
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

function readRuntimeReport(path: string): RealVideoSmartCutRuntimeReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoSmartCutRuntimeReport
}
