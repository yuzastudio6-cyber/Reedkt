import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE,
  inspectExistingOfflineRemotionDockerRuntime,
  runOfflineRemotionContainer,
  runOfflineRemotionStreamingContainer,
  type OfflineRemotionContainerStreamingInput,
  type OfflineRemotionContainerStreamingOutputSink,
} from './offline-remotion-render-docker-runtime'
import {
  isMotionStudioAnimaticPayload,
  isMotionStudioLayeredPayload,
  isMotionStudioRouteDrawPayload,
  isMotionStudioScenePreviewPayload,
  OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL,
  OFFLINE_REMOTION_RENDER_OPERATION,
  offlineRemotionRequestSha256,
  validateOfflineRemotionRenderRequest,
} from './offline-remotion-render-execution-protocol'
import type {
  OfflineRemotionDeliveryH264ChunkStreamingResult,
  OfflineRemotionImageEvidence,
  OfflineRemotionRenderResult,
  OfflineRemotionRuntimeAuthority,
  OfflineRemotionStreamingRenderResult,
} from './offline-remotion-render-execution-types'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_CONTAINER_PROTOCOL,
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  offlineRemotionStreamingInputCommitments,
  offlineRemotionStreamingRequestSha256,
  validateOfflineRemotionStreamingRenderRequest,
} from './offline-remotion-render-streaming-protocol'
import {
  OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_CONTAINER_PROTOCOL,
  offlineRemotionLongFormMergeInputCommitments,
  offlineRemotionLongFormMergeRequestSha256,
  validateOfflineRemotionLongFormMergeStreamingRequest,
} from './offline-remotion-long-form-merge-protocol'
import type {
  OfflineRemotionLongFormMergeStreamingResult,
} from './offline-remotion-render-execution-types'
import {
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_CONTAINER_PROTOCOL,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE,
  offlineRemotionDeliveryH264ChunkInputCommitments,
  offlineRemotionDeliveryH264ChunkRequestSha256,
  validateOfflineRemotionDeliveryH264ChunkRequest,
} from './offline-remotion-delivery-h264-chunk-protocol'

export const OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT =
  `/tmp/reeditpro-canonical-private-offline-remotion-render-execution-${OFFLINE_REMOTION_LOCAL_RUNTIME_NAMESPACE}` as const
export const OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH =
  'runtime-authority/offline-remotion-render-runtime-v2.json' as const
const STORAGE_ROOT = OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT
const AUTHORITY_PATH = OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH
const BLOCKERS = Object.freeze([
  'Canonical approved-snapshot execution, private artifact authority, reconciliation, replay, cost events, and final render/export settlement remain separate evidence gates.',
  'This runtime is private single-host evidence and is not deployed worker-fleet, service-identity, multi-architecture, scanning, observability, or recovery evidence.',
  'The bounded proof composition is not a public delivery or production final-export authority.',
  'The source-boundary profile remains limited to eight chunks/1,920 frames; the source-slice profile remains limited to sixteen chunks/3,840 frames, and distributed object/mezzanine evidence remains blocked.',
  'The delivery H.264 chunk profile remains private single-host evidence; independent chunk QA, final H.264/AAC mux, decoded master QA, download reconciliation, cloud dispatch, and production remain blocked.',
] as const)

export interface PrivateOfflineRemotionRenderRuntime {
  readonly image: OfflineRemotionImageEvidence
  execute(value: unknown): Promise<OfflineRemotionRenderResult>
  executeServerInjected(
    value: unknown,
    inputs: OfflineRemotionServerInjectedInput[],
    outputSink: OfflineRemotionContainerStreamingOutputSink,
  ): Promise<OfflineRemotionStreamingRenderResult>
  executeLongFormMergeServerInjected(
    value: unknown,
    inputs: OfflineRemotionServerInjectedInput[],
    outputSink: OfflineRemotionContainerStreamingOutputSink,
  ): Promise<OfflineRemotionLongFormMergeStreamingResult>
  executeDeliveryH264ChunkServerInjected(
    value: unknown,
    inputs: OfflineRemotionServerInjectedInput[],
    outputSink: OfflineRemotionContainerStreamingOutputSink,
  ): Promise<OfflineRemotionDeliveryH264ChunkStreamingResult>
}

export interface OfflineRemotionServerInjectedInput extends OfflineRemotionContainerStreamingInput {
  inputMode: 'private_verified_stream_v1'
}

