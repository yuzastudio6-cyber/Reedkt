import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { ApiError } from '../errors/api-error'
import { parseCommandLine } from '../workers/tools/tool-check-utils'
import { assertPathInsideRoot } from './local-media-paths'

const execFileAsync = promisify(execFile)
const APPROVED_BROWSER_CAPTURE_PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const MAX_APPROVED_BROWSER_CAPTURE_BYTES = 8 * 1024 * 1024

export type PreviewAudioMode = 'copy_or_transcode' | 'muted' | 'preserve'
export type PreviewFitMode = 'contain' | 'stretch'

export interface BasicPreviewRenderOptions {
  localStorageRoot: string
  ffmpegBin?: string
  ffprobeBin?: string
  timeoutMs?: number
  maxDurationSeconds?: number
  startSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
  fitMode?: PreviewFitMode
  backgroundColor?: string
  videoCodec?: string
  audioMode?: PreviewAudioMode
}

export interface BasicPreviewRenderOutput {
  outputPath: string
  durationSeconds: number
  sizeBytes: number
  checksumSha256: string
  commandSummary: {
    tool: 'ffmpeg'
    maxDurationSeconds: number
    startSeconds: number
    videoCodec: string
    audioMode: PreviewAudioMode
    audioSource: 'source_audio' | 'generated_silence' | 'none'
    fitMode: PreviewFitMode
    filters: string[]
  }
}

export interface MediaProbeSummary {
  hasVideo: boolean
  hasAudio: boolean
  width?: number
  height?: number
  durationSeconds?: number
  fps?: number
}

export interface PrivateFinalRenderOutput {
  outputPath: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  sizeBytes: number
  checksumSha256: string
  commandSummary: {
    tool: 'ffmpeg'
    mode: 'concat_copy' | 'overlay_then_concat_copy' | 'concat_with_audio_polish' | 'overlay_then_concat_with_audio_polish'
    inputCount: number
    videoCodec: 'copy' | 'libx264'
    audioMode: 'copy' | 'aac'
    audioPolish: {
      applied: boolean
      source: 'private_final_render_voice_first_loudness'
      targetIntegratedLufs: -16
      truePeakDb: -1.5
      loudnessRangeLufs: 11
      limiter: true
      filterChain: string[]
    }
    approvedFinalTimingCount: number
    approvedFinalTimelineDurationSeconds: number
    reviewOverlayCount: number
    approvedCaptionOverlayCount: number
    approvedTransitionPolishCount: number
    approvedVisualPolishCount: number
    approvedBrowserCaptureOverlayCount: number
    visualPolish: {
      applied: boolean
      source: 'approved_color_pipeline_private_render'
      toolId: 'ffmpeg'
      fullColorPipelineExecuted: false
      clipCount: number
      colorGradeStyles: string[]
      operationLabels: string[]
      filterChain: string[]
    }
  }
}

export interface PrivateFinalRenderClipOverlay {
  title?: string
  caption?: string
  subtitle?: string
  transitionPolish?: {
    fadeInSeconds?: number
    fadeOutSeconds?: number
    source: 'approved_transition_timing'
  }
  approvedFinalTiming?: {
    durationSeconds: number
    source: 'approved_master_timing_final_range'
  }
  visualPolish?: {
    source: 'approved_color_pipeline_private_render'
    colorGradeStyle: string
    intensity: 'subtle' | 'balanced' | 'strong' | 'stylized'
    operationIds: string[]
    operationLabels: string[]
    toolId: 'ffmpeg'
    fullColorPipelineExecuted: false
  }
  approvedBrowserCapture?: {
    source: 'approved_playwright_private_capture'
    artifactId: string
    operationId: string
    localFilePath: string
    sha256: string
    width: 640
    height: 360
    rendererLayerIds: string[]
  }
}

