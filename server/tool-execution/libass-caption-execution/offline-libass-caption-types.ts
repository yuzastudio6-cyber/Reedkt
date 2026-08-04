import type { OfflineLibassCaptionRequest } from './offline-libass-caption-protocol'

export interface OfflineLibassImageEvidence {
  imageTag: 'reeditpro-offline-libass-caption-execution:private-local-v1'
  imageId: string
  imageIdentityHash: string
  libassVersion: '0.17.5'
  libassSourceSha256: 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a'
  sourceHashes: Readonly<Record<string, string>>
  imageUser: '10001:10001'
  imageEntrypoint: readonly ['/opt/reeditpro-caption-runner']
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}
export interface OfflineLibassConfinementEvidence {
  networkMode: 'none'; readOnlyRootFilesystem: true; capDropAll: true; noNewPrivileges: true; privileged: false
  pidsLimit: 64; memoryLimitBytes: 268435456; memoryAndSwapLimitBytes: 268435456; nanoCpus: 1000000000
  tmpfsPath: '/tmp'; tmpfsSizeBytes: 33554432; tmpfsNoExec: true; tmpfsNoSuid: true; tmpfsNoDevice: true
  user: '10001:10001'; callerBindsPresent: false; callerMountsPresent: false; callerEnvironmentPresent: false
  serverDerivedArgumentsOnly: true; secretLikeImageEnvironmentNames: readonly []
}
export interface OfflineLibassCaptionResult {
  schemaVersion: 'offline-libass-caption-execution-result-v1'
  request: OfflineLibassCaptionRequest
  imageArtifact: {
    mimeType: 'image/png'; bytes: Buffer; byteLength: number; sha256: string
    width: number; height: number; channels: 4; hasAlpha: true
    nonTransparentPixelCount: number; alphaBoundingBox: { left: number; top: number; width: number; height: number }
  }
  evidence: {
    toolId: 'libass'; operationId: 'tool.libass.render_approved_caption_track.v1'
    binaryName: 'libass'; binaryVersion: '0.17.5'; sourceSha256: string
    requestEnvelopeSha256: string; resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    image: OfflineLibassImageEvidence; confinement: OfflineLibassConfinementEvidence
    containerExitCode: 0; oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-libass-caption-execution-attestation-v1'; recordId: string; completedAt: string
    imageIdentityHash: string; requestEnvelopeSha256: string; resultSha256: string; confinementHash: string; attestationHash: string
  }
  readiness: { privateInternalOnly: true; productReady: false; externalBetaReady: false; productionReady: false; fullTrackOrVideoBurnInReady: false }
}
export interface OfflineLibassRuntimeAuthority {
  schemaVersion: 'offline-libass-caption-runtime-authority-v1'; source: 'private_local_offline_libass_caption_runtime_authority'
  activatedAt: string; image: OfflineLibassImageEvidence
  supportedOperations: readonly [{ toolId: 'libass'; operationId: 'tool.libass.render_approved_caption_track.v1' }]
  readiness: { privateInternalExecutionReady: true; exactStructuredPayloadOnly: true; canonicalDispatchMayReference: true; productReady: false; externalBetaReady: false; productionReady: false; fullTrackOrVideoBurnInReady: false }
  blockers: readonly string[]; authorityHash: string
}