export async function activatePrivateOfflineRemotionRenderRuntime(): Promise<PrivateOfflineRemotionRenderRuntime> {
  if (arguments.length !== 0) throw validationFailure('Remotion runtime activation accepts no caller input.')
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  await persistAuthority(image)
  return runtimeForImage(image)
}

export async function openPrivateOfflineRemotionRenderRuntime(): Promise<PrivateOfflineRemotionRenderRuntime> {
  if (arguments.length !== 0) throw validationFailure('Remotion runtime open accepts no caller input.')
  const authority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
  if (!authority) throw runtimeFailure('Verified private Remotion runtime authority is unavailable.')
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw runtimeFailure('Private Remotion image changed after runtime activation.')
  }
  return runtimeForImage(image)
}

function runtimeForImage(image: OfflineRemotionImageEvidence): PrivateOfflineRemotionRenderRuntime {
  return Object.freeze({
    image,
    execute: (value: unknown) => executeWithImage(image, value),
    executeServerInjected: (
      value: unknown,
      inputs: OfflineRemotionServerInjectedInput[],
      outputSink: OfflineRemotionContainerStreamingOutputSink,
    ) => executeStreamingWithImage(image, value, inputs, outputSink),
    executeLongFormMergeServerInjected: (
      value: unknown,
      inputs: OfflineRemotionServerInjectedInput[],
      outputSink: OfflineRemotionContainerStreamingOutputSink,
    ) => executeLongFormMergeStreamingWithImage(image, value, inputs, outputSink),
    executeDeliveryH264ChunkServerInjected: (
      value: unknown,
      inputs: OfflineRemotionServerInjectedInput[],
      outputSink: OfflineRemotionContainerStreamingOutputSink,
    ) => executeDeliveryH264ChunkStreamingWithImage(
      image,
      value,
      inputs,
      outputSink,
    ),
  })
}

export async function readPersistedOfflineRemotionRenderRuntimeAuthority(): Promise<OfflineRemotionRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw runtimeFailure('Private Remotion runtime authority is invalid JSON.') }
  const envelope = record(parsed); const authority = record(envelope.authority)
  if (
    envelope.recordVersion !== 'offline-remotion-render-runtime-authority-record-v1' ||
    envelope.source !== 'private_local_checksum_protected_remotion_runtime' ||
    envelope.checksumSha256 !== sha256AuthorityValue(authority)
  ) throw runtimeFailure('Private Remotion runtime authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-remotion-render-runtime-authority-v1' ||
    authority.source !== 'private_local_offline_remotion_render_runtime_authority' ||
    record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).productReady !== false ||
    record(authority.readiness).privateInternalFinalCompositionReady !== true ||
    record(authority.readiness).serverInjectedStreamingFinalCompositionReady !== true ||
    record(authority.readiness).serverInjectedStreamingLongFormMergeReady !== true ||
    record(authority.readiness)
      .serverInjectedStreamingDeliveryH264ChunkReady !== true ||
    record(authority.readiness).finalExportReady !== false
  ) throw runtimeFailure('Private Remotion runtime authority boundary is invalid.')
  return authority as unknown as OfflineRemotionRuntimeAuthority
}

