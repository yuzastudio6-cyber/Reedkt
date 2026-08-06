import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  PreferenceTechnicalSourceConditionEvidence,
  PreferenceTechnicalSourceConditionInterval,
} from '../../src/types/edit-reference'
import {
  assertExistingLocalFile,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

const execFileAsync = promisify(execFile)
const SCHEMA_VERSION = 'edit-reference-technical-source-condition-v1' as const
const DEFAULT_MAX_INTERVAL_COUNT_PER_TYPE = 24
const DEFAULT_ANALYSIS_FRAME_RATE = 10
const DEFAULT_BLACK_MINIMUM_DURATION_SECONDS = 0.3
const DEFAULT_BLACK_PICTURE_RATIO_THRESHOLD = 0.98
const DEFAULT_BLACK_PIXEL_THRESHOLD = 0.1
const DEFAULT_FREEZE_MINIMUM_DURATION_SECONDS = 0.5
const DEFAULT_FREEZE_NOISE_TOLERANCE = 0.001

/**
 * Measures bounded FFmpeg black/freeze metadata for Edit Reference B1.
 * A dark or unchanged interval may be intentional. This adapter never labels
 * footage unusable, infers obstruction/blur, or recommends an edit or trim.
 */
export async function runEditReferenceSourceConditionStudy(input: {
  sourceLocalPath: string
  ffmpegBin: string
  timeoutMs: number
  durationSeconds: number
  maxIntervalCountPerType?: number
  analysisFrameRate?: number
  maxScanDurationSeconds?: number
  blackMinimumDurationSeconds?: number
  blackPictureRatioThreshold?: number
  blackPixelThreshold?: number
  freezeMinimumDurationSeconds?: number
  freezeNoiseTolerance?: number
}): Promise<PreferenceTechnicalSourceConditionEvidence> {
  const maxIntervalCountPerType = Math.round(boundedNumber(
    input.maxIntervalCountPerType,
    DEFAULT_MAX_INTERVAL_COUNT_PER_TYPE,
    1,
    50,
  ))
  const analysisFrameRate = Math.round(boundedNumber(
    input.analysisFrameRate,
    DEFAULT_ANALYSIS_FRAME_RATE,
    1,
    15,
  ))
  const blackMinimumDurationSeconds = boundedNumber(
    input.blackMinimumDurationSeconds,
    DEFAULT_BLACK_MINIMUM_DURATION_SECONDS,
    0.1,
    10,
  )
  const blackPictureRatioThreshold = boundedNumber(
    input.blackPictureRatioThreshold,
    DEFAULT_BLACK_PICTURE_RATIO_THRESHOLD,
    0.5,
    1,
  )
  const blackPixelThreshold = boundedNumber(
    input.blackPixelThreshold,
    DEFAULT_BLACK_PIXEL_THRESHOLD,
    0,
    0.5,
  )
  const freezeMinimumDurationSeconds = boundedNumber(
    input.freezeMinimumDurationSeconds,
    DEFAULT_FREEZE_MINIMUM_DURATION_SECONDS,
    0.1,
    10,
  )
  const freezeNoiseTolerance = boundedNumber(
    input.freezeNoiseTolerance,
    DEFAULT_FREEZE_NOISE_TOLERANCE,
    0,
    1,
  )
  const maxScanDurationSeconds = boundedNumber(input.maxScanDurationSeconds, 120, 0.25, 600)
  const sourceDurationSeconds = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 0
  const scannedDurationSeconds = rounded(Math.min(sourceDurationSeconds, maxScanDurationSeconds))

  const settings = {
    maxIntervalCountPerType,
    analysisFrameRate,
    blackMinimumDurationSeconds,
    blackPictureRatioThreshold,
    blackPixelThreshold,
    freezeMinimumDurationSeconds,
    freezeNoiseTolerance,
  }
  if (scannedDurationSeconds <= 0) {
    return createBlockedEditReferenceSourceConditionResult({
      ...settings,
      blockerCode: 'source_condition_duration_unavailable',
      blockerMessage: 'A bounded source-condition check needs a verified positive media duration.',
    })
  }
  const coverage: PreferenceTechnicalSourceConditionEvidence['coverage'] = (
    sourceDurationSeconds <= maxScanDurationSeconds + 0.001 ? 'full' : 'partial'
  )

  try {
    assertExistingLocalFile(input.sourceLocalPath)
    const filter = [
      'setpts=PTS-STARTPTS',
      `fps=${analysisFrameRate}`,
      `blackdetect=d=${formatFilterNumber(blackMinimumDurationSeconds)}:pic_th=${formatFilterNumber(blackPictureRatioThreshold)}:pix_th=${formatFilterNumber(blackPixelThreshold)}`,
      `freezedetect=n=${formatFilterNumber(freezeNoiseTolerance)}:d=${formatFilterNumber(freezeMinimumDurationSeconds)}`,
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
      String(Math.ceil(scannedDurationSeconds * analysisFrameRate) + 1),
      '-an',
      '-f',
      'null',
      '-',
    ]
    for (const arg of args) assertNoSignedUrlOrRawUrl(arg, 'editReferenceSourceConditionArg')

    const output = await execFileAsync(input.ffmpegBin, args, {
      timeout: input.timeoutMs,
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
      encoding: 'utf8',
    })
    const blackDetected = parseConditionIntervals({
      stdout: output.stdout,
      metadataPrefix: 'lavfi.black',
      scannedDurationSeconds,
      minimumDurationSeconds: blackMinimumDurationSeconds,
    })
    const freezeDetected = parseConditionIntervals({
      stdout: output.stdout,
      metadataPrefix: 'lavfi.freezedetect.freeze',
      scannedDurationSeconds,
      minimumDurationSeconds: freezeMinimumDurationSeconds,
    })
    const blackIntervals = blackDetected.slice(0, maxIntervalCountPerType)
    const freezeIntervals = freezeDetected.slice(0, maxIntervalCountPerType)

    return {
      schemaVersion: SCHEMA_VERSION,
      status: 'verified_local_bounded',
      ...settings,
      scannedDurationSeconds,
      coverage,
      blackDetectedIntervalCount: blackDetected.length,
      blackIntervals,
      blackIntervalsTruncated: blackDetected.length > blackIntervals.length,
      blackTotalDurationSeconds: totalDuration(blackDetected),
      blackLongestDurationSeconds: longestDuration(blackDetected),
      freezeDetectedIntervalCount: freezeDetected.length,
      freezeIntervals,
      freezeIntervalsTruncated: freezeDetected.length > freezeIntervals.length,
      freezeTotalDurationSeconds: totalDuration(freezeDetected),
      freezeLongestDurationSeconds: longestDuration(freezeDetected),
      ...capabilityFlags(true),
    }
  } catch {
    return createBlockedEditReferenceSourceConditionResult({
      ...settings,
      scannedDurationSeconds,
      coverage,
      blockerCode: 'ffmpeg_source_condition_scan_failed',
      blockerMessage: 'The bounded FFmpeg source-condition check did not complete. No raw process output was persisted.',
    })
  }
}

export function createNotRunEditReferenceSourceConditionResult(): PreferenceTechnicalSourceConditionEvidence {
  return unresolvedResult({
    status: 'not_run',
    maxIntervalCountPerType: DEFAULT_MAX_INTERVAL_COUNT_PER_TYPE,
    analysisFrameRate: DEFAULT_ANALYSIS_FRAME_RATE,
    blackMinimumDurationSeconds: DEFAULT_BLACK_MINIMUM_DURATION_SECONDS,
    blackPictureRatioThreshold: DEFAULT_BLACK_PICTURE_RATIO_THRESHOLD,
    blackPixelThreshold: DEFAULT_BLACK_PIXEL_THRESHOLD,
    freezeMinimumDurationSeconds: DEFAULT_FREEZE_MINIMUM_DURATION_SECONDS,
    freezeNoiseTolerance: DEFAULT_FREEZE_NOISE_TOLERANCE,
  })
}

export function createBlockedEditReferenceSourceConditionResult(input: {
  maxIntervalCountPerType?: number
  analysisFrameRate?: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalSourceConditionEvidence['coverage']
  blackMinimumDurationSeconds?: number
  blackPictureRatioThreshold?: number
  blackPixelThreshold?: number
  freezeMinimumDurationSeconds?: number
  freezeNoiseTolerance?: number
  blockerCode: string
  blockerMessage: string
}): PreferenceTechnicalSourceConditionEvidence {
  return {
    ...unresolvedResult({
      status: 'blocked',
      maxIntervalCountPerType: input.maxIntervalCountPerType ?? DEFAULT_MAX_INTERVAL_COUNT_PER_TYPE,
      analysisFrameRate: input.analysisFrameRate ?? DEFAULT_ANALYSIS_FRAME_RATE,
      scannedDurationSeconds: input.scannedDurationSeconds,
      coverage: input.coverage,
      blackMinimumDurationSeconds: input.blackMinimumDurationSeconds ?? DEFAULT_BLACK_MINIMUM_DURATION_SECONDS,
      blackPictureRatioThreshold: input.blackPictureRatioThreshold ?? DEFAULT_BLACK_PICTURE_RATIO_THRESHOLD,
      blackPixelThreshold: input.blackPixelThreshold ?? DEFAULT_BLACK_PIXEL_THRESHOLD,
      freezeMinimumDurationSeconds: input.freezeMinimumDurationSeconds ?? DEFAULT_FREEZE_MINIMUM_DURATION_SECONDS,
      freezeNoiseTolerance: input.freezeNoiseTolerance ?? DEFAULT_FREEZE_NOISE_TOLERANCE,
    }),
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
  }
}

function unresolvedResult(input: {
  status: 'blocked' | 'not_run'
  maxIntervalCountPerType: number
  analysisFrameRate: number
  scannedDurationSeconds?: number
  coverage?: PreferenceTechnicalSourceConditionEvidence['coverage']
  blackMinimumDurationSeconds: number
  blackPictureRatioThreshold: number
  blackPixelThreshold: number
  freezeMinimumDurationSeconds: number
  freezeNoiseTolerance: number
}): PreferenceTechnicalSourceConditionEvidence {
  return {
    schemaVersion: SCHEMA_VERSION,
    status: input.status,
    maxIntervalCountPerType: input.maxIntervalCountPerType,
    analysisFrameRate: input.analysisFrameRate,
    scannedDurationSeconds: input.scannedDurationSeconds ?? 0,
    coverage: input.coverage ?? 'not_run',
    blackMinimumDurationSeconds: rounded(input.blackMinimumDurationSeconds),
    blackPictureRatioThreshold: rounded(input.blackPictureRatioThreshold),
    blackPixelThreshold: rounded(input.blackPixelThreshold),
    freezeMinimumDurationSeconds: rounded(input.freezeMinimumDurationSeconds),
    freezeNoiseTolerance: rounded(input.freezeNoiseTolerance, 6),
    blackDetectedIntervalCount: 0,
    blackIntervals: [],
    blackIntervalsTruncated: false,
    blackTotalDurationSeconds: 0,
    blackLongestDurationSeconds: 0,
    freezeDetectedIntervalCount: 0,
    freezeIntervals: [],
    freezeIntervalsTruncated: false,
    freezeTotalDurationSeconds: 0,
    freezeLongestDurationSeconds: 0,
    ...capabilityFlags(false),
  }
}

function parseConditionIntervals(input: {
  stdout: string
  metadataPrefix: 'lavfi.black' | 'lavfi.freezedetect.freeze'
  scannedDurationSeconds: number
  minimumDurationSeconds: number
}): PreferenceTechnicalSourceConditionInterval[] {
  const intervals: PreferenceTechnicalSourceConditionInterval[] = []
  let pendingStart: number | undefined

  for (const block of input.stdout.split(/(?=frame:\d+)/)) {
    const start = metadataNumber(block, `${input.metadataPrefix}_start`)
    if (start !== undefined) pendingStart = clamp(start, 0, input.scannedDurationSeconds)

    const end = metadataNumber(block, `${input.metadataPrefix}_end`)
    if (end === undefined) continue
    const duration = metadataNumber(block, `${input.metadataPrefix}_duration`)
    const safeEnd = clamp(end, 0, input.scannedDurationSeconds)
    const safeStart = pendingStart ?? (
      duration === undefined ? undefined : clamp(safeEnd - duration, 0, safeEnd)
    )
    pendingStart = undefined
    if (safeStart === undefined) continue
    appendInterval(intervals, safeStart, safeEnd, input.minimumDurationSeconds, false)
  }

  if (pendingStart !== undefined) {
    appendInterval(
      intervals,
      pendingStart,
      input.scannedDurationSeconds,
      input.minimumDurationSeconds,
      true,
    )
  }
  return intervals
}

function appendInterval(
  intervals: PreferenceTechnicalSourceConditionInterval[],
  startSeconds: number,
  endSeconds: number,
  minimumDurationSeconds: number,
  endedAtScanBoundary: boolean,
): void {
  const safeStart = rounded(startSeconds)
  const safeEnd = rounded(endSeconds)
  const durationSeconds = rounded(safeEnd - safeStart)
  if (durationSeconds <= 0 || durationSeconds + 0.01 < minimumDurationSeconds) return
  const previous = intervals.at(-1)
  if (previous && Math.abs(previous.startSeconds - safeStart) < 0.001 && Math.abs(previous.endSeconds - safeEnd) < 0.001) return
  intervals.push({
    startSeconds: safeStart,
    endSeconds: safeEnd,
    durationSeconds,
    endedAtScanBoundary,
  })
}

function capabilityFlags(technicalSourceConditionAnalysisRan: boolean): Pick<
  PreferenceTechnicalSourceConditionEvidence,
  | 'technicalSourceConditionAnalysisRan'
  | 'semanticSourceQualityAnalysisRan'
  | 'intentionalStillnessClassificationRan'
  | 'cameraObstructionInferenceRan'
  | 'blurAnalysisRan'
  | 'trimRecommendationRan'
  | 'editDecisionMade'
  | 'rawFramePixelsPersisted'
  | 'rawProcessOutputPersisted'
> {
  return {
    technicalSourceConditionAnalysisRan,
    semanticSourceQualityAnalysisRan: false,
    intentionalStillnessClassificationRan: false,
    cameraObstructionInferenceRan: false,
    blurAnalysisRan: false,
    trimRecommendationRan: false,
    editDecisionMade: false,
    rawFramePixelsPersisted: false,
    rawProcessOutputPersisted: false,
  }
}

function metadataNumber(block: string, key: string): number | undefined {
  const match = block.match(new RegExp(`(?:^|\\n)${escapeRegex(key)}=([^\\r\\n]+)`))
  const value = match ? Number(match[1]) : Number.NaN
  return Number.isFinite(value) ? value : undefined
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function totalDuration(intervals: readonly PreferenceTechnicalSourceConditionInterval[]): number {
  return rounded(intervals.reduce((total, interval) => total + interval.durationSeconds, 0))
}

function longestDuration(intervals: readonly PreferenceTechnicalSourceConditionInterval[]): number {
  return intervals.length === 0 ? 0 : rounded(Math.max(...intervals.map((interval) => interval.durationSeconds)))
}

function rounded(value: number, digits = 3): number {
  return Number(value.toFixed(digits))
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
