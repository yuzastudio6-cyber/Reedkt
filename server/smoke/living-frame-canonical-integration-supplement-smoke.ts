import assert from 'node:assert/strict'

import {
  LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS,
  LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS,
} from '../../src/types/living-frame-canonical-integration-supplement'
import {
  compileLivingFrameActiveProfessionalSkillPolicyProjection,
} from '../living-frame/living-frame-active-professional-skill-policy-projection'
import {
  compileLivingFrameCanonicalIntegrationSupplement,
  verifyLivingFrameCanonicalIntegrationSupplement,
} from '../living-frame/living-frame-canonical-integration-supplement'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const activeProfessionalSkillPolicyProjection =
  compileLivingFrameActiveProfessionalSkillPolicyProjection()
const input = {
  ownerScopeAmendment,
  activeProfessionalSkillPolicyProjection,
}
const supplement =
  compileLivingFrameCanonicalIntegrationSupplement(input)

assert.equal(
  verifyLivingFrameCanonicalIntegrationSupplement(
    supplement,
    input,
  ),
  true,
)
assert.equal(
  supplement.contractVersion,
  'living-frame-canonical-integration-supplement-v1',
)
assert.equal(supplement.sourceRefs.length, 10)
assert.equal(supplement.canonicalConsumptionPoints.length, 15)
assert.deepEqual(
  supplement.canonicalConsumptionPoints.map((entry) =>
    entry.consumptionPointId),
  LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS,
)
assert.equal(
  supplement.canonicalConsumptionPoints.every(
    (entry, order) =>
      entry.order === order
      && entry.consumes.length > 0
      && entry.mustProduceOrPreserve.length > 0
      && entry.sourceRefIds.length > 0
      && !entry.createsParallelOwner,
  ),
  true,
)
assert.equal(supplement.toolRoutes.length, 12)
assert.equal(
  new Set(supplement.toolRoutes.map((entry) =>
    entry.toolId)).size,
  supplement.toolRoutes.length,
)
assert.equal(
  supplement.toolRoutes.every((entry) =>
    !entry.operationRegistrationOrDispatchGrantedBySupplement
    && !entry.createsNewIdentity),
  true,
)
assert.equal(
  supplement.toolRoutes.find((entry) =>
    entry.toolId === 'comfyui')?.identityState,
  'existing_non_e2e_capability_identity',
)
assert.equal(
  supplement.toolRoutes.some((entry) =>
    entry.toolId.includes('auraface')),
  false,
)
assert.equal(
  supplement.observedRegistryState.productionIdentityCount,
  50,
)
assert.equal(
  supplement.observedRegistryState.nonE2ECapabilityIdentityCount,
  23,
)
assert.equal(
  supplement.observedRegistryState.registryCountIsNotProductCap,
  true,
)
assert.equal(supplement.controlledGenerationRoles.length, 6)
assert.deepEqual(
  supplement.controlledGenerationRoles
    .slice(0, 5)
    .map((entry) => entry.executableIdentityOwner),
  ['comfyui', 'comfyui', 'comfyui', 'comfyui', 'comfyui'],
)
assert.deepEqual(
  supplement.controlledGenerationRoles
    .slice(0, 5)
    .map((entry) => entry.separateChargeEventRequired),
  [true, false, false, false, false],
)
assert.equal(
  supplement.controlledGenerationRoles[5]
    ?.activeOwnerScopeAdmission,
  'not_admissible_under_current_owner_scope',
)
assert.equal(
  supplement.specialistModelRoles.visualEvidenceSpecialist,
  'qwen2_5_vl_visual_understanding',
)
assert.equal(
  supplement.specialistModelRoles.headQaPrimary,
  'kimi_k3_main_edit_agent',
)
assert.equal(
  supplement.specialistModelRoles.headQaFallback,
  'gpt_5_6_terra_fallback_edit_agent',
)
assert.equal(
  supplement.exactSharedInterfaceBlockerCount,
  LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS.length,
)
assert.deepEqual(
  supplement.blockerIds,
  LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS,
)
assert.equal(supplement.activeScopeCount, 12)
assert.equal(supplement.pausedScopeCount, 7)
assert.equal(
  supplement.pausedCharacterAndMechanicalRoutesNonAdmissible,
  true,
)
assert.equal(supplement.canonicalConsumptionPending, true)
assert.equal(supplement.sharedRegistryMutated, false)
assert.equal(supplement.sharedPlannerMutated, false)
assert.equal(supplement.sharedUiMutated, false)
assert.equal(supplement.directPrivateReviewAdapterClaimed, false)
assert.equal(supplement.runtimeExecuted, false)
assert.equal(supplement.productionReady, false)