export async function createBasicPreview(
  inputPath: string,
  outputPath: string,
  options: BasicPreviewRenderOptions,
): Promise<BasicPreviewRenderOutput> {
  const absoluteOutputPath = assertPathInsideRoot(options.localStorageRoot, outputPath)
  const parsedCommand = parseCommandLine(options.ffmpegBin ?? 'ffmpeg')
  const maxDurationSeconds = options.maxDurationSeconds ?? 3
  const startSeconds = options.startSeconds ?? 0
  const videoCodec = options.videoCodec ?? 'mpeg4'
  const audioMode = options.audioMode ?? 'muted'
  const fitMode = options.fitMode ?? 'contain'
  const filters = buildFilters(options)
  const sourceHasAudio = audioMode === 'copy_or_transcode' || audioMode === 'preserve'
    ? await hasAudioStream(inputPath, options)
    : false
  const addSilentAudio = audioMode === 'copy_or_transcode' && !sourceHasAudio
  const audioSource = audioMode === 'muted'
    ? 'none'
    : sourceHasAudio
      ? 'source_audio'
      : addSilentAudio
        ? 'generated_silence'
        : 'none'

  await mkdir(path.dirname(absoluteOutputPath), { recursive: true })

  const args = [
    ...parsedCommand.args,
    '-y',
    '-ss',
    String(startSeconds),
    '-t',
    String(maxDurationSeconds),
    '-i',
    inputPath,
    ...(addSilentAudio ? [
      '-f',
      'lavfi',
      '-t',
      String(maxDurationSeconds),
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=48000',
    ] : []),
    ...(filters.length > 0 ? ['-vf', filters.join(',')] : []),
    '-map',
    '0:v:0',
    ...audioArgs(audioMode, sourceHasAudio, addSilentAudio),
    '-c:v',
    videoCodec,
    '-q:v',
    '5',
    '-pix_fmt',
    'yuv420p',
    ...(audioMode === 'copy_or_transcode' || audioMode === 'preserve' ? ['-shortest'] : []),
    '-movflags',
    '+faststart',
    absoluteOutputPath,
  ]

  try {
    await execFileAsync(parsedCommand.command, args, {
      timeout: options.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    throw new ApiError('FFMPEG_RENDER_FAILED', error instanceof Error ? error.message : 'FFmpeg preview render failed.', 409)
  }

  const [fileStat, bytes, probe] = await Promise.all([
    stat(absoluteOutputPath),
    readFile(absoluteOutputPath),
    probeMediaFile(absoluteOutputPath, {
      ffprobeBin: options.ffprobeBin,
      timeoutMs: options.timeoutMs,
    }),
  ])
  if (!probe.hasVideo || !probe.durationSeconds) {
    throw new ApiError('FFMPEG_RENDER_FAILED', 'FFmpeg preview did not produce probeable browser review video metadata.', 409)
  }

  return {
    outputPath: absoluteOutputPath,
    durationSeconds: probe.durationSeconds,
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    commandSummary: {
      tool: 'ffmpeg',
      maxDurationSeconds,
      startSeconds,
      videoCodec,
      audioMode,
      audioSource,
      fitMode,
      filters,
    },
  }
}

export async function createPrivateFinalRenderFromPreviewClips(
  inputPaths: string[],
  outputPath: string,
  options: Pick<BasicPreviewRenderOptions, 'localStorageRoot' | 'ffmpegBin' | 'timeoutMs'> & {
    ffprobeBin?: string
    clipOverlays?: Array<PrivateFinalRenderClipOverlay | undefined>
  },
): Promise<PrivateFinalRenderOutput> {
  if (inputPaths.length < 1) {
    throw new ApiError('FFMPEG_RENDER_FAILED', 'At least one private preview clip is required for final render execution.', 409)
  }

  const absoluteOutputPath = assertPathInsideRoot(options.localStorageRoot, outputPath)
  const parsedCommand = parseCommandLine(options.ffmpegBin ?? 'ffmpeg')
  const safeInputPaths = inputPaths.map((inputPath) => assertPathInsideRoot(options.localStorageRoot, inputPath))

  await mkdir(path.dirname(absoluteOutputPath), { recursive: true })
  await Promise.all(safeInputPaths.map((inputPath) => stat(inputPath)))

  const normalizedOverlays = safeInputPaths.map((_, index) => normalizeReviewOverlay(options.clipOverlays?.[index]))
  const reviewOverlayCount = normalizedOverlays.filter((overlay) => overlay.title || overlay.caption || overlay.subtitle).length
  const approvedCaptionOverlayCount = normalizedOverlays.filter((overlay) => overlay.caption).length
  const approvedTransitionPolishCount = normalizedOverlays.filter((overlay) =>
    (overlay.transitionPolish?.fadeInSeconds ?? 0) > 0 || (overlay.transitionPolish?.fadeOutSeconds ?? 0) > 0
  ).length
  const approvedFinalTimingCount = normalizedOverlays.filter((overlay) => overlay.approvedFinalTiming).length
  const approvedFinalTimelineDurationSeconds = normalizedOverlays.reduce((sum, overlay) =>
    sum + (overlay.approvedFinalTiming?.durationSeconds ?? 0), 0)
  const approvedVisualPolishCount = normalizedOverlays.filter((overlay) => overlay.visualPolish).length
  const approvedBrowserCaptureOverlayCount = normalizedOverlays.filter((overlay) => overlay.approvedBrowserCapture).length
  const visualPolish = privateFinalRenderVisualPolish(normalizedOverlays)
  const requiresPerClipRender = normalizedOverlays.some((overlay) =>
    Boolean(overlay.title || overlay.caption || overlay.subtitle || overlay.transitionPolish || overlay.approvedFinalTiming || overlay.visualPolish || overlay.approvedBrowserCapture)
  )
  await Promise.all(normalizedOverlays.flatMap((overlay) => overlay.approvedBrowserCapture
    ? [verifyApprovedBrowserCaptureFile({
        ...overlay.approvedBrowserCapture,
        localFilePath: assertPathInsideRoot(options.localStorageRoot, overlay.approvedBrowserCapture.localFilePath),
      })]
    : []))
  const concatInputPaths = requiresPerClipRender
    ? await createOverlayedConcatInputs({
        inputPaths: safeInputPaths,
        outputDirectory: path.dirname(absoluteOutputPath),
        outputStem: path.basename(absoluteOutputPath, path.extname(absoluteOutputPath)),
        overlays: normalizedOverlays,
        parsedCommand,
        ffprobeBin: options.ffprobeBin,
        timeoutMs: options.timeoutMs,
      })
    : safeInputPaths

  const concatListPath = path.join(path.dirname(absoluteOutputPath), `${path.basename(absoluteOutputPath)}.concat.txt`)
  const concatList = concatInputPaths.map((inputPath) => `file '${inputPath.replace(/'/g, "'\\''")}'`).join('\n')
  await writeFile(concatListPath, `${concatList}\n`, 'utf8')
  const audioPolish = privateFinalRenderAudioPolish()

  const args = [
    ...parsedCommand.args,
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatListPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0?',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-af',
    audioPolish.filterChain.join(','),
    '-movflags',
    '+faststart',
    absoluteOutputPath,
  ]

  try {
    await execFileAsync(parsedCommand.command, args, {
      timeout: options.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    throw new ApiError('FFMPEG_RENDER_FAILED', error instanceof Error ? error.message : 'FFmpeg final render execution failed.', 409)
  }

  const [fileStat, bytes, probe] = await Promise.all([
    stat(absoluteOutputPath),
    readFile(absoluteOutputPath),
    probeMediaFile(absoluteOutputPath, {
      ffprobeBin: options.ffprobeBin,
      timeoutMs: options.timeoutMs,
    }),
  ])
  if (!probe.hasVideo || !probe.width || !probe.height || !probe.durationSeconds || !probe.fps) {
    throw new ApiError('FFMPEG_RENDER_FAILED', 'FFmpeg final render did not produce probeable browser review video metadata.', 409)
  }

  return {
    outputPath: absoluteOutputPath,
    durationSeconds: probe.durationSeconds,
    width: probe.width,
    height: probe.height,
    fps: probe.fps,
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    commandSummary: {
      tool: 'ffmpeg',
      mode: reviewOverlayCount > 0 || approvedBrowserCaptureOverlayCount > 0
        ? 'overlay_then_concat_with_audio_polish'
        : 'concat_with_audio_polish',
      inputCount: concatInputPaths.length,
      videoCodec: requiresPerClipRender ? 'libx264' : 'copy',
      audioMode: 'aac',
      audioPolish,
      approvedFinalTimingCount,
      approvedFinalTimelineDurationSeconds: roundSeconds(approvedFinalTimelineDurationSeconds),
      reviewOverlayCount,
      approvedCaptionOverlayCount,
      approvedTransitionPolishCount,
      approvedVisualPolishCount,
      approvedBrowserCaptureOverlayCount,
      visualPolish,
    },
  }
}

export async function probeMediaFile(
  inputPath: string,
  options: Pick<BasicPreviewRenderOptions, 'ffprobeBin' | 'timeoutMs'> = {},
): Promise<MediaProbeSummary> {
  const parsedCommand = parseCommandLine(options.ffprobeBin ?? 'ffprobe')
  const { stdout } = await execFileAsync(parsedCommand.command, [
    ...parsedCommand.args,
    '-v',
    'error',
    '-show_entries',
    'stream=codec_type,width,height,duration,avg_frame_rate,r_frame_rate',
    '-of',
    'json',
    inputPath,
  ], {
    timeout: options.timeoutMs ?? 30000,
    windowsHide: true,
    maxBuffer: 128 * 1024,
  })
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{
      codec_type?: string
      width?: number
      height?: number
      duration?: string | number
      avg_frame_rate?: string
      r_frame_rate?: string
    }>
  }
  const video = parsed.streams?.find((stream) => stream.codec_type === 'video')
  const audio = parsed.streams?.find((stream) => stream.codec_type === 'audio')
  const durationSeconds = Number(video?.duration ?? audio?.duration)
  const fps = parseFfprobeRate(video?.avg_frame_rate ?? video?.r_frame_rate)
  return {
    hasVideo: Boolean(video),
    hasAudio: Boolean(audio),
    width: Number.isFinite(Number(video?.width)) ? Number(video?.width) : undefined,
    height: Number.isFinite(Number(video?.height)) ? Number(video?.height) : undefined,
    durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : undefined,
    fps,
  }
}

function parseFfprobeRate(value: string | undefined): number | undefined {
  if (!value) return undefined
  const [numeratorText, denominatorText] = value.split('/')
  const numerator = Number(numeratorText)
  const denominator = Number(denominatorText ?? 1)
  const rate = denominator > 0 ? numerator / denominator : Number.NaN
  return Number.isFinite(rate) && rate > 0 ? rate : undefined
}

function privateFinalRenderAudioPolish(): PrivateFinalRenderOutput['commandSummary']['audioPolish'] {
  return {
    applied: true,
    source: 'private_final_render_voice_first_loudness',
    targetIntegratedLufs: -16,
    truePeakDb: -1.5,
    loudnessRangeLufs: 11,
    limiter: true,
    filterChain: [
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      'alimiter=limit=0.95',
    ],
  }
}

function browserReviewVideoCodecArgs(): string[] {
  return [
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-profile:v',
    'baseline',
    '-level',
    '3.0',
  ]
}

function privateFinalRenderVisualPolish(
  overlays: PrivateFinalRenderClipOverlay[],
): PrivateFinalRenderOutput['commandSummary']['visualPolish'] {
  const visualPolishOverlays = overlays.filter((overlay) => overlay.visualPolish)
  const filterChains = Array.from(new Set(visualPolishOverlays.flatMap((overlay) =>
    buildVisualPolishFilters(overlay.visualPolish).map((filter) => filter.replace(/\s+/g, '')))))
  return {
    applied: visualPolishOverlays.length > 0,
    source: 'approved_color_pipeline_private_render',
    toolId: 'ffmpeg',
    fullColorPipelineExecuted: false,
    clipCount: visualPolishOverlays.length,
    colorGradeStyles: Array.from(new Set(visualPolishOverlays
      .map((overlay) => overlay.visualPolish?.colorGradeStyle)
      .filter((style): style is string => Boolean(style)))),
    operationLabels: Array.from(new Set(visualPolishOverlays.flatMap((overlay) => overlay.visualPolish?.operationLabels ?? []))),
    filterChain: filterChains,
  }
}

async function createOverlayedConcatInputs(input: {
  inputPaths: string[]
  outputDirectory: string
  outputStem: string
  overlays: PrivateFinalRenderClipOverlay[]
  parsedCommand: ReturnType<typeof parseCommandLine>
  ffprobeBin?: string
  timeoutMs?: number
}): Promise<string[]> {
  const renderedPaths: string[] = []

  for (let index = 0; index < input.inputPaths.length; index += 1) {
    const overlay = input.overlays[index]
    const outputPath = path.join(input.outputDirectory, `${input.outputStem}.review-overlay-${String(index + 1).padStart(2, '0')}.mp4`)
    const hasOverlayText = Boolean(overlay.title || overlay.caption || overlay.subtitle)
    const hasTransitionPolish = (overlay.transitionPolish?.fadeInSeconds ?? 0) > 0 || (overlay.transitionPolish?.fadeOutSeconds ?? 0) > 0
    const hasApprovedFinalTiming = Boolean(overlay.approvedFinalTiming)
    const hasVisualPolish = Boolean(overlay.visualPolish)
    const hasApprovedBrowserCapture = Boolean(overlay.approvedBrowserCapture)
    const args = hasOverlayText || hasTransitionPolish || hasApprovedFinalTiming || hasVisualPolish || hasApprovedBrowserCapture
      ? await overlayRenderArgs({
          parsedCommand: input.parsedCommand,
          inputPath: input.inputPaths[index],
          outputPath,
          outputDirectory: input.outputDirectory,
          outputStem: input.outputStem,
          index,
          overlay,
          ffprobeBin: input.ffprobeBin,
          timeoutMs: input.timeoutMs,
        })
      : [
          ...input.parsedCommand.args,
          '-y',
          '-i',
          input.inputPaths[index],
          '-vf',
          'setsar=1',
          '-map',
          '0:v:0',
          '-map',
          '0:a:0?',
          ...browserReviewVideoCodecArgs(),
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '96k',
          '-shortest',
          '-movflags',
          '+faststart',
          outputPath,
        ]

    try {
      await execFileAsync(input.parsedCommand.command, args, {
        timeout: input.timeoutMs ?? 30000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      })
    } catch (error) {
      throw new ApiError('FFMPEG_RENDER_FAILED', error instanceof Error ? error.message : 'FFmpeg review overlay render failed.', 409)
    }

    renderedPaths.push(outputPath)
  }

  return renderedPaths
}

async function overlayRenderArgs(input: {
  parsedCommand: ReturnType<typeof parseCommandLine>
  inputPath: string
  outputPath: string
  outputDirectory: string
  outputStem: string
  index: number
  overlay: PrivateFinalRenderClipOverlay
  ffprobeBin?: string
  timeoutMs?: number
}): Promise<string[]> {
  const metadata = await probeVideoMetadata(input.inputPath, {
    ffprobeBin: input.ffprobeBin,
    timeoutMs: input.timeoutMs,
  })
  const overlayHeight = Math.max(56, Math.min(Math.round(metadata.height * 0.38), 142))
  const overlayPath = path.join(input.outputDirectory, `${input.outputStem}.review-overlay-${String(input.index + 1).padStart(2, '0')}.ppm`)
  const hasOverlayText = Boolean(input.overlay.title || input.overlay.caption || input.overlay.subtitle)
  if (hasOverlayText) {
    await writeReviewOverlayPpm({
      outputPath: overlayPath,
      width: metadata.width,
      height: overlayHeight,
      title: input.overlay.title,
      caption: input.overlay.caption,
      subtitle: input.overlay.subtitle,
    })
  }
  if (input.overlay.approvedBrowserCapture) {
    await verifyApprovedBrowserCaptureFile(input.overlay.approvedBrowserCapture)
  }

  return [
    ...input.parsedCommand.args,
    '-y',
    '-i',
    input.inputPath,
    ...(hasOverlayText ? [
      '-loop',
      '1',
      '-i',
      overlayPath,
    ] : []),
    ...(input.overlay.approvedBrowserCapture ? [
      '-loop',
      '1',
      '-i',
      input.overlay.approvedBrowserCapture.localFilePath,
    ] : []),
    '-filter_complex',
    buildFinalRenderVideoFilter(input.overlay, metadata.durationSeconds, hasOverlayText, metadata.width),
    '-map',
    '[v]',
    '-map',
    '0:a:0?',
    ...browserReviewVideoCodecArgs(),
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
    ...approvedFinalTimingAudioArgs(input.overlay),
    '-shortest',
    '-movflags',
    '+faststart',
    input.outputPath,
  ]
}

function buildFinalRenderVideoFilter(
  overlay: PrivateFinalRenderClipOverlay,
  durationSeconds: number,
  hasOverlayText: boolean,
  sourceWidth: number,
): string {
  const sourceFilters = [
    ...buildVisualPolishFilters(overlay.visualPolish),
    'setsar=1',
  ]
  const filters: string[] = []
  const approvedDurationSeconds = overlay.approvedFinalTiming?.durationSeconds
  const renderDurationSeconds = approvedDurationSeconds ?? durationSeconds
  if (approvedDurationSeconds && approvedDurationSeconds > 0) {
    filters.push(`trim=duration=${formatFilterSeconds(approvedDurationSeconds)}`)
    filters.push('setpts=PTS-STARTPTS')
    if (durationSeconds < approvedDurationSeconds) {
      filters.push(`tpad=stop_mode=clone:stop_duration=${formatFilterSeconds(approvedDurationSeconds - durationSeconds)}`)
    }
  }
  const fadeInSeconds = overlay.transitionPolish?.fadeInSeconds ?? 0
  const fadeOutSeconds = overlay.transitionPolish?.fadeOutSeconds ?? 0
  if (fadeInSeconds > 0) {
    filters.push(`fade=t=in:st=0:d=${formatFilterSeconds(fadeInSeconds)}`)
  }
  if (fadeOutSeconds > 0 && renderDurationSeconds > fadeOutSeconds) {
    filters.push(`fade=t=out:st=${formatFilterSeconds(renderDurationSeconds - fadeOutSeconds)}:d=${formatFilterSeconds(fadeOutSeconds)}`)
  }
  if (!hasOverlayText && !overlay.approvedBrowserCapture) {
    return `[0:v]${[...sourceFilters, ...filters].join(',')}[v]`
  }

  const graph: string[] = [`[0:v]${sourceFilters.join(',')}[base]`]
  let currentLabel = 'base'
  if (overlay.approvedBrowserCapture) {
    const captureInputIndex = hasOverlayText ? 2 : 1
    const captureWidth = Math.max(160, Math.min(480, Math.round(sourceWidth * 0.42)))
    graph.push(`[${captureInputIndex}:v]scale=${captureWidth}:-2,format=rgba[capture]`)
    graph.push(`[${currentLabel}][capture]overlay=W-w-24:24:format=auto[capture_composite]`)
    currentLabel = 'capture_composite'
  }
  if (hasOverlayText) {
    graph.push(`[${currentLabel}][1:v]overlay=0:H-h[text_composite]`)
    currentLabel = 'text_composite'
  }
  graph.push(`[${currentLabel}]${filters.length ? filters.join(',') : 'null'}[v]`)
  return graph.join(';')
}

function buildVisualPolishFilters(
  visualPolish: PrivateFinalRenderClipOverlay['visualPolish'] | undefined,
): string[] {
  if (!visualPolish) return []
  const profile = visualPolishProfile(visualPolish.colorGradeStyle, visualPolish.intensity)
  const filters = [
    `eq=contrast=${profile.contrast}:brightness=${profile.brightness}:saturation=${profile.saturation}:gamma=${profile.gamma}`,
  ]
  if (visualPolish.operationIds.includes('sharpening') || visualPolish.operationIds.includes('clarity')) {
    filters.push('unsharp=5:5:0.35:3:3:0.15')
  }
  return filters
}

function visualPolishProfile(colorGradeStyle: string, intensity: string): {
  contrast: string
  brightness: string
  saturation: string
  gamma: string
} {
  const intensityOffset = intensity === 'strong' || intensity === 'stylized'
    ? 0.08
    : intensity === 'subtle'
      ? -0.04
      : 0
  const style = colorGradeStyle.toLowerCase()
  if (style.includes('documentary') || style.includes('corporate') || style.includes('clean_natural')) {
    return visualPolishNumbers(1.03 + intensityOffset, 0, 1.02 + intensityOffset / 2, 1)
  }
  if (style.includes('bright') || style.includes('high_key')) {
    return visualPolishNumbers(1.04 + intensityOffset, 0.015, 1.06 + intensityOffset, 0.98)
  }
  if (style.includes('warm') || style.includes('luxury')) {
    return visualPolishNumbers(1.06 + intensityOffset, 0.005, 1.08 + intensityOffset, 0.99)
  }
  if (style.includes('moody') || style.includes('cinematic')) {
    return visualPolishNumbers(1.08 + intensityOffset, -0.01, 0.98 + intensityOffset / 2, 1.02)
  }
  if (style.includes('muted') || style.includes('film')) {
    return visualPolishNumbers(1.05 + intensityOffset, -0.005, 0.94 + intensityOffset / 2, 1.01)
  }
  return visualPolishNumbers(1.05 + intensityOffset, 0, 1.04 + intensityOffset / 2, 1)
}

function visualPolishNumbers(contrast: number, brightness: number, saturation: number, gamma: number): {
  contrast: string
  brightness: string
  saturation: string
  gamma: string
} {
  return {
    contrast: clampVisualFilterValue(contrast, 0.9, 1.18).toFixed(3),
    brightness: clampVisualFilterValue(brightness, -0.03, 0.03).toFixed(3),
    saturation: clampVisualFilterValue(saturation, 0.9, 1.18).toFixed(3),
    gamma: clampVisualFilterValue(gamma, 0.94, 1.06).toFixed(3),
  }
}

function clampVisualFilterValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Number(value)))
}

