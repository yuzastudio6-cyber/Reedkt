import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
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
  createCanonicalToolPayloadAuthority,
  type CanonicalToolPayloadWorkItem,
} from '../edit-architecture/canonical-tool-payload-authority'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
  verifyCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
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
  workspaceId: 'workspace-lf-generated-alpha',
  projectId: 'project-lf-generated-alpha',
  editSessionId: 'edit-lf-generated-alpha',
}
const masterTimingPlan = {
  id: 'master-lf-generated-alpha',
  fps: 30,
  totalFrames: 180,
}
const soundSyncPlan = {
  id: 'soundsync-lf-generated-alpha',
  cueCount: 0,
}
const selectedDigest = 'a'.repeat(64)
const requirementsDigest = 'b'.repeat(64)
const timingDigest = 'c'.repeat(64)
const assetBindingDigest = 'd'.repeat(64)
const masterDigest = sha256AuthorityValue(masterTimingPlan)
const soundDigest = sha256AuthorityValue(soundSyncPlan)

const publication = {
  binding: {
    identity,
    bindingDigestSha256: selectedDigest,
    selectedSceneCount: 1,
    deliberateNonUse: false,
  },
} as unknown as CanonicalLivingFrameSelectedScenePublication

const requirements = {
  requirementsDigestSha256: requirementsDigest,
  sourceBindings: {
    selectedSceneBindingDigestSha256: selectedDigest,
    currentMasterTimingDigestSha256: masterDigest,
    currentSoundSyncDigestSha256: soundDigest,
  },
  scenes: [{
    sceneId: 'scene-generated-alpha',
    canonicalSegmentId: 'segment-generated-alpha',
    startFrame: 12,
    endFrameExclusive: 132,
    componentIds: ['component-generated-alpha'],
    semanticTimingRequestIds: [
      'timing-request-generated-alpha',
    ],
    soundRequestIds: [],
    capabilityKeys: [
      'still_image_generation_or_edit',
      'reference_conditioned_illustration',
      'structure_conditioned_illustration',
      'low_rank_adapter_training_or_loading',
    ],
    miniSkillKeys: ['narrative_illustration'],
    requiredNamedWorkItemTypes: [
      'generate_image_asset',
      'generate_mask_asset',
      'process_image_asset',
      'prepare_remotion_layer',
    ],
    missingOperationCodes: [],
    requiredExternalGateCodes: [],
    qaExpectationCodes: [],
  }],
} as unknown as CanonicalLivingFrameExecutionRequirements

const timingBinding = {
  timingBindingDigestSha256: timingDigest,
  sourceBindings: {
    selectedSceneBindingDigestSha256: selectedDigest,
    executionRequirementsDigestSha256: requirementsDigest,
    currentMasterTimingDigestSha256: masterDigest,
  },
  scenes: [{
    sceneId: 'scene-generated-alpha',
    semanticPhaseBindings: [{
      timingRequestId:
        'timing-request-generated-alpha',
      phase: 'demonstrate',
      frameRange: {
        startFrame: 12,
        endFrameExclusive: 132,
        durationFrames: 120,
      },
    }],
    soundCueBindings: [],
    visualTiming: {
      frameRange: {
        startFrame: 12,
        endFrameExclusive: 132,
        durationFrames: 120,
      },
    },
  }],
} as unknown as CanonicalLivingFrameTimingBinding

