import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  CANONICAL_CLOUD_RUN_INTERNAL_MAX_RETRIES,
  CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES,
  CLOUD_TASKS_SYSTEM_MAX_TASK_BYTES,
  canonicalCloudRuntimeRegionAuthoritySchema,
  createCanonicalCloudRuntimeRegionAuthority,
  createCanonicalCloudWorkerDispatchAttemptPlan,
  createCanonicalCloudWorkerDispatchHandoffManifest,
  createCanonicalProvenToolCloudDispatchCatalog,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  createCanonicalApprovedEditExecutionPackage,
  createCanonicalToolAuthorizationManifest,
  type CanonicalToolAuthorizationManifest,
} from '../edit-architecture/canonical-approved-edit-execution-package'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  createCanonicalPrivateProvenToolPlacementCatalog,
} from '../edit-architecture/canonical-private-resource-placement-authority'
import {
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  GCP_PRODUCTION_REQUIRED_APIS,
} from '../config/gcp-production-config'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from '../services/edit-planning-authority-service'
import {
  sha256AuthorityValue,
  type AuthorityExecutionPackageRecord,
} from '../services/private-edit-authority-store'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'

const SHA = 'a'.repeat(64)
const NOW = '2026-07-17T02:00:00.000Z'
const REF = { sha256: SHA, byteLength: 1 }

assert.ok(GCP_PRODUCTION_REQUIRED_APIS.includes('cloudtasks.googleapis.com'))
assert.ok(GCP_PRODUCTION_REQUIRED_APIS.includes('iamcredentials.googleapis.com'))
assert.ok(GCP_PRODUCTION_CLOUD_RUN_JOBS.every((job) =>
  job.maxRetries === CANONICAL_CLOUD_RUN_INTERNAL_MAX_RETRIES))

for (const path of [
  'scripts/gcp/prod/09-deploy-cpu-worker-job.example.sh',
  'scripts/gcp/prod/10-deploy-gpu-worker-job.example.sh',
  'scripts/gcp/prod/11-deploy-render-worker-job.example.sh',
  'scripts/gcp/prod/12-deploy-qa-worker-job.example.sh',
  'scripts/gcp/prod/13-run-tool-readiness-job.example.sh',
]) {
  const source = readRepoFile(path)
  assert.match(source, /--max-retries=0/u)
  assert.doesNotMatch(source, /--max-retries=[1-9]/u)
}

const targetCatalog = createCanonicalProvenToolCloudDispatchCatalog()
assert.equal(targetCatalog.tools.length, 50)
assert.equal(targetCatalog.summary.cpuAnalysisToolCount, 28)
assert.equal(targetCatalog.summary.gpuToolCount, 3)
assert.equal(targetCatalog.summary.renderToolCount, 19)
assert.ok(targetCatalog.tools.every((tool) =>
  tool.dispatchContractReady &&
  !tool.cloudDispatchAuthorized &&
  !tool.productionExecutionAuthorized &&
  tool.target.cloudRunInternalMaxRetries === 0 &&
  !tool.target.targetResourceExistenceVerified &&
  !tool.target.targetIamVerified))
assert.equal(new Set(targetCatalog.tools.map((tool) => tool.canonicalToolId)).size, 50)

const workItems = [
  workItem({
    id: 'approved_work_item_control',
    workItemKey: 'snapshot-control',
    workerClass: 'authority_worker',
  }),
  toolWorkItem('ffprobe', 'approved_work_item_cpu', 'cpu-analysis'),
  toolWorkItem('rembg', 'approved_work_item_gpu', 'gpu-mask'),
  toolWorkItem('remotion', 'approved_work_item_render', 'render-final'),
  workItem({
    id: 'approved_work_item_qa',
    workItemKey: 'final-qa',
    workerClass: 'qa_worker',
  }),
  workItem({
    id: 'approved_work_item_readiness',
    workItemKey: 'tool-readiness',
    workerClass: 'tool_readiness_worker',
  }),
]
const authority = buildAuthority(workItems)
const toolManifest = createCanonicalToolAuthorizationManifest(authority)
const packageRecord = buildPackageRecord(toolManifest)
const executionPackage = createCanonicalApprovedEditExecutionPackage({
  authority,
  executionPackageRecord: packageRecord,
  toolCapabilityManifest: toolManifest,
})
const queueDefinition = buildQueueDefinition(executionPackage)