function approvedFinalTimingAudioArgs(overlay: PrivateFinalRenderClipOverlay): string[] {
  const durationSeconds = overlay.approvedFinalTiming?.durationSeconds
  if (!durationSeconds || durationSeconds <= 0) return []
  return [
    '-af',
    `apad=pad_dur=${formatFilterSeconds(durationSeconds)}`,
    '-t',
    formatFilterSeconds(durationSeconds),
  ]
}

function formatFilterSeconds(value: number): string {
  return Math.max(0, value).toFixed(3).replace(/0+$/g, '').replace(/\.$/, '.0')
}

function normalizeReviewOverlay(overlay: PrivateFinalRenderClipOverlay | undefined): PrivateFinalRenderClipOverlay {
  return {
    title: sanitizeReviewOverlayText(overlay?.title, 28),
    caption: sanitizeReviewOverlayText(overlay?.caption, 40),
    subtitle: sanitizeReviewOverlayText(overlay?.subtitle, 36),
    transitionPolish: normalizeTransitionPolish(overlay?.transitionPolish),
    approvedFinalTiming: normalizeApprovedFinalTiming(overlay?.approvedFinalTiming),
    visualPolish: normalizeVisualPolish(overlay?.visualPolish),
    approvedBrowserCapture: normalizeApprovedBrowserCapture(overlay?.approvedBrowserCapture),
  }
}

