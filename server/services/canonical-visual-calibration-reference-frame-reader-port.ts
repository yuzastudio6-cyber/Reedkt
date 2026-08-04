import { ApiError } from '../errors/api-error'
import type { OfflineMediaBinaryServerInjectedInput } from
  '../tool-execution/media-binary-execution'

export const CANONICAL_VISUAL_CALIBRATION_REFERENCE_FRAME_READER_PORT_VERSION =
  'canonical-visual-calibration-reference-frame-reader-port-v1' as const

export interface CanonicalVisualCalibrationReferenceFrameReadRequest {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  executionAttemptId: string
  visualCalibrationContextDigest: string
  firstFrame: {
    assetId: string
    expectedAssetVersionId: string
    expectedSha256: string
  }
  lastFrame: {
    assetId: string
    expectedAssetVersionId: string
    expectedSha256: string
  }
}

export interface CanonicalVisualCalibrationReferenceFrameRead {
  assetId: string
  assetVersionId: string
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  storageEvidenceHash: string
  readbackEvidenceHash: string
  checksumReadbackVerified: true
  input: OfflineMediaBinaryServerInjectedInput
}

export interface CanonicalVisualCalibrationReferenceFrameReadResult {
  firstFrame: CanonicalVisualCalibrationReferenceFrameRead
  lastFrame: CanonicalVisualCalibrationReferenceFrameRead
  evidenceClass: 'controlled_test_fixture'
  privateObjectRead: true
  callerLocationAccepted: false
  browserReadable: false
  productionAuthority: false
}

export interface CanonicalVisualCalibrationReferenceFrameReaderPort {
  readonly schemaVersion:
    typeof CANONICAL_VISUAL_CALIBRATION_REFERENCE_FRAME_READER_PORT_VERSION
  readonly source: 'server_injected_controlled_reference_frame_reader'
  readonly evidenceClass: 'controlled_test_fixture'
  readonly productionAuthority: false
  read(
    input: CanonicalVisualCalibrationReferenceFrameReadRequest,
  ): Promise<CanonicalVisualCalibrationReferenceFrameReadResult>
}

const admittedPorts = new WeakSet<object>()

export function createControlledVisualCalibrationReferenceFrameReaderPort(
  read: CanonicalVisualCalibrationReferenceFrameReaderPort['read'],
): CanonicalVisualCalibrationReferenceFrameReaderPort {
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_VISUAL_CALIBRATION_REFERENCE_FRAME_READER_PORT_VERSION,
    source: 'server_injected_controlled_reference_frame_reader' as const,
    evidenceClass: 'controlled_test_fixture' as const,
    productionAuthority: false as const,
    read,
  })
  admittedPorts.add(port)
  return port
}

export async function readCanonicalVisualCalibrationReferenceFrames(input: {
  port: CanonicalVisualCalibrationReferenceFrameReaderPort | undefined
  request: CanonicalVisualCalibrationReferenceFrameReadRequest
}): Promise<CanonicalVisualCalibrationReferenceFrameReadResult> {
  if (
    !input.port || !admittedPorts.has(input.port) ||
    input.port.schemaVersion !==
      CANONICAL_VISUAL_CALIBRATION_REFERENCE_FRAME_READER_PORT_VERSION ||
    input.port.source !== 'server_injected_controlled_reference_frame_reader' ||
    input.port.evidenceClass !== 'controlled_test_fixture' ||
    input.port.productionAuthority !== false
  ) throw unavailable(
    'A source-qualified private reference-frame reader is required.',
  )
  assertRequest(input.request)
  const result = await input.port.read(Object.freeze({
    ...input.request,
    firstFrame: Object.freeze({ ...input.request.firstFrame }),
    lastFrame: Object.freeze({ ...input.request.lastFrame }),
  }))
  if (
    result.evidenceClass !== 'controlled_test_fixture' ||
    result.privateObjectRead !== true ||
    result.callerLocationAccepted !== false ||
    result.browserReadable !== false ||
    result.productionAuthority !== false ||
    result.firstFrame.assetId !== input.request.firstFrame.assetId ||
    result.firstFrame.assetVersionId !==
      input.request.firstFrame.expectedAssetVersionId ||
    result.firstFrame.sha256 !== input.request.firstFrame.expectedSha256 ||
    result.lastFrame.assetId !== input.request.lastFrame.assetId ||
    result.lastFrame.assetVersionId !==
      input.request.lastFrame.expectedAssetVersionId ||
    result.lastFrame.sha256 !== input.request.lastFrame.expectedSha256
  ) throw invalid('Reference-frame reader returned changed source authority.')
  assertFrame(result.firstFrame)
  assertFrame(result.lastFrame)
  return result
}

function assertRequest(value: CanonicalVisualCalibrationReferenceFrameReadRequest): void {
  for (const identity of [
    value.ownerUserId, value.workspaceId, value.projectId, value.editSessionId,
    value.approvedPlanSnapshotId, value.approvedWorkItemId, value.jobId,
    value.executionAttemptId, value.firstFrame.assetId,
    value.firstFrame.expectedAssetVersionId, value.lastFrame.assetId,
    value.lastFrame.expectedAssetVersionId,
  ]) if (!safeIdentity(identity)) throw invalid('Reference-frame request identity is invalid.')
  for (const digest of [
    value.visualCalibrationContextDigest,
    value.firstFrame.expectedSha256,
    value.lastFrame.expectedSha256,
  ]) if (!sha256(digest)) throw invalid('Reference-frame request digest is invalid.')
}

function assertFrame(value: CanonicalVisualCalibrationReferenceFrameRead): void {
  if (
    !safeIdentity(value.assetId) || !safeIdentity(value.assetVersionId) ||
    !sha256(value.sha256) || !sha256(value.privateObjectIdentityHash) ||
    !sha256(value.storageEvidenceHash) || !sha256(value.readbackEvidenceHash) ||
    !Number.isSafeInteger(value.byteLength) || value.byteLength < 12 ||
    value.byteLength > 16_777_216 ||
    value.checksumReadbackVerified !== true ||
    value.input.inputMode !== 'private_verified_stream_v1' ||
    value.input.byteLength !== value.byteLength ||
    value.input.sha256 !== value.sha256
  ) throw invalid('Reference-frame private read evidence is invalid.')
}

function safeIdentity(value: string): boolean {
  return value === value.trim() && value.length >= 1 && value.length <= 240 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) && !value.includes('..')
}

function sha256(value: string): boolean {
  return /^[a-f0-9]{64}$/u.test(value)
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_visual_calibration_reference_frame_readback',
  })
}

function unavailable(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_visual_calibration_reference_frame_reader_port',
  })
}