const assetWorkInputBinding = {
  identity,
  bindingDigestSha256: assetBindingDigest,
  readiness:
    'source_inputs_bound_operation_admission_pending',
  sourceBindings: {
    selectedSceneBindingDigestSha256: selectedDigest,
    executionRequirementsDigestSha256: requirementsDigest,
    timingBindingDigestSha256: timingDigest,
  },
  scenes: [{
    sceneId: 'scene-generated-alpha',
    canonicalSegmentId: 'segment-generated-alpha',
    refinedRequiredNamedWorkItemTypes: [
      'generate_image_asset',
      'generate_mask_asset',
      'process_image_asset',
      'prepare_remotion_layer',
    ],
    assetIntents: [
      {
        assetIntentId: 'asset-generated-source',
        assetKind: 'generated_opaque_still_source',
      },
      {
        assetIntentId: 'asset-generated-mask',
        assetKind: 'still_alpha_mask',
      },
      {
        assetIntentId: 'asset-generated-rgba',
        assetKind: 'processed_rgba_still_component',
      },
    ],
    namedWorkInputs: [
      {
        workItemType: 'generate_image_asset',
        inputAssetIntentIds: [],
        outputAssetIntentIds: ['asset-generated-source'],
        dependencyNamedWorkItemTypes: [],
        sourceFrameInputs: [],
      },
      {
        workItemType: 'generate_mask_asset',
        inputAssetIntentIds: ['asset-generated-source'],
        outputAssetIntentIds: ['asset-generated-mask'],
        dependencyNamedWorkItemTypes: [
          'generate_image_asset',
        ],
        sourceFrameInputs: [],
      },
      {
        workItemType: 'process_image_asset',
        inputAssetIntentIds: [
          'asset-generated-mask',
          'asset-generated-source',
        ],
        outputAssetIntentIds: ['asset-generated-rgba'],
        dependencyNamedWorkItemTypes: [
          'generate_image_asset',
          'generate_mask_asset',
        ],
        sourceFrameInputs: [],
      },
      {
        workItemType: 'prepare_remotion_layer',
        inputAssetIntentIds: ['asset-generated-rgba'],
        outputAssetIntentIds: [],
        dependencyNamedWorkItemTypes: [
          'process_image_asset',
        ],
        sourceFrameInputs: [],
      },
    ],
  }],
  unresolvedPrimaryAssetIntentIds: [],
} as unknown as CanonicalLivingFrameAssetWorkInputBinding

const components = {
  confirmedSettings: {
    editLevel: 'pro',
    outputFrame: {
      width: 1920,
      height: 1080,
    },
  },
  timingSummary: {
    totalFrames: 180,
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
const costWorkBinding =
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customerEstimate.authority,
  })
const projectedEstimateLines =
  estimateProjection.scenes.flatMap(
    (scene) => scene.estimateLineItems,
  )
const sharedGenerationLines =
  projectedEstimateLines.filter(
    (line) =>
      line.costOwnerClass ===
        'shared_controlled_illustration_runtime'
      && line.controlledIllustrationCostComponentId ===
        'shared_controlled_illustration_gpu_host',
  )
const sharedGenerationLine = sharedGenerationLines[0]
if (
  !sharedGenerationLine
  || sharedGenerationLine.costOwnerClass !==
    'shared_controlled_illustration_runtime'
) {
  throw new Error(
    'Expected one shared controlled-illustration generation line.',
  )
}
const registeredPostProcessingToolIds =
  projectedEstimateLines.flatMap((line) =>
    line.costOwnerToolId === null
      ? []
      : [line.costOwnerToolId])
assert.equal(projectedEstimateLines.length, 4)
assert.equal(sharedGenerationLines.length, 1)
assert.deepEqual(
  sharedGenerationLine
    .activeControlledIllustrationCapabilityIds,
  [
    'comfyui_execution_host',
    'comfyui_controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'ipadapter_reference_conditioning',
    'peft_lora_adapter_loading',
  ],
)
assert.equal(
  sharedGenerationLine.generationUnitCount,
  1,
)
assert.deepEqual(
  registeredPostProcessingToolIds.sort(),
  ['rembg', 'remotion', 'sharp'],
)
assert.equal(
  costWorkBinding.metrics.plannedGpuAttemptCount,
  costWorkBinding.scenes[0]!.plannedAttemptCount,
)
assert.equal(
  costWorkBinding.scenes[0]!.plannedAttemptCount,
  2,
)
assert.equal(
  costWorkBinding.pricingPolicy
    .capabilityIdsCreateIndependentCharges,
  false,
)
assert.equal(
  costWorkBinding.pricingPolicy
    .oneSharedGpuHostChargePerGenerationAttempt,
  true,
)
assert.equal(
  costWorkBinding.pricingPolicy
    .aggregateMicroCostBeforeCreditRounding,
  true,
)
assert.equal(
  costWorkBinding.pricingPolicy
    .serviceFeeIncludedInToolCosts,
  false,
)
assert.equal(
  costWorkBinding.pricingPolicy.serviceFeeLineCount,
  1,
)
assert.equal(
  costWorkBinding.pricingPolicy
    .unapprovedOverageMayBeCharged,
  false,
)
const customerLivingFrameLines =
  customerEstimate.estimate.lineItems.filter(
    (line) => line.category === 'living_frame',
  )
const customerServiceFeeLines =
  customerEstimate.estimate.lineItems.filter(
    (line) => line.category === 'service_fee',
  )
