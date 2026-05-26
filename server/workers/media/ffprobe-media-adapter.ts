import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  assertExistingLocalFile,
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  sanitizePathForLog,
} from './media-path-safety'
import type { FFprobeMediaInput, MediaAudioStreamProbe, MediaProbeResult, MediaVideoStreamProbe } from './media-worker-types'

const execFileAsync = promisify(execFile)

interface FFprobeStream {
  index?: number
  codec_name?: string
  codec_type?: string
  width?: number
  height?: number
  avg_frame_rate?: string
  r_frame_rate?: string
  duration?: string
  pix_fmt?: string
  color_space?: string
  sample_rate?: string
  channels?: number
  tags?: Record<string, string>
  side_data_list?: Array<Record<string, unknown>>
}

interface FFprobeFormat {
  format_name?: string
  duration?: string
  size?: string
}

interface FFprobeJson {
  streams?: FFprobeStream[]
  format?: FFprobeFormat
}

export async function probeMediaFile(input: FFprobeMediaInput): Promise<MediaProbeResult> {
  assertNoSignedUrlOrRawUrl(input.localFilePath, 'localFilePath')
  assertNoPathTraversal(input.localFilePath, 'localFilePath')
  assertExistingLocalFile(input.localFilePath)

  const result = await execFileAsync(input.ffprobeBin, [
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-print_format',
    'json',
    input.localFilePath,
  ], {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  })

  const parsed = parseFFprobeJson(String(result.stdout ?? '{}'))
  const normalized = await normalizeMediaMetadata(parsed, input.localFilePath)

  return normalized
}

export function parseFFprobeJson(output: string): FFprobeJson {
  const parsed = JSON.parse(output) as FFprobeJson
  return {
    streams: Array.isArray(parsed.streams) ? parsed.streams : [],
    format: parsed.format ?? {},
  }
}

export async function normalizeMediaMetadata(parsed: FFprobeJson, localFilePath?: string): Promise<MediaProbeResult> {
  const streams = parsed.streams ?? []
  const videoStreams = streams.filter((stream) => stream.codec_type === 'video')
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio')
  const primaryVideo = videoStreams[0]
  const primaryAudio = audioStreams[0]
  const statSize = localFilePath ? (await stat(localFilePath)).size : undefined
  const durationSeconds = numericString(primaryVideo?.duration) ??
    numericString(primaryAudio?.duration) ??
    numericString(parsed.format?.duration) ??
    0
  const width = primaryVideo?.width ?? 0
  const height = primaryVideo?.height ?? 0
  const fps = parseFps(primaryVideo?.avg_frame_rate ?? primaryVideo?.r_frame_rate) ?? 0
  const sizeBytes = numericString(parsed.format?.size) ?? statSize ?? 0
  const rotation = readRotation(primaryVideo)

  return {
    durationSeconds,
    width,
    height,
    fps,
    codecName: primaryVideo?.codec_name ?? primaryAudio?.codec_name ?? 'unknown',
    formatName: parsed.format?.format_name ?? 'unknown',
    rotation,
    aspectRatio: buildAspectRatio(width, height),
    sizeBytes,
    videoStreams: videoStreams.map(normalizeVideoStream),
    audioStreams: audioStreams.map(normalizeAudioStream),
    streamCount: streams.length,
    rawProbeSummary: buildMediaProbeArtifactSummary({
      formatName: parsed.format?.format_name ?? 'unknown',
      streamTypes: streams.map((stream) => stream.codec_type ?? 'unknown'),
      pathSummary: localFilePath ? sanitizePathForLog(localFilePath) : undefined,
    }),
  }
}

export function buildMediaProbeArtifactSummary(result: Record<string, unknown>): Record<string, unknown> {
  return {
    tool: 'ffprobe',
    summaryOnly: true,
    ...result,
  }
}

function normalizeVideoStream(stream: FFprobeStream): MediaVideoStreamProbe {
  const width = stream.width ?? 0
  const height = stream.height ?? 0
  return {
    streamIndex: stream.index ?? 0,
    codecName: stream.codec_name ?? 'unknown',
    width,
    height,
    fps: parseFps(stream.avg_frame_rate ?? stream.r_frame_rate),
    durationSeconds: numericString(stream.duration),
    pixelFormat: stream.pix_fmt,
    colorSpace: stream.color_space,
    rotation: readRotation(stream),
  }
}

function normalizeAudioStream(stream: FFprobeStream): MediaAudioStreamProbe {
  return {
    streamIndex: stream.index ?? 0,
    codecName: stream.codec_name ?? 'unknown',
    sampleRate: numericString(stream.sample_rate),
    channels: stream.channels,
    durationSeconds: numericString(stream.duration),
  }
}

function numericString(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseFps(value: string | undefined): number | undefined {
  if (!value || value === '0/0') return undefined
  const [numeratorText, denominatorText] = value.split('/')
  const numerator = Number(numeratorText)
  const denominator = denominatorText ? Number(denominatorText) : 1
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined
  return Number((numerator / denominator).toFixed(3))
}

function readRotation(stream: FFprobeStream | undefined): number {
  const tagRotation = numericString(stream?.tags?.rotate)
  if (typeof tagRotation === 'number') return tagRotation

  const sideData = stream?.side_data_list?.find((item) => typeof item.rotation === 'number')
  return typeof sideData?.rotation === 'number' ? sideData.rotation : 0
}

function buildAspectRatio(width: number, height: number): string {
  if (!width || !height) return 'unknown'
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y > 0) {
    const next = x % y
    x = y
    y = next
  }
  return x || 1
}

export function sanitizeFFprobeInputForLog(localFilePath: string): string {
  return path.basename(localFilePath)
}
