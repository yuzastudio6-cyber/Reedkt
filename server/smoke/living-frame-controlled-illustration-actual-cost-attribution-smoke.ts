import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
} from '../../src/types/living-frame-controlled-illustration-actual-cost-attribution'
import {
  createLivingFrameControlledIllustrationActualCostReader,
  bindLivingFrameControlledIllustrationActualCost,
  verifyLivingFrameControlledIllustrationActualCostAttribution,
} from '../living-frame/living-frame-controlled-illustration-actual-cost-attribution'
import {
  createLivingFrameControlledIllustrationOperationPreflight,
} from '../living-frame/living-frame-controlled-illustration-operation-preflight'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  hashPrivateWorkerResourceArtifactManifest,
  hashPrivateWorkerResourceObserverSnapshot,
  privateWorkerResourceUsageCostEvidenceSchema,
  type PrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  calculateInfrastructureRuntimeCostMicros,
} from '../tool-cost-metering/cost-math'
import {
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
} from '../tool-cost-metering/rate-card'

const sha = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex')

const scope = {
  ownerUserId: 'owner-lf-cost',
  workspaceId: 'workspace-lf-cost',
  projectId: 'project-lf-cost',
  editSessionId: 'edit-lf-cost',
  approvedPlanSnapshotId: 'snapshot-lf-cost',
  approvedPlanSnapshotHashSha256: sha('snapshot'),
  packageRecordId: 'package-lf-cost',
  packageHashSha256: sha('package'),
} as const

const preflight =
  createLivingFrameControlledIllustrationOperationPreflight({
    preflightId: 'lf-controlled-cost-preflight',
    approvedLineageBindingDigestSha256: sha('approved-lineage'),
    selectedSceneAdmissionDigestSha256: sha('selected-scene'),
    componentAssetIntentDigestSha256: sha('asset-intent'),
    outputFrameExpectationDigestSha256: sha('output-frame'),
    masterTimingExpectationDigestSha256: sha('timing'),
    controlledIllustrationQualificationDigestSha256:
      sha('qualification'),
    controlledIllustrationSourceObservationDigestSha256:
      sha('source-observation'),
    estimateProjectionDigestSha256: sha('estimate'),
    workGraphProjectionDigestSha256: sha('work-graph'),
  })

const completedGpu = createEvidence({
  component: 'gpu',
  state: 'completed',
  failureCategory: 'none',
  workItemId: 'work-gpu-completed',
  attemptId: 'attempt-gpu-completed',
})
const failedGpu = createEvidence({
  component: 'gpu',
  state: 'failed',
  failureCategory: 'timeout',
  workItemId: 'work-gpu-failed',
  attemptId: 'attempt-gpu-failed',
})
const unknownAuraFace = createEvidence({
  component: 'auraface',
  state: 'unknown',
  failureCategory: 'unknown',
  workItemId: 'work-auraface-unknown',
  attemptId: 'attempt-auraface-unknown',
})

const readerResult = {
  sourceAuthority:
    'controlled_living_frame_actual_cost_fixture_reader',
  evidenceClass:
    'controlled_non_promotable_attempt_cost_source',
  productionReady: false,
  canonicalScope: scope,
  operationPreflight: preflight,
  attemptEvidence: [
    failedGpu,
    unknownAuraFace,
    completedGpu,
  ],
  exactReuseEvidence: [{
    reuseId: 'reuse-approved-character',
    order: 0,
    costComponentId:
      'shared_controlled_illustration_gpu_host',
    capabilityIds: [
      'comfyui_execution_host',
      'comfyui_controlnet_aux_preprocessing',
      'controlnet_conditioning',
      'ipadapter_reference_conditioning',
      'peft_lora_adapter_loading',
    ],
    reusedAssetId: 'asset-approved-character',
    reusedAssetHashSha256: sha('asset-approved-character'),
    sourceAttemptEvidenceId: completedGpu.evidenceId,
    sourceAttemptEvidenceHashSha256:
      completedGpu.evidenceHash,
    approvedReuseDecisionDigestSha256:
      sha('approved-reuse-decision'),
    newWorkerAttemptCreated: false,
  }],
} as const

const reader =
  createLivingFrameControlledIllustrationActualCostReader(
    async () => readerResult,
  )
const locator = {
  schemaVersion:
    LIVING_FRAME_CONTROLLED_ILLUSTRATION_ACTUAL_COST_LOCATOR_VERSION,
  serverOwnedLocatorId: 'locator-lf-actual-cost',
} as const
const attribution =
  await bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader,
  })

