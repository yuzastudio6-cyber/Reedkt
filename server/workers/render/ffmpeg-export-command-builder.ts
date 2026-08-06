import path from 'node:path'
import { assertOutputPathInsideRoot } from '../media/media-path-safety'
import type { FinalRenderExecutionInput, RenderCommandPlan, RenderExecutionManifest } from './render-execution-types'

export function buildFfmpegExportCommandPlan(input: {
  executionInput: FinalRenderExecutionInput
  executionManifest: RenderExecutionManifest
}): RenderCommandPlan {
  const { executionInput, executionManifest } = input
  const outputPath = executionInput.outputDirectory
    ? assertOutputPathInsideRoot(
      path.join(executionInput.outputDirectory, executionInput.outputFileName ?? (executionInput.renderMode === 'final_export' ? 'm16a-final-export.mp4' : 'm16a-preview.mp4')),
      executionInput.outputDirectory,
    )
    : '[worker-temp-ffmpeg-output]'
  const sourcePath = selectFfmpegVideoInputPath(executionInput)
  const externalAudioPath = executionInput.audioLocalPaths?.[0]
  const captionOverlays = executionInput.enableCaptionBurnIn === true ? executionInput.captionOverlayInputs ?? [] : []
  const audioRequired = executionInput.sourceAudioRequired !== false
  const externalAudioInputIndex = externalAudioPath ? 1 : undefined
  const captionInputStartIndex = externalAudioPath ? 2 : 1
  const filterComplex = buildFilterComplex(executionInput, executionManifest, audioRequired, externalAudioInputIndex, captionInputStartIndex)
  const profile = executionInput.localDevRenderProfile

  return {
    planId: `ffmpeg-export-${executionManifest.executionManifestId}`,
    tool: 'ffmpeg',
    command: executionInput.ffmpegBin ?? 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      sourcePath,
      ...(externalAudioPath ? ['-i', externalAudioPath] : []),
      ...captionOverlays.flatMap((overlay) => [
        '-loop', '1',
        '-framerate', formatNumber(executionInput.fps),
        '-i', overlay.localPath,
      ]),
      '-filter_complex',
      filterComplex,
      '-map',
      '[video_out]',
      ...(audioRequired ? ['-map', '[audio_out]'] : ['-an']),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      String(executionInput.exportSettings.crf ?? 20),
      '-pix_fmt',
      'yuv420p',
      ...(audioRequired ? ['-c:a', 'aac', '-b:a', '160k', '-ar', '48000'] : []),
      '-r',
      formatNumber(executionInput.fps),
      '-movflags',
      '+faststart',
      '-metadata',
      `comment=${executionInput.renderMode === 'final_export' ? 'Private ReEditPro final export' : 'Private ReEditPro review output'}`,
      '-t',
      formatNumber(executionManifest.durationSeconds),
      '-shortest',
      outputPath,
    ],
    expectedOutputPath: outputPath,
    executes: executionInput.mode === 'local_dev' && executionInput.enableLocalDevRender === true,
    renderMode: executionInput.renderMode,
    summary: [
      'Allowlisted FFmpeg timeline assembly with source-range trims and deterministic output settings.',
      profile?.subtlePunchIns ? 'Subtle approved punch-ins are applied at edit boundaries.' : undefined,
      executionInput.enableCaptionBurnIn && (captionOverlays.length > 0 || executionInput.captionLocalPaths?.[0]) ? 'Validated private caption assets are burned into the assembled output.' : undefined,
      profile?.audioFinish === 'clean_voice' ? 'Voice-first cleanup and EBU-style loudness normalization are applied.' : undefined,
    ].filter(Boolean).join(' '),
  }
}

export function selectFfmpegVideoInputPath(input: FinalRenderExecutionInput): string {
  if (input.renderMode === 'final_export') {
    return input.sourceLocalPaths?.[0] ?? '[private-source-master-input]'
  }
  return input.proxyLocalPaths?.[0] ?? input.sourceLocalPaths?.[0] ?? '[private-video-input]'
}

