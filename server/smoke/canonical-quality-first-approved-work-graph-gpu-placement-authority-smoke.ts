import assert from 'node:assert/strict'

import {
  assertCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority,
  canonicalQualityFirstApprovedWorkGraphGpuPlacementFor,
  canonicalQualityFirstGpuRouteIdsForPlacement,
  createCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority,
  type CanonicalQualityFirstGpuPlacementWorkItem,
} from '../edit-architecture/canonical-quality-first-approved-work-graph-gpu-placement-authority'
import {
  canonicalPrivateToolPlacementFor,
  createCanonicalApprovedWorkGraphResourcePlacementAuthority,
  createCanonicalPrivateProvenToolPlacementCatalog,
  type CanonicalResourcePlacementAuthorityWorkItem,
  type CanonicalResourcePlacementToolIdentity,
} from '../edit-architecture/canonical-private-resource-placement-authority'
import {
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  getToolIdentityRecord,
} from '../tool-execution/proven-tool-identity-catalog'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const catalog = createCanonicalPrivateProvenToolPlacementCatalog()
const ffmpegOperation = canonicalPrivateToolPlacementFor(
  catalog,
  'ffmpeg',
).operationId
const ffprobeOperation = canonicalPrivateToolPlacementFor(
  catalog,
  'ffprobe',
).operationId

const workItems: CanonicalQualityFirstGpuPlacementWorkItem[] = [
  workItem({
    workItemKey: 'control-validate-plan',
    workItemType: 'validate_approved_snapshot',
    workerClass: 'authority_worker',
  }),
  workItem({
    workItemKey: 'provider-visual-intelligence',
    workItemType: 'analyze_complete_source_video',
    workerClass: 'provider_worker',
    providerExecutionMode: 'primary',
  }),
  workItem({
    workItemKey: 'sam31-track-subject',
    workItemType: 'generate_mask_asset',
    workerClass: CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
    executionInput: {
      approvedToolOperationIds: [],
      pendingOperationAuthority: {
        operationClass:
          'temporal_video_subject_segmentation_and_tracking',
        requestedToolId: 'sam3_1',
        requestedToolOperationId:
          'tool.sam3_1.segment_and_track_subject.v1',
      },
    },
  }),
  workItem({
    workItemKey: 'l4-render',
    workItemType: 'render_final_export',
    workerClass: 'render_worker',
    approvedToolIds: ['ffmpeg'],
    executionInput: {
      approvedToolOperationIds: [ffmpegOperation],
    },
  }),
  workItem({
    workItemKey: 'l4-qa',
    workItemType: 'run_final_qa',
    workerClass: 'qa_worker',
  }),
  workItem({
    workItemKey: 'l4-helper-ffprobe',
    workItemType: 'probe_private_media',
    workerClass: 'media_analysis_worker',
    approvedToolIds: ['ffprobe'],
    executionInput: {
      approvedToolOperationIds: [ffprobeOperation],
    },
  }),
]

const sourceAuthority = createCanonicalApprovedWorkGraphResourcePlacementAuthority({
  workItems: workItems.map(sourceWorkItem),
  tools: [
    toolIdentity('ffmpeg'),
    toolIdentity('ffprobe'),
  ],
})
const authority =
  createCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority({
    sourceAuthority,
    workItems,
  })

assert.equal(
  assertCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority({
    value: authority,
    sourceAuthority,
    workItems,
  }).authorityHash,
  authority.authorityHash,
)
assert.equal(authority.summary.totalWorkItemCount, 6)
assert.equal(authority.summary.lightweightControlPlaneCount, 1)
assert.equal(authority.summary.externalProviderCount, 1)
assert.equal(authority.summary.a100PrimaryL4FallbackCount, 1)
assert.equal(authority.summary.l4StandardPrimaryCount, 2)
assert.equal(authority.summary.l4ColocatedHelperCount, 1)
assert.equal(authority.summary.cpuOnlySubstantiveWorkItemCount, 0)
assert.equal(authority.boundaries.legacyCpuPlacementMayAuthorizeFreshPlan, false)
assert.equal(authority.boundaries.controlPlaneCpuMayExecuteMediaOrModels, false)
assert.equal(authority.boundaries.cloudDispatchAuthorized, false)
assert.equal(authority.lifecycle.minimumIdleA100Instances, 0)
assert.equal(authority.lifecycle.minimumIdleL4Instances, 0)
assert.equal(
  authority.pricing.exactBillingAccountEffectiveRatesRequiredBeforeApproval,
  true,
)

