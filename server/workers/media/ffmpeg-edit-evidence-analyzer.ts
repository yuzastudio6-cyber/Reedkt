import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import { assertNoSignedUrlOrRawUrl } from './media-path-safety'

const execFileAsync = promisify(execFile)

export interface FfmpegEditAudioEvidence {
  status: 'completed' | 'not_required' | 'blocked'
  integratedLufs?: number
  truePeakDb?: number
  peakDb?: number
  rmsDb?: number
  noiseFloorDb?: number
  clippingDetected: boolean
  noiseCondition: 'not_measured' | 'low' | 'moderate' | 'high'
  silenceRanges: Array<{ startSeconds: number; endSeconds: number }>
  analysisMethods: string[]
  blockers: string[]
  warnings: string[]
}

export interface FfmpegEditVisualRhythmEvidence {
  status: 'completed' | 'blocked'
  detectedCutTimesSeconds: number[]
  detectedCutCount: number
  averageShotDurationSeconds?: number
  pacingClass: 'unknown' | 'slow' | 'measured' | 'quick' | 'rapid'
  threshold: number
  analysisMethods: string[]
  blockers: string[]
  warnings: string[]
}

export interface FfmpegEditColorEvidence {
  status: 'completed' | 'blocked'
  sampledFrameCount: number
  averageLuma?: number
  minimumLuma?: number
  maximumLuma?: number
  averageSaturation?: number
  exposureCondition: 'not_measured' | 'dark' | 'balanced' | 'bright'
  contrastCondition: 'not_measured' | 'low' | 'balanced' | 'high'
  analysisMethods: string[]
  blockers: string[]
  warnings: string[]
}

export async function analyzeEditAudioEvidence(input: {
  sourceAudioLocalPath?: string
  audioRequired: boolean
  ffmpegBin: string
  timeoutMs: number
}): Promise<FfmpegEditAudioEvidence> {
  if (!input.audioRequired) {
    return {
      status: 'not_required',
      clippingDetected: false,
      noiseCondition: 'not_measured',
      silenceRanges: [],
      analysisMethods: [],
      blockers: [],
      warnings: ['Source has no audio stream; audio measurements are not required.'],
    }
  }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) {
    return blockedAudio('source_audio_measurement_input_missing')
  }
  assertPrivateInputPath(input.sourceAudioLocalPath)

  try {
    const [loudnessOutput, statsOutput, silenceOutput] = await Promise.all([
      runFfmpeg(input.ffmpegBin, [
        '-hide_banner', '-nostdin', '-i', input.sourceAudioLocalPath,
        '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-',
      ], input.timeoutMs),
      runFfmpeg(input.ffmpegBin, [
        '-hide_banner', '-nostdin', '-i', input.sourceAudioLocalPath,
        '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-',
      ], input.timeoutMs),
      runFfmpeg(input.ffmpegBin, [
        '-hide_banner', '-nostdin', '-i', input.sourceAudioLocalPath,
        '-af', 'silencedetect=noise=-40dB:d=0.35', '-f', 'null', '-',
      ], input.timeoutMs),
    ])
    const loudness = parseLoudness(loudnessOutput)
    const stats = parseAstats(statsOutput)
    const silenceRanges = parseSilenceRanges(silenceOutput)
    if (loudness.integratedLufs === undefined || loudness.truePeakDb === undefined) {
      return blockedAudio('source_audio_loudness_parse_failed')
    }
    const noiseCondition = classifyNoise(stats.noiseFloorDb)
    return {
      status: 'completed',
      integratedLufs: loudness.integratedLufs,
      truePeakDb: loudness.truePeakDb,
      peakDb: stats.peakDb,
      rmsDb: stats.rmsDb,
      noiseFloorDb: stats.noiseFloorDb,
      clippingDetected: (stats.peakDb ?? loudness.truePeakDb) > -0.1,
      noiseCondition,
      silenceRanges,
      analysisMethods: ['ffmpeg_loudnorm_measurement', 'ffmpeg_astats_measurement', 'ffmpeg_silencedetect_measurement'],
      blockers: [],
      warnings: [
        noiseCondition === 'not_measured'
          ? 'Noise-floor evidence was unavailable; the planner must not authorize denoise from loudness evidence alone.'
          : 'Noise condition is a deterministic signal measurement, not a perceptual listening verdict.',
      ],
    }
  } catch (error) {
    return blockedAudio('source_audio_measurement_failed', safeError(error))
  }
}

