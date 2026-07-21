import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  PreferenceTechnicalAudioLowLevelEvidence,
  PreferenceTechnicalAudioLowLevelInterval,
} from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)

const DEFAULT_THRESHOLD_DB = -50
const DEFAULT_MINIMUM_DURATION_SECONDS = 0.5
const DEFAULT_MAX_INTERVAL_COUNT = 24

/**
 * Detects bounded low-level audio intervals for Edit Reference B7.
 * The result is an amplitude-threshold measurement only. It never classifies
 * speech pauses, breathing room, music, SFX, ambience, pacing, or trim intent.
 */
export async function runEditReferenceAudioLowLevelStudy(input: {
  sourceAudioLocalPath?: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  hasAudioStream: boolean
  thresholdDb?: number
  minimumDurationSeconds?: number
  maxIntervalCount?: number
  maxScanDurationSeconds?: number
}): Promise<PreferenceTechnicalAudioLowLevelEvidence> {
  const thresholdDb = boundedNumber(input.thresholdDb, DEFAULT_THRESHOLD_DB, -90, -20)
  const minimumDurationSeconds = boundedNumber(
    input.minimumDurationSeconds,
    DEFAULT_MINIMUM_DURATION_SECONDS,
    0.25,
    10,
  )
  const maxIntervalCount = Math.round(boundedNumber(
    input.maxIntervalCount,
    DEFAULT_MAX_INTERVAL_COUNT,
    1,
    50,
  ))
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)

  if (!input.hasAudioStream) {
    return createNotApplicableEditReferenceAudioLowLevelResult({
      thresholdDb,
      minimumDurationSeconds,
      maxIntervalCount,
    })
  }
  if (!input.sourceAudioLocalPath) {
    return createBlockedEditReferenceAudioLowLevelResult({
      thresholdDb,
      minimumDurationSeconds,
      maxIntervalCount,
      blockerCode: 'reference_audio_extract_unavailable',
      blockerMessage: 'The private audio stream could not be prepared for a bounded low-level check.',
    })
  }

  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = rounded(Math.min(sourceDurationSeconds, maxScanDurationSeconds))
  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceAudioLowLevelResult({
      thresholdDb,
      minimumDurationSeconds,
      maxIntervalCount,
      blockerCode: 'audio_low_level_duration_unavailable',
      blockerMessage: 'A bounded low-level audio check needs a verified positive media duration.',
    })
  }
  const coverage: PreferenceTechnicalAudioLowLevelEvidence['coverage'] = sourceDurationSeconds <= maxScanDurationSeconds + 0.001
    ? 'full'
    : 'partial'

  try {
    assertExistingLocalFile(input.sourceAudioLocalPath)
    const args = [
      '-hide_banner',
      '-nostdin',
      '-loglevel',
      'info',
      '-i',
      input.sourceAudioLocalPath,
      '-t',
      String(scannedDurationSeconds),
      '-map',
      '0:a:0',
      '-vn',
      '-af',
      `silencedetect=noise=${formatFilterNumber(thresholdDb)}dB:d=${formatFilterNumber(minimumDurationSeconds)}`,
      '-f',
      'null',
      '-',
    ]
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceAudioLowLevelArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
    })
    const detected = parseLowLevelIntervals(output.stderr, scannedDurationSeconds, minimumDurationSeconds)
    const intervals = detected.slice(0, maxIntervalCount)
    const durations = detected.map((interval) => interval.durationSeconds)

    return {
      status: 'verified_local_bounded',
      thresholdDb,
      minimumDurationSeconds,
      maxIntervalCount,
      detectedIntervalCount: detected.length,
      intervals,
      intervalsTruncated: detected.length > intervals.length,
      scannedDurationSeconds,
      coverage,
      totalLowLevelDurationSeconds: rounded(durations.reduce((total, value) => total + value, 0)),
      longestLowLevelDurationSeconds: durations.length > 0 ? rounded(Math.max(...durations)) : 0,
      ...falseCapabilityFlags(),
    }
  } catch {
    return createBlockedEditReferenceAudioLowLevelResult({
      thresholdDb,
      minimumDurationSeconds,
      maxIntervalCount,
      scannedDurationSeconds,
      coverage,
      blockerCode: 'ffmpeg_audio_low_level_scan_failed',
      blockerMessage: 'The bounded low-level audio check did not complete. No raw process output was persisted.',
    })
  }
}

export function createNotRunEditReferenceAudioLowLevelResult(): PreferenceTechnicalAudioLowLevelEvidence {
  return {
    status: 'not_run',
    thresholdDb: DEFAULT_THRESHOLD_DB,
    minimumDurationSeconds: DEFAULT_MINIMUM_DURATION_SECONDS,
    maxIntervalCount: DEFAULT_MAX_INTERVAL_COUNT,
    detectedIntervalCount: 0,
    intervals: [],
    intervalsTruncated: false,
    scannedDurationSeconds: 0,
    coverage: 'not_run',
    totalLowLevelDurationSeconds: 0,
    longestLowLevelDurationSeconds: 0,
    ...falseCapabilityFlags(),
  }
}

