import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { PreferenceTechnicalColorSignalEvidence } from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)

interface FFprobeColorStream {
  pix_fmt?: string
  color_space?: string
  color_transfer?: string
  color_primaries?: string
  color_range?: string
}

interface SignalFrame {
  sampleTimeSeconds: number
  lumaAverage: number
  lumaMinimum: number
  lumaMaximum: number
  lumaLow: number
  lumaHigh: number
  saturationAverage: number
  saturationLow: number
  saturationHigh: number
  chromaUAverage: number
  chromaVAverage: number
  temporalLumaDifference: number
  temporalUDifference: number
  temporalVDifference: number
  outOfRangePixelRatio?: number
}

const TECHNICAL_COLOR_SIGNAL_SCHEMA_VERSION = 'edit-reference-technical-color-signal-v2' as const

/**
 * Measures bounded technical signal characteristics for Edit Reference B6.
 * It never infers a creative grade, palette, skin tone, LUT, or target transform.
 */
export async function runEditReferenceColorSignalStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  ffprobeBin: string
  timeoutMs: number
  durationSeconds: number
  maxSampleCount?: number
  maxScanDurationSeconds?: number
}): Promise<PreferenceTechnicalColorSignalEvidence> {
  const maxSampleCount = Math.round(boundedNumber(input.maxSampleCount, 12, 1, 24))
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = Number(Math.min(sourceDurationSeconds, maxScanDurationSeconds).toFixed(3))

  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceColorSignalResult({
      maxSampleCount,
      blockerCode: 'color_signal_duration_unavailable',
      blockerMessage: 'A bounded color signal check needs a verified positive media duration.',
    })
  }

  const coverage: PreferenceTechnicalColorSignalEvidence['coverage'] = sourceDurationSeconds <= maxScanDurationSeconds + 0.001
    ? 'full'
    : 'partial'

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const metadata = await readColorMetadata(input)
    const sampleIntervalSeconds = Math.max(scannedDurationSeconds / maxSampleCount, 0.1)
    const filter = [
      'setpts=PTS-STARTPTS',
      `fps=1/${formatFilterNumber(sampleIntervalSeconds)}`,
      'format=yuv444p',
      'signalstats=stat=brng',
      'metadata=print:file=-',
    ].join(',')
    const args = [
      '-hide_banner',
      '-nostdin',
      '-loglevel',
      'error',
      '-i',
      input.sourceLocalPath,
      '-t',
      String(scannedDurationSeconds),
      '-map',
      '0:v:0',
      '-vf',
      filter,
      '-frames:v',
      String(maxSampleCount),
      '-an',
      '-f',
      'null',
      '-',
    ]
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceColorSignalArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8',
    })
    const frames = parseSignalFrames(output.stdout, maxSampleCount, sampleIntervalSeconds, scannedDurationSeconds)
    if (frames.length === 0) {
      return createBlockedEditReferenceColorSignalResult({
        maxSampleCount,
        scannedDurationSeconds,
        coverage,
        blockerCode: 'color_signal_samples_unavailable',
        blockerMessage: 'The bounded color signal check returned no valid technical samples.',
      })
    }

    return {
      schemaVersion: TECHNICAL_COLOR_SIGNAL_SCHEMA_VERSION,
      status: 'verified_local_bounded',
      maxSampleCount,
      sampleCount: frames.length,
      sampleTimesSeconds: frames.map((frame) => frame.sampleTimeSeconds),
      sampleIntervalSeconds: rounded(sampleIntervalSeconds),
      scannedDurationSeconds,
      coverage,
      ...metadata,
      hdrTransfer: classifyHdrTransfer(metadata.colorTransfer),
      lumaAverage8Bit: average(frames.map((frame) => frame.lumaAverage)),
      lumaObservedMinimum8Bit: minimum(frames.map((frame) => frame.lumaMinimum)),
      lumaObservedMaximum8Bit: maximum(frames.map((frame) => frame.lumaMaximum)),
      lumaAverageSpread8Bit: spread(frames.map((frame) => frame.lumaAverage)),
      lumaLowAverage8Bit: average(frames.map((frame) => frame.lumaLow)),
      lumaHighAverage8Bit: average(frames.map((frame) => frame.lumaHigh)),
      lumaRobustRangeAverage8Bit: average(frames.map((frame) => frame.lumaHigh - frame.lumaLow)),
      lumaRobustRangeSpread8Bit: spread(frames.map((frame) => frame.lumaHigh - frame.lumaLow)),
      saturationAverage8Bit: average(frames.map((frame) => frame.saturationAverage)),
      saturationAverageSpread8Bit: spread(frames.map((frame) => frame.saturationAverage)),
      saturationLowAverage8Bit: average(frames.map((frame) => frame.saturationLow)),
      saturationHighAverage8Bit: average(frames.map((frame) => frame.saturationHigh)),
      saturationRobustRangeAverage8Bit: average(frames.map((frame) => frame.saturationHigh - frame.saturationLow)),
      chromaUAverage8Bit: average(frames.map((frame) => frame.chromaUAverage)),
      chromaUAverageSpread8Bit: spread(frames.map((frame) => frame.chromaUAverage)),
      chromaVAverage8Bit: average(frames.map((frame) => frame.chromaVAverage)),
      chromaVAverageSpread8Bit: spread(frames.map((frame) => frame.chromaVAverage)),
      temporalLumaDifferenceAverage8Bit: average(frames.map((frame) => frame.temporalLumaDifference)),
      temporalChromaDifferenceAverage8Bit: average(frames.map((frame) => (
        frame.temporalUDifference + frame.temporalVDifference
      ) / 2)),
      ...outOfRangeSummary(frames),
      technicalDistributionAnalysisRan: true,
      colorRangeViolationScanRan: frames.every((frame) => frame.outOfRangePixelRatio !== undefined),
      semanticColorAnalysisRan: false,
      whiteBalanceInferenceRan: false,
      temperatureInferenceRan: false,
      skinToneAnalysisRan: false,
      shotMatchAnalysisRan: false,
      lutReconstructionRan: false,
      rawFramePixelsPersisted: false,
      rawHistogramPersisted: false,
      rawProcessOutputPersisted: false,
    }
  } catch {
    return createBlockedEditReferenceColorSignalResult({
      maxSampleCount,
      scannedDurationSeconds,
      coverage,
      blockerCode: 'ffmpeg_color_signal_scan_failed',
      blockerMessage: 'The bounded technical color signal check did not complete. No raw process output was persisted.',
    })
  }
}

