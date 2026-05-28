import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import { realVideoAudioCleanupConfig } from './real-video-audio-cleanup-policy'
import type { RealVideoAudioCleanupRuntimeReport } from './real-video-audio-cleanup-types'

export function buildPhase31AudioQaSummary(input: {
  normalizedExportExists: boolean
  inputDurationSeconds?: number
  outputDurationSeconds?: number
  outputHasAudio?: boolean
  outputVideoCodec?: string
  outputAudioCodec?: string
  loudnessBefore?: number
  loudnessAfter?: number
  truePeakAfter?: number
}): RealVideoAudioCleanupRuntimeReport['qa'] {
  const config = realVideoAudioCleanupConfig
  const durationDelta = input.inputDurationSeconds === undefined || input.outputDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.outputDurationSeconds - input.inputDurationSeconds)
  const loudnessDelta = input.loudnessAfter === undefined ? Number.POSITIVE_INFINITY : Math.abs(input.loudnessAfter - config.targetIntegratedLufs)
  const truePeak = input.truePeakAfter ?? Number.POSITIVE_INFINITY
  const gates: QualityGateResult[] = [
    gate('audio_loudness', loudnessDelta <= 1.5 && truePeak <= -0.1, `Normalized audio measured ${format(input.loudnessAfter)} LUFS with true peak ${format(input.truePeakAfter)} dBTP.`),
    gate('audio_sync', Boolean(input.outputHasAudio) && durationDelta <= 0.75, `Output duration delta ${durationDelta.toFixed(3)}s remains within tolerance.`),
    warnGate('audio_naturalness', 'Phase 31 uses deterministic FFmpeg loudness only; perceptual listening QA remains manual/future.'),
    warnGate('music_over_voice', 'No music-over-voice classifier ran; Phase 31 records this as warning-only.'),
    gate('export_codec_format', input.outputVideoCodec === 'h264' && input.outputAudioCodec === 'aac', 'Private normalized export uses H.264/AAC MP4.'),
    gate('export_duration_sync', durationDelta <= 0.75, `Export duration is close to the Phase 30B duration (${durationDelta.toFixed(3)}s delta).`),
  ]
  const blockersBeforeFinal = gates.filter((item) => item.blocking)
  gates.push(gate(
    'final_delivery',
    input.normalizedExportExists && blockersBeforeFinal.length === 0,
    'Private Phase 31 audio-normalized final delivery exists with no blocking audio QA findings.',
  ))
  const blockers = gates
    .filter((item) => item.blocking)
    .flatMap((item) => item.issues.length ? item.issues.map((issue) => `${item.gateType}: ${issue.message}`) : [`${item.gateType}: blocking gate`])
  const warnings = gates
    .filter((item) => item.status === 'warning')
    .flatMap((item) => item.issues.length ? item.issues.map((issue) => `${item.gateType}: ${issue.message}`) : [`${item.gateType}: warning`])
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateType: QualityGateResult['gateType'], passed: boolean, message: string): QualityGateResult {
  return {
    id: `phase31-gate-${gateType}`,
    workspaceId: 'activation-phase31',
    projectId: 'reeditpro',
    mediaAssetId: 'phase30-20260528T12421-final-export',
    toolExecutionPlanId: 'activation-phase31-audio-cleanup',
    recipeId: gateType === 'final_delivery' ? 'private_audio_normalized_export' : 'ffmpeg_loudness_normalization',
    gateType,
    status: passed ? 'passed' : 'blocked',
    score: passed ? 0.95 : 0.2,
    threshold: 0.8,
    required: true,
    blocking: !passed,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: gateType === 'final_delivery' ? 'qa_worker' : 'render_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: passed ? [] : [{ code: `${gateType}_failed`, message, severity: 'blocking' }],
    recommendations: [{ action: passed ? 'continue' : 'block_final_export', reason: message, priority: passed ? 'low' : 'urgent' }],
    fallbackRequired: !passed,
    blocksPreview: false,
    blocksFinalExport: !passed,
    humanReviewRequired: false,
  }
}

function warnGate(gateType: QualityGateResult['gateType'], message: string): QualityGateResult {
  return {
    ...gate(gateType, true, message),
    status: 'warning',
    score: 0.78,
    issues: [{ code: `${gateType}_warning`, message, severity: 'warning' }],
    recommendations: [{ action: 'continue', reason: message, priority: 'normal' }],
    humanReviewRequired: true,
  }
}

function format(value: number | undefined): string {
  return value === undefined || !Number.isFinite(value) ? 'unknown' : value.toFixed(2)
}
