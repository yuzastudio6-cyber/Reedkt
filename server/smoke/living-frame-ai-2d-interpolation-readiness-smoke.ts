import assert from 'node:assert/strict'

import type {
  LivingFrameCompleteCharacterInterpolationAdmission,
  LivingFrameCompleteCharacterInterpolationAdmissionDraft,
  LivingFrameCompleteCharacterInterpolationTransitionUnit,
} from '../../src/types/living-frame-complete-character-interpolation-admission'
import {
  compileLivingFrameAi2dInterpolationQualification,
} from '../living-frame/living-frame-ai-2d-interpolation-qualification'
import {
  compileLivingFrameAi2dInterpolationReadiness,
  verifyLivingFrameAi2dInterpolationReadiness,
} from '../living-frame/living-frame-ai-2d-interpolation-readiness'
import {
  compileLivingFrameAi2dInterpolationSourceAudit,
} from '../living-frame/living-frame-ai-2d-interpolation-source-audit'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const qualification =
  compileLivingFrameAi2dInterpolationQualification()
const sourceAudit =
  compileLivingFrameAi2dInterpolationSourceAudit()
const admission = admissionFixture(
  qualification.qualificationDigestSha256,
)
const input = {
  readinessId:
    'readiness.airship.accepted-keypose-interpolation.v1',
  admission,
  qualification,
  sourceAudit,
}
const readiness =
  compileLivingFrameAi2dInterpolationReadiness(
    input,
  )

assert.equal(
  verifyLivingFrameAi2dInterpolationReadiness(
    readiness,
    input,
  ),
  true,
)
assert.deepEqual(
  readiness.toonCrafterReadiness
    .resolvedEvidence,
  [
    'exact_source_commit_and_source_archive_digest',
  ],
)
assert.equal(
  readiness.toonCrafterReadiness
    .openGateCount,
  13,
)
assert.equal(
  readiness.toonCrafterReadiness
    .openEvidence.length,
  13,
)
assert.equal(
  readiness.rifeReadiness
    .openGateCount,
  13,
)
assert.equal(
  readiness.rifeReadiness
    .blockedUntilUnderlyingMotionProfessionallyAccepted,
  true,
)
assert.equal(
  readiness.toonCrafterHardwarePolicy
    .singleL4RouteAssumedAdequate,
  false,
)
assert.equal(
  readiness.toonCrafterHardwarePolicy
    .selectedRuntimeRoute,
  'none',
)
assert.deepEqual(
  readiness.toonCrafterHardwarePolicy
    .allowedNextQualificationRoutes,
  [
    'memory_reduced_route_only_if_same_professional_visual_bar_passes',
    'owner_approved_larger_gpu_route',
  ],
)
assert.equal(
  readiness.currentInterpolationDisposition,
  'disabled_pending_qualification_and_private_visual_evidence',
)
assert.equal(
  readiness.sequencingPolicy
    .acceptedKeyposesDoNotProveInterpolationQuality,
  true,
)

assert.throws(
  () =>
    compileLivingFrameAi2dInterpolationReadiness({
      ...input,
      admission: {
        ...admission,
        admissionDigestSha256:
          '0'.repeat(64),
      },
    }),
  /readiness input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameAi2dInterpolationReadiness({
      ...input,
      qualification: {
        ...qualification,
        candidates:
          qualification.candidates.map(
            (candidate, order) => order === 0
              ? {
                ...candidate,
                runtimeExecuted:
                  true as false,
              }
              : candidate,
          ),
      },
    }),
  /readiness input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameAi2dInterpolationReadiness({
      ...input,
      sourceAudit: {
        ...sourceAudit,
        auditDigestSha256:
          'f'.repeat(64),
      },
    }),
  /readiness input is invalid/,
)
assert.throws(
  () =>
    compileLivingFrameAi2dInterpolationReadiness({
      ...input,
      callerHardwareChoice: 'single_l4',
    } as unknown as typeof input),
  /readiness input is invalid/,
)
assert.equal(
  verifyLivingFrameAi2dInterpolationReadiness({
    ...readiness,
    toonCrafterHardwarePolicy: {
      ...readiness.toonCrafterHardwarePolicy,
      singleL4RouteAssumedAdequate:
        true,
    },
  }, input),
  false,
)
assert.equal(readiness.operationRegistered, false)
assert.equal(readiness.dispatchGranted, false)
assert.equal(readiness.runtimeExecuted, false)
assert.equal(readiness.assetCreated, false)
assert.equal(readiness.canonicalQaApproved, false)
assert.equal(readiness.productionReady, false)