const usRegionAuthority = createCanonicalCloudRuntimeRegionAuthority({
  queueDefinition,
  runtimeRegion: 'us-east1',
  sourceObjectRegions: ['us-east1'],
  allRequiredObjectsRegionBound: true,
  liveProjectRegionPersistenceVerified: false,
  liveGcsObjectResidencyVerified: false,
})
const usManifest = createCanonicalCloudWorkerDispatchHandoffManifest({
  executionPackage,
  queueDefinition,
  regionAuthority: usRegionAuthority,
})

assert.equal(usManifest.entries.length, 6)
assert.equal(usManifest.summary.controlPlaneJobCount, 1)
assert.equal(usManifest.summary.cloudTaskHandoffJobCount, 5)
assert.equal(usManifest.summary.cloudRunHiddenRetryCount, 0)
assert.ok(usManifest.entries.every((entry) =>
  entry.blockers.length > 0 &&
  !entry.cloudDispatchAuthorized &&
  !entry.productionExecutionAuthorized &&
  entry.packageQueueOwnsApprovedAttempts &&
  entry.cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt &&
  entry.workerLoadsAuthorityByOpaqueDispatchIntent &&
  !entry.taskBodyCarriesRawMediaOrSecrets))
assert.equal(usManifest.boundaries.distributedOutboxTransactionVerified, false)
assert.equal(usManifest.boundaries.cloudTasksOidcAndIamVerified, false)
assert.equal(usManifest.boundaries.cloudRunJobDeploymentVerified, false)
assert.equal(usManifest.boundaries.workerServiceIdentityVerified, false)
assert.equal(usManifest.boundaries.privateGcsObjectTransportVerified, false)
assert.equal(usManifest.boundaries.cloudDispatchAuthorized, false)

const controlEntry = usManifest.entries.find((entry) => entry.workerType === 'api_service')
const gpuEntry = usManifest.entries.find((entry) => entry.workerType === 'gpu_ai_worker')
const renderEntry = usManifest.entries.find((entry) => entry.workerType === 'render_worker')
assert.ok(controlEntry)
assert.ok(gpuEntry)
assert.ok(renderEntry)
assert.equal(controlEntry.queueResourceName, null)
assert.match(gpuEntry.queueResourceName ?? '', /locations\/us-east1\/queues\/reeditpro-worker-dispatch$/u)
assert.match(renderEntry.queueResourceName ?? '', /locations\/us-east1\/queues\/reeditpro-render-dispatch$/u)
assert.equal(gpuEntry.target.accelerator, 'nvidia_l4')
assert.equal(gpuEntry.cloudRunTaskTimeoutLimitSeconds, 3_600)

const gpuAttempt = createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: usManifest,
  jobId: gpuEntry.jobId,
  deliveryAttempt: 1,
})
assert.ok(gpuAttempt.cloudTask)
assert.ok(gpuAttempt.cloudRunJob)
assert.match(gpuAttempt.cloudTask.queueResourceName, /locations\/us-east1/u)
assert.match(gpuAttempt.cloudTask.taskId, /^rp-[a-f0-9]{40}$/u)
assert.ok(gpuAttempt.cloudTask.bodyUtf8ByteLength <= CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES)
assert.ok(gpuAttempt.cloudTask.bodyUtf8ByteLength < CLOUD_TASKS_SYSTEM_MAX_TASK_BYTES)
assert.deepEqual(Object.keys(gpuAttempt.cloudTask.taskBody).sort(), [
  'deliveryAttempt',
  'dispatchBindingHash',
  'dispatchIntentId',
  'handoffManifestHash',
  'jobId',
  'manifestEntryHash',
  'purpose',
  'queueDefinitionHash',
  'regionAuthorityHash',
  'schemaVersion',
].sort())
assert.equal(gpuAttempt.cloudRunJob.taskMaxRetries, 0)
assert.equal(gpuAttempt.cloudRunJob.taskCount, 1)
assert.equal(gpuAttempt.cloudRunJob.parallelism, 1)
assert.match(gpuAttempt.cloudRunJob.jobResourceName, /locations\/us-east1\/jobs\/reeditpro-gpu-ai-worker$/u)
assert.equal(gpuAttempt.cloudRunJob.embeddedCredentialOrSignedUrl, false)
assert.equal(gpuAttempt.boundaries.networkCallPerformed, false)
assert.equal(gpuAttempt.boundaries.credentialResolved, false)
assert.equal(gpuAttempt.boundaries.cloudTaskCreated, false)
assert.equal(gpuAttempt.boundaries.cloudRunJobExecuted, false)
assert.deepEqual(
  createCanonicalCloudWorkerDispatchAttemptPlan({
    manifest: structuredClone(usManifest),
    jobId: gpuEntry.jobId,
    deliveryAttempt: 1,
  }),
  gpuAttempt,
)
const gpuAttemptTwo = createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: usManifest,
  jobId: gpuEntry.jobId,
  deliveryAttempt: 2,
})
assert.notEqual(gpuAttemptTwo.dispatchBindingHash, gpuAttempt.dispatchBindingHash)
assert.notEqual(gpuAttemptTwo.cloudTask?.taskId, gpuAttempt.cloudTask.taskId)

