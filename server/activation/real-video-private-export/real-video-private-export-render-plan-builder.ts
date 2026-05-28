import { phase30Prefix, realVideoPrivateExportConfig } from './real-video-private-export-policy'
import { resolvePhase30ApprovedArtifactUris } from './real-video-private-export-source-resolver'
import type { Phase30LoadedArtifacts } from './real-video-private-export-artifact-loader'
import type { RealVideoPrivateExportRenderPlan } from './real-video-private-export-types'

interface TimedRange {
  startSeconds: number
  endSeconds: number
  reason?: string
}

export function buildRealVideoPrivateExportRenderPlan(input: {
  runId: string
  loadedArtifacts?: Phase30LoadedArtifacts
}): RealVideoPrivateExportRenderPlan {
  const config = realVideoPrivateExportConfig
  const uris = resolvePhase30ApprovedArtifactUris()
  const smartCutPlan = input.loadedArtifacts?.smartCutPlan
  const timelineManifest = input.loadedArtifacts?.timelineManifest
  const keepSegments = readRanges(smartCutPlan?.keepSegments).length
    ? readRanges(smartCutPlan?.keepSegments)
    : [
        { startSeconds: 0, endSeconds: 12.64, reason: 'Phase 29 keep range before conservative removal.' },
        { startSeconds: 13.28, endSeconds: 16.083333, reason: 'Phase 29 keep range after conservative removal.' },
      ]
  const removeSegments = readRanges(smartCutPlan?.removeSegments)
  const timelineDurationSeconds = readNumber(timelineManifest?.durationSeconds)
    ?? readNumber(smartCutPlan?.targetDurationSeconds)
    ?? config.expectedTimelineDurationSeconds
  const outputObject = `${phase30Prefix(input.runId)}/final-export.mp4`

  return {
    planId: `phase30-private-export-${input.runId}`,
    sourcePhase28RunId: config.phase28RunId,
    sourcePhase29RunId: config.phase29RunId,
    sourceGcsUri: config.sourceGcsUri,
    timelineDurationSeconds,
    keepSegments,
    removeSegments,
    output: {
      container: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      pixelFormat: 'yuv420p',
      gcsUri: `gs://${config.finalExportsBucket}/${outputObject}`,
    },
    captionHandling: {
      mode: 'sidecar_only',
      reason: 'Caption burn-in is skipped because the first real-video private export has not yet validated a safe libass burn-in path.',
      sidecarRefs: [uris.phase28CaptionSegments, uris.phase28Srt, uris.phase28WebVtt, uris.phase28Ass],
    },
    safety: {
      privateExportOnly: true,
      sourceOverwriteAllowed: false,
      publicDeliveryAllowed: false,
      providerExecutionAllowed: false,
      gpuAllowed: false,
      modelDownloadAllowed: false,
    },
  }
}

function readRanges(value: unknown): TimedRange[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): TimedRange | undefined => {
      if (!item || typeof item !== 'object') return undefined
      const source = item as Record<string, unknown>
      const startSeconds = readNumber(source.startSeconds)
      const endSeconds = readNumber(source.endSeconds)
      if (startSeconds === undefined || endSeconds === undefined || endSeconds <= startSeconds) return undefined
      return {
        startSeconds,
        endSeconds,
        ...(typeof source.reason === 'string' ? { reason: source.reason } : {}),
      }
    })
    .filter((range): range is TimedRange => Boolean(range))
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