assert.equal(
  verifyLivingFrameControlledIllustrationActualCostAttribution(
    attribution,
  ),
  true,
)
assert.equal(attribution.aggregate.completedAttemptCount, 1)
assert.equal(attribution.aggregate.failedAttemptCount, 1)
assert.equal(attribution.aggregate.unknownAttemptCount, 1)
assert.equal(attribution.aggregate.sharedGpuHostAttemptCount, 2)
assert.equal(
  attribution.aggregate.auraFaceCpuMeasurementAttemptCount,
  1,
)
assert.equal(attribution.aggregate.exactReuseCount, 1)
assert.equal(
  attribution.aggregate.totalObservedAttemptInternalCostMicros,
  completedGpu.infrastructureCost.actualInternalCostMicros
    + failedGpu.infrastructureCost.actualInternalCostMicros
    + unknownAuraFace.infrastructureCost.actualInternalCostMicros,
)
assert.deepEqual(
  attribution.attemptAttributions
    .filter((entry) =>
      entry.costComponentId ===
        'shared_controlled_illustration_gpu_host')
    .map((entry) => entry.capabilityIds),
  [0, 1].map(() => [
    'comfyui_execution_host',
    'comfyui_controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'ipadapter_reference_conditioning',
    'peft_lora_adapter_loading',
  ]),
)
assert.equal(
  attribution.exactReuseAttributions[0]
    ?.incrementalInternalCostMicros,
  0,
)
assert.equal(
  attribution.exactReuseAttributions[0]
    ?.originalAttemptCostErased,
  false,
)
assert.ok(attribution.attemptAttributions.every((entry) =>
  entry.failedOrUnknownAttemptCostRetained
  && !entry.serviceFeeIncluded
  && !entry.customerBillabilityDecisionPresent
  && !entry.customerCreditAllocationPresent))
for (const [key, value] of
  Object.entries(attribution.authorityBoundary)) {
  if (key === 'controlledInternalCostAttributionOnly') {
    assert.equal(value, true)
  } else {
    assert.equal(value, false, `${key} must remain false.`)
  }
}

const reorderedReader =
  createLivingFrameControlledIllustrationActualCostReader(
    async () => ({
      ...readerResult,
      attemptEvidence: [
        completedGpu,
        failedGpu,
        unknownAuraFace,
      ],
    }),
  )
const reordered =
  await bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader: reorderedReader,
  })
assert.equal(
  reordered.attributionDigestSha256,
  attribution.attributionDigestSha256,
)

await assert.rejects(
  bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader: {
      ...reader,
      readCurrentByServerOwnedLocator:
        async () => readerResult,
    },
  }),
  /process-bound actual-cost reader/u,
)

const wrongScopeReader =
  createLivingFrameControlledIllustrationActualCostReader(
    async () => ({
      ...readerResult,
      canonicalScope: {
        ...scope,
        workspaceId: 'wrong-workspace',
      },
    }),
  )
await assert.rejects(
  bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader: wrongScopeReader,
  }),
  /scope or approved lineage changed/u,
)

const duplicatedReader =
  createLivingFrameControlledIllustrationActualCostReader(
    async () => ({
      ...readerResult,
      attemptEvidence: [completedGpu, completedGpu],
    }),
  )
await assert.rejects(
  bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader: duplicatedReader,
  }),
  /duplicated/u,
)

const invalidReuseReader =
  createLivingFrameControlledIllustrationActualCostReader(
    async () => ({
      ...readerResult,
      exactReuseEvidence:
        readerResult.exactReuseEvidence.map((entry) => ({
          ...entry,
          capabilityIds: ['auraface_identity_measurement'],
        })),
    }),
  )
await assert.rejects(
  bindLivingFrameControlledIllustrationActualCost({
    locator,
    reader: invalidReuseReader,
  }),
  /capability attribution changed/u,
)

const forged = structuredClone(attribution) as unknown as
  Record<string, unknown>
forged.customerChargeCalculated = true
forged.settlementEventCreated = true
forged.productionReady = true
forged.attributionDigestSha256 =
  sha256AuthorityValue(withoutDigest(forged))
assert.equal(
  verifyLivingFrameControlledIllustrationActualCostAttribution(
    forged,
  ),
  false,
)

console.log(
  'Living Frame controlled-illustration actual-cost attribution passed '
  + 'shared-GPU, AuraFace CPU, completed/failed/unknown retention, '
  + 'exact-reuse zero-increment, deterministic ordering, scope, '
  + 'process-bound reader, and forged-promotion checks.',
)

