import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { promisify } from 'node:util'
import { ApiError } from '../errors/api-error'
import { parseCommandLine } from '../workers/tools/tool-check-utils'

const execFileAsync = promisify(execFile)

export interface MediaProbeSummary {
  durationSeconds?: number
  width?: number
  height?: number
  videoCodec?: string
  audioCodec?: string
  pixelFormat?: string
  colorSpace?: string
  colorTransfer?: string
  colorPrimaries?: string
  colorRange?: string
  bitsPerRawSample?: number
  formatName?: string
  sizeBytes?: number
  streamCount: number
  rawSummary: {
    formatName?: string
    durationSeconds?: number
    streamTypes: string[]
  }
}

export interface ProbeMediaFileOptions {
  ffprobeBin?: string
  timeoutMs?: number
}

export async function probeMediaFile(inputPath: string, options: ProbeMediaFileOptions = {}): Promise<MediaProbeSummary> {
  const parsedCommand = parseCommandLine(options.ffprobeBin ?? 'ffprobe')

  try {
    const result = await execFileAsync(parsedCommand.command, [
      ...parsedCommand.args,
      '-v',
      'error',
      '-show_format',
      '-show_streams',
      '-print_format',
      'json',
      inputPath,
    ], {
      timeout: options.timeoutMs ?? 10000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })

    return parseFFprobeJson(String(result.stdout ?? '{}'), inputPath)
  } catch (error) {
    throw new ApiError('FFPROBE_FAILED', error instanceof Error ? error.message : 'FFprobe failed.', 409)
  }
}

async function parseFFprobeJson(stdout: string, inputPath: string): Promise<MediaProbeSummary> {
  const data = JSON.parse(stdout) as {
    streams?: Array<Record<string, unknown>>
    format?: Record<string, unknown>
  }
  const streams = Array.isArray(data.streams) ? data.streams : []
  const videoStream = streams.find((stream) => stream.codec_type === 'video')
  const audioStream = streams.find((stream) => stream.codec_type === 'audio')
  const duration = typeof data.format?.duration === 'string' ? Number(data.format.duration) : undefined
  const formatSize = typeof data.format?.size === 'string' ? Number(data.format.size) : undefined
  const fallbackStat = await stat(inputPath).catch(() => undefined)
  const formatName = typeof data.format?.format_name === 'string' ? data.format.format_name : undefined

  return {
    durationSeconds: Number.isFinite(duration) ? duration : undefined,
    width: typeof videoStream?.width === 'number' ? videoStream.width : undefined,
    height: typeof videoStream?.height === 'number' ? videoStream.height : undefined,
    videoCodec: typeof videoStream?.codec_name === 'string' ? videoStream.codec_name : undefined,
    audioCodec: typeof audioStream?.codec_name === 'string' ? audioStream.codec_name : undefined,
    pixelFormat: typeof videoStream?.pix_fmt === 'string' ? videoStream.pix_fmt : undefined,
    colorSpace: typeof videoStream?.color_space === 'string' ? videoStream.color_space : undefined,
    colorTransfer: typeof videoStream?.color_transfer === 'string' ? videoStream.color_transfer : undefined,
    colorPrimaries: typeof videoStream?.color_primaries === 'string' ? videoStream.color_primaries : undefined,
    colorRange: typeof videoStream?.color_range === 'string' ? videoStream.color_range : undefined,
    bitsPerRawSample: numericField(videoStream?.bits_per_raw_sample),
    formatName,
    sizeBytes: Number.isFinite(formatSize) ? formatSize : fallbackStat?.size,
    streamCount: streams.length,
    rawSummary: {
      formatName,
      durationSeconds: Number.isFinite(duration) ? duration : undefined,
      streamTypes: streams
        .map((stream) => stream.codec_type)
        .filter((value): value is string => typeof value === 'string')
        .slice(0, 8),
    },
  }
}

function numericField(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : undefined
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}