function buildFilterComplex(
  input: FinalRenderExecutionInput,
  manifest: RenderExecutionManifest,
  audioRequired: boolean,
  externalAudioInputIndex: number | undefined,
  captionInputStartIndex: number,
): string {
  const profile = input.localDevRenderProfile ?? {
    visualFinish: 'none' as const,
    audioFinish: 'none' as const,
    subtlePunchIns: false,
  }
  const clips = [...manifest.clips].sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds)
  const clipFilters = clips.flatMap((clip, index) => {
    const zoom = profile.subtlePunchIns && index % 2 === 1 ? 1.035 : 1
    const scaledWidth = even(Math.round(manifest.canvas.width * zoom))
    const scaledHeight = even(Math.round(manifest.canvas.height * zoom))
    const video = [
      `[0:v:0]trim=start=${formatNumber(clip.sourceStartSeconds)}:end=${formatNumber(clip.sourceEndSeconds)}`,
      'setpts=PTS-STARTPTS',
      `scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=increase`,
      `crop=${manifest.canvas.width}:${manifest.canvas.height}:(in_w-out_w)/2:(in_h-out_h)/2`,
      'setsar=1',
      `fps=${formatNumber(manifest.fps)}`,
      'format=yuv420p',
    ].join(',') + `[video_${index}]`
    if (!audioRequired || externalAudioInputIndex !== undefined) return [video]
    const audio = [
      `[0:a:0]atrim=start=${formatNumber(clip.sourceStartSeconds)}:end=${formatNumber(clip.sourceEndSeconds)}`,
      'asetpts=PTS-STARTPTS',
      'aresample=48000',
    ].join(',') + `[audio_${index}]`
    return [video, audio]
  })

  const sourceAudioUsed = audioRequired && externalAudioInputIndex === undefined
  const concatInputs = clips.map((_, index) => sourceAudioUsed
    ? `[video_${index}][audio_${index}]`
    : `[video_${index}]`).join('')
  const concat = `${concatInputs}concat=n=${clips.length}:v=1:a=${sourceAudioUsed ? 1 : 0}[video_concat]${sourceAudioUsed ? '[audio_concat]' : ''}`
  const externalAudio = audioRequired && externalAudioInputIndex !== undefined
    ? `[${externalAudioInputIndex}:a:0]atrim=start=0:end=${formatNumber(manifest.durationSeconds)},asetpts=PTS-STARTPTS,aresample=48000[audio_external]`
    : undefined
  const videoFinish = buildVideoFinish(profile.visualFinish, manifest.durationSeconds)
  const captionPath = input.enableCaptionBurnIn === true ? input.captionLocalPaths?.[0] : undefined
  const hasRasterOverlays = input.enableCaptionBurnIn === true && (input.captionOverlayInputs?.length ?? 0) > 0
  const baseVideoLabel = hasRasterOverlays ? 'video_finished' : 'video_out'
  const video = captionPath && !hasRasterOverlays
    ? `[video_concat]${videoFinish},subtitles=filename='${escapeFilterPath(captionPath)}'[video_out]`
    : `[video_concat]${videoFinish}[${baseVideoLabel}]`
  const overlayFilters = buildCaptionOverlayFilters(input, baseVideoLabel, captionInputStartIndex)
  const audio = audioRequired
    ? `[${externalAudioInputIndex !== undefined ? 'audio_external' : 'audio_concat'}]${buildAudioFinish(profile.audioFinish, manifest.durationSeconds)}[audio_out]`
    : undefined

  return [...clipFilters, concat, externalAudio, video, ...overlayFilters, audio].filter(Boolean).join(';')
}

function buildCaptionOverlayFilters(input: FinalRenderExecutionInput, initialVideoLabel: string, inputStartIndex: number): string[] {
  const overlays = input.enableCaptionBurnIn === true ? input.captionOverlayInputs ?? [] : []
  return overlays.flatMap((overlay, index) => {
    const overlayLabel = `caption_overlay_${index}`
    const previousVideoLabel = index === 0 ? initialVideoLabel : `video_caption_${index - 1}`
    const outputVideoLabel = index === overlays.length - 1 ? 'video_out' : `video_caption_${index}`
    const x = overlay.x ?? Math.round(input.canvas.width * 0.09)
    const y = overlay.y ?? Math.round(input.canvas.height * 0.69)
    return [
      `[${index + inputStartIndex}:v:0]format=rgba[${overlayLabel}]`,
      `[${previousVideoLabel}][${overlayLabel}]overlay=x=${x}:y=${y}:enable='between(t,${formatNumber(overlay.startSeconds)},${formatNumber(overlay.endSeconds)})':shortest=1[${outputVideoLabel}]`,
    ]
  })
}

function buildVideoFinish(
  preset: NonNullable<FinalRenderExecutionInput['localDevRenderProfile']>['visualFinish'],
  durationSeconds: number,
): string {
  const filters = []
  if (preset === 'clean_natural') filters.push('eq=contrast=1.025:saturation=1.025:brightness=0.004')
  if (preset === 'premium_clean') filters.push('eq=contrast=1.04:saturation=1.035:brightness=0.006')
  filters.push('fade=t=in:st=0:d=0.12')
  filters.push(`fade=t=out:st=${formatNumber(Math.max(0, durationSeconds - 0.22))}:d=0.2`)
  return filters.join(',')
}

function buildAudioFinish(
  preset: NonNullable<FinalRenderExecutionInput['localDevRenderProfile']>['audioFinish'],
  durationSeconds: number,
): string {
  const filters = []
  if (preset === 'clean_voice') {
    filters.push('highpass=f=80')
    filters.push('lowpass=f=16000')
    filters.push('loudnorm=I=-16:LRA=7:TP=-1.5')
  }
  filters.push('afade=t=in:st=0:d=0.05')
  filters.push(`afade=t=out:st=${formatNumber(Math.max(0, durationSeconds - 0.18))}:d=0.16`)
  return filters.join(',')
}

function escapeFilterPath(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
}

function even(value: number): number {
  return value % 2 === 0 ? value : value + 1
}

function formatNumber(value: number): string {
  return Number(value.toFixed(3)).toString()
}
