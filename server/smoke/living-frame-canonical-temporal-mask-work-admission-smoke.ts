import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFramePendingWorkItem,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'

const FFMPEG_OPERATION =
  'tool.ffmpeg.execute_approved_media_recipe.v1'
const SAM2_OPERATION =
  'tool.sam2.segment_and_track_subject.v1'
const REMBG_OPERATION =
  'tool.rembg.remove_image_background.v1'
const sceneId = 'scene.temporal-mask-admission'
const canonicalSegmentId =
  'segment.temporal-mask-admission'
const sourceIntentId = 'asset-intent.temporal-source'
const preparedSourceIntentId =
  'asset-intent.prepared-temporal-source'
const temporalMaskIntentId =
  'asset-intent.temporal-subject-mask'
const sourceWorkInputKey =
  'lf-work-input.temporal-source-video'
const maskWorkInputKey =
  'lf-work-input.temporal-subject-mask'
const selectedSceneBindingDigest = hash(
  'selected-scene-binding',
)
const requirementsDigest = hash(
  'execution-requirements',
)
const timingBindingDigest = hash('timing-binding')
const assetWorkInputBindingDigest = hash(
  'asset-work-input-binding',
)
const masterTimingPlan = {
  id: 'master-timing.temporal-mask-admission',
  status: 'ready',
  timingBase: {
    fps: 30,
    totalFrames: 150,
  },
  totalFrames: 150,
}
const soundSyncPlan = {
  id: 'soundsync.temporal-mask-admission',
  status: 'ready_mock',
  speechPriority: true,
}
const masterTimingDigest =
  sha256AuthorityValue(masterTimingPlan)
const soundSyncDigest =
  sha256AuthorityValue(soundSyncPlan)

const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace.temporal-mask-admission',
      projectId: 'project.temporal-mask-admission',
      editSessionId:
        'edit-session.temporal-mask-admission',
    },
    bindingDigestSha256:
      selectedSceneBindingDigest,
    selectedSceneCount: 1,
    deliberateNonUse: false,
  },
} as unknown as
  CanonicalLivingFrameSelectedScenePublication

const requirements = {
  requirementsDigestSha256: requirementsDigest,
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    currentMasterTimingDigestSha256:
      masterTimingDigest,
    currentSoundSyncDigestSha256:
      soundSyncDigest,
  },
  scenes: [{
    sceneId,
    canonicalSegmentId,
    startFrame: 30,
    endFrameExclusive: 135,
    componentIds: ['component.speaker'],
    semanticTimingRequestIds: [],
    soundRequestIds: [],
    capabilityKeys: ['temporal_subject_masking'],
    miniSkillKeys: ['depth_aware_a_roll'],
    requiredNamedWorkItemTypes: [
      'process_video_asset',
      'generate_mask_asset',
    ],
    missingOperationCodes: [],
    requiredExternalGateCodes: [],
    qaExpectationCodes: [
      'mask_edge_quality',
      'mask_temporal_stability',
      'mask_subject_coverage',
    ],
  }],
} as unknown as
  CanonicalLivingFrameExecutionRequirements

const timingBinding = {
  timingBindingDigestSha256: timingBindingDigest,
  fps: 30,
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    executionRequirementsDigestSha256:
      requirementsDigest,
    currentMasterTimingDigestSha256:
      masterTimingDigest,
  },
  scenes: [{
    sceneId,
    semanticPhaseBindings: [],
    soundCueBindings: [],
  }],
} as unknown as CanonicalLivingFrameTimingBinding

const sourceFrameInput = {
  assetIntentId: sourceIntentId,
  sourceSequenceItemId: 'source.temporal-mask-admission',
  mediaAssetId: 'media.temporal-mask-admission',
  sourceCleanupDecisionId:
    'cleanup.temporal-mask-admission',
  masterFrameIndex: 30,
  sourceFrameIndex: 30,
  frameRate: 30,
  frameSelectionPolicy:
    'scene_start_meaning_anchor_v1' as const,
  sourceFrameSelectionDigestSha256:
    hash('source-frame-selection'),
  contentSha256: hash('source-content'),
  contentType: 'video/mp4',
  byteLength: 16_384,
  sourceBindingHash: hash('source-binding'),
  storageIdentityHash: hash('storage-identity'),
}

