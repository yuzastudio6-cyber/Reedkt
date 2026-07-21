import type { OfflineRemotionRenderRequest } from './offline-remotion-render-execution-protocol'
import type { OfflineRemotionStreamingRenderRequest } from './offline-remotion-render-streaming-protocol'
import type { OfflineRemotionLongFormMergeStreamingRequest } from './offline-remotion-long-form-merge-protocol'
import type { OfflineRemotionDeliveryH264ChunkRequest } from
  './offline-remotion-delivery-h264-chunk-protocol'

export interface OfflineRemotionImageEvidence {
  imageTag: `reeditpro-offline-remotion-render-execution:canonical-private-local-v1-${string}`
  imageId: string
  imageIdentityHash: string
  pinnedBaseImage: 'node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf'
  sourceHashes: Readonly<Record<string, string>>
  sourceTreeSha256: string
  imageUser: '10001:10001'
  imageEntrypoint: readonly ['node', '/app/runner.mjs']
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}

export interface OfflineRemotionConfinementEvidence {
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 256
  memoryLimitBytes: 4294967296 | 8589934592
  memoryAndSwapLimitBytes: 4294967296 | 8589934592
  nanoCpus: 2000000000 | 4000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 1073741824 | 7516192768
  tmpfsNoExec: true
  tmpfsNoSuid: true
  tmpfsNoDevice: true
  shmSizeBytes: 536870912 | 1073741824
  user: '10001:10001'
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
}

export interface OfflineRemotionDeliveryH264ChunkStreamingResult {
  schemaVersion: 'offline-remotion-delivery-h264-chunk-stream-execution-result-v1'
  request: OfflineRemotionDeliveryH264ChunkRequest
  artifact: OfflineRemotionStreamingRenderResult['artifact']
  evidence: OfflineRemotionStreamingRenderResult['evidence'] & {
    resourceProfileId: 'delivery_h264_chunk_cpu_4vcpu_8gib_v1'
  }
  attestation: {
    schemaVersion:
      'offline-remotion-delivery-h264-chunk-stream-execution-attestation-v1'
    recordId: string
    completedAt: string
    imageIdentityHash: string
    requestEnvelopeSha256: string
    artifactSha256: string
    artifactByteLength: number
    confinementHash: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    privateInternalDeliveryH264ChunkReady: true
    independentChunkQaVerified: false
    serverInjectedStreamingReady: true
    canonicalDispatchIntegrated: false
  }
}

export interface OfflineRemotionRenderResult {
  schemaVersion: 'offline-remotion-render-execution-result-v1'
  request: OfflineRemotionRenderRequest
  artifact: {
    mimeType: 'video/mp4'
    bytes: Buffer
    byteLength: number
    sha256: string
    width: number
    height: number
    fps: number
    durationFrames: number
    durationSeconds: number
  }
  evidence: {
    packageName: 'remotion+@remotion/renderer'
    packageVersion: '4.0.487'
    requestEnvelopeSha256: string
    image: OfflineRemotionImageEvidence
    confinement: OfflineRemotionConfinementEvidence
    semanticEvidence: Readonly<Record<string, true>>
    containerExitCode: 0
    oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-remotion-render-execution-attestation-v1'
    recordId: string
    completedAt: string
    imageIdentityHash: string
    requestEnvelopeSha256: string
    artifactSha256: string
    confinementHash: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    privateInternalFinalCompositionReady: true
    canonicalDispatchIntegrated: false
  }
}

export interface OfflineRemotionStreamingRenderResult {
  schemaVersion: 'offline-remotion-render-stream-execution-result-v2'
  request: OfflineRemotionStreamingRenderRequest
  artifact: {
    mimeType: 'video/mp4'
    byteLength: number
    sha256: string
    width: number
    height: number
    fps: number
    durationFrames: number
    durationSeconds: number
  }
  evidence: {
    packageName: 'remotion+@remotion/renderer'
    packageVersion: '4.0.487'
    requestEnvelopeSha256: string
    image: OfflineRemotionImageEvidence
    confinement: OfflineRemotionConfinementEvidence
    semanticEvidence: Readonly<Record<string, true>>
    inputTransport: 'length_framed_server_injected_private_stream_v2'
    outputTransport: 'length_committed_private_stream_v2'
    containerExitCode: 0
    oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-remotion-render-stream-execution-attestation-v2'
    recordId: string
    completedAt: string
    imageIdentityHash: string
    requestEnvelopeSha256: string
    artifactSha256: string
    artifactByteLength: number
    confinementHash: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    privateInternalFinalCompositionReady: true
    serverInjectedStreamingReady: true
    canonicalDispatchIntegrated: false
  }
}

export interface OfflineRemotionLongFormMergeStreamingResult {
  schemaVersion: 'offline-remotion-long-form-merge-stream-execution-result-v1'
  request: OfflineRemotionLongFormMergeStreamingRequest
  artifact: OfflineRemotionStreamingRenderResult['artifact']
  evidence: OfflineRemotionStreamingRenderResult['evidence']
  attestation: {
    schemaVersion: 'offline-remotion-long-form-merge-stream-execution-attestation-v1'
    recordId: string
    completedAt: string
    imageIdentityHash: string
    requestEnvelopeSha256: string
    artifactSha256: string
    artifactByteLength: number
    confinementHash: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    privateInternalFinalCompositionReady: true
    privateInternalLongFormMergeReady: true
    serverInjectedStreamingReady: true
    canonicalDispatchIntegrated: false
  }
}

export interface OfflineRemotionRuntimeAuthority {
  schemaVersion: 'offline-remotion-render-runtime-authority-v1'
  source: 'private_local_offline_remotion_render_runtime_authority'
  activatedAt: string
  image: OfflineRemotionImageEvidence
  supportedOperations: readonly [{ toolId: 'remotion'; operationId: 'tool.remotion.render_approved_composition.v1' }]
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    privateInternalFinalCompositionReady: true
    serverInjectedStreamingFinalCompositionReady: true
    serverInjectedStreamingLongFormMergeReady: true
    serverInjectedStreamingDeliveryH264ChunkReady: true
    finalExportReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}
