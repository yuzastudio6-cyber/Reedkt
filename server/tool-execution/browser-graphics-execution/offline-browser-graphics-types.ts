import type { OfflineBrowserGraphicsRequest, OfflineBrowserGraphicsToolId } from './offline-browser-graphics-protocol'

export interface OfflineBrowserGraphicsImageEvidence {
  imageTag: 'reeditpro-offline-browser-graphics-execution:private-local-v1'
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

export interface OfflineBrowserGraphicsConfinementEvidence {
  networkMode: 'none'; readOnlyRootFilesystem: true; capDropAll: true; noNewPrivileges: true; privileged: false
  pidsLimit: 256; memoryLimitBytes: 2147483648; memoryAndSwapLimitBytes: 2147483648; nanoCpus: 2000000000
  tmpfsPath: '/tmp'; tmpfsSizeBytes: 536870912; tmpfsNoExec: true; tmpfsNoSuid: true; tmpfsNoDevice: true
  shmSizeBytes: 268435456; user: '10001:10001'; callerCommandPresent: false; callerBindsPresent: false
  callerMountsPresent: false; callerEnvironmentPresent: false; secretLikeImageEnvironmentNames: readonly []
}

export interface OfflineBrowserGraphicsExecutionResult {
  schemaVersion: 'offline-browser-graphics-execution-result-v1'
  request: OfflineBrowserGraphicsRequest
  artifact: { mimeType: 'image/png'; bytes: Buffer; byteLength: number; sha256: string; width: 640; height: 360 }
  evidence: {
    packageName: string; packageVersion: string; requestEnvelopeSha256: string
    image: OfflineBrowserGraphicsImageEvidence; confinement: OfflineBrowserGraphicsConfinementEvidence
    semanticEvidence: Readonly<Record<string, boolean | number | string>>; networkRequestCount: 0
    containerExitCode: 0; oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-browser-graphics-execution-attestation-v1'; recordId: string; completedAt: string
    toolId: OfflineBrowserGraphicsToolId; imageIdentityHash: string; requestEnvelopeSha256: string
    artifactSha256: string; confinementHash: string; attestationHash: string
  }
  readiness: { privateInternalOnly: true; exactStructuredPayloadOnly: true; canonicalDispatchIntegrated: false; productReady: false; externalBetaReady: false; productionReady: false }
}

export interface OfflineBrowserGraphicsRuntimeAuthority {
  schemaVersion: 'offline-browser-graphics-runtime-authority-v1'
  source: 'private_local_offline_browser_graphics_runtime_authority'
  activatedAt: string
  image: OfflineBrowserGraphicsImageEvidence
  supportedOperations: readonly { toolId: OfflineBrowserGraphicsToolId; operationId: string }[]
  readiness: { privateInternalExecutionReady: true; exactStructuredPayloadOnly: true; canonicalDispatchMayReference: true; productReady: false; externalBetaReady: false; productionReady: false }
  blockers: readonly string[]
  authorityHash: string
}