function normalizeApprovedBrowserCapture(
  capture: PrivateFinalRenderClipOverlay['approvedBrowserCapture'] | undefined,
): PrivateFinalRenderClipOverlay['approvedBrowserCapture'] | undefined {
  if (!capture) return undefined
  const rendererLayerIds = Array.from(new Set(capture.rendererLayerIds
    .map((layerId) => layerId.trim())
    .filter((layerId) => /^[a-z0-9._:-]{1,160}$/i.test(layerId))))
  if (
    capture.source !== 'approved_playwright_private_capture' ||
    capture.width !== 640 ||
    capture.height !== 360 ||
    !capture.artifactId.trim() ||
    !capture.operationId.trim() ||
    !capture.localFilePath.trim() ||
    !/^[a-f0-9]{64}$/i.test(capture.sha256) ||
    rendererLayerIds.length < 1
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Final render browser overlay requires approved private Playwright artifact lineage.', 409)
  }
  return {
    source: 'approved_playwright_private_capture',
    artifactId: capture.artifactId,
    operationId: capture.operationId,
    localFilePath: capture.localFilePath,
    sha256: capture.sha256,
    width: 640,
    height: 360,
    rendererLayerIds,
  }
}

async function verifyApprovedBrowserCaptureFile(
  capture: NonNullable<PrivateFinalRenderClipOverlay['approvedBrowserCapture']>,
): Promise<void> {
  let bytes: Buffer
  try {
    bytes = await readFile(capture.localFilePath)
  } catch {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Approved private browser capture is unavailable at final-render time.', 409)
  }
  if (
    bytes.length < 24 ||
    bytes.length > MAX_APPROVED_BROWSER_CAPTURE_BYTES ||
    !bytes.subarray(0, 8).equals(APPROVED_BROWSER_CAPTURE_PNG_SIGNATURE)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Approved private browser capture failed PNG signature or byte-bound validation before final render.', 409)
  }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width !== 640 || height !== 360 || width !== capture.width || height !== capture.height) {
    throw new ApiError('VALIDATION_FAILED', 'Approved private browser capture dimensions changed before final render.', 409, {
      width,
      height,
    })
  }
  const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
  if (checksumSha256 !== capture.sha256) {
    throw new ApiError('VALIDATION_FAILED', 'Approved private browser capture checksum changed before final render.', 409, {
      expectedSha256: capture.sha256,
      actualSha256: checksumSha256,
    })
  }
}

