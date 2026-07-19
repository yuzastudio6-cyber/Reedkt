import { createHash } from 'node:crypto'

import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../../src/types/large-media'
import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL =
  'offline-media-binary-final-master-objective-qa-v1' as const
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE =
  'server_injected_private_final_master_stream_v1' as const
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE =
  'approved_final_master_decoded_video_integrity_v1' as const
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE =
  'approved_final_master_decoded_audio_quality_sync_v1' as const
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_BYTES =
  REEDITPRO_SOURCE_MEDIA_MAX_BYTES
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_DURATION_SECONDS =
  6 * 60 * 60
export const OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_EXCEPTION_RANGES = 2_048

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const FRAME_RATES = new Set([24, 25, 30, 50, 60])
const PROFESSIONAL_FRAMES = new Set([
  '1920x1080', '2560x1440', '3840x2160',
  '1080x1920', '1440x2560', '2160x3840',
  '1080x1080', '1440x1440', '2160x2160',
  '1080x1350', '1440x1800', '2160x2700',
  '1440x1080', '1920x1440', '2880x2160',
])

export type OfflineFinalMasterVisualExceptionKind =
  | 'approved_black_hold'
  | 'approved_freeze_hold'
  | 'approved_flash_or_cut'

export type OfflineFinalMasterAudioExceptionKind =
  | 'approved_digital_silence'

export interface OfflineFinalMasterVisualExceptionRange {
  exceptionId: string
  kind: OfflineFinalMasterVisualExceptionKind
  startFrame: number
  endFrameExclusive: number
  approvalEvidenceHash: string
}

export interface OfflineFinalMasterAudioExceptionRange {
  exceptionId: string
  kind: OfflineFinalMasterAudioExceptionKind
  startFrame: number
  endFrameExclusive: number
  approvalEvidenceHash: string
}

export interface OfflineFinalMasterVisualExceptionManifest {
  schemaVersion: 'approved-final-master-visual-exception-manifest-v1'
  ranges: OfflineFinalMasterVisualExceptionRange[]
  manifestHash: string
}

export interface OfflineFinalMasterAudioExceptionManifest {
  schemaVersion: 'approved-final-master-audio-exception-manifest-v1'
  ranges: OfflineFinalMasterAudioExceptionRange[]
  manifestHash: string
}

interface OfflineFinalMasterQaCommonPlanningPayload {
  qaRunId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  approvedExecutionPackageHash: string
  approvedEstimateId: string
  creditReservationId: string
  approvedDeliverableId: string
  expectedEvidenceIdentity: string
  finalMasterArtifactId: string
  finalMasterObjectIdentityHash: string
  width: number
  height: number
  fps: 24 | 25 | 30 | 50 | 60
  totalFrames: number
  mediaPolicyId: 'approved_h264_aac_yuv420p_bt709_web_master_v1'
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  mediaMutationAllowed: false
  providerCallAllowed: false
}

export interface OfflineFinalMasterVideoQaPlanningPayload
  extends OfflineFinalMasterQaCommonPlanningPayload {
  recipeProfileId: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE
  anomalyPolicyId: 'approved_objective_visual_anomaly_policy_v1'
  blackMinimumDurationFrames: number
  freezeMinimumDurationFrames: number
  flashSceneChangeThreshold: 0.8
  visualExceptionManifest: OfflineFinalMasterVisualExceptionManifest
}

export interface OfflineFinalMasterAudioQaPlanningPayload
  extends OfflineFinalMasterQaCommonPlanningPayload {
  recipeProfileId: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE
  audioPolicyId: 'approved_web_delivery_audio_policy_v1'
  sampleRate: 48_000
  channels: 1 | 2
  targetIntegratedLufs: -14
  integratedLufsTolerance: 1
  maximumTruePeakDbtp: -1
  maximumLoudnessRangeLufs: 7
  maximumAvSyncDriftFrames: 2
  silenceMinimumDurationFrames: number
  speechClarityEvidenceHash: string
  speechClarityStatus: 'passed'
  audioExceptionManifest: OfflineFinalMasterAudioExceptionManifest
}