const controlAttempt = createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: usManifest,
  jobId: controlEntry.jobId,
  deliveryAttempt: 1,
})
assert.equal(controlAttempt.cloudTask, null)
assert.equal(controlAttempt.cloudRunJob, null)

const euRegionAuthority = createCanonicalCloudRuntimeRegionAuthority({
  queueDefinition,
  runtimeRegion: 'europe-west1',
  sourceObjectRegions: ['europe-west1'],
  allRequiredObjectsRegionBound: true,
  liveProjectRegionPersistenceVerified: false,
  liveGcsObjectResidencyVerified: false,
})
const euManifest = createCanonicalCloudWorkerDispatchHandoffManifest({
  executionPackage,
  queueDefinition,
  regionAuthority: euRegionAuthority,
})
const euGpuEntry = euManifest.entries.find((entry) => entry.workerType === 'gpu_ai_worker')
assert.ok(euGpuEntry)
const euGpuAttempt = createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: euManifest,
  jobId: euGpuEntry.jobId,
  deliveryAttempt: 1,
})
assert.match(euGpuAttempt.cloudTask?.queueResourceName ?? '', /locations\/europe-west1/u)
assert.match(euGpuAttempt.cloudRunJob?.jobResourceName ?? '', /locations\/europe-west1/u)
assert.notEqual(euManifest.manifestHash, usManifest.manifestHash)

assert.throws(() => createCanonicalCloudRuntimeRegionAuthority({
  queueDefinition,
  runtimeRegion: 'us-east1',
  sourceObjectRegions: ['europe-west1'],
  allRequiredObjectsRegionBound: true,
  liveProjectRegionPersistenceVerified: false,
  liveGcsObjectResidencyVerified: false,
}))
const browserSelectedRegion = structuredClone(usRegionAuthority) as Record<string, unknown>
browserSelectedRegion.browserSelectedRegion = true
assert.equal(canonicalCloudRuntimeRegionAuthoritySchema.safeParse(browserSelectedRegion).success, false)

const forgedQueue = structuredClone(queueDefinition)
forgedQueue.jobs[0]!.workerType = 'gpu_ai_worker'
assert.throws(() => createCanonicalCloudWorkerDispatchHandoffManifest({
  executionPackage,
  queueDefinition: forgedQueue,
  regionAuthority: usRegionAuthority,
}))
const forgedManifest = structuredClone(usManifest)
forgedManifest.entries.find((entry) => entry.workerType === 'gpu_ai_worker')!
  .target.cloudRunTargetName = 'attacker-job'
assert.throws(() => createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: forgedManifest,
  jobId: gpuEntry.jobId,
  deliveryAttempt: 1,
}))
assert.throws(() => createCanonicalCloudWorkerDispatchAttemptPlan({
  manifest: usManifest,
  jobId: gpuEntry.jobId,
  deliveryAttempt: gpuEntry.maxAttempts + 1,
}))

