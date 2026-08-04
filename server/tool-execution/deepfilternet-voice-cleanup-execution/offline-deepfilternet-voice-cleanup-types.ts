import type { OfflineDeepFilterNetVoiceCleanupRequest, OfflineDeepFilterNetVoiceCleanupToolId } from './offline-deepfilternet-voice-cleanup-protocol'

export interface OfflineDeepFilterNetVoiceCleanupImageEvidence {
  imageTag: 'reeditpro-offline-deepfilternet-voice-cleanup-execution:private-local-v1'
  imageId: string
  imageIdentityHash: string
  pinnedBaseImage: 'python:3.11.15-slim-bookworm@sha256:f5cf0344c9886ff24d34797578d5d7dd6e8911ae0fe5962bb55d0f89603ec361'
  debianSnapshot: '20260623T000000Z'
  sourceHashes: Readonly<Record<string, string>>
  imageUser: '10001:10001'
  imageEntrypoint: readonly ['python', '-s', '/app/runner.py']
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}

export interface OfflineDeepFilterNetVoiceCleanupConfinementEvidence {
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 128
  memoryLimitBytes: 4294967296
  memoryAndSwapLimitBytes: 4294967296
  nanoCpus: 4000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 536870912
  tmpfsNoExec: true
  tmpfsNoSuid: true
  tmpfsNoDevice: true
  user: '10001:10001'
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
}

export interface OfflineDeepFilterNetVoiceCleanupExecutionResult {
  schemaVersion: 'offline-deepfilternet-voice-cleanup-execution-result-v1'
  request: OfflineDeepFilterNetVoiceCleanupRequest
  artifact: { mimeType: 'audio/wav'; bytes: Buffer; byteLength: number; sha256: string }
  evidence: {
    packageName: 'DeepFilterNet'
    packageVersion: '0.5.6'
    nativePackageName: 'DeepFilterLib'
    nativePackageVersion: '0.5.6'
    torchVersion: '2.2.2'
    torchaudioVersion: '2.2.2'
    modelId: 'DeepFilterNet3'
    modelArchiveSha256: string
    modelCheckpointSha256: string
    modelConfigSha256: string
    modelUpstreamLicense: 'MIT'
    requestEnvelopeSha256: string
    image: OfflineDeepFilterNetVoiceCleanupImageEvidence
    confinement: OfflineDeepFilterNetVoiceCleanupConfinementEvidence
    semanticEvidence: Readonly<Record<string, boolean | number | string>>
    containerExitCode: 0
    oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-deepfilternet-voice-cleanup-execution-attestation-v1'
    recordId: string
    completedAt: string
    toolId: OfflineDeepFilterNetVoiceCleanupToolId
    imageIdentityHash: string
    requestEnvelopeSha256: string
    artifactSha256: string
    confinementHash: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    exactStructuredPayloadOnly: true
    canonicalDispatchIntegrated: false
    modelAndLicenseReviewStillRequiredForProduction: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineDeepFilterNetVoiceCleanupRuntimeAuthority {
  schemaVersion: 'offline-deepfilternet-voice-cleanup-runtime-authority-v1'
  source: 'private_local_offline_deepfilternet_voice_cleanup_runtime_authority'
  activatedAt: string
  image: OfflineDeepFilterNetVoiceCleanupImageEvidence
  supportedOperations: readonly { toolId: OfflineDeepFilterNetVoiceCleanupToolId; operationId: string }[]
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    modelAndLicenseReviewStillRequiredForProduction: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}
