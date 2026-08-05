import type { Readable } from 'node:stream'

import type {
  PrivateEmbeddedProcessResourceObservation,
} from '../private-embedded-process-resource-observation'

export const OFFLINE_MEDIA_BINARY_LEGACY_OUTPUT_BUFFER_MAXIMUM_BYTES = 32 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES = 192 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES = 64 * 1024 * 1024

export interface OfflineMediaBinaryImageEvidence {
  imageTag: 'reeditpro/ffmpeg-lgpl-internal:8.1.2-track-privacy-v10-local'
  imageId: string
  imageIdentityHash: string
  architecture: string
  os: 'linux'
  user: '65532:65532'
  sourceVersion: '8.1.2'
  sourceSha256: '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c'
  productReady: false
  h264Encoding: 'blocked_not_compiled'
  aacEncoding:
    'private_source_slice_finalizer_and_customer_delivery_mux_only'
  mp4Mux: 'private_source_slice_finalizer_and_customer_delivery_mux_only'
  objectMezzanineChunk: 'private_all_chunk_vp9_cq12_only'
  flacEncoding: 'private_continuous_program_audio_only'
  continuousProgramAudio: 'private_30fps_48khz_source_audio_only'
  longFormMasterAssembly: 'private_vp9_flac_matroska_stream_copy_only'
  customerDeliveryMasterMux:
    'private_h264_stream_copy_aac_lc_192k_front_loaded_mp4_only'
  visualCalibrationObjectiveQa:
    'private_dependency_bound_mp4_and_reference_frames_only'
  exactSourceFramePng:
    'private_exact_decoded_source_frame_rgba_png_only'
  trackAllPrivacyRedaction:
    'private_fixed_mask_regions_vp9_matroska_only'
  sourcePolicyHashes: Readonly<Record<string, string>>
}

export interface OfflineMediaBinaryConfinementEvidence {
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 128
  memoryLimitBytes: 2147483648 | 4294967296 | 8589934592
  memoryAndSwapLimitBytes: 2147483648 | 4294967296 | 8589934592
  nanoCpus: 2000000000 | 4000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 67108864 | 201326592 | 1342177280
  user: '65532:65532'
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  serverOwnedReadOnlyInputMount?: {
    destination: '/private-input/source.media'
    readOnly: true
    byteLength: number
    sha256: string
  }
  serverOwnedEntrypoint:
    | '/opt/reeditpro-ffmpeg/bin/ffprobe'
    | '/opt/reeditpro-ffmpeg/bin/ffmpeg'
    | '/usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer'
    | '/usr/local/bin/reeditpro-ffmpeg-object-mezzanine-chunk'
    | '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio'
    | '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio-probe'
    | '/usr/local/bin/reeditpro-ffmpeg-long-form-master-assembly'
    | '/usr/local/bin/reeditpro-ffmpeg-customer-delivery-master-mux'
    | '/usr/local/bin/reeditpro-ffmpeg-visual-calibration-objective-qa'
  serverDerivedArgumentsOnly: true
  resourceObserverEntrypoint?:
    '/usr/local/bin/reeditpro-media-cgroup-resource-observer'
  cgroupV2ResourceObservationRequired?: true
}

