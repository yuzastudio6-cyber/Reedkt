import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_VERSION =
  'offline-media-binary-visual-calibration-objective-qa-v1' as const
export const APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID =
  'approved_visual_calibration_candidate_objective_qa_v1' as const
export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID =
  'offline_media_binary_visual_calibration_candidate_qa_v1' as const
export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_MAGIC =
  'REEDITPRO_FFMPEG_VISUAL_CALIBRATION_OBJECTIVE_QA_V1' as const
export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_MAXIMUM_OUTPUT_BYTES =
  256 * 1024
export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_CANDIDATE_MAXIMUM_BYTES =
  67_108_864
export const OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_REFERENCE_FRAME_MAXIMUM_BYTES =
  16_777_216

export type VisualCalibrationObjectiveQaScenarioKind =
  | 'style_led_motion'
  | 'character_continuity'
  | 'strict_first_last_frame'
  | 'reference_heavy'

export interface OfflineMediaBinaryVisualCalibrationObjectiveQaRequest {
  schemaVersion:
    typeof OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_VERSION
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  recipeProfileId:
    typeof APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID
  runnerProfileId:
    typeof OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID
  sourceProviderOperationId:
    'provider.google.generate_visual_calibration_candidate.v1'
  sourceProviderOutputRole: 'provider_visual_calibration_video_mp4'
  visualCalibrationContextDigest: string
  scenarioKind: VisualCalibrationObjectiveQaScenarioKind
  candidate: {
    byteLength: number
    sha256: string
    privateObjectIdentityHash: string
  }
  firstFrame: {
    assetId: string
    assetVersionId: string
    byteLength: number
    sha256: string
    privateObjectIdentityHash: string
  }
  lastFrame: {
    assetId: string
    assetVersionId: string
    byteLength: number
    sha256: string
    privateObjectIdentityHash: string
  }
  mediaBounds: {
    maximumPixelCount: 921_600
    frameRateNumerator: 24
    frameRateDenominator: 1
    minimumFrameCount: 72
    maximumFrameCount: 240
    minimumDurationMilliseconds: 3_000
    maximumDurationMilliseconds: 10_000
    maximumAudioStreamCount: 1
  }
  qualityThresholds: {
    maximumBlackFrameRatioMillionths: 20_000
    maximumFrozenFrameRatioMillionths: number
    maximumFrozenRunFrames: 47
    minimumMotionSignalRatioMillionths: 50_000
    minimumFirstFrameSimilarityMillionths: number
    minimumLastFrameSimilarityMillionths: number
  }
  outputPolicy: {
    mimeType: 'application/json'
    privateCreateOnly: true
    browserReadable: false
    providerCostIncluded: false
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
  }
}

export interface OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument {
  schemaVersion:
    'offline-media-binary-visual-calibration-objective-qa-result-v1'
  passed: boolean
  containerIntegrity: true
  videoStreamCount: 1
  audioStreamCount: 0 | 1
  width: number
  height: number
  frameRateNumerator: 24
  frameRateDenominator: 1
  frameCount: number
  durationMilliseconds: number
  blackFrameRatioMillionths: number
  frozenFrameRatioMillionths: number
  maximumFrozenRunFrames: number
  motionSignalRatioMillionths: number
  firstFrameSimilarityMillionths: number
  lastFrameSimilarityMillionths: number
  blackDetectEvidenceSha256: string
  freezeDetectEvidenceSha256: string
  decodedFrameHashEvidenceSha256: string
}

export const VISUAL_CALIBRATION_OBJECTIVE_QA_SIMILARITY_MILLIONTHS =
  Object.freeze({
    style_led_motion: 750_000,
    character_continuity: 800_000,
    strict_first_last_frame: 900_000,
    reference_heavy: 850_000,
  } satisfies Record<VisualCalibrationObjectiveQaScenarioKind, number>)

export function buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest(
  input: Omit<
    OfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
    | 'schemaVersion'
    | 'toolId'
    | 'operationId'
    | 'recipeProfileId'
    | 'runnerProfileId'
    | 'mediaBounds'
    | 'qualityThresholds'
    | 'outputPolicy'
  >,
): OfflineMediaBinaryVisualCalibrationObjectiveQaRequest {
  const similarity =
    VISUAL_CALIBRATION_OBJECTIVE_QA_SIMILARITY_MILLIONTHS[input.scenarioKind]
  return validateOfflineMediaBinaryVisualCalibrationObjectiveQaRequest({
    schemaVersion:
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_VERSION,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    recipeProfileId:
      APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID,
    runnerProfileId:
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID,
    ...input,
    mediaBounds: {
      maximumPixelCount: 921_600,
      frameRateNumerator: 24,
      frameRateDenominator: 1,
      minimumFrameCount: 72,
      maximumFrameCount: 240,
      minimumDurationMilliseconds: 3_000,
      maximumDurationMilliseconds: 10_000,
      maximumAudioStreamCount: 1,
    },
    qualityThresholds: {
      maximumBlackFrameRatioMillionths: 20_000,
      maximumFrozenFrameRatioMillionths: 670_000,
      maximumFrozenRunFrames: 47,
      minimumMotionSignalRatioMillionths: 50_000,
      minimumFirstFrameSimilarityMillionths: similarity,
      minimumLastFrameSimilarityMillionths: similarity,
    },
    outputPolicy: {
      mimeType: 'application/json',
      privateCreateOnly: true,
      browserReadable: false,
      providerCostIncluded: false,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
    },
  })
}

