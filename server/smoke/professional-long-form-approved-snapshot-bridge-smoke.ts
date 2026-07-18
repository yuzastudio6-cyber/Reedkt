import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
  PROFESSIONAL_LONG_FORM_CONTROLLER_INPUT_VERSION,
  PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS,
  PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY,
  assertProfessionalLongFormApprovedSnapshotProductionAuthority,
  buildProfessionalLongFormApprovedSnapshotBridge,
  verifyProfessionalLongFormApprovedSnapshotBridge,
  type ProfessionalLongFormApprovedSnapshotBridgeRequest,
} from '../edit-architecture/professional-long-form-approved-snapshot-bridge'
import {
  PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
  PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
  buildProfessionalLongFormObjectExecutionPlan,
  deriveProfessionalLongFormObjectPlanSeed,
  type ProfessionalLongFormObjectExecutionRequest,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const checks: string[] = []
const check = (condition: unknown, name: string): void => {
  assert.ok(condition, name)
  checks.push(name)
}

const maximumFixture = makeBridgeFixture('maximum')
const bridge = buildProfessionalLongFormApprovedSnapshotBridge(maximumFixture.request)
check(
  bridge.status ===
    'approved_snapshot_binding_contract_ready_persistence_and_execution_blocked' &&
  bridge.binding.plan.request.totalFrames === PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * 60 &&
  bridge.binding.plan.request.sourceRanges.length ===
    PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  'six_hour_five_hundred_twelve_range_plan_binds_to_exact_snapshot_contract',
)
check(
  bridge.expandedGraph.chunkCount === PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS &&
  bridge.expandedGraph.childWorkItemCount === 255 &&
  bridge.expandedGraph.childWorkItemCount <
    PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING &&
  bridge.expandedGraph.maximumDependencyCount === 127 &&
  bridge.expandedGraph.maximumDependencyCount <
    PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  'expanded_graph_fits_existing_canonical_job_and_dependency_caps',
)
check(
  bridge.expandedGraph.chunkRenderCount === bridge.expandedGraph.chunkCount &&
  bridge.expandedGraph.chunkQaCount === bridge.expandedGraph.chunkCount &&
  bridge.authority.everyChunkHasIndependentQaWorkItem &&
  bridge.authority.finalizerDependsOnEveryChunkQa,
  'every_object_chunk_retains_independent_qa_before_finalization',
)
check(
  bridge.binding.plan.workGraph.workItems.every((item) =>
    item.required && item.executionAuthorized === false) &&
  bridge.binding.request.controllerBinding.executionInput.childExecutionAuthorized === false,
  'snapshot_binding_and_child_graph_create_no_dispatch_or_execution_authority',
)
check(
  bridge.binding.planSeedHash === maximumFixture.seedHash &&
  bridge.binding.request.snapshot.componentRefs[
    PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY
  ]?.sha256 === maximumFixture.seedHash &&
  bridge.authority.snapshotIndependentSeedVerified,
  'snapshot_independent_seed_component_and_controller_hash_match',
)
check(
  bridge.authority.approvedSnapshotHashVerified &&
  bridge.authority.approvedPlanHashVerified &&
  bridge.authority.approvedEstimateHashVerified &&
  bridge.authority.approvedTimingHashVerified &&
  bridge.authority.fundedReservationIdentityVerified &&
  bridge.authority.approvedControllerIdentityVerified,
  'snapshot_plan_estimate_timing_reservation_and_controller_lineage_match',
)

const exactReplay = verifyProfessionalLongFormApprovedSnapshotBridge(bridge)
check(
  exactReplay.authorityHash === bridge.authorityHash &&
  exactReplay.expandedGraph.exactExpandedGraphHash ===
    bridge.expandedGraph.exactExpandedGraphHash,
  'exact_bridge_rebuild_and_replay_are_content_addressed',
)

const secondApprovalFixture = makeBridgeFixture('second-approval')
const secondApprovalBridge = buildProfessionalLongFormApprovedSnapshotBridge(
  secondApprovalFixture.request,
)
check(
  secondApprovalBridge.binding.planSeedHash === bridge.binding.planSeedHash &&
  secondApprovalBridge.binding.plan.authorityHash !== bridge.binding.plan.authorityHash &&
  secondApprovalBridge.binding.plan.chunks.every((chunk, index) =>
    chunk.expectedObject.objectIdentity ===
      bridge.binding.plan.chunks[index]?.expectedObject.objectIdentity),
  'same_seed_new_approval_reuses_content_identity_but_not_snapshot_authority',
)

const snapshotHashTamper = structuredClone(maximumFixture.request)
snapshotHashTamper.snapshot.snapshotHash = sha256AuthorityValue('tampered-snapshot')
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(snapshotHashTamper),
  /approved snapshot hash is invalid/i,
)
checks.push('snapshot_hash_tamper_is_rejected')

