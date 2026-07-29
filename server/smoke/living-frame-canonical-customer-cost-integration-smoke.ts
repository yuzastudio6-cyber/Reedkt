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
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'

const masterTimingPlan = {
  id: 'master-timing-cost-integration',
  fps: 30,
  totalFrames: 300,
}
const soundSyncPlan = {
  id: 'soundsync-cost-integration',
  cueCount: 0,
}
const masterTimingDigest =
  sha256AuthorityValue(masterTimingPlan)
const soundSyncDigest =
  sha256AuthorityValue(soundSyncPlan)
const selectedSceneBindingDigest =
  'a'.repeat(64)
const executionRequirementsDigest =
  'b'.repeat(64)
const timingBindingDigest =
  'c'.repeat(64)

const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace-lf-cost',
      projectId: 'project-lf-cost',
      editSessionId: 'edit-session-lf-cost',
    },
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
    sceneId: 'scene-lf-generated-cost',
    canonicalSegmentId:
      'segment-lf-generated-cost',
    startFrame: 0,
    endFrameExclusive: 120,
    componentIds: [
      'component-lf-character',
      'component-lf-environment',
    ],
    semanticTimingRequestIds: [],
    soundRequestIds: [],
    capabilityKeys: [
      'still_image_generation_or_edit',
      'structure_conditioned_illustration',
      'reference_conditioned_illustration',
      'identity_conditioned_illustration',
      'low_rank_adapter_training_or_loading',
    ],
    miniSkillKeys: [
      'narrative_illustration',
    ],
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
    sceneId: 'scene-lf-generated-cost',
    semanticPhaseBindings: [],
    soundCueBindings: [],
  }],
} as unknown as CanonicalLivingFrameTimingBinding

const assetWorkInputBinding = {
  bindingDigestSha256: 'd'.repeat(64),
  sourceBindings: {
    selectedSceneBindingDigestSha256:
      selectedSceneBindingDigest,
    executionRequirementsDigestSha256:
      executionRequirementsDigest,
    timingBindingDigestSha256:
      timingBindingDigest,
  },
  scenes: [{
    sceneId: 'scene-lf-generated-cost',
    refinedRequiredNamedWorkItemTypes: [],
    assetIntents: [
      {
        assetIntentId: 'asset-lf-character',
        assetKind:
          'generated_opaque_still_source',
      },
      {
        assetIntentId: 'asset-lf-environment',
        assetKind:
          'controlled_opaque_still_variation_source',
      },
    ],
    namedWorkInputs: [],
  }],
} as unknown as
  CanonicalLivingFrameAssetWorkInputBinding

const components = {
  confirmedSettings: {
    editLevel: 'pro',
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
const lines = projection.scenes[0]!.estimateLineItems
assert.equal(lines.length, 2)
assert.ok(lines.every((line) =>
  line.costOwnerClass ===
    'shared_controlled_illustration_runtime'))
assert.equal(
  projection.metrics
    .projectedControlledIllustrationGenerationUnitCount,
  2,
)
assert.equal(
  projection.metrics
    .projectedControlledIllustrationCostComponentCount,
  2,
)
assert.equal(
  projection.metrics.exactProductionToolRegistryCount,
  50,
)
assert.equal(
  projection.expandsExactFiftyToolRegistry,
  false,
)
const exactHighMicros = lines.reduce(
  (total, line) =>
    total + line.costRange.highInternalCostMicros,
  0,
)
const allocatedCredits = lines.reduce(
  (total, line) =>
    total + line.estimatedCredits,
  0,
)
assert.equal(
  allocatedCredits,
  Math.ceil(exactHighMicros / 100_000),
)
assert.equal(allocatedCredits, 3)
assert.equal(
  projection.metrics
    .projectedMaximumInternalToolCostCredits,
  allocatedCredits,
)
assert.ok(lines.every((line) =>
  line.costOwnerToolId === null
  && line.costOwnerOperationId === null
  && line.exactFiftyToolRegistryMember === false
  && line.operationContractObserved === false
  && line.actualAttemptCostEvidenceRequired
  && line.productionRateAuthority === false
  && line.costRange.serviceFeeIncluded === false))

const compiled =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: {
      lineItems: [],
      fallbackAllowanceCredits: 2,
      validForSeconds: 900,
    },
    components,
    livingFrameProjection: projection,
  })
const serviceFeeLines =
  compiled.estimate.lineItems.filter(
    (line) =>
      line.category === 'service_fee',
  )
const controlledLines =
  compiled.estimate.lineItems.filter(
    (line) =>
      line.category === 'living_frame',
  )
assert.equal(serviceFeeLines.length, 1)
assert.equal(controlledLines.length, 2)
assert.equal(serviceFeeLines[0]!.estimatedCredits, 50)
assert.equal(
  controlledLines.reduce(
    (total, line) =>
      total + line.estimatedCredits,
    0,
  ),
  allocatedCredits,
)
assert.equal(
  compiled.authority.serviceFeeProjection
    .conservativeToolCostBasisCredits,
  allocatedCredits,
)
assert.equal(
  compiled.authority
    .projectedLivingFrameMaximumInternalToolCostCredits,
  allocatedCredits,
)
assert.equal(
  compiled.authority
    .serviceFeeProjection
    .serviceFeeIncludedInToolCosts,
  false,
)
assert.equal(
  compiled.authority
    .actualChargeStillRequiresActualBillableToolCost,
  true,
)

console.log(
  'Living Frame canonical customer-cost integration passed generated-intent derivation, shared GPU plus separate AuraFace pricing, exact 50-tool preservation, whole-bundle rounding, and one service-fee checks.',
)