export function createNotRunEditReferenceColorSignalResult(): PreferenceTechnicalColorSignalEvidence {
  return {
    schemaVersion: TECHNICAL_COLOR_SIGNAL_SCHEMA_VERSION,
    status: 'not_run',
    maxSampleCount: 12,
    sampleCount: 0,
    sampleTimesSeconds: [],
    scannedDurationSeconds: 0,
    coverage: 'not_run',
    hdrTransfer: 'unknown',
    technicalDistributionAnalysisRan: false,
    colorRangeViolationScanRan: false,
    semanticColorAnalysisRan: false,
    whiteBalanceInferenceRan: false,
    temperatureInferenceRan: false,
    skinToneAnalysisRan: false,
    shotMatchAnalysisRan: false,
    lutReconstructionRan: false,
    rawFramePixelsPersisted: false,
    rawHistogramPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

export function createBlockedEditReferenceColorSignalResult(input: {
  maxSampleCount?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalColorSignalEvidence['coverage']
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalColorSignalEvidence {
  return {
    schemaVersion: TECHNICAL_COLOR_SIGNAL_SCHEMA_VERSION,
    status: 'blocked',
    maxSampleCount: input.maxSampleCount ?? 12,
    sampleCount: 0,
    sampleTimesSeconds: [],
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    hdrTransfer: 'unknown',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    technicalDistributionAnalysisRan: false,
    colorRangeViolationScanRan: false,
    semanticColorAnalysisRan: false,
    whiteBalanceInferenceRan: false,
    temperatureInferenceRan: false,
    skinToneAnalysisRan: false,
    shotMatchAnalysisRan: false,
    lutReconstructionRan: false,
    rawFramePixelsPersisted: false,
    rawHistogramPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

async function readColorMetadata(input: {
  sourceLocalPath: string
  ffprobeBin: string
  timeoutMs: number
}): Promise<Partial<Pick<PreferenceTechnicalColorSignalEvidence,
  'pixelFormat' | 'colorSpace' | 'colorTransfer' | 'colorPrimaries' | 'colorRange'
>>> {
  const args = [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=pix_fmt,color_space,color_transfer,color_primaries,color_range',
    '-of',
    'json',
    input.sourceLocalPath,
  ]
  for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceColorMetadataArg')
  const output = await execFileAsync(input.ffprobeBin, args, {
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: 256 * 1024,
    encoding: 'utf8',
  })
  const parsed = JSON.parse(output.stdout || '{}') as { streams?: FFprobeColorStream[] }
  const stream = Array.isArray(parsed.streams) ? parsed.streams[0] : undefined
  const metadata: Partial<Pick<PreferenceTechnicalColorSignalEvidence,
    'pixelFormat' | 'colorSpace' | 'colorTransfer' | 'colorPrimaries' | 'colorRange'
  >> = {}
  assignMetadataToken(metadata, 'pixelFormat', stream?.pix_fmt)
  assignMetadataToken(metadata, 'colorSpace', stream?.color_space)
  assignMetadataToken(metadata, 'colorTransfer', stream?.color_transfer)
  assignMetadataToken(metadata, 'colorPrimaries', stream?.color_primaries)
  assignMetadataToken(metadata, 'colorRange', stream?.color_range)
  return metadata
}

function parseSignalFrames(
  stdout: string,
  maxSampleCount: number,
  sampleIntervalSeconds: number,
  scannedDurationSeconds: number,
): SignalFrame[] {
  const frames: SignalFrame[] = []
  for (const block of stdout.split(/(?=frame:\d+)/)) {
    const lumaAverage = signalByteValue(block, 'YAVG')
    const lumaMinimum = signalByteValue(block, 'YMIN')
    const lumaMaximum = signalByteValue(block, 'YMAX')
    const lumaLow = signalByteValue(block, 'YLOW')
    const lumaHigh = signalByteValue(block, 'YHIGH')
    const saturationAverage = signalByteValue(block, 'SATAVG')
    const saturationLow = signalByteValue(block, 'SATLOW')
    const saturationHigh = signalByteValue(block, 'SATHIGH')
    const chromaUAverage = signalByteValue(block, 'UAVG')
    const chromaVAverage = signalByteValue(block, 'VAVG')
    const temporalLumaDifference = signalByteValue(block, 'YDIF')
    const temporalUDifference = signalByteValue(block, 'UDIF')
    const temporalVDifference = signalByteValue(block, 'VDIF')
    if ([
      lumaAverage,
      lumaMinimum,
      lumaMaximum,
      lumaLow,
      lumaHigh,
      saturationAverage,
      saturationLow,
      saturationHigh,
      chromaUAverage,
      chromaVAverage,
      temporalLumaDifference,
      temporalUDifference,
      temporalVDifference,
    ].some((value) => value === undefined)) continue
    const parsedTime = frameTimeSeconds(block)
    const fallbackTime = frames.length * sampleIntervalSeconds
    frames.push({
      sampleTimeSeconds: rounded(Math.min(parsedTime ?? fallbackTime, scannedDurationSeconds)),
      lumaAverage: lumaAverage!,
      lumaMinimum: lumaMinimum!,
      lumaMaximum: lumaMaximum!,
      lumaLow: lumaLow!,
      lumaHigh: lumaHigh!,
      saturationAverage: saturationAverage!,
      saturationLow: saturationLow!,
      saturationHigh: saturationHigh!,
      chromaUAverage: chromaUAverage!,
      chromaVAverage: chromaVAverage!,
      temporalLumaDifference: temporalLumaDifference!,
      temporalUDifference: temporalUDifference!,
      temporalVDifference: temporalVDifference!,
      outOfRangePixelRatio: signalRatioValue(block, 'BRNG'),
    })
    if (frames.length >= maxSampleCount) break
  }
  return frames
}

function rawSignalValue(block: string, key: string): number | undefined {
  const match = block.match(new RegExp(`(?:^|\\n)lavfi\\.signalstats\\.${key}=([^\\r\\n]+)`))
  const value = match ? Number(match[1]) : Number.NaN
  return Number.isFinite(value) ? value : undefined
}

function signalByteValue(block: string, key: string): number | undefined {
  const value = rawSignalValue(block, key)
  return value !== undefined && value >= 0 && value <= 255 ? value : undefined
}

function signalRatioValue(block: string, key: string): number | undefined {
  const value = rawSignalValue(block, key)
  return value !== undefined && value >= 0 && value <= 1 ? value : undefined
}

function frameTimeSeconds(block: string): number | undefined {
  const match = block.match(/(?:^|\n)frame:\d+\s+pts:[^\s]+\s+pts_time:([^\s\r\n]+)/)
  const value = match ? Number(match[1]) : Number.NaN
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function outOfRangeSummary(frames: SignalFrame[]): Pick<PreferenceTechnicalColorSignalEvidence,
  'outOfRangePixelRatioAverage' | 'outOfRangePixelRatioMaximum'
> | Record<string, never> {
  const values = frames
    .map((frame) => frame.outOfRangePixelRatio)
    .filter((value): value is number => value !== undefined)
  if (values.length === 0) return {}
  return {
    outOfRangePixelRatioAverage: rounded(
      values.reduce((total, value) => total + value, 0) / values.length,
      6,
    ),
    outOfRangePixelRatioMaximum: rounded(Math.max(...values), 6),
  }
}

function classifyHdrTransfer(value: string | undefined): PreferenceTechnicalColorSignalEvidence['hdrTransfer'] {
  if (!value) return 'unknown'
  if (value === 'smpte2084') return 'pq'
  if (value === 'arib-std-b67') return 'hlg'
  return 'not_hdr_signaled'
}

function safeMetadataToken(value: string | undefined): string | undefined {
  if (!value || value.length > 64 || !/^[a-zA-Z0-9_.:+-]+$/.test(value)) return undefined
  return value
}

function assignMetadataToken(
  target: Partial<Pick<PreferenceTechnicalColorSignalEvidence,
    'pixelFormat' | 'colorSpace' | 'colorTransfer' | 'colorPrimaries' | 'colorRange'
  >>,
  key: 'pixelFormat' | 'colorSpace' | 'colorTransfer' | 'colorPrimaries' | 'colorRange',
  value: string | undefined,
): void {
  const safeValue = safeMetadataToken(value)
  if (safeValue !== undefined) target[key] = safeValue
}

function average(values: number[]): number {
  return rounded(values.reduce((total, value) => total + value, 0) / values.length)
}

function minimum(values: number[]): number {
  return rounded(Math.min(...values))
}

function maximum(values: number[]): number {
  return rounded(Math.max(...values))
}

function spread(values: number[]): number {
  return rounded(Math.max(...values) - Math.min(...values))
}

function rounded(value: number, precision = 3): number {
  return Number(value.toFixed(precision))
}

function formatFilterNumber(value: number): string {
  return Number(value.toFixed(6)).toString()
}

function boundedNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.max(minimum, Math.min(maximum, value))
}