const seedRefTamper = structuredClone(maximumFixture.request)
seedRefTamper.snapshot.componentRefs[PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY] = {
  sha256: sha256AuthorityValue('wrong-seed'),
  byteLength: 1_024,
}
rehashSnapshot(seedRefTamper)
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(seedRefTamper),
  /seed or controller execution-input authority is invalid/i,
)
checks.push('seed_component_substitution_is_rejected')

const controllerInputTamper = structuredClone(maximumFixture.request)
controllerInputTamper.controllerBinding.executionInput.planSeedHash =
  sha256AuthorityValue('wrong-controller-seed')
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(controllerInputTamper),
  /seed or controller execution-input authority is invalid/i,
)
checks.push('controller_execution_input_tamper_is_rejected')

const controllerRefTamper = structuredClone(maximumFixture.request)
controllerRefTamper.controllerBinding.executionInputRef.sha256 =
  sha256AuthorityValue('wrong-controller-ref')
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(controllerRefTamper),
  /seed or controller execution-input authority is invalid/i,
)
checks.push('controller_blob_reference_tamper_is_rejected')

const missingController = structuredClone(maximumFixture.request)
missingController.snapshot.approvedWorkItemIds = ['another-approved-work-item']
rehashSnapshot(missingController)
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(missingController),
  /exact approved snapshot lineage/i,
)
checks.push('controller_must_exist_in_exact_approved_snapshot')

const estimateSubstitution = structuredClone(maximumFixture.request)
estimateSubstitution.snapshot.estimateHash = sha256AuthorityValue('different-estimate')
rehashSnapshot(estimateSubstitution)
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(estimateSubstitution),
  /exact approved snapshot lineage/i,
)
checks.push('approved_estimate_substitution_is_rejected')

const timingSubstitution = structuredClone(maximumFixture.request)
timingSubstitution.snapshot.timingHash = sha256AuthorityValue('different-timing')
rehashSnapshot(timingSubstitution)
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(timingSubstitution),
  /exact approved snapshot lineage/i,
)
checks.push('approved_timing_substitution_is_rejected')

const reservationSubstitution = structuredClone(maximumFixture.request)
reservationSubstitution.snapshot.reservationId = 'different-reservation'
rehashSnapshot(reservationSubstitution)
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(reservationSubstitution),
  /exact approved snapshot lineage/i,
)
checks.push('funded_reservation_substitution_is_rejected')

const planTamper = structuredClone(maximumFixture.request)
const tamperedPlan = planTamper.plan as ReturnType<
  typeof buildProfessionalLongFormObjectExecutionPlan
>
tamperedPlan.workGraph.workItems[0]!.expectedOutputIdentity =
  sha256AuthorityValue('tampered-output')
assert.throws(
  () => buildProfessionalLongFormApprovedSnapshotBridge(planTamper),
  /failed exact authority verification/i,
)
checks.push('expanded_child_graph_tamper_is_rejected')