const assetWorkInputBinding = {
  bindingDigestSha256:
    assetWorkInputBindingDigest,
  readiness:
    'source_inputs_bound_operation_admission_pending',
  unresolvedPrimaryAssetIntentIds: [],
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    executionRequirementsDigestSha256:
      requirementsDigest,
    timingBindingDigestSha256:
      timingBindingDigest,
  },
  scenes: [{
    sceneId,
    refinedRequiredNamedWorkItemTypes: [
      'process_video_asset',
      'generate_mask_asset',
    ],
    assetIntents: [{
      assetIntentId: sourceIntentId,
      assetKind: 'approved_source_asset_reference',
    }, {
      assetIntentId: preparedSourceIntentId,
      assetKind: 'prepared_temporal_source_video',
    }, {
      assetIntentId: temporalMaskIntentId,
      assetKind: 'temporal_subject_mask_sequence',
    }],
    namedWorkInputs: [{
      workInputKey: sourceWorkInputKey,
      workItemType: 'process_video_asset',
      operationClass: 'prepare_temporal_source_video',
      outputAssetKinds: [
        'prepared_temporal_source_video',
      ],
      inputAssetIntentIds: [sourceIntentId],
      outputAssetIntentIds: [preparedSourceIntentId],
      dependencyNamedWorkInputKeys: [],
      dependencyNamedWorkItemTypes: [],
      sourceSequenceItemIds: [
        sourceFrameInput.sourceSequenceItemId,
      ],
      sourceCleanupDecisionIds: [
        sourceFrameInput.sourceCleanupDecisionId,
      ],
      sourceFrameInputs: [sourceFrameInput],
    }, {
      workInputKey: maskWorkInputKey,
      workItemType: 'generate_mask_asset',
      operationClass:
        'temporal_video_subject_segmentation_and_tracking',
      outputAssetKinds: [
        'temporal_subject_mask_sequence',
      ],
      inputAssetIntentIds: [preparedSourceIntentId],
      outputAssetIntentIds: [temporalMaskIntentId],
      dependencyNamedWorkInputKeys: [
        sourceWorkInputKey,
      ],
      dependencyNamedWorkItemTypes: [
        'process_video_asset',
      ],
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      sourceFrameInputs: [],
    }],
  }],
} as unknown as
  CanonicalLivingFrameAssetWorkInputBinding

const components = {
  confirmedSettings: {
    editLevel: 'pro',
    outputFrame: {
      width: 1920,
      height: 1080,
      fps: 30,
    },
  },
  timingSummary: {
    totalFrames: 150,
    fps: 30,
  },
  masterTimingPlan,
  soundSyncTransitionTimingPlan: soundSyncPlan,
} as unknown as CanonicalPlanComponentsInput

const estimateProjection =
  compileCanonicalLivingFrameEstimateWorkAssetProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    components,
  })

assert.equal(
  estimateProjection.readiness,
  'requirements_projected_unreleased_cost_and_execution_admission_pending',
)
const workRequirements =
  estimateProjection.scenes[0]?.workRequirements
if (!workRequirements) {
  throw new Error(
    'Expected one temporal-mask work projection scene.',
  )
}
assert.equal(workRequirements.length, 2)
const temporalSourceRequirement =
  workRequirements.find((work) =>
    work.operationClass ===
      'prepare_temporal_source_video')
const sam2Requirement =
  workRequirements.find((work) =>
    work.operationClass ===
      'temporal_video_subject_segmentation_and_tracking')
assert.ok(temporalSourceRequirement)
assert.ok(sam2Requirement)
assert.equal(
  temporalSourceRequirement.costOwnerToolId,
  'ffmpeg',
)
assert.equal(
  temporalSourceRequirement.costOwnerOperationId,
  FFMPEG_OPERATION,
)
assert.deepEqual(
  temporalSourceRequirement.outputAssetKinds,
  ['prepared_temporal_source_video'],
)
assert.equal(
  temporalSourceRequirement.expectedOutputs[0]?.artifactType,
  'living_frame_temporal_source_video_mp4',
)
assert.equal(
  sam2Requirement.costOwnerToolId,
  'sam2',
)
assert.equal(
  sam2Requirement.costOwnerOperationId,
  SAM2_OPERATION,
)
assert.deepEqual(
  sam2Requirement.dependencyWorkInputKeys,
  [sourceWorkInputKey],
)
assert.deepEqual(
  sam2Requirement.dependencyWorkItemKeys,
  [temporalSourceRequirement.workItemKey],
)
assert.deepEqual(
  sam2Requirement.expectedOutputs.map((output) => [
    output.artifactType,
    output.contentType,
  ]),
  [
    [
      'living_frame_temporal_subject_mask_sequence_ffv1_mkv',
      'video/x-matroska',
    ],
    [
      'living_frame_temporal_subject_tracking_analysis_json',
      'application/json',
    ],
    [
      'living_frame_temporal_subject_mask_qa_json',
      'application/json',
    ],
  ],
)
const sam2EstimateLine =
  estimateProjection.scenes[0]?.estimateLineItems
    .find((line) => line.costOwnerToolId === 'sam2')
assert.ok(sam2EstimateLine)
assert.equal(
  sam2EstimateLine.costOwnerClass,
  'canonical_unreleased_tool_candidate',
)
assert.equal(sam2EstimateLine.estimatedCredits, 0)
assert.equal(
  sam2EstimateLine.operationContractObserved,
  false,
)
assert.equal(
  sam2EstimateLine.actualAttemptCostEvidenceRequired,
  true,
)

const customerEstimate =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: {
      lineItems: [],
      fallbackAllowanceCredits: 2,
      validForSeconds: 900,
    },
    components,
    livingFrameProjection: estimateProjection,
  })
const workGraph =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection:
      estimateProjection,
    customerEstimateAuthority:
      customerEstimate.authority,
    components,
  })