const sam31 = canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
  authority,
  'sam31-track-subject',
)
assert.equal(
  sam31.targetClass,
  'a100_80gb_heavy_primary_l4_fallback',
)
assert.equal(sam31.primaryAccelerator, 'nvidia_a100_80gb')
assert.equal(sam31.fallbackAccelerator, 'nvidia_l4')
assert.equal(sam31.classifiedFallbackRequiresKnownSafePrimaryFailure, true)
assert.equal(sam31.cpuOnlySubstantiveExecutionAllowed, false)
assert.deepEqual(canonicalQualityFirstGpuRouteIdsForPlacement(sam31), [
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])

for (const workItemKey of ['l4-render', 'l4-qa'] as const) {
  const placement = canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
    authority,
    workItemKey,
  )
  assert.equal(placement.targetClass, 'l4_standard_gpu_primary')
  assert.equal(placement.primaryAccelerator, 'nvidia_l4')
  assert.equal(placement.fallbackRouteId, null)
  assert.equal(placement.cpuOnlySubstantiveExecutionAllowed, false)
}
assert.equal(
  canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
    authority,
    'l4-helper-ffprobe',
  ).targetClass,
  'l4_colocated_gpu_helper',
)
assert.equal(
  canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
    authority,
    'control-validate-plan',
  ).targetClass,
  'lightweight_control_plane_non_gpu',
)
assert.equal(
  canonicalQualityFirstApprovedWorkGraphGpuPlacementFor(
    authority,
    'provider-visual-intelligence',
  ).targetClass,
  'external_provider_owned',
)

const tamperCases: Array<(value: typeof authority) => void> = [
  (value) => {
    value.placements.find((placement) =>
      placement.workItemKey === 'sam31-track-subject')!
      .primaryAccelerator = 'nvidia_l4'
  },
  (value) => {
    value.placements.find((placement) =>
      placement.workItemKey === 'l4-render')!
      .cpuOnlySubstantiveExecutionAllowed = true as false
  },
  (value) => {
    value.placements.find((placement) =>
      placement.workItemKey === 'l4-qa')!
      .primaryRouteId = 'a100_80gb_heavy_primary'
  },
  (value) => {
    value.summary.cpuOnlySubstantiveWorkItemCount = 1 as 0
  },
  (value) => {
    value.lifecycle.minimumIdleL4Instances = 1 as 0
  },
  (value) => {
    value.boundaries.cloudDispatchAuthorized = true as false
  },
  (value) => {
    value.authorityHash = '0'.repeat(64)
  },
]

for (const mutate of tamperCases) {
  const changed = structuredClone(authority)
  mutate(changed)
  if (changed.authorityHash !== '0'.repeat(64)) {
    for (const placement of changed.placements) {
      const payload = { ...placement }
      Reflect.deleteProperty(payload, 'placementHash')
      placement.placementHash = sha256AuthorityValue(payload)
    }
    const payload = { ...changed }
    Reflect.deleteProperty(payload, 'authorityHash')
    changed.authorityHash = sha256AuthorityValue(payload)
  }
  assert.throws(() =>
    assertCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority({
      value: changed,
      sourceAuthority,
      workItems,
    }))
}

