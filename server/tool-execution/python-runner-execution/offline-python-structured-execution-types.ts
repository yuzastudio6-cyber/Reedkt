import type { OfflinePythonStructuredToolId } from './offline-python-structured-execution-protocol'
import type { PrivateEmbeddedProcessResourceObservation } from '../private-embedded-process-resource-observation'

export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_RESULT_VERSION =
  'offline-python-structured-execution-result-v1' as const
export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_ATTESTATION_VERSION =
  'offline-python-structured-execution-attestation-v1' as const
export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_RECORD_VERSION =
  'offline-python-structured-execution-record-v1' as const
export const OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_VERSION =
  'offline-python-structured-runtime-authority-v1' as const
export const OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION =
  'offline-python-structured-runtime-authority-record-v1' as const

export interface OfflinePythonStructuredConfinementEvidence {
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
  entrypoint: readonly ['python', '-s', '/app/runner.py']
  callerCommandPresent: false
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  secretLikeImageEnvironmentNames: readonly []
}

export interface OfflinePythonStructuredImageEvidence {
  imageTag: 'reeditpro-offline-python-structured-execution:private-local-v1'
  imageId: string
  imageIdentityHash: string
  pinnedBaseImage: 'python:3.13.11-slim-bookworm@sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0'
  baseImageDigest: 'sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0'
  requirementsLockSha256: string
  sceneDetectLockSha256: string
  runnerSha256: string
  dockerfileSha256: string
  imageUser: '10001:10001'
  imageEntrypoint: readonly ['python', '-s', '/app/runner.py']
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}

export interface OfflinePythonStructuredExecutionEvidence {
  toolId: OfflinePythonStructuredToolId
  operationId: string
  packageName: string
  packageVersion: string
  requestEnvelopeSha256: string
  resultSha256: string
  semanticEvidence: Readonly<Record<string, unknown>>
  runtimeIdentity: {
    pythonVersion: '3.13.11'
    platform: 'linux'
    architecture: string
    uid: 10001
    gid: 10001
  }
  processResourceUsage: Readonly<Record<string, number>>
  resourceObservation: PrivateEmbeddedProcessResourceObservation
  confinement: OfflinePythonStructuredConfinementEvidence
  containerExitCode: 0
  oomKilled: false
}

export interface OfflinePythonStructuredExecutionAttestation {
  schemaVersion: typeof OFFLINE_PYTHON_STRUCTURED_EXECUTION_ATTESTATION_VERSION
  source: 'private_local_docker_structured_python_execution'
  recordId: string
  completedAt: string
  requestIdentity: {
    toolId: OfflinePythonStructuredToolId
    operationId: string
    requestEnvelopeSha256: string
  }
  image: OfflinePythonStructuredImageEvidence
  execution: OfflinePythonStructuredExecutionEvidence
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

export interface OfflinePythonStructuredExecutionResult {
  schemaVersion: typeof OFFLINE_PYTHON_STRUCTURED_EXECUTION_RESULT_VERSION
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: OfflinePythonStructuredExecutionEvidence
  attestation: OfflinePythonStructuredExecutionAttestation
  readiness: OfflinePythonStructuredExecutionAttestation['readiness']
}

export interface OfflinePythonStructuredRuntimeAuthority {
  schemaVersion: typeof OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_VERSION
  source: 'private_local_offline_python_structured_runtime_authority'
  activatedAt: string
  image: OfflinePythonStructuredImageEvidence
  supportedOperations: ReadonlyArray<{ toolId: OfflinePythonStructuredToolId; operationId: string }>
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

export interface PersistedOfflinePythonStructuredRuntimeAuthority {
  recordVersion: typeof OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RECORD_VERSION
  source: 'private_local_checksum_protected_python_runtime_authority'
  authority: OfflinePythonStructuredRuntimeAuthority
  checksumSha256: string
}

export interface PersistedOfflinePythonStructuredExecutionAttestation {
  recordVersion: typeof OFFLINE_PYTHON_STRUCTURED_EXECUTION_RECORD_VERSION
  source: 'private_local_checksum_protected_python_execution'
  attestation: OfflinePythonStructuredExecutionAttestation
  checksumSha256: string
}