async function executeDeliveryH264ChunkStreamingWithImage(
  image: OfflineRemotionImageEvidence,
  value: unknown,
  inputs: OfflineRemotionServerInjectedInput[],
  outputSink: OfflineRemotionContainerStreamingOutputSink,
): Promise<OfflineRemotionDeliveryH264ChunkStreamingResult> {
  const request = validateOfflineRemotionDeliveryH264ChunkRequest(value)
  const expectedInputs = offlineRemotionDeliveryH264ChunkInputCommitments(
    request,
  )
  if (
    !Array.isArray(inputs) || inputs.length !== 1 ||
    inputs.some((input, index) => {
      const expected = expectedInputs[index]
      return !expected || input.inputMode !== 'private_verified_stream_v1' ||
        input.inputId !== expected.inputId ||
        input.mimeType !== expected.mimeType ||
        input.byteLength !== expected.byteLength ||
        input.sha256 !== expected.sha256 ||
        typeof input.openStream !== 'function'
    }) ||
    !outputSink ||
    outputSink.maximumBytes !==
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw validationFailure(
    'Server-injected delivery H.264 source does not match its exact commitment.',
  )
  const result = await runOfflineRemotionStreamingContainer({
    image,
    serializedManifest: JSON.stringify(request),
    inputs,
    outputSink,
    resourceProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE,
  })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) {
    throw runtimeFailure(
      'Private delivery H.264 chunk execution failed.',
      new Error(result.stderr.slice(-4_000)),
    )
  }
  const response = parseResponse(result.stdoutHeader)
  const artifactRecord = record(response.artifact)
  const semantic = record(response.semanticEvidence)
  const readiness = record(response.readiness)
  const byteLength = Number(artifactRecord.byteLength)
  const artifactSha256 = string(artifactRecord.sha256)
  if (
    response.schemaVersion !==
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_CONTAINER_PROTOCOL ||
    response.ok !== true || response.toolId !== 'remotion' ||
    response.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    response.status !== 'actual_remotion_media_render_completed' ||
    record(response.packageIdentity).packageName !==
      'remotion+@remotion/renderer' ||
    record(response.packageIdentity).version !== '4.0.487' ||
    response.requestEnvelopeSha256 !==
      offlineRemotionDeliveryH264ChunkRequestSha256(request) ||
    artifactRecord.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(byteLength) || byteLength < 1_024 ||
    byteLength > OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES ||
    !/^[a-f0-9]{64}$/u.test(artifactSha256) ||
    result.outputReceipt.byteLength !== byteLength ||
    result.outputReceipt.sha256 !== artifactSha256 ||
    artifactRecord.width !== request.payload.width ||
    artifactRecord.height !== request.payload.height ||
    artifactRecord.fps !== request.payload.fps ||
    artifactRecord.durationFrames !== request.payload.durationFrames ||
    result.confinement.memoryLimitBytes !== 8_589_934_592 ||
    result.confinement.nanoCpus !== 4_000_000_000 ||
    result.confinement.tmpfsSizeBytes !== 7_516_192_768 ||
    readiness.privateInternalOnly !== true ||
    readiness.productReady !== false ||
    readiness.privateInternalDeliveryH264ChunkReady !== true ||
    semantic.serverInjectedInputStreamsMaterializedAndReverified !== true ||
    semantic.serverInjectedOutputStreamEmitted !== true ||
    semantic.base64MediaTransportAvoided !== true ||
    semantic.approvedDeliveryH264ChunkProfileExecuted !== true ||
    semantic.exactPassedVp9ObjectChunkBytesVerified !== true ||
    semantic.sourceFrameCountPreserved !== true ||
    semantic.videoOnlyH264HighCrf18MediumApplied !== true ||
    semantic.fixedBt709LimitedRangePolicyApplied !== true ||
    semantic.approvedReservationReuseOnly !== true ||
    semantic.secondEstimateOrExportChargeForbidden !== true ||
    !Object.values(semantic).every((item) => item === true)
  ) throw runtimeFailure(
    'Private delivery H.264 chunk result evidence is invalid.',
  )
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion:
      'offline-remotion-delivery-h264-chunk-stream-execution-attestation-v1' as const,
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256:
      offlineRemotionDeliveryH264ChunkRequestSha256(request),
    artifactSha256,
    artifactByteLength: byteLength,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion:
        'offline-remotion-delivery-h264-chunk-stream-execution-attestation-record-v1',
      source:
        'private_local_checksum_protected_remotion_delivery_h264_chunk_execution',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    schemaVersion:
      'offline-remotion-delivery-h264-chunk-stream-execution-result-v1',
    request,
    artifact: {
      mimeType: 'video/mp4',
      byteLength,
      sha256: artifactSha256,
      width: Number(artifactRecord.width),
      height: Number(artifactRecord.height),
      fps: Number(artifactRecord.fps),
      durationFrames: Number(artifactRecord.durationFrames),
      durationSeconds: Number(artifactRecord.durationSeconds),
    },
    evidence: {
      packageName: 'remotion+@remotion/renderer',
      packageVersion: '4.0.487',
      requestEnvelopeSha256: String(response.requestEnvelopeSha256),
      image,
      confinement: result.confinement,
      semanticEvidence: semantic as Record<string, true>,
      inputTransport: 'length_framed_server_injected_private_stream_v2',
      outputTransport: 'length_committed_private_stream_v2',
      resourceProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE,
      containerExitCode: 0,
      oomKilled: false,
    },
    attestation,
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      privateInternalDeliveryH264ChunkReady: true,
      independentChunkQaVerified: false,
      serverInjectedStreamingReady: true,
      canonicalDispatchIntegrated: false,
    },
  }
}