function createEvidence(input: {
  component: 'gpu' | 'auraface'
  state: 'completed' | 'failed' | 'unknown'
  failureCategory:
    | 'none'
    | 'timeout'
    | 'unknown'
  workItemId: string
  attemptId: string
}): PrivateWorkerResourceUsageCostEvidence {
  const gpu = input.component === 'gpu'
  const operationProfileHash = sha(
    `operation-profile:${input.component}`,
  )
  const runtimeExecutionIdentityDigest =
    sha(`runtime:${input.attemptId}`)
  const containerIdentityDigest =
    sha(`container:${input.attemptId}`)
  const measurementAgentDigest = sha('measurement-agent')
  const startWithoutDigest = {
    schemaVersion:
      'private-worker-resource-observer-snapshot-v1' as const,
    runtimeExecutionIdentityDigest,
    containerIdentityDigest,
    measurementAgentDigest,
    capturedAt: '2030-01-01T00:00:00.000Z',
    cpuUsageNanoseconds: 0,
    memoryCurrentBytes: 64 * 1024 * 1024,
    memoryPeakBytes: 64 * 1024 * 1024,
    gpuActiveMilliseconds: gpu ? 0 : null,
  }
  const finishWithoutDigest = {
    ...startWithoutDigest,
    capturedAt: '2030-01-01T00:00:01.000Z',
    cpuUsageNanoseconds: 500_000_000,
    memoryCurrentBytes: 72 * 1024 * 1024,
    memoryPeakBytes: 80 * 1024 * 1024,
    gpuActiveMilliseconds: gpu ? 800 : null,
  }
  const start = {
    ...startWithoutDigest,
    rawSnapshotDigest:
      hashPrivateWorkerResourceObserverSnapshot(
        startWithoutDigest,
      ),
  }
  const finish = {
    ...finishWithoutDigest,
    rawSnapshotDigest:
      hashPrivateWorkerResourceObserverSnapshot(
        finishWithoutDigest,
      ),
  }
  const inputArtifacts = [{
    artifactId: `input-${input.attemptId}`,
    sha256: sha(`input:${input.attemptId}`),
    byteLength: 4_096,
  }]
  const outputArtifacts = input.state === 'completed'
    ? [{
        artifactId: `output-${input.attemptId}`,
        sha256: sha(`output:${input.attemptId}`),
        byteLength: 8_192,
      }]
    : []
  const allocation = gpu
    ? { vcpuCount: 8, memoryMib: 32_768, gpuCount: 1 }
    : { vcpuCount: 2, memoryMib: 4_096, gpuCount: 0 }
  const operation = {
    kind: 'registered_tool_operation' as const,
    registryVersion:
      'professional-tool-operation-spec-v1' as const,
    canonicalToolId: gpu ? 'comfyui' : 'transformers',
    operationId: gpu
      ? 'tool.comfyui.generate_controlled_image.v1'
      : 'tool.transformers.measure_auraface_identity_continuity.v1',
    operationProfileId:
      `profile-${input.component}-controlled`,
    operationProfileHash,
    registryWorkerType: gpu
      ? 'gpu_ai_worker'
      : 'model_inference_worker',
    runtimeClass: gpu
      ? 'private_gpu_worker'
      : 'private_cpu_worker',
    networkMode: 'offline_required' as const,
    requiredMeasurementContractHash: sha('measurements'),
    maximumAttemptsPerApprovedWorkItem: 3,
    maximumElapsedMilliseconds: 90_000,
    maximumVcpuCount: allocation.vcpuCount,
    maximumMemoryMib: allocation.memoryMib,
    maximumGpuCount: allocation.gpuCount,
    maximumInputBytes: 1_000_000,
    maximumOutputBytes: 1_000_000,
    maximumOutputArtifacts: 1,
    maximumNetworkEgressBytes: 0,
    maximumAuthorizedInfrastructureCostMicros: null,
    privateInternalRunnerVerified: true as const,
    productReady: false as const,
  }
  const identity = {
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedPlanSnapshotId:
      scope.approvedPlanSnapshotId,
    approvedPlanSnapshotHash:
      scope.approvedPlanSnapshotHashSha256,
    packageRecordId: scope.packageRecordId,
    packageHash: scope.packageHashSha256,
    approvedWorkItemId: input.workItemId,
    approvedWorkItemHash:
      sha(`work:${input.workItemId}`),
    jobId: `job-${input.attemptId}`,
    executionAttemptId: input.attemptId,
    attemptOrdinal: 1,
    leaseId: `lease-${input.attemptId}`,
    leaseHash: sha(`lease:${input.attemptId}`),
    dispatchGrantId: `dispatch-${input.attemptId}`,
    dispatchGrantHash: sha(`dispatch:${input.attemptId}`),
    idempotencyKeyHash:
      sha(`idempotency:${input.attemptId}`),
  }
  const cost = calculateInfrastructureRuntimeCostMicros({
    wallTimeMilliseconds: 1_000,
    renderSeconds: 0,
    vcpuCount: allocation.vcpuCount,
    memoryGib: allocation.memoryMib / 1_024,
    gpuCount: allocation.gpuCount,
    tempStorageGibHours: 0,
    outputStorageGibHours: 0,
    networkEgressMib: 0,
    computeLevel: 'standard',
  })
  assert.equal(cost.ok, true)
  if (!cost.ok || !cost.data.billableMilliseconds) {
    throw new Error('Fixture cost failed.')
  }
  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'private_worker_resource_usage_cost_identity_v1',
    identity,
    operationProfileHash,
    runtimeExecutionIdentityDigest,
  })
  const resourceUsage = {
    measurementClass:
      'private_injected_observed_resource_snapshots' as const,
    startedAt: start.capturedAt,
    finishedAt: finish.capturedAt,
    wallTimeMilliseconds: 1_000,
    allocatedVcpuCount: allocation.vcpuCount,
    allocatedMemoryMib: allocation.memoryMib,
    allocatedGpuCount: allocation.gpuCount,
    allocatedVcpuMilliseconds:
      allocation.vcpuCount * 1_000,
    allocatedMemoryMibMilliseconds:
      allocation.memoryMib * 1_000,
    allocatedGpuMilliseconds:
      allocation.gpuCount * 1_000,
    observedCpuMicroseconds: 500_000,
    observedPeakMemoryBytes: 80 * 1024 * 1024,
    observedGpuActiveMilliseconds: gpu ? 800 : 0,
    networkEgressBytes: 0,
    infrastructureEvidenceDigest: sha256AuthorityValue({
      domain: 'private_worker_resource_usage_interval_v1',
      operationProfileHash,
      runtimeExecutionIdentityDigest,
      startSnapshotDigest: start.rawSnapshotDigest,
      finishSnapshotDigest: finish.rawSnapshotDigest,
      wallTimeMilliseconds: 1_000,
      observedCpuMicroseconds: 500_000,
      observedPeakMemoryBytes: 80 * 1024 * 1024,
      observedGpuActiveMilliseconds: gpu ? 800 : 0,
      networkEgressBytes: 0,
    }),
    startSnapshotDigest: start.rawSnapshotDigest,
    finishSnapshotDigest: finish.rawSnapshotDigest,
  }
  const payload = {
    schemaVersion:
      'private-worker-resource-usage-cost-evidence-v1' as const,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass:
      'private_injected_observed_usage_test' as const,
    evidenceId:
      `workerusage_${attemptIdentityHash.slice(0, 48)}`,
    identity,
    attemptIdentityHash,
    attemptInputHash: sha(`attempt-input:${input.attemptId}`),
    operation,
    runtime: {
      workerClass: operation.registryWorkerType,
      runtimeExecutionIdentityDigest,
      runtimeImageDigest: sha('runtime-image'),
      runtimeAttestationDigest: sha('runtime-attestation'),
      containerIdentityDigest,
      cloudExecutionResourceDigest: null,
      measurementAgentVersion: 'measurement-agent-v1',
      measurementAgentDigest,
      leaseExpiresAt: '2030-01-01T00:01:00.000Z',
    },
    observerSnapshots: { start, finish },
    input: {
      manifestHash:
        hashPrivateWorkerResourceArtifactManifest({
          direction: 'input',
          artifacts: inputArtifacts,
        }),
      artifacts: inputArtifacts,
    },
    output: {
      disposition: input.state === 'completed'
        ? 'accepted' as const
        : 'none' as const,
      manifestHash:
        hashPrivateWorkerResourceArtifactManifest({
          direction: 'output',
          artifacts: outputArtifacts,
        }),
      artifacts: outputArtifacts,
    },
    resourceUsage,
    infrastructureCost: {
      rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
      rateCardDigest: sha256AuthorityValue(
        TOOL_COST_RATE_CARD,
      ),
      rateAuthorityClass:
        'mock_safe_placeholder_not_cloud_invoice' as const,
      billableMilliseconds:
        cost.data.billableMilliseconds,
      breakdownMicros:
        numericBreakdown(cost.data.breakdownMicros),
      actualInternalCostMicros:
        cost.data.actualInternalCostMicros,
      officialCloudRateApproved: false as const,
      invoiceReconciled: false as const,
      providerCostIncluded: false as const,
    },
    outcome: {
      state: input.state,
      failureCategory: input.failureCategory,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    readiness: {
      observedUsageContractVerified: true as const,
      observedUsageTransportQualified: false as const,
      productionRateAuthority: false as const,
      distributedDurability: false as const,
      productionReady: false as const,
    },
    createdAt: '2030-01-01T00:00:02.000Z',
  }
  return privateWorkerResourceUsageCostEvidenceSchema.parse({
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  })
}

function numericBreakdown(
  value: Record<string, unknown>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      assert.equal(Number.isSafeInteger(entry), true)
      return [key, entry as number]
    }),
  )
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const clone = structuredClone(value)
  delete clone.attributionDigestSha256
  return clone
}
