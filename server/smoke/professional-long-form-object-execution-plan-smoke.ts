import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING,
  PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING,
  PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID,
  assertProfessionalLongFormObjectExecutionProductionAuthority,
  buildProfessionalLongFormObjectExecutionPlan,
  deriveProfessionalLongFormObjectPlanSeed,
  type ProfessionalLongFormFrameRateProfileId,
  type ProfessionalLongFormObjectExecutionRequest,
  verifyProfessionalLongFormObjectExecutionPlan,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const checks: string[] = []
const check = (condition: unknown, name: string): void => {
  assert.ok(condition, name)
  checks.push(name)
}

const thirtyMinuteRequest = makeRequest({
  totalFrames: 30 * 60 * 30,
  sourceCount: 24,
  frameRateProfileId: 'fps_30',
})
const thirtyMinutePlan = buildProfessionalLongFormObjectExecutionPlan(
  thirtyMinuteRequest,
)
check(
  thirtyMinutePlan.capacity.profileId ===
    PROFESSIONAL_LONG_FORM_OBJECT_CAPACITY_PROFILE_ID &&
  thirtyMinutePlan.capacity.durationSeconds === 1_800 &&
  thirtyMinutePlan.capacity.sourceRangeCount === 24 &&
  thirtyMinutePlan.capacity.chunkCount === 15,
  'thirty_minute_4k_twenty_four_source_plan_is_frame_exact',
)
check(
  thirtyMinutePlan.chunks[0]?.globalStartFrame === 0 &&
  thirtyMinutePlan.chunks.at(-1)?.globalEndFrameExclusive === 54_000 &&
  thirtyMinutePlan.chunks.reduce((total, chunk) => total + chunk.durationFrames, 0) ===
    54_000,
  'balanced_object_chunks_conserve_every_approved_timeline_frame',
)

const allSlices = thirtyMinutePlan.chunks.flatMap((chunk) => chunk.sourceSlices)
check(
  allSlices.filter((slice) => slice.boundaryBefore === 'timeline_start').length === 1 &&
  allSlices.filter((slice) => slice.boundaryBefore === 'approved_hard_cut').length === 23 &&
  allSlices.some((slice) => slice.boundaryBefore === 'continuous_technical_split'),
  'editorial_hard_cuts_and_non_editorial_technical_splits_remain_distinct',
)
check(
  thirtyMinutePlan.chunks.every((chunk) =>
    chunk.sourceSlices[0]?.chunkLocalStartFrame === 0 &&
    chunk.sourceSlices.at(-1)?.chunkLocalEndFrameExclusive === chunk.durationFrames &&
    chunk.sourceSlices.every((slice, index) => index === 0 ||
      slice.chunkLocalStartFrame === chunk.sourceSlices[index - 1]?.chunkLocalEndFrameExclusive)),
  'every_chunk_has_gap_free_local_source_slice_lineage',
)
check(
  thirtyMinutePlan.chunks.every((chunk) =>
    chunk.expectedObject.runtimeRegion === thirtyMinuteRequest.runtimeRegion &&
    chunk.expectedObject.canonicalSignedUrlStored === false &&
    chunk.expectedObject.createOnlyRequired === true),
  'chunk_objects_are_region_bound_create_only_and_store_no_signed_url',
)

const workItemIds = new Set(
  thirtyMinutePlan.workGraph.workItems.map((item) => item.workItemId),
)
const finalizer = thirtyMinutePlan.workGraph.workItems.find(
  (item) => item.kind === 'finalize_private_4k_master',
)
const chunkQaIds = thirtyMinutePlan.workGraph.workItems
  .filter((item) => item.kind === 'qa_object_mezzanine_chunk')
  .map((item) => item.workItemId)
check(
  workItemIds.size === thirtyMinutePlan.workGraph.workItems.length &&
  finalizer !== undefined &&
  chunkQaIds.every((workItemId) => finalizer.dependsOn.includes(workItemId)) &&
  thirtyMinutePlan.workGraph.finalizationDependsOnEveryChunkQa,
  'immutable_work_graph_requires_every_chunk_qa_before_finalization',
)
check(
  thirtyMinutePlan.workGraph.workItems.every((item) =>
    item.required && item.executionAuthorized === false),
  'planning_contract_creates_no_worker_execution_authority',
)