const bridgeTamper = structuredClone(bridge)
bridgeTamper.expandedGraph.childWorkItemCount -= 1
assert.throws(
  () => verifyProfessionalLongFormApprovedSnapshotBridge(bridgeTamper),
  /failed exact authority verification/i,
)
checks.push('persisted_bridge_manifest_tamper_is_rejected')

assert.throws(
  () => assertProfessionalLongFormApprovedSnapshotProductionAuthority(bridge),
  /does not authorize persistence, job dispatch, object storage, media execution, cloud, product, or production/i,
)
checks.push('validated_bridge_cannot_self_promote_to_production')

check(
  bridge.readiness.approvedSnapshotBindingContractReady &&
  Object.values(bridge.readiness).filter(Boolean).length === 1 &&
  !bridge.readiness.canonicalSeedComponentPersistenceVerified &&
  !bridge.readiness.serverLoadedControllerPersistenceVerified &&
  !bridge.readiness.childJobDerivationVerified &&
  !bridge.readiness.objectStorePersistenceVerified &&
  !bridge.readiness.liveGoogleCloudVerified &&
  !bridge.readiness.productionReady,
  'persistence_job_storage_cloud_product_and_production_readiness_remain_false',
)

const serialized = JSON.stringify(bridge)
check(
  !serialized.includes('https://') &&
  !serialized.includes('gs://') &&
  !serialized.includes('signedUrl') &&
  !serialized.includes('serviceFeeMicros') &&
  !serialized.includes('customerCreditAmount') &&
  !serialized.includes('walletMutation'),
  'bridge_contains_no_url_secret_or_customer_commercial_authority',
)

const bridgeSource = readFileSync(
  'server/edit-architecture/professional-long-form-approved-snapshot-bridge.ts',
  'utf8',
)
check(
  !/from\s+['"](?:@google-cloud|@supabase|stripe|node:child_process|node:http|node:https)/u
    .test(bridgeSource) &&
  !/\bfetch\s*\(/u.test(bridgeSource) &&
  !/process\.env/u.test(bridgeSource),
  'bridge_source_has_no_cloud_database_provider_network_or_environment_activation_path',
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'professional-long-form-approved-snapshot-bridge-smoke-v1',
  status: bridge.status,
  checkCount: checks.length,
  checks,
  maximumCapacityEvidence: {
    sourceRangeCount: bridge.binding.plan.capacity.sourceRangeCount,
    chunkCount: bridge.expandedGraph.chunkCount,
    childWorkItemCount: bridge.expandedGraph.childWorkItemCount,
    maximumDependencyCount: bridge.expandedGraph.maximumDependencyCount,
    canonicalWorkItemCeiling: bridge.expandedGraph.canonicalWorkItemCeiling,
    canonicalDependencyCeiling: bridge.expandedGraph.canonicalDependencyCeiling,
    planSeedHash: bridge.binding.planSeedHash,
    bridgeAuthorityHash: bridge.authorityHash,
  },
  boundaries: bridge.readiness,
}, null, 2))

