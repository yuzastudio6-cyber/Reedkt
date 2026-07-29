import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
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
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  LivingFrameControlledImageSelectedSceneRequestError,
  createLivingFrameControlledImageSelectedSceneRequest,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from '../living-frame/living-frame-controlled-image-selected-scene-request'
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

const identity = {
  workspaceId: 'workspace-lf-selected-request',
  projectId: 'project-lf-selected-request',
  editSessionId: 'edit-session-lf-selected-request',
}
const sceneId = 'scene-lf-selected-request'
const masterTimingPlan = {
  id: 'master-timing-lf-selected-request',
  fps: 30,
  totalFrames: 300,
}
const soundSyncPlan = {
  id: 'soundsync-lf-selected-request',
  cueCount: 0,
}
const selectedSceneBindingDigest = 'a'.repeat(64)
const executionRequirementsDigest = 'b'.repeat(64)
const timingBindingDigest = 'c'.repeat(64)
const confirmedSettings = {
  aspectRatio: '16:9',
  outputFrame: {
    width: 1920,
    height: 1080,
    fps: 30,
  },
  outputFrameConfirmed: true,
  outputFramePurpose:
    'private_canonical_4k_master_review',
  editLevel: 'pro',
} as const
const outputFrameExpectationDigest =
  sha256AuthorityValue({
    aspectRatio: confirmedSettings.aspectRatio,
    outputFrame: confirmedSettings.outputFrame,
    outputFrameConfirmed:
      confirmedSettings.outputFrameConfirmed,
    outputFramePurpose:
      confirmedSettings.outputFramePurpose,
  })
const continuityPackDigest = 'e'.repeat(64)
const masterTimingDigest =
  sha256AuthorityValue(masterTimingPlan)
const soundSyncDigest =
  sha256AuthorityValue(soundSyncPlan)

const publication = {
  binding: {
    identity,
    bindingDigestSha256:
      selectedSceneBindingDigest,
    selectedSceneCount: 1,
    deliberateNonUse: false,
    sourceBindings: {
      confirmedOutputFrameDigestSha256:
        outputFrameExpectationDigest,
      visualContinuityPackDigestSha256:
        continuityPackDigest,
    },
    selectedComponent: {
      scenePlans: [{
        sceneId,
        mode: 'living_still',
        sourceTruthMode: 'illustrative',
        narrativePurposeCode: 'explain_process',
        visualVerb: 'reveal',
        importance: 'hero',
        summary:
          'Reveal an animation-aware illustrated subject against a controlled plate.',
        components: [
          {
            componentId: 'component-lf-primary',
            role: 'primary_subject',
            focalRole: 'primary',
            summary:
              'Animation-aware illustrated primary subject.',
            depthBand: 'subject_plane',
            transparencyExpectation:
              'still_alpha_required',
            provenanceExpectation:
              'generated_illustration_expectation',
            capabilityKeys: [
              'still_image_generation_or_edit',
              'reference_conditioned_illustration',
              'structure_conditioned_illustration',
              'identity_conditioned_illustration',
              'low_rank_adapter_training_or_loading',
            ],
            continuityRefIds: ['continuity-character-primary'],
          },
          {
            componentId: 'component-lf-plate',
            role: 'opaque_background_plate',
            focalRole: 'static_anchor',
            summary:
              'Frame-aware illustrated background plate.',
            depthBand: 'background',
            transparencyExpectation: 'opaque_plate',
            provenanceExpectation:
              'generated_illustration_expectation',
            capabilityKeys: [
              'still_image_generation_or_edit',
              'structure_conditioned_illustration',
            ],
            continuityRefIds: [],
          },
        ],
      }],
    },
  },
} as unknown as
  CanonicalLivingFrameSelectedScenePublication

const requirements = {
  requirementsDigestSha256:
    executionRequirementsDigest,
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
    canonicalSegmentId: 'segment-lf-selected-request',
    startFrame: 0,
    endFrameExclusive: 120,
    componentIds: [
      'component-lf-primary',
      'component-lf-plate',
    ],
    semanticTimingRequestIds: [],
    soundRequestIds: [],
    capabilityKeys: [
      'still_image_generation_or_edit',
      'reference_conditioned_illustration',
      'structure_conditioned_illustration',
      'identity_conditioned_illustration',
      'low_rank_adapter_training_or_loading',
    ],
    miniSkillKeys: ['narrative_illustration'],
    requiredNamedWorkItemTypes: [],
    missingOperationCodes: [],
    requiredExternalGateCodes: [],
    qaExpectationCodes: [],
  }],
} as unknown as
  CanonicalLivingFrameExecutionRequirements