const sixHourPlan = buildProfessionalLongFormObjectExecutionPlan(makeRequest({
  totalFrames: PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * 60,
  sourceCount: PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  frameRateProfileId: 'fps_60',
}))
check(
  sixHourPlan.capacity.durationSeconds === PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS &&
  sixHourPlan.capacity.sourceRangeCount === PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES &&
  sixHourPlan.capacity.chunkCount === PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS &&
  sixHourPlan.workGraph.workItemCount === 255 &&
  sixHourPlan.workGraph.workItemCount < PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING &&
  sixHourPlan.workGraph.workItems.every((item) =>
    item.dependsOn.length <= PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING),
  'six_hour_sixty_fps_five_hundred_twelve_range_capacity_is_bounded',
)
check(
  sixHourPlan.capacity.canonicalWorkItemCeiling ===
    PROFESSIONAL_LONG_FORM_CANONICAL_WORK_ITEM_CEILING &&
  sixHourPlan.capacity.canonicalDependencyCeiling ===
    PROFESSIONAL_LONG_FORM_CANONICAL_DEPENDENCY_CEILING &&
  sixHourPlan.capacity.maximumChunks === PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS &&
  sixHourPlan.workGraph.workItems.filter((item) =>
    item.kind === 'qa_object_mezzanine_chunk').length ===
    PROFESSIONAL_LONG_FORM_MAXIMUM_CHUNKS,
  'canonical_capacity_ceiling_preserves_one_independent_qa_item_per_chunk',
)

const fractionalRatePlan = buildProfessionalLongFormObjectExecutionPlan(makeRequest({
  totalFrames: 43_157,
  sourceCount: 31,
  frameRateProfileId: 'fps_23_976',
}))
check(
  fractionalRatePlan.request.confirmedOutputFrame.frameRate.numerator === 24_000 &&
  fractionalRatePlan.request.confirmedOutputFrame.frameRate.denominator === 1_001 &&
  Math.abs(fractionalRatePlan.capacity.durationSeconds - 1_800) < 0.1,
  'professional_fractional_frame_rate_keeps_exact_rational_time_base',
)

const allProfessionalRateWindowsStayExact = ([
  'fps_23_976',
  'fps_24',
  'fps_25',
  'fps_29_97',
  'fps_30',
  'fps_50',
  'fps_59_94',
  'fps_60',
] as const).every((profileId) => {
  const rate = frameRate(profileId)
  const totalFrames = Math.floor(
    PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * rate.numerator / rate.denominator,
  )
  const plan = buildProfessionalLongFormObjectExecutionPlan(makeRequest({
    totalFrames,
    sourceCount: 31,
    frameRateProfileId: profileId,
  }))
  return plan.chunks.every((chunk) => {
    const exactDurationSeconds = chunk.durationFrames * rate.denominator /
      rate.numerator
    return exactDurationSeconds >= 45 && exactDurationSeconds <= 180
  })
})
check(
  allProfessionalRateWindowsStayExact,
  'all_supported_rational_rates_keep_every_chunk_inside_exact_duration_bounds',
)
check(
  thirtyMinutePlan.planSeedHash === sha256AuthorityValue(
    deriveProfessionalLongFormObjectPlanSeed(thirtyMinutePlan.request),
  ) &&
  thirtyMinutePlan.workGraph.workItems.find((item) =>
    item.kind === 'validate_master_timing')?.expectedOutputIdentity ===
    thirtyMinutePlan.request.identity.approvedTimingHash,
  'snapshot_independent_seed_and_exact_approved_timing_hash_are_bound',
)

const verified = verifyProfessionalLongFormObjectExecutionPlan(thirtyMinutePlan)
check(
  verified.authorityHash === thirtyMinutePlan.authorityHash &&
  verified.workGraph.workGraphHash === thirtyMinutePlan.workGraph.workGraphHash,
  'exact_plan_rebuild_verifies_authority_and_work_graph_hashes',
)

const tampered = structuredClone(thirtyMinutePlan)
tampered.chunks[0]!.globalEndFrameExclusive += 1
assert.throws(
  () => verifyProfessionalLongFormObjectExecutionPlan(tampered),
  /failed exact authority verification/i,
)
checks.push('changed_chunk_lineage_fails_exact_authority_verification')