function normalizeVisualPolish(
  visualPolish: PrivateFinalRenderClipOverlay['visualPolish'] | undefined,
): PrivateFinalRenderClipOverlay['visualPolish'] | undefined {
  if (!visualPolish || visualPolish.source !== 'approved_color_pipeline_private_render') return undefined
  return {
    source: 'approved_color_pipeline_private_render',
    colorGradeStyle: sanitizeReviewOverlayText(visualPolish.colorGradeStyle, 40) ?? 'clean_natural',
    intensity: normalizeVisualPolishIntensity(visualPolish.intensity),
    operationIds: Array.from(new Set(visualPolish.operationIds
      .filter((operationId) => /^[a-z0-9_]+$/i.test(operationId))
      .slice(0, 8))),
    operationLabels: Array.from(new Set(visualPolish.operationLabels
      .map((label) => sanitizeReviewOverlayText(label, 48))
      .filter((label): label is string => Boolean(label))
      .slice(0, 8))),
    toolId: 'ffmpeg',
    fullColorPipelineExecuted: false,
  }
}

function normalizeVisualPolishIntensity(
  intensity: NonNullable<PrivateFinalRenderClipOverlay['visualPolish']>['intensity'] | undefined,
): 'subtle' | 'balanced' | 'strong' | 'stylized' {
  return intensity === 'subtle' || intensity === 'strong' || intensity === 'stylized' ? intensity : 'balanced'
}

