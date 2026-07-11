import type { OfflineNodeRunnerSvgSemanticEvidence } from '../node-runners'
import type {
  OfflineNodeStructuredExecutionRequest,
} from './offline-node-structured-execution-protocol'

export const OFFLINE_NODE_STRUCTURED_EXECUTION_RESULT_VERSION =
  'offline-node-structured-execution-result-v1' as const
export const OFFLINE_NODE_STRUCTURED_EXECUTION_ATTESTATION_VERSION =
  'offline-node-structured-execution-attestation-v1' as const
export const OFFLINE_NODE_STRUCTURED_EXECUTION_RECORD_VERSION =
  'offline-node-structured-execution-record-v1' as const
export const OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_VERSION =
  'offline-node-structured-runtime-authority-v1' as const
export const OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION =
  'offline-node-structured-runtime-authority-record-v1' as const

export interface OfflineNodeStructuredExecutionConfinementEvidence {
  configurationHash: string
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 64
  memoryLimitBytes: 805306368
  memoryAndSwapLimitBytes: 805306368
  nanoCpus: 1000000000
  tmpfsPath: '/tmp'
  tmpfsSizeBytes: 67108864
  tmpfsNoExec: true
  tmpfsNoSuid: true
  tmpfsNoDevice: true
  user: '10001:10001'
  entrypoint: readonly [
    'node',
    '--no-warnings',
    '/app/offline-node-structured-execution-cli.mjs',
  ]
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
}

export interface OfflineNodeStructuredExecutionImageEvidence {
  imageTag: 'reeditpro-offline-node-structured-execution:private-local-v1'
  imageId: string
  imageIdentityHash: string
  pinnedBaseImage: 'node:24-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5'
  baseImageDigest: 'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5'
  dependencyLockSha256: string
  dockerfileSha256: string
  imageUser: '10001:10001'
  imageEntrypoint: readonly [
    'node',
    '--no-warnings',
    '/app/offline-node-structured-execution-cli.mjs',
  ]
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}

export interface OfflineNodeStructuredExecutionEvidence {
  toolId: OfflineNodeStructuredExecutionRequest['toolId']
  operationId: string
  requestEnvelopeSha256: string
  runnerInputSha256: string
  packageName: string
  packageVersion: string
  packageJsonSha256: string
  invokedEntrypoints: readonly string[]
  runnerBundleSha256: string
  runnerBundleByteLength: number
  svgSha256: string
  svgByteLength: number
  verificationJsonSha256: string
  verificationJsonByteLength: number
  semanticEvidence: OfflineNodeRunnerSvgSemanticEvidence
  runtimeIdentity: {
    nodeVersion: string
    platform: 'linux'
    architecture: string
    uid: 10001
    gid: 10001
  }
  processResourceUsage: Readonly<Record<string, number>>
  confinement: OfflineNodeStructuredExecutionConfinementEvidence
  containerExitCode: 0
  oomKilled: false
}

export interface OfflineNodeStructuredExecutionAttestation {
  schemaVersion: typeof OFFLINE_NODE_STRUCTURED_EXECUTION_ATTESTATION_VERSION
  source: 'private_local_docker_structured_payload_execution'
  recordId: string
  completedAt: string
  requestIdentity: {
    toolId: OfflineNodeStructuredExecutionRequest['toolId']
    operationId: string
    requestEnvelopeSha256: string
  }
  image: OfflineNodeStructuredExecutionImageEvidence
  execution: OfflineNodeStructuredExecutionEvidence
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    canonicalDispatchIntegrated: false
  }
  blockers: readonly string[]
  attestationHash: string
}

export interface PersistedOfflineNodeStructuredExecutionAttestation {
  recordVersion: typeof OFFLINE_NODE_STRUCTURED_EXECUTION_RECORD_VERSION
  source: 'private_local_checksum_protected_structured_execution'
  attestation: OfflineNodeStructuredExecutionAttestation
  checksumSha256: string
}

export interface OfflineNodeStructuredExecutionResult {
  schemaVersion: typeof OFFLINE_NODE_STRUCTURED_EXECUTION_RESULT_VERSION
  svg: {
    mimeType: 'image/svg+xml'
    bytes: Buffer
    sha256: string
    byteLength: number
  }
  verificationJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: OfflineNodeStructuredExecutionEvidence
  attestation: OfflineNodeStructuredExecutionAttestation
  readiness: OfflineNodeStructuredExecutionAttestation['readiness']
}

export interface OfflineNodeStructuredRuntimeAuthority {
  schemaVersion: typeof OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_VERSION
  source: 'private_local_offline_node_structured_runtime_authority'
  activatedAt: string
  image: OfflineNodeStructuredExecutionImageEvidence
  supportedOperations: ReadonlyArray<{
    toolId: OfflineNodeStructuredExecutionRequest['toolId']
    operationId: string
  }>
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}

export interface PersistedOfflineNodeStructuredRuntimeAuthority {
  recordVersion: typeof OFFLINE_NODE_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION
  source: 'private_local_checksum_protected_structured_runtime_authority'
  authority: OfflineNodeStructuredRuntimeAuthority
  checksumSha256: string
}