assert.throws(() =>
  compileLivingFrameCanonicalIntegrationSupplement({
    ...input,
    ownerScopeAmendment: {
      ...ownerScopeAmendment,
      amendmentDigestSha256: sha256AuthorityValue('forged-scope'),
    },
  }))
assert.throws(() =>
  compileLivingFrameCanonicalIntegrationSupplement({
    ...input,
    activeProfessionalSkillPolicyProjection: {
      ...activeProfessionalSkillPolicyProjection,
      projectionDigestSha256: sha256AuthorityValue('forged-policy'),
    },
  }))

const outputTamperCases = [
  { canonicalConsumptionPending: false },
  { sharedRegistryMutated: true },
  { sharedPlannerMutated: true },
  { sharedUiMutated: true },
  { directPrivateReviewAdapterClaimed: true },
  { operationRegistered: true },
  { providerCallMade: true },
  { dispatchGranted: true },
  { runtimeExecuted: true },
  { artifactCreated: true },
  { costAdmitted: true },
  { canonicalQaApproved: true },
  { privateReviewApproved: true },
  { customerCharged: true },
  { publicDeliveryReady: true },
  { productionReady: true },
  { sourceRefSetDigestSha256: sha256AuthorityValue('forged-sources') },
  { toolRouteSetDigestSha256: sha256AuthorityValue('forged-routes') },
  { blockerSetDigestSha256: sha256AuthorityValue('forged-blockers') },
] as const

for (const mutation of outputTamperCases) {
  assert.equal(
    verifyLivingFrameCanonicalIntegrationSupplement(
      { ...supplement, ...mutation },
      input,
    ),
    false,
  )
}

const nestedTamperCases = [
  {
    ...supplement,
    sourceRefs: supplement.sourceRefs.map((entry, index) =>
      index === 0
        ? { ...entry, canonicalRereadRequired: false }
        : entry),
  },
  {
    ...supplement,
    toolRoutes: supplement.toolRoutes.map((entry, index) =>
      index === 0
        ? { ...entry, createsNewIdentity: true }
        : entry),
  },
  {
    ...supplement,
    controlledGenerationRoles:
      supplement.controlledGenerationRoles.map((entry, index) =>
        index === 2
          ? { ...entry, separateChargeEventRequired: true }
          : entry),
  },
  {
    ...supplement,
    canonicalConsumptionPoints:
      supplement.canonicalConsumptionPoints.slice(1),
  },
]

for (const candidate of nestedTamperCases) {
  assert.equal(
    verifyLivingFrameCanonicalIntegrationSupplement(
      candidate,
      input,
    ),
    false,
  )
}

console.log(JSON.stringify({
  contractVersion: supplement.contractVersion,
  supplementDigestSha256: supplement.supplementDigestSha256,
  sourceRefCount: supplement.sourceRefs.length,
  canonicalConsumptionPointCount:
    supplement.canonicalConsumptionPoints.length,
  toolRouteCount: supplement.toolRoutes.length,
  observedProductionRegistryCount:
    supplement.observedRegistryState.productionIdentityCount,
  observedNonE2ECapabilityCount:
    supplement.observedRegistryState.nonE2ECapabilityIdentityCount,
  controlledGenerationRoleCount:
    supplement.controlledGenerationRoles.length,
  exactSharedInterfaceBlockerCount:
    supplement.exactSharedInterfaceBlockerCount,
  inputTamperChecks: 2,
  outputTamperChecks: outputTamperCases.length,
  nestedTamperChecks: nestedTamperCases.length,
  totalChecks: 58,
  canonicalConsumptionPending:
    supplement.canonicalConsumptionPending,
  runtimeExecuted: supplement.runtimeExecuted,
  productionReady: supplement.productionReady,
}, null, 2))