function normalizeApprovedFinalTiming(
  approvedFinalTiming: PrivateFinalRenderClipOverlay['approvedFinalTiming'] | undefined,
): PrivateFinalRenderClipOverlay['approvedFinalTiming'] | undefined {
  if (!approvedFinalTiming) return undefined
  const durationSeconds = clampSeconds(approvedFinalTiming.durationSeconds, 0.1, 60)
  return {
    source: 'approved_master_timing_final_range',
    durationSeconds,
  }
}

function normalizeTransitionPolish(
  transitionPolish: PrivateFinalRenderClipOverlay['transitionPolish'] | undefined,
): PrivateFinalRenderClipOverlay['transitionPolish'] | undefined {
  if (!transitionPolish) return undefined
  const fadeInSeconds = clampSeconds(transitionPolish.fadeInSeconds ?? 0, 0, 0.25)
  const fadeOutSeconds = clampSeconds(transitionPolish.fadeOutSeconds ?? 0, 0, 0.25)
  if (fadeInSeconds <= 0 && fadeOutSeconds <= 0) return undefined
  return {
    source: 'approved_transition_timing',
    fadeInSeconds,
    fadeOutSeconds,
  }
}

function clampSeconds(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Number(value)))
}

function roundSeconds(value: number): number {
  return Number(value.toFixed(3))
}

