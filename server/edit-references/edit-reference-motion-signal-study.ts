import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  PreferenceTechnicalMotionSignalEvidence,
  PreferenceTechnicalMotionSignalPeak,
} from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)
const TECHNICAL_MOTION_SIGNAL_SCHEMA_VERSION = 'edit-reference-technical-motion-signal-v1' as const

interface DifferenceSample {
  sampleTimeSeconds: number
  lumaDifferenceAverage: number
  chromaDifferenceAverage: number
}

/**
 * Measures bounded pixel differences between sampled adjacent frames for Edit
 * Reference B8. It cannot distinguish camera movement, subject motion, cuts,
 * flashes, captions, graphics, or transitions and never labels any of them.
 */
export async function runEditReferenceMotionSignalStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  maxSampleCount?: number
  maxPeakCount?: number
  maxScanDurationSeconds?: number
  activityThreshold8Bit?: number
  highActivityThreshold8Bit?: number
}): Promise<PreferenceTechnicalMotionSignalEvidence> {
  const maxSampleCount = Math.round(boundedNumber(input.maxSampleCount, 24, 2, 24))
  const maxPeakCount = Math.round(boundedNumber(input.maxPeakCount, 6, 1, 12))
  const activityThreshold8Bit = boundedNumber(input.activityThreshold8Bit, 1, 0.1, 255)
  const highActivityThreshold8Bit = boundedNumber(input.highActivityThreshold8Bit, 10, activityThreshold8Bit, 255)
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = rounded(Math.min(sourceDurationSeconds, maxScanDurationSeconds))

  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceMotionSignalResult({
      maxSampleCount,
      maxPeakCount,
      activityThreshold8Bit,
      highActivityThreshold8Bit,
      blockerCode: 'motion_signal_duration_unavailable',
      blockerMessage: 'A bounded frame-difference check needs a verified positive media duration.',
    })
  }

  const coverage: PreferenceTechnicalMotionSignalEvidence['coverage'] = sourceDurationSeconds <= maxScanDurationSeconds + 0.001
    ? 'full'
    : 'partial'

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const sampleIntervalSeconds = Math.max(scannedDurationSeconds / maxSampleCount, 0.04)
    const filter = [
      'setpts=PTS-STARTPTS',
      `fps=1/${formatFilterNumber(sampleIntervalSeconds)}`,
      'format=yuv444p',
      'tblend=all_mode=difference',
      'signalstats',
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
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceMotionSignalArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8',
    })
    const samples = parseDifferenceSamples(
      output.stdout,
      maxSampleCount,
      sampleIntervalSeconds,
      scannedDurationSeconds,
    )
    if (samples.length === 0) {
      return createBlockedEditReferenceMotionSignalResult({
        maxSampleCount,
        maxPeakCount,
        scannedDurationSeconds,
        coverage,
        activityThreshold8Bit,
        highActivityThreshold8Bit,
        blockerCode: 'motion_signal_samples_unavailable',
        blockerMessage: 'The bounded frame-difference check returned no valid technical samples.',
      })
    }

    const lumaValues = samples.map((sample) => sample.lumaDifferenceAverage)
    const chromaValues = samples.map((sample) => sample.chromaDifferenceAverage)
    const activeSampleCount = lumaValues.filter((value) => value >= activityThreshold8Bit).length
    const highActivitySampleCount = lumaValues.filter((value) => value >= highActivityThreshold8Bit).length

    return {
      schemaVersion: TECHNICAL_MOTION_SIGNAL_SCHEMA_VERSION,
      status: 'verified_local_bounded',
      maxSampleCount,
      maxPeakCount,
      sampleCount: samples.length,
      sampleTimesSeconds: samples.map((sample) => sample.sampleTimeSeconds),
      sampleIntervalSeconds: rounded(sampleIntervalSeconds),
      scannedDurationSeconds,
      coverage,
      activityThreshold8Bit: rounded(activityThreshold8Bit),
      highActivityThreshold8Bit: rounded(highActivityThreshold8Bit),
      lumaDifferenceAverage8Bit: average(lumaValues),
      lumaDifferenceMaximum8Bit: maximum(lumaValues),
      lumaDifferenceSpread8Bit: spread(lumaValues),
      lumaDifferenceMedian8Bit: percentile(lumaValues, 0.5),
      lumaDifference90thPercentile8Bit: percentile(lumaValues, 0.9),
      chromaDifferenceAverage8Bit: average(chromaValues),
      chromaDifferenceMaximum8Bit: maximum(chromaValues),
      activeSampleCount,
      activeSampleRatio: ratio(activeSampleCount, samples.length),
      highActivitySampleCount,
      highActivitySampleRatio: ratio(highActivitySampleCount, samples.length),
      peakSamples: peakSamples(samples, maxPeakCount),
      technicalFrameDifferenceAnalysisRan: true,
      semanticMotionAnalysisRan: false,
      cameraMotionInferenceRan: false,
      objectTrackingRan: false,
      transitionClassificationRan: false,
      graphicsEntryExitAnalysisRan: false,
      opticalFlowAnalysisRan: false,
      rawFramePixelsPersisted: false,
      rawDifferenceFramesPersisted: false,
      rawHistogramPersisted: false,
      rawProcessOutputPersisted: false,
    }
  } catch {
    return createBlockedEditReferenceMotionSignalResult({
      maxSampleCount,
      maxPeakCount,
      scannedDurationSeconds,
      coverage,
      activityThreshold8Bit,
      highActivityThreshold8Bit,
      blockerCode: 'ffmpeg_motion_signal_scan_failed',
      blockerMessage: 'The bounded technical frame-difference check did not complete. No raw process output was persisted.',
    })
  }
}