export async function executePrivateOfflineRemotionRender(value: unknown): Promise<OfflineRemotionRenderResult> {
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  return executeWithImage(image, value)
}

async function executeWithImage(image: OfflineRemotionImageEvidence, value: unknown): Promise<OfflineRemotionRenderResult> {
  const request = validateOfflineRemotionRenderRequest(value)
  const result = await runOfflineRemotionContainer({ image, serializedRequest: JSON.stringify(request) })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) throw runtimeFailure('Private Remotion execution failed.', new Error(result.stderr.slice(-4_000)))
  const response = parseResponse(result.stdout)
  const artifactRecord = record(response.artifact)
  const bytes = Buffer.from(string(artifactRecord.bytesBase64), 'base64')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const expectedFrames = isMotionStudioRouteDrawPayload(request.payload)
    ? [0, 45, 90, 135, 179]
    : isMotionStudioScenePreviewPayload(request.payload) ||
      isMotionStudioLayeredPayload(request.payload) || isMotionStudioAnimaticPayload(request.payload)
      ? [...new Set([0, Math.floor((request.payload.durationFrames - 1) / 2), request.payload.durationFrames - 1])]
      : []
  if (expectedFrames.length > 0 && !Array.isArray(artifactRecord.frameArtifacts)) {
    throw runtimeFailure('Private Motion Studio Remotion result omitted frame-golden evidence.')
  }
  const frameArtifacts = (Array.isArray(artifactRecord.frameArtifacts) ? artifactRecord.frameArtifacts : []).map((value) => {
    const frameRecord = record(value)
    const frameBytes = Buffer.from(string(frameRecord.bytesBase64), 'base64')
    const frameSha256 = createHash('sha256').update(frameBytes).digest('hex')
    if (
      !Number.isSafeInteger(frameRecord.frame) || Number(frameRecord.frame) < 0 ||
      frameRecord.mimeType !== 'image/png' || frameRecord.byteLength !== frameBytes.byteLength ||
      frameRecord.sha256 !== frameSha256 || frameBytes.byteLength < 1024 || frameBytes.byteLength > 8 * 1024 * 1024 ||
      frameBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    ) throw runtimeFailure('Private Remotion frame-golden evidence is invalid.')
    return { frame: Number(frameRecord.frame), mimeType: 'image/png' as const, bytes: frameBytes, byteLength: frameBytes.byteLength, sha256: frameSha256 }
  })
  if (
    frameArtifacts.length !== expectedFrames.length ||
    frameArtifacts.some((artifact, index) => artifact.frame !== expectedFrames[index])
  ) throw runtimeFailure('Private Remotion frame-golden selection diverged from exact timing authority.')
  if (
    response.schemaVersion !== OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL || response.ok !== true || response.toolId !== 'remotion' ||
    response.operationId !== OFFLINE_REMOTION_RENDER_OPERATION || response.status !== 'actual_remotion_media_render_completed' ||
    record(response.packageIdentity).packageName !== 'remotion+@remotion/renderer' || record(response.packageIdentity).version !== '4.0.487' ||
    response.requestEnvelopeSha256 !== offlineRemotionRequestSha256(request) || artifactRecord.mimeType !== 'video/mp4' ||
    artifactRecord.byteLength !== bytes.byteLength || artifactRecord.sha256 !== sha256 || bytes.length < 1024 || bytes.length > 32 * 1024 * 1024 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp' || artifactRecord.width !== request.payload.width || artifactRecord.height !== request.payload.height ||
    artifactRecord.fps !== request.payload.fps || artifactRecord.durationFrames !== request.payload.durationFrames ||
    record(response.readiness).privateInternalOnly !== true || record(response.readiness).productReady !== false ||
    !Object.values(record(response.semanticEvidence)).every((value) => value === true)
  ) throw runtimeFailure('Private Remotion result evidence is invalid.')
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-remotion-render-execution-attestation-v2' as const,
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: offlineRemotionRequestSha256(request),
    artifactSha256: sha256,
    frameArtifactDigests: frameArtifacts.map(({ frame, sha256: frameSha256 }) => ({ frame, sha256: frameSha256 })),
    confinementHash: sha256AuthorityValue(result.confinement),
    resourceObservationHash: result.resourceObservation.observationHash,
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-remotion-render-execution-attestation-record-v2',
      source: 'private_local_checksum_protected_remotion_execution',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    schemaVersion: 'offline-remotion-render-execution-result-v2', request,
    artifact: { mimeType: 'video/mp4', bytes, byteLength: bytes.length, sha256, width: Number(artifactRecord.width), height: Number(artifactRecord.height), fps: Number(artifactRecord.fps), durationFrames: Number(artifactRecord.durationFrames), durationSeconds: Number(artifactRecord.durationSeconds) },
    frameArtifacts,
    evidence: { packageName: 'remotion+@remotion/renderer', packageVersion: '4.0.487', requestEnvelopeSha256: String(response.requestEnvelopeSha256), image, confinement: result.confinement, semanticEvidence: record(response.semanticEvidence) as Record<string, true>, resourceObservation: result.resourceObservation, containerExitCode: 0, oomKilled: false },
    attestation,
    readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false, privateInternalFinalCompositionReady: true, canonicalDispatchIntegrated: false },
  }
}

