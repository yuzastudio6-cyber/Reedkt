import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameProjectedInfrastructureEstimateLineItem,
} from '../../src/types/living-frame-estimate-work-asset-projection'
import {
  allocateCreditsOnceAcrossLivingFrameBundle,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameControlledIllustrationEstimateBasis,
} from '../living-frame/canonical-living-frame-controlled-illustration-estimate-basis'

const generated = [
  'asset-intent-character-anchor',
  'asset-intent-environment-anchor',
]

const basis =
  compileCanonicalLivingFrameControlledIllustrationEstimateBasis({
    sceneId: 'lf-scene-controlled-cost',
    productEditLevel: 'premium',
    generatedAssetIntentIds: generated,
    capabilityKeys: [
      'still_image_generation_or_edit',
      'structure_conditioned_illustration',
      'reference_conditioned_illustration',
      'identity_conditioned_illustration',
      'low_rank_adapter_training_or_loading',
    ],
  })

assert.equal(basis.attemptsPerGenerationUnit, 2)
assert.equal(basis.generationUnitCount, 2)
assert.equal(basis.costComponents.length, 2)
assert.equal(
  basis.costComponents.filter(
    (component) =>
      component.componentId ===
        'shared_controlled_illustration_gpu_host',
  ).length,
  1,
)
assert.deepEqual(
  basis.costComponents[0]!.activeCapabilityIds,
  [
    'comfyui_execution_host',
    'comfyui_controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'ipadapter_reference_conditioning',
    'peft_lora_adapter_loading',
  ],
)
assert.equal(
  basis.costComponents[0]!.attemptOrComparisonCount,
  4,
)
assert.ok(
  basis.costComponents[0]!.tempStorageGibHours > 0,
)
assert.ok(
  basis.costComponents[0]!.outputStorageGibHours > 0,
)
assert.equal(
  basis.costComponents[0]!.networkEgressMib,
  0,
)
assert.equal(
  basis.costComponents[1]!.componentId,
  'auraface_cpu_continuity_measurement',
)
assert.equal(
  basis.costComponents[1]!.attemptOrComparisonCount,
  4,
)
assert.equal(
  basis.sixCapabilityIdsCreateSixToolCharges,
  false,
)
assert.equal(basis.serviceFeeIncluded, false)
assert.equal(basis.currentRateAuthority, false)
assert.equal(basis.actualAttemptCostAuthority, false)
assert.ok(basis.totalExpectedInternalCostMicros > 0)
assert.ok(
  basis.totalHighInternalCostMicros
  >= basis.totalExpectedInternalCostMicros,
)

const nonUse =
  compileCanonicalLivingFrameControlledIllustrationEstimateBasis({
    sceneId: 'lf-scene-controlled-cost-non-use',
    productEditLevel: 'normal',
    generatedAssetIntentIds: [],
    capabilityKeys: [],
  })
assert.equal(nonUse.costComponents.length, 0)
assert.equal(nonUse.totalExpectedInternalCostMicros, 0)

assert.throws(() =>
  compileCanonicalLivingFrameControlledIllustrationEstimateBasis({
    sceneId: 'lf-scene-controlled-cost-invalid',
    productEditLevel: 'normal',
    generatedAssetIntentIds: [
      'duplicate-intent',
      'duplicate-intent',
    ],
    capabilityKeys: [],
  }),
)

const tinyScenes = Array.from(
  { length: 10 },
  (_, index) => ({
    sceneId: `scene-${index + 1}`,
    estimateLineItems: [
      tinyInfrastructureLine(index + 1),
    ],
  }),
)
const allocated =
  allocateCreditsOnceAcrossLivingFrameBundle(tinyScenes)
const aggregateCredits = allocated
  .flatMap((scene) => scene.estimateLineItems)
  .reduce(
    (total, line) => total + line.estimatedCredits,
    0,
  )
assert.equal(aggregateCredits, 3)
assert.equal(
  tinyScenes.flatMap(
    (scene) => scene.estimateLineItems,
  ).reduce(
    (total, line) =>
      total
      + Math.ceil(
        line.costRange.highInternalCostMicros
        / 100_000,
      ),
    0,
  ),
  10,
)

console.log(
  'Living Frame controlled-illustration estimate basis passed shared-host attribution, separate AuraFace measurement, non-use, adversarial, and whole-bundle credit-rounding checks.',
)

function tinyInfrastructureLine(
  index: number,
): CanonicalLivingFrameProjectedInfrastructureEstimateLineItem {
  return {
    lineKey: `lf-tiny-cost-${index}`,
    label: 'Tiny controlled runtime contribution',
    category: 'living_frame',
    estimatedCredits: 0,
    removable: false,
    sceneId: `scene-${index}`,
    costOwnerClass:
      'shared_controlled_illustration_runtime',
    workItemType: null,
    costOwnerToolId: null,
    costOwnerOperationId: null,
    controlledIllustrationCostComponentId:
      'shared_controlled_illustration_gpu_host',
    activeControlledIllustrationCapabilityIds: [
      'comfyui_execution_host',
    ],
    generationUnitCount: 1,
    attemptOrComparisonCount: 1,
    billableMilliseconds: 1_000,
    executionPlacement: 'google_cloud_run_gpu',
    cpuFallbackAllowed: false,
    costRange: {
      lowCredits: 0,
      expectedCredits: 0,
      highCredits: 0,
      lowInternalCostMicros: 25_900,
      expectedInternalCostMicros: 25_900,
      highInternalCostMicros: 25_900,
      riskLevel: 'high',
      rateCardVersion: 'rounding-smoke-v1',
      serviceFeeIncluded: false,
    },
    exactFiftyToolRegistryMember: false,
    operationContractObserved: false,
    actualAttemptCostEvidenceRequired: true,
    productionRateAuthority: false,
    estimateOnly: true,
  }
}