export function validateOfflineMediaBinaryVisualCalibrationObjectiveQaRequest(
  value: unknown,
): OfflineMediaBinaryVisualCalibrationObjectiveQaRequest {
  const input = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'recipeProfileId',
    'runnerProfileId', 'sourceProviderOperationId',
    'sourceProviderOutputRole', 'visualCalibrationContextDigest',
    'scenarioKind', 'candidate', 'firstFrame', 'lastFrame', 'mediaBounds',
    'qualityThresholds', 'outputPolicy',
  ])
  const candidate = exactRecord(input.candidate, [
    'byteLength', 'sha256', 'privateObjectIdentityHash',
  ])
  const firstFrame = exactRecord(input.firstFrame, [
    'assetId', 'assetVersionId', 'byteLength', 'sha256',
    'privateObjectIdentityHash',
  ])
  const lastFrame = exactRecord(input.lastFrame, [
    'assetId', 'assetVersionId', 'byteLength', 'sha256',
    'privateObjectIdentityHash',
  ])
  const mediaBounds = exactRecord(input.mediaBounds, [
    'maximumPixelCount', 'frameRateNumerator', 'frameRateDenominator',
    'minimumFrameCount', 'maximumFrameCount',
    'minimumDurationMilliseconds', 'maximumDurationMilliseconds',
    'maximumAudioStreamCount',
  ])
  const thresholds = exactRecord(input.qualityThresholds, [
    'maximumBlackFrameRatioMillionths',
    'maximumFrozenFrameRatioMillionths', 'maximumFrozenRunFrames',
    'minimumMotionSignalRatioMillionths',
    'minimumFirstFrameSimilarityMillionths',
    'minimumLastFrameSimilarityMillionths',
  ])
  const outputPolicy = exactRecord(input.outputPolicy, [
    'mimeType', 'privateCreateOnly', 'browserReadable',
    'providerCostIncluded', 'customerPriceIncluded',
    'customerCreditsIncluded', 'serviceFeeIncluded',
  ])
  const scenarioKind = String(input.scenarioKind) as
    VisualCalibrationObjectiveQaScenarioKind
  const expectedSimilarity =
    VISUAL_CALIBRATION_OBJECTIVE_QA_SIMILARITY_MILLIONTHS[scenarioKind]
  if (
    input.schemaVersion !==
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_VERSION ||
    input.toolId !== 'ffmpeg' ||
    input.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    input.recipeProfileId !==
      APPROVED_VISUAL_CALIBRATION_CANDIDATE_OBJECTIVE_QA_PROFILE_ID ||
    input.runnerProfileId !==
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_ID ||
    input.sourceProviderOperationId !==
      'provider.google.generate_visual_calibration_candidate.v1' ||
    input.sourceProviderOutputRole !==
      'provider_visual_calibration_video_mp4' ||
    !sha256(input.visualCalibrationContextDigest) ||
    expectedSimilarity === undefined ||
    !committedObject(candidate, 12,
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_CANDIDATE_MAXIMUM_BYTES) ||
    !committedFrame(firstFrame) || !committedFrame(lastFrame) ||
    mediaBounds.maximumPixelCount !== 921_600 ||
    mediaBounds.frameRateNumerator !== 24 ||
    mediaBounds.frameRateDenominator !== 1 ||
    mediaBounds.minimumFrameCount !== 72 ||
    mediaBounds.maximumFrameCount !== 240 ||
    mediaBounds.minimumDurationMilliseconds !== 3_000 ||
    mediaBounds.maximumDurationMilliseconds !== 10_000 ||
    mediaBounds.maximumAudioStreamCount !== 1 ||
    thresholds.maximumBlackFrameRatioMillionths !== 20_000 ||
    thresholds.maximumFrozenFrameRatioMillionths !== 670_000 ||
    thresholds.maximumFrozenRunFrames !== 47 ||
    thresholds.minimumMotionSignalRatioMillionths !== 50_000 ||
    thresholds.minimumFirstFrameSimilarityMillionths !== expectedSimilarity ||
    thresholds.minimumLastFrameSimilarityMillionths !== expectedSimilarity ||
    outputPolicy.mimeType !== 'application/json' ||
    outputPolicy.privateCreateOnly !== true ||
    outputPolicy.browserReadable !== false ||
    outputPolicy.providerCostIncluded !== false ||
    outputPolicy.customerPriceIncluded !== false ||
    outputPolicy.customerCreditsIncluded !== false ||
    outputPolicy.serviceFeeIncluded !== false
  ) throw invalid()
  return input as unknown as OfflineMediaBinaryVisualCalibrationObjectiveQaRequest
}