export async function analyzeEditVisualRhythmEvidence(input: {
  sourceVideoLocalPath: string
  durationSeconds: number
  ffmpegBin: string
  timeoutMs: number
  sceneThreshold?: number
}): Promise<FfmpegEditVisualRhythmEvidence> {
  assertPrivateInputPath(input.sourceVideoLocalPath)
  const threshold = clamp(input.sceneThreshold ?? 0.32, 0.15, 0.65)
  try {
    const output = await runFfmpeg(input.ffmpegBin, [
      '-hide_banner', '-nostdin', '-i', input.sourceVideoLocalPath,
      '-filter:v', `select=gt(scene\\,${threshold}),showinfo`, '-an', '-f', 'null', '-',
    ], input.timeoutMs)
    const cutTimes = uniqueNumbers([...output.matchAll(/pts_time:([0-9]+(?:\.[0-9]+)?)/g)]
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0 && value < input.durationSeconds))
    const shotCount = Math.max(1, cutTimes.length + 1)
    const averageShotDurationSeconds = input.durationSeconds > 0
      ? Number((input.durationSeconds / shotCount).toFixed(3))
      : undefined
    return {
      status: 'completed',
      detectedCutTimesSeconds: cutTimes,
      detectedCutCount: cutTimes.length,
      averageShotDurationSeconds,
      pacingClass: classifyPacing(averageShotDurationSeconds),
      threshold,
      analysisMethods: ['ffmpeg_scene_change_measurement'],
      blockers: [],
      warnings: ['Scene-change measurements describe observed visual cuts only; they do not prescribe edit pacing.'],
    }
  } catch (error) {
    return {
      status: 'blocked', detectedCutTimesSeconds: [], detectedCutCount: 0,
      pacingClass: 'unknown', threshold, analysisMethods: [],
      blockers: ['source_visual_rhythm_measurement_failed'], warnings: [safeError(error)],
    }
  }
}

export async function analyzeEditColorEvidence(input: {
  sourceVideoLocalPath: string
  ffmpegBin: string
  timeoutMs: number
}): Promise<FfmpegEditColorEvidence> {
  assertPrivateInputPath(input.sourceVideoLocalPath)
  try {
    const output = await runFfmpeg(input.ffmpegBin, [
      '-hide_banner', '-nostdin', '-i', input.sourceVideoLocalPath,
      '-filter:v', 'fps=1/2,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-',
    ], input.timeoutMs)
    const luma = metricValues(output, 'YAVG')
    const lumaMin = metricValues(output, 'YMIN')
    const lumaMax = metricValues(output, 'YMAX')
    const saturation = metricValues(output, 'SATAVG')
    if (luma.length === 0) {
      return blockedColor('source_color_measurement_parse_failed')
    }
    const averageLuma = average(luma)
    const minimumLuma = lumaMin.length > 0 ? Math.min(...lumaMin) : undefined
    const maximumLuma = lumaMax.length > 0 ? Math.max(...lumaMax) : undefined
    const contrastSpan = minimumLuma !== undefined && maximumLuma !== undefined ? maximumLuma - minimumLuma : undefined
    return {
      status: 'completed', sampledFrameCount: luma.length,
      averageLuma, minimumLuma, maximumLuma,
      averageSaturation: saturation.length > 0 ? average(saturation) : undefined,
      exposureCondition: averageLuma < 72 ? 'dark' : averageLuma > 188 ? 'bright' : 'balanced',
      contrastCondition: contrastSpan === undefined ? 'not_measured' : contrastSpan < 110 ? 'low' : contrastSpan > 235 ? 'high' : 'balanced',
      analysisMethods: ['ffmpeg_signalstats_measurement'], blockers: [],
      warnings: ['Signal statistics support correction decisions but do not replace skin-tone or creative color review.'],
    }
  } catch (error) {
    return blockedColor('source_color_measurement_failed', safeError(error))
  }
}

