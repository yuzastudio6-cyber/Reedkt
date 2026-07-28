import assert from 'node:assert/strict'

import {
  CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
  assertCanonicalApprovedWorkGraphResourcePlacementAuthority,
  assertCanonicalPrivateProvenToolPlacementCatalog,
  canonicalPrivateResourcePlacementManifestSchema,
  canonicalPrivateToolPlacementFor,
  createCanonicalApprovedWorkGraphResourcePlacementAuthority,
  createCanonicalPrivateProvenToolPlacementCatalog,
  type CanonicalApprovedWorkGraphResourcePlacementAuthority,
  type CanonicalPrivateExecutableWorkerType,
  type CanonicalPrivateResourcePlacementManifest,
} from '../edit-architecture/canonical-private-resource-placement-authority'
import {
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  createCanonicalPrivateResourceSchedulingEvidence,
  executeCanonicalPrivateResourceWave,
  selectCanonicalPrivateResourceWave,
  type CanonicalPrivateResourceSchedulableJob,
  type CanonicalPrivateResourceWaveResult,
} from '../services/canonical-private-resource-wave-scheduler'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

interface SmokeJob extends CanonicalPrivateResourceSchedulableJob {
  workerType: CanonicalPrivateExecutableWorkerType
}

async function main() {
  const catalog = createCanonicalPrivateProvenToolPlacementCatalog()
  assert.deepEqual(catalog.summary, {
    totalProvenToolCount: 50,
    cpuAnalysisToolCount: 28,
    gpuToolCount: 3,
    renderToolCount: 19,
    qaToolCount: 0,
    allToolsHaveExactResourcePlacement: true,
    cloudDispatchAuthorized: false,
    productionExecutionAuthorized: false,
  })
  assert.equal(catalog.tools.length, 50)
  assertCanonicalPrivateProvenToolPlacementCatalog(catalog)

  for (const toolId of ['rembg', 'kornia', 'deepfilternet'] as const) {
    const placement = canonicalPrivateToolPlacementFor(catalog, toolId)
    assert.equal(placement.workerType, 'gpu_ai_worker')
    assert.equal(placement.resourceClassId, 'gpu_l4_standard_v1')
    assert.equal(placement.preferredAccelerator, 'nvidia_l4')
    assert.equal(placement.workerConcurrencyLimit, 1)
  }
  for (const toolId of ['ffmpeg', 'remotion'] as const) {
    const placement = canonicalPrivateToolPlacementFor(catalog, toolId)
    assert.equal(placement.workerType, 'render_worker')
    assert.equal(placement.resourceClassId, 'render_cpu_high_memory_v1')
    assert.equal(placement.preferredAccelerator, 'none')
    assert.equal(placement.workerConcurrencyLimit, 2)
  }
  const ffprobe = canonicalPrivateToolPlacementFor(catalog, 'ffprobe')
  assert.equal(ffprobe.workerType, 'cpu_analysis_worker')
  assert.equal(ffprobe.resourceClassId, 'cpu_analysis_standard_v1')
  assert.equal(ffprobe.workerConcurrencyLimit, 4)

  const approvedPlacementAuthority =
    createCanonicalApprovedWorkGraphResourcePlacementAuthority({
      workItems: [
        {
          workItemKey: 'validate-approved-snapshot',
          workItemType: 'validate_approved_snapshot',
          workerClass: 'authority_worker',
          required: true,
          approvedToolIds: [],
          approvedToolOperationIds: [],
          providerExecutionMode: 'none',
        },
        {
          workItemKey: 'render-approved-export',
          workItemType: 'render_final_export',
          workerClass: 'render_worker',
          required: true,
          approvedToolIds: ['ffmpeg'],
          approvedToolOperationIds: [
            canonicalPrivateToolPlacementFor(catalog, 'ffmpeg').operationId,
          ],
          providerExecutionMode: 'none',
        },
        {
          workItemKey: 'living-frame-mask-pending',
          workItemType: 'generate_mask_asset',
          workerClass:
            CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
          required: true,
          approvedToolIds: [],
          approvedToolOperationIds: [],
          providerExecutionMode: 'none',
        },
      ],
      tools: [toolIdentityForPlacement(catalog, 'ffmpeg')],
    })
  assert.equal(approvedPlacementAuthority.summary.totalWorkItemCount, 3)
  assert.equal(approvedPlacementAuthority.summary.privatelyExecutableWorkItemCount, 2)
  assert.equal(approvedPlacementAuthority.summary.blockedWorkItemCount, 1)
  const livingFramePendingPlacement =
    approvedPlacementAuthority.placements.find(
      (placement) =>
        placement.workItemKey ===
        'living-frame-mask-pending',
    )
  assert.ok(livingFramePendingPlacement)
  assert.equal(
    livingFramePendingPlacement.placementSource,
    'living_frame_operation_admission_pending',
  )
  assert.equal(
    livingFramePendingPlacement.privateExecutionReady,
    false,
  )
  assert.equal(
    livingFramePendingPlacement.requiredGate,
    'canonical_living_frame_dependency_input_operation_admission',
  )
  assert.equal(approvedPlacementAuthority.boundaries.approvedSnapshotHashBindingRequired, true)
  assert.equal(approvedPlacementAuthority.boundaries.placementMutationAfterApprovalAllowed, false)
  assertCanonicalApprovedWorkGraphResourcePlacementAuthority({
    value: approvedPlacementAuthority,
    workItems: [
      {
        workItemKey: 'render-approved-export',
        workItemType: 'render_final_export',
        workerClass: 'render_worker',
        required: true,
        approvedToolIds: ['ffmpeg'],
        approvedToolOperationIds: [
          canonicalPrivateToolPlacementFor(catalog, 'ffmpeg').operationId,
        ],
        providerExecutionMode: 'none',
      },
      {
        workItemKey: 'validate-approved-snapshot',
        workItemType: 'validate_approved_snapshot',
        workerClass: 'authority_worker',
        required: true,
        approvedToolIds: [],
        approvedToolOperationIds: [],
        providerExecutionMode: 'none',
      },
      {
        workItemKey: 'living-frame-mask-pending',
        workItemType: 'generate_mask_asset',
        workerClass:
          CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
        required: true,
        approvedToolIds: [],
        approvedToolOperationIds: [],
        providerExecutionMode: 'none',
      },
    ],
    tools: [toolIdentityForPlacement(catalog, 'ffmpeg')],
  })
  for (const mutation of [
    (value: CanonicalApprovedWorkGraphResourcePlacementAuthority) => {
      value.placements.find((placement) =>
        placement.workItemKey === 'render-approved-export')!.resourceClassId =
          'qa_cpu_standard_v1'
    },
    (value: CanonicalApprovedWorkGraphResourcePlacementAuthority) => {
      value.placements.find((placement) =>
        placement.workItemKey === 'render-approved-export')!.workerConcurrencyLimit = 4
    },
    (value: CanonicalApprovedWorkGraphResourcePlacementAuthority) => {
      value.placements.find((placement) =>
        placement.workItemKey === 'render-approved-export')!.toolProofHash = 'f'.repeat(64)
    },
  ]) {
    const changed = structuredClone(approvedPlacementAuthority)
    mutation(changed)
    rehashApprovedPlacementAuthority(changed)
    assert.throws(() => assertCanonicalApprovedWorkGraphResourcePlacementAuthority({
      value: changed,
      workItems: approvedPlacementAuthority.placements.map((placement) => ({
        workItemKey: placement.workItemKey,
        workItemType: placement.workItemType,
        workerClass: placement.canonicalWorkerClass,
        required: placement.required,
        approvedToolIds: [...placement.approvedToolIds],
        approvedToolOperationIds: [...placement.approvedToolOperationIds],
        providerExecutionMode: placement.providerExecutionMode,
      })),
      tools: [toolIdentityForPlacement(catalog, 'ffmpeg')],
    }))
  }

  for (const mutation of [
    (value: typeof catalog) => {
      value.tools[0]!.workerType = value.tools[0]!.workerType === 'render_worker'
        ? 'cpu_analysis_worker'
        : 'render_worker'
    },
    (value: typeof catalog) => { value.tools[0]!.toolIdentityHash = '0'.repeat(64) },
    (value: typeof catalog) => { value.tools[0]!.toolProfilePlacementHash = '1'.repeat(64) },
    (value: typeof catalog) => { value.catalogHash = '2'.repeat(64) },
  ]) {
    const changed = structuredClone(catalog)
    mutation(changed)
    assert.throws(() => assertCanonicalPrivateProvenToolPlacementCatalog(changed))
  }

  const jobs: SmokeJob[] = [
    smokeJob('job_root', 'api_service', []),
    smokeJob('job_cpu_a', 'cpu_analysis_worker', ['job_root']),
    smokeJob('job_cpu_b', 'cpu_analysis_worker', ['job_root']),
    smokeJob('job_cpu_c', 'cpu_analysis_worker', ['job_root']),
    smokeJob('job_cpu_d', 'cpu_analysis_worker', ['job_root']),
    smokeJob('job_render_a', 'render_worker', ['job_cpu_a', 'job_cpu_b']),
    smokeJob('job_render_b', 'render_worker', ['job_cpu_c', 'job_cpu_d']),
    smokeJob('job_merge', 'render_worker', ['job_render_a', 'job_render_b']),
    smokeJob('job_qa', 'qa_worker', ['job_merge']),
  ]
  const placementManifest = smokePlacementManifest(
    jobs,
    catalog.catalogHash,
    approvedPlacementAuthority.authorityHash,
  )
  const firstExecution = await executeGraph(jobs, placementManifest)
  const secondExecution = await executeGraph(jobs, placementManifest)
  assert.deepEqual(firstExecution.waveHashes, secondExecution.waveHashes)
  assert.deepEqual(firstExecution.waveWidths, [1, 4, 2, 1, 1])
  assert.equal(firstExecution.observedCallbackPeak, 4)
  assert.equal(firstExecution.evidence.waveCount, 5)
  assert.equal(firstExecution.evidence.parallelWaveCount, 2)
  assert.equal(firstExecution.evidence.maximumWaveWidth, 4)
  assert.equal(firstExecution.evidence.actualExecutionCount, 9)
  assert.equal(firstExecution.evidence.parallelJobCount, 6)
  assert.equal(firstExecution.evidence.observedPeakConcurrency, 4)
  assert.deepEqual(firstExecution.evidence.observedPeakConcurrencyByWorkerType, {
    api_service: 1,
    cpu_analysis_worker: 4,
    render_worker: 2,
    qa_worker: 1,
  })
  assert.equal(firstExecution.evidence.cloudDispatchAuthorized, false)
  assert.equal(firstExecution.evidence.distributedExecutionProven, false)
  assert.equal(
    firstExecution.evidence.concurrencyMeasurementScope,
    'in_process_orchestrator_execution_tasks',
  )
  assert.equal(firstExecution.evidence.physicalWorkerProcessConcurrencyProven, false)
  assert.equal(firstExecution.evidence.cloudWorkerConcurrencyProven, false)
  assert.equal(firstExecution.evidence.performanceSlaProven, false)
  assert.equal(firstExecution.evidence.immutableSnapshotPlacementBindingProven, true)
  assert.equal(
    firstExecution.evidence.approvedResourcePlacementAuthorityHash,
    approvedPlacementAuthority.authorityHash,
  )

  const cpuWave = selectCanonicalPrivateResourceWave({
    waveNumber: 2,
    jobs,
    remainingJobIds: new Set(jobs.slice(1).map((job) => job.id)),
    completedJobIds: new Set(['job_root']),
    placementManifest,
  })
  assert(cpuWave)
  let independentSiblingFinished = false
  const failureIsolation = await executeCanonicalPrivateResourceWave({
    wave: { ...cpuWave, entries: cpuWave.entries.slice(0, 2) },
    execute: async ({ job }) => {
      if (job.id === 'job_cpu_a') {
        await delay(5)
        throw new Error('bounded smoke failure')
      }
      await delay(25)
      independentSiblingFinished = true
      return job.id
    },
  })
  assert.equal(independentSiblingFinished, true)
  assert.deepEqual(failureIsolation.settled.map((entry) => entry.status), [
    'rejected',
    'fulfilled',
  ])
  assert.equal(failureIsolation.observedPeakConcurrency, 2)

  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    exactProvenToolPlacements: catalog.summary,
    configuredGlobalMaxConcurrency: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    deterministicWaveWidths: firstExecution.waveWidths,
    schedulingEvidence: firstExecution.evidence,
    failureIsolationWaitedForIndependentSibling: independentSiblingFinished,
    boundaries: {
      localSingleHostOnly: true,
      placementFrozenInApprovedSnapshot: true,
      cloudDispatchAuthorized: false,
      providerActivationAuthorized: false,
      productionExecutionAuthorized: false,
    },
  }, null, 2)}\n`)
}

async function executeGraph(
  jobs: readonly SmokeJob[],
  placementManifest: CanonicalPrivateResourcePlacementManifest,
) {
  const remaining = new Set(jobs.map((job) => job.id))
  const completed = new Set<string>()
  const waveResults: Array<CanonicalPrivateResourceWaveResult<SmokeJob, string>> = []
  let activeCallbacks = 0
  let observedCallbackPeak = 0
  let waveNumber = 1
  while (true) {
    const wave = selectCanonicalPrivateResourceWave({
      waveNumber,
      jobs,
      remainingJobIds: remaining,
      completedJobIds: completed,
      placementManifest,
    })
    if (!wave) break
    const result = await executeCanonicalPrivateResourceWave({
      wave,
      execute: async ({ job }) => {
        assert(job.dependencyJobIds.every((dependencyJobId) => completed.has(dependencyJobId)))
        activeCallbacks += 1
        observedCallbackPeak = Math.max(observedCallbackPeak, activeCallbacks)
        try {
          await delay(10)
          return job.id
        } finally {
          activeCallbacks -= 1
        }
      },
    })
    assert(result.settled.every((entry) => entry.status === 'fulfilled'))
    for (const entry of result.settled) {
      completed.add(entry.entry.job.id)
      remaining.delete(entry.entry.job.id)
    }
    waveResults.push(result)
    waveNumber += 1
  }
  assert.equal(remaining.size, 0)
  assert.equal(completed.size, jobs.length)
  return {
    observedCallbackPeak,
    waveWidths: waveResults.map((result) => result.wave.entries.length),
    waveHashes: waveResults.map((result) => result.wave.waveHash),
    evidence: createCanonicalPrivateResourceSchedulingEvidence({
      placementManifest,
      waveResults,
    }),
  }
}

function smokeJob(
  id: string,
  workerType: CanonicalPrivateExecutableWorkerType,
  dependencyJobIds: string[],
): SmokeJob {
  return {
    id,
    approvedWorkItemId: `work_item_${id.slice(4)}`,
    dependencyJobIds,
    workerType,
  }
}

function smokePlacementManifest(
  jobs: readonly SmokeJob[],
  provenToolPlacementCatalogHash: string,
  approvedResourcePlacementAuthorityHash: string,
): CanonicalPrivateResourcePlacementManifest {
  const placements = jobs.map((job) => {
    const resource = resourceForWorker(job.workerType)
    const withoutHash = {
      jobId: job.id,
      approvedWorkItemId: job.approvedWorkItemId,
      workItemKey: `work_key_${job.id.slice(4)}`,
      workItemType: 'custom',
      canonicalWorkerClass: job.workerType,
      required: true,
      approvedToolIds: [`tool_${job.id.slice(4)}`],
      approvedToolOperationIds: [`operation.${job.id.slice(4)}.v1`],
      providerExecutionMode: 'none' as const,
      placementSource: 'proven_tool_identity' as const,
      privateExecutionReady: true,
      runtimeRunnerClass: `runner.${job.id.slice(4)}.v1`,
      toolIdentityHash: sha256AuthorityValue(['identity', job.id]),
      toolProofHash: sha256AuthorityValue(['proof', job.id]),
      workerType: job.workerType,
      ...resource,
      cpuAllowed: true,
      workerConcurrencyLimit: workerLimit(job.workerType),
      globalConcurrencyLimit: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
      regionPolicyId: 'project_selected_data_local_region_v1' as const,
      objectTransportPolicyId: 'immutable_private_object_identity_v1' as const,
    }
    return { ...withoutHash, placementHash: sha256AuthorityValue(withoutHash) }
  })
  const hash = (label: string) => sha256AuthorityValue(['smoke', label])
  const payload = {
    schemaVersion: 'canonical-private-resource-placement-manifest-v2' as const,
    source: 'canonical_execution_package_resource_reconciliation' as const,
    placementPolicyVersion: 'canonical-private-resource-placement-policy-v1' as const,
    identity: {
      workspaceId: 'workspace_smoke',
      projectId: 'project_smoke',
      editSessionId: 'edit_session_smoke',
      packageRecordId: 'package_smoke',
      approvedPlanSnapshotId: 'snapshot_smoke',
      packageHash: hash('package'),
      snapshotHash: hash('snapshot'),
      workGraphHash: hash('work_graph'),
      toolCapabilityManifestHash: hash('tool_manifest'),
      toolExecutionAuthorityHash: hash('tool_execution_authority'),
      approvedResourcePlacementAuthorityHash,
      approvedResourcePlacementAuthorityBlobHash: hash('tool_execution_authority_blob'),
      provenToolPlacementCatalogHash,
    },
    placements,
    summary: {
      totalJobCount: jobs.length,
      privatelyExecutableJobCount: jobs.length,
      blockedJobCount: 0,
      controlPlaneJobCount: countWorker(jobs, 'api_service'),
      cpuAnalysisJobCount: countWorker(jobs, 'cpu_analysis_worker'),
      gpuJobCount: countWorker(jobs, 'gpu_ai_worker'),
      renderJobCount: countWorker(jobs, 'render_worker'),
      qaJobCount: countWorker(jobs, 'qa_worker'),
      maximumGlobalConcurrency: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
      callerSelectedPlacement: false as const,
      allPlacementsServerDerived: true as const,
    },
    boundaries: {
      privateInternalOnly: true as const,
      placementFrozenInApprovedSnapshot: true as const,
      placementBoundToExecutionPackage: true as const,
      cloudDispatchAuthorized: false as const,
      googleCloudResourceMutationAuthorized: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivateResourcePlacementManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

function toolIdentityForPlacement(
  catalog: ReturnType<typeof createCanonicalPrivateProvenToolPlacementCatalog>,
  toolId: 'ffmpeg',
) {
  const placement = canonicalPrivateToolPlacementFor(catalog, toolId)
  return {
    canonicalToolId: toolId,
    operationId: placement.operationId,
    identityHash: placement.toolIdentityHash,
    proofHash: placement.toolProofHash,
    verificationState: 'canonical_e2e_verified',
    runtime: { runnerClass: placement.runnerClass },
    readiness: {
      privateInternalEndToEndReady: true,
      privateInternalJobAdapterReady: true,
    },
  }
}

function rehashApprovedPlacementAuthority(
  authority: CanonicalApprovedWorkGraphResourcePlacementAuthority,
): void {
  for (const placement of authority.placements) {
    const withoutHash = { ...placement } as Partial<typeof placement>
    delete withoutHash.placementHash
    placement.placementHash = sha256AuthorityValue(withoutHash)
  }
  const withoutHash = { ...authority } as Partial<typeof authority>
  delete withoutHash.authorityHash
  authority.authorityHash = sha256AuthorityValue(withoutHash)
}

function resourceForWorker(workerType: CanonicalPrivateExecutableWorkerType) {
  return {
    api_service: {
      resourceClassId: 'control_plane_cpu_v1',
      plannedCloudExecutionTarget: 'cloud_run_service',
      preferredAccelerator: 'none',
    },
    cpu_analysis_worker: {
      resourceClassId: 'cpu_analysis_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    gpu_ai_worker: {
      resourceClassId: 'gpu_l4_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'nvidia_l4',
    },
    render_worker: {
      resourceClassId: 'render_cpu_high_memory_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    qa_worker: {
      resourceClassId: 'qa_cpu_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    tool_readiness_worker: {
      resourceClassId: 'tool_readiness_cpu_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
  }[workerType] as {
    resourceClassId: 'control_plane_cpu_v1' | 'cpu_analysis_standard_v1' |
      'gpu_l4_standard_v1' | 'render_cpu_high_memory_v1' | 'qa_cpu_standard_v1' |
      'tool_readiness_cpu_v1'
    plannedCloudExecutionTarget: 'cloud_run_service' | 'cloud_run_job'
    preferredAccelerator: 'none' | 'nvidia_l4'
  }
}

function workerLimit(workerType: CanonicalPrivateExecutableWorkerType): number {
  return {
    api_service: 20,
    cpu_analysis_worker: 4,
    gpu_ai_worker: 1,
    render_worker: 2,
    qa_worker: 4,
    tool_readiness_worker: 1,
  }[workerType]
}

function countWorker(
  jobs: readonly SmokeJob[],
  workerType: CanonicalPrivateExecutableWorkerType,
): number {
  return jobs.filter((job) => job.workerType === workerType).length
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
