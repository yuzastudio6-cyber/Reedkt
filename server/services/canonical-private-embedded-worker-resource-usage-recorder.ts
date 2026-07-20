import type { PrivateEmbeddedProcessResourceObservation } from '../tool-execution/private-embedded-process-resource-observation'
import { resolveCompleteProfessionalToolOperationSpec } from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  createPrivateWorkerObserverSnapshotsFromEmbeddedObservation,
  createPrivateWorkerResourceUsageCostEvidence,
  hashPrivateWorkerResourceArtifactManifest,
  readPrivateWorkerResourceUsageCostEvidence,
  type PrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

interface ResourceArtifactIdentity {
  artifactId: string
  sha256: string
  byteLength: number
}

export interface RecordCanonicalPrivateEmbeddedWorkerResourceUsageInput {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  packageRecordId: string
  packageHash: string
  approvedWorkItemId: string
  approvedWorkItemHash: string
  jobId: string
  executionAttemptId: string
  attemptOrdinal: number
  leaseId: string
  leaseHash: string
  leaseExpiresAt: string
  dispatchGrantId: string
  dispatchGrantHash: string
  idempotencyKey: string
  canonicalToolId: string
  operationId: string
  runnerClass: string
  runtimeAuthorityDigest: string
  runtimeImageDigest: string
  runtimeAttestationDigest: string
  observation: PrivateEmbeddedProcessResourceObservation
  allocation: {
    nanoCpus: number
    memoryLimitBytes: number
  }
  attemptInputHash: string
  inputArtifacts: readonly ResourceArtifactIdentity[]
  outputArtifact: ResourceArtifactIdentity
  createdAt: string
}

/**
 * Commits one actual private-container CPU/memory interval to the exact
 * canonical attempt. It is deliberately local/unreleased evidence and never
 * carries provider cost, customer price, credits, fees, billing, or wallet
 * authority.
 */
export async function recordCanonicalPrivateEmbeddedWorkerResourceUsage(
  input: RecordCanonicalPrivateEmbeddedWorkerResourceUsageInput,
): Promise<{
  evidence: PrivateWorkerResourceUsageCostEvidence
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const identity = {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: input.approvedPlanSnapshotHash,
    packageRecordId: input.packageRecordId,
    packageHash: input.packageHash,
    approvedWorkItemId: input.approvedWorkItemId,
    approvedWorkItemHash: input.approvedWorkItemHash,
    jobId: input.jobId,
    executionAttemptId: input.executionAttemptId,
    attemptOrdinal: input.attemptOrdinal,
    leaseId: input.leaseId,
    leaseHash: input.leaseHash,
    dispatchGrantId: input.dispatchGrantId,
    dispatchGrantHash: input.dispatchGrantHash,
    idempotencyKeyHash: sha256AuthorityValue({
      domain: 'canonical_private_embedded_worker_usage_idempotency_v1',
      ownerUserId: input.ownerUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      executionAttemptId: input.executionAttemptId,
      idempotencyKey: input.idempotencyKey,
    }),
  }
  const inputArtifacts = input.inputArtifacts.map((artifact) => ({ ...artifact }))
  const outputArtifacts = [{ ...input.outputArtifact }]
  const existing = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  if (existing) {
    assertIdempotentExistingEvidence(existing, {
      identity,
      canonicalToolId: input.canonicalToolId,
      operationId: input.operationId,
      attemptInputHash: input.attemptInputHash,
      inputArtifacts,
      outputArtifacts,
    })
    return { evidence: existing, idempotencyStatus: 'duplicate_returned' }
  }

  const runtimeExecutionIdentityDigest = sha256AuthorityValue({
    domain: 'canonical_private_embedded_runtime_execution_identity_v1',
    executionAttemptId: input.executionAttemptId,
    runnerClass: input.runnerClass,
    runtimeAuthorityDigest: input.runtimeAuthorityDigest,
    runtimeImageDigest: input.runtimeImageDigest,
    runtimeAttestationDigest: input.runtimeAttestationDigest,
    containerIdentityDigest: input.observation.containerIdentityDigest,
  })
  const snapshots = createPrivateWorkerObserverSnapshotsFromEmbeddedObservation({
    observation: input.observation,
    runtimeExecutionIdentityDigest,
  })
  if (
    !Number.isSafeInteger(input.allocation.nanoCpus)
    || input.allocation.nanoCpus < 1_000_000_000
    || input.allocation.nanoCpus % 1_000_000_000 !== 0
    || !Number.isSafeInteger(input.allocation.memoryLimitBytes)
    || input.allocation.memoryLimitBytes < 128 * 1_024 * 1_024
    || input.allocation.memoryLimitBytes % (1_024 * 1_024) !== 0
  ) {
    throw invalid('Embedded worker confinement cannot be represented by exact cost allocation units.')
  }
  const operationSpec = resolveCompleteProfessionalToolOperationSpec(input.canonicalToolId)
  if (
    !operationSpec
    || !operationSpec.allowedOperationIds.includes(input.operationId)
    || !operationSpec.privateInternalExecutionReady
  ) {
    throw invalid('Embedded worker operation lost its exact private runner authority.')
  }
  return createPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.localStorageRoot,
    evidenceClass: 'private_embedded_observed_usage_test',
    operation: {
      kind: 'registered_tool_operation',
      canonicalToolId: input.canonicalToolId,
      operationId: input.operationId,
    },
    identity,
    attemptInputHash: input.attemptInputHash,
    runtime: {
      workerClass: operationSpec.workerRuntime.registryWorkerType,
      runtimeExecutionIdentityDigest,
      runtimeImageDigest: input.runtimeImageDigest,
      runtimeAttestationDigest: input.runtimeAttestationDigest,
      containerIdentityDigest: input.observation.containerIdentityDigest,
      cloudExecutionResourceDigest: null,
      measurementAgentVersion: input.observation.measurementAgentVersion,
      measurementAgentDigest: input.observation.measurementAgentDigest,
      leaseExpiresAt: input.leaseExpiresAt,
    },
    allocation: {
      vcpuCount: input.allocation.nanoCpus / 1_000_000_000,
      memoryMib: input.allocation.memoryLimitBytes / (1_024 * 1_024),
      gpuCount: 0,
    },
    startSnapshot: snapshots.start,
    finishSnapshot: snapshots.finish,
    input: {
      artifacts: inputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'input',
        artifacts: inputArtifacts,
      }),
    },
    output: {
      disposition: 'accepted',
      artifacts: outputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'output',
        artifacts: outputArtifacts,
      }),
    },
    networkEgressBytes: 0,
    outcome: { state: 'completed', failureCategory: 'none' },
    createdAt: input.createdAt,
  })
}

