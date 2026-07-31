import {
  LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_VERSION,
  type LivingFrameAuthoritativeKeyposeTimingRef,
  type LivingFrameCompleteCharacterInterpolationAdmission,
  type LivingFrameCompleteCharacterInterpolationAdmissionDraft,
  type LivingFrameCompleteCharacterInterpolationTransitionUnit,
} from '../../src/types/living-frame-complete-character-interpolation-admission'
import type {
  LivingFrameAi2dFeasibilitySprint,
} from '../../src/types/living-frame-ai-2d-feasibility-sprint'
import type {
  LivingFrameAi2dInterpolationQualification,
} from '../../src/types/living-frame-ai-2d-interpolation-qualification'
import type {
  LivingFrameCompleteCharacterKeyposeReviewSet,
} from '../../src/types/living-frame-complete-character-keypose-review'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CompileLivingFrameAi2dFeasibilitySprintInput,
  verifyLivingFrameAi2dFeasibilitySprint,
} from './living-frame-ai-2d-feasibility-sprint'
import {
  verifyLivingFrameAi2dInterpolationQualification,
} from './living-frame-ai-2d-interpolation-qualification'
import {
  type CompileLivingFrameCompleteCharacterKeyposeReviewSetInput,
  verifyLivingFrameCompleteCharacterKeyposeReviewSet,
} from './living-frame-complete-character-keypose-review'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_GENERATED_ID_BASE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface CompileLivingFrameCompleteCharacterInterpolationAdmissionInput {
  readonly admissionId: string
  readonly sprint:
    LivingFrameAi2dFeasibilitySprint
  readonly sprintInput:
    CompileLivingFrameAi2dFeasibilitySprintInput
  readonly fixtureId: string
  readonly reviewSet:
    LivingFrameCompleteCharacterKeyposeReviewSet
  readonly reviewSetInput:
    CompileLivingFrameCompleteCharacterKeyposeReviewSetInput
  readonly qualification:
    LivingFrameAi2dInterpolationQualification
  readonly authoritativeKeyposeTimingRef:
    LivingFrameAuthoritativeKeyposeTimingRef
}

