import type { Readable } from 'node:stream'

export const OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES = 32 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES = 192 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES = 64 * 1024 * 1024

export interface OfflineMediaBinaryImageEvidence {
  imageTag: 'reeditpro/ffmpeg-lgpl-internal:8.1.2-color-finalizer-v2-local'
  imageId: string
  imageIdentityHash: string
  architecture: string
  os: 'linux'
  user: '65532:65532'
  sourceVersion: '8.1.2'
  sourceSha256: '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c'
  productReady: false
  h264Encoding: 'blocked_not_compiled'
  aacEncoding: 'private_source_slice_finalizer_only'
  mp4Mux: 'private_source_slice_finalizer_only'
  sourcePolicyHashes: Readonly<Record<string, string>>
}

export interface OfflineMediaBinaryConfinementEvidence {
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 128
  memoryLimitBytes: 2147483648 | 4294967296
  memoryAndSwapLimitBytes: 2147483648 | 4294967296
  nanoCpus: 2000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 67108864 | 1342177280
  user: '65532:65532'
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  serverOwnedEntrypoint:
    | '/opt/reeditpro-ffmpeg/bin/ffprobe'
    | '/opt/reeditpro-ffmpeg/bin/ffmpeg'
    | '/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer'
  serverDerivedArgumentsOnly: true
}

export interface OfflineFfprobeExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffprobe'
    operationId: 'tool.ffprobe.inspect_approved_media.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: {
    recordId: string
    completedAt: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineFfmpegExecutionResult {
  resultArtifact: {
    mimeType: 'video/x-nut' | 'video/x-matroska' | 'audio/wav'
    bytes: Buffer
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    referenceSourceSha256?: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineMediaBinaryStreamingOutputSink {
  maximumBytes: number
  persist(input: {
    stream: Readable
    mimeType: 'video/x-matroska' | 'audio/wav' | 'video/mp4'
    expectedByteLength: number
    expectedSha256: string
  }): Promise<{ byteLength: number; sha256: string }>
}

export interface OfflineFfmpegMezzanineFinalizationExecutionResult {
  resultArtifact: {
    mimeType: 'video/mp4'
    sha256: string
    byteLength: number
    outputMode: 'server_committed_private_stream_v1'
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    chunkSha256s: readonly string[]
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
    outputTransport: 'server_committed_private_stream_v1'
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness']
}

export interface OfflineFfmpegStreamingOutputExecutionResult {
  resultArtifact: {
    mimeType: 'video/x-matroska' | 'audio/wav'
    sha256: string
    byteLength: number
    outputMode: 'server_committed_private_stream_v1'
  }
  evidence: OfflineFfmpegExecutionResult['evidence'] & {
    outputTransport: 'server_committed_private_stream_v1'
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness']
}