export interface OfflineFinalMasterQaInputCommitment {
  inputId: 'final-master'
  artifactId: string
  objectIdentityHash: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
  privateObject: true
  placeholder: false
  publicObject: false
}

export interface OfflineFinalMasterVideoQaRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE
  payload: OfflineFinalMasterVideoQaPlanningPayload
  input: OfflineFinalMasterQaInputCommitment
}

export interface OfflineFinalMasterAudioQaRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE
  payload: OfflineFinalMasterAudioQaPlanningPayload
  input: OfflineFinalMasterQaInputCommitment
}

export function sealOfflineFinalMasterVisualExceptionManifest(
  ranges: OfflineFinalMasterVisualExceptionRange[],
): OfflineFinalMasterVisualExceptionManifest {
  const normalized = validateVisualRanges(ranges, Number.MAX_SAFE_INTEGER)
  const withoutHash = {
    schemaVersion: 'approved-final-master-visual-exception-manifest-v1' as const,
    ranges: normalized,
  }
  return { ...withoutHash, manifestHash: hashValue(withoutHash) }
}

export function sealOfflineFinalMasterAudioExceptionManifest(
  ranges: OfflineFinalMasterAudioExceptionRange[],
): OfflineFinalMasterAudioExceptionManifest {
  const normalized = validateAudioRanges(ranges, Number.MAX_SAFE_INTEGER)
  const withoutHash = {
    schemaVersion: 'approved-final-master-audio-exception-manifest-v1' as const,
    ranges: normalized,
  }
  return { ...withoutHash, manifestHash: hashValue(withoutHash) }
}

export function buildOfflineFinalMasterVideoQaRequest(input: {
  planningPayload: unknown
  finalMaster: OfflineFinalMasterQaInputCommitment
}): OfflineFinalMasterVideoQaRequest {
  return validateOfflineFinalMasterVideoQaRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE,
    payload: input.planningPayload,
    input: input.finalMaster,
  })
}

export function buildOfflineFinalMasterAudioQaRequest(input: {
  planningPayload: unknown
  finalMaster: OfflineFinalMasterQaInputCommitment
}): OfflineFinalMasterAudioQaRequest {
  return validateOfflineFinalMasterAudioQaRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE,
    payload: input.planningPayload,
    input: input.finalMaster,
  })
}

export function validateOfflineFinalMasterVideoQaRequest(
  value: unknown,
): OfflineFinalMasterVideoQaRequest {
  const request = validateRequestEnvelope(value)
  const payload = validateCommonPlanningPayload(
    request.payload,
    OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
    [
      'anomalyPolicyId', 'blackMinimumDurationFrames',
      'freezeMinimumDurationFrames', 'flashSceneChangeThreshold',
      'visualExceptionManifest',
    ],
  )
  if (
    payload.record.anomalyPolicyId !== 'approved_objective_visual_anomaly_policy_v1' ||
    payload.record.blackMinimumDurationFrames !== Math.max(2, Math.ceil(payload.fps / 15)) ||
    payload.record.freezeMinimumDurationFrames !== payload.fps * 2 ||
    payload.record.flashSceneChangeThreshold !== 0.8
  ) throw invalid('Final-master video anomaly policy is unsupported.')
  const visualExceptionManifest = validateVisualManifest(
    payload.record.visualExceptionManifest,
    payload.totalFrames,
  )
  const finalMaster = validateInputCommitment(request.input, payload)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE,
    payload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
      ...payload.common,
      anomalyPolicyId: 'approved_objective_visual_anomaly_policy_v1',
      blackMinimumDurationFrames: Number(payload.record.blackMinimumDurationFrames),
      freezeMinimumDurationFrames: Number(payload.record.freezeMinimumDurationFrames),
      flashSceneChangeThreshold: 0.8,
      visualExceptionManifest,
    },
    input: finalMaster,
  }
}

