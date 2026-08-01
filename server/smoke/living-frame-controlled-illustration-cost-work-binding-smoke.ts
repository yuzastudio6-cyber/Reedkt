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
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
  verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
  verifyCanonicalLivingFrameWorkGraphProjection,
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
  workspaceId: 'workspace-lf-cost-work',
  projectId: 'project-lf-cost-work',
  editSessionId: 'edit-session-lf-cost-work',
}
const masterTimingPlan = {
  id: 'master-timing-lf-cost-work',
  fps: 30,
  totalFrames: 300,
}
const soundSyncPlan = {
  id: 'soundsync-lf-cost-work',
  cueCount: 0,
}
const selectedSceneBindingDigest = 'a'.repeat(64)
const executionRequirementsDigest = 'b'.repeat(64)
const timingBindingDigest = 'c'.repeat(64)
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
    sceneId: 'scene-lf-cost-work',
    canonicalSegmentId: 'segment-lf-cost-work',
    startFrame: 0,
    endFrameExclusive: 120,
    componentIds: [
      'component-lf-primary',
      'component-lf-support',
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
    sceneId: 'scene-lf-cost-work',
    semanticPhaseBindings: [],
    soundCueBindings: [],
  }],
} as unknown as CanonicalLivingFrameTimingBinding

const assetWorkInputBinding = {
  identity,
  bindingDigestSha256: 'd'.repeat(64),
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
    sceneId: 'scene-lf-cost-work',
    refinedRequiredNamedWorkItemTypes: [],
    assetIntents: [
      {
        assetIntentId: 'asset-lf-primary',
        assetKind:
          'generated_opaque_still_source',
      },
      {
        assetIntentId: 'asset-lf-support',
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
  confirmedSettings: {
    editLevel: 'pro',
    outputFrame: {
      width: 1920,
      height: 1080,
    },
  },
  timingSummary: {
    totalFrames: 300,
    fps: 30,
  },
  masterTimingPlan,
  soundSyncTransitionTimingPlan: soundSyncPlan,
} as unknown as CanonicalPlanComponentsInput

const projection =
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
    livingFrameProjection: projection,
  })
const binding =
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
  })
const workGraph =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
    controlledIllustrationCostWorkBinding: binding,
    components,
  })

assert.equal(
  verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    binding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
  }),
  true,
)
assert.equal(binding.scenes.length, 1)
const scene = binding.scenes[0]!
assert.equal(scene.workItemType, 'generate_image_asset')
assert.deepEqual(scene.generatedAssetIntentIds, [
  'asset-lf-primary',
  'asset-lf-support',
])
assert.equal(scene.generationUnitCount, 2)
assert.equal(scene.plannedAttemptCount, 4)
assert.equal(scene.expectedOutputs.length, 2)
assert.ok(scene.expectedOutputs.every((output) =>
  output.assetRole === 'generated'
  && output.artifactType ===
    'living_frame_generated_opaque_still_png'
  && output.assetManifestEntryRequiredAfterApproval))
assert.equal(
  scene.optionalContinuityQaCostBinding
    ?.workItemType,
  'run_asset_qa',
)
assert.equal(
  binding.metrics.unassignedControlledIllustrationCostLineCount,
  0,
)
assert.equal(
  binding.metrics.exactProductionToolRegistryCount,
  50,
)
assert.equal(
  binding.pricingPolicy.capabilityIdsCreateIndependentCharges,
  false,
)
assert.equal(
  binding.pricingPolicy.oneSharedGpuHostChargePerGenerationAttempt,
  true,
)
assert.equal(
  binding.pricingPolicy.serviceFeeLineCount,
  1,
)
assert.equal(
  Object.values(binding.authorityBoundary)
    .filter((value) => value === true).length,
  1,
)
assert.equal(
  binding.authorityBoundary
    .serverDerivedCostWorkBindingAuthority,
  true,
)
assert.equal(binding.createsCanonicalWorkItems, false)
assert.equal(binding.productionReady, false)
assert.equal(
  verifyCanonicalLivingFrameWorkGraphProjection({
    projection: workGraph,
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
    controlledIllustrationCostWorkBinding: binding,
    components,
  }),
  true,
)
assert.equal(
  workGraph.readiness,
  'canonical_work_items_projected_operation_admission_pending',
)
assert.equal(workGraph.workItems.length, 2)
assert.equal(
  workGraph.metrics
    .admittedControlledIllustrationGenerationWorkItemCount,
  1,
)
assert.equal(
  workGraph.metrics.admittedAuraFaceQaWorkItemCount,
  1,
)
assert.equal(
  workGraph.metrics.unassignedControlledIllustrationCreditBudget,
  0,
)
assert.equal(
  workGraph.metrics.maximumCreditBudget,
  projection.metrics
    .projectedMaximumInternalToolCostCredits,
)
assert.equal(workGraph.finalCompositionBinding, null)
assert.ok(workGraph.workItems.every((item) =>
  item.workerClass ===
    'living_frame_operation_admission_pending_worker'
  && item.approvedToolIds.length === 0
  && item.providerExecutionMode === 'none'))