console.log(JSON.stringify({
  smoke:
    'living_frame_ai_2d_interpolation_readiness',
  status: 'passed_source_only',
  resolvedToonCrafterGateCount:
    readiness.toonCrafterReadiness
      .resolvedEvidence.length,
  openToonCrafterGateCount:
    readiness.toonCrafterReadiness
      .openGateCount,
  openRifeGateCount:
    readiness.rifeReadiness
      .openGateCount,
  singleL4RouteAssumedAdequate:
    readiness.toonCrafterHardwarePolicy
      .singleL4RouteAssumedAdequate,
  selectedRuntimeRoute:
    readiness.toonCrafterHardwarePolicy
      .selectedRuntimeRoute,
  allowedNextQualificationRoutes:
    readiness.toonCrafterHardwarePolicy
      .allowedNextQualificationRoutes,
  currentInterpolationDisposition:
    readiness.currentInterpolationDisposition,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))

function transitionFixture():
LivingFrameCompleteCharacterInterpolationTransitionUnit {
  const draft = {
    order: 0,
    transitionUnitId:
      'admission.airship.v1.transition.0',
    fromKeypose: {
      keyposeUnitId:
        'keypose.airship.start',
      role: 'start' as const,
      frame: 0,
      reviewId:
        'review.airship.start.v1',
      reviewDigestSha256:
        '1'.repeat(64),
      privateArtifactId:
        'artifact.airship.start.v1',
      privateArtifactSha256:
        '2'.repeat(64),
      privateObjectIdentityHash:
        '3'.repeat(64),
    },
    toKeypose: {
      keyposeUnitId:
        'keypose.airship.anticipation',
      role: 'anticipation' as const,
      frame: 5,
      reviewId:
        'review.airship.anticipation.v1',
      reviewDigestSha256:
        '4'.repeat(64),
      privateArtifactId:
        'artifact.airship.anticipation.v1',
      privateArtifactSha256:
        '5'.repeat(64),
      privateObjectIdentityHash:
        '6'.repeat(64),
    },
    requestedMotionSpanFrames: 5,
    actionTransitionBinding: {
      fromActionPhaseId:
        'phase.airship.start',
      toActionPhaseId:
        'phase.airship.anticipation',
      fromBodyMechanicIntent:
        'Keep the complete character balanced while preserving both hands on the spyglass.',
      toBodyMechanicIntent:
        'Lift the elbows and rotate the torso before the spyglass reaches the eye.',
      fromPropConstraint:
        'maintain_prop_contact' as const,
      toPropConstraint:
        'maintain_prop_contact' as const,
      motionCurve:
        'restrained_ease' as const,
      choreographyTransitionDigestSha256:
        '7'.repeat(64),
    },
    route: {
      proposedToolId: 'tooncrafter' as const,
      proposedOperationId:
        'tool.tooncrafter.interpolate_accepted_character_keyposes.v1' as const,
      acceptedCompleteKeyposeInputsOnly:
        true as const,
      serverOwnedSeedRequired:
        true as const,
      serverDerivedMotionPromptRequired:
        true as const,
      callerSeedPromptModelDimensionsPathsUrlsBytesCredentialsCommandsOrEnvironmentAllowed:
        false as const,
      oneAttemptOnePrivateCandidateOutput:
        true as const,
      qualifiedFrameCapacityMustCoverRequestedSpan:
        true as const,
    },
    outputPolicy: {
      outputClass:
        'private_interpolated_character_motion_candidate' as const,
      alphaOrTransparencyAssumed:
        false as const,
      anatomyIdentityOrAttachmentRepairClaimAllowed:
        false as const,
      finalCanvasClaimAllowed:
        false as const,
      remotionOwnsFinalCanvas: true as const,
    },
  }
  return {
    ...draft,
    transitionUnitDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function admissionFixture(
  qualificationDigestSha256: string,
): LivingFrameCompleteCharacterInterpolationAdmission {
  const draft:
    LivingFrameCompleteCharacterInterpolationAdmissionDraft = {
      contractVersion:
        'living-frame-complete-character-interpolation-admission-v2',
      resultClass:
        'server_derived_non_executable_accepted_keypose_interpolation_admission_candidate',
      admissionState:
        'source_only_candidate_blocked_pending_tooncrafter_release_and_private_runtime',
      admissionId:
        'admission.airship.accepted-keyposes.v1',
      canonicalScope: {
        workspaceId:
          'workspace.internal.living-frame',
        projectId:
          'project.internal.ai-2d-feasibility',
        editSessionId:
          'edit.internal.airship-readiness',
        sceneId:
          'scene.airship.raise-spyglass',
        componentId:
          'character.airship.navigator',
      },
      sourceBindings: {
        approvedSnapshotId:
          'snapshot.airship.v1',
        approvedSnapshotHashSha256:
          '8'.repeat(64),
        selectedSceneBindingDigestSha256:
          '9'.repeat(64),
        feasibilitySprintId:
          'sprint.ai-2d.v1',
        feasibilitySprintVersion:
          'living-frame-ai-2d-feasibility-sprint-v1',
        feasibilitySprintDigestSha256:
          'a'.repeat(64),
        fixtureId:
          'fixture.airship.prop.v1',
        fixtureDigestSha256:
          'b'.repeat(64),
        keyposePlanId:
          'plan.airship.keyposes.v2',
        keyposePlanDigestSha256:
          'c'.repeat(64),
        actionChoreographyDigestSha256:
          'd'.repeat(64),
        authoritativeActionTimingDigestSha256:
          'e'.repeat(64),
        keyposeReviewSetId:
          'review-set.airship.v1',
        keyposeReviewSetDigestSha256:
          'f'.repeat(64),
        interpolationQualificationVersion:
          'living-frame-ai-2d-interpolation-qualification-v1',
        interpolationQualificationDigestSha256:
          qualificationDigestSha256,
        authoritativeKeyposeTimingArtifactId:
          'timing.airship.keyposes.v1',
        authoritativeKeyposeTimingDigestSha256:
          '1'.repeat(64),
        confirmedOutputFrameDigestSha256:
          '2'.repeat(64),
        styleProfileDigestSha256:
          '3'.repeat(64),
      },
      authoritativeKeyposeTimingRef: {
        sourceOwner: 'StoryTiming',
        artifactId:
          'timing.airship.keyposes.v1',
        version: 1,
        digestSha256: '1'.repeat(64),
        sourceActionTimingArtifactId:
          'timing.airship.action.v1',
        sourceActionTimingDigestSha256:
          'e'.repeat(64),
        masterTimingPlanId:
          'master-timing.airship.v1',
        masterTimingDigestSha256:
          '4'.repeat(64),
        segmentId:
          'segment.airship.action',
        keyposes: [
          {
            keyposeUnitId:
              'keypose.airship.start',
            role: 'start',
            frame: 0,
          },
          {
            keyposeUnitId:
              'keypose.airship.anticipation',
            role: 'anticipation',
            frame: 5,
          },
        ],
      },
      transitionUnits: [
        transitionFixture(),
      ],
      sequencingPolicy: {
        everyInputKeyposeProfessionallyAccepted:
          true,
        actionSpecificKeyposeSelectionRevalidated:
          true,
        authoritativeActionTimingRevalidated:
          true,
        genericOrEvenlySpacedDefaultTimingForbidden:
          true,
        transitionCountEqualsKeyposeCountMinusOne:
          true,
        interpolationCannotBeginUntilToonCrafterQualificationReleased:
          true,
        eachMotionOutputRequiresTechnicalQaAndActualVisualInspection:
          true,
        rifeBlockedUntilUnderlyingMotionAccepted:
          true,
        temporalMaskAndAlphaRequiredBeforeRemotionWhenIsolationNeeded:
          true,
        remotionBlockedUntilRequiredMotionAndMaskAssetsAccepted:
          true,
        interpolationFailureReturnsToAcceptedStillOrRestrainedMotion:
          true,
      },
      openGateCodes: [
        'tooncrafter_exact_source_model_license_and_runtime_release_required',
        'tooncrafter_qualified_frame_capacity_required',
        'approved_interpolation_work_item_and_planned_asset_entry_required',
        'private_interpolation_request_and_single_attempt_lease_required',
        'private_output_persistence_reread_and_technical_qa_required',
        'interpolated_motion_professional_visual_acceptance_required',
        'temporal_mask_and_alpha_required_when_isolation_needed',
        'remotion_final_composition_and_visual_acceptance_required',
      ],
      containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
        false,
      authorityBoundary: {
        masterTimingAuthority: false,
        registryAuthority: false,
        operationAuthority: false,
        providerAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        assetManifestAuthority: false,
        qaApprovalAuthority: false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return {
    ...draft,
    admissionDigestSha256:
      sha256AuthorityValue(draft),
  }
}