export function validateOfflineFinalMasterAudioQaRequest(
  value: unknown,
): OfflineFinalMasterAudioQaRequest {
  const request = validateRequestEnvelope(value)
  const payload = validateCommonPlanningPayload(
    request.payload,
    OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
    [
      'audioPolicyId', 'sampleRate', 'channels', 'targetIntegratedLufs',
      'integratedLufsTolerance', 'maximumTruePeakDbtp',
      'maximumLoudnessRangeLufs', 'maximumAvSyncDriftFrames',
      'silenceMinimumDurationFrames', 'speechClarityEvidenceHash',
      'speechClarityStatus', 'audioExceptionManifest',
    ],
  )
  if (
    payload.record.audioPolicyId !== 'approved_web_delivery_audio_policy_v1' ||
    payload.record.sampleRate !== 48_000 || ![1, 2].includes(Number(payload.record.channels)) ||
    payload.record.targetIntegratedLufs !== -14 ||
    payload.record.integratedLufsTolerance !== 1 ||
    payload.record.maximumTruePeakDbtp !== -1 ||
    payload.record.maximumLoudnessRangeLufs !== 7 ||
    payload.record.maximumAvSyncDriftFrames !== 2 ||
    payload.record.silenceMinimumDurationFrames !== payload.fps ||
    payload.record.speechClarityStatus !== 'passed'
  ) throw invalid('Final-master audio policy is unsupported.')
  const speechClarityEvidenceHash = hash(
    payload.record.speechClarityEvidenceHash,
    'speechClarityEvidenceHash',
  )
  const audioExceptionManifest = validateAudioManifest(
    payload.record.audioExceptionManifest,
    payload.totalFrames,
  )
  const finalMaster = validateInputCommitment(request.input, payload)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE,
    payload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
      ...payload.common,
      audioPolicyId: 'approved_web_delivery_audio_policy_v1',
      sampleRate: 48_000,
      channels: Number(payload.record.channels) as 1 | 2,
      targetIntegratedLufs: -14,
      integratedLufsTolerance: 1,
      maximumTruePeakDbtp: -1,
      maximumLoudnessRangeLufs: 7,
      maximumAvSyncDriftFrames: 2,
      silenceMinimumDurationFrames: Number(payload.record.silenceMinimumDurationFrames),
      speechClarityEvidenceHash,
      speechClarityStatus: 'passed',
      audioExceptionManifest,
    },
    input: finalMaster,
  }
}

export function offlineFinalMasterVideoQaRequestSha256(
  request: OfflineFinalMasterVideoQaRequest,
): string {
  return hashValue(validateOfflineFinalMasterVideoQaRequest(request))
}

export function offlineFinalMasterAudioQaRequestSha256(
  request: OfflineFinalMasterAudioQaRequest,
): string {
  return hashValue(validateOfflineFinalMasterAudioQaRequest(request))
}

function validateRequestEnvelope(value: unknown): Record<string, unknown> {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'input',
  ], 'final-master QA request')
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !== OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_INPUT_MODE
  ) throw invalid('Final-master QA request authority is unsupported.')
  return request
}

const COMMON_KEYS = [
  'recipeProfileId', 'qaRunId', 'approvedPlanSnapshotId',
  'approvedPlanSnapshotHash', 'approvedExecutionPackageHash',
  'approvedEstimateId', 'creditReservationId', 'approvedDeliverableId',
  'expectedEvidenceIdentity', 'finalMasterArtifactId',
  'finalMasterObjectIdentityHash', 'width', 'height', 'fps', 'totalFrames',
  'mediaPolicyId', 'usesApprovedEditReservation',
  'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
  'mediaMutationAllowed', 'providerCallAllowed',
] as const

