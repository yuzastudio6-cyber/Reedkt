import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { ApiError } from '../errors/api-error'
import { parseCommandLine } from '../workers/tools/tool-check-utils'
import { assertPathInsideRoot } from './local-media-paths'

const execFileAsync = promisify(execFile)

export type PreviewAudioMode = 'copy_or_transcode' | 'muted' | 'preserve'

export interface BasicPreviewRenderOptions {
  localStorageRoot: string
  ffmpegBin?: string
  timeoutMs?: number
  maxDurationSeconds?: number
  startSeconds?: number
  targetWidth?: number
  targetHeight?: number
  fps?: number
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
    filters: string[]
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
  const filters = buildFilters(options)

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
    ...(filters.length > 0 ? ['-vf', filters.join(',')] : []),
    '-c:v',
    videoCodec,
    '-q:v',
    '5',
    '-pix_fmt',
    'yuv420p',
    ...audioArgs(audioMode),
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

  const [fileStat, bytes] = await Promise.all([stat(absoluteOutputPath), readFile(absoluteOutputPath)])

  return {
    outputPath: absoluteOutputPath,
    durationSeconds: maxDurationSeconds,
    sizeBytes: fileStat.size,
    checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    commandSummary: {
      tool: 'ffmpeg',
      maxDurationSeconds,
      startSeconds,
      videoCodec,
      audioMode,
      filters,
    },
  }
}

function buildFilters(options: BasicPreviewRenderOptions): string[] {
  const filters: string[] = []
  const scaleFilter = buildScaleFilter(options.targetWidth, options.targetHeight)
  if (scaleFilter) filters.push(scaleFilter)
  if (options.fps) filters.push(`fps=${options.fps}`)
  return filters
}

function buildScaleFilter(width: number | undefined, height: number | undefined): string | undefined {
  if (!width && !height) return undefined
  return `scale=${width ?? -2}:${height ?? -2}`
}

function audioArgs(audioMode: PreviewAudioMode): string[] {
  if (audioMode === 'muted') return ['-an']
  if (audioMode === 'preserve') return ['-c:a', 'copy']
  return ['-c:a', 'aac', '-b:a', '96k']
}