assert.equal(
  workGraph.readiness,
  'canonical_work_items_projected_temporal_mask_admission_pending',
)
assert.deepEqual(workGraph.blockerCodes, [
  'artifact_qa_work_items_required',
  'private_review_required',
  'temporal_source_recipe_and_private_metadata_required',
  'sam2_checkpoint_runtime_and_cost_admission_required',
  'sam2_inference_and_temporal_qa_required',
])
assert.equal(workGraph.workItems.length, 2)
const temporalSourceWork = workGraph.workItems.find(
  (work): work is CanonicalLivingFramePendingWorkItem =>
    work.workerClass ===
      'living_frame_operation_admission_pending_worker'
    && work.executionInput.pendingOperationAuthority
      .operationClass ===
        'prepare_temporal_source_video',
)
const sam2Work = workGraph.workItems.find(
  (work): work is CanonicalLivingFramePendingWorkItem =>
    work.workerClass ===
      'living_frame_operation_admission_pending_worker'
    && work.executionInput.pendingOperationAuthority
      .operationClass ===
        'temporal_video_subject_segmentation_and_tracking',
)
assert.ok(temporalSourceWork)
assert.ok(sam2Work)
assert.deepEqual(
  sam2Work.dependencyKeys,
  [temporalSourceWork.workItemKey],
)
assert.deepEqual(
  temporalSourceWork.approvedToolIds,
  [],
)
assert.deepEqual(sam2Work.approvedToolIds, [])
assert.deepEqual(
  temporalSourceWork.executionInput
    .approvedToolOperationIds,
  [],
)
assert.deepEqual(
  sam2Work.executionInput.approvedToolOperationIds,
  [],
)
assert.equal(
  temporalSourceWork.executionInput
    .pendingOperationAuthority
    .requestedToolOperationId,
  FFMPEG_OPERATION,
)
const temporalSourceAdmission =
  temporalSourceWork.executionInput
    .pendingOperationAuthority
    .temporalSourcePreparationRequirement
assert.ok(temporalSourceAdmission)
assert.deepEqual(
  temporalSourceAdmission.selectedMasterFrameRange,
  {
    startFrame: 30,
    endFrameExclusive: 135,
    durationFrames: 105,
  },
)
assert.deepEqual(
  temporalSourceAdmission.selectedSourceTimeRange,
  {
    startSourceFrameIndex: 30,
    sourceFpsNumerator: 30,
    sourceFpsDenominator: 1,
    durationMasterFrames: 105,
    masterFpsNumerator: 30,
    masterFpsDenominator: 1,
  },
)
assert.equal(
  temporalSourceAdmission.sourceMedia.mediaAssetId,
  sourceFrameInput.mediaAssetId,
)
assert.equal(
  temporalSourceAdmission.maximumOutputBytes,
  4_294_901_760,
)
assert.equal(
  temporalSourceAdmission.recipeOperationRegistered,
  false,
)
assert.equal(
  sam2Work.executionInput.pendingOperationAuthority
    .requestedToolOperationId,
  SAM2_OPERATION,
)
const sam2Admission =
  sam2Work.executionInput.pendingOperationAuthority
    .sam2TemporalMaskRequirement
assert.ok(sam2Admission)
assert.equal(
  sam2Admission.checkpointSlotId,
  'sam2_checkpoint',
)
assert.equal(
  sam2Admission.checkpointArtifactId,
  'meta-sam2.1-hiera-small-checkpoint',
)
assert.equal(
  sam2Admission.checkpointByteLength,
  184_416_285,
)
assert.deepEqual(sam2Admission.requiredQaGates, [
  'mask_edge_quality',
  'mask_temporal_stability',
  'mask_subject_coverage',
])
assert.equal(sam2Admission.checkpointIngested, false)
assert.equal(sam2Admission.l4RuntimeQualified, false)
assert.equal(sam2Admission.operationRegistered, false)
assert.equal(sam2Admission.dispatchAuthorized, false)
assert.equal(sam2Admission.modelInferenceAuthorized, false)
assert.equal(
  sam2Admission.runtimeCostAdmissionComplete,
  false,
)
assert.equal(
  JSON.stringify(workGraph).includes(REMBG_OPERATION),
  false,
)
assert.equal(
  workGraph.metrics
    .pendingTemporalSourceVideoWorkItemCount,
  1,
)
assert.equal(
  workGraph.metrics
    .pendingSam2TemporalMaskWorkItemCount,
  1,
)
assert.equal(
  workGraph.currentResourcePlacementExecutionReady,
  false,
)
assert.equal(
  workGraph.authorityBoundary.runtimeAuthority,
  false,
)
assert.equal(
  workGraph.authorityBoundary.productionAuthority,
  false,
)
assert.equal(workGraph.productionReady, false)

console.log(JSON.stringify({
  suite:
    'living-frame-canonical-temporal-mask-work-admission',
  selectedMode: 'living_a_roll',
  projectedWorkItems: 2,
  temporalSourceDependencyPreserved: true,
  sam2OperationPreserved: true,
  rembgStillMaskSubstitutionAllowed: false,
  canonicalDispatchAuthority: false,
  runtimeAuthority: false,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}, null, 2))

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