assert.throws(
  () => assertProfessionalLongFormObjectExecutionProductionAuthority(thirtyMinutePlan),
  /does not authorize snapshot wiring, object storage, workers, cloud execution, staging, or production/i,
)
checks.push('validated_plan_cannot_self_promote_to_production_authority')

const overDuration = structuredClone(thirtyMinuteRequest)
overDuration.totalFrames = PROFESSIONAL_LONG_FORM_MAXIMUM_SECONDS * 60 + 1
overDuration.sourceRanges = makeSourceRanges(
  overDuration.totalFrames,
  24,
  overDuration.runtimeRegion,
)
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(overDuration))
checks.push('duration_above_six_hours_is_rejected')

const tooManySources = structuredClone(thirtyMinuteRequest)
tooManySources.sourceRanges = makeSourceRanges(
  tooManySources.totalFrames,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES + 1,
  tooManySources.runtimeRegion,
)
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(tooManySources))
checks.push('more_than_five_hundred_twelve_approved_ranges_is_rejected')

const wrongRate = structuredClone(thirtyMinuteRequest)
wrongRate.confirmedOutputFrame.frameRate.numerator = 29
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(wrongRate))
checks.push('frame_rate_profile_mismatch_is_rejected')

const oversizedFrame = structuredClone(thirtyMinuteRequest)
oversizedFrame.confirmedOutputFrame.height = 3_840
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(oversizedFrame))
checks.push('output_above_universal_4k_pixel_ceiling_is_rejected')

const timelineGap = structuredClone(thirtyMinuteRequest)
timelineGap.sourceRanges[1]!.timelineStartFrame += 1
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(timelineGap))
checks.push('timeline_gap_is_rejected_before_chunk_planning')

const crossRegion = structuredClone(thirtyMinuteRequest)
crossRegion.sourceRanges[0]!.sourceObjectRegion = 'europe-west1'
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(crossRegion))
checks.push('cross_region_source_object_is_rejected')

const secondCharge = structuredClone(thirtyMinuteRequest) as unknown as Record<string, unknown>
const commercial = secondCharge.approvalAndCostBoundary as Record<string, unknown>
commercial.secondExportChargeAllowed = true
assert.throws(() => buildProfessionalLongFormObjectExecutionPlan(secondCharge))
checks.push('second_export_estimate_or_charge_authority_is_rejected')

const serialized = JSON.stringify(thirtyMinutePlan)
check(
  !serialized.includes('https://') &&
  !serialized.includes('serviceFeeMicros') &&
  !serialized.includes('customerCreditAmount') &&
  !serialized.includes('walletMutation'),
  'plan_contains_no_url_secret_or_customer_commercial_record',
)
const plannerSource = readFileSync(
  'server/edit-architecture/professional-long-form-object-execution-plan.ts',
  'utf8',
)
check(
  !/from\s+['"](?:@google-cloud|@supabase|stripe|node:child_process|node:http|node:https)/u
    .test(plannerSource) &&
  !/\bfetch\s*\(/u.test(plannerSource) &&
  !/process\.env/u.test(plannerSource),
  'planner_source_has_no_cloud_database_provider_network_or_environment_activation_path',
)
check(
  thirtyMinutePlan.finalization.audioPolicy === 'single_continuous_timeline_mix_v1' &&
  thirtyMinutePlan.finalization.colorPolicy ===
    'source_bound_transform_plus_boundary_continuity_v1' &&
  thirtyMinutePlan.finalization.fullProgramVideoReencodeRequired === false &&
  thirtyMinutePlan.finalization.secondEstimateOrChargeCreated === false,
  'professional_finalization_requires_continuous_audio_color_qa_and_one_approved_4k_estimate',
)
check(
  Object.values(thirtyMinutePlan.readiness).filter(Boolean).length === 1 &&
  thirtyMinutePlan.readiness.frameExactPlanningContractReady &&
  !thirtyMinutePlan.readiness.approvedSnapshotWiringVerified &&
  !thirtyMinutePlan.readiness.objectStorePersistenceVerified &&
  !thirtyMinutePlan.readiness.liveGoogleCloudVerified &&
  !thirtyMinutePlan.readiness.productionReady,
  'execution_database_cloud_staging_and_production_readiness_remain_false',
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'professional-long-form-object-execution-plan-smoke-v1',
  status: 'frame_exact_professional_scale_plan_verified_execution_still_blocked',
  checkCount: checks.length,
  checks,
  thirtyMinuteEvidence: {
    sourceRangeCount: thirtyMinutePlan.capacity.sourceRangeCount,
    chunkCount: thirtyMinutePlan.capacity.chunkCount,
    workItemCount: thirtyMinutePlan.workGraph.workItemCount,
    totalFrames: thirtyMinutePlan.request.totalFrames,
    durationSeconds: thirtyMinutePlan.capacity.durationSeconds,
    authorityHash: thirtyMinutePlan.authorityHash,
  },
  maximumCapacityEvidence: {
    maximumSeconds: sixHourPlan.capacity.durationSeconds,
    sourceRangeCount: sixHourPlan.capacity.sourceRangeCount,
    chunkCount: sixHourPlan.capacity.chunkCount,
    totalFrames: sixHourPlan.request.totalFrames,
  },
  boundaries: {
    planningContractOnly: true,
    approvedSnapshotWiringVerified: false,
    mediaExecutionPerformed: false,
    objectStorageCallPerformed: false,
    databaseCallPerformed: false,
    cloudCallPerformed: false,
    customerCommercialAuthorityIncluded: false,
    productionAuthority: false,
  },
}, null, 2))

