import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  PreferenceTechnicalEdgeWidthSignalEvidence,
  PreferenceTechnicalEdgeWidthSignalSample,
} from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)
const SCHEMA_VERSION = 'edit-reference-technical-edge-width-signal-v1' as const
const DEFAULT_MAX_SAMPLE_COUNT = 24
const DEFAULT_OUTPUT_MAX_DIMENSION = 320
const DEFAULT_HIGH_THRESHOLD = 0.117647
const DEFAULT_LOW_THRESHOLD = 0.0588235
const DEFAULT_RADIUS = 50
const DEFAULT_BLOCK_PERCENTILE = 80
const DEFAULT_BLOCK_WIDTH = 32
const DEFAULT_BLOCK_HEIGHT = 32

/**
 * Samples FFmpeg blurdetect's dimensionless edge-width metadata for Edit
 * Reference B1. The score is a technical proxy only. It is not a semantic
 * blur, focus, obstruction, depth-of-field, source-quality, or edit decision.
 */
export async function runEditReferenceEdgeWidthSignalStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  maxSampleCount?: number
  maxScanDurationSeconds?: number
  outputMaxDimension?: number
  highThreshold?: number
  lowThreshold?: number
  radius?: number
  blockPercentile?: number
  blockWidth?: number
  blockHeight?: number
}): Promise<PreferenceTechnicalEdgeWidthSignalEvidence> {
  const maxSampleCount = Math.round(boundedNumber(input.maxSampleCount, DEFAULT_MAX_SAMPLE_COUNT, 1, 24))
  const outputMaxDimension = Math.round(boundedNumber(input.outputMaxDimension, DEFAULT_OUTPUT_MAX_DIMENSION, 64, 640))
  const highThreshold = boundedNumber(input.highThreshold, DEFAULT_HIGH_THRESHOLD, 0, 1)
  const lowThreshold = boundedNumber(input.lowThreshold, DEFAULT_LOW_THRESHOLD, 0, highThreshold)
  const radius = Math.round(boundedNumber(input.radius, DEFAULT_RADIUS, 1, 100))
  const blockPercentile = Math.round(boundedNumber(input.blockPercentile, DEFAULT_BLOCK_PERCENTILE, 1, 100))
  const blockWidth = evenInteger(input.blockWidth, DEFAULT_BLOCK_WIDTH, 4, 128)
  const blockHeight = evenInteger(input.blockHeight, DEFAULT_BLOCK_HEIGHT, 4, 128)
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = rounded(Math.min(sourceDurationSeconds, maxScanDurationSeconds))
  const settings = {
    maxSampleCount,
    outputMaxDimension,
    highThreshold: rounded(highThreshold, 7),
    lowThreshold: rounded(lowThreshold, 7),
    radius,
    blockPercentile,
    blockWidth,
    blockHeight,
  }

  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceEdgeWidthSignalResult({
      ...settings,
      blockerCode: 'edge_width_signal_duration_unavailable',
      blockerMessage: 'A bounded technical edge-width check needs a verified positive media duration.',
    })
  }
  const coverage: PreferenceTechnicalEdgeWidthSignalEvidence['coverage'] = (
    sourceDurationSeconds <= maxScanDurationSeconds + 0.001 ? 'full' : 'partial'
  )

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const sampleIntervalSeconds = Math.max(scannedDurationSeconds / maxSampleCount, 0.1)
    const filter = [
      'setpts=PTS-STARTPTS',
      `fps=1/${formatFilterNumber(sampleIntervalSeconds)}`,
      `scale=${outputMaxDimension}:${outputMaxDimension}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
      'format=gray',
      [
        `blurdetect=high=${formatFilterNumber(highThreshold)}`,
        `low=${formatFilterNumber(lowThreshold)}`,
        `radius=${radius}`,
        `block_pct=${blockPercentile}`,
        `block_width=${blockWidth}`,
        `block_height=${blockHeight}`,
      ].join(':'),
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
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceEdgeWidthSignalArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
      encoding: 'utf8',
    })
    const parsed = parseEdgeWidthSamples(
      output.stdout,
      maxSampleCount,
      sampleIntervalSeconds,
      scannedDurationSeconds,
    )
    if (parsed.attemptedSampleCount === 0) {
      return createBlockedEditReferenceEdgeWidthSignalResult({
        ...settings,
        scannedDurationSeconds,
        coverage,
        blockerCode: 'edge_width_signal_samples_unavailable',
        blockerMessage: 'The bounded technical edge-width check returned no sample metadata.',
      })
    }

    const samples = parsed.samples
    const scores = samples.map((sample) => sample.score)
    return {
      schemaVersion: SCHEMA_VERSION,
      status: 'verified_local_bounded',
      ...settings,
      attemptedSampleCount: parsed.attemptedSampleCount,
      sampleCount: samples.length,
      unmeasurableSampleCount: parsed.attemptedSampleCount - samples.length,
      samples,
      sampleIntervalSeconds: rounded(sampleIntervalSeconds),
      scannedDurationSeconds,
      coverage,
      ...(scores.length > 0 ? {
        scoreAverage: average(scores),
        scoreMedian: percentile(scores, 0.5),
        scoreMinimum: minimum(scores),
        scoreMaximum: maximum(scores),
        scoreSpread: rounded(maximum(scores) - minimum(scores), 6),
      } : {}),
      ...capabilityFlags(true),
    }
  } catch {
    return createBlockedEditReferenceEdgeWidthSignalResult({
      ...settings,
      scannedDurationSeconds,
      coverage,
      blockerCode: 'ffmpeg_edge_width_signal_scan_failed',
      blockerMessage: 'The bounded FFmpeg edge-width check did not complete. No raw process output was persisted.',
    })
  }
}

export function createNotRunEditReferenceEdgeWidthSignalResult(): PreferenceTechnicalEdgeWidthSignalEvidence {
  return unresolvedResult({
    status: 'not_run',
    maxSampleCount: DEFAULT_MAX_SAMPLE_COUNT,
    outputMaxDimension: DEFAULT_OUTPUT_MAX_DIMENSION,
    highThreshold: DEFAULT_HIGH_THRESHOLD,
    lowThreshold: DEFAULT_LOW_THRESHOLD,
    radius: DEFAULT_RADIUS,
    blockPercentile: DEFAULT_BLOCK_PERCENTILE,
    blockWidth: DEFAULT_BLOCK_WIDTH,
    blockHeight: DEFAULT_BLOCK_HEIGHT,
  })
}

export function createBlockedEditReferenceEdgeWidthSignalResult(input: {
  maxSampleCount?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalEdgeWidthSignalEvidence['coverage']
  outputMaxDimension?: number
  highThreshold?: number
  lowThreshold?: number
  radius?: number
  blockPercentile?: number
  blockWidth?: number
  blockHeight?: number
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalEdgeWidthSignalEvidence {
  return {
    ...unresolvedResult({
      status: 'blocked',
      maxSampleCount: input.maxSampleCount ?? DEFAULT_MAX_SAMPLE_COUNT,
      scannedDurationSeconds: input.scannedDurationSeconds,
      coverage: input.coverage,
      outputMaxDimension: input.outputMaxDimension ?? DEFAULT_OUTPUT_MAX_DIMENSION,
      highThreshold: input.highThreshold ?? DEFAULT_HIGH_THRESHOLD,
      lowThreshold: input.lowThreshold ?? DEFAULT_LOW_THRESHOLD,
      radius: input.radius ?? DEFAULT_RADIUS,
      blockPercentile: input.blockPercentile ?? DEFAULT_BLOCK_PERCENTILE,
      blockWidth: input.blockWidth ?? DEFAULT_BLOCK_WIDTH,
      blockHeight: input.blockHeight ?? DEFAULT_BLOCK_HEIGHT,
    }),
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
  }
}

function unresolvedResult(input: {
  status: 'blocked' | 'not_run'
  maxSampleCount: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalEdgeWidthSignalEvidence['coverage']
  outputMaxDimension: number
  highThreshold: number
  lowThreshold: number
  radius: number
  blockPercentile: number
  blockWidth: number
  blockHeight: number
}): PreferenceTechnicalEdgeWidthSignalEvidence {
  return {
    schemaVersion: SCHEMA_VERSION,
    status: input.status,
    maxSampleCount: input.maxSampleCount,
    attemptedSampleCount: 0,
    sampleCount: 0,
    unmeasurableSampleCount: 0,
    samples: [],
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    outputMaxDimension: input.outputMaxDimension,
    highThreshold: rounded(input.highThreshold, 7),
    lowThreshold: rounded(input.lowThreshold, 7),
    radius: input.radius,
    blockPercentile: input.blockPercentile,
    blockWidth: input.blockWidth,
    blockHeight: input.blockHeight,
    ...capabilityFlags(false),
  }
}

function parseEdgeWidthSamples(
  stdout: string,
  maxSampleCount: number,
  sampleIntervalSeconds: number,
  scannedDurationSeconds: number,
): {
  attemptedSampleCount: number
  samples: PreferenceTechnicalEdgeWidthSignalSample[]
} {
  const samples: PreferenceTechnicalEdgeWidthSignalSample[] = []
  let attemptedSampleCount = 0
  for (const block of stdout.split(/(?=frame:\d+)/)) {
    const rawValue = metadataValue(block, 'lavfi.blur')
    if (rawValue === undefined) continue
    attemptedSampleCount += 1
    const rawScore = Number(rawValue)
    if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 1_000_000) continue
    const ptsTime = headerNumber(block, 'pts_time')
    const timeSeconds = clamp(
      ptsTime ?? samples.length * sampleIntervalSeconds,
      0,
      scannedDurationSeconds,
    )
    samples.push({
      timeSeconds: rounded(timeSeconds),
      score: rounded(rawScore, 6),
    })
    if (attemptedSampleCount >= maxSampleCount) break
  }
  return { attemptedSampleCount, samples }
}

function capabilityFlags(technicalEdgeWidthAnalysisRan: boolean): Pick<
  PreferenceTechnicalEdgeWidthSignalEvidence,
  | 'technicalEdgeWidthAnalysisRan'
  | 'semanticSourceQualityAnalysisRan'
  | 'semanticBlurClassificationRan'
  | 'focusQualityClassificationRan'
  | 'intentionalDepthOfFieldInferenceRan'
  | 'cameraObstructionInferenceRan'
  | 'trimRecommendationRan'
  | 'editDecisionMade'
  | 'rawFramePixelsPersisted'
  | 'rawProcessOutputPersisted'
> {
  return {
    technicalEdgeWidthAnalysisRan,
    semanticSourceQualityAnalysisRan: false,
    semanticBlurClassificationRan: false,
    focusQualityClassificationRan: false,
    intentionalDepthOfFieldInferenceRan: false,
    cameraObstructionInferenceRan: false,
    trimRecommendationRan: false,
    editDecisionMade: false,
    rawFramePixelsPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function metadataValue(block: string, key: string): string | undefined {
  const match = block.match(new RegExp(`(?:^|\\n)${escapeRegex(key)}=([^\\r\\n]+)`))
  return match?.[1]
}

function headerNumber(block: string, key: string): number | undefined {
  const match = block.match(new RegExp(`(?:^|\\s)${escapeRegex(key)}:([^\\s]+)`))
  const value = match ? Number(match[1]) : Number.NaN
  return Number.isFinite(value) ? value : undefined
}

function average(values: readonly number[]): number {
  return rounded(values.reduce((total, value) => total + value, 0) / values.length, 6)
}

function percentile(values: readonly number[], position: number): number {
  const ordered = [...values].sort((left, right) => left - right)
  const index = Math.max(0, Math.min(ordered.length - 1, Math.round((ordered.length - 1) * position)))
  return rounded(ordered[index], 6)
}

function minimum(values: readonly number[]): number {
  return rounded(Math.min(...values), 6)
}

function maximum(values: readonly number[]): number {
  return rounded(Math.max(...values), 6)
}

function rounded(value: number, digits = 3): number {
  return Number(value.toFixed(digits))
}

function formatFilterNumber(value: number): string {
  return Number(value.toFixed(7)).toString()
}

function clamp(value: number, minimumValue: number, maximumValue: number): number {
  return Math.max(minimumValue, Math.min(maximumValue, value))
}

function boundedNumber(value: number | undefined, fallback: number, minimumValue: number, maximumValue: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return clamp(value, minimumValue, maximumValue)
}

function evenInteger(value: number | undefined, fallback: number, minimumValue: number, maximumValue: number): number {
  const bounded = Math.round(boundedNumber(value, fallback, minimumValue, maximumValue))
  return bounded % 2 === 0 ? bounded : bounded - 1
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