async function runFfmpeg(command: string, args: string[], timeoutMs: number): Promise<string> {
  const result = await execFileAsync(command, args, {
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  })
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
}

function parseLoudness(output: string): { integratedLufs?: number; truePeakDb?: number } {
  const matches = [...output.matchAll(/\{[\s\S]*?"input_i"[\s\S]*?\}/g)]
  const candidate = matches.at(-1)?.[0]
  if (!candidate) return {}
  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>
    return { integratedLufs: finiteNumber(parsed.input_i), truePeakDb: finiteNumber(parsed.input_tp) }
  } catch {
    return {}
  }
}

function parseAstats(output: string): { peakDb?: number; rmsDb?: number; noiseFloorDb?: number } {
  return {
    peakDb: lastMetric(output, /Peak level dB:\s*(-?(?:inf|[0-9]+(?:\.[0-9]+)?))/gi),
    rmsDb: lastMetric(output, /RMS level dB:\s*(-?(?:inf|[0-9]+(?:\.[0-9]+)?))/gi),
    noiseFloorDb: lastMetric(output, /Noise floor dB:\s*(-?(?:inf|[0-9]+(?:\.[0-9]+)?))/gi),
  }
}

function parseSilenceRanges(output: string): Array<{ startSeconds: number; endSeconds: number }> {
  const starts = [...output.matchAll(/silence_start:\s*([0-9]+(?:\.[0-9]+)?)/g)].map((match) => Number(match[1]))
  const ends = [...output.matchAll(/silence_end:\s*([0-9]+(?:\.[0-9]+)?)/g)].map((match) => Number(match[1]))
  return starts.flatMap((start, index) => Number.isFinite(start) && Number.isFinite(ends[index]) && ends[index] > start
    ? [{ startSeconds: Number(start.toFixed(3)), endSeconds: Number(ends[index].toFixed(3)) }]
    : [])
}

function metricValues(output: string, key: string): number[] {
  const pattern = new RegExp(`lavfi\\.signalstats\\.${key}=(-?[0-9]+(?:\\.[0-9]+)?)`, 'g')
  return [...output.matchAll(pattern)].map((match) => Number(match[1])).filter(Number.isFinite)
}

function lastMetric(output: string, pattern: RegExp): number | undefined {
  const values = [...output.matchAll(pattern)].map((match) => match[1].toLowerCase() === '-inf' ? undefined : Number(match[1]))
  return values.reverse().find((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

function finiteNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined
}

function classifyNoise(noiseFloorDb?: number): FfmpegEditAudioEvidence['noiseCondition'] {
  if (noiseFloorDb === undefined) return 'not_measured'
  if (noiseFloorDb <= -55) return 'low'
  if (noiseFloorDb <= -38) return 'moderate'
  return 'high'
}

function classifyPacing(value?: number): FfmpegEditVisualRhythmEvidence['pacingClass'] {
  if (value === undefined) return 'unknown'
  if (value >= 8) return 'slow'
  if (value >= 4) return 'measured'
  if (value >= 1.8) return 'quick'
  return 'rapid'
}

function blockedAudio(code: string, warning = 'Audio evidence could not be measured safely.'): FfmpegEditAudioEvidence {
  return { status: 'blocked', clippingDetected: false, noiseCondition: 'not_measured', silenceRanges: [], analysisMethods: [], blockers: [code], warnings: [warning] }
}

function blockedColor(code: string, warning = 'Color evidence could not be measured safely.'): FfmpegEditColorEvidence {
  return { status: 'blocked', sampledFrameCount: 0, exposureCondition: 'not_measured', contrastCondition: 'not_measured', analysisMethods: [], blockers: [code], warnings: [warning] }
}

function assertPrivateInputPath(value: string): void {
  assertNoSignedUrlOrRawUrl(value, 'privateMediaInputPath')
  if (!existsSync(value)) throw new Error('Private media input does not exist.')
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/(?:sk-|key-|token-)[a-z0-9_-]+/gi, '[redacted]').slice(0, 800)
}

function average(values: number[]): number {
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(3))))].sort((left, right) => left - right)
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