const timingBinding = {
  timingBindingDigestSha256: timingBindingDigest,
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    executionRequirementsDigestSha256:
      executionRequirementsDigest,
    currentMasterTimingDigestSha256:
      masterTimingDigest,
  },
  scenes: [{
    sceneId,
    semanticPhaseBindings: [],
    soundCueBindings: [],
  }],
} as unknown as CanonicalLivingFrameTimingBinding

const assetWorkInputBinding = {
  identity,
  bindingDigestSha256: 'f'.repeat(64),
  readiness:
    'source_inputs_bound_operation_admission_pending',
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    executionRequirementsDigestSha256:
      executionRequirementsDigest,
    timingBindingDigestSha256:
      timingBindingDigest,
  },
  scenes: [{
    sceneId,
    refinedRequiredNamedWorkItemTypes: [],
    assetIntents: [
      {
        assetIntentId: 'asset-lf-primary',
        componentId: 'component-lf-primary',
        assetKind:
          'generated_opaque_still_source',
      },
      {
        assetIntentId: 'asset-lf-plate',
        componentId: 'component-lf-plate',
        assetKind:
          'controlled_opaque_still_variation_source',
      },
    ],
    namedWorkInputs: [],
  }],
  unresolvedPrimaryAssetIntentIds: [],
} as unknown as
  CanonicalLivingFrameAssetWorkInputBinding

const components = {
  confirmedSettings,
  timingSummary: {
    totalFrames: 300,
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
const customer =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: {
      lineItems: [],
      fallbackAllowanceCredits: 2,
      validForSeconds: 900,
    },
    components,
    livingFrameProjection: estimateProjection,
  })
const costWorkBinding =
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customer.authority,
  })
const workGraphProjection =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customer.authority,
    controlledIllustrationCostWorkBinding:
      costWorkBinding,
    components,
  })

const costScene = costWorkBinding.scenes[0]!
const primaryExpectedOutput = costScene.expectedOutputs.find(
  (output) => output.assetIntentId === 'asset-lf-primary',
)!
const plateExpectedOutput = costScene.expectedOutputs.find(
  (output) => output.assetIntentId === 'asset-lf-plate',
)!

const approvedLineageDraft = {
  contractVersion:
    'living-frame-approved-lineage-binding-v1',
  bindingClass:
    'controlled_non_executable_approved_snapshot_lineage_binding',
  sceneId,
  canonicalScope: identity,
  sourceBindings: {
    approvedSnapshotId:
      'snapshot-lf-selected-request',
    approvedSnapshotHashSha256: '1'.repeat(64),
    approvedPlanId: 'plan-lf-selected-request',
    approvedPlanVersion: 1,
    approvedPlanHashSha256: '2'.repeat(64),
    approvedWorkGraphHashSha256: '3'.repeat(64),
    approvedTimingHashSha256: '4'.repeat(64),
    approvedAssetManifestHashSha256: '5'.repeat(64),
    canonicalRendererPlanRefSha256: '6'.repeat(64),
    canonicalRendererPlanDigestSha256: '7'.repeat(64),
    rendererPlanBindingDigestSha256: '8'.repeat(64),
    choreographyBindingDigestSha256: '9'.repeat(64),
  },
  rendererLayerLineage: [{
    order: 0,
    sceneId,
    projectedComponentId: 'component-lf-primary',
    rendererLayerId: 'renderer-layer-lf-primary',
    approvedWorkItemId: 'approved-work-lf-primary',
    approvedWorkItemKey:
      costScene.workRequirementKey,
    outputKey: primaryExpectedOutput.outputKey,
    plannedAssetManifestEntryId:
      'asset-manifest-entry-lf-primary',
    required: true,
    previewPlaceholderAllowed: false,
    lineageState:
      'covered_by_exact_approved_work_output_and_planned_asset',
  }, {
    order: 1,
    sceneId,
    projectedComponentId: 'component-lf-plate',
    rendererLayerId: 'renderer-layer-lf-plate',
    approvedWorkItemId: 'approved-work-lf-primary',
    approvedWorkItemKey:
      costScene.workRequirementKey,
    outputKey: plateExpectedOutput.outputKey,
    plannedAssetManifestEntryId:
      'asset-manifest-entry-lf-plate',
    required: true,
    previewPlaceholderAllowed: false,
    lineageState:
      'covered_by_exact_approved_work_output_and_planned_asset',
  }],
  bindingState:
    'blocked_by_canonical_living_frame_component_admission',
  openGateCodes: [
    'canonical_artifact_qa_required',
    'canonical_living_frame_choreography_binding_component_ref_required',
    'canonical_living_frame_renderer_binding_component_ref_required',
    'canonical_private_remotion_review_required',
    'canonical_renderer_layer_extension_required',
    'canonical_selected_living_frame_scene_component_ref_required',
  ],
  metrics: {
    projectedLayerCount: 2,
    workOutputCoveredLayerCount: 2,
    assetManifestCoveredLayerCount: 2,
    requiredAssetCount: 2,
    placeholderAllowedAssetCount: 0,
  },
  authorityBoundary: {
    controlledLineageObservationOnly: true,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestMutationAuthority: false,
    qaApprovalAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  },
  canonicalApprovedSnapshotWasReadByRegisteredServerPort:
    true,
  existingCanonicalSnapshotRemainsImmutable: true,
  existingCanonicalWorkGraphRemainsAuthority: true,
  existingCanonicalAssetManifestRemainsAuthority: true,
  containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
    false,
  containsProviderToolJobQueueCostOrCommercialRoute: false,
  containsExecutableCodeOrCommands: false,
  subjectSpecificRouting: false,
} as const