export function compileLivingFrameCompleteCharacterInterpolationAdmission(
  input:
    CompileLivingFrameCompleteCharacterInterpolationAdmissionInput,
): LivingFrameCompleteCharacterInterpolationAdmission {
  assertInput(input)
  const fixtureIndex = input.sprint.fixturePlans.findIndex(
    (fixture) => fixture.fixtureId === input.fixtureId,
  )
  const fixture = input.sprint.fixturePlans[fixtureIndex]!
  const transitionUnits = compileTransitionUnits(
    input,
  )
  const draft:
    LivingFrameCompleteCharacterInterpolationAdmissionDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_VERSION,
      resultClass:
        LIVING_FRAME_COMPLETE_CHARACTER_INTERPOLATION_ADMISSION_CLASS,
      admissionState:
        'source_only_candidate_blocked_pending_tooncrafter_release_and_private_runtime',
      admissionId: input.admissionId,
      canonicalScope: {
        workspaceId:
          input.reviewSetInput.keyposePlan
            .canonicalScope.workspaceId,
        projectId:
          input.reviewSetInput.keyposePlan
            .canonicalScope.projectId,
        editSessionId:
          input.reviewSetInput.keyposePlan
            .canonicalScope.editSessionId,
        sceneId: fixture.sceneId,
        componentId: fixture.componentId,
      },
      sourceBindings: {
        approvedSnapshotId:
          input.reviewSetInput.keyposePlan
            .sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.reviewSetInput.keyposePlan
            .sourceBindings
            .approvedSnapshotHashSha256,
        selectedSceneBindingDigestSha256:
          input.reviewSetInput.keyposePlan
            .sourceBindings
            .selectedSceneBindingDigestSha256,
        feasibilitySprintId:
          input.sprint.sprintId,
        feasibilitySprintVersion:
          input.sprint.contractVersion,
        feasibilitySprintDigestSha256:
          input.sprint.sprintDigestSha256,
        fixtureId: fixture.fixtureId,
        fixtureDigestSha256:
          fixture.fixtureDigestSha256,
        keyposePlanId:
          input.reviewSet
            .keyposePlanRef.planId,
        keyposePlanDigestSha256:
          input.reviewSet
            .keyposePlanRef.digestSha256,
        keyposeReviewSetId:
          input.reviewSet.setId,
        keyposeReviewSetDigestSha256:
          input.reviewSet
            .reviewSetDigestSha256,
        interpolationQualificationVersion:
          input.qualification
            .contractVersion,
        interpolationQualificationDigestSha256:
          input.qualification
            .qualificationDigestSha256,
        authoritativeKeyposeTimingArtifactId:
          input.authoritativeKeyposeTimingRef
            .artifactId,
        authoritativeKeyposeTimingDigestSha256:
          input.authoritativeKeyposeTimingRef
            .digestSha256,
        confirmedOutputFrameDigestSha256:
          fixture.confirmedOutputFrameRef
            .digestSha256,
        styleProfileDigestSha256:
          fixture.styleProfileRef
            .digestSha256,
      },
      authoritativeKeyposeTimingRef:
        structuredClone(
          input.authoritativeKeyposeTimingRef,
        ),
      transitionUnits,
      sequencingPolicy: {
        everyInputKeyposeProfessionallyAccepted:
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
  return deepFreeze({
    ...draft,
    admissionDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCompleteCharacterInterpolationAdmission(
  value: unknown,
  input:
    CompileLivingFrameCompleteCharacterInterpolationAdmissionInput,
): value is LivingFrameCompleteCharacterInterpolationAdmission {
  try {
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(
        compileLivingFrameCompleteCharacterInterpolationAdmission(
          input,
        ),
      )
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameCompleteCharacterInterpolationAdmissionInput,
): void {
  if (
    !hasExactKeys(input, [
      'admissionId',
      'sprint',
      'sprintInput',
      'fixtureId',
      'reviewSet',
      'reviewSetInput',
      'qualification',
      'authoritativeKeyposeTimingRef',
    ])
    || !SAFE_GENERATED_ID_BASE.test(
      input.admissionId,
    )
    || !SAFE_ID.test(input.fixtureId)
    || !verifyLivingFrameAi2dFeasibilitySprint(
      input.sprint,
      input.sprintInput,
    )
    || !verifyLivingFrameCompleteCharacterKeyposeReviewSet(
      input.reviewSet,
      input.reviewSetInput,
    )
    || !verifyLivingFrameAi2dInterpolationQualification(
      input.qualification,
    )
    || input.qualification.state !==
      'source_reviewed_evaluation_candidates_runtime_blocked'
    || input.qualification.candidates[0]
      ?.proposedToolId !== 'tooncrafter'
    || input.qualification.candidates[0]
      ?.operationRegistered !== false
    || input.qualification.candidates[0]
      ?.runtimeExecuted !== false
    || input.reviewSet.everyPoseAccepted !==
      true
    || input.reviewSet
      .interpolationAdmissionCandidateMayBeMaterialized !==
        true
  ) fail()
  const fixtureIndex = input.sprint.fixturePlans.findIndex(
    (fixture) => fixture.fixtureId === input.fixtureId,
  )
  const fixture = input.sprint.fixturePlans[fixtureIndex]
  const fixtureInput = input.sprintInput.fixtures[fixtureIndex]
  if (
    fixture == null
    || fixtureInput == null
    || fixture.fixtureDisposition !==
      'pending_private_visual_evidence'
    || fixture.keyposePlanRef.planId !==
      input.reviewSet.keyposePlanRef.planId
    || fixture.keyposePlanRef.digestSha256 !==
      input.reviewSet.keyposePlanRef.digestSha256
    || fixtureInput.keyposePlan.planId !==
      input.reviewSetInput.keyposePlan.planId
    || fixtureInput.keyposePlan.planDigestSha256 !==
      input.reviewSetInput.keyposePlan
        .planDigestSha256
    || fixture.sceneId !==
      input.reviewSetInput.keyposePlan
        .canonicalScope.sceneId
    || fixture.componentId !==
      input.reviewSetInput.keyposePlan
        .canonicalScope.componentId
    || !isValidTimingRef(
      input.authoritativeKeyposeTimingRef,
      input.reviewSetInput.keyposePlan
        .keyposeUnits,
      fixture.masterTimingRef,
    )
  ) fail()
}

function compileTransitionUnits(
  input:
    CompileLivingFrameCompleteCharacterInterpolationAdmissionInput,
): readonly LivingFrameCompleteCharacterInterpolationTransitionUnit[] {
  return input.reviewSet.reviews.slice(0, -1).map(
    (fromReview, order) => {
      const toReview = input.reviewSet.reviews[order + 1]!
      const fromTiming = input.authoritativeKeyposeTimingRef
        .keyposes[order]!
      const toTiming = input.authoritativeKeyposeTimingRef
        .keyposes[order + 1]!
      const draft = {
        order,
        transitionUnitId:
          `${input.admissionId}.transition.${order}`,
        fromKeypose: keyposeRef(
          fromReview,
          fromTiming.frame,
        ),
        toKeypose: keyposeRef(
          toReview,
          toTiming.frame,
        ),
        requestedMotionSpanFrames:
          toTiming.frame - fromTiming.frame,
        route: {
          proposedToolId:
            'tooncrafter' as const,
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
          remotionOwnsFinalCanvas:
            true as const,
        },
      }
      return deepFreeze({
        ...draft,
        transitionUnitDigestSha256:
          sha256AuthorityValue(draft),
      })
    },
  )
}

function keyposeRef(
  review:
    LivingFrameCompleteCharacterKeyposeReviewSet['reviews'][number],
  frame: number,
) {
  return {
    keyposeUnitId:
      review.keyposeUnitRef.unitId,
    role: review.keyposeUnitRef.role,
    frame,
    reviewId: review.reviewId,
    reviewDigestSha256:
      review.reviewDigestSha256,
    privateArtifactId:
      review.privateArtifactRef
        .artifactId,
    privateArtifactSha256:
      review.privateArtifactRef.sha256,
    privateObjectIdentityHash:
      review.privateArtifactRef
        .privateObjectIdentityHash,
  }
}

function isValidTimingRef(
  value: unknown,
  units: readonly {
    readonly keyposeUnitId: string
    readonly role: string
  }[],
  masterTimingRef: {
    readonly planId: string
    readonly segmentId: string
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly digestSha256: string
  },
): value is LivingFrameAuthoritativeKeyposeTimingRef {
  if (
    !hasExactKeys(value, [
      'sourceOwner',
      'artifactId',
      'version',
      'digestSha256',
      'masterTimingPlanId',
      'masterTimingDigestSha256',
      'segmentId',
      'keyposes',
    ])
    || value.sourceOwner !== 'StoryTiming'
    || typeof value.artifactId !== 'string'
    || !SAFE_ID.test(value.artifactId)
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.digestSha256 !== 'string'
    || !SHA256.test(value.digestSha256)
    || value.masterTimingPlanId !==
      masterTimingRef.planId
    || value.masterTimingDigestSha256 !==
      masterTimingRef.digestSha256
    || value.segmentId !==
      masterTimingRef.segmentId
    || !Array.isArray(value.keyposes)
    || value.keyposes.length !== units.length
  ) return false
  const {
    digestSha256,
    ...contentAddressedTiming
  } = value
  if (
    sha256AuthorityValue(
      contentAddressedTiming,
    ) !== digestSha256
  ) return false
  let previousFrame = -1
  return value.keyposes.every(
    (entry, order) => {
      const unit = units[order]
      if (
        unit == null
        || !hasExactKeys(entry, [
          'keyposeUnitId',
          'role',
          'frame',
        ])
        || entry.keyposeUnitId !==
          unit.keyposeUnitId
        || entry.role !== unit.role
        || !Number.isSafeInteger(
          entry.frame,
        )
        || Number(entry.frame) <
          masterTimingRef.startFrame
        || Number(entry.frame) >=
          masterTimingRef.endFrameExclusive
        || Number(entry.frame) <=
          previousFrame
      ) return false
      previousFrame = Number(entry.frame)
      return true
    },
  )
}

function hasExactKeys(
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) return false
  return stableAuthorityStringify(
    Object.keys(value).sort(),
  ) === stableAuthorityStringify(
    [...expected].sort(),
  )
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function fail(): never {
  throw new Error(
    'Living Frame complete-character interpolation admission input is invalid.',
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(nested)
  return value
}