export function createNotApplicableEditReferenceAudioLowLevelResult(input: {
  thresholdDb?: number
  minimumDurationSeconds?: number
  maxIntervalCount?: number
} = {}): PreferenceTechnicalAudioLowLevelEvidence {
  return {
    status: 'not_applicable',
    thresholdDb: input.thresholdDb ?? DEFAULT_THRESHOLD_DB,
    minimumDurationSeconds: input.minimumDurationSeconds ?? DEFAULT_MINIMUM_DURATION_SECONDS,
    maxIntervalCount: input.maxIntervalCount ?? DEFAULT_MAX_INTERVAL_COUNT,
    detectedIntervalCount: 0,
    intervals: [],
    intervalsTruncated: false,
    scannedDurationSeconds: 0,
    coverage: 'not_run',
    totalLowLevelDurationSeconds: 0,
    longestLowLevelDurationSeconds: 0,
    blockerCode: 'reference_media_has_no_audio_stream',
    blockerMessage: 'The reference video has no audio stream to check.',
    ...falseCapabilityFlags(),
  }
}

export function createBlockedEditReferenceAudioLowLevelResult(input: {
  thresholdDb?: number
  minimumDurationSeconds?: number
  maxIntervalCount?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalAudioLowLevelEvidence['coverage']
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalAudioLowLevelEvidence {
  return {
    status: 'blocked',
    thresholdDb: input.thresholdDb ?? DEFAULT_THRESHOLD_DB,
    minimumDurationSeconds: input.minimumDurationSeconds ?? DEFAULT_MINIMUM_DURATION_SECONDS,
    maxIntervalCount: input.maxIntervalCount ?? DEFAULT_MAX_INTERVAL_COUNT,
    detectedIntervalCount: 0,
    intervals: [],
    intervalsTruncated: false,
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    totalLowLevelDurationSeconds: 0,
    longestLowLevelDurationSeconds: 0,
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    ...falseCapabilityFlags(),
  }
}

function parseLowLevelIntervals(
  stderr: string,
  scannedDurationSeconds: number,
  minimumDurationSeconds: number,
): PreferenceTechnicalAudioLowLevelInterval[] {
  const intervals: PreferenceTechnicalAudioLowLevelInterval[] = []
  let pendingStart: number | undefined

  for (const line of stderr.split(/\r?\n/)) {
    const start = parsedNumber(line.match(/silence_start:\s*([-+0-9.eE]+)/)?.[1])
    if (start !== undefined) pendingStart = clamp(start, 0, scannedDurationSeconds)

    const end = parsedNumber(line.match(/silence_end:\s*([-+0-9.eE]+)/)?.[1])
    if (end === undefined) continue
    const duration = parsedNumber(line.match(/silence_duration:\s*([-+0-9.eE]+)/)?.[1])
    const safeEnd = clamp(end, 0, scannedDurationSeconds)
    const safeStart = pendingStart ?? (duration === undefined ? undefined : clamp(safeEnd - duration, 0, safeEnd))
    pendingStart = undefined
    if (safeStart === undefined) continue
    appendInterval(intervals, safeStart, safeEnd, minimumDurationSeconds)
  }

  if (pendingStart !== undefined) {
    appendInterval(intervals, pendingStart, scannedDurationSeconds, minimumDurationSeconds)
  }
  return intervals
}

function appendInterval(
  intervals: PreferenceTechnicalAudioLowLevelInterval[],
  startSeconds: number,
  endSeconds: number,
  minimumDurationSeconds: number,
): void {
  const safeStart = rounded(startSeconds)
  const safeEnd = rounded(endSeconds)
  const durationSeconds = rounded(safeEnd - safeStart)
  if (durationSeconds <= 0 || durationSeconds + 0.01 < minimumDurationSeconds) return
  const previous = intervals.at(-1)
  if (previous && Math.abs(previous.startSeconds - safeStart) < 0.001 && Math.abs(previous.endSeconds - safeEnd) < 0.001) return
  intervals.push({ startSeconds: safeStart, endSeconds: safeEnd, durationSeconds })
}

function falseCapabilityFlags(): Pick<PreferenceTechnicalAudioLowLevelEvidence,
  | 'semanticAudioAnalysisRan'
  | 'speechPauseClassificationRan'
  | 'musicOrSfxAnalysisRan'
  | 'trimRecommendationRan'
  | 'rawAudioPersisted'
  | 'rawProcessOutputPersisted'
> {
  return {
    semanticAudioAnalysisRan: false,
    speechPauseClassificationRan: false,
    musicOrSfxAnalysisRan: false,
    trimRecommendationRan: false,
    rawAudioPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function parsedNumber(value: string | undefined): number | undefined {
  const parsed = value === undefined ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function rounded(value: number): number {
  return Number(value.toFixed(3))
}

function formatFilterNumber(value: number): string {
  return Number(value.toFixed(6)).toString()
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}

function boundedNumber(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return clamp(value, minimum, maximum)
}