export interface OfflineVisualCalibrationObjectiveQaExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    candidateSha256: string
    firstFrameSha256: string
    lastFrameSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    resourceObservation: PrivateEmbeddedProcessResourceObservation
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: {
    privateInternalOnly: true
    canonicalLeaseVerified: false
    singleUseDispatchVerified: false
    internalCostEvidenceReconciled: false
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
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
    resourceObservation: PrivateEmbeddedProcessResourceObservation
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

export interface OfflineGeneratedMusicCandidateNormalizeExecutionResult {
  resultArtifact: {
    mimeType: 'audio/wav'
    bytes: Buffer
    sha256: string
    byteLength: number
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
    sampleCountPerChannel: number
    durationMilliseconds: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
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
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineSynchronizedFoleyCandidateNormalizeExecutionResult {
  resultArtifact: {
    mimeType: 'audio/wav'
    bytes: Buffer
    sha256: string
    byteLength: number
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
    sampleCountPerChannel: number
    durationFrames: number
    fps: 24 | 30
    durationMilliseconds: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
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
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineStorytellingAudioNormalizeExecutionResult {
  resultArtifact: {
    mimeType: 'audio/wav'
    bytes: Buffer
    sha256: string
    byteLength: number
    sampleRateHertz: 48_000
    channelCount: 2
    sampleCountPerChannel: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.normalize_storytelling_audio_mix.v1'
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
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineStorytellingAudioMeasureExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: {
      measurementProfileId: 'motion_studio_storytelling_ebur128_v1'
      integratedLufs: number
      loudnessRangeLu: number
      truePeakDbfs: number
    }
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.measure_storytelling_audio_mix.v1'
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
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineFfmpegExecutionResult {
  resultArtifact:
    | {
        mimeType: 'audio/wav'
        bytes: Buffer
        sha256: string
        byteLength: number
        sampleCountPerChannel: number
        durationMilliseconds: number
      }
    | {
        mimeType: 'video/x-nut' | 'video/x-matroska'
        bytes: Buffer
        sha256: string
        byteLength: number
      }
    | {
        mimeType: 'image/png'
        bytes: Buffer
        sha256: string
        byteLength: number
        width: number
        height: number
        bitDepth: 8
        colorType: 6
        channelCount: 4
        hasAlphaChannel: true
        opaquePixelCount: number
        nonOpaquePixelCount: 0
        decodedRgbaSha256: string
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
    resourceObservation: PrivateEmbeddedProcessResourceObservation
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
    mimeType: 'video/x-matroska' | 'audio/wav' | 'audio/flac' | 'video/mp4'
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

export interface OfflineFfmpegObjectMezzanineChunkExecutionResult {
  resultArtifact: {
    mimeType: 'video/x-matroska'
    sha256: string
    byteLength: number
    outputMode: 'server_committed_private_stream_v1'
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256s: readonly string[]
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

export interface OfflineFfmpegContinuousProgramAudioExecutionResult {
  resultArtifact: {
    mimeType: 'audio/flac'
    sha256: string
    byteLength: number
    outputMode: 'server_committed_private_stream_v1'
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256s: readonly string[]
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

export interface OfflineFfmpegLongFormMasterAssemblyExecutionResult {
  resultArtifact: {
    mimeType: 'video/x-matroska'
    sha256: string
    byteLength: number
    outputMode: 'server_committed_private_stream_v1'
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    chunkSha256s: readonly string[]
    programAudioSha256: string
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

export interface OfflineFfmpegCustomerDeliveryMuxExecutionResult {
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
    chunkSha256s: readonly string[]
    programAudioSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
    outputTransport: 'server_committed_private_stream_v1'
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness'] & {
    independentDecodedVideoQaRequired: true
    independentDecodedAudioQaRequired: true
    privateDownloadReconciliationRequired: true
  }
}

export interface OfflineContinuousProgramAudioQaExecutionResult {
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
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness']
}

export interface OfflineColorPixelAnalysis {
  sampledFrameCount: number
  sampledPixelCount: number
  meanRed: number
  meanGreen: number
  meanBlue: number
  meanLuma: number
  minimumLuma: number
  maximumLuma: number
  blackLumaFraction: number
  whiteLumaFraction: number
}

export interface OfflineCrossChunkColorContinuityExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    leftChunkSha256: string
    rightChunkSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: Readonly<{
      leftProbe: OfflineMediaBinaryConfinementEvidence
      leftAnalysis: OfflineMediaBinaryConfinementEvidence
      rightProbe: OfflineMediaBinaryConfinementEvidence
      rightAnalysis: OfflineMediaBinaryConfinementEvidence
    }>
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness']
}

export interface OfflineFinalMasterVideoQaExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: Readonly<{
      technicalProbe: OfflineMediaBinaryConfinementEvidence
      decodedFrameIntegrity: OfflineMediaBinaryConfinementEvidence
      visualAnomalyScan: OfflineMediaBinaryConfinementEvidence
    }>
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness'] & {
    exactPrivateArtifactDecoded: true
    longFormCheckpointingReady: false
    googleCloudWorkerReady: false
    canonicalLeaseVerified: false
    singleUseDispatchVerified: false
    internalCostEvidenceReconciled: false
    canonicalQaAggregationReady: false
    publicDeliveryReady: false
  }
}

export interface OfflineFinalMasterAudioQaExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: Readonly<{
      technicalProbe: OfflineMediaBinaryConfinementEvidence
      decodedAudioIntegrity: OfflineMediaBinaryConfinementEvidence
      audioQualityScan: OfflineMediaBinaryConfinementEvidence
    }>
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: OfflineFfmpegExecutionResult['attestation']
  readiness: OfflineFfmpegExecutionResult['readiness'] & {
    exactPrivateArtifactDecoded: true
    speechClarityEvidenceReconciled: true
    longFormCheckpointingReady: false
    googleCloudWorkerReady: false
    canonicalLeaseVerified: false
    singleUseDispatchVerified: false
    internalCostEvidenceReconciled: false
    canonicalQaAggregationReady: false
    publicDeliveryReady: false
  }
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