async function executeStreamingWithImage(
  image: OfflineRemotionImageEvidence,
  value: unknown,
  inputs: OfflineRemotionServerInjectedInput[],
  outputSink: OfflineRemotionContainerStreamingOutputSink,
): Promise<OfflineRemotionStreamingRenderResult> {
  const request = validateOfflineRemotionStreamingRenderRequest(value)
  const expectedInputs = offlineRemotionStreamingInputCommitments(request)
  if (
    !Array.isArray(inputs) || inputs.length !== expectedInputs.length ||
    inputs.some((input, index) => {
      const expected = expectedInputs[index]
      return !expected || input.inputMode !== 'private_verified_stream_v1' ||
        input.inputId !== expected.inputId || input.mimeType !== expected.mimeType ||
        input.byteLength !== expected.byteLength || input.sha256 !== expected.sha256 ||
        typeof input.openStream !== 'function'
    }) ||
    !outputSink || outputSink.maximumBytes !== OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw validationFailure('Server-injected Remotion streams do not match the exact request commitments.')
  const serializedManifest = JSON.stringify(request)
  const result = await runOfflineRemotionStreamingContainer({
    image,
    serializedManifest,
    inputs,
    outputSink,
  })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) {
    throw runtimeFailure(
      'Private streaming Remotion execution failed.',
      new Error(result.stderr.slice(-4_000)),
    )
  }
  const response = parseResponse(result.stdoutHeader)
  const artifactRecord = record(response.artifact)
  const byteLength = Number(artifactRecord.byteLength)
  const artifactSha256 = string(artifactRecord.sha256)
  if (
    response.schemaVersion !== OFFLINE_REMOTION_RENDER_STREAMING_CONTAINER_PROTOCOL ||
    response.ok !== true || response.toolId !== 'remotion' ||
    response.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    response.status !== 'actual_remotion_media_render_completed' ||
    record(response.packageIdentity).packageName !== 'remotion+@remotion/renderer' ||
    record(response.packageIdentity).version !== '4.0.487' ||
    response.requestEnvelopeSha256 !== offlineRemotionStreamingRequestSha256(request) ||
    artifactRecord.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(byteLength) || byteLength < 1_024 ||
    byteLength > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES ||
    !/^[a-f0-9]{64}$/u.test(artifactSha256) ||
    result.outputReceipt.byteLength !== byteLength ||
    result.outputReceipt.sha256 !== artifactSha256 ||
    artifactRecord.width !== request.payload.width ||
    artifactRecord.height !== request.payload.height ||
    artifactRecord.fps !== request.payload.fps ||
    artifactRecord.durationFrames !== request.payload.durationFrames ||
    record(response.readiness).privateInternalOnly !== true ||
    record(response.readiness).productReady !== false ||
    record(response.semanticEvidence).serverInjectedInputStreamsMaterializedAndReverified !== true ||
    record(response.semanticEvidence).serverInjectedOutputStreamEmitted !== true ||
    record(response.semanticEvidence).base64MediaTransportAvoided !== true ||
    (request.payload.audioPolicy === 'replace_with_approved_voice_tracks' &&
      record(response.semanticEvidence).approvedVoiceTrackInputStreamedWithoutWholeBuffer !== true) ||
    !Object.values(record(response.semanticEvidence)).every((item) => item === true)
  ) throw runtimeFailure('Private streaming Remotion result evidence is invalid.')
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-remotion-render-stream-execution-attestation-v2' as const,
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: offlineRemotionStreamingRequestSha256(request),
    artifactSha256,
    artifactByteLength: byteLength,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-remotion-render-stream-execution-attestation-record-v2',
      source: 'private_local_checksum_protected_remotion_stream_execution',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    schemaVersion: 'offline-remotion-render-stream-execution-result-v2',
    request,
    artifact: {
      mimeType: 'video/mp4', byteLength, sha256: artifactSha256,
      width: Number(artifactRecord.width), height: Number(artifactRecord.height),
      fps: Number(artifactRecord.fps),
      durationFrames: Number(artifactRecord.durationFrames),
      durationSeconds: Number(artifactRecord.durationSeconds),
    },
    evidence: {
      packageName: 'remotion+@remotion/renderer', packageVersion: '4.0.487',
      requestEnvelopeSha256: String(response.requestEnvelopeSha256),
      image, confinement: result.confinement,
      semanticEvidence: record(response.semanticEvidence) as Record<string, true>,
      inputTransport: 'length_framed_server_injected_private_stream_v2',
      outputTransport: 'length_committed_private_stream_v2',
      containerExitCode: 0, oomKilled: false,
    },
    attestation,
    readiness: {
      privateInternalOnly: true, productReady: false, externalBetaReady: false,
      productionReady: false, privateInternalFinalCompositionReady: true,
      serverInjectedStreamingReady: true, canonicalDispatchIntegrated: false,
    },
  }
}