export function validateOfflineMediaBinaryVisualCalibrationObjectiveQaResult(
  value: unknown,
  request: OfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
): OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument {
  const result = exactRecord(value, [
    'schemaVersion', 'passed', 'containerIntegrity', 'videoStreamCount',
    'audioStreamCount', 'width', 'height', 'frameRateNumerator',
    'frameRateDenominator', 'frameCount', 'durationMilliseconds',
    'blackFrameRatioMillionths', 'frozenFrameRatioMillionths',
    'maximumFrozenRunFrames', 'motionSignalRatioMillionths',
    'firstFrameSimilarityMillionths', 'lastFrameSimilarityMillionths',
    'blackDetectEvidenceSha256', 'freezeDetectEvidenceSha256',
    'decodedFrameHashEvidenceSha256',
  ])
  const integers = [
    'videoStreamCount', 'audioStreamCount', 'width', 'height',
    'frameRateNumerator', 'frameRateDenominator',
    'frameCount', 'durationMilliseconds', 'blackFrameRatioMillionths',
    'frozenFrameRatioMillionths', 'maximumFrozenRunFrames',
    'motionSignalRatioMillionths', 'firstFrameSimilarityMillionths',
    'lastFrameSimilarityMillionths',
  ] as const
  if (integers.some((key) => !Number.isSafeInteger(result[key]))) throw invalid()
  const effectiveMaximumFrozenRatio = Math.min(
    request.qualityThresholds.maximumFrozenFrameRatioMillionths,
    Math.floor((48 * 1_000_000) / Number(result.frameCount)),
  )
  const expectedPassed =
    Number(result.blackFrameRatioMillionths) <=
      request.qualityThresholds.maximumBlackFrameRatioMillionths &&
    Number(result.frozenFrameRatioMillionths) <= effectiveMaximumFrozenRatio &&
    Number(result.maximumFrozenRunFrames) <=
      request.qualityThresholds.maximumFrozenRunFrames &&
    Number(result.motionSignalRatioMillionths) >=
      request.qualityThresholds.minimumMotionSignalRatioMillionths &&
    Number(result.firstFrameSimilarityMillionths) >=
      request.qualityThresholds.minimumFirstFrameSimilarityMillionths &&
    Number(result.lastFrameSimilarityMillionths) >=
      request.qualityThresholds.minimumLastFrameSimilarityMillionths
  if (
    result.schemaVersion !==
      'offline-media-binary-visual-calibration-objective-qa-result-v1' ||
    result.containerIntegrity !== true || result.videoStreamCount !== 1 ||
    ![0, 1].includes(Number(result.audioStreamCount)) ||
    Number(result.width) < 64 || Number(result.height) < 64 ||
    Number(result.width) * Number(result.height) >
      request.mediaBounds.maximumPixelCount ||
    result.frameRateNumerator !== 24 || result.frameRateDenominator !== 1 ||
    Number(result.frameCount) < request.mediaBounds.minimumFrameCount ||
    Number(result.frameCount) > request.mediaBounds.maximumFrameCount ||
    Number(result.durationMilliseconds) <
      request.mediaBounds.minimumDurationMilliseconds ||
    Number(result.durationMilliseconds) >
      request.mediaBounds.maximumDurationMilliseconds ||
    integers.slice(8).some((key) =>
      Number(result[key]) < 0 || Number(result[key]) > 1_000_000) ||
    !sha256(result.blackDetectEvidenceSha256) ||
    !sha256(result.freezeDetectEvidenceSha256) ||
    !sha256(result.decodedFrameHashEvidenceSha256) ||
    result.passed !== expectedPassed
  ) throw invalid()
  return result as unknown as
    OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument
}

export function offlineMediaBinaryVisualCalibrationObjectiveQaRequestSha256(
  request: OfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
): string {
  return sha256AuthorityValue(
    validateOfflineMediaBinaryVisualCalibrationObjectiveQaRequest(request),
  )
}

function committedFrame(value: Record<string, unknown>): boolean {
  return safeIdentity(value.assetId) && safeIdentity(value.assetVersionId) &&
    committedObject(
      value,
      64,
      OFFLINE_MEDIA_BINARY_VISUAL_CALIBRATION_REFERENCE_FRAME_MAXIMUM_BYTES,
    )
}

function committedObject(
  value: Record<string, unknown>,
  minimumBytes: number,
  maximumBytes: number,
): boolean {
  return Number.isSafeInteger(value.byteLength) &&
    Number(value.byteLength) >= minimumBytes &&
    Number(value.byteLength) <= maximumBytes &&
    sha256(value.sha256) && sha256(value.privateObjectIdentityHash)
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  const record = value as Record<string, unknown>
  if (
    Object.keys(record).sort().join('|') !== [...keys].sort().join('|')
  ) throw invalid()
  return record
}

function safeIdentity(value: unknown): boolean {
  return typeof value === 'string' && value.length >= 1 && value.length <= 200 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) && !value.includes('..')
}

function sha256(value: unknown): boolean {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
}

function invalid(): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Visual-calibration objective-QA request is outside its fixed profile.',
    400,
    { requiredGate: 'approved_visual_calibration_candidate_objective_qa_v1' },
  )
}
