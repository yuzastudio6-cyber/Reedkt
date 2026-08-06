import type { OfflineNodeRunnerSvgSemanticEvidence } from '../node-runners'

export const OFFLINE_NODE_RUNNER_ACTIVATION_VERSION = 'offline-node-runner-activation-v1' as const
export const OFFLINE_NODE_RUNNER_ACTIVATION_RECORD_VERSION =
  'offline-node-runner-activation-record-v1' as const

export type ActivatedOfflineNodeToolId =
  | 'd3'
  | 'echarts'
  | 'vega_lite'
  | 'vega'
  | 'satori'
  | 'viz_js'

export interface OfflineNodeRunnerResourceUsageEvidence {
  wallTimeMicroseconds: number
  userCpuMicroseconds: number
  systemCpuMicroseconds: number
  maxRssKilobytes: number
  minorPageFaults: number
  majorPageFaults: number
  voluntaryContextSwitches: number
  involuntaryContextSwitches: number
  fsReadOperations: number
  fsWriteOperations: number
  rssBytesBefore: number
  rssBytesAfter: number
  heapUsedBytesBefore: number
  heapUsedBytesAfter: number
}

export interface OfflineNodeRunnerConfinementEvidence {
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
  entrypoint: readonly ['node', '--no-warnings', '/app/offline-node-runner-cli.mjs']
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
}

export interface OfflineNodeRunnerPackageEvidence {
  packageName: string
  version: string
  packageJsonSha256: string
  invokedEntrypoints: readonly string[]
}

export interface OfflineNodeRunnerSuccessfulOperationEvidence {
  toolId: ActivatedOfflineNodeToolId
  operationId: string
  repetition: 1 | 2
  status: 'actual_library_operation_completed'
  inputSha256: string
  svgSha256: string
  svgByteLength: number
  verificationJsonSha256: string
  verificationJsonByteLength: number
  semanticEvidence: OfflineNodeRunnerSvgSemanticEvidence
  packageIdentity: OfflineNodeRunnerPackageEvidence
  bundleSha256: string
  bundleByteLength: number
  runtimeIdentity: {
    nodeVersion: string
    platform: 'linux'
    architecture: string
    uid: 10001
    gid: 10001
  }
  processResourceUsage: OfflineNodeRunnerResourceUsageEvidence
  confinement: OfflineNodeRunnerConfinementEvidence
  containerExitCode: 0
  oomKilled: false
}

export interface OfflineNodeRunnerDeterminismEvidence {
  toolId: ActivatedOfflineNodeToolId
  operationId: string
  inputSha256: string
  svgSha256: string
  verificationJsonSha256: string
  packageJsonSha256: string
  bundleSha256: string
  repetitionsCompared: 2
  identical: true
}

export interface OfflineNodeRunnerAdversarialEvidence {
  caseId: string
  toolId: ActivatedOfflineNodeToolId | 'unknown_tool'
  rejectionKind: 'spoofed_operation' | 'prohibited_extra_field' | 'unknown_tool'
  errorCode: 'INVALID_INPUT'
  containerExitCode: 2
  stdoutEmpty: true
  rejected: true
  confinementConfigurationHash: string
  oomKilled: false
}

export interface OfflineNodeRunnerActivationAttestation {
  schemaVersion: typeof OFFLINE_NODE_RUNNER_ACTIVATION_VERSION
  source: 'private_local_docker_offline_node_runner_activation'
  startedAt: string
  completedAt: string
  build: {
    imageTag: 'reeditpro-offline-node-runners:local-activation-v1'
    pinnedBaseImage: 'node:24-bookworm-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5'
    baseImageDigest: 'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5'
    dependencyLockSha256: string
    dockerfileSha256: string
    containerEntrypointSourceSha256: string
    dockerServerVersion: string
    dockerServerArchitecture: string
    imageId: string
    imageManifestSha256: string
    imageConfigSha256: string
    imageIdentityHash: string
    rootFilesystemLayerDigests: readonly string[]
    imageLabels: Readonly<Record<string, string>>
    imageUser: '10001:10001'
    imageEntrypoint: readonly ['node', '--no-warnings', '/app/offline-node-runner-cli.mjs']
    imageEnvironmentNames: readonly string[]
  }
  runnerBundle: {
    sha256: string
    byteLength: number
  }
  packages: readonly OfflineNodeRunnerPackageEvidence[]
  successfulOperations: readonly OfflineNodeRunnerSuccessfulOperationEvidence[]
  deterministicOperations: readonly OfflineNodeRunnerDeterminismEvidence[]
  adversarialCases: readonly OfflineNodeRunnerAdversarialEvidence[]
  summary: {
    canonicalToolCount: 6
    successfulContainerRunCount: 12
    deterministicOperationCount: 6
    adversarialCaseCount: 13
    confinedContainerCount: 25
    actualLibraryExecutionObserved: true
    allArtifactsPrivate: true
    allOutputsSemanticallyVerified: true
    allOperationsDeterministicAcrossTwoRuns: true
    allAdversarialInputsRejected: true
  }
  readiness: {
    privateInternalActivationEvidenceOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    dispatchAuthorityChanged: false
  }
  blockers: readonly string[]
  attestationHash: string
}

export interface PersistedOfflineNodeRunnerActivationAttestation {
  recordVersion: typeof OFFLINE_NODE_RUNNER_ACTIVATION_RECORD_VERSION
  source: 'private_local_checksum_protected_offline_node_runner_activation'
  attestation: OfflineNodeRunnerActivationAttestation
  checksumSha256: string
}