async function executeLongFormMergeStreamingWithImage(
  image: OfflineRemotionImageEvidence,
  value: unknown,
  inputs: OfflineRemotionServerInjectedInput[],
  outputSink: OfflineRemotionContainerStreamingOutputSink,
): Promise<OfflineRemotionLongFormMergeStreamingResult> {
  const request = validateOfflineRemotionLongFormMergeStreamingRequest(value)
  const expectedInputs = offlineRemotionLongFormMergeInputCommitments(request)
  if (
    !Array.isArray(inputs) || inputs.length !== expectedInputs.length ||
    inputs.some((input, index) => {
      const expected = expectedInputs[index]
      return !expected || input.inputMode !== 'private_verified_stream_v1' ||
        input.inputId !== expected.inputId || input.mimeType !== expected.mimeType ||
        input.byteLength !== expected.byteLength || input.sha256 !== expected.sha256 ||
        typeof input.openStream !== 'function'
    }) ||
    !outputSink || outputSink.maximumBytes !== OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw validationFailure('Server-injected long-form chunk streams do not match their exact commitments.')
  const result = await runOfflineRemotionStreamingContainer({
    image,
    serializedManifest: JSON.stringify(request),
    inputs,
    outputSink,
  })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) {
    throw runtimeFailure(
      'Private streaming Remotion long-form merge failed.',
      new Error(result.stderr.slice(-4_000)),
    )
  }
  const response = parseResponse(result.stdoutHeader)
  const artifactRecord = record(response.artifact)
  const byteLength = Number(artifactRecord.byteLength)
  const artifactSha256 = string(artifactRecord.sha256)
  const semantic = record(response.semanticEvidence)
  const readiness = record(response.readiness)
  const sourceSliceProfile = request.payload.longFormCapacityProfileId ===
    'canonical_private_4k_source_slice_chunk_merge_3840_frames_v2'
  if (
    response.schemaVersion !== OFFLINE_REMOTION_LONG_FORM_MERGE_STREAMING_CONTAINER_PROTOCOL ||
    response.ok !== true || response.toolId !== 'remotion' ||
    response.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    response.status !== 'actual_remotion_media_render_completed' ||
    record(response.packageIdentity).packageName !== 'remotion+@remotion/renderer' ||
    record(response.packageIdentity).version !== '4.0.487' ||
    response.requestEnvelopeSha256 !== offlineRemotionLongFormMergeRequestSha256(request) ||
    artifactRecord.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(byteLength) || byteLength < 1_024 ||
    byteLength > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES ||
    !/^[a-f0-9]{64}$/u.test(artifactSha256) ||
    result.outputReceipt.byteLength !== byteLength ||
    result.outputReceipt.sha256 !== artifactSha256 ||
    artifactRecord.width !== request.payload.width ||
    artifactRecord.height !== request.payload.height ||
    artifactRecord.fps !== request.payload.fps ||
    artifactRecord.durationFrames !== request.payload.durationFrames ||
    readiness.privateInternalOnly !== true || readiness.productReady !== false ||
    readiness.privateInternalFinalCompositionReady !== true ||
    readiness.privateInternalLongFormMergeReady !== true ||
    semantic.serverInjectedInputStreamsMaterializedAndReverified !== true ||
    semantic.serverInjectedOutputStreamEmitted !== true ||
    semantic.base64MediaTransportAvoided !== true ||
    semantic.approvedCompositionChunkBytesVerified !== true ||
    semantic.approvedCompositionChunkOrderApplied !== true ||
    semantic.approvedCompositionChunkFrameContinuityApplied !== true ||
    semantic.approvedCompositionChunkAudioPreserved !== true ||
    semantic.approvedCompositionChunkBoundaryAuthorityRead !== true ||
    (sourceSliceProfile
      ? semantic.approvedCompositionSourceSliceContinuityApplied !== true ||
        semantic.approvedCompositionChunkHardCutsApplied === true
      : semantic.approvedCompositionChunkHardCutsApplied !== true) ||
    semantic.approvedLongFormCapacityProfileVerified !== true ||
    semantic.finalCompositionProfileExecuted !== true ||
    !Object.values(semantic).every((item) => item === true)
  ) throw runtimeFailure('Private streaming long-form merge evidence is invalid.')
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-remotion-long-form-merge-stream-execution-attestation-v1' as const,
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: offlineRemotionLongFormMergeRequestSha256(request),
    artifactSha256,
    artifactByteLength: byteLength,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-remotion-long-form-merge-stream-execution-attestation-record-v1',
      source: 'private_local_checksum_protected_remotion_long_form_merge_execution',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    schemaVersion: 'offline-remotion-long-form-merge-stream-execution-result-v1',
    request,
    artifact: {
      mimeType: 'video/mp4', byteLength, sha256: artifactSha256,
      width: Number(artifactRecord.width), height: Number(artifactRecord.height),
      fps: Number(artifactRecord.fps),
      durationFrames: Number(artifactRecord.durationFrames),
      durationSeconds: Number(artifactRecord.durationSeconds),
    },
    evidence: {
      packageName: 'remotion+@remotion/renderer', packageVersion: '4.0.487',
      requestEnvelopeSha256: String(response.requestEnvelopeSha256),
      image, confinement: result.confinement,
      semanticEvidence: semantic as Record<string, true>,
      inputTransport: 'length_framed_server_injected_private_stream_v2',
      outputTransport: 'length_committed_private_stream_v2',
      containerExitCode: 0, oomKilled: false,
    },
    attestation,
    readiness: {
      privateInternalOnly: true, productReady: false, externalBetaReady: false,
      productionReady: false, privateInternalFinalCompositionReady: true,
      privateInternalLongFormMergeReady: true,
      serverInjectedStreamingReady: true, canonicalDispatchIntegrated: false,
    },
  }
}