const longGpuQueue = structuredClone(queueDefinition)
const longGpuJob = longGpuQueue.jobs.find((job) => job.workerType === 'gpu_ai_worker')!
longGpuJob.attemptTimeoutSeconds = 3_601
rehashQueueDefinition(longGpuQueue)
const longGpuRegion = createCanonicalCloudRuntimeRegionAuthority({
  queueDefinition: longGpuQueue,
  runtimeRegion: 'us-east1',
  sourceObjectRegions: ['us-east1'],
  allRequiredObjectsRegionBound: true,
  liveProjectRegionPersistenceVerified: false,
  liveGcsObjectResidencyVerified: false,
})
const longGpuPackage = structuredClone(executionPackage)
longGpuPackage.jobs.find((job) => job.id === longGpuJob.jobId)!.attemptTimeoutSeconds = 3_601
assert.throws(() => createCanonicalCloudWorkerDispatchHandoffManifest({
  executionPackage: longGpuPackage,
  queueDefinition: longGpuQueue,
  regionAuthority: longGpuRegion,
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'all_50_proven_tools_have_exact_cloud_target_contracts',
    'regional_worker_and_render_cloud_tasks_queues_are_frozen',
    'opaque_small_task_body_contains_only_dispatch_identity_and_hashes',
    'cloud_tasks_handler_is_short_control_plane_handoff_not_long_media_execution',
    'cloud_run_jobs_run_request_uses_one_task_one_parallelism_and_zero_hidden_retries',
    'package_queue_remains_the_only_approved_attempt_authority',
    'gpu_one_hour_timeout_limit_is_fail_closed',
    'region_authority_package_queue_and_target_tamper_are_rejected',
    'oidc_iam_outbox_deployment_object_transport_and_production_remain_blocked',
  ],
  summary: {
    provenToolTargetCount: targetCatalog.tools.length,
    cpuAnalysisToolCount: targetCatalog.summary.cpuAnalysisToolCount,
    gpuToolCount: targetCatalog.summary.gpuToolCount,
    renderToolCount: targetCatalog.summary.renderToolCount,
    packageJobCount: usManifest.entries.length,
    cloudTaskHandoffJobCount: usManifest.summary.cloudTaskHandoffJobCount,
    taskBodyByteLength: gpuAttempt.cloudTask.bodyUtf8ByteLength,
    cloudRunInternalRetryCount: usManifest.summary.cloudRunHiddenRetryCount,
  },
}))

function toolWorkItem(
  toolId: string,
  id: string,
  workItemKey: string,
): CanonicalApprovedExecutionWorkItem {
  const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
  assert.ok(spec)
  return workItem({
    id,
    workItemKey,
    workerClass: 'private_test_worker',
    approvedToolIds: [toolId],
    approvedToolOperationIds: [spec.allowedOperationIds[0]!],
  })
}

function workItem(input: {
  id: string
  workItemKey: string
  workerClass: string
  approvedToolIds?: string[]
  approvedToolOperationIds?: string[]
}): CanonicalApprovedExecutionWorkItem {
  const executionInput = {
    operation: input.workItemKey,
    ...(input.approvedToolOperationIds?.length
      ? { approvedToolOperationIds: input.approvedToolOperationIds }
      : {}),
  }
  return {
    id: input.id,
    snapshotId: 'snapshot_cloud_dispatch',
    sourceWorkItemId: `source_${input.id}`,
    workItemKey: input.workItemKey,
    workItemType: input.workItemKey,
    workerClass: input.workerClass,
    executionInputRef: { sha256: sha256AuthorityValue(executionInput), byteLength: 1 },
    sourceSequenceItemIds: [],
    sourceCleanupDecisionIds: [],
    expectedOutputs: [],
    dependencyKeys: [],
    approvedToolIds: [...(input.approvedToolIds ?? [])],
    providerExecutionMode: 'none',
    fallbackPolicyRef: REF,
    maxAttempts: 2,
    attemptTimeoutSeconds: input.approvedToolIds?.includes('rembg') ? 3_600 : 60,
    scheduledDelaySeconds: 0,
    maximumCreditBudget: 1,
    required: true,
    executionInputHash: sha256AuthorityValue(executionInput),
    createdAt: NOW,
    executionInput,
    fallbackPolicy: {},
  }
}

