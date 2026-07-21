import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdtemp } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import { listCompleteProfessionalToolOperationSpecs } from
  '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  assertPrivateWorkerResourceUsageProductionAuthority,
  createPrivateWorkerResourceUsageCostEvidence,
  hashPrivateWorkerResourceArtifactManifest,
  hashPrivateWorkerResourceObserverSnapshot,
  privateWorkerResourceUsageCostEvidenceSchema,
  readPrivateWorkerResourceUsageCostEvidence,
  summarizePrivateWorkerResourceUsageCoverage,
  type CreatePrivateWorkerResourceUsageCostEvidenceInput,
  type PrivateWorkerResourceObserverSnapshot,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-worker-resource-cost-'))

try {
  const specs = listCompleteProfessionalToolOperationSpecs()
  const deepFilterNet = specs.find((spec) =>
    spec.allowedOperationIds.includes('tool.deepfilternet.enhance_voice.v1'))
  assert(deepFilterNet)
  assert.equal(deepFilterNet.privateInternalExecutionReady, true)
  assert.equal(deepFilterNet.workerRuntime.runtimeClass, 'python3_cuda12_gpu_worker')

  const coverage = summarizePrivateWorkerResourceUsageCoverage()
  assert.equal(coverage.registeredToolOperationSpecCount, 72)
  assert.equal(coverage.registeredCanonicalToolIdentityCount, 72)
  assert.equal(coverage.registeredToolOperationIdCount, 72)
  assert.equal(coverage.registeredProviderOperationCount, 2)
  assert.equal(coverage.totalOperationContractCount, 74)
  assert.equal(coverage.toolOperationContractsWithRequiredCpuMemoryMeasurements, 72)
  assert.equal(coverage.providerOperationContractsWithRequiredCpuMemoryMeasurements, 2)
  assert.equal(coverage.totalOperationContractsWithRequiredCpuMemoryMeasurements, 74)
  assert.equal(coverage.registeredGpuToolOperationCount, 13)
  assert.equal(coverage.gpuToolOperationContractsWithRequiredGpuMeasurements, 13)
  assert.equal(coverage.privateInternalRunnerVerifiedToolOperationCount, 53)
  assert.equal(coverage.plannedOrPolicyBlockedToolOperationCount, 19)
  assert.equal(coverage.missingMeasurementOperationIds.length, 0)
  assert.equal(coverage.missingGpuMeasurementOperationIds.length, 0)
  assert.equal(coverage.productReadyCount, 0)
  assert.equal(coverage.providerTransportReadyCount, 0)
  assert.equal(coverage.cloudObservedUsageTransportReadyCount, 0)
  for (const spec of specs.filter((candidate) => candidate.resourceCeilings.gpuLimit > 0)) {
    assert(spec.costEvidence.requiredMeasurements.includes('gpuMilliseconds'))
  }

  const completedInput = toolFixture(root, 'tool-completed', deepFilterNet.workerRuntime.registryWorkerType)
  const completed = await createPrivateWorkerResourceUsageCostEvidence(completedInput)
  assert.equal(completed.idempotencyStatus, 'inserted')
  assert.equal(completed.evidence.operation.kind, 'registered_tool_operation')
  assert.equal(completed.evidence.operation.canonicalToolId, 'deepfilternet')
  assert.equal(completed.evidence.resourceUsage.wallTimeMilliseconds, 1_000)
  assert.equal(completed.evidence.resourceUsage.allocatedVcpuMilliseconds, 4_000)
  assert.equal(completed.evidence.resourceUsage.allocatedMemoryMibMilliseconds, 4_096_000)
  assert.equal(completed.evidence.resourceUsage.allocatedGpuMilliseconds, 1_000)
  assert.equal(completed.evidence.resourceUsage.observedCpuMicroseconds, 600_000)
  assert.equal(completed.evidence.resourceUsage.observedPeakMemoryBytes, 320 * 1024 * 1024)
  assert.equal(completed.evidence.resourceUsage.observedGpuActiveMilliseconds, 600)
  assert(completed.evidence.infrastructureCost.actualInternalCostMicros > 0)
  assert(completed.evidence.infrastructureCost.breakdownMicros.gpuMicros > 0)
  assert.equal(completed.evidence.infrastructureCost.providerCostIncluded, false)
  assertCommercialSeparation(completed.evidence)

  const readback = await readPrivateWorkerResourceUsageCostEvidence(readInput(completedInput))
  assert.deepEqual(readback, completed.evidence)
  const replay = await createPrivateWorkerResourceUsageCostEvidence(completedInput)
  assert.equal(replay.idempotencyStatus, 'duplicate_returned')
  assert.deepEqual(replay.evidence, completed.evidence)

  const conflictingReplay = cloneInput(completedInput)
  conflictingReplay.output = artifactManifest('output', [{
    artifactId: 'tool-completed-output',
    sha256: digest('conflicting-output'),
    byteLength: 7 * 1024 * 1024,
  }])
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(conflictingReplay),
    'UPLOAD_NOT_FINALIZED',
  )

  const failedInput = toolFixture(root, 'tool-failed', deepFilterNet.workerRuntime.registryWorkerType)
  failedInput.output = artifactManifest('output', [])
  failedInput.outcome = { state: 'failed', failureCategory: 'reeditpro_error' }
  const failed = await createPrivateWorkerResourceUsageCostEvidence(failedInput)
  assert.equal(failed.evidence.outcome.state, 'failed')
  assert.equal(failed.evidence.outcome.failedOrUnknownAttemptCostRetained, true)
  assert(failed.evidence.infrastructureCost.actualInternalCostMicros > 0)
  assertCommercialSeparation(failed.evidence)

  const unknownInput = toolFixture(root, 'tool-unknown', deepFilterNet.workerRuntime.registryWorkerType)
  unknownInput.output = artifactManifest('output', [])
  unknownInput.outcome = { state: 'unknown', failureCategory: 'unknown' }
  const unknown = await createPrivateWorkerResourceUsageCostEvidence(unknownInput)
  assert.equal(unknown.evidence.outcome.state, 'unknown')
  assert.equal(unknown.evidence.outcome.failedOrUnknownAttemptCostRetained, true)
  assert(unknown.evidence.infrastructureCost.actualInternalCostMicros > 0)

  const providerInput = providerFixture(root, 'provider-lyria')
  const provider = await createPrivateWorkerResourceUsageCostEvidence(providerInput)
  assert.equal(provider.evidence.operation.kind, 'registered_provider_operation')
  assert.equal(provider.evidence.operation.operationId,
    'provider.lyria.generate_music_candidate.v1')
  assert.equal(provider.evidence.operation.operationProfileId,
    'lyria_3_pro_provider_boundary')
  assert.equal(provider.evidence.resourceUsage.allocatedGpuCount, 0)
  assert.equal(provider.evidence.infrastructureCost.providerCostIncluded, false)
  assert.equal(provider.evidence.readiness.observedUsageTransportQualified, false)
  assert.equal(provider.evidence.readiness.productionReady, false)
  assertCommercialSeparation(provider.evidence)

  const unregisteredProvider = providerFixture(root, 'provider-unregistered')
  unregisteredProvider.operation = {
    kind: 'registered_provider_operation',
    operationId: 'provider.unregistered.generate.v1',
  }
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(unregisteredProvider),
    'VALIDATION_FAILED',
  )
  const releasedProviderClaim = providerFixture(root, 'provider-released-claim')
  releasedProviderClaim.evidenceClass = 'canonical_backend_observed_usage_unreleased'
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(releasedProviderClaim),
    'VALIDATION_FAILED',
  )
  const providerCostOver = providerFixture(root, 'provider-cost-over')
  providerCostOver.finishSnapshot = snapshot({
    ...providerCostOver.finishSnapshot,
    capturedAt: '2026-07-20T17:01:52.000Z',
    cpuUsageNanoseconds: 50_100_000_000,
  })
  providerCostOver.runtime.leaseExpiresAt = '2026-07-20T17:03:00.000Z'
  providerCostOver.createdAt = '2026-07-20T17:01:53.000Z'
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(providerCostOver),
    'VALIDATION_FAILED',
  )
  const emptyProviderOutput = providerFixture(root, 'provider-empty-output')
  emptyProviderOutput.output = artifactManifest('output', [{
    artifactId: 'provider-empty-output-candidate',
    sha256: digest('provider-empty-output-candidate'),
    byteLength: 0,
  }])
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(emptyProviderOutput),
    'VALIDATION_FAILED',
  )

  const unreadySpec = specs.find((spec) => !spec.privateInternalExecutionReady)
  assert(unreadySpec)
  const unready = toolFixture(root, 'tool-unready', unreadySpec.workerRuntime.registryWorkerType)
  unready.operation = {
    kind: 'registered_tool_operation',
    canonicalToolId: unreadySpec.canonicalToolId,
    operationId: unreadySpec.allowedOperationIds[0],
  }
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(unready),
    'VALIDATION_FAILED',
  )

  const wrongTool = toolFixture(root, 'wrong-tool', deepFilterNet.workerRuntime.registryWorkerType)
  wrongTool.operation = {
    kind: 'registered_tool_operation',
    canonicalToolId: 'ffmpeg',
    operationId: 'tool.deepfilternet.enhance_voice.v1',
  }
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(wrongTool),
    'VALIDATION_FAILED',
  )

  const wrongWorker = toolFixture(root, 'wrong-worker', deepFilterNet.workerRuntime.registryWorkerType)
  wrongWorker.runtime.workerClass = 'cpu_analysis_worker'
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(wrongWorker),
    'VALIDATION_FAILED',
  )

  const cpuOver = toolFixture(root, 'cpu-over', deepFilterNet.workerRuntime.registryWorkerType)
  cpuOver.allocation.vcpuCount = 1
  cpuOver.finishSnapshot = snapshot({
    ...cpuOver.finishSnapshot,
    cpuUsageNanoseconds: cpuOver.startSnapshot.cpuUsageNanoseconds + 1_500_000_000,
  })
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(cpuOver),
    'VALIDATION_FAILED',
  )

  const memoryOver = toolFixture(root, 'memory-over', deepFilterNet.workerRuntime.registryWorkerType)
  memoryOver.allocation.memoryMib = 128
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(memoryOver),
    'VALIDATION_FAILED',
  )

  const missingGpu = toolFixture(root, 'missing-gpu', deepFilterNet.workerRuntime.registryWorkerType)
  missingGpu.allocation.gpuCount = 0
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(missingGpu),
    'VALIDATION_FAILED',
  )

  const offlineEgress = toolFixture(root, 'offline-egress', deepFilterNet.workerRuntime.registryWorkerType)
  offlineEgress.networkEgressBytes = 1
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(offlineEgress),
    'VALIDATION_FAILED',
  )

  const tooManyAttempts = toolFixture(root, 'too-many-attempts', deepFilterNet.workerRuntime.registryWorkerType)
  tooManyAttempts.identity.attemptOrdinal = 4
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(tooManyAttempts),
    'VALIDATION_FAILED',
  )

  const expiredLease = toolFixture(root, 'expired-lease', deepFilterNet.workerRuntime.registryWorkerType)
  expiredLease.runtime.leaseExpiresAt = expiredLease.startSnapshot.capturedAt
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(expiredLease),
    'VALIDATION_FAILED',
  )

  const outputOver = toolFixture(root, 'output-over', deepFilterNet.workerRuntime.registryWorkerType)
  outputOver.output = artifactManifest('output', [{
    artifactId: 'output-over-output',
    sha256: digest('output-over'),
    byteLength: deepFilterNet.resourceCeilings.maxOutputBytes + 1,
  }])
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(outputOver),
    'VALIDATION_FAILED',
  )

  const manifestTamper = toolFixture(root, 'manifest-tamper', deepFilterNet.workerRuntime.registryWorkerType)
  manifestTamper.input.manifestHash = digest('wrong-manifest')
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(manifestTamper),
    'VALIDATION_FAILED',
  )

  const snapshotTamper = toolFixture(root, 'snapshot-tamper', deepFilterNet.workerRuntime.registryWorkerType)
  snapshotTamper.finishSnapshot.rawSnapshotDigest = digest('wrong-snapshot')
  await expectApiError(
    () => createPrivateWorkerResourceUsageCostEvidence(snapshotTamper),
    'VALIDATION_FAILED',
  )

  assert.equal(privateWorkerResourceUsageCostEvidenceSchema.safeParse({
    ...completed.evidence,
    resourceUsage: {
      ...completed.evidence.resourceUsage,
      observedCpuMicroseconds:
        completed.evidence.resourceUsage.observedCpuMicroseconds + 1,
    },
  }).success, false)
  assert.equal(privateWorkerResourceUsageCostEvidenceSchema.safeParse({
    ...completed.evidence,
    customerPrice: 1,
  }).success, false)
  const duplicateArtifactEvidence = {
    ...completed.evidence,
    input: {
      ...completed.evidence.input,
      artifacts: [
        completed.evidence.input.artifacts[0],
        completed.evidence.input.artifacts[0],
      ],
      manifestHash: digest('duplicate-artifact-manifest'),
    },
  }
  let duplicateArtifactResult: ReturnType<
    typeof privateWorkerResourceUsageCostEvidenceSchema.safeParse
  > | undefined
  assert.doesNotThrow(() => {
    duplicateArtifactResult =
      privateWorkerResourceUsageCostEvidenceSchema.safeParse(duplicateArtifactEvidence)
  })
  assert.equal(duplicateArtifactResult?.success, false)
  assert.throws(
    () => assertPrivateWorkerResourceUsageProductionAuthority(completed.evidence),
    (error) => error instanceof ApiError && error.code === 'TOOL_NOT_READY',
  )

  const persistedPath = await singleEvidenceFile(root, completedInput.identity.executionAttemptId)
  const persistedMode = (await stat(persistedPath)).mode & 0o777
  assert.equal(persistedMode, 0o600)
  const tampered = JSON.parse(await readFile(persistedPath, 'utf8')) as Record<string, unknown>
  const tamperedUsage = tampered.resourceUsage as Record<string, unknown>
  tamperedUsage.networkEgressBytes = 1
  delete tampered.evidenceHash
  tampered.evidenceHash = sha256AuthorityValue(tampered)
  await writeFile(persistedPath, `${stableAuthorityStringify(tampered)}\n`, { mode: 0o600 })
  await expectRejected(() => readPrivateWorkerResourceUsageCostEvidence(
    readInput(completedInput),
  ))

  const symlinkInput = toolFixture(root, 'stored-symlink', deepFilterNet.workerRuntime.registryWorkerType)
  await createPrivateWorkerResourceUsageCostEvidence(symlinkInput)
  const symlinkPath = await singleEvidenceFile(root, symlinkInput.identity.executionAttemptId)
  await rm(symlinkPath)
  await symlink('/etc/passwd', symlinkPath)
  await expectRejected(() => readPrivateWorkerResourceUsageCostEvidence(readInput(symlinkInput)))

  console.log(JSON.stringify({
    status: 'PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_ACCEPTED_RUNTIME_BLOCKED',
    registeredToolOperationContracts: coverage.registeredToolOperationIdCount,
    registeredProviderOperationContracts: coverage.registeredProviderOperationCount,
    totalOperationContracts: coverage.totalOperationContractCount,
    privateRunnerVerifiedToolOperations:
      coverage.privateInternalRunnerVerifiedToolOperationCount,
    plannedOrPolicyBlockedToolOperations:
      coverage.plannedOrPolicyBlockedToolOperationCount,
    gpuToolOperationsWithRequiredGpuMeasurements:
      coverage.gpuToolOperationContractsWithRequiredGpuMeasurements,
    completedGpuAttemptEvidenceHash: completed.evidence.evidenceHash,
    failedAttemptEvidenceHash: failed.evidence.evidenceHash,
    unknownAttemptEvidenceHash: unknown.evidence.evidenceHash,
    injectedProviderAttemptEvidenceHash: provider.evidence.evidenceHash,
    providerRequests: 0,
    cloudMutations: 0,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function toolFixture(
  localStorageRoot: string,
  label: string,
  workerClass: string,
): CreatePrivateWorkerResourceUsageCostEvidenceInput {
  const startAt = '2026-07-20T16:00:00.000Z'
  const finishAt = '2026-07-20T16:00:01.000Z'
  const runtime = runtimeFixture(label, workerClass, '2026-07-20T16:01:00.000Z')
  return {
    localStorageRoot,
    evidenceClass: 'private_injected_observed_usage_test',
    operation: {
      kind: 'registered_tool_operation',
      canonicalToolId: 'deepfilternet',
      operationId: 'tool.deepfilternet.enhance_voice.v1',
    },
    identity: identityFixture(label),
    attemptInputHash: digest(`${label}-attempt-input`),
    runtime,
    allocation: { vcpuCount: 4, memoryMib: 4_096, gpuCount: 1 },
    startSnapshot: snapshot({
      schemaVersion: 'private-worker-resource-observer-snapshot-v1',
      runtimeExecutionIdentityDigest: runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: runtime.containerIdentityDigest,
      measurementAgentDigest: runtime.measurementAgentDigest,
      capturedAt: startAt,
      cpuUsageNanoseconds: 1_000_000_000,
      memoryCurrentBytes: 128 * 1024 * 1024,
      memoryPeakBytes: 256 * 1024 * 1024,
      gpuActiveMilliseconds: 100,
    }),
    finishSnapshot: snapshot({
      schemaVersion: 'private-worker-resource-observer-snapshot-v1',
      runtimeExecutionIdentityDigest: runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: runtime.containerIdentityDigest,
      measurementAgentDigest: runtime.measurementAgentDigest,
      capturedAt: finishAt,
      cpuUsageNanoseconds: 1_600_000_000,
      memoryCurrentBytes: 192 * 1024 * 1024,
      memoryPeakBytes: 320 * 1024 * 1024,
      gpuActiveMilliseconds: 700,
    }),
    input: artifactManifest('input', [{
      artifactId: `${label}-input`,
      sha256: digest(`${label}-input`),
      byteLength: 8 * 1024 * 1024,
    }]),
    output: artifactManifest('output', [{
      artifactId: `${label}-output`,
      sha256: digest(`${label}-output`),
      byteLength: 7 * 1024 * 1024,
    }]),
    networkEgressBytes: 0,
    outcome: { state: 'completed', failureCategory: 'none' },
    createdAt: '2026-07-20T16:00:02.000Z',
  }
}

function providerFixture(
  localStorageRoot: string,
  label: string,
): CreatePrivateWorkerResourceUsageCostEvidenceInput {
  const runtime = runtimeFixture(label, 'audio_processing_worker',
    '2026-07-20T17:01:00.000Z')
  return {
    localStorageRoot,
    evidenceClass: 'private_injected_observed_usage_test',
    operation: {
      kind: 'registered_provider_operation',
      operationId: 'provider.lyria.generate_music_candidate.v1',
    },
    identity: identityFixture(label),
    attemptInputHash: digest(`${label}-attempt-input`),
    runtime,
    allocation: { vcpuCount: 1, memoryMib: 1_024, gpuCount: 0 },
    startSnapshot: snapshot({
      schemaVersion: 'private-worker-resource-observer-snapshot-v1',
      runtimeExecutionIdentityDigest: runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: runtime.containerIdentityDigest,
      measurementAgentDigest: runtime.measurementAgentDigest,
      capturedAt: '2026-07-20T17:00:00.000Z',
      cpuUsageNanoseconds: 100_000_000,
      memoryCurrentBytes: 64 * 1024 * 1024,
      memoryPeakBytes: 64 * 1024 * 1024,
      gpuActiveMilliseconds: null,
    }),
    finishSnapshot: snapshot({
      schemaVersion: 'private-worker-resource-observer-snapshot-v1',
      runtimeExecutionIdentityDigest: runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: runtime.containerIdentityDigest,
      measurementAgentDigest: runtime.measurementAgentDigest,
      capturedAt: '2026-07-20T17:00:01.000Z',
      cpuUsageNanoseconds: 300_000_000,
      memoryCurrentBytes: 96 * 1024 * 1024,
      memoryPeakBytes: 128 * 1024 * 1024,
      gpuActiveMilliseconds: null,
    }),
    input: artifactManifest('input', [{
      artifactId: `${label}-request`,
      sha256: digest(`${label}-request`),
      byteLength: 4_096,
    }]),
    output: artifactManifest('output', [{
      artifactId: `${label}-candidate`,
      sha256: digest(`${label}-candidate`),
      byteLength: 2 * 1024 * 1024,
    }]),
    networkEgressBytes: 0,
    outcome: { state: 'completed', failureCategory: 'none' },
    createdAt: '2026-07-20T17:00:02.000Z',
  }
}

function identityFixture(label: string) {
  return {
    ownerUserId: 'owner-worker-cost',
    workspaceId: 'workspace-worker-cost',
    projectId: 'project-worker-cost',
    editSessionId: 'edit-worker-cost',
    approvedPlanSnapshotId: 'snapshot-worker-cost',
    approvedPlanSnapshotHash: digest('snapshot-worker-cost'),
    packageRecordId: 'package-worker-cost',
    packageHash: digest('package-worker-cost'),
    approvedWorkItemId: `work-${label}`,
    approvedWorkItemHash: digest(`work-${label}`),
    jobId: `job-${label}`,
    executionAttemptId: `attempt-${label}`,
    attemptOrdinal: 1,
    leaseId: `lease-${label}`,
    leaseHash: digest(`lease-${label}`),
    dispatchGrantId: `dispatch-${label}`,
    dispatchGrantHash: digest(`dispatch-${label}`),
    idempotencyKeyHash: digest(`idempotency-${label}`),
  }
}

function runtimeFixture(label: string, workerClass: string, leaseExpiresAt: string) {
  return {
    workerClass,
    runtimeExecutionIdentityDigest: digest(`${label}-runtime-execution`),
    runtimeImageDigest: digest(`${label}-runtime-image`),
    runtimeAttestationDigest: digest(`${label}-runtime-attestation`),
    containerIdentityDigest: digest(`${label}-container`),
    cloudExecutionResourceDigest: null,
    measurementAgentVersion: 'private-observer-v1',
    measurementAgentDigest: digest('private-observer-v1'),
    leaseExpiresAt,
  }
}

function snapshot(
  input: Omit<PrivateWorkerResourceObserverSnapshot, 'rawSnapshotDigest'>
    | PrivateWorkerResourceObserverSnapshot,
): PrivateWorkerResourceObserverSnapshot {
  const withoutHash = {
    schemaVersion: input.schemaVersion,
    runtimeExecutionIdentityDigest: input.runtimeExecutionIdentityDigest,
    containerIdentityDigest: input.containerIdentityDigest,
    measurementAgentDigest: input.measurementAgentDigest,
    capturedAt: input.capturedAt,
    cpuUsageNanoseconds: input.cpuUsageNanoseconds,
    memoryCurrentBytes: input.memoryCurrentBytes,
    memoryPeakBytes: input.memoryPeakBytes,
    gpuActiveMilliseconds: input.gpuActiveMilliseconds,
  }
  return {
    ...withoutHash,
    rawSnapshotDigest: hashPrivateWorkerResourceObserverSnapshot(withoutHash),
  }
}

type TestArtifact = { artifactId: string; sha256: string; byteLength: number }

function artifactManifest(
  direction: 'input',
  artifacts: TestArtifact[],
): { artifacts: TestArtifact[]; manifestHash: string }
function artifactManifest(
  direction: 'output',
  artifacts: TestArtifact[],
  disposition?: 'accepted' | 'partial_rejected' | 'none',
): { artifacts: TestArtifact[]; manifestHash: string; disposition: 'accepted' | 'partial_rejected' | 'none' }
function artifactManifest(
  direction: 'input' | 'output',
  artifacts: TestArtifact[],
  disposition?: 'accepted' | 'partial_rejected' | 'none',
) {
  const base = {
    artifacts,
    manifestHash: hashPrivateWorkerResourceArtifactManifest({ direction, artifacts }),
  }
  return direction === 'output'
    ? { ...base, disposition: disposition ?? (artifacts.length ? 'accepted' : 'none') }
    : base
}

function cloneInput(
  input: CreatePrivateWorkerResourceUsageCostEvidenceInput,
): CreatePrivateWorkerResourceUsageCostEvidenceInput {
  return structuredClone(input)
}

function readInput(input: CreatePrivateWorkerResourceUsageCostEvidenceInput) {
  return {
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.identity.ownerUserId,
    workspaceId: input.identity.workspaceId,
    projectId: input.identity.projectId,
    executionAttemptId: input.identity.executionAttemptId,
  }
}

async function singleEvidenceFile(storageRoot: string, attemptId: string): Promise<string> {
  const files = await listFiles(storageRoot)
  const matches: string[] = []
  for (const file of files.filter((candidate) => candidate.endsWith('.json'))) {
    const decoded = JSON.parse(await readFile(file, 'utf8')) as {
      identity?: { executionAttemptId?: string }
    }
    if (decoded.identity?.executionAttemptId === attemptId) matches.push(file)
  }
  assert.equal(matches.length, 1)
  return matches[0]
}

async function listFiles(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await listFiles(path))
    else result.push(path)
  }
  return result
}

function assertCommercialSeparation(value: unknown): void {
  const serialized = JSON.stringify(value)
  assert(!serialized.includes('"customerPriceIncluded":true'))
  assert(!serialized.includes('"customerCreditsIncluded":true'))
  assert(!serialized.includes('"serviceFeeIncluded":true'))
  assert(!serialized.includes('"walletMutationPerformed":true'))
  assert(!serialized.includes('"billingMutationPerformed":true'))
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error) =>
    error instanceof ApiError && error.code === code)
}

async function expectRejected(operation: () => Promise<unknown>): Promise<void> {
  await assert.rejects(operation)
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
