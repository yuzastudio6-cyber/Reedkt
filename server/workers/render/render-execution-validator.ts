import { existsSync } from 'node:fs'
import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { FinalRenderExecutionInput, RenderExecutionManifest, RenderExecutionValidationResult } from './render-execution-types'

const ALLOWED_CONTAINERS = new Set(['mp4'])
const ALLOWED_VIDEO_CODECS = new Set(['h264', 'libx264'])
const ALLOWED_AUDIO_CODECS = new Set(['aac'])
const ALLOWED_PIXEL_FORMATS = new Set(['yuv420p'])

export function validateRenderExecutionInput(input: FinalRenderExecutionInput): RenderExecutionValidationResult {
  const issues: RenderExecutionValidationResult['issues'] = []

  if (input.allowRevideo === true) issues.push(blocking('revideo_blocked', 'Revideo is evaluation-only and blocked from M16A production render execution.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))
  if ((input.arbitraryRemotionArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_remotion_args', 'Arbitrary Remotion args are blocked.'))
  if ((input.arbitraryLibassArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_libass_args', 'Arbitrary libass args are blocked.'))

  validatePaths(input, issues)
  validateRenderSettings(input, issues)
  validateExportSettings(input, issues)

  if (requiredAssetCount(input) === 0) issues.push(blocking('missing_required_assets', 'Final render requires at least one private source/proxy/timeline/render asset reference.'))
  if (input.renderMode === 'final_export') {
    const failedUpstream = (input.upstreamQaResults ?? []).filter((gate) => gate.blocking || gate.status === 'failed' || gate.status === 'blocked')
    if (failedUpstream.length > 0) issues.push(blocking('blocking_upstream_qa_gates_present', 'Final export cannot run with failed/blocking upstream QA gates.'))
  }

  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

export function validateRenderExecutionManifest(manifest: RenderExecutionManifest): RenderExecutionValidationResult {
  const issues: RenderExecutionValidationResult['issues'] = []
  if (manifest.revideoUsed) issues.push(blocking('revideo_in_manifest', 'Normalized render execution manifest must not use Revideo.'))
  if (manifest.durationSeconds <= 0) issues.push(blocking('invalid_duration', 'Render duration must be positive.'))
  if (manifest.fps < 1 || manifest.fps > 120) issues.push(blocking('invalid_fps', 'Render fps must be between 1 and 120.'))
  if (manifest.canvas.width <= 0 || manifest.canvas.height <= 0 || manifest.canvas.width > 4096 || manifest.canvas.height > 4096) {
    issues.push(blocking('invalid_canvas', 'Render canvas must be positive and no larger than 4096x4096 in M16A.'))
  }
  if (manifest.finalDeliveryCandidate && manifest.renderMode !== 'final_export') {
    issues.push(warning('final_delivery_not_export_mode', 'Final delivery can only be evaluated as passable during final_export mode.'))
  }
  if (manifest.clips.length === 0) issues.push(blocking('timeline_clips_missing', 'Render execution requires at least one timeline clip.'))
  let previousTimelineEnd = 0
  for (const clip of [...manifest.clips].sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds)) {
    if (clip.sourceStartSeconds < 0 || clip.sourceEndSeconds <= clip.sourceStartSeconds) {
      issues.push(blocking('invalid_source_clip_range', `${clip.clipId} has an invalid source range.`))
    }
    if (clip.timelineStartSeconds < 0 || clip.timelineEndSeconds <= clip.timelineStartSeconds) {
      issues.push(blocking('invalid_timeline_clip_range', `${clip.clipId} has an invalid timeline range.`))
    }
    if (clip.timelineStartSeconds + 0.04 < previousTimelineEnd) {
      issues.push(blocking('overlapping_timeline_clips', `${clip.clipId} overlaps a previous timeline clip.`))
    }
    previousTimelineEnd = Math.max(previousTimelineEnd, clip.timelineEndSeconds)
  }
  if (manifest.clips.length > 0 && Math.abs(previousTimelineEnd - manifest.durationSeconds) > 0.12) {
    issues.push(blocking('timeline_duration_mismatch', 'Timeline clip ranges do not resolve to the declared render duration.'))
  }
  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

function validatePaths(
  input: FinalRenderExecutionInput,
  issues: RenderExecutionValidationResult['issues'],
): void {
  for (const [label, values] of [
    ['sourceLocalPath', input.sourceLocalPaths ?? []],
    ['proxyLocalPath', input.proxyLocalPaths ?? []],
    ['captionLocalPath', input.captionLocalPaths ?? []],
    ['captionOverlayLocalPath', input.captionOverlayInputs?.map((item) => item.localPath) ?? []],
    ['audioLocalPath', input.audioLocalPaths ?? []],
    ['outputDirectory', input.outputDirectory ? [input.outputDirectory] : []],
  ] as const) {
    for (const value of values) {
      try {
        assertNoSignedUrlOrRawUrl(value, label)
        assertNoPathTraversal(value, label)
      } catch (error) {
        issues.push(blocking('unsafe_render_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
      }
    }
  }

  if (input.outputDirectory) {
    for (const sourcePath of [...(input.sourceLocalPaths ?? []), ...(input.proxyLocalPaths ?? []), ...(input.audioLocalPaths ?? [])]) {
      try {
        const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, input.outputFileName ?? outputFileName(input.renderMode)), input.outputDirectory)
        assertSourceNotOverwritten(sourcePath, outputPath)
      } catch {
        issues.push(blocking('source_overwrite_risk', 'Render/export outputs must not overwrite source/proxy/input assets.'))
      }
    }
  }
  if (input.outputFileName && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.mp4$/.test(input.outputFileName)) {
    issues.push(blocking('unsafe_output_file_name', 'Render outputFileName must be a safe MP4 basename.'))
  }
  if (input.mode === 'local_dev' && input.enableLocalDevRender === true) {
    for (const captionPath of input.captionLocalPaths ?? []) {
      if (!existsSync(captionPath)) issues.push(blocking('caption_file_missing', 'A required private caption file is missing.'))
    }
    for (const overlay of input.captionOverlayInputs ?? []) {
      if (!existsSync(overlay.localPath)) issues.push(blocking('caption_overlay_missing', 'A required private caption overlay is missing.'))
      if (overlay.startSeconds < 0 || overlay.endSeconds <= overlay.startSeconds || overlay.endSeconds > input.durationSeconds + 0.05) {
        issues.push(blocking('caption_overlay_timing_invalid', 'A caption overlay has an invalid approved timeline range.'))
      }
      if ((overlay.x !== undefined && overlay.x < 0) || (overlay.y !== undefined && overlay.y < 0)) {
        issues.push(blocking('caption_overlay_position_invalid', 'Caption overlay positions must stay inside the approved frame.'))
      }
    }
    if (input.enableCaptionBurnIn === true && (input.captionOverlayInputs?.length ?? 0) === 0 && (input.captionLocalPaths?.length ?? 0) === 0) {
      issues.push(blocking('caption_burnin_input_missing', 'Caption burn-in requires validated ASS or raster overlay inputs.'))
    }
  }
}

function validateRenderSettings(
  input: FinalRenderExecutionInput,
  issues: RenderExecutionValidationResult['issues'],
): void {
  if (input.durationSeconds <= 0) issues.push(blocking('invalid_duration', 'Render duration must be positive.'))
  if (input.fps < 1 || input.fps > 120) issues.push(blocking('invalid_fps', 'Render fps must be between 1 and 120.'))
  if (input.canvas.width <= 0 || input.canvas.height <= 0 || input.canvas.width > 4096 || input.canvas.height > 4096) {
    issues.push(blocking('invalid_canvas', 'Render canvas must be positive and no larger than 4096x4096 in M16A.'))
  }
}

function validateExportSettings(
  input: FinalRenderExecutionInput,
  issues: RenderExecutionValidationResult['issues'],
): void {
  if (!ALLOWED_CONTAINERS.has(input.exportSettings.container)) issues.push(blocking('unsupported_export_container', 'M16A supports mp4 export container only.'))
  if (!ALLOWED_VIDEO_CODECS.has(input.exportSettings.videoCodec)) issues.push(blocking('unsupported_video_codec', 'M16A supports H.264/libx264 video only.'))
  if (!ALLOWED_AUDIO_CODECS.has(input.exportSettings.audioCodec)) issues.push(blocking('unsupported_audio_codec', 'M16A supports AAC audio only.'))
  if (input.exportSettings.pixelFormat && !ALLOWED_PIXEL_FORMATS.has(input.exportSettings.pixelFormat)) issues.push(blocking('unsupported_pixel_format', 'M16A supports yuv420p pixel format only.'))
}

function requiredAssetCount(input: FinalRenderExecutionInput): number {
  return [
    input.timelineManifestId,
    input.renderManifestId,
    ...(input.sourceVideoArtifactIds ?? []),
    ...(input.proxyVideoArtifactIds ?? []),
    ...(input.renderManifest?.assets ?? []).map((asset) => asset.storageObjectPath),
    ...(input.timelineManifest?.sourceReferences ?? []).map((asset) => asset.storageObjectPath),
  ].filter(Boolean).length
}

function outputFileName(renderMode: FinalRenderExecutionInput['renderMode']): string {
  return renderMode === 'final_export' ? 'm16a-final-export.mp4' : 'm16a-preview.mp4'
}

function blocking(code: string, message: string): RenderExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): RenderExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