function buildAuthority(
  items: CanonicalApprovedExecutionWorkItem[],
): CanonicalApprovedExecutionAuthority {
  return {
    authorityRevision: 1,
    snapshot: {
      schemaVersion: 'private-edit-authority-approved-snapshot-v3',
      snapshotId: 'snapshot_cloud_dispatch',
      workspaceId: 'workspace_cloud_dispatch',
      projectId: 'project_cloud_dispatch',
      editSessionId: 'session_cloud_dispatch',
      planId: 'plan_cloud_dispatch',
      planVersion: 1,
      estimateId: 'estimate_cloud_dispatch',
      approvalId: 'approval_cloud_dispatch',
      reservationId: 'reservation_cloud_dispatch',
      approvedByUserId: 'user_cloud_dispatch',
      approvedAt: NOW,
      componentRefs: {},
      approvedWorkItemIds: items.map((item) => item.id),
      planHash: SHA,
      estimateHash: SHA,
      workGraphHash: SHA,
      sourceSequenceHash: SHA,
      timingHash: SHA,
      approvedAssetManifestRef: REF,
      approvedAssetManifestHash: SHA,
      approvedSourceAssetManifestRef: REF,
      approvedSourceAssetManifestHash: SHA,
      snapshotHash: SHA,
    },
    plan: {} as CanonicalApprovedExecutionAuthority['plan'],
    estimate: { approvedMaximumCredits: 20 } as CanonicalApprovedExecutionAuthority['estimate'],
    reservation: {
      reservedCredits: 20,
      spentCredits: 0,
      releasedCredits: 0,
      refundedCredits: 0,
      status: 'reserved',
    } as CanonicalApprovedExecutionAuthority['reservation'],
    approval: {} as CanonicalApprovedExecutionAuthority['approval'],
    components: {} as CanonicalApprovedExecutionAuthority['components'],
    assetManifest: { entries: [], requiredAssetCount: 0 } as unknown as CanonicalApprovedExecutionAuthority['assetManifest'],
    planningInputAuthority: {} as CanonicalApprovedExecutionAuthority['planningInputAuthority'],
    canonicalCustomerEstimateAuthority:
      {} as CanonicalApprovedExecutionAuthority['canonicalCustomerEstimateAuthority'],
    toolExecutionAuthority: {} as CanonicalApprovedExecutionAuthority['toolExecutionAuthority'],
    toolPayloadAuthority: {} as CanonicalApprovedExecutionAuthority['toolPayloadAuthority'],
    sourceAssetManifest: { bindings: [], requiredBindingCount: 0 } as unknown as CanonicalApprovedExecutionAuthority['sourceAssetManifest'],
    workItems: structuredClone(items),
    jobs: items.map((item) => ({
      id: `job_${item.id}`,
      snapshotId: 'snapshot_cloud_dispatch',
      reservationId: 'reservation_cloud_dispatch',
      approvedWorkItemId: item.id,
      workItemKey: item.workItemKey,
      jobType: item.workItemType,
      workerClass: item.workerClass,
      executionInputRef: item.executionInputRef,
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedAssetIds: [],
      dependencyJobIds: [],
      status: 'ready',
      maxAttempts: item.maxAttempts,
      attemptTimeoutSeconds: item.attemptTimeoutSeconds,
      scheduledFor: NOW,
      createdAt: NOW,
    })),
    testOnly: true,
  }
}

function buildPackageRecord(
  toolCapabilityManifest: CanonicalToolAuthorizationManifest,
): AuthorityExecutionPackageRecord {
  const payload = {
    id: 'package_cloud_dispatch',
    source: 'canonical_edit_authority' as const,
    purpose: 'private_internal_execution_handoff' as const,
    snapshotId: 'snapshot_cloud_dispatch',
    planId: 'plan_cloud_dispatch',
    estimateId: 'estimate_cloud_dispatch',
    reservationId: 'reservation_cloud_dispatch',
    projectId: 'project_cloud_dispatch',
    editSessionId: 'session_cloud_dispatch',
    snapshotHash: SHA,
    planHash: SHA,
    estimateHash: SHA,
    workGraphHash: SHA,
    approvedAssetManifestHash: SHA,
    approvedSourceAssetManifestHash: SHA,
    toolCapabilityManifestRef: {
      sha256: sha256AuthorityValue(toolCapabilityManifest),
      byteLength: 1,
    },
    createdByUserId: 'user_cloud_dispatch',
    createdAt: NOW,
  }
  return { ...payload, packageHash: sha256AuthorityValue(payload) }
}