const generationWorkItem =
  workGraph.workItems.find((item) =>
    item.workItemType === 'generate_image_asset')!
const auraFaceWorkItem =
  workGraph.workItems.find((item) =>
    item.workItemType === 'run_asset_qa')!
assert.deepEqual(
  auraFaceWorkItem.dependencyKeys,
  [generationWorkItem.workItemKey],
)
assert.equal(
  workGraph.authorityBoundary
    .serverDerivedControlledIllustrationPendingWorkAuthority,
  true,
)
assert.equal(
  workGraph.containsControlledIllustrationExecutablePayload,
  false,
)

const tamperedIntent = resignBinding({
  ...structuredClone(binding),
  scenes: [{
    ...structuredClone(binding.scenes[0]!),
    generatedAssetIntentIds: [
      'asset-lf-primary',
    ],
  }],
})
assert.equal(
  verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    binding: tamperedIntent,
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
  }),
  false,
)

const generationLine =
  customer.authority.normalizedEstimate
    .lineItems.find((line) =>
      line.metadata.controlledIllustrationCostComponentId ===
        'shared_controlled_illustration_gpu_host')!
const duplicatedCostLineCustomer =
  resignCustomerAuthority({
    ...structuredClone(customer.authority),
    normalizedEstimate: {
      ...structuredClone(
        customer.authority.normalizedEstimate,
      ),
      lineItems: [
        ...structuredClone(
          customer.authority.normalizedEstimate
            .lineItems,
        ),
        structuredClone(generationLine),
      ],
    },
  })
assert.throws(
  () =>
    compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
      assetWorkInputBinding,
      estimateWorkAssetProjection: projection,
      customerEstimateAuthority:
        duplicatedCostLineCustomer,
    }),
  /absent or duplicated/u,
)

const forgedAllGreen = resignBinding({
  ...structuredClone(binding),
  scenes: [{
    ...structuredClone(binding.scenes[0]!),
    workItemCreated: true,
    executablePayloadPresent: true,
  }],
  authorityBoundary: {
    ...structuredClone(binding.authorityBoundary),
    runtimeAuthority: true,
  },
  productionReady: true,
} as unknown as typeof binding)
assert.equal(
  verifyCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    binding: forgedAllGreen,
    assetWorkInputBinding,
    estimateWorkAssetProjection: projection,
    customerEstimateAuthority: customer.authority,
  }),
  false,
)

const missingServiceFee = resignCustomerAuthority({
  ...structuredClone(customer.authority),
  normalizedEstimate: {
    ...structuredClone(
      customer.authority.normalizedEstimate,
    ),
    lineItems:
      customer.authority.normalizedEstimate
        .lineItems.filter(
          (line) =>
            line.metadata.lineItemRole !==
              'reeditpro_service_fee',
        ),
  },
})
assert.throws(
  () =>
    compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
      assetWorkInputBinding,
      estimateWorkAssetProjection: projection,
      customerEstimateAuthority: missingServiceFee,
    }),
  /exactly one downstream service-fee/u,
)

console.log(
  'Living Frame controlled-illustration cost/work binding passed exact generated-intent coverage, one shared GPU work requirement, separate optional AuraFace QA pricing, canonical estimate/service-fee lineage, zero unassigned cost lines, and forged-promotion checks.',
)

function resignBinding(
  value: typeof binding,
): typeof binding {
  const draft = {
    ...value,
  } as unknown as Record<string, unknown>
  delete draft.bindingDigestSha256
  return {
    ...value,
    bindingDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function resignCustomerAuthority(
  value: typeof customer.authority,
): typeof customer.authority {
  const draft = {
    ...value,
  } as unknown as Record<string, unknown>
  delete draft.authorityDigestSha256
  return {
    ...value,
    authorityDigestSha256:
      sha256AuthorityValue(draft),
  }
}