export function createNotRunEditReferenceMotionSignalResult(): PreferenceTechnicalMotionSignalEvidence {
  return baseUnresolvedResult({
    status: 'not_run',
    maxSampleCount: 24,
    maxPeakCount: 6,
    activityThreshold8Bit: 1,
    highActivityThreshold8Bit: 10,
  })
}

export function createBlockedEditReferenceMotionSignalResult(input: {
  maxSampleCount?: number
  maxPeakCount?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalMotionSignalEvidence['coverage']
  activityThreshold8Bit?: number
  highActivityThreshold8Bit?: number
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalMotionSignalEvidence {
  return {
    ...baseUnresolvedResult({
      status: 'blocked',
      maxSampleCount: input.maxSampleCount ?? 24,
      maxPeakCount: input.maxPeakCount ?? 6,
      scannedDurationSeconds: input.scannedDurationSeconds,
      coverage: input.coverage,
      activityThreshold8Bit: input.activityThreshold8Bit ?? 1,
      highActivityThreshold8Bit: input.highActivityThreshold8Bit ?? 10,
    }),
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
  }
}

function baseUnresolvedResult(input: {
  status: 'blocked' | 'not_run'
  maxSampleCount: number
  maxPeakCount: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalMotionSignalEvidence['coverage']
  activityThreshold8Bit: number
  highActivityThreshold8Bit: number
}): PreferenceTechnicalMotionSignalEvidence {
  return {
    schemaVersion: TECHNICAL_MOTION_SIGNAL_SCHEMA_VERSION,
    status: input.status,
    maxSampleCount: input.maxSampleCount,
    maxPeakCount: input.maxPeakCount,
    sampleCount: 0,
    sampleTimesSeconds: [],
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    activityThreshold8Bit: rounded(input.activityThreshold8Bit),
    highActivityThreshold8Bit: rounded(input.highActivityThreshold8Bit),
    activeSampleCount: 0,
    activeSampleRatio: 0,
    highActivitySampleCount: 0,
    highActivitySampleRatio: 0,
    peakSamples: [],
    technicalFrameDifferenceAnalysisRan: false,
    semanticMotionAnalysisRan: false,
    cameraMotionInferenceRan: false,
    objectTrackingRan: false,
    transitionClassificationRan: false,
    graphicsEntryExitAnalysisRan: false,
    opticalFlowAnalysisRan: false,
    rawFramePixelsPersisted: false,
    rawDifferenceFramesPersisted: false,
    rawHistogramPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function parseDifferenceSamples(
  stdout: string,
  maxSampleCount: number,
  sampleIntervalSeconds: number,
  scannedDurationSeconds: number,
): DifferenceSample[] {
  const samples: DifferenceSample[] = []
  for (const block of stdout.split(/(?=frame:\d+)/)) {
    const lumaDifferenceAverage = signalByteValue(block, 'YAVG')
    const chromaUDifferenceAverage = signalByteValue(block, 'UAVG')
    const chromaVDifferenceAverage = signalByteValue(block, 'VAVG')
    if (
      lumaDifferenceAverage === undefined
      || chromaUDifferenceAverage === undefined
      || chromaVDifferenceAverage === undefined
    ) continue
    const parsedTime = frameTimeSeconds(block)
    const fallbackTime = (samples.length + 1) * sampleIntervalSeconds
    samples.push({
      sampleTimeSeconds: rounded(Math.min(parsedTime ?? fallbackTime, scannedDurationSeconds)),
      lumaDifferenceAverage,
      chromaDifferenceAverage: rounded((chromaUDifferenceAverage + chromaVDifferenceAverage) / 2),
    })
    if (samples.length >= maxSampleCount) break
  }
  return samples
}

function peakSamples(samples: DifferenceSample[], maxPeakCount: number): PreferenceTechnicalMotionSignalPeak[] {
  return [...samples]
    .sort((left, right) => (
      right.lumaDifferenceAverage - left.lumaDifferenceAverage
      || left.sampleTimeSeconds - right.sampleTimeSeconds
    ))
    .slice(0, maxPeakCount)
    .map((sample) => ({
      sampleTimeSeconds: sample.sampleTimeSeconds,
      lumaDifferenceAverage8Bit: rounded(sample.lumaDifferenceAverage),
    }))
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

function frameTimeSeconds(block: string): number | undefined {
  const match = block.match(/(?:^|\n)frame:\d+\s+pts:[^\s]+\s+pts_time:([^\s\r\n]+)/)
  const value = match ? Number(match[1]) : Number.NaN
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function average(values: number[]): number {
  return rounded(values.reduce((total, value) => total + value, 0) / values.length)
}

function maximum(values: number[]): number {
  return rounded(Math.max(...values))
}

function spread(values: number[]): number {
  return rounded(Math.max(...values) - Math.min(...values))
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right)
  return rounded(sorted[Math.round((sorted.length - 1) * fraction)])
}

function ratio(count: number, total: number): number {
  return rounded(total > 0 ? count / total : 0, 6)
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
