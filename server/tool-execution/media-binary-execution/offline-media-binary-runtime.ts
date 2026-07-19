import { spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { ApiError } from '../../errors/api-error'
import { inspectPcmWavePrefix, PCM_WAVE_MAXIMUM_HEADER_BYTES } from '../../media/pcm-wave'
import {
  createPrivateDirectoryCreateOnlyWithinRoot,
  createPrivateReadStreamWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  removePrivateDirectoryTreeWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { createPrivateDockerCliInvocation } from '../private-docker-cli'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfprobeExecutionRequest,
  type OfflineFfmpegExecutionRequest,
  type OfflineFfprobeExecutionRequest,
} from './offline-media-binary-protocol'
import {
  validateOfflineFfmpegStreamingExecutionRequest,
  validateOfflineFfprobeStreamingExecutionRequest,
  type OfflineFfmpegStreamingExecutionRequest,
  type OfflineFfprobeStreamingExecutionRequest,
} from './offline-media-binary-streaming-protocol'
import {
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAGIC,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
  offlineMediaBinaryMezzanineFinalizationRequestSha256,
  validateOfflineMediaBinaryMezzanineFinalizationRequest,
  type OfflineMediaBinaryMezzanineFinalizationRequest,
} from './offline-media-binary-mezzanine-finalization-protocol'
import {
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAGIC,
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
  offlineMediaBinaryObjectMezzanineChunkRequestSha256,
  validateOfflineMediaBinaryObjectMezzanineChunkRequest,
  type OfflineMediaBinaryObjectMezzanineChunkRequest,
} from './offline-media-binary-object-mezzanine-chunk-protocol'
import {
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAGIC,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLES_PER_FRAME,
  offlineMediaBinaryContinuousProgramAudioRequestSha256,
  validateOfflineMediaBinaryContinuousProgramAudioRequest,
  type OfflineMediaBinaryContinuousProgramAudioRequest,
} from './offline-media-binary-continuous-program-audio-protocol'
import {
  OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY,
  OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE,
  OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES,
  offlineMediaBinaryCrossChunkColorContinuityRequestSha256,
  validateOfflineMediaBinaryCrossChunkColorContinuityRequest,
  type OfflineMediaBinaryCrossChunkColorContinuityRequest,
} from './offline-media-binary-cross-chunk-color-continuity-protocol'
import {
  evaluateOfflineMediaBinaryCrossChunkColorContinuity,
} from './offline-media-binary-cross-chunk-color-continuity-evaluation'
import {
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
  offlineFinalMasterAudioQaRequestSha256,
  offlineFinalMasterVideoQaRequestSha256,
  validateOfflineFinalMasterAudioQaRequest,
  validateOfflineFinalMasterVideoQaRequest,
  type OfflineFinalMasterAudioQaRequest,
  type OfflineFinalMasterAudioExceptionRange,
  type OfflineFinalMasterVideoQaRequest,
  type OfflineFinalMasterVisualExceptionRange,
} from './offline-media-binary-final-master-qa-protocol'
import {
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_MAGIC,
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  offlineMediaBinaryLongFormMasterAssemblyRequestSha256,
  validateOfflineMediaBinaryLongFormMasterAssemblyRequest,
  type OfflineMediaBinaryLongFormMasterAssemblyRequest,
} from './offline-media-binary-long-form-master-assembly-protocol'
import type {
  OfflineContinuousProgramAudioQaExecutionResult,
  OfflineCrossChunkColorContinuityExecutionResult,
  OfflineColorPixelAnalysis,
  OfflineFinalMasterAudioQaExecutionResult,
  OfflineFinalMasterVideoQaExecutionResult,
  OfflineFfmpegContinuousProgramAudioExecutionResult,
  OfflineFfmpegMezzanineFinalizationExecutionResult,
  OfflineFfmpegLongFormMasterAssemblyExecutionResult,
  OfflineFfmpegObjectMezzanineChunkExecutionResult,
  OfflineFfmpegExecutionResult,
  OfflineFfmpegStreamingOutputExecutionResult,
  OfflineFfprobeExecutionResult,
  OfflineMediaBinaryConfinementEvidence,
  OfflineMediaBinaryImageEvidence,
  OfflineMediaBinaryStreamingOutputSink,
} from './offline-media-binary-types'
import {
  OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES,
} from './offline-media-binary-types'

const IMAGE_TAG = 'reeditpro/ffmpeg-lgpl-internal:8.1.2-object-chunk-v6-local' as const
const FFPROBE_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffprobe' as const
const FFMPEG_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffmpeg' as const
const MEZZANINE_FINALIZER_ENTRYPOINT =
  '/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer' as const
const MEZZANINE_FINALIZER_COMMAND = ['source-slice-finalization-v1'] as const
const OBJECT_MEZZANINE_CHUNK_ENTRYPOINT =
  '/usr/local/bin/reeditpro-ffmpeg-object-mezzanine-chunk' as const
const OBJECT_MEZZANINE_CHUNK_COMMAND = ['object-mezzanine-chunk-v2'] as const
const CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT =
  '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio' as const
const CONTINUOUS_PROGRAM_AUDIO_COMMAND = ['continuous-program-audio-v1'] as const
const CONTINUOUS_PROGRAM_AUDIO_PROBE_ENTRYPOINT =
  '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio-probe' as const
const LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT =
  '/usr/local/bin/reeditpro-ffmpeg-long-form-master-assembly' as const
const LONG_FORM_MASTER_ASSEMBLY_COMMAND =
  ['long-form-master-assembly-v1'] as const
const SOURCE_VERSION = '8.1.2' as const
const SOURCE_SHA256 = '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c' as const
const STORAGE_ROOT = '/tmp/reeditpro-offline-media-binary-execution-program-audio-v4' as const
const AUTHORITY_PATH = 'runtime-authority/offline-media-binary-runtime-program-audio-v4.json' as const
const DOCKER_CONTROL_TIMEOUT_MS = 120_000
const MAXIMUM_STREAMING_TIMEOUT_MS = 10 * 60_000
const CONTINUOUS_PROGRAM_AUDIO_TIMEOUT_MS = 60 * 60_000
const LONG_FORM_MASTER_ASSEMBLY_TIMEOUT_MS = 6 * 60 * 60_000

export interface OfflineMediaBinaryServerInjectedInput {
  inputMode: 'private_verified_stream_v1'
  byteLength: number
  sha256: string
  openStream(): Promise<Readable>
}

export interface OfflineMediaBinaryRuntimeAuthority {
  schemaVersion: 'offline-media-binary-runtime-authority-v1'
  source: 'private_local_pinned_ffmpeg_lgpl_runtime'
  activatedAt: string
  image: OfflineMediaBinaryImageEvidence
  supportedOperations: readonly [
    { toolId: 'ffmpeg'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
    { toolId: 'ffprobe'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
  ]
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    privateInternalMezzanineFinalizationReady: true
    privateInternalObjectMezzanineChunkSeriesReady: true
    privateInternalContinuousProgramAudioReady: true
    privateInternalCrossChunkColorBoundaryReady: true
    privateInternalLongFormMasterAssemblyReady: true
    privateInternalFinalMasterDecodedVideoQaReady: true
    privateInternalFinalMasterDecodedAudioQaReady: true
    longFormFinalMasterQaCheckpointingReady: false
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalExportReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}

export interface PrivateOfflineMediaBinaryRuntime {
  readonly image: OfflineMediaBinaryImageEvidence
  execute(request: OfflineFfprobeExecutionRequest): Promise<OfflineFfprobeExecutionResult>
  execute(request: OfflineFfmpegExecutionRequest): Promise<OfflineFfmpegExecutionResult>
  execute(request: unknown): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult>
  executeServerInjected(
    request: OfflineFfprobeStreamingExecutionRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ): Promise<OfflineFfprobeExecutionResult>
  executeServerInjected(
    request: OfflineFfmpegStreamingExecutionRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ): Promise<OfflineFfmpegExecutionResult>
  executeServerInjectedStreamingOutput(
    request: OfflineFfmpegStreamingExecutionRequest,
    source: OfflineMediaBinaryServerInjectedInput,
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ): Promise<OfflineFfmpegStreamingOutputExecutionResult>
  executeMezzanineFinalizationServerInjected(
    request: OfflineMediaBinaryMezzanineFinalizationRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      source: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ): Promise<OfflineFfmpegMezzanineFinalizationExecutionResult>
  executeObjectMezzanineChunkServerInjected(
    request: OfflineMediaBinaryObjectMezzanineChunkRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ): Promise<OfflineFfmpegObjectMezzanineChunkExecutionResult>
  executeContinuousProgramAudioServerInjected(
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ): Promise<OfflineFfmpegContinuousProgramAudioExecutionResult>
  executeContinuousProgramAudioQaServerInjected(
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ): Promise<OfflineContinuousProgramAudioQaExecutionResult>
  executeCrossChunkColorContinuityServerInjected(
    request: OfflineMediaBinaryCrossChunkColorContinuityRequest,
    inputs: {
      left: OfflineMediaBinaryServerInjectedInput
      right: OfflineMediaBinaryServerInjectedInput
    },
  ): Promise<OfflineCrossChunkColorContinuityExecutionResult>
  executeLongFormMasterAssemblyServerInjected(
    request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      programAudio: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ): Promise<OfflineFfmpegLongFormMasterAssemblyExecutionResult>
  executeFinalMasterVideoQaServerInjected(
    request: OfflineFinalMasterVideoQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ): Promise<OfflineFinalMasterVideoQaExecutionResult>
  executeFinalMasterAudioQaServerInjected(
    request: OfflineFinalMasterAudioQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ): Promise<OfflineFinalMasterAudioQaExecutionResult>
}

export async function activatePrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary activation accepts no caller input.')
  const image = await inspectImage()
  await persistAuthority(image)
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  const executeServerInjectedBound = ((request: unknown, source: OfflineMediaBinaryServerInjectedInput) =>
    executeServerInjected(image, request, source)) as PrivateOfflineMediaBinaryRuntime['executeServerInjected']
  const executeServerInjectedStreamingOutputBound = ((
    request: unknown,
    source: OfflineMediaBinaryServerInjectedInput,
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeServerInjectedStreamingOutput(image, request, source, outputSink)) as
    PrivateOfflineMediaBinaryRuntime['executeServerInjectedStreamingOutput']
  const executeMezzanineFinalizationServerInjectedBound = ((
    request: OfflineMediaBinaryMezzanineFinalizationRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      source: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeMezzanineFinalizationServerInjected(image, request, inputs, outputSink)) as
    PrivateOfflineMediaBinaryRuntime['executeMezzanineFinalizationServerInjected']
  const executeObjectMezzanineChunkServerInjectedBound = ((
    request: OfflineMediaBinaryObjectMezzanineChunkRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeObjectMezzanineChunkServerInjected(
    image,
    request,
    sources,
    outputSink,
  )) as PrivateOfflineMediaBinaryRuntime['executeObjectMezzanineChunkServerInjected']
  const executeContinuousProgramAudioServerInjectedBound = ((
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeContinuousProgramAudioServerInjected(
    image,
    request,
    sources,
    outputSink,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeContinuousProgramAudioServerInjected'
  ]
  const executeContinuousProgramAudioQaServerInjectedBound = ((
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeContinuousProgramAudioQaServerInjected(
    image,
    request,
    source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeContinuousProgramAudioQaServerInjected'
  ]
  const executeCrossChunkColorContinuityServerInjectedBound = ((
    request: OfflineMediaBinaryCrossChunkColorContinuityRequest,
    inputs: {
      left: OfflineMediaBinaryServerInjectedInput
      right: OfflineMediaBinaryServerInjectedInput
    },
  ) => executeCrossChunkColorContinuityServerInjected(
    image,
    request,
    inputs,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeCrossChunkColorContinuityServerInjected'
  ]
  const executeLongFormMasterAssemblyServerInjectedBound = ((
    request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      programAudio: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeLongFormMasterAssemblyServerInjected(
    image, request, inputs, outputSink,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeLongFormMasterAssemblyServerInjected'
  ]
  const executeFinalMasterVideoQaServerInjectedBound = ((
    request: OfflineFinalMasterVideoQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeFinalMasterVideoQaServerInjected(
    image, request, source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeFinalMasterVideoQaServerInjected'
  ]
  const executeFinalMasterAudioQaServerInjectedBound = ((
    request: OfflineFinalMasterAudioQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeFinalMasterAudioQaServerInjected(
    image, request, source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeFinalMasterAudioQaServerInjected'
  ]
  return Object.freeze({
    image,
    execute: executeBound,
    executeServerInjected: executeServerInjectedBound,
    executeServerInjectedStreamingOutput: executeServerInjectedStreamingOutputBound,
    executeMezzanineFinalizationServerInjected:
      executeMezzanineFinalizationServerInjectedBound,
    executeObjectMezzanineChunkServerInjected:
      executeObjectMezzanineChunkServerInjectedBound,
    executeContinuousProgramAudioServerInjected:
      executeContinuousProgramAudioServerInjectedBound,
    executeContinuousProgramAudioQaServerInjected:
      executeContinuousProgramAudioQaServerInjectedBound,
    executeCrossChunkColorContinuityServerInjected:
      executeCrossChunkColorContinuityServerInjectedBound,
    executeLongFormMasterAssemblyServerInjected:
      executeLongFormMasterAssemblyServerInjectedBound,
    executeFinalMasterVideoQaServerInjected:
      executeFinalMasterVideoQaServerInjectedBound,
    executeFinalMasterAudioQaServerInjected:
      executeFinalMasterAudioQaServerInjectedBound,
  })
}

export async function openPrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary runtime open accepts no caller input.')
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (!authority) throw unavailable('Media binary runtime authority is unavailable.')
  const image = await inspectImage()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw unavailable('Pinned media binary image changed after runtime activation.')
  }
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  const executeServerInjectedBound = ((request: unknown, source: OfflineMediaBinaryServerInjectedInput) =>
    executeServerInjected(image, request, source)) as PrivateOfflineMediaBinaryRuntime['executeServerInjected']
  const executeServerInjectedStreamingOutputBound = ((
    request: unknown,
    source: OfflineMediaBinaryServerInjectedInput,
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeServerInjectedStreamingOutput(image, request, source, outputSink)) as
    PrivateOfflineMediaBinaryRuntime['executeServerInjectedStreamingOutput']
  const executeMezzanineFinalizationServerInjectedBound = ((
    request: OfflineMediaBinaryMezzanineFinalizationRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      source: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeMezzanineFinalizationServerInjected(image, request, inputs, outputSink)) as
    PrivateOfflineMediaBinaryRuntime['executeMezzanineFinalizationServerInjected']
  const executeObjectMezzanineChunkServerInjectedBound = ((
    request: OfflineMediaBinaryObjectMezzanineChunkRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeObjectMezzanineChunkServerInjected(
    image,
    request,
    sources,
    outputSink,
  )) as PrivateOfflineMediaBinaryRuntime['executeObjectMezzanineChunkServerInjected']
  const executeContinuousProgramAudioServerInjectedBound = ((
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    sources: readonly OfflineMediaBinaryServerInjectedInput[],
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeContinuousProgramAudioServerInjected(
    image,
    request,
    sources,
    outputSink,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeContinuousProgramAudioServerInjected'
  ]
  const executeContinuousProgramAudioQaServerInjectedBound = ((
    request: OfflineMediaBinaryContinuousProgramAudioRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeContinuousProgramAudioQaServerInjected(
    image,
    request,
    source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeContinuousProgramAudioQaServerInjected'
  ]
  const executeCrossChunkColorContinuityServerInjectedBound = ((
    request: OfflineMediaBinaryCrossChunkColorContinuityRequest,
    inputs: {
      left: OfflineMediaBinaryServerInjectedInput
      right: OfflineMediaBinaryServerInjectedInput
    },
  ) => executeCrossChunkColorContinuityServerInjected(
    image,
    request,
    inputs,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeCrossChunkColorContinuityServerInjected'
  ]
  const executeLongFormMasterAssemblyServerInjectedBound = ((
    request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
    inputs: {
      chunks: readonly OfflineMediaBinaryServerInjectedInput[]
      programAudio: OfflineMediaBinaryServerInjectedInput
    },
    outputSink: OfflineMediaBinaryStreamingOutputSink,
  ) => executeLongFormMasterAssemblyServerInjected(
    image, request, inputs, outputSink,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeLongFormMasterAssemblyServerInjected'
  ]
  const executeFinalMasterVideoQaServerInjectedBound = ((
    request: OfflineFinalMasterVideoQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeFinalMasterVideoQaServerInjected(
    image, request, source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeFinalMasterVideoQaServerInjected'
  ]
  const executeFinalMasterAudioQaServerInjectedBound = ((
    request: OfflineFinalMasterAudioQaRequest,
    source: OfflineMediaBinaryServerInjectedInput,
  ) => executeFinalMasterAudioQaServerInjected(
    image, request, source,
  )) as PrivateOfflineMediaBinaryRuntime[
    'executeFinalMasterAudioQaServerInjected'
  ]
  return Object.freeze({
    image,
    execute: executeBound,
    executeServerInjected: executeServerInjectedBound,
    executeServerInjectedStreamingOutput: executeServerInjectedStreamingOutputBound,
    executeMezzanineFinalizationServerInjected:
      executeMezzanineFinalizationServerInjectedBound,
    executeObjectMezzanineChunkServerInjected:
      executeObjectMezzanineChunkServerInjectedBound,
    executeContinuousProgramAudioServerInjected:
      executeContinuousProgramAudioServerInjectedBound,
    executeContinuousProgramAudioQaServerInjected:
      executeContinuousProgramAudioQaServerInjectedBound,
    executeCrossChunkColorContinuityServerInjected:
      executeCrossChunkColorContinuityServerInjectedBound,
    executeLongFormMasterAssemblyServerInjected:
      executeLongFormMasterAssemblyServerInjectedBound,
    executeFinalMasterVideoQaServerInjected:
      executeFinalMasterVideoQaServerInjectedBound,
    executeFinalMasterAudioQaServerInjected:
      executeFinalMasterAudioQaServerInjectedBound,
  })
}

export async function readPersistedOfflineMediaBinaryRuntimeAuthority():
Promise<OfflineMediaBinaryRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw unavailable('Media binary runtime authority is invalid JSON.') }
  const envelope = record(parsed)
  const authority = record(envelope.authority)
  if (
    envelope.recordVersion !== 'offline-media-binary-runtime-authority-record-v1' ||
    envelope.source !== 'private_local_checksum_protected_media_binary_runtime' ||
    envelope.checksumSha256 !== sha256AuthorityValue(authority)
  ) throw unavailable('Media binary runtime authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-media-binary-runtime-authority-v1' ||
    authority.source !== 'private_local_pinned_ffmpeg_lgpl_runtime' ||
    record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).privateInternalMezzanineFinalizationReady !== true ||
    record(authority.readiness).privateInternalObjectMezzanineChunkSeriesReady !== true ||
    record(authority.readiness).privateInternalContinuousProgramAudioReady !== true ||
    record(authority.readiness).privateInternalCrossChunkColorBoundaryReady !== true ||
    record(authority.readiness).privateInternalLongFormMasterAssemblyReady !== true ||
    record(authority.readiness).privateInternalFinalMasterDecodedVideoQaReady !== true ||
    record(authority.readiness).privateInternalFinalMasterDecodedAudioQaReady !== true ||
    record(authority.readiness).longFormFinalMasterQaCheckpointingReady !== false ||
    record(authority.readiness).productReady !== false ||
    record(authority.readiness).finalExportReady !== false
  ) throw unavailable('Media binary runtime authority boundary is invalid.')
  return authority as unknown as OfflineMediaBinaryRuntimeAuthority
}

async function execute(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult> {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  return candidate?.toolId === 'ffmpeg'
    ? executeFfmpeg(image, value)
    : executeFfprobe(image, value)
}

async function executeServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult> {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  if (candidate?.toolId === 'ffmpeg') {
    let request: OfflineFfmpegStreamingExecutionRequest
    try { request = validateOfflineFfmpegStreamingExecutionRequest(value) } catch {
      throw invalid('Structured streaming FFmpeg execution request was rejected.')
    }
    assertServerInjectedInput(source, request.payload.sourceByteLength, request.payload.sourceSha256)
    return executeFfmpegRequest(image, request, source)
  }
  let request: OfflineFfprobeStreamingExecutionRequest
  try { request = validateOfflineFfprobeStreamingExecutionRequest(value) } catch {
    throw invalid('Structured streaming FFprobe execution request was rejected.')
  }
  assertServerInjectedInput(source, request.payload.sourceByteLength, request.payload.sourceSha256)
  return executeFfprobeRequest(image, request, source)
}

async function executeServerInjectedStreamingOutput(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  source: OfflineMediaBinaryServerInjectedInput,
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegStreamingOutputExecutionResult> {
  let request: OfflineFfmpegStreamingExecutionRequest
  try { request = validateOfflineFfmpegStreamingExecutionRequest(value) } catch {
    throw invalid('Structured streaming-output FFmpeg execution request was rejected.')
  }
  if (
    request.payload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1' &&
    request.payload.recipeProfileId !== 'approved_source_color_match_delivery_matroska_v1' &&
    request.payload.recipeProfileId !== 'approved_voice_delivery_wav_v1'
  ) throw invalid('Streaming FFmpeg output is restricted to approved professional-color or voice-delivery recipes.')
  assertServerInjectedInput(source, request.payload.sourceByteLength, request.payload.sourceSha256)
  assertStreamingOutputSink(outputSink, request.payload.recipeProfileId)
  const result = await executeFfmpegRequest(image, request, source, outputSink)
  if (!('outputMode' in result.resultArtifact)) {
    throw unavailable('Streaming FFmpeg output returned a buffered artifact unexpectedly.')
  }
  return result
}

async function executeMezzanineFinalizationServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    source: OfflineMediaBinaryServerInjectedInput
  },
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegMezzanineFinalizationExecutionResult> {
  let request: OfflineMediaBinaryMezzanineFinalizationRequest
  try {
    request = validateOfflineMediaBinaryMezzanineFinalizationRequest(value)
  } catch {
    throw invalid('Structured mezzanine finalization request was rejected.')
  }
  assertMezzanineServerInjectedInputs(request, inputs)
  if (
    !outputSink ||
    outputSink.maximumBytes !==
      OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw invalid('Mezzanine finalization output sink authority is invalid.')

  const container = await createContainer(
    image,
    MEZZANINE_FINALIZER_ENTRYPOINT,
    [...MEZZANINE_FINALIZER_COMMAND],
  )
  let outputSpool: DockerVerifiedPrivateOutputSpool | undefined
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(
      before,
      image,
      MEZZANINE_FINALIZER_ENTRYPOINT,
      [...MEZZANINE_FINALIZER_COMMAND],
    )
    const combinedInputBytes = request.inputs.source.byteLength +
      request.inputs.chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
    outputSpool = await dockerVerifiedMezzanineInputToPrivateOutputSpool({
      args: ['start', '--attach', '--interactive', container.id],
      request,
      inputs,
      maximumOutputBytes:
        OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
      timeoutMs: mediaExecutionTimeoutMs(
        combinedInputBytes,
        request.payload.durationFrames,
        request.payload.fps,
      ),
    })
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      outputSpool.exitCode !== 0 || outputSpool.stderr.length > 0 ||
      outputSpool.byteLength < 1_024 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== outputSpool.exitCode || state.OOMKilled !== false
    ) throw unavailable(
      'Confined mezzanine finalization failed closed ' +
      `(exit=${outputSpool.exitCode};stderrBytes=${outputSpool.stderr.length};` +
      `stdoutBytes=${outputSpool.byteLength};state=${String(state.Status)};` +
      `stateExit=${String(state.ExitCode)};oomKilled=${String(state.OOMKilled)};` +
      `diagnostic=${safeFfmpegDiagnostic(outputSpool.stderr)}).`,
    )
    const outputProbe = await probeMezzanineFinalOutput(
      image,
      outputSpool.source,
      request,
    )
    const persisted = await outputSink.persist({
      stream: await outputSpool.source.openStream(),
      mimeType: 'video/mp4',
      expectedByteLength: outputSpool.byteLength,
      expectedSha256: outputSpool.sha256,
    })
    if (
      persisted.byteLength !== outputSpool.byteLength ||
      persisted.sha256 !== outputSpool.sha256
    ) throw unavailable(
      'Mezzanine finalization output sink changed the exact artifact commitment.',
    )

    const completedAt = new Date().toISOString()
    const requestEnvelopeSha256 =
      offlineMediaBinaryMezzanineFinalizationRequestSha256(request)
    const semanticEvidence = Object.freeze({
      fixedRecipeExecuted: true,
      recipeProfileId: request.payload.recipeProfileId,
      capacityProfileId: request.payload.capacityProfileId,
      sourceBytesVerified: true,
      chunkBytesVerified: true,
      sourceDeliveryMode: inputs.source.inputMode,
      chunkDeliveryMode: 'private_verified_stream_v1',
      chunkCount: request.inputs.chunks.length,
      chunkOrderAndRangesVerified: true,
      chunkBoundaryContinuityVerified: true,
      frameDerivedConcatDurationsApplied: true,
      exactH264ExtradataTimebaseFrameColorCompatibilityVerified: true,
      h264VideoStreamCopiedWithoutDecodeOrReencode: true,
      sourceAudioDecodedAndEncodedOnce: true,
      chunkAudioIgnored: true,
      outputTimestampsNormalizedFromZeroWithinOneFrame: true,
      outputContainer: 'mp4',
      outputVideoCodec: 'h264_stream_copy',
      outputAudioCodec: 'aac_lc',
      outputAudioSampleRate: 48_000,
      outputAudioChannels: 2,
      outputAudioBitrateKbps: 192,
      callerPathsAccepted: false,
      callerUrlsAccepted: false,
      callerCommandsAccepted: false,
      callerCodecSettingsAccepted: false,
      outputProbeVerified: true,
      outputProbe,
      originalApprovedEditReservationUsed: true,
      separateExportEstimateRequired: false,
      additionalExportChargeAllowed: false,
      publicDeliveryAuthorized: false,
      distributedExecutionProven: false,
    })
    const attestationWithoutHash = {
      domain: 'offline_media_binary_mezzanine_finalization_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      requestEnvelopeSha256,
      sourceSha256: request.inputs.source.sha256,
      chunkSha256s: request.inputs.chunks.map((chunk) => chunk.sha256),
      resultSha256: outputSpool.sha256,
      confinement,
      outputProbe,
      outputTransport: 'server_committed_private_stream_v1' as const,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion:
          'offline-media-binary-mezzanine-finalization-attestation-record-v1',
        source:
          'private_local_checksum_protected_media_binary_mezzanine_finalization',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({
          ...attestationWithoutHash,
          recordId,
          attestationHash,
        }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: 'video/mp4',
        sha256: outputSpool.sha256,
        byteLength: outputSpool.byteLength,
        outputMode: 'server_committed_private_stream_v1',
      },
      evidence: {
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256,
        sourceSha256: request.inputs.source.sha256,
        chunkSha256s: request.inputs.chunks.map((chunk) => chunk.sha256),
        resultSha256: outputSpool.sha256,
        semanticEvidence,
        confinement,
        containerExitCode: 0,
        oomKilled: false,
        outputTransport: 'server_committed_private_stream_v1',
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true,
        productReady: false,
        externalBetaReady: false,
        productionReady: false,
      },
    }
  } finally {
    await outputSpool?.cleanup().catch(() => undefined)
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function executeObjectMezzanineChunkServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegObjectMezzanineChunkExecutionResult> {
  let request: OfflineMediaBinaryObjectMezzanineChunkRequest
  try {
    request = validateOfflineMediaBinaryObjectMezzanineChunkRequest(value)
  } catch {
    throw invalid('Structured object-mezzanine chunk request was rejected.')
  }
  assertObjectMezzanineChunkServerInjectedInputs(request, sources)
  if (
    !outputSink ||
    outputSink.maximumBytes !==
      OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw invalid('Object-mezzanine chunk output sink authority is invalid.')

  const container = await createContainer(
    image,
    OBJECT_MEZZANINE_CHUNK_ENTRYPOINT,
    [...OBJECT_MEZZANINE_CHUNK_COMMAND],
  )
  let outputSpool: DockerVerifiedPrivateOutputSpool | undefined
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      OBJECT_MEZZANINE_CHUNK_ENTRYPOINT,
      [...OBJECT_MEZZANINE_CHUNK_COMMAND],
    )
    const combinedInputBytes = request.inputs.sources.reduce(
      (total, source) => total + source.byteLength,
      0,
    )
    outputSpool = await dockerVerifiedObjectMezzanineChunkToPrivateOutputSpool({
      args: ['start', '--attach', '--interactive', container.id],
      request,
      sources,
      maximumOutputBytes:
        OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
      timeoutMs: mediaExecutionTimeoutMs(
        combinedInputBytes,
        request.payload.durationFrames,
        request.payload.fps,
      ),
    })
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      outputSpool.exitCode !== 0 || outputSpool.stderr.length > 0 ||
      outputSpool.byteLength < 1_024 || state.Status !== 'exited' ||
      state.Running !== false || state.ExitCode !== outputSpool.exitCode ||
      state.OOMKilled !== false
    ) throw unavailable(
      'Confined object-mezzanine chunk execution failed closed ' +
      `(exit=${outputSpool.exitCode};stderrBytes=${outputSpool.stderr.length};` +
      `stdoutBytes=${outputSpool.byteLength};state=${String(state.Status)};` +
      `stateExit=${String(state.ExitCode)};oomKilled=${String(state.OOMKilled)};` +
      `diagnostic=${safeFfmpegDiagnostic(outputSpool.stderr)}).`,
    )
    const outputProbe = await probeObjectMezzanineChunkOutput(
      image,
      outputSpool.source,
      request,
    )
    const persisted = await outputSink.persist({
      stream: await outputSpool.source.openStream(),
      mimeType: 'video/x-matroska',
      expectedByteLength: outputSpool.byteLength,
      expectedSha256: outputSpool.sha256,
    })
    if (
      persisted.byteLength !== outputSpool.byteLength ||
      persisted.sha256 !== outputSpool.sha256
    ) throw unavailable(
      'Object-mezzanine output sink changed the exact artifact commitment.',
    )

    const completedAt = new Date().toISOString()
    const requestEnvelopeSha256 =
      offlineMediaBinaryObjectMezzanineChunkRequestSha256(request)
    const semanticEvidence = Object.freeze({
      fixedRecipeExecuted: true,
      recipeProfileId: request.payload.recipeProfileId,
      allObjectChunksSupported: true,
      chunkId: request.payload.chunkId,
      chunkAuthorityHash: request.payload.chunkAuthorityHash,
      expectedObjectIdentity: request.payload.expectedObjectIdentity,
      immutableSourceBytesVerified: true,
      sourceDeliveryMode: 'private_verified_stream_v1',
      uniqueSourceCount: request.inputs.sources.length,
      sourceSliceCount: request.payload.sourceSlices.length,
      sourceOrderAndFrameRangesVerified: true,
      approvedHardCutBoundariesVerified: true,
      frameExactH264DecodeTrimConcatExecuted: true,
      vp9Cq12MezzanineEncoded: true,
      outputTimestampsNormalizedFromZeroWithinOneFrame: true,
      outputContainer: 'matroska',
      outputVideoCodec: 'vp9_cq12',
      outputAudioStreams: 0,
      continuousProgramAudioRemainsSeparate: true,
      callerPathsAccepted: false,
      callerUrlsAccepted: false,
      callerCommandsAccepted: false,
      callerCodecSettingsAccepted: false,
      outputProbeVerified: true,
      outputProbe,
      originalApprovedEditReservationUsed: true,
      separateExportEstimateRequired: false,
      additionalExportChargeAllowed: false,
      publicDeliveryAuthorized: false,
      distributedExecutionProven: false,
    })
    const attestationWithoutHash = {
      domain: 'offline_media_binary_object_mezzanine_chunk_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      requestEnvelopeSha256,
      sourceSha256s: request.inputs.sources.map((source) => source.sha256),
      resultSha256: outputSpool.sha256,
      confinement,
      outputProbe,
      outputTransport: 'server_committed_private_stream_v1' as const,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion:
          'offline-media-binary-object-mezzanine-chunk-attestation-record-v1',
        source:
          'private_local_checksum_protected_object_mezzanine_chunk_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({
          ...attestationWithoutHash,
          recordId,
          attestationHash,
        }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: 'video/x-matroska',
        sha256: outputSpool.sha256,
        byteLength: outputSpool.byteLength,
        outputMode: 'server_committed_private_stream_v1',
      },
      evidence: {
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256,
        sourceSha256s: request.inputs.sources.map((source) => source.sha256),
        resultSha256: outputSpool.sha256,
        semanticEvidence,
        confinement,
        containerExitCode: 0,
        oomKilled: false,
        outputTransport: 'server_committed_private_stream_v1',
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true,
        productReady: false,
        externalBetaReady: false,
        productionReady: false,
      },
    }
  } finally {
    await outputSpool?.cleanup().catch(() => undefined)
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function executeLongFormMasterAssemblyServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    programAudio: OfflineMediaBinaryServerInjectedInput
  },
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegLongFormMasterAssemblyExecutionResult> {
  let request: OfflineMediaBinaryLongFormMasterAssemblyRequest
  try {
    request = validateOfflineMediaBinaryLongFormMasterAssemblyRequest(value)
  } catch {
    throw invalid('Structured long-form master assembly request was rejected.')
  }
  assertLongFormMasterAssemblyInputs(request, inputs)
  if (
    !outputSink ||
    outputSink.maximumBytes !==
      OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw invalid('Long-form master output sink authority is invalid.')
  const container = await createContainer(
    image,
    LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT,
    [...LONG_FORM_MASTER_ASSEMBLY_COMMAND],
  )
  let outputSpool: DockerVerifiedPrivateOutputSpool | undefined
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT,
      [...LONG_FORM_MASTER_ASSEMBLY_COMMAND],
    )
    outputSpool = await dockerVerifiedLongFormMasterToPrivateOutputSpool({
      args: ['start', '--attach', '--interactive', container.id],
      containerId: container.id,
      request,
      inputs,
      maximumOutputBytes:
        OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
      timeoutMs: LONG_FORM_MASTER_ASSEMBLY_TIMEOUT_MS,
    })
    const state = record((await inspectContainer(container.id)).State)
    if (
      outputSpool.exitCode !== 0 || outputSpool.stderr.length > 0 ||
      outputSpool.byteLength < 1_024 || state.Status !== 'exited' ||
      state.Running !== false || state.ExitCode !== 0 || state.OOMKilled !== false
    ) throw unavailable('Confined long-form master assembly failed closed.')
    const outputProbe = await probeLongFormMasterOutput(
      image, outputSpool.source, request,
    )
    const persisted = await outputSink.persist({
      stream: await outputSpool.source.openStream(),
      mimeType: 'video/x-matroska',
      expectedByteLength: outputSpool.byteLength,
      expectedSha256: outputSpool.sha256,
    })
    if (
      persisted.byteLength !== outputSpool.byteLength ||
      persisted.sha256 !== outputSpool.sha256
    ) throw unavailable('Long-form master sink changed its exact commitment.')
    const completedAt = new Date().toISOString()
    const requestEnvelopeSha256 =
      offlineMediaBinaryLongFormMasterAssemblyRequestSha256(request)
    const semanticEvidence = Object.freeze({
      fixedRecipeExecuted: true,
      recipeProfileId: request.payload.recipeProfileId,
      everyPrivateInputChecksumVerified: true,
      chunkCount: request.inputs.chunks.length,
      orderedVp9ObjectChunksStreamCopied: true,
      continuousFlacProgramAudioStreamCopied: true,
      videoOrAudioReencoded: false,
      completeFrameAndSampleTimelineMuxed: true,
      outputContainer: 'matroska',
      outputVideoCodec: 'vp9_stream_copy',
      outputAudioCodec: 'flac_stream_copy',
      outputProbeVerified: true,
      outputProbe,
      callerPathsAccepted: false,
      callerUrlsAccepted: false,
      callerCommandsAccepted: false,
      callerCodecSettingsAccepted: false,
      originalApprovedEditReservationUsed: true,
      separateExportEstimateRequired: false,
      additionalExportChargeAllowed: false,
      publicDeliveryAuthorized: false,
      distributedExecutionProven: false,
    })
    const attestationWithoutHash = {
      domain: 'offline_media_binary_long_form_master_assembly_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      requestEnvelopeSha256,
      chunkSha256s: request.inputs.chunks.map((chunk) => chunk.sha256),
      programAudioSha256: request.inputs.programAudio.sha256,
      resultSha256: outputSpool.sha256,
      confinement,
      outputProbe,
      outputTransport: 'server_committed_private_stream_v1' as const,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion:
          'offline-media-binary-long-form-master-assembly-attestation-record-v1',
        source: 'private_checksum_protected_long_form_master_assembly',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({
          ...attestationWithoutHash, recordId, attestationHash,
        }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: 'video/x-matroska', sha256: outputSpool.sha256,
        byteLength: outputSpool.byteLength,
        outputMode: 'server_committed_private_stream_v1',
      },
      evidence: {
        toolId: 'ffmpeg', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION, requestEnvelopeSha256,
        chunkSha256s: request.inputs.chunks.map((chunk) => chunk.sha256),
        programAudioSha256: request.inputs.programAudio.sha256,
        resultSha256: outputSpool.sha256, semanticEvidence, confinement,
        containerExitCode: 0, oomKilled: false,
        outputTransport: 'server_committed_private_stream_v1',
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await outputSpool?.cleanup().catch(() => undefined)
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function executeContinuousProgramAudioServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegContinuousProgramAudioExecutionResult> {
  let request: OfflineMediaBinaryContinuousProgramAudioRequest
  try {
    request = validateOfflineMediaBinaryContinuousProgramAudioRequest(value)
  } catch {
    throw invalid('Structured continuous program-audio request was rejected.')
  }
  assertContinuousProgramAudioServerInjectedInputs(request, sources)
  if (
    !outputSink ||
    outputSink.maximumBytes !==
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES ||
    typeof outputSink.persist !== 'function'
  ) throw invalid('Continuous program-audio output sink authority is invalid.')

  const container = await createContainer(
    image,
    CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT,
    [...CONTINUOUS_PROGRAM_AUDIO_COMMAND],
  )
  let outputSpool: DockerVerifiedPrivateOutputSpool | undefined
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT,
      [...CONTINUOUS_PROGRAM_AUDIO_COMMAND],
    )
    outputSpool = await dockerVerifiedContinuousProgramAudioToPrivateOutputSpool({
      args: ['start', '--attach', '--interactive', container.id],
      request,
      sources,
      maximumOutputBytes:
        OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
      timeoutMs: CONTINUOUS_PROGRAM_AUDIO_TIMEOUT_MS,
    })
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      outputSpool.exitCode !== 0 || outputSpool.stderr.length > 0 ||
      outputSpool.byteLength < 1_024 || state.Status !== 'exited' ||
      state.Running !== false || state.ExitCode !== outputSpool.exitCode ||
      state.OOMKilled !== false
    ) throw unavailable(
      'Confined continuous program-audio execution failed closed ' +
      `(exit=${outputSpool.exitCode};stderrBytes=${outputSpool.stderr.length};` +
      `stdoutBytes=${outputSpool.byteLength};state=${String(state.Status)};` +
      `stateExit=${String(state.ExitCode)};oomKilled=${String(state.OOMKilled)};` +
      `diagnostic=${safeFfmpegDiagnostic(outputSpool.stderr)}).`,
    )
    const outputProbe = await probeContinuousProgramAudioOutput(
      image,
      outputSpool.source,
      request,
    )
    const persisted = await outputSink.persist({
      stream: await outputSpool.source.openStream(),
      mimeType: 'audio/flac',
      expectedByteLength: outputSpool.byteLength,
      expectedSha256: outputSpool.sha256,
    })
    if (
      persisted.byteLength !== outputSpool.byteLength ||
      persisted.sha256 !== outputSpool.sha256
    ) throw unavailable(
      'Continuous program-audio sink changed the exact artifact commitment.',
    )

    const completedAt = new Date().toISOString()
    const requestEnvelopeSha256 =
      offlineMediaBinaryContinuousProgramAudioRequestSha256(request)
    const semanticEvidence = Object.freeze({
      fixedRecipeExecuted: true,
      recipeProfileId: request.payload.recipeProfileId,
      audioAuthorityHash: request.payload.audioAuthorityHash,
      expectedObjectIdentity: request.payload.expectedObjectIdentity,
      immutableSourceBytesVerified: true,
      sourceDeliveryMode: 'private_verified_stream_v1',
      uniqueSourceCount: request.inputs.sources.length,
      sourceSliceCount: request.payload.sourceSlices.length,
      sourceOrderAndFrameRangesVerified: true,
      approvedHardCutBoundariesVerified: true,
      frameToSampleMappingExact: true,
      samplesPerFrame: 1_600,
      completeTimelineCoverageVerified: true,
      outputContainer: 'flac',
      outputAudioCodec: 'flac',
      outputSampleRate: 48_000,
      outputChannels: 2,
      outputBitsPerRawSample: 24,
      losslessSourceAudioAssembly: true,
      musicGeneratedOrMixed: false,
      sfxGeneratedOrMixed: false,
      duckingApplied: false,
      realAudioAnalysisClaimed: false,
      callerPathsAccepted: false,
      callerUrlsAccepted: false,
      callerCommandsAccepted: false,
      callerCodecSettingsAccepted: false,
      outputProbeVerified: true,
      outputProbe,
      originalApprovedEditReservationUsed: true,
      separateExportEstimateRequired: false,
      additionalExportChargeAllowed: false,
      publicDeliveryAuthorized: false,
      distributedExecutionProven: false,
    })
    const attestationWithoutHash = {
      domain: 'offline_media_binary_continuous_program_audio_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      requestEnvelopeSha256,
      sourceSha256s: request.inputs.sources.map((source) => source.sha256),
      resultSha256: outputSpool.sha256,
      confinement,
      outputProbe,
      outputTransport: 'server_committed_private_stream_v1' as const,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion:
          'offline-media-binary-continuous-program-audio-attestation-record-v1',
        source:
          'private_local_checksum_protected_continuous_program_audio_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({
          ...attestationWithoutHash,
          recordId,
          attestationHash,
        }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: 'audio/flac',
        sha256: outputSpool.sha256,
        byteLength: outputSpool.byteLength,
        outputMode: 'server_committed_private_stream_v1',
      },
      evidence: {
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256,
        sourceSha256s: request.inputs.sources.map((source) => source.sha256),
        resultSha256: outputSpool.sha256,
        semanticEvidence,
        confinement,
        containerExitCode: 0,
        oomKilled: false,
        outputTransport: 'server_committed_private_stream_v1',
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true,
        productReady: false,
        externalBetaReady: false,
        productionReady: false,
      },
    }
  } finally {
    await outputSpool?.cleanup().catch(() => undefined)
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function executeContinuousProgramAudioQaServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineContinuousProgramAudioQaExecutionResult> {
  let request: OfflineMediaBinaryContinuousProgramAudioRequest
  try {
    request = validateOfflineMediaBinaryContinuousProgramAudioRequest(value)
  } catch {
    throw invalid('Structured continuous program-audio QA request was rejected.')
  }
  if (
    !source || source.inputMode !== 'private_verified_stream_v1' ||
    !Number.isSafeInteger(source.byteLength) || source.byteLength < 1_024 ||
    source.byteLength >
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES ||
    !/^[a-f0-9]{64}$/u.test(source.sha256) ||
    typeof source.openStream !== 'function'
  ) throw invalid(
    'Continuous program-audio QA requires one exact private FLAC commitment.',
  )

  const outputProbe = await probeContinuousProgramAudioOutput(
    image,
    source,
    request,
  )
  const confinement = outputProbe.decodedSampleVerificationConfinement as
    OfflineMediaBinaryConfinementEvidence
  const requestEnvelopeSha256 =
    offlineMediaBinaryContinuousProgramAudioRequestSha256(request)
  const completedAt = new Date().toISOString()
  const document = Object.freeze({
    schemaVersion: 'offline-continuous-program-audio-qa-result-v1' as const,
    source: 'private_persisted_continuous_program_audio_independent_qa' as const,
    requestEnvelopeSha256,
    sourceSha256: source.sha256,
    sourceByteLength: source.byteLength,
    outputProbe,
    checks: {
      exactPrivateArtifactReopened: 'passed' as const,
      flacStreamShapeVerified: 'passed' as const,
      exactLosslessDecodedSampleCountVerified: 'passed' as const,
      exactFrameToSampleDurationVerified: 'passed' as const,
      mediaMutationPerformed: false as const,
    },
    outcome: 'passed' as const,
    evaluatedAt: completedAt,
  })
  const bytes = Buffer.from(`${stableAuthorityStringify(document)}\n`)
  const resultSha256 = sha256(bytes)
  const semanticEvidence = Object.freeze({
    exactPersistedArtifactReopened: true,
    independentProbeExecuted: true,
    exactLosslessDecodedSampleCountVerified: true,
    mediaMutationPerformed: false,
    outputProbe,
  })
  const attestationWithoutHash = {
    domain: 'offline_continuous_program_audio_qa_attestation_v1',
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    toolId: 'ffprobe' as const,
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    requestEnvelopeSha256,
    sourceSha256: source.sha256,
    resultSha256,
    confinement,
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion:
        'offline-continuous-program-audio-qa-attestation-record-v1',
      source: 'private_local_checksum_protected_continuous_program_audio_qa',
      attestation: { ...attestationWithoutHash, recordId, attestationHash },
      checksumSha256: sha256AuthorityValue({
        ...attestationWithoutHash,
        recordId,
        attestationHash,
      }),
    })}\n`,
  })
  return {
    resultJson: {
      mimeType: 'application/json',
      bytes,
      document,
      sha256: resultSha256,
      byteLength: bytes.byteLength,
    },
    evidence: {
      toolId: 'ffprobe',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      binaryVersion: SOURCE_VERSION,
      requestEnvelopeSha256,
      sourceSha256: source.sha256,
      resultSha256,
      semanticEvidence,
      confinement,
      containerExitCode: 0,
      oomKilled: false,
    },
    image,
    attestation: { recordId, completedAt, attestationHash },
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
}

async function executeCrossChunkColorContinuityServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  inputs: {
    left: OfflineMediaBinaryServerInjectedInput
    right: OfflineMediaBinaryServerInjectedInput
  },
): Promise<OfflineCrossChunkColorContinuityExecutionResult> {
  let request: OfflineMediaBinaryCrossChunkColorContinuityRequest
  try {
    request = validateOfflineMediaBinaryCrossChunkColorContinuityRequest(value)
  } catch {
    throw invalid('Structured cross-chunk color-continuity request was rejected.')
  }
  if (!inputs || typeof inputs !== 'object') {
    throw invalid('Cross-chunk color-continuity inputs are missing.')
  }
  assertServerInjectedInput(
    inputs.left,
    request.inputs.left.byteLength,
    request.inputs.left.sha256,
  )
  assertServerInjectedInput(
    inputs.right,
    request.inputs.right.byteLength,
    request.inputs.right.sha256,
  )
  const leftProbe = await probePrivateVp9ObjectChunk(image, inputs.left, {
    width: request.payload.width,
    height: request.payload.height,
    fps: request.payload.fps,
    frameCount: request.inputs.left.frameCount,
    countFrames: false,
  })
  const rightProbe = await probePrivateVp9ObjectChunk(image, inputs.right, {
    width: request.payload.width,
    height: request.payload.height,
    fps: request.payload.fps,
    frameCount: request.inputs.right.frameCount,
    countFrames: false,
  })
  const leftSample = await analyzeVideoColorWithConfinement({
    image,
    source: inputs.left,
    startFrame: Math.max(
      0,
      request.inputs.left.frameCount -
        OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES,
    ),
    endFrameExclusive: request.inputs.left.frameCount,
    frameRate: request.payload.fps,
  })
  const rightSample = await analyzeVideoColorWithConfinement({
    image,
    source: inputs.right,
    startFrame: 0,
    endFrameExclusive: Math.min(
      request.inputs.right.frameCount,
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_SAMPLE_WINDOW_FRAMES,
    ),
    frameRate: request.payload.fps,
  })
  const evaluation = evaluateOfflineMediaBinaryCrossChunkColorContinuity({
    boundaryBefore: request.payload.boundaryBefore,
    left: leftSample.analysis,
    right: rightSample.analysis,
  })
  const requestEnvelopeSha256 =
    offlineMediaBinaryCrossChunkColorContinuityRequestSha256(request)
  const completedAt = new Date().toISOString()
  const document = Object.freeze({
    schemaVersion: 'offline-cross-chunk-color-continuity-result-v1' as const,
    source: 'private_adjacent_object_chunk_rgb_boundary_analysis' as const,
    requestEnvelopeSha256,
    colorAuthorityHash: request.payload.colorAuthorityHash,
    expectedEvidenceIdentity: request.payload.expectedEvidenceIdentity,
    pair: {
      leftChunkId: request.inputs.left.chunkId,
      leftChunkIndex: request.inputs.left.chunkIndex,
      leftObjectIdentity: request.inputs.left.objectIdentity,
      leftSha256: request.inputs.left.sha256,
      rightChunkId: request.inputs.right.chunkId,
      rightChunkIndex: request.inputs.right.chunkIndex,
      rightObjectIdentity: request.inputs.right.objectIdentity,
      rightSha256: request.inputs.right.sha256,
      boundaryBefore: request.payload.boundaryBefore,
    },
    sampling: {
      profileId: request.payload.continuityPolicyId,
      windowFramesPerSide: request.payload.sampleWindowFrames,
      sampledFramesPerSide: request.payload.sampleFramesPerSide,
      downsampleFrame: '64x64_rgb24' as const,
      leftProbe: leftProbe.probe,
      rightProbe: rightProbe.probe,
      left: leftSample.analysis,
      right: rightSample.analysis,
    },
    evaluation,
    checks: {
      exactPrivateChunksReopened: 'passed' as const,
      adjacentChunkIdentityVerified: 'passed' as const,
      independentlyDecodedRgbSamples: 'passed' as const,
      clippingSafetyEvaluated: 'passed' as const,
      technicalSplitContinuityEvaluated: 'passed' as const,
      editorialCutMismatchRoutedToReview: 'passed' as const,
      mediaMutationPerformed: false as const,
    },
    outcome: evaluation.outcome,
    evaluatedAt: completedAt,
  })
  const bytes = Buffer.from(`${stableAuthorityStringify(document)}\n`)
  const resultSha256 = sha256(bytes)
  const confinements = Object.freeze({
    leftProbe: leftProbe.confinement,
    leftAnalysis: leftSample.confinement,
    rightProbe: rightProbe.confinement,
    rightAnalysis: rightSample.confinement,
  })
  const semanticEvidence = Object.freeze({
    fixedRecipeExecuted: true,
    recipeProfileId:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_RECIPE,
    continuityPolicyId:
      OFFLINE_MEDIA_BINARY_CROSS_CHUNK_COLOR_CONTINUITY_POLICY,
    exactAdjacentPrivateChunksVerified: true,
    independentDecodedRgbSamplingExecuted: true,
    sampledFramesPerSide: request.payload.sampleFramesPerSide,
    mediaMutationPerformed: false,
    evaluation,
    originalApprovedEditReservationUsed: true,
    separateExportEstimateRequired: false,
    additionalExportChargeAllowed: false,
    publicDeliveryAuthorized: false,
    distributedExecutionProven: false,
  })
  const attestationWithoutHash = {
    domain: 'offline_cross_chunk_color_continuity_attestation_v1',
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    toolId: 'ffmpeg' as const,
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    requestEnvelopeSha256,
    leftChunkSha256: request.inputs.left.sha256,
    rightChunkSha256: request.inputs.right.sha256,
    resultSha256,
    confinements,
    evaluation,
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = {
    ...attestationWithoutHash,
    recordId,
    attestationHash,
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath:
      `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion:
        'offline-cross-chunk-color-continuity-attestation-record-v1',
      source: 'private_local_checksum_protected_cross_chunk_color_analysis',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    resultJson: {
      mimeType: 'application/json',
      bytes,
      document,
      sha256: resultSha256,
      byteLength: bytes.byteLength,
    },
    evidence: {
      toolId: 'ffmpeg',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      binaryVersion: SOURCE_VERSION,
      requestEnvelopeSha256,
      leftChunkSha256: request.inputs.left.sha256,
      rightChunkSha256: request.inputs.right.sha256,
      resultSha256,
      semanticEvidence,
      confinement: confinements,
      containerExitCode: 0,
      oomKilled: false,
    },
    image,
    attestation: { recordId, completedAt, attestationHash },
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
}

async function executeFinalMasterVideoQaServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineFinalMasterVideoQaExecutionResult> {
  let request: OfflineFinalMasterVideoQaRequest
  try {
    request = validateOfflineFinalMasterVideoQaRequest(value)
  } catch {
    throw invalid('Structured decoded final-master video QA request was rejected.')
  }
  assertFinalMasterQaInput(request, source)
  const technicalProbe = await probeFinalMasterMedia(image, request, source)
  const decodedFrameIntegrity = await decodeFinalMasterVideoIntegrity(
    image,
    request,
    source,
  )
  const visualAnomalyScan = await scanFinalMasterVisualAnomalies(
    image,
    request,
    source,
  )
  const requestEnvelopeSha256 = offlineFinalMasterVideoQaRequestSha256(request)
  const completedAt = new Date().toISOString()
  const document = Object.freeze({
    schemaVersion: 'offline-final-master-decoded-video-qa-result-v1' as const,
    source: 'private_exact_mp4_full_decoded_video_objective_qa' as const,
    requestEnvelopeSha256,
    qaRunId: request.payload.qaRunId,
    approvedPlanSnapshotId: request.payload.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: request.payload.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: request.payload.approvedExecutionPackageHash,
    approvedEstimateId: request.payload.approvedEstimateId,
    creditReservationId: request.payload.creditReservationId,
    approvedDeliverableId: request.payload.approvedDeliverableId,
    expectedEvidenceIdentity: request.payload.expectedEvidenceIdentity,
    finalMaster: {
      artifactId: request.input.artifactId,
      objectIdentityHash: request.input.objectIdentityHash,
      sha256: request.input.sha256,
      byteLength: request.input.byteLength,
      privateObject: true as const,
      placeholder: false as const,
      publicObject: false as const,
    },
    technicalProbe: technicalProbe.probe,
    decodedFrameIntegrity: decodedFrameIntegrity.analysis,
    visualAnomalyScan: visualAnomalyScan.analysis,
    checks: {
      exactPrivateArtifactReopenedForEveryPass: 'passed' as const,
      exactSourceBytesAndShaVerifiedForEveryPass: 'passed' as const,
      h264Yuv420pBt709ProfessionalFrameVerified: 'passed' as const,
      everyDecodedFrameAccountedFor: 'passed' as const,
      visualAnomaliesReconciledAgainstApprovedExceptions:
        visualAnomalyScan.analysis.outcome,
      originalApprovedEditReservationUsed: true as const,
      separateExportEstimateRequired: false as const,
      additionalExportChargeAllowed: false as const,
      mediaMutationPerformed: false as const,
      providerCallPerformed: false as const,
    },
    outcome: visualAnomalyScan.analysis.outcome,
    evaluatedAt: completedAt,
  })
  const bytes = Buffer.from(`${stableAuthorityStringify(document)}\n`)
  const resultSha256 = sha256(bytes)
  const confinements = Object.freeze({
    technicalProbe: technicalProbe.confinement,
    decodedFrameIntegrity: decodedFrameIntegrity.confinement,
    visualAnomalyScan: visualAnomalyScan.confinement,
  })
  const semanticEvidence = Object.freeze({
    fixedRecipeExecuted: true,
    recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
    exactPrivateFinalMasterVerified: true,
    independentTechnicalProbeExecuted: true,
    fullDecodedFrameStreamVerified: true,
    decodedFrameCount: decodedFrameIntegrity.analysis.decodedFrameCount,
    visualAnomalyPolicyExecuted: true,
    visualAnomalyOutcome: visualAnomalyScan.analysis.outcome,
    mediaMutationPerformed: false,
    providerCallPerformed: false,
    originalApprovedEditReservationUsed: true,
    separateExportEstimateRequired: false,
    additionalExportChargeAllowed: false,
    longFormCheckpointingProven: false,
    googleCloudWorkerExecutionProven: false,
    canonicalLeaseVerified: false,
    singleUseDispatchVerified: false,
    internalCostEvidenceReconciled: false,
    canonicalQaAggregationReady: false,
    publicDeliveryAuthorized: false,
  })
  const attestationWithoutHash = {
    domain: 'offline_final_master_decoded_video_qa_attestation_v1',
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    toolId: 'ffmpeg' as const,
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    requestEnvelopeSha256,
    sourceSha256: request.input.sha256,
    resultSha256,
    outcome: visualAnomalyScan.analysis.outcome,
    confinements,
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await persistFinalMasterQaAttestation(
    'offline-final-master-decoded-video-qa-attestation-record-v1',
    'private_local_checksum_protected_final_master_decoded_video_qa',
    attestation,
  )
  return {
    resultJson: {
      mimeType: 'application/json',
      bytes,
      document,
      sha256: resultSha256,
      byteLength: bytes.byteLength,
    },
    evidence: {
      toolId: 'ffmpeg',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      binaryVersion: SOURCE_VERSION,
      requestEnvelopeSha256,
      sourceSha256: request.input.sha256,
      resultSha256,
      semanticEvidence,
      confinement: confinements,
      containerExitCode: 0,
      oomKilled: false,
    },
    image,
    attestation: { recordId, completedAt, attestationHash },
    readiness: {
      privateInternalOnly: true,
      exactPrivateArtifactDecoded: true,
      longFormCheckpointingReady: false,
      googleCloudWorkerReady: false,
      canonicalLeaseVerified: false,
      singleUseDispatchVerified: false,
      internalCostEvidenceReconciled: false,
      canonicalQaAggregationReady: false,
      publicDeliveryReady: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
}

async function executeFinalMasterAudioQaServerInjected(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineFinalMasterAudioQaExecutionResult> {
  let request: OfflineFinalMasterAudioQaRequest
  try {
    request = validateOfflineFinalMasterAudioQaRequest(value)
  } catch {
    throw invalid('Structured decoded final-master audio QA request was rejected.')
  }
  assertFinalMasterQaInput(request, source)
  const technicalProbe = await probeFinalMasterMedia(image, request, source)
  const decodedAudioIntegrity = await decodeFinalMasterAudioIntegrity(
    image,
    request,
    source,
  )
  const audioQualityScan = await scanFinalMasterAudioQuality(
    image,
    request,
    source,
  )
  const findingsRequireReview =
    decodedAudioIntegrity.analysis.avSyncOutcome !== 'passed' ||
    audioQualityScan.analysis.outcome !== 'passed'
  const outcome = findingsRequireReview ? 'needs_user_review' as const : 'passed' as const
  const requestEnvelopeSha256 = offlineFinalMasterAudioQaRequestSha256(request)
  const completedAt = new Date().toISOString()
  const document = Object.freeze({
    schemaVersion: 'offline-final-master-decoded-audio-qa-result-v1' as const,
    source: 'private_exact_mp4_full_decoded_audio_objective_qa' as const,
    requestEnvelopeSha256,
    qaRunId: request.payload.qaRunId,
    approvedPlanSnapshotId: request.payload.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: request.payload.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: request.payload.approvedExecutionPackageHash,
    approvedEstimateId: request.payload.approvedEstimateId,
    creditReservationId: request.payload.creditReservationId,
    approvedDeliverableId: request.payload.approvedDeliverableId,
    expectedEvidenceIdentity: request.payload.expectedEvidenceIdentity,
    finalMaster: {
      artifactId: request.input.artifactId,
      objectIdentityHash: request.input.objectIdentityHash,
      sha256: request.input.sha256,
      byteLength: request.input.byteLength,
      privateObject: true as const,
      placeholder: false as const,
      publicObject: false as const,
    },
    technicalProbe: technicalProbe.probe,
    decodedAudioIntegrity: decodedAudioIntegrity.analysis,
    audioQualityScan: audioQualityScan.analysis,
    speechClarity: {
      status: request.payload.speechClarityStatus,
      evidenceHash: request.payload.speechClarityEvidenceHash,
      source: 'separate_bound_speech_clarity_evidence' as const,
      ffmpegClaimedSpeechUnderstanding: false as const,
    },
    checks: {
      exactPrivateArtifactReopenedForEveryPass: 'passed' as const,
      exactSourceBytesAndShaVerifiedForEveryPass: 'passed' as const,
      aac48000HzChannelContractVerified: 'passed' as const,
      everyDecodedAudioSampleRangeAccountedFor: 'passed' as const,
      avSyncWithinApprovedFrameTolerance:
        decodedAudioIntegrity.analysis.avSyncOutcome,
      loudnessPeakRangeAndSilencePolicy:
        audioQualityScan.analysis.outcome,
      separateSpeechClarityEvidenceReconciled: 'passed' as const,
      originalApprovedEditReservationUsed: true as const,
      separateExportEstimateRequired: false as const,
      additionalExportChargeAllowed: false as const,
      mediaMutationPerformed: false as const,
      providerCallPerformed: false as const,
    },
    outcome,
    evaluatedAt: completedAt,
  })
  const bytes = Buffer.from(`${stableAuthorityStringify(document)}\n`)
  const resultSha256 = sha256(bytes)
  const confinements = Object.freeze({
    technicalProbe: technicalProbe.confinement,
    decodedAudioIntegrity: decodedAudioIntegrity.confinement,
    audioQualityScan: audioQualityScan.confinement,
  })
  const semanticEvidence = Object.freeze({
    fixedRecipeExecuted: true,
    recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
    exactPrivateFinalMasterVerified: true,
    independentTechnicalProbeExecuted: true,
    fullDecodedAudioStreamVerified: true,
    decodedSampleCount: decodedAudioIntegrity.analysis.decodedSampleCount,
    avSyncDriftFrames: decodedAudioIntegrity.analysis.avSyncDriftFrames,
    audioQualityPolicyExecuted: true,
    audioQualityOutcome: audioQualityScan.analysis.outcome,
    separateSpeechClarityEvidenceReconciled: true,
    ffmpegClaimedSpeechUnderstanding: false,
    mediaMutationPerformed: false,
    providerCallPerformed: false,
    originalApprovedEditReservationUsed: true,
    separateExportEstimateRequired: false,
    additionalExportChargeAllowed: false,
    longFormCheckpointingProven: false,
    googleCloudWorkerExecutionProven: false,
    canonicalLeaseVerified: false,
    singleUseDispatchVerified: false,
    internalCostEvidenceReconciled: false,
    canonicalQaAggregationReady: false,
    publicDeliveryAuthorized: false,
  })
  const attestationWithoutHash = {
    domain: 'offline_final_master_decoded_audio_qa_attestation_v1',
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    toolId: 'ffmpeg' as const,
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    requestEnvelopeSha256,
    sourceSha256: request.input.sha256,
    resultSha256,
    outcome,
    confinements,
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await persistFinalMasterQaAttestation(
    'offline-final-master-decoded-audio-qa-attestation-record-v1',
    'private_local_checksum_protected_final_master_decoded_audio_qa',
    attestation,
  )
  return {
    resultJson: {
      mimeType: 'application/json',
      bytes,
      document,
      sha256: resultSha256,
      byteLength: bytes.byteLength,
    },
    evidence: {
      toolId: 'ffmpeg',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      binaryVersion: SOURCE_VERSION,
      requestEnvelopeSha256,
      sourceSha256: request.input.sha256,
      resultSha256,
      semanticEvidence,
      confinement: confinements,
      containerExitCode: 0,
      oomKilled: false,
    },
    image,
    attestation: { recordId, completedAt, attestationHash },
    readiness: {
      privateInternalOnly: true,
      exactPrivateArtifactDecoded: true,
      speechClarityEvidenceReconciled: true,
      longFormCheckpointingReady: false,
      googleCloudWorkerReady: false,
      canonicalLeaseVerified: false,
      singleUseDispatchVerified: false,
      internalCostEvidenceReconciled: false,
      canonicalQaAggregationReady: false,
      publicDeliveryReady: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  }
}

type OfflineFinalMasterQaRequest =
  | OfflineFinalMasterVideoQaRequest
  | OfflineFinalMasterAudioQaRequest

function assertFinalMasterQaInput(
  request: OfflineFinalMasterQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
): void {
  assertServerInjectedInput(
    source,
    request.input.byteLength,
    request.input.sha256,
  )
  if (
    request.input.artifactId !== request.payload.finalMasterArtifactId ||
    request.input.objectIdentityHash !==
      request.payload.finalMasterObjectIdentityHash ||
    request.input.privateObject !== true ||
    request.input.placeholder !== false ||
    request.input.publicObject !== false
  ) throw invalid('Decoded final-master QA lost exact private artifact authority.')
}

async function probeFinalMasterMedia(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFinalMasterQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
) {
  const command = [
    '-v', 'error',
    '-show_entries',
    'format=format_name,start_time,duration,size:' +
      'stream=index,codec_name,codec_type,start_time,duration,width,height,' +
      'avg_frame_rate,r_frame_rate,pix_fmt,color_space,color_transfer,' +
      'color_primaries,color_range,sample_rate,channels,channel_layout',
    '-print_format', 'json',
    '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFPROBE_ENTRYPOINT,
      command,
    )
    const execution = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      finalMasterQaTimeoutMs(request),
    )
    const state = record((await inspectContainer(container.id)).State)
    if (
      execution.exitCode !== 0 || execution.stderr.length > 0 ||
      state.OOMKilled !== false
    ) throw unavailable('Final-master technical probe failed closed.', {
      containerExitCode: execution.exitCode,
      diagnostic: safeFfmpegDiagnostic(execution.stderr),
    })
    let parsed: Record<string, unknown>
    try {
      parsed = record(JSON.parse(execution.stdout.toString('utf8')))
    } catch {
      throw unavailable('Final-master technical probe returned invalid JSON.')
    }
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams)
      ? parsed.streams.map(record)
      : []
    const videoStreams = streams.filter((stream) => stream.codec_type === 'video')
    const audioStreams = streams.filter((stream) => stream.codec_type === 'audio')
    if (
      streams.length !== 2 || videoStreams.length !== 1 ||
      audioStreams.length !== 1
    ) throw unavailable(
      'Final-master technical probe requires exactly one video and one audio stream.',
    )
    const video = videoStreams[0]!
    const audio = audioStreams[0]!
    const formatName = String(format.format_name ?? '')
    const formatDurationSeconds = finiteNumber(format.duration)
    const formatStartTimeSeconds = finiteNumber(format.start_time)
    const videoStartTimeSeconds = finiteNumber(video.start_time)
    const audioStartTimeSeconds = finiteNumber(audio.start_time)
    const videoDurationSeconds = finiteNumber(video.duration)
    const audioDurationSeconds = finiteNumber(audio.duration)
    const videoFps = rational(video.avg_frame_rate ?? video.r_frame_rate)
    const expectedDurationSeconds = request.payload.totalFrames / request.payload.fps
    const maximumAvSyncDriftFrames = 'maximumAvSyncDriftFrames' in request.payload
      ? request.payload.maximumAvSyncDriftFrames
      : 2
    const durationToleranceSeconds =
      maximumAvSyncDriftFrames / request.payload.fps
    const audioChannels = optionalInteger(audio.channels)
    const audioChannelLayout = String(audio.channel_layout ?? '')
    const expectedAudioChannelLayout = audioChannels === 1 ? 'mono' : 'stereo'
    const probedFormatSize = optionalInteger(format.size)
    if (
      !formatName.split(',').includes('mp4') ||
      (probedFormatSize !== undefined && probedFormatSize !== source.byteLength) ||
      formatStartTimeSeconds === undefined ||
      Math.abs(formatStartTimeSeconds) > 0.001 ||
      formatDurationSeconds === undefined ||
      Math.abs(formatDurationSeconds - expectedDurationSeconds) >
        durationToleranceSeconds ||
      video.codec_name !== 'h264' ||
      optionalInteger(video.width) !== request.payload.width ||
      optionalInteger(video.height) !== request.payload.height ||
      videoFps !== request.payload.fps || video.pix_fmt !== 'yuv420p' ||
      video.color_space !== 'bt709' || video.color_transfer !== 'bt709' ||
      video.color_primaries !== 'bt709' ||
      video.color_range !== 'tv' ||
      videoStartTimeSeconds === undefined ||
      Math.abs(videoStartTimeSeconds) > 0.001 ||
      videoDurationSeconds === undefined ||
      Math.abs(videoDurationSeconds - expectedDurationSeconds) >
        durationToleranceSeconds ||
      audio.codec_name !== 'aac' || optionalInteger(audio.sample_rate) !== 48_000 ||
      audioChannels === undefined || ![1, 2].includes(audioChannels) ||
      audioChannelLayout !== expectedAudioChannelLayout ||
      audioStartTimeSeconds === undefined ||
      Math.abs(audioStartTimeSeconds) > durationToleranceSeconds ||
      audioDurationSeconds === undefined ||
      Math.abs(audioDurationSeconds - expectedDurationSeconds) >
        durationToleranceSeconds ||
      ('channels' in request.payload && audioChannels !== request.payload.channels)
    ) throw unavailable(
      'Final-master failed the exact MP4, H.264, AAC, frame, color, or duration contract.',
    )
    return {
      probe: Object.freeze({
        container: 'mp4' as const,
        formatName,
        formatStartTimeSeconds,
        formatDurationSeconds,
        sourceByteLength: source.byteLength,
        streamedFormatSizeReported: probedFormatSize,
        exactSourceSizeVerifiedByInputCommitment: true as const,
        video: {
          codec: 'h264' as const,
          width: request.payload.width,
          height: request.payload.height,
          fps: request.payload.fps,
          pixelFormat: 'yuv420p' as const,
          colorSpace: 'bt709' as const,
          colorTransfer: 'bt709' as const,
          colorPrimaries: 'bt709' as const,
          colorRange: 'tv' as const,
          startTimeSeconds: videoStartTimeSeconds,
          durationSeconds: videoDurationSeconds,
        },
        audio: {
          codec: 'aac' as const,
          sampleRate: 48_000 as const,
          channels: audioChannels,
          channelLayout: audioChannelLayout,
          startTimeSeconds: audioStartTimeSeconds,
          durationSeconds: audioDurationSeconds,
        },
        expectedDurationSeconds: rounded(expectedDurationSeconds),
        durationToleranceSeconds: rounded(durationToleranceSeconds),
      }),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function decodeFinalMasterVideoIntegrity(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFinalMasterVideoQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
) {
  const command = [
    '-v', 'error', '-xerror', '-err_detect', 'explode',
    '-i', 'pipe:0', '-map', '0:v:0', '-an', '-sn', '-dn',
    '-f', 'framemd5', '-hash', 'sha256', 'pipe:1',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  const parser = createVideoFrameMd5Parser(request)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const execution = await dockerVerifiedInputStreamingLines({
      args: ['start', '--attach', '--interactive', container.id],
      input: source,
      maximumOutputBytes: 256 * 1024 * 1024,
      timeoutMs: finalMasterQaTimeoutMs(request),
      onLine: parser.onLine,
    })
    const state = record((await inspectContainer(container.id)).State)
    if (
      execution.exitCode !== 0 || execution.stderr.length > 0 ||
      state.OOMKilled !== false
    ) throw unavailable('Final-master decoded-video pass failed closed.', {
      containerExitCode: execution.exitCode,
      diagnostic: safeFfmpegDiagnostic(execution.stderr),
    })
    return {
      analysis: Object.freeze({
        ...parser.finish(),
        decodedFrameChecksumStreamSha256: execution.outputSha256,
        decodedFrameChecksumStreamByteLength: execution.outputByteLength,
        exactSourceBytesVerified: execution.verifiedInputByteLength,
        exactSourceSha256Verified: execution.verifiedInputSha256,
        outcome: 'passed' as const,
      }),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function decodeFinalMasterAudioIntegrity(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFinalMasterAudioQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
) {
  const command = [
    '-v', 'error', '-xerror', '-err_detect', 'explode',
    '-i', 'pipe:0', '-map', '0:a:0', '-vn', '-sn', '-dn',
    '-f', 'framemd5', '-hash', 'sha256', 'pipe:1',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  const parser = createAudioFrameMd5Parser(request)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const execution = await dockerVerifiedInputStreamingLines({
      args: ['start', '--attach', '--interactive', container.id],
      input: source,
      maximumOutputBytes: 256 * 1024 * 1024,
      timeoutMs: finalMasterQaTimeoutMs(request),
      onLine: parser.onLine,
    })
    const state = record((await inspectContainer(container.id)).State)
    if (
      execution.exitCode !== 0 || execution.stderr.length > 0 ||
      state.OOMKilled !== false
    ) throw unavailable('Final-master decoded-audio pass failed closed.', {
      containerExitCode: execution.exitCode,
      diagnostic: safeFfmpegDiagnostic(execution.stderr),
    })
    const parsed = parser.finish()
    const expectedSampleCount = request.payload.totalFrames *
      (request.payload.sampleRate / request.payload.fps)
    const avSyncDriftSamples = Math.abs(parsed.decodedSampleCount - expectedSampleCount)
    const avSyncDriftFrames = rounded(
      avSyncDriftSamples / (request.payload.sampleRate / request.payload.fps),
    )
    return {
      analysis: Object.freeze({
        ...parsed,
        expectedSampleCount,
        avSyncDriftSamples,
        avSyncDriftFrames,
        maximumAvSyncDriftFrames: request.payload.maximumAvSyncDriftFrames,
        avSyncOutcome: avSyncDriftFrames <= request.payload.maximumAvSyncDriftFrames
          ? 'passed' as const
          : 'needs_user_review' as const,
        decodedAudioChecksumStreamSha256: execution.outputSha256,
        decodedAudioChecksumStreamByteLength: execution.outputByteLength,
        exactSourceBytesVerified: execution.verifiedInputByteLength,
        exactSourceSha256Verified: execution.verifiedInputSha256,
      }),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function scanFinalMasterVisualAnomalies(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFinalMasterVideoQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
) {
  const blackDurationSeconds = rounded(
    request.payload.blackMinimumDurationFrames / request.payload.fps,
  )
  const freezeDurationSeconds = rounded(
    request.payload.freezeMinimumDurationFrames / request.payload.fps,
  )
  const filter = [
    `blackdetect=d=${blackDurationSeconds}:pix_th=0.10`,
    `freezedetect=n=-60dB:d=${freezeDurationSeconds}`,
    `select=gt(scene\\,${request.payload.flashSceneChangeThreshold})`,
    'showinfo',
  ].join(',')
  const command = [
    '-hide_banner', '-nostats', '-v', 'info',
    '-xerror', '-err_detect', 'explode', '-i', 'pipe:0',
    '-map', '0:v:0', '-an', '-sn', '-dn', '-vf', filter,
    '-f', 'null', '-',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const execution = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      64 * 1024,
      finalMasterQaTimeoutMs(request),
    )
    const state = record((await inspectContainer(container.id)).State)
    if (execution.exitCode !== 0 || state.OOMKilled !== false) {
      throw unavailable('Final-master visual anomaly scan failed closed.', {
        containerExitCode: execution.exitCode,
        diagnostic: safeFfmpegDiagnostic(execution.stderr),
      })
    }
    const findings = parseFinalMasterVisualFindings(
      execution.stderr.toString('utf8'),
      request,
    )
    const reconciled = findings.map((finding) => {
      const approvedException = findCoveringVisualException(
        finding,
        request.payload.visualExceptionManifest.ranges,
      )
      return {
        ...finding,
        disposition: approvedException
          ? 'approved_exception' as const
          : 'needs_user_review' as const,
        approvedExceptionId: approvedException?.exceptionId,
        approvalEvidenceHash: approvedException?.approvalEvidenceHash,
      }
    })
    const unexpected = reconciled.filter(
      (finding) => finding.disposition === 'needs_user_review',
    )
    return {
      analysis: Object.freeze({
        policyId: request.payload.anomalyPolicyId,
        blackMinimumDurationFrames: request.payload.blackMinimumDurationFrames,
        freezeMinimumDurationFrames: request.payload.freezeMinimumDurationFrames,
        flashSceneChangeThreshold: request.payload.flashSceneChangeThreshold,
        exceptionManifestHash:
          request.payload.visualExceptionManifest.manifestHash,
        detectedFindingCount: reconciled.length,
        approvedExceptionFindingCount: reconciled.length - unexpected.length,
        unexpectedFindingCount: unexpected.length,
        findings: reconciled,
        diagnosticSha256: sha256(execution.stderr),
        diagnosticByteLength: execution.stderr.byteLength,
        outcome: unexpected.length === 0
          ? 'passed' as const
          : 'needs_user_review' as const,
      }),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function scanFinalMasterAudioQuality(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFinalMasterAudioQaRequest,
  source: OfflineMediaBinaryServerInjectedInput,
) {
  const silenceDurationSeconds = rounded(
    request.payload.silenceMinimumDurationFrames / request.payload.fps,
  )
  const filter = [
    'ebur128=peak=true:framelog=verbose',
    'astats=metadata=0:reset=0',
    `silencedetect=n=-60dB:d=${silenceDurationSeconds}`,
  ].join(',')
  const command = [
    '-hide_banner', '-nostats', '-v', 'info',
    '-xerror', '-err_detect', 'explode', '-i', 'pipe:0',
    '-map', '0:a:0', '-vn', '-sn', '-dn', '-af', filter,
    '-f', 'null', '-',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const execution = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      64 * 1024,
      finalMasterQaTimeoutMs(request),
    )
    const state = record((await inspectContainer(container.id)).State)
    if (execution.exitCode !== 0 || state.OOMKilled !== false) {
      throw unavailable('Final-master audio quality scan failed closed.', {
        containerExitCode: execution.exitCode,
        diagnostic: safeFfmpegDiagnostic(execution.stderr),
      })
    }
    const parsed = parseFinalMasterAudioQuality(
      execution.stderr.toString('utf8'),
      request,
    )
    const integratedLufsWithinPolicy =
      typeof parsed.integratedLufs === 'number' &&
      Math.abs(parsed.integratedLufs - request.payload.targetIntegratedLufs) <=
        request.payload.integratedLufsTolerance
    const truePeakWithinPolicy =
      typeof parsed.truePeakDbtp === 'number' &&
      parsed.truePeakDbtp <= request.payload.maximumTruePeakDbtp
    const loudnessRangeWithinPolicy =
      typeof parsed.loudnessRangeLufs === 'number' &&
      parsed.loudnessRangeLufs <= request.payload.maximumLoudnessRangeLufs
    const decodedSignalFinite =
      parsed.numberOfNaNs === 0 && parsed.numberOfInfs === 0
    if (
      typeof parsed.astatsPeakCount !== 'number' ||
      !Number.isSafeInteger(parsed.astatsPeakCount) ||
      parsed.astatsPeakCount < 0
    ) throw unavailable(
      'Final-master audio peak-count metric is not a bounded sample count.',
    )
    const unexpectedClippedSampleCount =
      typeof parsed.astatsPeakLevelDb === 'number' &&
      parsed.astatsPeakLevelDb >= 0
        ? parsed.astatsPeakCount
        : 0
    const reconciledSilences = parsed.silences.map((silence) => {
      const approvedException = findCoveringAudioException(
        silence,
        request.payload.audioExceptionManifest.ranges,
      )
      return {
        ...silence,
        disposition: approvedException
          ? 'approved_exception' as const
          : 'needs_user_review' as const,
        approvedExceptionId: approvedException?.exceptionId,
        approvalEvidenceHash: approvedException?.approvalEvidenceHash,
      }
    })
    const unexpectedSilences = reconciledSilences.filter(
      (silence) => silence.disposition === 'needs_user_review',
    )
    const outcome =
      integratedLufsWithinPolicy && truePeakWithinPolicy &&
      loudnessRangeWithinPolicy && decodedSignalFinite &&
      unexpectedClippedSampleCount === 0 &&
      unexpectedSilences.length === 0
        ? 'passed' as const
        : 'needs_user_review' as const
    return {
      analysis: Object.freeze({
        policyId: request.payload.audioPolicyId,
        integratedLufs: parsed.integratedLufs,
        targetIntegratedLufs: request.payload.targetIntegratedLufs,
        integratedLufsTolerance: request.payload.integratedLufsTolerance,
        integratedLufsWithinPolicy,
        truePeakDbtp: parsed.truePeakDbtp,
        maximumTruePeakDbtp: request.payload.maximumTruePeakDbtp,
        truePeakWithinPolicy,
        loudnessRangeLufs: parsed.loudnessRangeLufs,
        maximumLoudnessRangeLufs:
          request.payload.maximumLoudnessRangeLufs,
        loudnessRangeWithinPolicy,
        astatsPeakLevelDb: parsed.astatsPeakLevelDb,
        astatsPeakCount: parsed.astatsPeakCount,
        unexpectedClippedSampleCount,
        numberOfNaNs: parsed.numberOfNaNs,
        numberOfInfs: parsed.numberOfInfs,
        decodedSignalFinite,
        silenceMinimumDurationFrames:
          request.payload.silenceMinimumDurationFrames,
        exceptionManifestHash:
          request.payload.audioExceptionManifest.manifestHash,
        detectedSilenceCount: reconciledSilences.length,
        unexpectedSilenceCount: unexpectedSilences.length,
        silences: reconciledSilences,
        diagnosticSha256: sha256(execution.stderr),
        diagnosticByteLength: execution.stderr.byteLength,
        outcome,
      }),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function persistFinalMasterQaAttestation(
  recordVersion: string,
  source: string,
  attestation: Readonly<Record<string, unknown>>,
): Promise<void> {
  const recordId = String(attestation.recordId)
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion,
      source,
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
}

function createVideoFrameMd5Parser(request: OfflineFinalMasterVideoQaRequest) {
  let timeBaseVerified = false
  let mediaTypeVerified = false
  let codecVerified = false
  let dimensionsVerified = false
  let hashAlgorithmVerified = false
  let decodedFrameCount = 0
  let decodedRawByteCount = 0
  let previousHash = ''
  const expectedRawFrameBytes =
    request.payload.width * request.payload.height * 3 / 2
  const onLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    if (trimmed.startsWith('#')) {
      if (trimmed === '#hash: SHA256') hashAlgorithmVerified = true
      if (trimmed === `#tb 0: 1/${request.payload.fps}`) {
        timeBaseVerified = true
      }
      if (trimmed === '#media_type 0: video') mediaTypeVerified = true
      if (trimmed === '#codec_id 0: rawvideo') codecVerified = true
      if (
        trimmed ===
          `#dimensions 0: ${request.payload.width}x${request.payload.height}`
      ) dimensionsVerified = true
      return
    }
    const fields = trimmed.split(',').map((field) => field.trim())
    if (fields.length !== 6 || !/^[a-f0-9]{64}$/iu.test(fields[5] ?? '')) {
      throw unavailable('Decoded-video frame checksum line is malformed.')
    }
    const streamIndex = frameMd5Integer(fields[0], 'video stream index')
    const dts = frameMd5Integer(fields[1], 'video DTS')
    const pts = frameMd5Integer(fields[2], 'video PTS')
    const duration = frameMd5Integer(fields[3], 'video frame duration')
    const byteLength = frameMd5Integer(fields[4], 'video raw frame bytes')
    if (
      streamIndex !== 0 || dts !== decodedFrameCount ||
      pts !== decodedFrameCount || duration !== 1 ||
      byteLength !== expectedRawFrameBytes ||
      decodedFrameCount >= request.payload.totalFrames
    ) throw unavailable(
      'Decoded-video frame checksum stream lost sequential frame integrity.',
    )
    decodedFrameCount += 1
    decodedRawByteCount += byteLength
    previousHash = String(fields[5]).toLowerCase()
  }
  const finish = () => {
    if (
      !timeBaseVerified || !mediaTypeVerified || !codecVerified ||
      !dimensionsVerified || !hashAlgorithmVerified ||
      decodedFrameCount !== request.payload.totalFrames || !previousHash
    ) throw unavailable(
      'Decoded-video frame checksum stream failed its exact header or frame-count contract.',
    )
    return Object.freeze({
      checksumFormat: 'framemd5_v2_sha256' as const,
      decodedCodec: 'rawvideo' as const,
      decodedPixelFormat: 'yuv420p' as const,
      frameTimeBase: `1/${request.payload.fps}`,
      width: request.payload.width,
      height: request.payload.height,
      expectedRawFrameBytes,
      decodedFrameCount,
      expectedFrameCount: request.payload.totalFrames,
      decodedRawByteCount,
      finalFrameSha256: previousHash,
      sequentialDtsPtsVerified: true as const,
      oneFrameDurationVerified: true as const,
      perFrameSha256Verified: true as const,
      retainedPerFramePayloads: false as const,
    })
  }
  return { onLine, finish }
}

function createAudioFrameMd5Parser(request: OfflineFinalMasterAudioQaRequest) {
  let timeBaseVerified = false
  let mediaTypeVerified = false
  let codecVerified = false
  let sampleRateVerified = false
  let channelLayoutVerified = false
  let hashAlgorithmVerified = false
  let packetCount = 0
  let decodedSampleCount = 0
  let decodedPcmByteCount = 0
  let previousHash = ''
  const expectedChannelLayout = request.payload.channels === 1 ? 'mono' : 'stereo'
  const onLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    if (trimmed.startsWith('#')) {
      if (trimmed === '#hash: SHA256') hashAlgorithmVerified = true
      if (trimmed === '#tb 0: 1/48000') timeBaseVerified = true
      if (trimmed === '#media_type 0: audio') mediaTypeVerified = true
      if (trimmed === '#codec_id 0: pcm_s16le') codecVerified = true
      if (trimmed === '#sample_rate 0: 48000') sampleRateVerified = true
      if (
        trimmed === `#channel_layout_name 0: ${expectedChannelLayout}` ||
        trimmed === `#channel_layout 0: ${expectedChannelLayout}`
      ) channelLayoutVerified = true
      return
    }
    const fields = trimmed.split(',').map((field) => field.trim())
    if (fields.length !== 6 || !/^[a-f0-9]{64}$/iu.test(fields[5] ?? '')) {
      throw unavailable('Decoded-audio checksum line is malformed.')
    }
    const streamIndex = frameMd5Integer(fields[0], 'audio stream index')
    const dts = frameMd5Integer(fields[1], 'audio DTS')
    const pts = frameMd5Integer(fields[2], 'audio PTS')
    const duration = frameMd5Integer(fields[3], 'audio packet duration')
    const byteLength = frameMd5Integer(fields[4], 'audio PCM bytes')
    if (
      streamIndex !== 0 || dts !== decodedSampleCount ||
      pts !== decodedSampleCount || duration < 1 ||
      byteLength !== duration * request.payload.channels * 2
    ) throw unavailable(
      'Decoded-audio checksum stream lost contiguous PCM sample integrity.',
    )
    const nextSampleCount = decodedSampleCount + duration
    const maximumExpectedSamples =
      request.payload.totalFrames *
        (request.payload.sampleRate / request.payload.fps) +
      request.payload.sampleRate * 10
    if (nextSampleCount > maximumExpectedSamples) {
      throw unavailable('Decoded-audio sample count exceeded its fixed bound.')
    }
    decodedSampleCount = nextSampleCount
    decodedPcmByteCount += byteLength
    packetCount += 1
    previousHash = String(fields[5]).toLowerCase()
  }
  const finish = () => {
    if (
      !timeBaseVerified || !mediaTypeVerified || !codecVerified ||
      !sampleRateVerified || !channelLayoutVerified ||
      !hashAlgorithmVerified || packetCount < 1 ||
      decodedSampleCount < 1 || !previousHash
    ) throw unavailable(
      'Decoded-audio checksum stream failed its exact header or sample contract.',
    )
    return Object.freeze({
      checksumFormat: 'framemd5_v2_sha256' as const,
      decodedCodec: 'pcm_s16le' as const,
      sampleTimeBase: '1/48000' as const,
      sampleRate: 48_000 as const,
      channels: request.payload.channels,
      channelLayout: expectedChannelLayout,
      packetCount,
      decodedSampleCount,
      decodedPcmByteCount,
      finalPacketSha256: previousHash,
      contiguousDtsPtsVerified: true as const,
      packetSampleDurationsVerified: true as const,
      perPacketSha256Verified: true as const,
      retainedPerPacketPayloads: false as const,
    })
  }
  return { onLine, finish }
}

interface FinalMasterVisualFinding {
  findingId: string
  kind: 'black_range' | 'freeze_range' | 'scene_change'
  startFrame: number
  endFrameExclusive: number
  durationFrames: number
}

function parseFinalMasterVisualFindings(
  diagnostic: string,
  request: OfflineFinalMasterVideoQaRequest,
): FinalMasterVisualFinding[] {
  const findings: FinalMasterVisualFinding[] = []
  for (const match of diagnostic.matchAll(
    /black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/gu,
  )) {
    addVisualFinding(findings, request, 'black_range', match[1], match[2])
  }
  let freezeStartSeconds: number | undefined
  for (const line of diagnostic.split(/\r?\n/u)) {
    const start = /freeze_start:\s*([0-9.]+)/u.exec(line)
    if (start) freezeStartSeconds = strictNonNegativeNumber(start[1], 'freeze start')
    const end = /freeze_end:\s*([0-9.]+)/u.exec(line)
    if (end && freezeStartSeconds !== undefined) {
      addVisualFinding(
        findings,
        request,
        'freeze_range',
        freezeStartSeconds,
        strictNonNegativeNumber(end[1], 'freeze end'),
      )
      freezeStartSeconds = undefined
    }
    const showInfo = /\bn:\s*[0-9]+\s+pts:\s*-?[0-9]+\s+pts_time:\s*([0-9.]+)/u
      .exec(line)
    if (showInfo) {
      const frame = secondsToNearestFrame(
        strictNonNegativeNumber(showInfo[1], 'scene-change timestamp'),
        request.payload.fps,
        request.payload.totalFrames,
      )
      findings.push(finalMasterVisualFinding(
        'scene_change',
        frame,
        Math.min(request.payload.totalFrames, frame + 1),
      ))
    }
  }
  if (freezeStartSeconds !== undefined) {
    addVisualFinding(
      findings,
      request,
      'freeze_range',
      freezeStartSeconds,
      request.payload.totalFrames / request.payload.fps,
    )
  }
  const deduplicated = new Map<string, FinalMasterVisualFinding>()
  for (const finding of findings) {
    const key = `${finding.kind}:${finding.startFrame}:${finding.endFrameExclusive}`
    deduplicated.set(key, finding)
  }
  const normalized = [...deduplicated.values()].sort((left, right) =>
    left.startFrame - right.startFrame ||
    left.endFrameExclusive - right.endFrameExclusive ||
    left.kind.localeCompare(right.kind))
  if (normalized.length > 8_192) {
    throw unavailable('Final-master visual anomaly findings exceeded their fixed bound.')
  }
  return normalized
}

function addVisualFinding(
  findings: FinalMasterVisualFinding[],
  request: OfflineFinalMasterVideoQaRequest,
  kind: FinalMasterVisualFinding['kind'],
  startValue: string | number | undefined,
  endValue: string | number | undefined,
): void {
  const startSeconds = strictNonNegativeNumber(startValue, `${kind} start`)
  const endSeconds = strictNonNegativeNumber(endValue, `${kind} end`)
  const startFrame = secondsToNearestFrame(
    startSeconds,
    request.payload.fps,
    request.payload.totalFrames,
  )
  const endFrameExclusive = Math.max(
    startFrame + 1,
    Math.min(
      request.payload.totalFrames,
      Math.round(endSeconds * request.payload.fps),
    ),
  )
  findings.push(finalMasterVisualFinding(kind, startFrame, endFrameExclusive))
}

function finalMasterVisualFinding(
  kind: FinalMasterVisualFinding['kind'],
  startFrame: number,
  endFrameExclusive: number,
): FinalMasterVisualFinding {
  const withoutId = {
    kind,
    startFrame,
    endFrameExclusive,
    durationFrames: endFrameExclusive - startFrame,
  }
  return {
    findingId: `visual-${sha256AuthorityValue(withoutId).slice(0, 24)}`,
    ...withoutId,
  }
}

function findCoveringVisualException(
  finding: FinalMasterVisualFinding,
  ranges: readonly OfflineFinalMasterVisualExceptionRange[],
): OfflineFinalMasterVisualExceptionRange | undefined {
  const requiredKind = finding.kind === 'black_range'
    ? 'approved_black_hold'
    : finding.kind === 'freeze_range'
      ? 'approved_freeze_hold'
      : 'approved_flash_or_cut'
  return ranges.find((range) =>
    range.kind === requiredKind &&
    range.startFrame <= finding.startFrame &&
    range.endFrameExclusive >= finding.endFrameExclusive)
}

interface FinalMasterSilenceFinding {
  findingId: string
  kind: 'digital_silence_range'
  startFrame: number
  endFrameExclusive: number
  durationFrames: number
}

function parseFinalMasterAudioQuality(
  diagnostic: string,
  request: OfflineFinalMasterAudioQaRequest,
) {
  const integratedLufs = lastDiagnosticMetric(
    diagnostic,
    /\bI:\s*(-?(?:[0-9]+(?:\.[0-9]+)?|inf))\s+LUFS/giu,
    'integrated loudness',
    true,
  )
  const loudnessRangeLufs = lastDiagnosticMetric(
    diagnostic,
    /\bLRA:\s*(-?(?:[0-9]+(?:\.[0-9]+)?|inf))\s+LU/giu,
    'loudness range',
    true,
  )
  const truePeakDbtp = lastDiagnosticMetric(
    diagnostic,
    /\bPeak:\s*(-?(?:[0-9]+(?:\.[0-9]+)?|inf))\s+dBFS/giu,
    'true peak',
    true,
  )
  const astatsPeakLevelDb = lastDiagnosticMetric(
    diagnostic,
    /Peak level dB:\s*(-?(?:[0-9]+(?:\.[0-9]+)?|inf))/giu,
    'astats peak level',
    true,
  )
  const astatsPeakCount = lastDiagnosticMetric(
    diagnostic,
    /Peak count:\s*([0-9]+(?:\.[0-9]+)?)/giu,
    'astats peak count',
  )
  const numberOfNaNs = lastDiagnosticMetric(
    diagnostic,
    /Number of NaNs:\s*([0-9]+(?:\.[0-9]+)?)/giu,
    'astats NaN count',
  )
  const numberOfInfs = lastDiagnosticMetric(
    diagnostic,
    /Number of Infs:\s*([0-9]+(?:\.[0-9]+)?)/giu,
    'astats infinity count',
  )
  const silences: FinalMasterSilenceFinding[] = []
  let silenceStartSeconds: number | undefined
  for (const line of diagnostic.split(/\r?\n/u)) {
    const start = /silence_start:\s*([0-9.]+)/u.exec(line)
    if (start) silenceStartSeconds = strictNonNegativeNumber(start[1], 'silence start')
    const end = /silence_end:\s*([0-9.]+)/u.exec(line)
    if (end && silenceStartSeconds !== undefined) {
      silences.push(finalMasterSilenceFinding(
        request,
        silenceStartSeconds,
        strictNonNegativeNumber(end[1], 'silence end'),
      ))
      silenceStartSeconds = undefined
    }
  }
  if (silenceStartSeconds !== undefined) {
    silences.push(finalMasterSilenceFinding(
      request,
      silenceStartSeconds,
      request.payload.totalFrames / request.payload.fps,
    ))
  }
  if (silences.length > 8_192) {
    throw unavailable('Final-master silence findings exceeded their fixed bound.')
  }
  return {
    integratedLufs,
    loudnessRangeLufs,
    truePeakDbtp,
    astatsPeakLevelDb,
    astatsPeakCount,
    numberOfNaNs,
    numberOfInfs,
    silences,
  }
}

function finalMasterSilenceFinding(
  request: OfflineFinalMasterAudioQaRequest,
  startSeconds: number,
  endSeconds: number,
): FinalMasterSilenceFinding {
  const startFrame = secondsToNearestFrame(
    startSeconds,
    request.payload.fps,
    request.payload.totalFrames,
  )
  const endFrameExclusive = Math.max(
    startFrame + 1,
    Math.min(
      request.payload.totalFrames,
      Math.round(endSeconds * request.payload.fps),
    ),
  )
  const withoutId = {
    kind: 'digital_silence_range' as const,
    startFrame,
    endFrameExclusive,
    durationFrames: endFrameExclusive - startFrame,
  }
  return {
    findingId: `silence-${sha256AuthorityValue(withoutId).slice(0, 24)}`,
    ...withoutId,
  }
}

function findCoveringAudioException(
  finding: FinalMasterSilenceFinding,
  ranges: readonly OfflineFinalMasterAudioExceptionRange[],
): OfflineFinalMasterAudioExceptionRange | undefined {
  return ranges.find((range) =>
    range.kind === 'approved_digital_silence' &&
    range.startFrame <= finding.startFrame &&
    range.endFrameExclusive >= finding.endFrameExclusive)
}

function lastDiagnosticMetric(
  diagnostic: string,
  expression: RegExp,
  label: string,
  allowNegativeInfinity = false,
): number | 'negative_infinity' {
  const matches = [...diagnostic.matchAll(expression)]
  const value = matches.at(-1)?.[1]
  if (!value) {
    throw unavailable(`Final-master ${label} metric is missing.`)
  }
  if (/^-inf$/iu.test(value) && allowNegativeInfinity) {
    return 'negative_infinity'
  }
  if (/^-?inf$/iu.test(value)) {
    throw unavailable(`Final-master ${label} metric is unsupported.`)
  }
  return strictFiniteNumber(value, label)
}

function secondsToNearestFrame(
  seconds: number,
  fps: number,
  totalFrames: number,
): number {
  return Math.min(totalFrames - 1, Math.max(0, Math.round(seconds * fps)))
}

function frameMd5Integer(value: string | undefined, label: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw unavailable(`Final-master ${label} is invalid.`)
  }
  return parsed
}

function strictNonNegativeNumber(value: unknown, label: string): number {
  const parsed = strictFiniteNumber(value, label)
  if (parsed < 0) throw unavailable(`Final-master ${label} is negative.`)
  return parsed
}

function strictFiniteNumber(value: unknown, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw unavailable(`Final-master ${label} is invalid.`)
  }
  return parsed
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? rounded(parsed) : undefined
}

function finalMasterQaTimeoutMs(request: OfflineFinalMasterQaRequest): number {
  const durationSeconds = request.payload.totalFrames / request.payload.fps
  const byteAllowance = Math.ceil(request.input.byteLength / (8 * 1024 * 1024)) * 5_000
  const decodeAllowance = Math.ceil(durationSeconds) * 3_000
  return Math.min(
    6 * 60 * 60_000,
    Math.max(
      DOCKER_CONTROL_TIMEOUT_MS,
      DOCKER_CONTROL_TIMEOUT_MS + byteAllowance + decodeAllowance,
    ),
  )
}

async function executeFfprobe(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult> {
  let request: OfflineFfprobeExecutionRequest
  try { request = validateOfflineFfprobeExecutionRequest(value) } catch {
    throw invalid('Structured FFprobe execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  return executeFfprobeRequest(image, request, verifiedBufferInput(
    sourceBytes,
    request.payload.sourceSha256,
  ))
}

async function executeFfprobeRequest(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFfprobeExecutionRequest | OfflineFfprobeStreamingExecutionRequest,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineFfprobeExecutionResult> {
  const command = ffprobeArguments(request)
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFPROBE_ENTRYPOINT, command)
    const started = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      4 * 1024 * 1024,
      mediaExecutionTimeoutMs(source.byteLength),
    )
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      started.exitCode !== 0 || started.stderr.length > 0 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || state.OOMKilled !== false
    ) throw unavailable('Confined FFprobe operation failed closed.')
    const document = normalizeProbe(started.stdout, request)
    const canonical = stableAuthorityStringify(document)
    const bytes = Buffer.from(canonical, 'utf8')
    const resultSha256 = sha256(bytes)
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffprobe' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      sourceSha256: request.payload.sourceSha256,
      resultSha256,
      confinement,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    return {
      resultJson: {
        mimeType: 'application/json', bytes, document,
        sha256: resultSha256, byteLength: bytes.byteLength,
      },
      evidence: {
        toolId: 'ffprobe', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue(redactedRequestEnvelope(request)),
        sourceSha256: request.payload.sourceSha256,
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          sourceDeliveryMode: source.inputMode,
          machineJsonOnly: true,
          durationAndSyncVerified: true,
          streamCount: Array.isArray(document.streams) ? document.streams.length : 0,
          frameCountsRequested: request.payload.countFrames,
        },
        confinement,
        containerExitCode: 0,
        oomKilled: false,
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function executeFfmpeg(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfmpegExecutionResult> {
  let request: OfflineFfmpegExecutionRequest
  try { request = validateOfflineFfmpegExecutionRequest(value) } catch {
    throw invalid('Structured FFmpeg execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  return executeFfmpegRequest(image, request, verifiedBufferInput(
    sourceBytes,
    request.payload.sourceSha256,
  ))
}

async function executeFfmpegRequest(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFfmpegExecutionRequest | OfflineFfmpegStreamingExecutionRequest,
  source: OfflineMediaBinaryServerInjectedInput,
): Promise<OfflineFfmpegExecutionResult>
async function executeFfmpegRequest(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFfmpegStreamingExecutionRequest,
  source: OfflineMediaBinaryServerInjectedInput,
  outputSink: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegStreamingOutputExecutionResult>
async function executeFfmpegRequest(
  image: OfflineMediaBinaryImageEvidence,
  request: OfflineFfmpegExecutionRequest | OfflineFfmpegStreamingExecutionRequest,
  source: OfflineMediaBinaryServerInjectedInput,
  outputSink?: OfflineMediaBinaryStreamingOutputSink,
): Promise<OfflineFfmpegExecutionResult | OfflineFfmpegStreamingOutputExecutionResult> {
  const voiceDelivery = request.payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
  const colorMatchDeliveryPayload = request.payload.recipeProfileId ===
    'approved_source_color_match_delivery_matroska_v1'
    ? request.payload
    : undefined
  const colorMatchDelivery = Boolean(colorMatchDeliveryPayload)
  const colorDeliveryPayload = request.payload.recipeProfileId ===
    'approved_source_color_delivery_matroska_v1'
    ? request.payload
    : colorMatchDeliveryPayload
  const colorDelivery = Boolean(colorDeliveryPayload)
  const voiceDeliveryPayload = request.payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
    ? request.payload
    : undefined
  const trimDurationFrames = request.payload.trimEndFrameExclusive - request.payload.trimStartFrame
  const referenceInput = colorMatchDelivery
    ? verifiedBufferInput(
        Buffer.from(colorMatchDeliveryPayload!.referenceSourceBytesBase64, 'base64'),
        colorMatchDeliveryPayload!.referenceSourceSha256,
      )
    : undefined
  const sourceColorAnalysis = colorDelivery
    ? await analyzeVideoColor({
        image,
        source,
        startFrame: request.payload.trimStartFrame,
        endFrameExclusive: request.payload.trimEndFrameExclusive,
        frameRate: request.payload.frameRate,
      })
    : undefined
  const referenceColorAnalysis = colorMatchDelivery
    ? await analyzeVideoColor({
        image,
        source: referenceInput!,
        startFrame: 0,
        endFrameExclusive: colorMatchDeliveryPayload!.referenceDurationFrames,
        frameRate: request.payload.frameRate,
      })
    : undefined
  const colorCorrection = sourceColorAnalysis && colorDeliveryPayload
    ? referenceColorAnalysis
      ? deriveReferenceMatchedColorCorrection(
          sourceColorAnalysis,
          referenceColorAnalysis,
          colorDeliveryPayload.colorGradeStyle,
          colorDeliveryPayload.intensity,
        )
      : deriveColorCorrection(sourceColorAnalysis, colorDeliveryPayload.colorGradeStyle,
          colorDeliveryPayload.intensity)
    : undefined
  const command = voiceDelivery
    ? voiceDeliveryCommand(request)
    : colorDelivery && colorCorrection
      ? colorDeliveryCommand(request, colorCorrection)
      : [
        '-hide_banner', '-loglevel', 'error', '-nostdin',
        '-i', 'pipe:0', '-map', '0:v:0',
        '-vf', `trim=start_frame=${request.payload.trimStartFrame}:end_frame=${request.payload.trimEndFrameExclusive},setpts=PTS-STARTPTS`,
        '-an', '-threads', '1', '-c:v', 'ffv1', '-level', '3', '-f', 'nut', 'pipe:1',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  let streamedOutputSpool: DockerVerifiedPrivateOutputSpool | undefined
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFMPEG_ENTRYPOINT, command)
    const calculatedTimeoutMs = mediaExecutionTimeoutMs(
      source.byteLength,
      trimDurationFrames,
      request.payload.frameRate,
    )
    const timeoutMs = outputSink
      ? Math.max(calculatedTimeoutMs, 5 * 60_000)
      : calculatedTimeoutMs
    const bufferedOutput = outputSink
      ? undefined
      : await dockerVerifiedInput(
          ['start', '--attach', '--interactive', container.id],
          source,
          OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES,
          timeoutMs,
        )
    if (outputSink) {
      streamedOutputSpool = await dockerVerifiedInputToPrivateOutputSpool({
        args: ['start', '--attach', '--interactive', container.id],
        input: source,
        maximumOutputBytes: outputSink.maximumBytes,
        expectedFormat: voiceDelivery ? 'wav' : 'mkv',
        timeoutMs,
      })
    }
    const outputByteLength = streamedOutputSpool?.byteLength ?? bufferedOutput!.stdout.byteLength
    const resultSha256 = streamedOutputSpool?.sha256 ?? sha256(bufferedOutput!.stdout)
    const outputSignature = streamedOutputSpool?.signature ?? bufferedOutput!.stdout.subarray(0, 25)
    const outputInput = streamedOutputSpool?.source ?? verifiedBufferInput(
      bufferedOutput!.stdout,
      resultSha256,
    )
    const exitCode = streamedOutputSpool?.exitCode ?? bufferedOutput!.exitCode
    const stderr = streamedOutputSpool?.stderr ?? bufferedOutput!.stderr
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      exitCode !== 0 || stderr.length > 0 || outputByteLength < 64 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== exitCode || state.OOMKilled !== false
    ) throw unavailable(
      'Confined FFmpeg operation failed closed ' +
      `(exit=${exitCode};stderrBytes=${stderr.length};` +
      `stdoutBytes=${outputByteLength};state=${String(state.Status)};` +
      `stateExit=${String(state.ExitCode)};oomKilled=${String(state.OOMKilled)};` +
      `diagnostic=${safeFfmpegDiagnostic(stderr)}).`,
    )
    const wave = voiceDelivery
      ? streamedOutputSpool
        ? inspectPcmWavePrefix(streamedOutputSpool.signature, outputByteLength)
        : pcmWaveDetails(bufferedOutput!.stdout)
      : undefined
    if (voiceDelivery ? !wave : colorDelivery
      ? !isMatroska(outputSignature)
      : !outputSignature.toString('ascii').includes('nut/multimedia')) {
      throw unavailable(voiceDelivery
        ? 'FFmpeg voice-delivery output is not the fixed PCM WAV artifact.'
        : colorDelivery
          ? 'FFmpeg professional color output is not the fixed Matroska intermediate container.'
          : 'FFmpeg output is not the fixed NUT intermediate container.')
    }
    const outputProbe = voiceDelivery
      ? await probeFfmpegVoiceDeliveryOutput(
          image,
          outputInput,
          wave!,
          trimDurationFrames / request.payload.frameRate,
        )
      : await probeFfmpegOutput(
          image,
          outputInput,
          trimDurationFrames,
          request.payload.frameRate,
          colorDelivery,
        )
    const outputColorAnalysis = colorDelivery
      ? await analyzeVideoColor({
          image,
          source: outputInput,
          startFrame: 0,
          endFrameExclusive: trimDurationFrames,
          frameRate: request.payload.frameRate,
        })
      : undefined
    const colorMatchQa = colorMatchDelivery && sourceColorAnalysis &&
      outputColorAnalysis && referenceColorAnalysis
      ? evaluateReferenceColorMatch({
          source: sourceColorAnalysis,
          output: outputColorAnalysis,
          reference: referenceColorAnalysis,
        })
      : undefined
    if (
      colorDelivery && (
        !sourceColorAnalysis || !outputColorAnalysis || !colorCorrection ||
        outputColorAnalysis.sampledFrameCount !== sourceColorAnalysis.sampledFrameCount ||
        outputColorAnalysis.meanLuma <= 8 || outputColorAnalysis.meanLuma >= 247 ||
        outputColorAnalysis.blackLumaFraction >= 0.98 ||
        outputColorAnalysis.whiteLumaFraction >= 0.98 ||
        resultSha256 === request.payload.sourceSha256 ||
        (colorMatchDelivery && (!colorMatchQa || !colorMatchQa.passed))
      )
    ) throw unavailable(
      'FFmpeg professional color output failed bounded pixel QA ' +
      `(source=${JSON.stringify(sourceColorAnalysis)};` +
      `output=${JSON.stringify(outputColorAnalysis)};` +
      `reference=${JSON.stringify(referenceColorAnalysis)};` +
      `match=${JSON.stringify(colorMatchQa)}).`,
    )
    if (outputSink) {
      const persisted = await outputSink.persist({
        stream: await outputInput.openStream(),
        mimeType: voiceDelivery ? 'audio/wav' : 'video/x-matroska',
        expectedByteLength: outputByteLength,
        expectedSha256: resultSha256,
      })
      if (
        persisted.byteLength !== outputByteLength || persisted.sha256 !== resultSha256
      ) throw unavailable('Streaming FFmpeg output sink changed the exact artifact commitment.')
    }
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt, imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      sourceSha256: request.payload.sourceSha256,
      ...(colorMatchDelivery
        ? { referenceSourceSha256: colorMatchDeliveryPayload!.referenceSourceSha256 }
        : {}),
      resultSha256, confinement, outputProbe,
      outputTransport: outputSink
        ? 'server_committed_private_stream_v1' as const
        : 'bounded_legacy_buffer_v1' as const,
      ...(colorMatchQa ? { colorMatchQa } : {}),
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    const evidence: OfflineFfmpegExecutionResult['evidence'] = {
        toolId: 'ffmpeg', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue(redactedRequestEnvelope(request)),
        sourceSha256: request.payload.sourceSha256,
        ...(colorMatchDelivery
          ? { referenceSourceSha256: colorMatchDeliveryPayload!.referenceSourceSha256 }
          : {}),
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          sourceDeliveryMode: source.inputMode,
          fixedRecipeExecuted: true,
          recipeProfileId: request.payload.recipeProfileId,
          trimStartFrame: request.payload.trimStartFrame,
          trimEndFrameExclusive: request.payload.trimEndFrameExclusive,
          ...(voiceDelivery
            ? {
                outputContainer: 'wav', outputAudioCodec: 'pcm_s16le',
                outputSampleRate: 48_000, outputChannels: 2,
                highpassApplied: true, gentleCompressionApplied: true,
                loudnessNormalizationApplied: true, truePeakLimiterApplied: true,
                targetLufs: voiceDeliveryPayload!.targetLufs,
                truePeakDbtp: voiceDeliveryPayload!.truePeakDbtp,
                sourceVideoRemoved: true,
                outputDeliveryMode: outputSink
                  ? 'server_committed_private_stream_v1'
                  : 'bounded_legacy_buffer_v1',
                outputWholeBufferAvoided: Boolean(outputSink),
              }
            : colorDelivery
              ? {
                  outputFrameCount: trimDurationFrames,
                  outputContainer: 'matroska', outputVideoCodec: 'vp9', audioRemoved: true,
                  colorGradeStyle: colorDeliveryPayload!.colorGradeStyle,
                  colorIntensity: colorDeliveryPayload!.intensity,
                  approvedColorOperationIds:
                    colorDeliveryPayload!.approvedColorOperationIds,
                  approvedColorOperationKinds:
                    colorDeliveryPayload!.approvedColorOperationKinds,
                  sourcePixelAnalysisExecuted: true,
                  sourcePixelAnalysis: sourceColorAnalysis,
                  ...(colorMatchDelivery
                    ? {
                        referenceSourceSequenceItemId:
                          colorMatchDeliveryPayload!.referenceSourceSequenceItemId,
                        referenceOutputKey: colorMatchDeliveryPayload!.referenceOutputKey,
                        referenceSourceSha256:
                          colorMatchDeliveryPayload!.referenceSourceSha256,
                        referencePixelAnalysisExecuted: true,
                        referencePixelAnalysis: referenceColorAnalysis,
                        shotMatchProfileId: colorMatchDeliveryPayload!.shotMatchProfileId,
                        referenceMatchQa: colorMatchQa,
                        referenceBoundShotMatchingApplied: true,
                      }
                    : {}),
                  derivedCorrection: colorCorrection,
                  outputPixelAnalysisExecuted: true,
                  outputPixelAnalysis: outputColorAnalysis,
                  boundedAutoExposureApplied: true,
                  boundedWhiteBalanceApplied: true,
                  plannedLookApplied: true,
                  lgplColorChannelMixerApplied: true,
                  lgplColorLevelsApplied: true,
                  lgplClarityFilterApplied: colorCorrection!.clarityApplied,
                  clippingProtectionVerified: true,
                  histogramQaPassed: true,
                  outputColorSpace: 'bt709',
                  outputPixelFormat: 'yuv420p',
                  outputDeliveryMode: outputSink
                    ? 'server_committed_private_stream_v1'
                    : 'bounded_legacy_buffer_v1',
                  outputWholeBufferAvoided: Boolean(outputSink),
                }
              : {
                outputFrameCount: trimDurationFrames,
                outputContainer: 'nut', outputVideoCodec: 'ffv1', audioRemoved: true,
              }),
          outputProbeVerified: true,
        },
        confinement, containerExitCode: 0, oomKilled: false,
    }
    const common = {
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true as const,
        productReady: false as const,
        externalBetaReady: false as const,
        productionReady: false as const,
      },
    }
    if (outputSink) {
      return {
        resultArtifact: {
          mimeType: voiceDelivery ? 'audio/wav' : 'video/x-matroska',
          sha256: resultSha256,
          byteLength: outputByteLength,
          outputMode: 'server_committed_private_stream_v1',
        },
        evidence: {
          ...evidence,
          outputTransport: 'server_committed_private_stream_v1',
        },
        ...common,
      }
    }
    return {
      resultArtifact: {
        mimeType: voiceDelivery
          ? 'audio/wav'
          : colorDelivery
            ? 'video/x-matroska'
            : 'video/x-nut',
        bytes: bufferedOutput!.stdout,
        sha256: resultSha256,
        byteLength: outputByteLength,
      },
      evidence,
      ...common,
    }
  } finally {
    await streamedOutputSpool?.cleanup().catch(() => undefined)
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

function voiceDeliveryCommand(
  request: OfflineFfmpegExecutionRequest | OfflineFfmpegStreamingExecutionRequest,
): string[] {
  if (request.payload.recipeProfileId !== 'approved_voice_delivery_wav_v1') {
    throw invalid('Voice-delivery command requires its exact approved recipe.')
  }
  const startSeconds = (request.payload.trimStartFrame / request.payload.frameRate).toFixed(9)
  const endSeconds = (request.payload.trimEndFrameExclusive / request.payload.frameRate).toFixed(9)
  const filters = [
    `atrim=start=${startSeconds}:end=${endSeconds}`,
    'asetpts=PTS-STARTPTS',
    `highpass=f=${request.payload.highpassHz}`,
    'acompressor=threshold=0.125:ratio=2:attack=20:release=250:makeup=1.5',
    `loudnorm=I=${request.payload.targetLufs}:LRA=${request.payload.loudnessRangeLufs}:TP=${request.payload.truePeakDbtp}:linear=true`,
    'alimiter=limit=0.891251:attack=5:release=50',
    'aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo',
  ].join(',')
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:a:0', '-vn', '-af', filters,
    '-ar', '48000', '-ac', '2', '-threads', '1',
    '-c:a', 'pcm_s16le', '-f', 'wav', 'pipe:1',
  ]
}

type ColorPixelAnalysis = OfflineColorPixelAnalysis

type DerivedColorCorrection = {
  redMultiplier: number
  greenMultiplier: number
  blueMultiplier: number
  contrast: number
  saturation: number
  channelSpread: number
  exposureProtectionFactor: number
  exposureShift: number
  inputBlackPoint: number
  inputWhitePoint: number
  outputBlackPoint: number
  outputWhitePoint: number
  clarityApplied: boolean
}

type ReferenceColorMatchQa = {
  sourceLumaDelta: number
  outputLumaDelta: number
  maximumLumaDelta: number
  sourceChromaticityDelta: number
  outputChromaticityDelta: number
  maximumChromaticityDelta: number
  lumaPreservedOrImproved: boolean
  chromaticityPreservedOrImproved: boolean
  passed: boolean
}

async function analyzeVideoColor(input: {
  image: OfflineMediaBinaryImageEvidence
  source: OfflineMediaBinaryServerInjectedInput
  startFrame: number
  endFrameExclusive: number
  frameRate: number
}): Promise<ColorPixelAnalysis> {
  return (await analyzeVideoColorWithConfinement(input)).analysis
}

async function analyzeVideoColorWithConfinement(input: {
  image: OfflineMediaBinaryImageEvidence
  source: OfflineMediaBinaryServerInjectedInput
  startFrame: number
  endFrameExclusive: number
  frameRate: number
}): Promise<{
  analysis: ColorPixelAnalysis
  confinement: OfflineMediaBinaryConfinementEvidence
}> {
  const finalFrame = input.endFrameExclusive - 1
  const middleFrame = input.startFrame + Math.floor(
    (input.endFrameExclusive - input.startFrame - 1) / 2,
  )
  const selectedFrames = [...new Set([input.startFrame, middleFrame, finalFrame])]
  const expression = selectedFrames.map((frame) => `eq(n\\,${frame})`).join('+')
  const command = [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:v:0',
    '-vf', `select=${expression},scale=64:64:flags=area,format=rgb24`,
    '-fps_mode', 'passthrough', '-frames:v', String(selectedFrames.length),
    '-threads', '1', '-f', 'rawvideo', 'pipe:1',
  ]
  const container = await createContainer(input.image, FFMPEG_ENTRYPOINT, command)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      input.image,
      FFMPEG_ENTRYPOINT,
      command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      input.source,
      256 * 1024,
      mediaExecutionTimeoutMs(
        input.source.byteLength,
        input.endFrameExclusive - input.startFrame,
        input.frameRate,
      ),
    )
    const expectedBytes = selectedFrames.length * 64 * 64 * 3
    if (
      result.exitCode !== 0 || result.stderr.length > 0 ||
      result.stdout.byteLength !== expectedBytes
    ) throw unavailable('FFmpeg source color analysis failed closed.')
    return {
      analysis: colorPixelAnalysis(result.stdout, selectedFrames.length),
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

function colorPixelAnalysis(bytes: Buffer, sampledFrameCount: number): ColorPixelAnalysis {
  let red = 0
  let green = 0
  let blue = 0
  let luma = 0
  let minimumLuma = 255
  let maximumLuma = 0
  let blackPixels = 0
  let whitePixels = 0
  const pixelCount = bytes.byteLength / 3
  for (let offset = 0; offset < bytes.byteLength; offset += 3) {
    const r = bytes[offset]!
    const g = bytes[offset + 1]!
    const b = bytes[offset + 2]!
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    red += r
    green += g
    blue += b
    luma += y
    minimumLuma = Math.min(minimumLuma, y)
    maximumLuma = Math.max(maximumLuma, y)
    if (y <= 8) blackPixels += 1
    if (y >= 247) whitePixels += 1
  }
  return {
    sampledFrameCount,
    sampledPixelCount: pixelCount,
    meanRed: roundedTo(red / pixelCount, 4),
    meanGreen: roundedTo(green / pixelCount, 4),
    meanBlue: roundedTo(blue / pixelCount, 4),
    meanLuma: roundedTo(luma / pixelCount, 4),
    minimumLuma: roundedTo(minimumLuma, 4),
    maximumLuma: roundedTo(maximumLuma, 4),
    blackLumaFraction: roundedTo(blackPixels / pixelCount, 6),
    whiteLumaFraction: roundedTo(whitePixels / pixelCount, 6),
  }
}

function deriveColorCorrection(
  analysis: ColorPixelAnalysis,
  style: 'clean_natural' | 'premium_clean',
  intensity: 'subtle' | 'balanced',
): DerivedColorCorrection {
  const neutralMean = (analysis.meanRed + analysis.meanGreen + analysis.meanBlue) / 3
  const channelMultiplier = (channel: number) => clamp(
    neutralMean / Math.max(16, channel),
    0.94,
    1.06,
  )
  const targetLuma = style === 'premium_clean' ? 132 : 128
  const intensityOffset = intensity === 'balanced' ? 0.01 : 0
  const contrast = style === 'premium_clean' ? 1.04 + intensityOffset : 1.025
  const channelSpread = Math.max(analysis.meanRed, analysis.meanGreen, analysis.meanBlue) -
    Math.min(analysis.meanRed, analysis.meanGreen, analysis.meanBlue)
  const exposureProtectionFactor = clamp(1 - channelSpread / 192, 0.1, 1)
  const exposureShift = clamp((targetLuma - analysis.meanLuma) / 255, -0.06, 0.06) *
    exposureProtectionFactor
  const halfInputRange = 0.5 / contrast
  const baseInputBlackPoint = 0.5 - halfInputRange
  const baseInputWhitePoint = 0.5 + halfInputRange
  return {
    redMultiplier: roundedTo(channelMultiplier(analysis.meanRed), 5),
    greenMultiplier: roundedTo(channelMultiplier(analysis.meanGreen), 5),
    blueMultiplier: roundedTo(channelMultiplier(analysis.meanBlue), 5),
    contrast: roundedTo(contrast, 5),
    saturation: roundedTo(style === 'premium_clean' ? 1.04 + intensityOffset : 1.02, 5),
    channelSpread: roundedTo(channelSpread, 4),
    exposureProtectionFactor: roundedTo(exposureProtectionFactor, 5),
    exposureShift: roundedTo(exposureShift, 5),
    inputBlackPoint: roundedTo(clamp(
      baseInputBlackPoint - exposureShift / 2,
      0,
      0.08,
    ), 5),
    inputWhitePoint: roundedTo(clamp(
      baseInputWhitePoint - exposureShift / 2,
      0.9,
      1,
    ), 5),
    outputBlackPoint: roundedTo(clamp(Math.max(0, exposureShift) * 0.25, 0, 0.02), 5),
    outputWhitePoint: roundedTo(clamp(
      (style === 'premium_clean' ? 0.985 : 0.99) + Math.min(0, exposureShift) * 0.25,
      0.96,
      0.995,
    ), 5),
    clarityApplied: style === 'premium_clean',
  }
}

function deriveReferenceMatchedColorCorrection(
  analysis: ColorPixelAnalysis,
  reference: ColorPixelAnalysis,
  style: 'clean_natural' | 'premium_clean',
  intensity: 'subtle' | 'balanced',
): DerivedColorCorrection {
  const base = deriveColorCorrection(analysis, style, intensity)
  const sourceMean = Math.max(
    16,
    (analysis.meanRed + analysis.meanGreen + analysis.meanBlue) / 3,
  )
  const referenceMean = Math.max(
    16,
    (reference.meanRed + reference.meanGreen + reference.meanBlue) / 3,
  )
  const matchedMultiplier = (
    sourceChannel: number,
    referenceChannel: number,
    baseMultiplier: number,
  ) => {
    const sourceRatio = sourceChannel / sourceMean
    const referenceRatio = referenceChannel / referenceMean
    const referenceBound = clamp(referenceRatio / Math.max(0.25, sourceRatio), 0.88, 1.12)
    return roundedTo(clamp(
      baseMultiplier + (referenceBound - baseMultiplier) * 0.75,
      0.88,
      1.12,
    ), 5)
  }
  const exposureProtectionFactor = Math.min(
    base.exposureProtectionFactor,
    clamp(1 - Math.abs(reference.meanLuma - analysis.meanLuma) / 192, 0.2, 1),
  )
  const exposureShift = clamp(
    (reference.meanLuma - analysis.meanLuma) / 255,
    -0.08,
    0.08,
  ) * exposureProtectionFactor
  const halfInputRange = 0.5 / base.contrast
  const baseInputBlackPoint = 0.5 - halfInputRange
  const baseInputWhitePoint = 0.5 + halfInputRange
  return {
    ...base,
    redMultiplier: matchedMultiplier(
      analysis.meanRed,
      reference.meanRed,
      base.redMultiplier,
    ),
    greenMultiplier: matchedMultiplier(
      analysis.meanGreen,
      reference.meanGreen,
      base.greenMultiplier,
    ),
    blueMultiplier: matchedMultiplier(
      analysis.meanBlue,
      reference.meanBlue,
      base.blueMultiplier,
    ),
    exposureProtectionFactor: roundedTo(exposureProtectionFactor, 5),
    exposureShift: roundedTo(exposureShift, 5),
    inputBlackPoint: roundedTo(clamp(
      baseInputBlackPoint - exposureShift / 2,
      0,
      0.1,
    ), 5),
    inputWhitePoint: roundedTo(clamp(
      baseInputWhitePoint - exposureShift / 2,
      0.88,
      1,
    ), 5),
    outputBlackPoint: roundedTo(clamp(Math.max(0, exposureShift) * 0.25, 0, 0.025), 5),
    outputWhitePoint: roundedTo(clamp(
      (style === 'premium_clean' ? 0.985 : 0.99) + Math.min(0, exposureShift) * 0.25,
      0.95,
      0.995,
    ), 5),
  }
}

function evaluateReferenceColorMatch(input: {
  source: ColorPixelAnalysis
  output: ColorPixelAnalysis
  reference: ColorPixelAnalysis
}): ReferenceColorMatchQa {
  const chromaticity = (analysis: ColorPixelAnalysis) => {
    const total = Math.max(1, analysis.meanRed + analysis.meanGreen + analysis.meanBlue)
    return [analysis.meanRed / total, analysis.meanGreen / total, analysis.meanBlue / total]
  }
  const referenceChromaticity = chromaticity(input.reference)
  const chromaticityDelta = (analysis: ColorPixelAnalysis) =>
    chromaticity(analysis).reduce((total, value, index) =>
      total + Math.abs(value - referenceChromaticity[index]!), 0)
  const sourceLumaDelta = Math.abs(input.source.meanLuma - input.reference.meanLuma)
  const outputLumaDelta = Math.abs(input.output.meanLuma - input.reference.meanLuma)
  const sourceChromaticityDelta = chromaticityDelta(input.source)
  const outputChromaticityDelta = chromaticityDelta(input.output)
  const maximumLumaDelta = 36
  const maximumChromaticityDelta = 0.12
  const lumaPreservedOrImproved = outputLumaDelta <= sourceLumaDelta + 6
  const chromaticityPreservedOrImproved =
    outputChromaticityDelta <= sourceChromaticityDelta + 0.03
  const passed = outputLumaDelta <= maximumLumaDelta &&
    outputChromaticityDelta <= maximumChromaticityDelta &&
    lumaPreservedOrImproved && chromaticityPreservedOrImproved
  return {
    sourceLumaDelta: roundedTo(sourceLumaDelta, 4),
    outputLumaDelta: roundedTo(outputLumaDelta, 4),
    maximumLumaDelta,
    sourceChromaticityDelta: roundedTo(sourceChromaticityDelta, 6),
    outputChromaticityDelta: roundedTo(outputChromaticityDelta, 6),
    maximumChromaticityDelta,
    lumaPreservedOrImproved,
    chromaticityPreservedOrImproved,
    passed,
  }
}

function colorDeliveryCommand(
  request: OfflineFfmpegExecutionRequest | OfflineFfmpegStreamingExecutionRequest,
  correction: DerivedColorCorrection,
): string[] {
  if (
    request.payload.recipeProfileId !== 'approved_source_color_delivery_matroska_v1' &&
    request.payload.recipeProfileId !== 'approved_source_color_match_delivery_matroska_v1'
  ) {
    throw invalid('Color-delivery command requires its exact approved recipe.')
  }
  const saturationMatrix = colorSaturationMatrix(correction.saturation)
  const filters = [
    `trim=start_frame=${request.payload.trimStartFrame}:end_frame=${request.payload.trimEndFrameExclusive}`,
    'setpts=PTS-STARTPTS',
    `colorchannelmixer=rr=${correction.redMultiplier}:gg=${correction.greenMultiplier}:bb=${correction.blueMultiplier}:pc=lum:pa=0.75`,
    `colorchannelmixer=${saturationMatrix}`,
    'colorlevels=' + [
      `rimin=${correction.inputBlackPoint}`,
      `gimin=${correction.inputBlackPoint}`,
      `bimin=${correction.inputBlackPoint}`,
      `rimax=${correction.inputWhitePoint}`,
      `gimax=${correction.inputWhitePoint}`,
      `bimax=${correction.inputWhitePoint}`,
      `romin=${correction.outputBlackPoint}`,
      `gomin=${correction.outputBlackPoint}`,
      `bomin=${correction.outputBlackPoint}`,
      `romax=${correction.outputWhitePoint}`,
      `gomax=${correction.outputWhitePoint}`,
      `bomax=${correction.outputWhitePoint}`,
      'preserve=lum',
    ].join(':'),
    ...(correction.clarityApplied ? ['unsharp=5:5:0.35:3:3:0'] : []),
    'format=yuv420p',
    'setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709',
  ].join(',')
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:v:0', '-vf', filters,
    '-an', '-threads', '1', '-c:v', 'libvpx-vp9',
    '-lossless', '1', '-deadline', 'good', '-cpu-used', '2',
    '-row-mt', '0', '-auto-alt-ref', '0', '-lag-in-frames', '0',
    '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', '-color_range', 'tv',
    '-fflags', '+bitexact', '-flags:v', '+bitexact', '-map_metadata', '-1',
    '-metadata', 'creation_time=1970-01-01T00:00:00Z',
    '-f', 'matroska', 'pipe:1',
  ]
}

function isMatroska(bytes: Buffer): boolean {
  return bytes.byteLength >= 4 &&
    bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
}

function isMp4(bytes: Buffer): boolean {
  return bytes.byteLength >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp'
}

function isFlac(bytes: Buffer): boolean {
  return bytes.byteLength >= 4 && bytes.subarray(0, 4).toString('ascii') === 'fLaC'
}

function safeFfmpegDiagnostic(stderr: Buffer): string {
  const normalized = stderr.toString('utf8')
    .replace(/0x[0-9a-f]+/gi, '0x[redacted]')
    .replace(/[^\x20-\x7e]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return JSON.stringify(normalized.slice(0, 600))
}

function colorSaturationMatrix(saturation: number): string {
  const inverse = 1 - saturation
  const red = 0.2126 * inverse
  const green = 0.7152 * inverse
  const blue = 0.0722 * inverse
  return [
    `rr=${roundedTo(red + saturation, 6)}`,
    `rg=${roundedTo(green, 6)}`,
    `rb=${roundedTo(blue, 6)}`,
    `gr=${roundedTo(red, 6)}`,
    `gg=${roundedTo(green + saturation, 6)}`,
    `gb=${roundedTo(blue, 6)}`,
    `br=${roundedTo(red, 6)}`,
    `bg=${roundedTo(green, 6)}`,
    `bb=${roundedTo(blue + saturation, 6)}`,
  ].join(':')
}

function pcmWaveDetails(bytes: Buffer): {
  sampleRate: number
  channels: number
  bitsPerSample: number
  sampleFrameCount: number
  durationSeconds: number
} | undefined {
  const details = inspectPcmWavePrefix(
    bytes.subarray(0, PCM_WAVE_MAXIMUM_HEADER_BYTES),
    bytes.byteLength,
  )
  if (!details || ![1, 2].includes(details.channels)) return undefined
  return {
    sampleRate: details.sampleRate,
    channels: details.channels,
    bitsPerSample: details.bitsPerSample,
    sampleFrameCount: details.sampleFrameCount,
    durationSeconds: details.durationSeconds,
  }
}

async function probeObjectMezzanineChunkOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  request: OfflineMediaBinaryObjectMezzanineChunkRequest,
): Promise<Record<string, unknown>> {
  return (await probePrivateVp9ObjectChunk(image, source, {
    width: request.payload.width,
    height: request.payload.height,
    fps: request.payload.fps,
    frameCount: request.payload.durationFrames,
    countFrames: true,
  })).probe
}

async function probeLongFormMasterOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-show_entries',
    'format=format_name,start_time,duration,size:stream=codec_name,codec_type,start_time,width,height,avg_frame_rate,pix_fmt,color_range,color_space,color_transfer,color_primaries,sample_rate,channels,channel_layout,duration,nb_read_frames',
    '-count_frames', '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(
      await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id], source,
      2 * 1024 * 1024, LONG_FORM_MASTER_ASSEMBLY_TIMEOUT_MS,
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('Long-form master output probe failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const videos = streams.filter((stream) => stream.codec_type === 'video')
    const audios = streams.filter((stream) => stream.codec_type === 'audio')
    const video = videos[0]
    const audio = audios[0]
    const expectedDuration = request.payload.totalFrames / request.payload.fps
    const countedFrames = optionalInteger(video?.nb_read_frames)
    const containerDuration = optionalNumber(format.duration)
    const videoDuration = optionalNumber(video?.duration)
    const actualDuration = containerDuration ?? videoDuration ??
      (countedFrames === undefined ? undefined : countedFrames / request.payload.fps)
    const durationAuthority = containerDuration !== undefined
      ? 'matroska_container_duration_v1'
      : videoDuration !== undefined
        ? 'vp9_stream_duration_v1'
        : 'exact_counted_video_frames_v1'
    const tolerance = 1 / request.payload.fps + 0.001
    if (
      videos.length !== 1 || audios.length !== 1 || !video || !audio ||
      video.codec_name !== 'vp9' || audio.codec_name !== 'flac' ||
      !String(format.format_name ?? '').includes('matroska') ||
      optionalInteger(video.width) !== request.payload.width ||
      optionalInteger(video.height) !== request.payload.height ||
      rational(video.avg_frame_rate) !== 30 || video.pix_fmt !== 'yuv420p' ||
      countedFrames !== request.payload.totalFrames ||
      video.color_range !== 'tv' || video.color_space !== 'bt709' ||
      video.color_transfer !== 'bt709' || video.color_primaries !== 'bt709' ||
      optionalInteger(audio.sample_rate) !== 48_000 ||
      optionalInteger(audio.channels) !== 2 ||
      actualDuration === undefined || Math.abs(actualDuration - expectedDuration) > tolerance
    ) throw unavailable(
      'Long-form master failed VP9, FLAC, 4K, color, frame-rate, or duration verification.',
      {
        videoCount: videos.length,
        audioCount: audios.length,
        formatName: safeText(format.format_name),
        videoCodec: safeText(video?.codec_name),
        audioCodec: safeText(audio?.codec_name),
        width: optionalInteger(video?.width),
        height: optionalInteger(video?.height),
        frameRate: rational(video?.avg_frame_rate),
        pixelFormat: safeText(video?.pix_fmt),
        frameCount: optionalInteger(video?.nb_read_frames),
        colorRange: safeText(video?.color_range),
        colorSpace: safeText(video?.color_space),
        colorTransfer: safeText(video?.color_transfer),
        colorPrimaries: safeText(video?.color_primaries),
        sampleRate: optionalInteger(audio?.sample_rate),
        channels: optionalInteger(audio?.channels),
        actualDuration,
        containerDuration,
        videoDuration,
        audioDuration: optionalNumber(audio?.duration),
        durationAuthority,
        expectedDuration: rounded(expectedDuration),
        tolerance: rounded(tolerance),
      },
    )
    return {
      container: 'matroska', videoCodec: 'vp9_stream_copy',
      audioCodec: 'flac_stream_copy', width: request.payload.width,
      height: request.payload.height, frameRate: 30, sampleRate: 48_000,
      frameCount: request.payload.totalFrames,
      channels: 2, colorRange: 'tv', colorSpace: 'bt709',
      colorTransfer: 'bt709', colorPrimaries: 'bt709',
      expectedDurationSeconds: rounded(expectedDuration),
      actualDurationSeconds: actualDuration,
      durationAuthority,
      maximumDurationDriftSeconds: rounded(tolerance),
      sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function probePrivateVp9ObjectChunk(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  expectation: {
    width: number
    height: number
    fps: number
    frameCount: number
    countFrames: boolean
  },
): Promise<{
  probe: Record<string, unknown>
  confinement: OfflineMediaBinaryConfinementEvidence
}> {
  const command = [
    '-v', 'error',
    ...(expectation.countFrames ? ['-count_frames'] : []),
    '-show_entries',
    'format=format_name,start_time,duration,size:stream=codec_name,codec_type,start_time,width,height,avg_frame_rate,nb_read_frames,pix_fmt,color_range,color_space,color_transfer,color_primaries,has_b_frames',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      FFPROBE_ENTRYPOINT,
      command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      mediaExecutionTimeoutMs(source.byteLength),
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('Object-mezzanine output verification failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const videos = streams.filter((stream) => stream.codec_type === 'video')
    const audios = streams.filter((stream) => stream.codec_type === 'audio')
    const video = videos[0]
    const actualDurationSeconds = optionalNumber(format.duration)
    const approvedDurationSeconds =
      expectation.frameCount / expectation.fps
    const maximumDurationDriftSeconds = 1 / expectation.fps + 0.001
    const formatStartSeconds = optionalNumber(format.start_time)
    const videoStartSeconds = optionalNumber(video?.start_time)
    if (
      videos.length !== 1 || audios.length !== 0 || !video ||
      video.codec_name !== 'vp9' ||
      !String(format.format_name ?? '').includes('matroska') ||
      optionalInteger(video.width) !== expectation.width ||
      optionalInteger(video.height) !== expectation.height ||
      video.pix_fmt !== 'yuv420p' || video.color_range !== 'tv' ||
      video.color_space !== 'bt709' || video.color_transfer !== 'bt709' ||
      video.color_primaries !== 'bt709' ||
      rational(video.avg_frame_rate) !== expectation.fps ||
      (expectation.countFrames &&
        optionalInteger(video.nb_read_frames) !== expectation.frameCount) ||
      optionalInteger(video.has_b_frames) !== 0 ||
      formatStartSeconds === undefined || formatStartSeconds < 0 ||
      formatStartSeconds > maximumDurationDriftSeconds ||
      videoStartSeconds === undefined || videoStartSeconds < 0 ||
      videoStartSeconds > maximumDurationDriftSeconds ||
      actualDurationSeconds === undefined ||
      Math.abs(actualDurationSeconds - approvedDurationSeconds) >
        maximumDurationDriftSeconds
    ) throw unavailable(
      'Object-mezzanine output failed Matroska, VP9, frame, color, timestamp, or duration verification.',
    )
    return {
      probe: {
        container: 'matroska',
        videoCodec: 'vp9',
        videoCodecOperation: 'cq12_encode',
        audioStreamCount: 0,
        width: expectation.width,
        height: expectation.height,
        frameRate: expectation.fps,
        frameCount: expectation.frameCount,
        exactFrameCountRecounted: expectation.countFrames,
        priorIndependentFrameQaRequired: !expectation.countFrames,
        pixelFormat: 'yuv420p',
        colorRange: 'tv',
        colorSpace: 'bt709',
        colorTransfer: 'bt709',
        colorPrimaries: 'bt709',
        formatStartSeconds,
        videoStartSeconds,
        approvedDurationSeconds: rounded(approvedDurationSeconds),
        actualDurationSeconds,
        maximumDurationDriftSeconds: rounded(maximumDurationDriftSeconds),
        sizeBytes: optionalInteger(format.size),
      },
      confinement,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function probeContinuousProgramAudioOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  request: OfflineMediaBinaryContinuousProgramAudioRequest,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-count_frames', '-show_entries',
    'format=format_name,start_time,duration,size:stream=codec_name,codec_type,start_time,sample_rate,channels,channel_layout,sample_fmt,bits_per_raw_sample,time_base,duration_ts,nb_read_frames',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(
      await inspectContainer(container.id),
      image,
      FFPROBE_ENTRYPOINT,
      command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      CONTINUOUS_PROGRAM_AUDIO_TIMEOUT_MS,
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('Continuous program-audio output verification failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const audios = streams.filter((stream) => stream.codec_type === 'audio')
    const audio = audios[0]
    const expectedSamples = request.payload.totalFrames *
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLES_PER_FRAME
    const approvedDurationSeconds =
      request.payload.totalFrames / request.payload.frameRateNumerator
    const maximumDurationDriftSeconds =
      1 / OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE
    const formatStartSeconds = optionalNumber(format.start_time)
    const audioStartSeconds = optionalNumber(audio?.start_time)
    const headerDurationSeconds = optionalNumber(format.duration)
    const headerDurationSamples = optionalInteger(audio?.duration_ts)
    const headerSizeBytes = optionalInteger(format.size)
    const metadataReadFrameCount = optionalInteger(audio?.nb_read_frames)
    if (
      streams.length !== 1 || audios.length !== 1 || !audio ||
      audio.codec_name !== 'flac' ||
      !String(format.format_name ?? '').split(',').includes('flac') ||
      optionalInteger(audio.sample_rate) !==
        OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE ||
      optionalInteger(audio.channels) !== 2 ||
      audio.channel_layout !== 'stereo' || audio.sample_fmt !== 's32' ||
      optionalInteger(audio.bits_per_raw_sample) !== 24 ||
      audio.time_base !== '1/48000' ||
      metadataReadFrameCount === undefined || metadataReadFrameCount < 1 ||
      (headerDurationSamples !== undefined &&
        headerDurationSamples !== expectedSamples) ||
      formatStartSeconds === undefined ||
      Math.abs(formatStartSeconds) > maximumDurationDriftSeconds ||
      audioStartSeconds === undefined ||
      Math.abs(audioStartSeconds) > maximumDurationDriftSeconds ||
      (headerDurationSeconds !== undefined &&
        Math.abs(headerDurationSeconds - approvedDurationSeconds) >
          maximumDurationDriftSeconds) ||
      (headerSizeBytes !== undefined && headerSizeBytes !== source.byteLength)
    ) throw unavailable(
      'Continuous program-audio output failed FLAC, stream, sample, timestamp, or duration verification.',
      {
        formatName: format.format_name,
        formatStartSeconds,
        headerDurationSeconds,
        headerSizeBytes,
        streamCount: streams.length,
        audioStreamCount: audios.length,
        audioCodec: audio?.codec_name,
        audioStartSeconds,
        sampleRate: optionalInteger(audio?.sample_rate),
        channels: optionalInteger(audio?.channels),
        channelLayout: audio?.channel_layout,
        sampleFormat: audio?.sample_fmt,
        bitsPerRawSample: optionalInteger(audio?.bits_per_raw_sample),
        timeBase: audio?.time_base,
        headerDurationSamples,
        metadataReadFrameCount,
        expectedDurationSamples: expectedSamples,
        expectedDurationSeconds: approvedDurationSeconds,
        expectedSizeBytes: source.byteLength,
      },
    )
    const decoded = await probeContinuousProgramAudioDecodedSamples(
      image,
      source,
      expectedSamples,
    )
    const actualDurationSeconds = decoded.decodedSamples /
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE
    return {
      container: 'flac',
      audioCodec: 'flac',
      audioCodecOperation: 'lossless_source_range_assembly',
      streamCount: 1,
      sampleRate: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE,
      channels: 2,
      channelLayout: 'stereo',
      sampleFormat: 's32',
      bitsPerRawSample: 24,
      timeBase: '1/48000',
      expectedSamples,
      actualSamples: decoded.decodedSamples,
      decodedBytes: decoded.decodedBytes,
      decodedSampleVerificationConfinement: decoded.confinement,
      formatStartSeconds,
      audioStartSeconds,
      approvedDurationSeconds: rounded(approvedDurationSeconds),
      actualDurationSeconds,
      maximumDurationDriftSeconds: rounded(maximumDurationDriftSeconds),
      sizeBytes: source.byteLength,
      streamingHeaderDurationPresent: headerDurationSamples !== undefined,
      streamingHeaderSizePresent: headerSizeBytes !== undefined,
      metadataReadFrameCount,
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function probeContinuousProgramAudioDecodedSamples(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  expectedSamples: number,
): Promise<{
  decodedBytes: number
  decodedSamples: number
  confinement: OfflineMediaBinaryConfinementEvidence
}> {
  const command = [
    'continuous-program-audio-probe-v1',
    String(expectedSamples),
  ]
  const container = await createContainer(
    image,
    CONTINUOUS_PROGRAM_AUDIO_PROBE_ENTRYPOINT,
    command,
  )
  try {
    const confinement = validateConfinement(
      await inspectContainer(container.id),
      image,
      CONTINUOUS_PROGRAM_AUDIO_PROBE_ENTRYPOINT,
      command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      64 * 1024,
      CONTINUOUS_PROGRAM_AUDIO_TIMEOUT_MS,
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable(
        'Continuous program-audio lossless decoded-sample verification failed closed.',
        {
          exitCode: result.exitCode,
          stderrBytes: result.stderr.length,
          diagnostic: safeFfmpegDiagnostic(result.stderr),
        },
      )
    }
    let parsed: Record<string, unknown>
    try {
      parsed = record(JSON.parse(result.stdout.toString('utf8')))
    } catch {
      throw unavailable(
        'Continuous program-audio decoded-sample verifier returned invalid evidence.',
      )
    }
    const decodedBytes = optionalInteger(parsed.decodedBytes)
    const decodedSamples = optionalInteger(parsed.decodedSamples)
    if (
      decodedBytes !== expectedSamples * 6 ||
      decodedSamples !== expectedSamples
    ) throw unavailable(
      'Continuous program-audio decoded-sample verifier changed the approved sample count.',
      { decodedBytes, decodedSamples, expectedSamples },
    )
    return { decodedBytes, decodedSamples, confinement }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function probeMezzanineFinalOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  request: OfflineMediaBinaryMezzanineFinalizationRequest,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-count_frames', '-show_entries',
    'format=format_name,start_time,duration,size:stream=codec_name,codec_type,start_time,width,height,avg_frame_rate,nb_read_frames,pix_fmt,color_space,color_transfer,color_primaries,sample_rate,channels',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(
      await inspectContainer(container.id),
      image,
      FFPROBE_ENTRYPOINT,
      command,
    )
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      mediaExecutionTimeoutMs(source.byteLength),
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('Mezzanine final output verification failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const videos = streams.filter((stream) => stream.codec_type === 'video')
    const audios = streams.filter((stream) => stream.codec_type === 'audio')
    const video = videos[0]
    const audio = audios[0]
    const actualDurationSeconds = optionalNumber(format.duration)
    const approvedDurationSeconds = request.payload.durationFrames / request.payload.fps
    const maximumDurationDriftSeconds = 1 / request.payload.fps + 0.001
    const formatStartSeconds = optionalNumber(format.start_time)
    const videoStartSeconds = optionalNumber(video?.start_time)
    const audioStartSeconds = optionalNumber(audio?.start_time)
    if (
      videos.length !== 1 || audios.length !== 1 || !video || !audio ||
      video.codec_name !== 'h264' || audio.codec_name !== 'aac' ||
      !String(format.format_name ?? '').includes('mp4') ||
      optionalInteger(video.width) !== request.payload.width ||
      optionalInteger(video.height) !== request.payload.height ||
      video.pix_fmt !== 'yuv420p' || video.color_space !== 'bt709' ||
      video.color_transfer !== 'bt709' || video.color_primaries !== 'bt709' ||
      rational(video.avg_frame_rate) !== request.payload.fps ||
      optionalInteger(video.nb_read_frames) !== request.payload.durationFrames ||
      optionalInteger(audio.sample_rate) !== 48_000 ||
      optionalInteger(audio.channels) !== 2 ||
      formatStartSeconds === undefined || Math.abs(formatStartSeconds) > 0.001 ||
      videoStartSeconds === undefined || videoStartSeconds < 0 ||
      videoStartSeconds > maximumDurationDriftSeconds ||
      audioStartSeconds === undefined || audioStartSeconds < 0 ||
      audioStartSeconds > maximumDurationDriftSeconds ||
      Math.abs(videoStartSeconds - audioStartSeconds) >
        maximumDurationDriftSeconds ||
      actualDurationSeconds === undefined ||
      Math.abs(actualDurationSeconds - approvedDurationSeconds) >
        maximumDurationDriftSeconds
    ) throw unavailable(
      'Mezzanine final output failed MP4, H.264, AAC, frame, color, or duration verification.',
    )
    return {
      container: 'mp4',
      videoCodec: 'h264',
      videoCodecOperation: 'stream_copy',
      audioCodec: 'aac',
      audioCodecOperation: 'single_source_encode',
      width: request.payload.width,
      height: request.payload.height,
      frameRate: request.payload.fps,
      frameCount: request.payload.durationFrames,
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      colorTransfer: 'bt709',
      colorPrimaries: 'bt709',
      audioSampleRate: 48_000,
      audioChannels: 2,
      formatStartSeconds,
      videoStartSeconds,
      audioStartSeconds,
      approvedDurationSeconds: rounded(approvedDurationSeconds),
      actualDurationSeconds,
      maximumDurationDriftSeconds: rounded(maximumDurationDriftSeconds),
      sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024)
      .catch(() => undefined)
  }
}

async function probeFfmpegOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  expectedFrameCount: number,
  expectedFrameRate: number,
  expectProfessionalColor = false,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-count_frames', '-show_entries',
    'format=format_name,duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate,nb_read_frames,pix_fmt,color_space,color_transfer,color_primaries,color_range',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command)
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      mediaExecutionTimeoutMs(source.byteLength),
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFmpeg output verification failed closed.')
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const video = streams.find((stream) => stream.codec_type === 'video')
    if (
      !video || video.codec_name !== (expectProfessionalColor ? 'vp9' : 'ffv1') ||
      !String(format.format_name ?? '').includes(
        expectProfessionalColor ? 'matroska' : 'nut',
      ) ||
      optionalInteger(video.nb_read_frames) !== expectedFrameCount ||
      rational(video.avg_frame_rate) !== expectedFrameRate ||
      (expectProfessionalColor && (
        video.pix_fmt !== 'yuv420p' || video.color_space !== 'bt709' ||
        video.color_transfer !== 'bt709' || video.color_primaries !== 'bt709'
      ))
    ) throw unavailable('FFmpeg intermediate output failed codec, container, frame-count, or rate verification.')
    return {
      container: expectProfessionalColor ? 'matroska' : 'nut',
      videoCodec: expectProfessionalColor ? 'vp9' : 'ffv1',
      frameCount: expectedFrameCount,
      frameRate: expectedFrameRate,
      width: optionalInteger(video.width), height: optionalInteger(video.height),
      pixelFormat: safeText(video.pix_fmt), colorSpace: safeText(video.color_space),
      colorTransfer: safeText(video.color_transfer),
      colorPrimaries: safeText(video.color_primaries), colorRange: safeText(video.color_range),
      durationSeconds: optionalNumber(format.duration), sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundedTo(value: number, digits: number): number {
  return Number(value.toFixed(digits))
}

async function probeFfmpegVoiceDeliveryOutput(
  image: OfflineMediaBinaryImageEvidence,
  source: OfflineMediaBinaryServerInjectedInput,
  wave: {
    sampleRate: number
    channels: number
    bitsPerSample: number
    sampleFrameCount: number
    durationSeconds: number
  },
  expectedDurationSeconds: number,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-show_entries',
    'format=format_name,duration,size:stream=codec_name,codec_type,sample_rate,channels,channel_layout,duration',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command)
    const result = await dockerVerifiedInput(
      ['start', '--attach', '--interactive', container.id],
      source,
      2 * 1024 * 1024,
      mediaExecutionTimeoutMs(source.byteLength),
    )
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw unavailable('FFmpeg voice-delivery output verification failed closed.')
    }
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const audio = streams.find((stream) => stream.codec_type === 'audio')
    const durationSeconds = wave.durationSeconds
    const durationToleranceSeconds = 2 / 48_000
    if (
      streams.length !== 1 || !audio || audio.codec_name !== 'pcm_s16le' ||
      !String(format.format_name ?? '').includes('wav') ||
      optionalInteger(audio.sample_rate) !== 48_000 || optionalInteger(audio.channels) !== 2 ||
      wave.sampleRate !== 48_000 || wave.channels !== 2 || wave.bitsPerSample !== 16 ||
      Math.abs(durationSeconds - expectedDurationSeconds) > durationToleranceSeconds
    ) throw unavailable('FFmpeg voice-delivery output failed WAV, PCM, channel, rate, or duration verification.')
    return {
      container: 'wav', audioCodec: 'pcm_s16le', sampleRate: 48_000,
      channels: 2, channelLayout: String(audio.channel_layout ?? 'stereo'),
      sampleFrameCount: wave.sampleFrameCount, durationSeconds, expectedDurationSeconds,
      durationToleranceSeconds, sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function inspectImage(): Promise<OfflineMediaBinaryImageEvidence> {
  const inspected = await dockerBuffer(['image', 'inspect', IMAGE_TAG], undefined, 8 * 1024 * 1024)
  if (inspected.exitCode !== 0 || inspected.stderr.length > 0) throw unavailable('Pinned FFmpeg LGPL image is unavailable.')
  const parsed = JSON.parse(inspected.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('Pinned media image inspection is invalid.')
  const image = record(parsed[0])
  const config = record(image.Config)
  const labels = stringRecord(config.Labels)
  if (
    image.Os !== 'linux' || typeof image.Architecture !== 'string' ||
    typeof image.Id !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(image.Id) ||
    config.User !== '65532:65532' || labels['org.opencontainers.image.version'] !== SOURCE_VERSION ||
    labels['reeditpro.product-ready'] !== 'false' ||
    labels['reeditpro.h264-encoding'] !== 'blocked_not_compiled' ||
    labels['reeditpro.aac-encoding'] !==
      'private_source_slice_finalizer_only' ||
    labels['reeditpro.mp4-mux'] !==
      'private_source_slice_finalizer_only' ||
    labels['reeditpro.object-mezzanine-chunk'] !==
      'private_all_chunk_vp9_cq12_only' ||
    labels['reeditpro.flac-encoding'] !==
      'private_continuous_program_audio_only' ||
    labels['reeditpro.continuous-program-audio'] !==
      'private_30fps_48khz_source_audio_only' ||
    labels['reeditpro.long-form-master-assembly'] !==
      'private_vp9_flac_matroska_stream_copy_only'
  ) throw unavailable('Pinned media image identity or safety labels are invalid.')
  const sourcePolicyHashes = await policyHashes()
  const imageIdentityHash = sha256AuthorityValue({
    imageId: image.Id, architecture: image.Architecture, os: image.Os,
    user: config.User, labels, sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256, sourcePolicyHashes,
  })
  return {
    imageTag: IMAGE_TAG,
    imageId: image.Id,
    imageIdentityHash,
    architecture: image.Architecture,
    os: 'linux',
    user: '65532:65532',
    sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256,
    productReady: false,
    h264Encoding: 'blocked_not_compiled',
    aacEncoding: 'private_source_slice_finalizer_only',
    mp4Mux: 'private_source_slice_finalizer_only',
    objectMezzanineChunk: 'private_all_chunk_vp9_cq12_only',
    flacEncoding: 'private_continuous_program_audio_only',
    continuousProgramAudio: 'private_30fps_48khz_source_audio_only',
    longFormMasterAssembly:
      'private_vp9_flac_matroska_stream_copy_only',
    sourcePolicyHashes,
  }
}

async function persistAuthority(image: OfflineMediaBinaryImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-media-binary-runtime-authority-v1' as const,
    source: 'private_local_pinned_ffmpeg_lgpl_runtime' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: [
      { toolId: 'ffmpeg' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
      { toolId: 'ffprobe' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
    ] as const,
    readiness: {
      privateInternalExecutionReady: true as const,
      exactStructuredPayloadOnly: true as const,
      canonicalDispatchMayReference: true as const,
      privateInternalMezzanineFinalizationReady: true as const,
      privateInternalObjectMezzanineChunkSeriesReady: true as const,
      privateInternalContinuousProgramAudioReady: true as const,
      privateInternalCrossChunkColorBoundaryReady: true as const,
      privateInternalLongFormMasterAssemblyReady: true as const,
      privateInternalFinalMasterDecodedVideoQaReady: true as const,
      privateInternalFinalMasterDecodedAudioQaReady: true as const,
      longFormFinalMasterQaCheckpointingReady: false as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      finalExportReady: false as const,
    },
    blockers: [
      'Private single-host evidence is not deployed worker-fleet or production authority.',
      'The reviewed LGPL image has unresolved base-image CVEs and legal/distribution review gates.',
      'H.264 encoding, customer export, public delivery, and production activation remain unauthorized.',
      'AAC encoding is restricted to the fixed private source-slice finalizer.',
      'MP4 muxing is restricted to the fixed private source-slice finalizer.',
      'Object-mezzanine chunking is restricted to approved 30 fps private H.264 sources and VP9 CQ12 intermediates.',
      'Continuous program audio is restricted to approved 30 fps source ranges with 48 kHz mono/stereo input and lossless 48 kHz stereo FLAC output.',
      'Cross-chunk color analysis is restricted to adjacent independently QA-passed private VP9 BT.709 chunks and does not mutate media.',
      'Long-form master assembly is private VP9 and FLAC Matroska stream copy only; customer export codecs and delivery remain blocked.',
      'Decoded final-master video and audio QA are bounded private single-process evidence; resumable long-form checkpointing, lease recovery, and worker-fleet execution remain blocked.',
    ] as const,
  }
  const authority: OfflineMediaBinaryRuntimeAuthority = {
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: AUTHORITY_PATH,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-media-binary-runtime-authority-record-v1',
      source: 'private_local_checksum_protected_media_binary_runtime',
      authority,
      checksumSha256: sha256AuthorityValue(authority),
    })}\n`,
  })
}

function ffprobeArguments(
  request: OfflineFfprobeExecutionRequest | OfflineFfprobeStreamingExecutionRequest,
): string[] {
  return [
    '-v', 'error',
    ...(request.payload.countFrames ? ['-count_frames'] : []),
    '-show_entries',
    'format=format_name,start_time,duration,size:stream=index,codec_name,codec_type,start_time,width,height,avg_frame_rate,r_frame_rate,duration,pix_fmt,color_space,color_transfer,color_primaries,color_range,sample_rate,channels,channel_layout,sample_fmt,bits_per_raw_sample,time_base,duration_ts,nb_read_frames',
    '-print_format', 'json',
    '-i', 'pipe:0',
  ]
}

async function createContainer(
  image: OfflineMediaBinaryImageEvidence,
  entrypoint:
    | typeof FFPROBE_ENTRYPOINT
    | typeof FFMPEG_ENTRYPOINT
    | typeof MEZZANINE_FINALIZER_ENTRYPOINT
    | typeof OBJECT_MEZZANINE_CHUNK_ENTRYPOINT
    | typeof CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT
    | typeof CONTINUOUS_PROGRAM_AUDIO_PROBE_ENTRYPOINT
    | typeof LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT,
  command: string[],
) {
  const largeMediaEntrypoint =
    entrypoint === MEZZANINE_FINALIZER_ENTRYPOINT ||
    entrypoint === OBJECT_MEZZANINE_CHUNK_ENTRYPOINT ||
    entrypoint === CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT ||
    entrypoint === LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT
  const memory = largeMediaEntrypoint ? '4g' : '2g'
  const tmpfsSizeBytes = largeMediaEntrypoint ? 1_342_177_280 : 67_108_864
  const created = await dockerBuffer([
    'create', '--interactive', '--network', 'none', '--read-only',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '128', '--memory', memory, '--memory-swap', memory, '--cpus', '2',
    '--tmpfs', `/tmp:rw,noexec,nosuid,nodev,size=${tmpfsSizeBytes},mode=1777`,
    '--user', '65532:65532', '--entrypoint', entrypoint,
    image.imageId, ...command,
  ], undefined, 64 * 1024)
  const id = created.stdout.toString('utf8').trim()
  if (created.exitCode !== 0 || created.stderr.length > 0 || !/^[a-f0-9]{64}$/.test(id)) {
    throw unavailable('Confined media container could not be created.')
  }
  return { id }
}

function validateConfinement(
  inspect: Record<string, unknown>,
  image: OfflineMediaBinaryImageEvidence,
  entrypoint:
    | typeof FFPROBE_ENTRYPOINT
    | typeof FFMPEG_ENTRYPOINT
    | typeof MEZZANINE_FINALIZER_ENTRYPOINT
    | typeof OBJECT_MEZZANINE_CHUNK_ENTRYPOINT
    | typeof CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT
    | typeof CONTINUOUS_PROGRAM_AUDIO_PROBE_ENTRYPOINT
    | typeof LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT,
  command: string[],
): OfflineMediaBinaryConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const tmpfs = stringRecord(host.Tmpfs)
  const security = stringArray(host.SecurityOpt)
  const largeMediaEntrypoint =
    entrypoint === MEZZANINE_FINALIZER_ENTRYPOINT ||
    entrypoint === OBJECT_MEZZANINE_CHUNK_ENTRYPOINT ||
    entrypoint === CONTINUOUS_PROGRAM_AUDIO_ENTRYPOINT ||
    entrypoint === LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT
  const memoryLimitBytes = largeMediaEntrypoint ? 4_294_967_296 : 2_147_483_648
  const tmpfsSizeBytes = largeMediaEntrypoint ? 1_342_177_280 : 67_108_864
  const tmpfsPolicy = String(tmpfs['/tmp'] ?? '')
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true ||
    host.Privileged !== false || stringArray(host.CapDrop).join('|') !== 'ALL' ||
    !security.some((value) => value.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 128 || Number(host.Memory) !== memoryLimitBytes ||
    Number(host.MemorySwap) !== memoryLimitBytes || Number(host.NanoCpus) !== 2_000_000_000 ||
    config.User !== '65532:65532' || stringArray(config.Entrypoint).join('|') !== entrypoint ||
    stableAuthorityStringify(stringArray(config.Cmd)) !== stableAuthorityStringify(command) ||
    (Array.isArray(inspect.Mounts) && inspect.Mounts.length > 0) ||
    (Array.isArray(host.Binds) && host.Binds.length > 0) ||
    !tmpfsPolicy.includes('noexec') ||
    !tmpfsPolicy.includes(`size=${tmpfsSizeBytes}`)
  ) throw unavailable('Media container confinement does not match server policy.')
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true,
    noNewPrivileges: true, privileged: false, pidsLimit: 128,
    memoryLimitBytes, memoryAndSwapLimitBytes: memoryLimitBytes,
    nanoCpus: 2_000_000_000, tmpfsPath: '/tmp', tmpfsSizeBytes,
    user: '65532:65532',
    callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false,
    serverOwnedEntrypoint: entrypoint, serverDerivedArgumentsOnly: true,
  }
}

function normalizeProbe(
  bytes: Buffer,
  request: OfflineFfprobeExecutionRequest | OfflineFfprobeStreamingExecutionRequest,
): Readonly<Record<string, unknown>> {
  let raw: Record<string, unknown>
  try { raw = record(JSON.parse(bytes.toString('utf8'))) } catch { throw unavailable('FFprobe did not return valid JSON.') }
  const rawStreams = Array.isArray(raw.streams) ? raw.streams.slice(0, 32).map(record) : []
  const rawFormat = record(raw.format)
  const streams = rawStreams.map((stream) => ({
    index: safeInteger(stream.index),
    codecName: safeText(stream.codec_name),
    codecType: safeText(stream.codec_type),
    startTimeSeconds: optionalNumber(stream.start_time),
    width: optionalInteger(stream.width),
    height: optionalInteger(stream.height),
    fps: rational(stream.avg_frame_rate ?? stream.r_frame_rate),
    durationSeconds: optionalNumber(stream.duration),
    pixelFormat: optionalText(stream.pix_fmt),
    colorSpace: optionalText(stream.color_space),
    colorTransfer: optionalText(stream.color_transfer),
    colorPrimaries: optionalText(stream.color_primaries),
    colorRange: optionalText(stream.color_range),
    sampleRate: optionalNumber(stream.sample_rate),
    channels: optionalInteger(stream.channels),
    channelLayout: optionalText(stream.channel_layout),
    sampleFormat: optionalText(stream.sample_fmt),
    bitsPerRawSample: optionalInteger(stream.bits_per_raw_sample),
    timeBase: optionalRationalText(stream.time_base),
    durationTimestamp: optionalInteger(stream.duration_ts),
    readFrameCount: request.payload.countFrames ? optionalInteger(stream.nb_read_frames) : undefined,
  }))
  if (streams.length === 0 || !streams.some((stream) => stream.codecType === 'video' || stream.codecType === 'audio')) {
    throw unavailable('FFprobe found no supported media streams.')
  }
  const durationSeconds = optionalNumber(rawFormat.duration) ??
    Math.max(...streams.map((stream) => stream.durationSeconds ?? 0))
  if (!durationSeconds || durationSeconds <= 0) throw unavailable('FFprobe found no positive media duration.')
  const streamDurations = streams.map((stream) => stream.durationSeconds).filter((value): value is number => Boolean(value))
  if (streamDurations.length > 1 && Math.max(...streamDurations) - Math.min(...streamDurations) > 1) {
    throw unavailable('FFprobe detected source stream duration drift above the fixed tolerance.')
  }
  return {
    profileId: request.payload.inspectionProfileId,
    formatName: safeText(rawFormat.format_name),
    formatStartTimeSeconds: optionalNumber(rawFormat.start_time),
    durationSeconds: rounded(durationSeconds),
    sizeBytes: optionalInteger(rawFormat.size) ?? request.payload.sourceByteLength,
    streamCount: streams.length,
    streams,
  }
}

async function inspectContainer(id: string): Promise<Record<string, unknown>> {
  const result = await dockerBuffer(['inspect', id], undefined, 8 * 1024 * 1024)
  if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFprobe container inspection failed.')
  const parsed = JSON.parse(result.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('FFprobe container inspection is invalid.')
  return record(parsed[0])
}

async function policyHashes(): Promise<Record<string, string>> {
  const directory = join(process.cwd(), 'docker/prod/ffmpeg-lgpl-runtime')
  const names = [
    'Dockerfile', 'source-provenance.lock', 'configure-flags.txt',
    'allowed-encoders.txt', 'allowed-decoders.txt', 'allowed-filters.txt',
    'allowed-demuxers.txt', 'allowed-muxers.txt', 'allowed-protocols.txt', 'allowed-bsfs.txt',
    'source-slice-finalizer.sh', 'object-mezzanine-chunk.sh',
    'continuous-program-audio.sh', 'continuous-program-audio-probe.sh',
    'long-form-master-assembly.sh',
  ]
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, sha256(await readFile(join(directory, name)))])))
}

function dockerBuffer(args: string[], input: Buffer | undefined, maximumBytes: number): Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }> {
  return new Promise((resolve, reject) => {
    const invocation = createPrivateDockerCliInvocation(args)
    const child = spawn(invocation.executable, invocation.args, { stdio: ['pipe', 'pipe', 'pipe'], env: invocation.env })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(unavailable('Docker media operation timed out.'))
    }, DOCKER_CONTROL_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes > maximumBytes) child.kill('SIGKILL')
      else stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
      else stderr.push(chunk)
    })
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (stdoutBytes > maximumBytes || stderrBytes > 512 * 1024) return reject(unavailable('Docker media output exceeded its fixed bound.'))
      resolve({ exitCode: code ?? 1, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) })
    })
    if (input) child.stdin.end(input)
    else child.stdin.end()
  })
}

async function dockerVerifiedInput(
  args: string[],
  input: OfflineMediaBinaryServerInjectedInput,
  maximumOutputBytes: number,
  timeoutMs: number,
): Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }> {
  assertServerInjectedInput(input, input.byteLength, input.sha256)
  const invocation = createPrivateDockerCliInvocation(args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  const stdout: Buffer[] = []
  const stderr: Buffer[] = []
  let stdoutBytes = 0
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(unavailable('Docker media operation timed out.'))
      }, timeoutMs)
      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes += chunk.byteLength
        if (stdoutBytes > maximumOutputBytes) child.kill('SIGKILL')
        else stdout.push(chunk)
      })
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.byteLength
        if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
        else stderr.push(chunk)
      })
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (stdoutBytes > maximumOutputBytes || stderrBytes > 512 * 1024) {
          reject(unavailable('Docker media output exceeded its fixed bound.'))
          return
        }
        resolve({
          exitCode: code ?? 1,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
        })
      })
    },
  )
  let totalBytes = 0
  const checksum = createHash('sha256')
  let stream: Readable | undefined
  try {
    stream = await input.openStream()
    if (!stream || typeof stream.pipe !== 'function') {
      throw new Error('Private media input did not return a readable stream.')
    }
    const verifier = new Transform({
      transform(chunk, _encoding, callback) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalBytes += bytes.byteLength
        if (totalBytes > input.byteLength) {
          callback(new Error('Private media input exceeded its exact byte commitment.'))
          return
        }
        checksum.update(bytes)
        callback(null, bytes)
      },
    })
    const [, result] = await Promise.all([
      pipeline(stream, verifier, child.stdin),
      resultPromise,
    ])
    if (totalBytes !== input.byteLength || checksum.digest('hex') !== input.sha256) {
      throw new Error('Private media input did not match its exact byte commitment.')
    }
    return result
  } catch (error) {
    stream?.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    const failedResult = await resultPromise.catch(() => undefined)
    if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') throw error
    throw unavailable(
      'Docker media input stream failed exact size and checksum verification.',
      failedResult
        ? {
            containerExitCode: failedResult.exitCode,
            diagnostic: safeFfmpegDiagnostic(failedResult.stderr),
          }
        : undefined,
    )
  }
}

async function dockerVerifiedInputStreamingLines(input: {
  args: string[]
  input: OfflineMediaBinaryServerInjectedInput
  maximumOutputBytes: number
  timeoutMs: number
  onLine(line: string): void
}): Promise<{
  exitCode: number
  stderr: Buffer
  outputSha256: string
  outputByteLength: number
  verifiedInputSha256: string
  verifiedInputByteLength: number
}> {
  assertServerInjectedInput(
    input.input,
    input.input.byteLength,
    input.input.sha256,
  )
  if (
    !Number.isSafeInteger(input.maximumOutputBytes) ||
    input.maximumOutputBytes < 1 ||
    typeof input.onLine !== 'function'
  ) throw invalid('Streaming-line media execution policy is invalid.')
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  let outputByteLength = 0
  let stderrByteLength = 0
  let pending = Buffer.alloc(0)
  let parserError: Error | undefined
  const outputChecksum = createHash('sha256')
  const stderrChunks: Buffer[] = []
  const parseLine = (bytes: Buffer) => {
    const lineBytes = bytes.at(-1) === 13 ? bytes.subarray(0, -1) : bytes
    if (lineBytes.byteLength > 4 * 1024) {
      throw unavailable('Streaming media checksum line exceeded its fixed bound.')
    }
    input.onLine(lineBytes.toString('utf8'))
  }
  const resultPromise = new Promise<{
    exitCode: number
    stderr: Buffer
    outputSha256: string
    outputByteLength: number
  }>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(unavailable('Docker streaming-line media operation timed out.'))
    }, input.timeoutMs)
    child.stdout.on('data', (chunk: Buffer) => {
      if (parserError) return
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      outputByteLength += bytes.byteLength
      if (outputByteLength > input.maximumOutputBytes) {
        child.kill('SIGKILL')
        return
      }
      outputChecksum.update(bytes)
      const combined = pending.byteLength > 0
        ? Buffer.concat([pending, bytes], pending.byteLength + bytes.byteLength)
        : bytes
      let cursor = 0
      try {
        for (;;) {
          const newline = combined.indexOf(10, cursor)
          if (newline < 0) break
          parseLine(combined.subarray(cursor, newline))
          cursor = newline + 1
        }
        pending = Buffer.from(combined.subarray(cursor))
        if (pending.byteLength > 4 * 1024) {
          throw unavailable('Streaming media checksum line exceeded its fixed bound.')
        }
      } catch (error) {
        parserError = error instanceof Error
          ? error
          : new Error('Streaming media checksum parser rejected output.')
        child.kill('SIGKILL')
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrByteLength += chunk.byteLength
      if (stderrByteLength > 512 * 1024) child.kill('SIGKILL')
      else stderrChunks.push(chunk)
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (!parserError && pending.byteLength > 0) {
        try {
          parseLine(pending)
          pending = Buffer.alloc(0)
        } catch (error) {
          parserError = error instanceof Error
            ? error
            : new Error('Streaming media checksum parser rejected output.')
        }
      }
      if (parserError) {
        reject(parserError)
        return
      }
      if (
        outputByteLength > input.maximumOutputBytes ||
        stderrByteLength > 512 * 1024
      ) {
        reject(unavailable('Docker streaming-line media output exceeded its fixed bound.'))
        return
      }
      resolve({
        exitCode: code ?? 1,
        stderr: Buffer.concat(stderrChunks),
        outputSha256: outputChecksum.digest('hex'),
        outputByteLength,
      })
    })
  })
  let sourceStream: Readable | undefined
  let verifiedInputByteLength = 0
  const inputChecksum = createHash('sha256')
  try {
    sourceStream = await input.input.openStream()
    if (!sourceStream || typeof sourceStream.pipe !== 'function') {
      throw new Error('Private media input did not return a readable stream.')
    }
    const verifier = new Transform({
      transform(chunk, _encoding, callback) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        verifiedInputByteLength += bytes.byteLength
        if (verifiedInputByteLength > input.input.byteLength) {
          callback(new Error('Private media input exceeded its exact byte commitment.'))
          return
        }
        inputChecksum.update(bytes)
        callback(null, bytes)
      },
    })
    const [, result] = await Promise.all([
      pipeline(sourceStream, verifier, child.stdin),
      resultPromise,
    ])
    const verifiedInputSha256 = inputChecksum.digest('hex')
    if (
      verifiedInputByteLength !== input.input.byteLength ||
      verifiedInputSha256 !== input.input.sha256
    ) throw unavailable(
      'Streaming-line media input did not match its exact commitment.',
    )
    return {
      ...result,
      verifiedInputSha256,
      verifiedInputByteLength,
    }
  } catch (error) {
    sourceStream?.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    await resultPromise.catch(() => undefined)
    if (error instanceof ApiError) throw error
    throw unavailable(
      'Docker streaming-line media execution failed exact verification.',
    )
  }
}

interface DockerVerifiedPrivateOutputSpool {
  exitCode: number
  stderr: Buffer
  byteLength: number
  sha256: string
  signature: Buffer
  source: OfflineMediaBinaryServerInjectedInput
  cleanup(): Promise<void>
}

function assertLongFormMasterAssemblyInputs(
  request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    programAudio: OfflineMediaBinaryServerInjectedInput
  },
): void {
  if (!Array.isArray(inputs.chunks) ||
    inputs.chunks.length !== request.inputs.chunks.length) {
    throw invalid('Server-injected long-form chunk authority is incomplete.')
  }
  request.inputs.chunks.forEach((commitment, index) => {
    assertServerInjectedInput(
      inputs.chunks[index]!, commitment.byteLength, commitment.sha256,
    )
  })
  assertServerInjectedInput(
    inputs.programAudio,
    request.inputs.programAudio.byteLength,
    request.inputs.programAudio.sha256,
  )
}

function longFormMasterAssemblyProtocolStream(
  request: OfflineMediaBinaryLongFormMasterAssemblyRequest,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    programAudio: OfflineMediaBinaryServerInjectedInput
  },
): Readable {
  const blockBytes = 16_384
  assertLongFormMasterAssemblyInputs(request, inputs)
  const line = (values: readonly (string | number)[]) =>
    Buffer.from(`${values.join('\t')}\n`, 'utf8')
  const blocks = async function* (
    input: OfflineMediaBinaryServerInjectedInput,
    expectedBytes: number,
    expectedSha256: string,
  ) {
    const stream = await input.openStream()
    let observed = 0
    const checksum = createHash('sha256')
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      for (let offset = 0; offset < bytes.byteLength; offset += blockBytes) {
        const block = bytes.subarray(
          offset,
          Math.min(offset + blockBytes, bytes.byteLength),
        )
        observed += block.byteLength
        if (observed > expectedBytes) {
          throw new Error('Long-form master input exceeded its commitment.')
        }
        checksum.update(block)
        yield block
      }
    }
    if (observed !== expectedBytes || checksum.digest('hex') !== expectedSha256) {
      throw new Error('Long-form master input changed from its commitment.')
    }
  }
  return Readable.from((async function* () {
    yield line([OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_ASSEMBLY_MAGIC])
    yield line([
      'timeline', request.payload.width, request.payload.height,
      request.payload.fps, request.payload.totalFrames,
      request.inputs.chunks.length, request.inputs.programAudio.byteLength,
      request.inputs.programAudio.sha256,
    ])
    for (let index = 0; index < request.inputs.chunks.length; index += 1) {
      const chunk = request.inputs.chunks[index]!
      const plan = request.payload.chunks[index]!
      yield line([
        'chunk', chunk.chunkIndex, plan.globalStartFrame,
        plan.globalEndFrameExclusive, plan.durationFrames,
        chunk.byteLength, chunk.sha256,
      ])
    }
    yield line(['begin'])
    for (let index = 0; index < inputs.chunks.length; index += 1) {
      const commitment = request.inputs.chunks[index]!
      const videoIterator = blocks(
        inputs.chunks[index]!, commitment.byteLength, commitment.sha256,
      )[Symbol.asyncIterator]()
      while (true) {
        const video = await videoIterator.next()
        if (video.done) break
        yield line(['block', 'video', index + 1, video.value.byteLength])
        yield video.value
        yield Buffer.from('\n', 'utf8')
      }
      yield line(['close', 'video', index + 1, 0])
    }
    yield line(['end', 'protocol', 0, 0])
  })())
}

async function dockerVerifiedLongFormMasterToPrivateOutputSpool(input: {
  args: string[]
  containerId: string
  request: OfflineMediaBinaryLongFormMasterAssemblyRequest
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    programAudio: OfflineMediaBinaryServerInjectedInput
  }
  maximumOutputBytes: number
  timeoutMs: number
}): Promise<DockerVerifiedPrivateOutputSpool> {
  if (input.maximumOutputBytes !==
    OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES) {
    throw invalid('Long-form master spool bound is invalid.')
  }
  const spoolId = randomBytes(16).toString('hex')
  const directory = `runtime-output-spools/${spoolId}`
  const created = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT, relativePath: directory,
  })
  const artifactPath = `${directory}/artifact.mkv`
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'], env: invocation.env,
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stderr: Buffer }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(unavailable('Docker long-form master assembly timed out.'))
      }, input.timeoutMs)
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.byteLength
        if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
        else stderr.push(chunk)
      })
      child.once('error', (error) => { clearTimeout(timer); reject(error) })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (stderrBytes > 512 * 1024) {
          reject(unavailable('Long-form master diagnostic exceeded its bound.'))
        } else resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderr) })
      })
    },
  )
  const signature: Buffer[] = []
  let signatureBytes = 0
  const output = Readable.from((async function* () {
    for await (const chunk of child.stdout) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (signatureBytes < 64) {
        const part = bytes.subarray(0, Math.min(bytes.byteLength, 64 - signatureBytes))
        signature.push(Buffer.from(part))
        signatureBytes += part.byteLength
      }
      yield bytes
    }
  })())
  const protocol = longFormMasterAssemblyProtocolStream(input.request, input.inputs)
  let audioResultPromise:
    | Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }>
    | undefined
  try {
    const persistedPromise = writePrivateStreamCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT, relativePath: artifactPath, stream: output,
      maximumBytes: input.maximumOutputBytes,
    })
    audioResultPromise = waitForRunningLongFormMasterContainer(input.containerId)
      .then(() => dockerVerifiedInput(
        [
          'exec', '--interactive', input.containerId,
          LONG_FORM_MASTER_ASSEMBLY_ENTRYPOINT,
          'long-form-master-audio-writer-v1',
        ],
        input.inputs.programAudio,
        1_024,
        input.timeoutMs,
      ))
    const [, result, persisted, audioResult] = await Promise.all([
      pipeline(protocol, child.stdin), resultPromise, persistedPromise,
      audioResultPromise,
    ])
    const prefix = Buffer.concat(signature, signatureBytes)
    if (
      result.exitCode !== 0 || result.stderr.length > 0 ||
      audioResult.exitCode !== 0 || audioResult.stdout.length > 0 ||
      audioResult.stderr.length > 0 ||
      persisted.byteLength < 1_024 || !isMatroska(prefix)
    ) throw unavailable(
      `Long-form master runner failed closed: ${safeFfmpegDiagnostic(result.stderr)}`,
    )
    let cleaned = false
    return {
      exitCode: result.exitCode, stderr: result.stderr,
      byteLength: persisted.byteLength, sha256: persisted.checksumSha256,
      signature: prefix,
      source: Object.freeze({
        inputMode: 'private_verified_stream_v1' as const,
        byteLength: persisted.byteLength,
        sha256: persisted.checksumSha256,
        async openStream() {
          return createPrivateReadStreamWithinRoot({
            rootPath: STORAGE_ROOT, relativePath: artifactPath,
          })
        },
      }),
      async cleanup() {
        if (cleaned) return
        const removed = await removePrivateDirectoryTreeWithinRoot({
          rootPath: STORAGE_ROOT, relativePath: directory,
          expectedIdentity: created.identity,
        })
        if (!removed.removed) throw unavailable('Long-form master spool vanished.')
        cleaned = true
      },
    }
  } catch (error) {
    protocol.destroy(); child.stdout.destroy(); child.stdin.destroy()
    child.kill('SIGKILL')
    void audioResultPromise?.catch(() => undefined)
    await resultPromise.catch(() => undefined)
    await removePrivateDirectoryTreeWithinRoot({
      rootPath: STORAGE_ROOT, relativePath: directory,
      expectedIdentity: created.identity,
    }).catch(() => undefined)
    throw error instanceof ApiError ? error : unavailable(
      `Long-form master streams failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    )
  }
}

async function waitForRunningLongFormMasterContainer(
  containerId: string,
): Promise<void> {
  if (!/^[a-f0-9]{12,64}$/u.test(containerId)) {
    throw invalid('Long-form master container identity is invalid.')
  }
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const inspected = await dockerBuffer(
      ['inspect', '--format', '{{.State.Running}}', containerId],
      undefined,
      64,
    )
    if (inspected.exitCode === 0 && inspected.stdout.toString('utf8').trim() === 'true') {
      return
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 25))
  }
  throw unavailable('Long-form master container did not enter its running state.')
}

function assertObjectMezzanineChunkServerInjectedInputs(
  request: OfflineMediaBinaryObjectMezzanineChunkRequest,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
): void {
  if (
    !Array.isArray(sources) ||
    sources.length !== request.inputs.sources.length
  ) throw invalid('Server-injected object-mezzanine source authority is incomplete.')
  request.inputs.sources.forEach((commitment, index) => {
    assertServerInjectedInput(
      sources[index]!,
      commitment.byteLength,
      commitment.sha256,
    )
  })
}

function objectMezzanineChunkProtocolStream(
  request: OfflineMediaBinaryObjectMezzanineChunkRequest,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
): Readable {
  assertObjectMezzanineChunkServerInjectedInputs(request, sources)
  const line = (values: readonly (string | number)[]) =>
    Buffer.from(`${values.join('\t')}\n`, 'utf8')
  const verifiedBlob = async function* (
    input: OfflineMediaBinaryServerInjectedInput,
    expectedByteLength: number,
    expectedSha256: string,
  ) {
    const stream = await input.openStream()
    if (!stream || typeof stream.pipe !== 'function') {
      throw new Error('Private object-mezzanine source did not return a readable stream.')
    }
    let byteLength = 0
    const checksum = createHash('sha256')
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > expectedByteLength) {
        throw new Error('Private object-mezzanine source exceeded its commitment.')
      }
      checksum.update(bytes)
      yield bytes
    }
    if (
      byteLength !== expectedByteLength ||
      checksum.digest('hex') !== expectedSha256
    ) throw new Error(
      'Private object-mezzanine source did not match its exact commitment.',
    )
  }
  return Readable.from((async function* () {
    yield line([OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAGIC])
    yield line([
      'frame', request.payload.width, request.payload.height,
      request.payload.fps, request.payload.durationFrames,
      request.payload.globalStartFrame,
      request.payload.globalEndFrameExclusive,
      request.inputs.sources.length,
      request.payload.sourceSlices.length,
    ])
    for (let index = 0; index < request.inputs.sources.length; index += 1) {
      const commitment = request.inputs.sources[index]!
      yield line([
        'source', index + 1, commitment.byteLength, commitment.sha256,
      ])
      yield* verifiedBlob(
        sources[index]!,
        commitment.byteLength,
        commitment.sha256,
      )
      yield Buffer.from('\n', 'utf8')
    }
    const sourceIndexBySequenceId = new Map(
      request.inputs.sources.map((source, index) => [
        source.sourceSequenceItemId,
        index + 1,
      ]),
    )
    for (const slice of request.payload.sourceSlices) {
      const sourceIndex = sourceIndexBySequenceId.get(slice.sourceSequenceItemId)
      if (!sourceIndex) {
        throw new Error('Object-mezzanine slice lost its source input index.')
      }
      yield line([
        'slice', slice.sliceIndex, sourceIndex,
        slice.sourceStartFrame, slice.sourceEndFrameExclusive,
        slice.chunkLocalStartFrame, slice.chunkLocalEndFrameExclusive,
        slice.globalTimelineStartFrame, slice.globalTimelineEndFrameExclusive,
        slice.boundaryBefore,
      ])
    }
    yield line(['end'])
  })())
}

async function dockerVerifiedObjectMezzanineChunkToPrivateOutputSpool(input: {
  args: string[]
  request: OfflineMediaBinaryObjectMezzanineChunkRequest
  sources: readonly OfflineMediaBinaryServerInjectedInput[]
  maximumOutputBytes: number
  timeoutMs: number
}): Promise<DockerVerifiedPrivateOutputSpool> {
  if (
    input.maximumOutputBytes !==
    OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES
  ) throw invalid('Object-mezzanine output spool bound is invalid.')
  const spoolId = randomBytes(16).toString('hex')
  const relativeDirectoryPath = `runtime-output-spools/${spoolId}`
  const createdDirectory = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: relativeDirectoryPath,
  })
  const relativeArtifactPath = `${relativeDirectoryPath}/artifact.mkv`
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stderr: Buffer }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(unavailable('Docker object-mezzanine chunk timed out.'))
      }, input.timeoutMs)
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.byteLength
        if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
        else stderr.push(chunk)
      })
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (stderrBytes > 512 * 1024) {
          reject(unavailable(
            'Docker object-mezzanine diagnostic exceeded its fixed bound.',
          ))
          return
        }
        resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderr) })
      })
    },
  )
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedOutput = Readable.from((async function* () {
    for await (const chunk of child.stdout) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (signatureByteLength < 64) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, 64 - signatureByteLength),
        )
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
  })())
  const protocolStream = objectMezzanineChunkProtocolStream(
    input.request,
    input.sources,
  )
  try {
    const persistedPromise = writePrivateStreamCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeArtifactPath,
      stream: verifiedOutput,
      maximumBytes: input.maximumOutputBytes,
    })
    const [, result, persisted] = await Promise.all([
      pipeline(protocolStream, child.stdin),
      resultPromise,
      persistedPromise,
    ])
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw new Error(
        'Private object-mezzanine runner rejected the fixed request ' +
        `(exit=${result.exitCode};diagnostic=${safeFfmpegDiagnostic(result.stderr)}).`,
      )
    }
    if (
      persisted.byteLength < 1_024 ||
      persisted.byteLength > input.maximumOutputBytes ||
      !isMatroska(signature)
    ) throw new Error(
      'Private object-mezzanine output failed its streaming MKV commitment.',
    )
    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      const removed = await removePrivateDirectoryTreeWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: relativeDirectoryPath,
        expectedIdentity: createdDirectory.identity,
      })
      if (!removed.removed) {
        throw unavailable(
          'Private object-mezzanine output spool disappeared before cleanup.',
        )
      }
      cleaned = true
    }
    const source = Object.freeze({
      inputMode: 'private_verified_stream_v1' as const,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      async openStream() {
        return createPrivateReadStreamWithinRoot({
          rootPath: STORAGE_ROOT,
          relativePath: relativeArtifactPath,
        })
      },
    })
    return {
      exitCode: result.exitCode,
      stderr: result.stderr,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      signature,
      source,
      cleanup,
    }
  } catch (error) {
    protocolStream.destroy()
    child.stdout.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    await resultPromise.catch(() => undefined)
    await removePrivateDirectoryTreeWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeDirectoryPath,
      expectedIdentity: createdDirectory.identity,
    }).catch(() => undefined)
    if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') throw error
    throw unavailable(
      `Docker object-mezzanine streams failed exact private verification: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    )
  }
}

function assertContinuousProgramAudioServerInjectedInputs(
  request: OfflineMediaBinaryContinuousProgramAudioRequest,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
): void {
  if (
    !Array.isArray(sources) ||
    sources.length !== request.inputs.sources.length
  ) throw invalid(
    'Server-injected continuous program-audio source authority is incomplete.',
  )
  request.inputs.sources.forEach((commitment, index) => {
    assertServerInjectedInput(
      sources[index]!,
      commitment.byteLength,
      commitment.sha256,
    )
  })
}

function continuousProgramAudioProtocolStream(
  request: OfflineMediaBinaryContinuousProgramAudioRequest,
  sources: readonly OfflineMediaBinaryServerInjectedInput[],
): Readable {
  assertContinuousProgramAudioServerInjectedInputs(request, sources)
  const line = (values: readonly (string | number)[]) =>
    Buffer.from(`${values.join('\t')}\n`, 'utf8')
  const verifiedBlob = async function* (
    source: OfflineMediaBinaryServerInjectedInput,
    expectedByteLength: number,
    expectedSha256: string,
  ) {
    const stream = await source.openStream()
    if (!stream || typeof stream.pipe !== 'function') {
      throw new Error(
        'Private continuous program-audio source did not return a readable stream.',
      )
    }
    let byteLength = 0
    const checksum = createHash('sha256')
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > expectedByteLength) {
        throw new Error(
          'Private continuous program-audio source exceeded its commitment.',
        )
      }
      checksum.update(bytes)
      yield bytes
    }
    if (
      byteLength !== expectedByteLength ||
      checksum.digest('hex') !== expectedSha256
    ) throw new Error(
      'Private continuous program-audio source did not match its exact commitment.',
    )
  }
  return Readable.from((async function* () {
    yield line([OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAGIC])
    yield line([
      'timeline', request.payload.frameRateNumerator,
      request.payload.totalFrames, request.payload.sampleRate, 2,
      request.inputs.sources.length, request.payload.sourceSlices.length,
    ])
    for (let index = 0; index < request.inputs.sources.length; index += 1) {
      const commitment = request.inputs.sources[index]!
      yield line([
        'source', index + 1, commitment.byteLength, commitment.sha256,
      ])
      yield* verifiedBlob(
        sources[index]!,
        commitment.byteLength,
        commitment.sha256,
      )
      yield Buffer.from('\n', 'utf8')
    }
    const sourceIndexBySequenceId = new Map(
      request.inputs.sources.map((source, index) => [
        source.sourceSequenceItemId,
        index + 1,
      ]),
    )
    for (const slice of request.payload.sourceSlices) {
      const sourceIndex = sourceIndexBySequenceId.get(
        slice.sourceSequenceItemId,
      )
      if (!sourceIndex) {
        throw new Error(
          'Continuous program-audio slice lost its source input index.',
        )
      }
      yield line([
        'slice', slice.sliceIndex, sourceIndex,
        slice.sourceStartFrame, slice.sourceEndFrameExclusive,
        slice.timelineStartFrame, slice.timelineEndFrameExclusive,
        slice.boundaryBefore,
      ])
    }
    yield line(['end'])
  })())
}

async function dockerVerifiedContinuousProgramAudioToPrivateOutputSpool(input: {
  args: string[]
  request: OfflineMediaBinaryContinuousProgramAudioRequest
  sources: readonly OfflineMediaBinaryServerInjectedInput[]
  maximumOutputBytes: number
  timeoutMs: number
}): Promise<DockerVerifiedPrivateOutputSpool> {
  if (
    input.maximumOutputBytes !==
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES
  ) throw invalid('Continuous program-audio output spool bound is invalid.')
  const spoolId = randomBytes(16).toString('hex')
  const relativeDirectoryPath = `runtime-output-spools/${spoolId}`
  const createdDirectory = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: relativeDirectoryPath,
  })
  const relativeArtifactPath = `${relativeDirectoryPath}/artifact.flac`
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stderr: Buffer }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(unavailable('Docker continuous program-audio timed out.'))
      }, input.timeoutMs)
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.byteLength
        if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
        else stderr.push(chunk)
      })
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (stderrBytes > 512 * 1024) {
          reject(unavailable(
            'Docker continuous program-audio diagnostic exceeded its fixed bound.',
          ))
          return
        }
        resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderr) })
      })
    },
  )
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedOutput = Readable.from((async function* () {
    for await (const chunk of child.stdout) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (signatureByteLength < 64) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, 64 - signatureByteLength),
        )
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
  })())
  const protocolStream = continuousProgramAudioProtocolStream(
    input.request,
    input.sources,
  )
  try {
    const persistedPromise = writePrivateStreamCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeArtifactPath,
      stream: verifiedOutput,
      maximumBytes: input.maximumOutputBytes,
    })
    const [, result, persisted] = await Promise.all([
      pipeline(protocolStream, child.stdin),
      resultPromise,
      persistedPromise,
    ])
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw new Error(
        'Private continuous program-audio runner rejected the fixed request ' +
        `(exit=${result.exitCode};diagnostic=${safeFfmpegDiagnostic(result.stderr)}).`,
      )
    }
    if (
      persisted.byteLength < 1_024 ||
      persisted.byteLength > input.maximumOutputBytes ||
      !isFlac(signature)
    ) throw new Error(
      'Private continuous program-audio output failed its streaming FLAC commitment.',
    )
    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      const removed = await removePrivateDirectoryTreeWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: relativeDirectoryPath,
        expectedIdentity: createdDirectory.identity,
      })
      if (!removed.removed) {
        throw unavailable(
          'Private continuous program-audio output spool disappeared before cleanup.',
        )
      }
      cleaned = true
    }
    const source = Object.freeze({
      inputMode: 'private_verified_stream_v1' as const,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      async openStream() {
        return createPrivateReadStreamWithinRoot({
          rootPath: STORAGE_ROOT,
          relativePath: relativeArtifactPath,
        })
      },
    })
    return {
      exitCode: result.exitCode,
      stderr: result.stderr,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      signature,
      source,
      cleanup,
    }
  } catch (error) {
    protocolStream.destroy()
    child.stdout.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    await resultPromise.catch(() => undefined)
    await removePrivateDirectoryTreeWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeDirectoryPath,
      expectedIdentity: createdDirectory.identity,
    }).catch(() => undefined)
    if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') throw error
    throw unavailable(
      `Docker continuous program-audio streams failed exact private verification: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    )
  }
}

function assertMezzanineServerInjectedInputs(
  request: OfflineMediaBinaryMezzanineFinalizationRequest,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    source: OfflineMediaBinaryServerInjectedInput
  },
): void {
  if (
    !inputs || typeof inputs !== 'object' || Array.isArray(inputs) ||
    Object.keys(inputs).sort().join('|') !== 'chunks|source' ||
    !Array.isArray(inputs.chunks) ||
    inputs.chunks.length !== request.inputs.chunks.length
  ) throw invalid('Server-injected mezzanine input authority is incomplete.')
  request.inputs.chunks.forEach((commitment, index) => {
    assertServerInjectedInput(
      inputs.chunks[index]!,
      commitment.byteLength,
      commitment.sha256,
    )
  })
  assertServerInjectedInput(
    inputs.source,
    request.inputs.source.byteLength,
    request.inputs.source.sha256,
  )
}

function mezzanineFinalizationProtocolStream(
  request: OfflineMediaBinaryMezzanineFinalizationRequest,
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    source: OfflineMediaBinaryServerInjectedInput
  },
): Readable {
  assertMezzanineServerInjectedInputs(request, inputs)
  const line = (values: readonly (string | number)[]) =>
    Buffer.from(`${values.join('\t')}\n`, 'utf8')
  const verifiedBlob = async function* (
    input: OfflineMediaBinaryServerInjectedInput,
    expectedByteLength: number,
    expectedSha256: string,
  ) {
    const stream = await input.openStream()
    if (!stream || typeof stream.pipe !== 'function') {
      throw new Error('Private mezzanine input did not return a readable stream.')
    }
    let byteLength = 0
    const checksum = createHash('sha256')
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > expectedByteLength) {
        throw new Error('Private mezzanine input exceeded its exact byte commitment.')
      }
      checksum.update(bytes)
      yield bytes
    }
    if (
      byteLength !== expectedByteLength ||
      checksum.digest('hex') !== expectedSha256
    ) throw new Error(
      'Private mezzanine input did not match its exact byte commitment.',
    )
  }
  return Readable.from((async function* () {
    yield line([OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAGIC])
    yield line([
      'frame', request.payload.width, request.payload.height,
      request.payload.fps, request.payload.durationFrames,
      request.payload.sourceStartFrame, request.payload.sourceEndFrameExclusive,
      request.payload.chunks.length,
    ])
    for (let index = 0; index < request.payload.chunks.length; index += 1) {
      const planned = request.payload.chunks[index]!
      const commitment = request.inputs.chunks[index]!
      yield line([
        'chunk', planned.chunkIndex, planned.globalStartFrame,
        planned.globalEndFrameExclusive, planned.sourceStartFrame,
        planned.sourceEndFrameExclusive, commitment.byteLength,
        commitment.sha256,
      ])
      yield* verifiedBlob(
        inputs.chunks[index]!,
        commitment.byteLength,
        commitment.sha256,
      )
      yield Buffer.from('\n', 'utf8')
    }
    yield line([
      'source', request.inputs.source.byteLength, request.inputs.source.sha256,
    ])
    yield* verifiedBlob(
      inputs.source,
      request.inputs.source.byteLength,
      request.inputs.source.sha256,
    )
    yield Buffer.from('\nend\n', 'utf8')
  })())
}

async function dockerVerifiedMezzanineInputToPrivateOutputSpool(input: {
  args: string[]
  request: OfflineMediaBinaryMezzanineFinalizationRequest
  inputs: {
    chunks: readonly OfflineMediaBinaryServerInjectedInput[]
    source: OfflineMediaBinaryServerInjectedInput
  }
  maximumOutputBytes: number
  timeoutMs: number
}): Promise<DockerVerifiedPrivateOutputSpool> {
  if (
    input.maximumOutputBytes !==
    OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES
  ) throw invalid('Mezzanine output spool bound is invalid.')
  const spoolId = randomBytes(16).toString('hex')
  const relativeDirectoryPath = `runtime-output-spools/${spoolId}`
  const createdDirectory = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: relativeDirectoryPath,
  })
  const relativeArtifactPath = `${relativeDirectoryPath}/artifact.mp4`
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stderr: Buffer }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(unavailable('Docker mezzanine finalization timed out.'))
      }, input.timeoutMs)
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.byteLength
        if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
        else stderr.push(chunk)
      })
      child.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (stderrBytes > 512 * 1024) {
          reject(unavailable(
            'Docker mezzanine output exceeded its fixed diagnostic bound.',
          ))
          return
        }
        resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderr) })
      })
    },
  )
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedOutput = Readable.from((async function* () {
    for await (const chunk of child.stdout) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (signatureByteLength < 64) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, 64 - signatureByteLength),
        )
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
  })())
  const protocolStream = mezzanineFinalizationProtocolStream(
    input.request,
    input.inputs,
  )
  try {
    const persistedPromise = writePrivateStreamCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeArtifactPath,
      stream: verifiedOutput,
      maximumBytes: input.maximumOutputBytes,
    })
    const [, result, persisted] = await Promise.all([
      pipeline(protocolStream, child.stdin),
      resultPromise,
      persistedPromise,
    ])
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (result.exitCode !== 0 || result.stderr.length > 0) {
      throw new Error(
        'Private mezzanine runner rejected the fixed request ' +
        `(exit=${result.exitCode};diagnostic=${safeFfmpegDiagnostic(result.stderr)}).`,
      )
    }
    if (
      persisted.byteLength < 1_024 ||
      persisted.byteLength > input.maximumOutputBytes ||
      !isMp4(signature)
    ) throw new Error(
      'Private mezzanine output failed its streaming MP4 commitment.',
    )
    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      const removed = await removePrivateDirectoryTreeWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: relativeDirectoryPath,
        expectedIdentity: createdDirectory.identity,
      })
      if (!removed.removed) {
        throw unavailable('Private mezzanine output spool disappeared before cleanup.')
      }
      cleaned = true
    }
    const source = Object.freeze({
      inputMode: 'private_verified_stream_v1' as const,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      async openStream() {
        return createPrivateReadStreamWithinRoot({
          rootPath: STORAGE_ROOT,
          relativePath: relativeArtifactPath,
        })
      },
    })
    return {
      exitCode: result.exitCode,
      stderr: result.stderr,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      signature,
      source,
      cleanup,
    }
  } catch (error) {
    protocolStream.destroy()
    child.stdout.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    await resultPromise.catch(() => undefined)
    await removePrivateDirectoryTreeWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeDirectoryPath,
      expectedIdentity: createdDirectory.identity,
    }).catch(() => undefined)
    if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') throw error
    throw unavailable(
      `Docker mezzanine streams failed exact private verification: ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    )
  }
}

async function dockerVerifiedInputToPrivateOutputSpool(input: {
  args: string[]
  input: OfflineMediaBinaryServerInjectedInput
  maximumOutputBytes: number
  expectedFormat: 'mkv' | 'wav'
  timeoutMs: number
}): Promise<DockerVerifiedPrivateOutputSpool> {
  assertServerInjectedInput(input.input, input.input.byteLength, input.input.sha256)
  const expectedMaximum = input.expectedFormat === 'wav'
    ? OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES
    : OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES
  if (
    input.maximumOutputBytes !== expectedMaximum
  ) throw invalid('Streaming FFmpeg output spool bounds are invalid.')
  const spoolId = randomBytes(16).toString('hex')
  const relativeDirectoryPath = `runtime-output-spools/${spoolId}`
  const createdDirectory = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: relativeDirectoryPath,
  })
  const relativeArtifactPath = `${relativeDirectoryPath}/artifact.${input.expectedFormat}`
  const invocation = createPrivateDockerCliInvocation(input.args)
  const child = spawn(invocation.executable, invocation.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: invocation.env,
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  const resultPromise = new Promise<{ exitCode: number; stderr: Buffer }>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(unavailable('Docker media operation timed out.'))
    }, input.timeoutMs)
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
      else stderr.push(chunk)
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (stderrBytes > 512 * 1024) {
        reject(unavailable('Docker media output exceeded its fixed diagnostic bound.'))
        return
      }
      resolve({ exitCode: code ?? 1, stderr: Buffer.concat(stderr) })
    })
  })
  const signatureChunks: Buffer[] = []
  let signatureByteLength = 0
  const verifiedOutput = Readable.from((async function* () {
    for await (const chunk of child.stdout) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      if (signatureByteLength < PCM_WAVE_MAXIMUM_HEADER_BYTES) {
        const part = bytes.subarray(
          0,
          Math.min(bytes.byteLength, PCM_WAVE_MAXIMUM_HEADER_BYTES - signatureByteLength),
        )
        signatureChunks.push(Buffer.from(part))
        signatureByteLength += part.byteLength
      }
      yield bytes
    }
  })())
  let sourceStream: Readable | undefined
  let inputByteLength = 0
  const inputChecksum = createHash('sha256')
  try {
    sourceStream = await input.input.openStream()
    if (!sourceStream || typeof sourceStream.pipe !== 'function') {
      throw new Error('Private media input did not return a readable stream.')
    }
    const inputVerifier = new Transform({
      transform(chunk, _encoding, callback) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        inputByteLength += bytes.byteLength
        if (inputByteLength > input.input.byteLength) {
          callback(new Error('Private media input exceeded its exact byte commitment.'))
          return
        }
        inputChecksum.update(bytes)
        callback(null, bytes)
      },
    })
    const persistedPromise = writePrivateStreamCreateOnlyWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeArtifactPath,
      stream: verifiedOutput,
      maximumBytes: input.maximumOutputBytes,
    })
    const [, result, persisted] = await Promise.all([
      pipeline(sourceStream, inputVerifier, child.stdin),
      resultPromise,
      persistedPromise,
    ])
    const signature = Buffer.concat(signatureChunks, signatureByteLength)
    if (
      inputByteLength !== input.input.byteLength ||
      inputChecksum.digest('hex') !== input.input.sha256
    ) throw new Error('Private media input did not match its exact byte commitment.')
    if (
      persisted.byteLength < 44 || persisted.byteLength > input.maximumOutputBytes ||
      (input.expectedFormat === 'mkv'
        ? !isMatroska(signature)
        : !inspectPcmWavePrefix(signature, persisted.byteLength))
    ) throw new Error('Private FFmpeg output failed its streaming format commitment.')
    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      const removed = await removePrivateDirectoryTreeWithinRoot({
        rootPath: STORAGE_ROOT,
        relativePath: relativeDirectoryPath,
        expectedIdentity: createdDirectory.identity,
      })
      if (!removed.removed) throw unavailable('Private FFmpeg output spool disappeared before cleanup.')
      cleaned = true
    }
    const source = Object.freeze({
      inputMode: 'private_verified_stream_v1' as const,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      async openStream() {
        return createPrivateReadStreamWithinRoot({
          rootPath: STORAGE_ROOT,
          relativePath: relativeArtifactPath,
        })
      },
    })
    return {
      exitCode: result.exitCode,
      stderr: result.stderr,
      byteLength: persisted.byteLength,
      sha256: persisted.checksumSha256,
      signature,
      source,
      cleanup,
    }
  } catch (error) {
    sourceStream?.destroy()
    child.stdout.destroy()
    child.stdin.destroy()
    child.kill('SIGKILL')
    await resultPromise.catch(() => undefined)
    await removePrivateDirectoryTreeWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: relativeDirectoryPath,
      expectedIdentity: createdDirectory.identity,
    }).catch(() => undefined)
    if (error instanceof ApiError && error.code === 'TOOL_NOT_READY') throw error
    throw unavailable('Docker media streams failed exact private output verification.')
  }
}

function verifiedBufferInput(
  bytes: Buffer,
  expectedSha256: string,
): OfflineMediaBinaryServerInjectedInput {
  if (sha256(bytes) !== expectedSha256) {
    throw invalid('Buffered media input does not match its checksum commitment.')
  }
  return Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: expectedSha256,
    async openStream() {
      return Readable.from([bytes])
    },
  })
}

function assertStreamingOutputSink(
  outputSink: OfflineMediaBinaryStreamingOutputSink,
  recipeProfileId: OfflineFfmpegStreamingExecutionRequest['payload']['recipeProfileId'],
): void {
  const expectedMaximum = recipeProfileId === 'approved_voice_delivery_wav_v1'
    ? OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES
    : OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES
  if (
    !outputSink ||
    outputSink.maximumBytes !== expectedMaximum ||
    typeof outputSink.persist !== 'function'
  ) throw invalid('Server-injected FFmpeg output sink authority is invalid.')
}

function assertServerInjectedInput(
  input: OfflineMediaBinaryServerInjectedInput,
  expectedByteLength: number,
  expectedSha256: string,
): void {
  if (
    !input || input.inputMode !== 'private_verified_stream_v1' ||
    !Number.isSafeInteger(input.byteLength) || input.byteLength < 64 ||
    input.byteLength !== expectedByteLength ||
    !/^[a-f0-9]{64}$/u.test(input.sha256) || input.sha256 !== expectedSha256 ||
    typeof input.openStream !== 'function'
  ) throw invalid('Server-injected private media input authority is invalid.')
}

function redactedRequestEnvelope(
  request:
    | OfflineFfprobeExecutionRequest
    | OfflineFfprobeStreamingExecutionRequest
    | OfflineFfmpegExecutionRequest
    | OfflineFfmpegStreamingExecutionRequest,
): Record<string, unknown> {
  const payload = { ...request.payload } as Record<string, unknown>
  if ('sourceBytesBase64' in payload) {
    payload.sourceBytesBase64 = '[server-injected-approved-bytes]'
  }
  if ('referenceSourceBytesBase64' in payload) {
    payload.referenceSourceBytesBase64 = '[server-injected-approved-reference-bytes]'
  }
  return { ...request, payload }
}

function mediaExecutionTimeoutMs(
  sourceByteLength: number,
  frameCount = 0,
  frameRate = 24,
): number {
  const byteAllowance = Math.ceil(sourceByteLength / (8 * 1024 * 1024)) * 5_000
  const durationAllowance = frameCount > 0
    ? Math.ceil(frameCount / Math.max(1, frameRate)) * 5_000
    : 0
  return Math.min(
    MAXIMUM_STREAMING_TIMEOUT_MS,
    Math.max(
      DOCKER_CONTROL_TIMEOUT_MS,
      DOCKER_CONTROL_TIMEOUT_MS + byteAllowance + durationAllowance,
    ),
  )
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Media runtime record is invalid.')
  return value as Record<string, unknown>
}
function stringRecord(value: unknown): Record<string, string> {
  const output = record(value)
  if (Object.values(output).some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string record is invalid.')
  return output as Record<string, string>
}
function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string array is invalid.')
  return value
}
function safeInteger(value: unknown): number { const parsed = optionalInteger(value); if (parsed === undefined) throw unavailable('FFprobe integer is invalid.'); return parsed }
function optionalInteger(value: unknown): number | undefined { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined }
function optionalNumber(value: unknown): number | undefined { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? rounded(parsed) : undefined }
function rational(value: unknown): number | undefined { const [a, b] = String(value ?? '').split('/').map(Number); return Number.isFinite(a) && Number.isFinite(b) && b ? rounded(a / b) : undefined }
function safeText(value: unknown): string { const text = String(value ?? 'unknown'); return /^[A-Za-z0-9,._ -]{1,160}$/.test(text) ? text : 'unknown' }
function optionalText(value: unknown): string | undefined { return value === undefined ? undefined : safeText(value) }
function optionalRationalText(value: unknown): string | undefined {
  const text = String(value ?? '')
  return /^[0-9]{1,12}\/[1-9][0-9]{0,12}$/u.test(text) ? text : undefined
}
function rounded(value: number): number { return Number(value.toFixed(6)) }
function sha256(value: Buffer): string { return createHash('sha256').update(value).digest('hex') }
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
function unavailable(message: string, details?: unknown): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, details)
}
