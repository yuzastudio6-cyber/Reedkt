import { existsSync, readFileSync } from 'node:fs'
import { realVideoAudioCleanupConfig, phase31DoesNotDo, validateRealVideoAudioCleanupRuntimeReport } from './real-video-audio-cleanup-policy'
import { buildRealVideoAudioCleanupPlan } from './real-video-audio-normalization-runner'
import { resolvePhase31ApprovedArtifactUris } from './real-video-audio-source-resolver'
import { REAL_VIDEO_AUDIO_CLEANUP_LOCAL_REPORT_PATH } from './real-video-audio-cleanup-runner'
import type { RealVideoAudioCleanupReport, RealVideoAudioCleanupRuntimeReport } from './real-video-audio-cleanup-types'

export function buildRealVideoAudioCleanupReport(input: { reportPath?: string } = {}): RealVideoAudioCleanupReport {
  const runtimeReport = readRuntimeReport(input.reportPath ?? REAL_VIDEO_AUDIO_CLEANUP_LOCAL_REPORT_PATH)
  const blockers = validateRealVideoAudioCleanupRuntimeReport(runtimeReport)
  const ready = Boolean(runtimeReport) && blockers.length === 0 && runtimeReport?.qa.status !== 'blocked'
  return {
    reportId: 'activation-phase-31-real-video-audio-cleanup',
    createdAt: new Date().toISOString(),
    config: realVideoAudioCleanupConfig,
    runtimeReport,
    status: runtimeReport ? (blockers.length === 0 ? 'ready' : 'blocked') : 'planned',
    blockers: runtimeReport ? blockers : ['Phase 31 audio cleanup has not run yet.'],
    warnings: runtimeReport
      ? runtimeReport.warnings
      : [
          'Phase 31 is limited to FFmpeg loudness measurement and normalization only.',
          ...phase31DoesNotDo,
        ],
    phase32Readiness: {
      readyForControlledReview: ready,
      reason: ready
        ? 'Private audio-normalized export exists, audio QA has no blocking findings, and all launch gates remain blocked.'
        : 'Phase 32 remains blocked until Phase 31 creates a private normalized export and audio QA has no blockers.',
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeRealVideoAudioCleanupReport(report: RealVideoAudioCleanupReport): string {
  const runtime = report.runtimeReport
  const uris = resolvePhase31ApprovedArtifactUris(runtime?.runId ?? 'phase31-planned')
  const plan = buildRealVideoAudioCleanupPlan({ runId: runtime?.runId ?? 'phase31-planned' })
  return [
    `Real video audio cleanup report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 30 run: ${runtime?.sourcePhase30RunId ?? realVideoAudioCleanupConfig.phase30RunId}`,
    `Input final export: ${runtime?.inputFinalExportObject ?? uris.input}`,
    `Target loudness: ${plan.targets.integratedLufs} LUFS`,
    `Loudness before: ${format(runtime?.loudnessBefore?.integratedLufs)} LUFS`,
    `Loudness after: ${format(runtime?.loudnessAfter?.integratedLufs)} LUFS`,
    `True peak after: ${format(runtime?.loudnessAfter?.truePeakDbtp)} dBTP`,
    `Normalized audio: ${runtime?.normalizedAudio?.gcsUri ?? uris.normalizedAudio}`,
    `Normalized export: ${runtime?.normalizedExport?.gcsUri ?? uris.normalizedExport}`,
    `QA status: ${runtime?.qa.status ?? '(pending)'}`,
    `Phase 32 ready: ${report.phase32Readiness.readyForControlledReview}`,
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

function readRuntimeReport(path: string): RealVideoAudioCleanupRuntimeReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoAudioCleanupRuntimeReport
}

function format(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'unknown' : value.toFixed(2)
}