function makeRequest(input: {
  totalFrames: number
  sourceCount: number
  frameRateProfileId: ProfessionalLongFormFrameRateProfileId
}): ProfessionalLongFormObjectExecutionRequest {
  const rate = frameRate(input.frameRateProfileId)
  return {
    schemaVersion: 'professional-long-form-object-execution-request-v1',
    identity: {
      workspaceId: 'workspace-professional-long-form',
      projectId: 'project-professional-long-form',
      editSessionId: 'edit-professional-long-form',
      planningRequestId: 'planning-request-professional-long-form-v1',
      approvedPlanId: 'plan-professional-long-form-v1',
      approvedPlanHash: sha256AuthorityValue('plan-professional-long-form-v1'),
      approvedPlanSnapshotId: 'snapshot-professional-long-form-v1',
      approvedPlanSnapshotHash: sha256AuthorityValue('snapshot-professional-long-form-v1'),
      approvedEstimateId: 'estimate-professional-long-form-4k-v1',
      approvedEstimateHash: sha256AuthorityValue('estimate-professional-long-form-4k-v1'),
      approvalRecordId: 'approval-professional-long-form-v1',
      creditReservationId: 'reservation-professional-long-form-v1',
      approvedWorkGraphHash: sha256AuthorityValue('work-graph-professional-long-form-v1'),
      approvedTimingHash: sha256AuthorityValue('timing-professional-long-form-v1'),
    },
    runtimeRegion: 'us-east1',
    confirmedOutputFrame: {
      frameTemplateId: 'landscape-16-9-uhd',
      width: 3_840,
      height: 2_160,
      confirmed: true,
      deliveryCeilingProfileId: 'uhd_2160_4k_ceiling_v1',
      frameRate: {
        profileId: input.frameRateProfileId,
        numerator: rate.numerator,
        denominator: rate.denominator,
      },
    },
    totalFrames: input.totalFrames,
    sourceRanges: makeSourceRanges(input.totalFrames, input.sourceCount, 'us-east1'),
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
  sourceCount: number,
  region: 'us-east1' | 'europe-west1',
): ProfessionalLongFormObjectExecutionRequest['sourceRanges'] {
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
      sourceObjectGeneration: String(10_000 + offset),
      sourceObjectRegion: region,
      sourceByteLength: 1_000_000 + offset,
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

function frameRate(profileId: ProfessionalLongFormFrameRateProfileId): {
  numerator: number
  denominator: number
} {
  switch (profileId) {
    case 'fps_23_976': return { numerator: 24_000, denominator: 1_001 }
    case 'fps_24': return { numerator: 24, denominator: 1 }
    case 'fps_25': return { numerator: 25, denominator: 1 }
    case 'fps_29_97': return { numerator: 30_000, denominator: 1_001 }
    case 'fps_30': return { numerator: 30, denominator: 1 }
    case 'fps_50': return { numerator: 50, denominator: 1 }
    case 'fps_59_94': return { numerator: 60_000, denominator: 1_001 }
    case 'fps_60': return { numerator: 60, denominator: 1 }
  }
}