function assertIdempotentExistingEvidence(
  evidence: PrivateWorkerResourceUsageCostEvidence,
  expected: {
    identity: PrivateWorkerResourceUsageCostEvidence['identity']
    canonicalToolId: string
    operationId: string
    attemptInputHash: string
    inputArtifacts: ResourceArtifactIdentity[]
    outputArtifacts: ResourceArtifactIdentity[]
  },
): void {
  if (
    evidence.evidenceClass !== 'private_embedded_observed_usage_test'
    || evidence.operation.kind !== 'registered_tool_operation'
    || evidence.operation.canonicalToolId !== expected.canonicalToolId
    || evidence.operation.operationId !== expected.operationId
    || evidence.attemptInputHash !== expected.attemptInputHash
    || stableAuthorityStringify(evidence.input.artifacts) !==
      stableAuthorityStringify(expected.inputArtifacts)
    || evidence.input.manifestHash !== hashPrivateWorkerResourceArtifactManifest({
      direction: 'input',
      artifacts: expected.inputArtifacts,
    })
    || stableAuthorityStringify(evidence.output.artifacts) !==
      stableAuthorityStringify(expected.outputArtifacts)
    || evidence.output.manifestHash !== hashPrivateWorkerResourceArtifactManifest({
      direction: 'output',
      artifacts: expected.outputArtifacts,
    })
    || stableAuthorityStringify(evidence.identity) !==
      stableAuthorityStringify(expected.identity)
    || evidence.outcome.state !== 'completed'
    || evidence.output.disposition !== 'accepted'
    || evidence.commercialBoundary.customerPriceIncluded
    || evidence.commercialBoundary.customerCreditsIncluded
    || evidence.commercialBoundary.serviceFeeIncluded
    || evidence.commercialBoundary.walletMutationPerformed
    || evidence.commercialBoundary.billingMutationPerformed
  ) {
    throw invalid('Existing worker resource evidence conflicts with this idempotent canonical attempt.')
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_private_embedded_worker_resource_usage_integrity',
  })
}
