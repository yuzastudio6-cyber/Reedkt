import type { OfflineRemotionRenderRequest } from './offline-remotion-render-execution-protocol'

export interface OfflineRemotionImageEvidence {
  imageTag: 'reeditpro-offline-remotion-render-execution:private-local-v1'
  imageId: string
  imageIdentityHash: string
  pinnedBaseImage: 'node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf'
  sourceHashes: Readonly<Record<string, string>>
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
  memoryLimitBytes: 2147483648
  memoryAndSwapLimitBytes: 2147483648
  nanoCpus: 2000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 536870912
  tmpfsNoExec: true
  tmpfsNoSuid: true
  tmpfsNoDevice: true
  shmSizeBytes: 268435456
  user: '10001:10001'
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
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
    finalExportReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}