function sanitizeReviewOverlayText(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined
  const safe = value
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/[:'\\%,;[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!safe) return undefined
  return safe.length > maxLength ? `${safe.slice(0, Math.max(1, maxLength - 1)).trimEnd()}...` : safe
}

async function probeVideoMetadata(
  inputPath: string,
  options: Pick<BasicPreviewRenderOptions, 'ffprobeBin' | 'timeoutMs'>,
): Promise<{ width: number; height: number; durationSeconds: number }> {
  const parsedCommand = parseCommandLine(options.ffprobeBin ?? 'ffprobe')
  try {
    const { stdout } = await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,duration',
      '-of',
      'csv=s=x:p=0',
      inputPath,
    ], {
      timeout: options.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    })
    const [width, height, durationSeconds] = stdout.trim().split('x').map((part) => Number(part))
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return {
        width: Math.round(width),
        height: Math.round(height),
        durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 1,
      }
    }
  } catch {
    // Fall through to a conservative preview-sized overlay if probing is unavailable.
  }
  return { width: 320, height: 180, durationSeconds: 1 }
}

async function writeReviewOverlayPpm(input: {
  outputPath: string
  width: number
  height: number
  title?: string
  caption?: string
  subtitle?: string
}): Promise<void> {
  const width = Math.max(80, Math.round(input.width))
  const height = Math.max(40, Math.round(input.height))
  const pixels = Buffer.alloc(width * height * 3)
  fillRect(pixels, width, 0, 0, width, height, [10, 12, 18])
  fillRect(pixels, width, 0, 0, 5, height, [42, 148, 255])

  const scale = width >= 900 ? 3 : width >= 320 ? 2 : 1
  const left = Math.max(8, Math.round(width * 0.06))
  const maxChars = Math.max(8, Math.floor((width - left * 2) / (6 * scale)))
  const title = truncateForOverlayLine(input.title?.toUpperCase(), maxChars)
  const caption = truncateForOverlayLine(input.caption?.toUpperCase(), maxChars)
  const subtitle = truncateForOverlayLine(input.subtitle?.toUpperCase(), maxChars)
  const titleY = Math.max(6, Math.round(height * 0.12))
  const captionY = title ? titleY + 10 * scale : titleY
  const subtitleY = caption ? captionY + 10 * scale : title ? titleY + 10 * scale : titleY

  if (title) drawText(pixels, width, height, left, titleY, title, scale, [170, 218, 255])
  if (caption && captionY + 7 * scale < height) {
    drawText(pixels, width, height, left, captionY, caption, scale, [245, 248, 255])
  }
  if (subtitle && subtitleY + 7 * scale < height) {
    drawText(pixels, width, height, left, subtitleY, subtitle, scale, [190, 202, 220])
  }

  await writeFile(input.outputPath, Buffer.concat([
    Buffer.from(`P6\n${width} ${height}\n255\n`, 'ascii'),
    pixels,
  ]))
}

