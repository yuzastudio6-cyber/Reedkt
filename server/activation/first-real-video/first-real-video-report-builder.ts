import { existsSync, readFileSync } from 'node:fs'
import { buildFirstRealVideoCaptionPlan } from './first-real-video-caption-runner'
import { buildFirstRealVideoMediaPlan } from './first-real-video-media-runner'
import { firstRealVideoConfig, validateFirstRealVideoRuntimeReport } from './first-real-video-policy'
import { buildFirstRealVideoSpeechPlan } from './first-real-video-speech-runner'
import { validateFirstRealVideoSource } from './first-real-video-source-validator'
import { FIRST_REAL_VIDEO_LATEST_RUN_PATH } from './first-real-video-storage-uploader'
import type { FirstRealVideoReport, FirstRealVideoRuntimeReport, FirstRealVideoUploadResult } from './first-real-video-types'

export const FIRST_REAL_VIDEO_LOCAL_REPORT_PATH = 'activation-logs/first-real-video/phase28/phase28-report.json'

export function buildFirstRealVideoReport(input: {
  reportPath?: string
  uploadPath?: string
} = {}): FirstRealVideoReport {
  const runtimeReport = readRuntimeReport(input.reportPath ?? FIRST_REAL_VIDEO_LOCAL_REPORT_PATH)
  const upload = readUpload(input.uploadPath ?? FIRST_REAL_VIDEO_LATEST_RUN_PATH)
  const sourceValidation = validateFirstRealVideoSource({ sourceVideoPath: firstRealVideoConfig.sourceVideoPath })
  const runtimeBlockers = validateFirstRealVideoRuntimeReport(runtimeReport)
  const blockers = runtimeReport ? runtimeBlockers : sourceValidation.blockers
  const phase29Ready = runtimeReport
    && blockers.length === 0
    && runtimeReport.speechRuntime.status === 'completed'
    && runtimeReport.captions.captionSegmentCount > 0
    && runtimeReport.qa.status !== 'blocked'

  return {
    reportId: 'activation-phase-28-first-real-video-speech-caption',
    createdAt: new Date().toISOString(),
    config: firstRealVideoConfig,
    upload,
    runtimeReport,
    sourceValidation,
    status: runtimeReport ? (blockers.length === 0 ? 'ready' : 'failed') : 'planned',
    blockers: Array.from(new Set(blockers)),
    warnings: runtimeReport
      ? runtimeReport.warnings
      : [
          ...sourceValidation.warnings,
          ...buildFirstRealVideoMediaPlan(),
          ...buildFirstRealVideoSpeechPlan(),
          ...buildFirstRealVideoCaptionPlan(),
        ],
    phase29Readiness: {
      readyForSmartCutCaptionPlanning: Boolean(phase29Ready),
      reason: phase29Ready
        ? 'Phase 28 transcript, captions, private artifacts, and caption QA passed without blocking findings.'
        : 'Phase 29 remains blocked until Phase 28 runtime transcript/caption evidence passes with no caption QA blockers.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeFirstRealVideoReport(report: FirstRealVideoReport): string {
  const runtime = report.runtimeReport
  return [
    `First real video report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source: ${runtime?.source.sourceGcsUri ?? report.upload?.sourceGcsUri ?? report.config.sourceVideoPath}`,
    `Duration seconds: ${runtime?.source.durationSeconds ?? '(pending)'}`,
    `Resolution: ${runtime?.source.width && runtime.source.height ? `${runtime.source.width}x${runtime.source.height}` : '(pending)'}`,
    `Audio present: ${runtime?.source.hasAudio ?? '(pending)'}`,
    `Model: ${runtime?.model.manifestId ?? report.config.modelManifestId}`,
    `Transcript segments: ${runtime?.speechRuntime.transcriptSegmentCount ?? 0}`,
    `Word timestamps: ${runtime?.speechRuntime.wordTimestampCount ?? 0}`,
    `Caption segments: ${runtime?.captions.captionSegmentCount ?? 0}`,
    `QA status: ${runtime?.qa.status ?? '(pending)'}`,
    `Phase 29 ready: ${report.phase29Readiness.readyForSmartCutCaptionPlanning}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

function readRuntimeReport(path: string): FirstRealVideoRuntimeReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as FirstRealVideoRuntimeReport
}

function readUpload(path: string): FirstRealVideoUploadResult | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as FirstRealVideoUploadResult
}