function makeBridgeFixture(suffix: string): {
  request: ProfessionalLongFormApprovedSnapshotBridgeRequest
  seedHash: string
} {
  const planHash = sha256AuthorityValue(`plan-${suffix}`)
  const estimateHash = sha256AuthorityValue(`estimate-${suffix}`)
  const parentWorkGraphHash = sha256AuthorityValue(`parent-work-graph-${suffix}`)
  const timingHash = sha256AuthorityValue('professional-long-form-approved-timing')
  const provisionalRequest = makeLongFormRequest({
    suffix,
    snapshotHash: sha256AuthorityValue('provisional-snapshot'),
    planHash,
    estimateHash,
    parentWorkGraphHash,
    timingHash,
  })
  const seedHash = sha256AuthorityValue(
    deriveProfessionalLongFormObjectPlanSeed(provisionalRequest),
  )
  const approvedControllerWorkItemId = `approved-controller-${suffix}`
  const snapshotWithoutHash = {
    schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
    snapshotId: `snapshot-${suffix}`,
    workspaceId: 'workspace-professional-long-form',
    projectId: 'project-professional-long-form',
    editSessionId: 'edit-professional-long-form',
    planId: `plan-${suffix}`,
    planVersion: 1,
    estimateId: `estimate-${suffix}`,
    approvalId: `approval-${suffix}`,
    reservationId: `reservation-${suffix}`,
    approvedByUserId: 'user-professional-long-form',
    approvedAt: '2026-07-18T04:00:00.000Z',
    componentRefs: {
      [PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY]: {
        sha256: seedHash,
        byteLength: 128 * 1024,
      },
      masterTimingPlan: {
        sha256: timingHash,
        byteLength: 4_096,
      },
    },
    approvedWorkItemIds: [approvedControllerWorkItemId],
    planHash,
    estimateHash,
    workGraphHash: parentWorkGraphHash,
    sourceSequenceHash: sha256AuthorityValue('approved-source-sequence'),
    timingHash,
    approvedAssetManifestRef: {
      sha256: sha256AuthorityValue(`approved-asset-manifest-ref-${suffix}`),
      byteLength: 4_096,
    },
    approvedAssetManifestHash: sha256AuthorityValue(
      `approved-asset-manifest-${suffix}`,
    ),
    approvedSourceAssetManifestRef: {
      sha256: sha256AuthorityValue(`approved-source-manifest-ref-${suffix}`),
      byteLength: 4_096,
    },
    approvedSourceAssetManifestHash: sha256AuthorityValue(
      `approved-source-manifest-${suffix}`,
    ),
  }
  const snapshot = {
    ...snapshotWithoutHash,
    snapshotHash: sha256AuthorityValue(snapshotWithoutHash),
  }
  const longFormRequest = makeLongFormRequest({
    suffix,
    snapshotHash: snapshot.snapshotHash,
    planHash,
    estimateHash,
    parentWorkGraphHash,
    timingHash,
  })
  const plan = buildProfessionalLongFormObjectExecutionPlan(longFormRequest)
  const controllerExecutionInput = {
    schemaVersion: PROFESSIONAL_LONG_FORM_CONTROLLER_INPUT_VERSION,
    capacityProfileId: PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
    planSeedComponentKey: PROFESSIONAL_LONG_FORM_SEED_COMPONENT_KEY,
    planSeedHash: seedHash,
    planSeedComponentRefSha256: seedHash,
    maximumExpandedWorkItems:
      PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING as 256,
    maximumExpandedDependencies:
      PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING as 128,
    expansionMode: 'deterministic_post_approval_child_graph_v1' as const,
    approvedSnapshotRequired: true as const,
    fundedReservationRequired: true as const,
    childExecutionAuthorized: false as const,
  }
  return {
    seedHash,
    request: {
      schemaVersion: PROFESSIONAL_LONG_FORM_APPROVED_SNAPSHOT_BRIDGE_VERSION,
      snapshot,
      controllerBinding: {
        source: 'server_loaded_approved_work_item_view',
        approvedWorkItemId: approvedControllerWorkItemId,
        sourceWorkItemId: `source-controller-${suffix}`,
        snapshotId: snapshot.snapshotId,
        workItemKey: 'professional-long-form-object-controller',
        workItemType: 'custom',
        workerClass: PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS,
        required: true,
        maximumAttempts: 1,
        executionInputRef: {
          sha256: sha256AuthorityValue(controllerExecutionInput),
          byteLength: JSON.stringify(controllerExecutionInput).length,
        },
        executionInput: controllerExecutionInput,
      },
      plan,
    },
  }
}