async function persistAuthority(image: OfflineRemotionImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-remotion-render-runtime-authority-v1' as const,
    source: 'private_local_offline_remotion_render_runtime_authority' as const,
    activatedAt: new Date().toISOString(), image,
    supportedOperations: [{ toolId: 'remotion' as const, operationId: OFFLINE_REMOTION_RENDER_OPERATION }] as const,
    readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const, privateInternalFinalCompositionReady: true as const, serverInjectedStreamingFinalCompositionReady: true as const, serverInjectedStreamingLongFormMergeReady: true as const, serverInjectedStreamingDeliveryH264ChunkReady: true as const, finalExportReady: false as const },
    blockers: BLOCKERS,
  }
  const authority: OfflineRemotionRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-remotion-render-runtime-authority-record-v1', source: 'private_local_checksum_protected_remotion_runtime', authority, checksumSha256: sha256AuthorityValue(authority) })}\n`,
  })
}

function parseResponse(value: string): Record<string, unknown> { try { return record(JSON.parse(value)) } catch (cause) { throw runtimeFailure('Private Remotion response is not valid JSON.', cause) } }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw runtimeFailure('Private Remotion response contains an invalid object.'); return value as Record<string, unknown> }
function string(value: unknown): string { if (typeof value !== 'string') throw runtimeFailure('Private Remotion response contains an invalid string.'); return value }
function runtimeFailure(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function validationFailure(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