const sam2Work = workItem({
  workItemKey: 'forbidden-sam2',
  workItemType: 'generate_mask_asset',
  workerClass: 'gpu_ai_worker',
  approvedToolIds: ['sam2'],
  executionInput: {
    approvedToolOperationIds: [
      'tool.sam2.segment_and_track_subject.v1',
    ],
  },
})
const sourceSam31Placement = structuredClone(
  sourceAuthority.placements.find((placement) =>
    placement.workItemKey === 'sam31-track-subject')!,
)
Object.assign(sourceSam31Placement, {
  workItemKey: sam2Work.workItemKey,
  workItemType: sam2Work.workItemType,
  canonicalWorkerClass: sam2Work.workerClass,
  approvedToolIds: ['sam2'],
  approvedToolOperationIds: [
    'tool.sam2.segment_and_track_subject.v1',
  ],
  placementSource: 'tool_registry_contract_only',
  privateExecutionReady: false,
  requiredGate: 'immutable_historical_evidence_reread_only',
})
const sam2PlacementPayload = { ...sourceSam31Placement }
Reflect.deleteProperty(sam2PlacementPayload, 'placementHash')
sourceSam31Placement.placementHash = sha256AuthorityValue(
  sam2PlacementPayload,
)
const sourceAuthorityPayload = { ...sourceAuthority }
Reflect.deleteProperty(sourceAuthorityPayload, 'authorityHash')
const sam2SourcePayload = {
  ...sourceAuthorityPayload,
  workItemAuthorityHash: sha256AuthorityValue(sourceWorkItem(sam2Work)),
  toolIdentityAuthorityHash: sha256AuthorityValue({
    toolId: 'sam2',
    historical: true,
  }),
  placements: [sourceSam31Placement],
  summary: {
    ...sourceAuthority.summary,
    totalWorkItemCount: 1,
    privatelyExecutableWorkItemCount: 0,
    blockedWorkItemCount: 1,
  },
}
const sam2Source = {
  ...sam2SourcePayload,
  authorityHash: sha256AuthorityValue(sam2SourcePayload),
} as typeof sourceAuthority
assert.throws(() =>
  createCanonicalQualityFirstApprovedWorkGraphGpuPlacementAuthority({
    sourceAuthority: sam2Source,
    workItems: [sam2Work],
  }), /Historical tool sam2/u)

console.log(JSON.stringify({
  smoke: 'canonical-quality-first-approved-work-graph-gpu-placement-authority',
  checks: 42,
  summary: authority.summary,
  sam31Routes: canonicalQualityFirstGpuRouteIdsForPlacement(sam31),
  adversarialCases: tamperCases.length + 1,
  freshPlanPlacementAuthority:
    authority.boundaries.freshPlanPlacementAuthority,
  cloudDispatchAuthorized: authority.boundaries.cloudDispatchAuthorized,
  productionReady: authority.boundaries.productionReady,
}))

function workItem(input: {
  workItemKey: string
  workItemType: string
  workerClass: string
  approvedToolIds?: string[]
  providerExecutionMode?: string
  executionInput?: Record<string, unknown>
}): CanonicalQualityFirstGpuPlacementWorkItem {
  return {
    workItemKey: input.workItemKey,
    workItemType: input.workItemType,
    workerClass: input.workerClass,
    approvedToolIds: input.approvedToolIds ?? [],
    providerExecutionMode: input.providerExecutionMode ?? 'none',
    executionInput: input.executionInput ?? {
      approvedToolOperationIds: [],
    },
  }
}

function sourceWorkItem(
  item: CanonicalQualityFirstGpuPlacementWorkItem,
): CanonicalResourcePlacementAuthorityWorkItem {
  return {
    workItemKey: item.workItemKey,
    workItemType: item.workItemType,
    workerClass: item.workerClass,
    required: true,
    approvedToolIds: [...item.approvedToolIds],
    approvedToolOperationIds: [
      ...item.executionInput.approvedToolOperationIds as string[],
    ],
    providerExecutionMode: item.providerExecutionMode,
  }
}

function toolIdentity(
  toolId: Parameters<typeof getToolIdentityRecord>[0],
): CanonicalResourcePlacementToolIdentity {
  const record = getToolIdentityRecord(toolId)
  return {
    canonicalToolId: record.canonicalToolId,
    operationId: record.operationId,
    identityHash: record.identityHash,
    proofHash: record.proofHash,
    verificationState: record.verificationState,
    runtime: { runnerClass: record.runtime.runnerClass },
    readiness: {
      privateInternalEndToEndReady:
        record.readiness.privateInternalEndToEndReady,
      privateInternalJobAdapterReady:
        record.readiness.privateInternalJobAdapterReady,
    },
  }
}