function makeLongFormRequest(input: {
  suffix: string
  snapshotHash: string
  planHash: string
  estimateHash: string
  parentWorkGraphHash: string
  timingHash: string
}): ProfessionalLongFormObjectExecutionRequest {
  const totalFrames = PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * 60
  return {
    schemaVersion: 'professional-long-form-object-execution-request-v1',
    identity: {
      workspaceId: 'workspace-professional-long-form',
      projectId: 'project-professional-long-form',
      editSessionId: 'edit-professional-long-form',
      planningRequestId: 'planning-request-professional-long-form',
      approvedPlanId: `plan-${input.suffix}`,
      approvedPlanHash: input.planHash,
      approvedPlanSnapshotId: `snapshot-${input.suffix}`,
      approvedPlanSnapshotHash: input.snapshotHash,
      approvedEstimateId: `estimate-${input.suffix}`,
      approvedEstimateHash: input.estimateHash,
      approvalRecordId: `approval-${input.suffix}`,
      creditReservationId: `reservation-${input.suffix}`,
      approvedWorkGraphHash: input.parentWorkGraphHash,
      approvedTimingHash: input.timingHash,
    },
    runtimeRegion: 'us-east1',
    confirmedOutputFrame: {
      frameTemplateId: 'landscape-16-9-uhd',
      width: 3_840,
      height: 2_160,
      confirmed: true,
      deliveryCeilingProfileId: 'uhd_2160_4k_ceiling_v1',
      frameRate: {
        profileId: 'fps_60',
        numerator: 60,
        denominator: 1,
      },
    },
    totalFrames,
    sourceRanges: makeSourceRanges(totalFrames),
    executionPolicy: {
      videoChunkPolicy: 'object_backed_frame_exact_mezzanine_v1',
      audioPolicy: 'single_continuous_timeline_mix_v1',
      colorPolicy: 'source_bound_transform_plus_boundary_continuity_v1',
      transitionPolicy: 'approved_hard_cuts_only_v1',
      objectResidencyPolicy: 'single_region_no_cross_region_copy_v1',
      finalizationPolicy: 'compatible_object_mezzanine_concat_or_block_v1',
      requiredAssetPlaceholderPolicy: 'forbidden_in_final_v1',
    },
    approvalAndCostBoundary: {
      originalApprovedFourKEstimateReused: true,
      originalApprovedReservationReused: true,
      secondExportEstimateAllowed: false,
      secondExportChargeAllowed: false,
      attemptLevelInternalProductionCostEvidenceRequired: true,
      customerCommercialAuthorityIncluded: false,
    },
  }
}

function makeSourceRanges(
  totalFrames: number,
): ProfessionalLongFormObjectExecutionRequest['sourceRanges'] {
  const sourceCount = PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES
  const baseDuration = Math.floor(totalFrames / sourceCount)
  const remainder = totalFrames % sourceCount
  let timelineStartFrame = 0
  return Array.from({ length: sourceCount }, (_unused, offset) => {
    const durationFrames = baseDuration + (offset < remainder ? 1 : 0)
    const timelineEndFrameExclusive = timelineStartFrame + durationFrames
    const item = {
      segmentId: `segment-${offset + 1}`,
      sourceSequenceItemId: `source-sequence-${offset + 1}`,
      mediaAssetId: `media-asset-${offset + 1}`,
      sourceObjectGeneration: String(100_000 + offset),
      sourceObjectRegion: 'us-east1' as const,
      sourceByteLength: 10_000_000 + offset,
      sourceSha256: sha256AuthorityValue({ source: offset + 1 }),
      sourceCleanupDecisionId: `cleanup-decision-${offset + 1}`,
      sourceStartFrame: 0,
      sourceEndFrameExclusive: durationFrames,
      timelineStartFrame,
      timelineEndFrameExclusive,
      editorialBoundaryBefore: offset === 0
        ? 'timeline_start' as const
        : 'approved_hard_cut' as const,
    }
    timelineStartFrame = timelineEndFrameExclusive
    return item
  })
}

function rehashSnapshot(
  request: ProfessionalLongFormApprovedSnapshotBridgeRequest,
): void {
  const snapshotWithoutHash = Object.fromEntries(
    Object.entries(request.snapshot).filter(([key]) => key !== 'snapshotHash'),
  )
  request.snapshot.snapshotHash = sha256AuthorityValue(snapshotWithoutHash)
}