function validateCommonPlanningPayload(
  value: unknown,
  recipeProfileId:
    | typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE
    | typeof OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
  additionalKeys: string[],
) {
  const record = exactRecord(
    value,
    [...COMMON_KEYS, ...additionalKeys],
    'final-master QA planning payload',
  )
  const width = integer(record.width, 1_080, 3_840, 'width')
  const height = integer(record.height, 1_080, 3_840, 'height')
  const fps = integer(record.fps, 24, 60, 'fps')
  const maximumFrames = fps * OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_DURATION_SECONDS
  const totalFrames = integer(record.totalFrames, 1, maximumFrames, 'totalFrames')
  if (
    record.recipeProfileId !== recipeProfileId || !FRAME_RATES.has(fps) ||
    !PROFESSIONAL_FRAMES.has(`${width}x${height}`) ||
    record.mediaPolicyId !== 'approved_h264_aac_yuv420p_bt709_web_master_v1' ||
    record.usesApprovedEditReservation !== true ||
    record.requiresSeparateExportEstimate !== false ||
    record.allowsAdditionalExportCharge !== false ||
    record.mediaMutationAllowed !== false || record.providerCallAllowed !== false
  ) throw invalid('Final-master QA planning authority is unsupported.')
  const common: OfflineFinalMasterQaCommonPlanningPayload = {
    qaRunId: identity(record.qaRunId, 'qaRunId'),
    approvedPlanSnapshotId: identity(record.approvedPlanSnapshotId, 'approvedPlanSnapshotId'),
    approvedPlanSnapshotHash: hash(record.approvedPlanSnapshotHash, 'approvedPlanSnapshotHash'),
    approvedExecutionPackageHash: hash(record.approvedExecutionPackageHash, 'approvedExecutionPackageHash'),
    approvedEstimateId: identity(record.approvedEstimateId, 'approvedEstimateId'),
    creditReservationId: identity(record.creditReservationId, 'creditReservationId'),
    approvedDeliverableId: identity(record.approvedDeliverableId, 'approvedDeliverableId'),
    expectedEvidenceIdentity: identity(record.expectedEvidenceIdentity, 'expectedEvidenceIdentity'),
    finalMasterArtifactId: identity(record.finalMasterArtifactId, 'finalMasterArtifactId'),
    finalMasterObjectIdentityHash: hash(record.finalMasterObjectIdentityHash, 'finalMasterObjectIdentityHash'),
    width, height, fps: fps as OfflineFinalMasterQaCommonPlanningPayload['fps'], totalFrames,
    mediaPolicyId: 'approved_h264_aac_yuv420p_bt709_web_master_v1',
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    mediaMutationAllowed: false,
    providerCallAllowed: false,
  }
  return { record, common, fps, totalFrames }
}

function validateInputCommitment(
  value: unknown,
  payload: ReturnType<typeof validateCommonPlanningPayload>,
): OfflineFinalMasterQaInputCommitment {
  const input = exactRecord(value, [
    'inputId', 'artifactId', 'objectIdentityHash', 'mimeType', 'byteLength',
    'sha256', 'privateObject', 'placeholder', 'publicObject',
  ], 'final-master input commitment')
  if (
    input.inputId !== 'final-master' || input.mimeType !== 'video/mp4' ||
    input.privateObject !== true || input.placeholder !== false ||
    input.publicObject !== false
  ) throw invalid('Final-master input must remain one exact private MP4 artifact.')
  const artifactId = identity(input.artifactId, 'input artifactId')
  const objectIdentityHash = hash(input.objectIdentityHash, 'input objectIdentityHash')
  if (
    artifactId !== payload.common.finalMasterArtifactId ||
    objectIdentityHash !== payload.common.finalMasterObjectIdentityHash
  ) throw invalid('Final-master input lost approved artifact identity.')
  return {
    inputId: 'final-master', artifactId, objectIdentityHash,
    mimeType: 'video/mp4',
    byteLength: integer(
      input.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_BYTES,
      'input byteLength',
    ),
    sha256: hash(input.sha256, 'input sha256'),
    privateObject: true, placeholder: false, publicObject: false,
  }
}

function validateVisualManifest(
  value: unknown,
  totalFrames: number,
): OfflineFinalMasterVisualExceptionManifest {
  const manifest = exactRecord(
    value,
    ['schemaVersion', 'ranges', 'manifestHash'],
    'visual exception manifest',
  )
  if (
    manifest.schemaVersion !== 'approved-final-master-visual-exception-manifest-v1' ||
    !Array.isArray(manifest.ranges)
  ) throw invalid('Visual exception manifest is unsupported.')
  const ranges = validateVisualRanges(manifest.ranges, totalFrames)
  const withoutHash = {
    schemaVersion: 'approved-final-master-visual-exception-manifest-v1' as const,
    ranges,
  }
  if (manifest.manifestHash !== hashValue(withoutHash)) {
    throw invalid('Visual exception manifest hash is invalid.')
  }
  return { ...withoutHash, manifestHash: String(manifest.manifestHash) }
}

