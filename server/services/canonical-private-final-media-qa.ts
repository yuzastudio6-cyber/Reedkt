import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from './private-edit-authority-store'

export interface CanonicalPrivateFinalMediaExpectation {
  width: number
  height: number
  fps: number
  durationFrames: number
}

export interface CanonicalPrivateFinalMediaQa {
  independentFfprobeExecuted: true
  binaryVersion: '8.1.2'
  videoCodecName: 'h264'
  pixelFormat: 'yuv420p'
  colorSpace: 'bt709'
  width: number
  height: number
  fps: number
  frameCount: number
  audioCodecName: 'aac'
  audioSampleRate: 48_000
  audioChannels: number
  approvedDurationSeconds: number
  actualDurationSeconds: number
  maximumDurationDriftFrames: 2
  durationDriftFrames: number
  finalQaGatesPassed: true
  reportSha256: string
}

export function normalizeCanonicalPrivateFinalMediaQa(
  document: Readonly<Record<string, unknown>>,
  expected: CanonicalPrivateFinalMediaExpectation,
): CanonicalPrivateFinalMediaQa {
  const streams = Array.isArray(document.streams)
    ? document.streams as Array<Record<string, unknown>>
    : []
  const video = streams.find((stream) => stream.codecType === 'video')
  const audio = streams.find((stream) => stream.codecType === 'audio')
  const approvedDurationSeconds = Number((expected.durationFrames / expected.fps).toFixed(6))
  const actualDurationSeconds = Number(document.durationSeconds)
  const durationDriftFrames = Math.max(
    0,
    Math.ceil((actualDurationSeconds - approvedDurationSeconds) * expected.fps - 0.000_001),
  )
  const report = {
    videoCodecName: video?.codecName,
    pixelFormat: video?.pixelFormat,
    colorSpace: video?.colorSpace,
    colorTransfer: video?.colorTransfer,
    colorPrimaries: video?.colorPrimaries,
    colorRange: video?.colorRange,
    width: video?.width,
    height: video?.height,
    fps: video?.fps,
    frameCount: video?.readFrameCount,
    audioCodecName: audio?.codecName,
    audioSampleRate: audio?.sampleRate,
    audioChannels: audio?.channels,
    approvedDurationSeconds,
    actualDurationSeconds,
    maximumDurationDriftFrames: 2,
    durationDriftFrames,
  }
  if (
    report.videoCodecName !== 'h264' || report.pixelFormat !== 'yuv420p' ||
    report.colorSpace !== 'bt709' || report.colorTransfer !== 'bt709' ||
    report.colorPrimaries !== 'bt709' || report.colorRange !== 'tv' ||
    report.width !== expected.width || report.height !== expected.height ||
    report.fps !== expected.fps || report.frameCount !== expected.durationFrames ||
    report.audioCodecName !== 'aac' || report.audioSampleRate !== 48_000 ||
    !Number.isSafeInteger(report.audioChannels) || Number(report.audioChannels) < 1 ||
    Number(report.audioChannels) > 2 || !Number.isFinite(actualDurationSeconds) ||
    actualDurationSeconds < approvedDurationSeconds || durationDriftFrames > 2
  ) throw finalQaDenied(report, expected)
  const normalized = {
    independentFfprobeExecuted: true as const,
    binaryVersion: '8.1.2' as const,
    videoCodecName: 'h264' as const,
    pixelFormat: 'yuv420p' as const,
    colorSpace: 'bt709' as const,
    width: Number(report.width),
    height: Number(report.height),
    fps: Number(report.fps),
    frameCount: Number(report.frameCount),
    audioCodecName: 'aac' as const,
    audioSampleRate: 48_000 as const,
    audioChannels: Number(report.audioChannels),
    approvedDurationSeconds,
    actualDurationSeconds,
    maximumDurationDriftFrames: 2 as const,
    durationDriftFrames,
    finalQaGatesPassed: true as const,
  }
  return { ...normalized, reportSha256: sha256AuthorityValue(report) }
}

function finalQaDenied(
  report: Readonly<Record<string, unknown>>,
  expected: CanonicalPrivateFinalMediaExpectation,
): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Independent FFprobe final QA does not match approved video, audio, frame, and duration policy.',
    409,
    {
      requiredGate: 'canonical_private_final_media_qa',
      expected: {
        width: expected.width,
        height: expected.height,
        fps: expected.fps,
        durationFrames: expected.durationFrames,
      },
      actual: report,
    },
  )
}