const approvedLineageBinding = {
  ...approvedLineageDraft,
  bindingDigestSha256: digest(approvedLineageDraft),
}

const input = {
  requestBindingId:
    'living-frame.selected-scene-request.001',
  sceneId,
  approvedLineageBinding,
  publication,
  requirements,
  timingBinding,
  assetWorkInputBinding,
  estimateWorkAssetProjection: estimateProjection,
  customerEstimateAuthority: customer.authority,
  controlledIllustrationCostWorkBinding:
    costWorkBinding,
  workGraphProjection,
  components,
} as const

const request =
  createLivingFrameControlledImageSelectedSceneRequest(input)

export {
  components as livingFrameControlledImageSelectedSceneSmokeComponents,
  input as livingFrameControlledImageSelectedSceneSmokeInput,
  request as livingFrameControlledImageSelectedSceneSmokeRequest,
  sceneId as livingFrameControlledImageSelectedSceneSmokeSceneId,
}

assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    request,
    input,
  ),
  true,
)
assert.equal(
  request.selectedSceneRequestProjectionImplemented,
  true,
)
assert.equal(
  request.benchmarkRequestMaySubstituteForSelectedSceneRequest,
  false,
)
assert.equal(request.requestUnits.length, 2)
const primaryUnit = request.requestUnits.find(
  (unit) => unit.componentId === 'component-lf-primary',
)!
const plateUnit = request.requestUnits.find(
  (unit) => unit.componentId === 'component-lf-plate',
)!
assert.equal(request.metrics.readyRequestUnitCount, 1)
assert.equal(request.metrics.blockedRequestUnitCount, 1)
assert.equal(
  request.metrics.maximumPrivateInputImageCountPerUnit,
  2,
)
assert.deepEqual(
  primaryUnit.privateSlotKinds,
  [
    'base_checkpoint_artifact',
    'controlnet_checkpoint_artifact',
    'lora_adapter_artifact',
    'generic_ipadapter_checkpoint_artifact',
    'clip_vision_checkpoint_artifact',
    'positive_conditioning_text',
    'negative_conditioning_text',
    'control_image_artifact',
    'reference_image_artifact',
  ],
)
assert.equal(
  primaryUnit.requestUnitState,
  'ready_for_exact_operation_binding',
)
assert.equal(
  primaryUnit.generationCanvas.canvasClass,
  'isolated_component_square_1024',
)
assert.equal(
  primaryUnit.downstreamPolicy
    .stillAlphaPipelineRequired,
  true,
)
assert.equal(
  plateUnit.requestUnitState,
  'blocked_by_full_frame_generation_canvas_extension',
)
assert.equal(
  plateUnit.generationCanvas.canvasClass,
  'full_frame_ratio_extension_required',
)
assert.equal(
  plateUnit.downstreamPolicy
    .stillAlphaPipelineRequired,
  false,
)
assert.equal(
  request.operationExpectation.exactModelManifestRoleCount,
  5,
)
assert.equal(
  request.operationExpectation.modelArtifactsTravelInRequestBindings,
  false,
)
assert.equal(
  request.operationExpectation.sixCapabilityToolIdentityFanoutAllowed,
  false,
)
assert.equal(
  request.operationExpectation.fiveGpuCapabilityChargesAllowed,
  false,
)
assert.equal(request.executableComfyUiPromptIncluded, false)
assert.equal(request.operationRegistered, false)
assert.equal(request.dispatchGranted, false)
assert.equal(request.productionReady, false)