assert.equal(customerLivingFrameLines.length, 4)
assert.equal(customerServiceFeeLines.length, 1)
assert.equal(
  customerEstimate.authority
    .projectedLivingFrameToolCostLineItemCount,
  4,
)
assert.equal(
  customerEstimate.authority
    .serviceFeeProjection.serviceFeeIncludedInToolCosts,
  false,
)
assert.equal(
  customerEstimate.authority
    .actualChargeStillRequiresActualBillableToolCost,
  true,
)
assert.equal(
  customerEstimate.authority
    .unusedApprovedReservationMustBeReleased,
  true,
)
const projection =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customerEstimate.authority,
    controlledIllustrationCostWorkBinding:
      costWorkBinding,
    components,
  })

assert.equal(
  verifyCanonicalLivingFrameWorkGraphProjection({
    projection,
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority:
      customerEstimate.authority,
    controlledIllustrationCostWorkBinding:
      costWorkBinding,
    components,
  }),
  true,
)
const generation = projection.workItems.find(
  (item) => item.workItemType === 'generate_image_asset',
)
const mask = projection.workItems.find(
  (item) => item.workItemType === 'generate_mask_asset',
)
const component = projection.workItems.find(
  (item) => item.workItemType === 'process_image_asset',
)
const layer = projection.workItems.find(
  (item) => item.workItemType === 'prepare_remotion_layer',
)
assert.ok(generation)
assert.ok(mask)
assert.ok(component)
assert.ok(layer)
assert.equal(mask.workerClass, 'gpu_ai_worker')
assert.equal(component.workerClass, 'render_worker')
assert.deepEqual(mask.sourceSequenceItemIds, [])
assert.deepEqual(mask.sourceCleanupDecisionIds, [])
assert.deepEqual(component.sourceSequenceItemIds, [])
assert.deepEqual(component.sourceCleanupDecisionIds, [])
assert.deepEqual(mask.dependencyKeys, [
  generation.workItemKey,
])
assert.deepEqual(component.dependencyKeys, [
  generation.workItemKey,
  mask.workItemKey,
].sort())
if (
  mask.workerClass !== 'gpu_ai_worker'
  || !('structuredPayload' in mask.executionInput)
) {
  throw new Error('Expected exact rembg GPU mask item.')
}
assert.deepEqual(
  mask.executionInput.structuredPayload.sourceDependency,
  {
    sourceVariant:
      'living_frame_generated_opaque_still',
    workItemKey: generation.workItemKey,
    outputKey: generation.expectedOutputs[0]!.outputKey,
    artifactType:
      'living_frame_generated_opaque_still_png',
    assetIntentId: 'asset-generated-source',
    contentType: 'image/png',
  },
)
assert.equal(
  projection.finalCompositionBinding
    ?.overlayLayers.length,
  1,
)
assert.equal(
  projection.metrics
    .admittedControlledIllustrationGenerationWorkItemCount,
  1,
)
assert.equal(
  projection.metrics.admittedRembgGpuMaskWorkItemCount,
  1,
)
assert.equal(
  projection.metrics.admittedSharpComponentWorkItemCount,
  1,
)
assert.equal(
  projection.metrics.admittedRemotionLayerWorkItemCount,
  1,
)
assert.equal(
  projection.metrics.unassignedControlledIllustrationCreditBudget,
  0,
)
const payloadAuthority =
  createCanonicalToolPayloadAuthority({
    workItems: structuredClone(
      projection.workItems,
    ) as unknown as CanonicalToolPayloadWorkItem[],
  })
assert.equal(
  payloadAuthority.summary.validatedWorkItemCount,
  2,
)
assert.equal(
  payloadAuthority.summary
    .allRequiredToolPayloadsValidated,
  true,
)

const forgedMixedSource = resign({
  ...structuredClone(projection),
  workItems: projection.workItems.map((item) =>
    item.workItemKey === mask.workItemKey
      ? {
          ...structuredClone(item),
          sourceSequenceItemIds: ['source-forged'],
          sourceCleanupDecisionIds: ['cleanup-forged'],
        }
      : structuredClone(item)),
} as unknown as typeof projection)
assert.equal(
  verifyCanonicalLivingFrameWorkGraphProjection({
    projection: forgedMixedSource,
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority:
      customerEstimate.authority,
    controlledIllustrationCostWorkBinding:
      costWorkBinding,
    components,
  }),
  false,
)

console.log(
  'Living Frame generated opaque still -> canonical rembg mask -> Sharp RGBA -> Remotion graph passed with exact cost lineage and mixed-source fail-closed coverage.',
)

function resign(
  value: typeof projection,
): typeof projection {
  const {
    projectionDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  return {
    ...draft,
    projectionDigestSha256:
      sha256AuthorityValue(draft),
  }
}