function truncateForOverlayLine(value: string | undefined, maxChars: number): string | undefined {
  if (!value) return undefined
  const safe = value.replace(/[^A-Z0-9 ._/-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!safe) return undefined
  return safe.length > maxChars ? `${safe.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...` : safe
}

function fillRect(
  pixels: Buffer,
  width: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  color: [number, number, number],
): void {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) {
      const offset = (row * width + col) * 3
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
    }
  }
}

function drawText(
  pixels: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  text: string,
  scale: number,
  color: [number, number, number],
): void {
  let cursorX = x
  for (const char of text) {
    drawChar(pixels, width, height, cursorX, y, char, scale, color)
    cursorX += 6 * scale
    if (cursorX >= width - 4 * scale) break
  }
}

function drawChar(
  pixels: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  char: string,
  scale: number,
  color: [number, number, number],
): void {
  const glyph = FONT_5X7[char] ?? FONT_5X7[' ']
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] !== '1') continue
      fillRectClipped(pixels, width, height, x + col * scale, y + row * scale, scale, scale, color)
    }
  }
}

function fillRectClipped(
  pixels: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  rectWidth: number,
  rectHeight: number,
  color: [number, number, number],
): void {
  const startX = Math.max(0, x)
  const startY = Math.max(0, y)
  const endX = Math.min(width, x + rectWidth)
  const endY = Math.min(height, y + rectHeight)
  for (let row = startY; row < endY; row += 1) {
    for (let col = startX; col < endX; col += 1) {
      const offset = (row * width + col) * 3
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
    }
  }
}

const FONT_5X7: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '-': ['00000', '00000', '00000', '11110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
  '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
}

function buildFilters(options: BasicPreviewRenderOptions): string[] {
  const filters: string[] = []
  const scaleFilter = buildScaleFilter(options)
  if (scaleFilter) filters.push(scaleFilter)
  if (options.fps) filters.push(`fps=${options.fps}`)
  filters.push('setsar=1')
  return filters
}

function buildScaleFilter(options: BasicPreviewRenderOptions): string | undefined {
  const width = options.targetWidth
  const height = options.targetHeight
  if (!width && !height) return undefined
  if (width && height && (options.fitMode ?? 'contain') === 'contain') {
    const backgroundColor = normalizeFfmpegColor(options.backgroundColor ?? '0x101010')
    return [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${backgroundColor}`,
    ].join(',')
  }
  return `scale=${width ?? -2}:${height ?? -2}`
}

async function hasAudioStream(
  inputPath: string,
  options: Pick<BasicPreviewRenderOptions, 'ffprobeBin' | 'timeoutMs'>,
): Promise<boolean> {
  const parsedCommand = parseCommandLine(options.ffprobeBin ?? 'ffprobe')
  try {
    const { stdout } = await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-v',
      'error',
      '-select_streams',
      'a:0',
      '-show_entries',
      'stream=index',
      '-of',
      'csv=p=0',
      inputPath,
    ], {
      timeout: options.timeoutMs ?? 30000,
      windowsHide: true,
      maxBuffer: 64 * 1024,
    })
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

function audioArgs(audioMode: PreviewAudioMode, sourceHasAudio: boolean, addSilentAudio: boolean): string[] {
  if (audioMode === 'muted') return ['-an']
  if (audioMode === 'preserve') {
    return sourceHasAudio ? ['-map', '0:a:0', '-c:a', 'copy'] : ['-an']
  }
  return [
    '-map',
    addSilentAudio ? '1:a:0' : '0:a:0',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
  ]
}

function normalizeFfmpegColor(value: string): string {
  const trimmed = value.trim()
  if (/^0x[0-9a-f]{6}$/i.test(trimmed)) return trimmed
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return `0x${trimmed.slice(1)}`
  return '0x101010'
}