const benchmarkForgery = resign({
  ...withoutDigest(request),
  benchmarkRequestMaySubstituteForSelectedSceneRequest: true,
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    benchmarkForgery,
    input,
  ),
  false,
)

const fanoutForgery = resign({
  ...withoutDigest(request),
  operationExpectation: {
    ...request.operationExpectation,
    sixCapabilityToolIdentityFanoutAllowed: true,
    fiveGpuCapabilityChargesAllowed: true,
  },
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    fanoutForgery,
    input,
  ),
  false,
)

const rawPromptForgery = resign({
  ...withoutDigest(request),
  rawPrompt: 'draw the subject',
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    rawPromptForgery,
    input,
  ),
  false,
)

const continuityForgery = resign({
  ...withoutDigest(request),
  sourceBindings: {
    ...request.sourceBindings,
    visualContinuityPackDigestSha256: null,
  },
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    continuityForgery,
    input,
  ),
  false,
)

const promotionForgery = resign({
  ...withoutDigest(request),
  operationRegistered: true,
  dispatchGranted: true,
  workerLeaseCreated: true,
  assetCreated: true,
  productionReady: true,
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    promotionForgery,
    input,
  ),
  false,
)

const fullFrameForgery = withoutDigest(request)
fullFrameForgery.requestUnits = request.requestUnits.map(
  (unit) => unit.componentRole === 'opaque_background_plate'
    ? {
        ...unit,
        requestUnitState:
          'ready_for_exact_operation_binding',
      }
    : unit,
)
const resignedFullFrameForgery = resign(
  fullFrameForgery,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    resignedFullFrameForgery,
    input,
  ),
  false,
)

const finalCanvasForgery = withoutDigest(request)
finalCanvasForgery.requestUnits = request.requestUnits.map(
  (unit) => unit.componentId === 'component-lf-primary'
    ? {
        ...unit,
        generationCanvas: {
          ...unit.generationCanvas,
          finalCanvasCreatedByComfyUi: true,
        },
      }
    : unit,
)
const resignedFinalCanvasForgery = resign(
  finalCanvasForgery,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    resignedFinalCanvasForgery,
    input,
  ),
  false,
)

const modelBindingForgery = resign({
  ...withoutDigest(request),
  operationExpectation: {
    ...request.operationExpectation,
    modelArtifactsTravelInRequestBindings: true,
  },
})
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneRequest(
    modelBindingForgery,
    input,
  ),
  false,
)

let invalidLineage: unknown
try {
  createLivingFrameControlledImageSelectedSceneRequest({
    ...input,
    approvedLineageBinding: {
      ...approvedLineageBinding,
      bindingDigestSha256: '0'.repeat(64),
    },
  })
} catch (error) {
  invalidLineage = error
}
assert.ok(
  invalidLineage instanceof
    LivingFrameControlledImageSelectedSceneRequestError,
)
assert.deepEqual(invalidLineage.issues, [{
  code: 'approved_lineage_invalid',
  path: '$.approvedLineageBinding',
}])

console.log(JSON.stringify({
  status: 'passed',
  selectedSceneRequestProjectionImplemented:
    request.selectedSceneRequestProjectionImplemented,
  requestUnitCount: request.metrics.requestUnitCount,
  readyRequestUnitCount:
    request.metrics.readyRequestUnitCount,
  blockedRequestUnitCount:
    request.metrics.blockedRequestUnitCount,
  maximumPrivateInputImageCountPerUnit:
    request.metrics.maximumPrivateInputImageCountPerUnit,
  benchmarkSubstitutionAllowed:
    request.benchmarkRequestMaySubstituteForSelectedSceneRequest,
  operationRegistered: request.operationRegistered,
  dispatchGranted: request.dispatchGranted,
  adversarialAssertions: 8,
  productionReady: request.productionReady,
}))

function withoutDigest(
  value: LivingFrameControlledImageSelectedSceneRequest,
): Record<string, unknown> {
  const clone =
    structuredClone(value) as unknown as Record<string, unknown>
  delete clone.requestBindingDigestSha256
  return clone
}

function resign(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...value,
    requestBindingDigestSha256: digest(value),
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
}