function validateAudioManifest(
  value: unknown,
  totalFrames: number,
): OfflineFinalMasterAudioExceptionManifest {
  const manifest = exactRecord(
    value,
    ['schemaVersion', 'ranges', 'manifestHash'],
    'audio exception manifest',
  )
  if (
    manifest.schemaVersion !== 'approved-final-master-audio-exception-manifest-v1' ||
    !Array.isArray(manifest.ranges)
  ) throw invalid('Audio exception manifest is unsupported.')
  const ranges = validateAudioRanges(manifest.ranges, totalFrames)
  const withoutHash = {
    schemaVersion: 'approved-final-master-audio-exception-manifest-v1' as const,
    ranges,
  }
  if (manifest.manifestHash !== hashValue(withoutHash)) {
    throw invalid('Audio exception manifest hash is invalid.')
  }
  return { ...withoutHash, manifestHash: String(manifest.manifestHash) }
}

function validateVisualRanges(
  values: unknown[],
  totalFrames: number,
): OfflineFinalMasterVisualExceptionRange[] {
  return validateRanges(values, totalFrames, [
    'approved_black_hold', 'approved_freeze_hold', 'approved_flash_or_cut',
  ]) as OfflineFinalMasterVisualExceptionRange[]
}

function validateAudioRanges(
  values: unknown[],
  totalFrames: number,
): OfflineFinalMasterAudioExceptionRange[] {
  return validateRanges(values, totalFrames, [
    'approved_digital_silence',
  ]) as OfflineFinalMasterAudioExceptionRange[]
}

function validateRanges(
  values: unknown[],
  totalFrames: number,
  allowedKinds: string[],
): Array<OfflineFinalMasterVisualExceptionRange | OfflineFinalMasterAudioExceptionRange> {
  if (values.length > OFFLINE_MEDIA_BINARY_FINAL_MASTER_QA_MAXIMUM_EXCEPTION_RANGES) {
    throw invalid('Final-master exception manifest exceeds its fixed bound.')
  }
  const ids = new Set<string>()
  const ranges = values.map((value, index) => {
    const range = exactRecord(value, [
      'exceptionId', 'kind', 'startFrame', 'endFrameExclusive',
      'approvalEvidenceHash',
    ], `final-master exception ${index + 1}`)
    const exceptionId = identity(range.exceptionId, 'exceptionId')
    const startFrame = integer(range.startFrame, 0, totalFrames - 1, 'exception startFrame')
    const endFrameExclusive = integer(
      range.endFrameExclusive,
      1,
      totalFrames,
      'exception endFrameExclusive',
    )
    if (
      ids.has(exceptionId) || endFrameExclusive <= startFrame ||
      !allowedKinds.includes(String(range.kind))
    ) throw invalid('Final-master exception range is invalid.')
    ids.add(exceptionId)
    return {
      exceptionId,
      kind: String(range.kind),
      startFrame,
      endFrameExclusive,
      approvalEvidenceHash: hash(range.approvalEvidenceHash, 'approvalEvidenceHash'),
    }
  })
  return ranges.sort((left, right) =>
    left.startFrame - right.startFrame ||
    left.endFrameExclusive - right.endFrameExclusive ||
    left.exceptionId.localeCompare(right.exceptionId)) as Array<
      OfflineFinalMasterVisualExceptionRange | OfflineFinalMasterAudioExceptionRange
    >
}

function exactRecord(value: unknown, keys: readonly string[], label: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} must be an object.`)
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return record
}

function identity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || value !== value.trim() ||
    !IDENTITY.test(value) || value.includes('..')
  ) throw invalid(`Final-master ${label} is invalid.`)
  return value
}

function hash(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`Final-master ${label} is invalid.`)
  }
  return value
}

function integer(value: unknown, minimum: number, maximum: number, label: string): number {
  if (
    !Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum
  ) throw invalid(`Final-master ${label} is outside its fixed bound.`)
  return Number(value)
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'offline_media_binary_final_master_objective_qa_contract',
  })
}