function buildQueueDefinition(
  executionPackage: ReturnType<typeof createCanonicalApprovedEditExecutionPackage>,
): CanonicalPrivatePackageWorkQueueDefinition {
  const proven = createCanonicalPrivateProvenToolPlacementCatalog()
  const toolPlacement = new Map(proven.tools.map((tool) => [tool.canonicalToolId, tool]))
  const workItemsById = new Map(executionPackage.approvedWorkItems.map((item) => [item.id, item]))
  const jobs = executionPackage.jobs.map((job, canonicalOrder) => {
    const workItem = workItemsById.get(job.approvedWorkItemId)!
    const tool = workItem.approvedToolIds[0]
      ? toolPlacement.get(workItem.approvedToolIds[0])
      : undefined
    const workerType = tool?.workerType ?? toolFreeWorkerType(workItem.workerClass)
    const resource = tool ?? toolFreeResource(toolFreeWorkerType(workItem.workerClass))
    const payload = {
      canonicalOrder,
      jobId: job.id,
      approvedWorkItemId: job.approvedWorkItemId,
      workItemKey: job.workItemKey,
      required: workItem.required,
      dependencyJobIds: [...job.dependencyJobIds],
      workerType,
      resourceClassId: resource.resourceClassId,
      plannedCloudExecutionTarget: workerType === 'api_service'
        ? 'cloud_run_service' as const
        : 'cloud_run_job' as const,
      preferredAccelerator: workerType === 'gpu_ai_worker'
        ? 'nvidia_l4' as const
        : 'none' as const,
      placementHash: tool?.placementHash ?? sha256AuthorityValue({
        workerType,
        resourceClassId: resource.resourceClassId,
        workItemId: workItem.id,
      }),
      privateExecutionReady: true,
      providerExecutionMode: 'none' as const,
      maxAttempts: job.maxAttempts,
      attemptTimeoutSeconds: job.attemptTimeoutSeconds,
      scheduledFor: job.scheduledFor,
    }
    return {
      ...payload,
      definitionHash: sha256AuthorityValue(payload),
    }
  })
  const payload = {
    schemaVersion: 'canonical-private-package-work-queue-definition-v1' as const,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: executionPackage.workspaceId,
      projectId: executionPackage.projectId,
      editSessionId: executionPackage.editSessionId,
      packageRecordId: executionPackage.packageRecordId,
      approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
      packageHash: executionPackage.packageHash,
      snapshotHash: executionPackage.snapshotHash,
      workGraphHash: executionPackage.workGraphHash,
      placementManifestHash: 'b'.repeat(64),
      toolExecutionAuthorityHash: 'c'.repeat(64),
      approvedResourcePlacementAuthorityHash: 'd'.repeat(64),
    },
    jobs,
    summary: {
      totalJobCount: jobs.length,
      requiredJobCount: jobs.filter((job) => job.required).length,
      cpuAnalysisJobCount: jobs.filter((job) => job.workerType === 'cpu_analysis_worker').length,
      gpuJobCount: jobs.filter((job) => job.workerType === 'gpu_ai_worker').length,
      renderJobCount: jobs.filter((job) => job.workerType === 'render_worker').length,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

function toolFreeWorkerType(workerClass: string) {
  if (workerClass === 'qa_worker') return 'qa_worker' as const
  if (workerClass === 'tool_readiness_worker') return 'tool_readiness_worker' as const
  return 'api_service' as const
}

function toolFreeResource(workerType: 'api_service' | 'qa_worker' | 'tool_readiness_worker') {
  if (workerType === 'qa_worker') return { resourceClassId: 'qa_cpu_standard_v1' as const }
  if (workerType === 'tool_readiness_worker') {
    return { resourceClassId: 'tool_readiness_cpu_v1' as const }
  }
  return { resourceClassId: 'control_plane_cpu_v1' as const }
}

function rehashQueueDefinition(definition: CanonicalPrivatePackageWorkQueueDefinition): void {
  for (const job of definition.jobs) {
    const payload = { ...job }
    Reflect.deleteProperty(payload, 'definitionHash')
    job.definitionHash = sha256AuthorityValue(payload)
  }
  const payload = { ...definition }
  Reflect.deleteProperty(payload, 'definitionHash')
  definition.definitionHash = sha256AuthorityValue(payload)
}

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}
