import assert from 'node:assert/strict'

import {
  compileLivingFrameAi2dInterpolationQualification,
  verifyLivingFrameAi2dInterpolationQualification,
} from '../living-frame/living-frame-ai-2d-interpolation-qualification'

const qualification =
  compileLivingFrameAi2dInterpolationQualification()

assert.equal(
  verifyLivingFrameAi2dInterpolationQualification(
    qualification,
  ),
  true,
)
assert.equal(
  qualification.candidates.length,
  2,
)
assert.deepEqual(
  qualification.candidates.map(
    (entry) => entry.proposedToolId,
  ),
  [
    'tooncrafter',
    'rife',
  ],
)
assert.deepEqual(
  qualification.candidates.map(
    (entry) =>
      entry.declaredSourceLicense,
  ),
  [
    'Apache-2.0',
    'MIT',
  ],
)
assert.equal(
  qualification.candidates.every(
    (entry) =>
      entry.requiredReleaseEvidence
        .length === 14
      && !entry.currentEvidence
        .exactSourceCommitPinned
      && !entry.currentEvidence
        .modelWeightLicenseReleased
      && !entry.currentEvidence
        .realPrivateInferenceExecuted
      && !entry.currentEvidence
        .professionalRenderedVisualAcceptancePassed
      && !entry.registryIdentityCreated
      && !entry.operationRegistered
      && !entry.dispatchGranted
      && !entry.runtimeExecuted
      && !entry.assetCreated
      && !entry.canonicalQaApproved,
  ),
  true,
)
assert.equal(
  qualification.sequencingRules
    .toonCrafterRequiresTwoAcceptedCompleteKeyposes,
  true,
)
assert.equal(
  qualification.sequencingRules
    .toonCrafterSuccessIsNeverAssumed,
  true,
)
assert.equal(
  qualification.sequencingRules
    .rifeRequiresAcceptedUnderlyingMotion,
  true,
)
assert.equal(
  qualification.sequencingRules
    .rifeCannotRepairAnatomyIdentityOrAttachments,
  true,
)
assert.equal(
  qualification.registryPolicy
    .currentRegistryUnchanged,
  true,
)
assert.equal(
  qualification.registryPolicy
    .registryExpansionPermittedForDistinctReleasedRuntime,
  true,
)
assert.equal(
  verifyLivingFrameAi2dInterpolationQualification({
    ...qualification,
    candidates:
      qualification.candidates.map(
        (entry, index) =>
          index === 0
            ? {
              ...entry,
              operationRegistered:
                true,
            }
            : entry,
      ),
  }),
  false,
)
assert.equal(
  verifyLivingFrameAi2dInterpolationQualification({
    ...qualification,
    sequencingRules: {
      ...qualification
        .sequencingRules,
      rifeRequiresAcceptedUnderlyingMotion:
        false,
    },
  }),
  false,
)
assert.equal(
  qualification.customerCharged,
  false,
)
assert.equal(
  qualification.publicDeliveryReady,
  false,
)
assert.equal(
  qualification.productionReady,
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_ai_2d_interpolation_qualification',
  status: 'passed_source_only',
  candidateCount:
    qualification.candidates.length,
  candidates:
    qualification.candidates.map(
      (entry) => ({
        toolId:
          entry.proposedToolId,
        operationId:
          entry.proposedOperationId,
        declaredSourceLicense:
          entry.declaredSourceLicense,
        releaseGateCount:
          entry.requiredReleaseEvidence
            .length,
        qualificationState:
          entry.qualificationState,
      }),
    ),
  currentRegistryUnchanged:
    qualification.registryPolicy
      .currentRegistryUnchanged,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))
