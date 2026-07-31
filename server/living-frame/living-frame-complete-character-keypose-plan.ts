import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION,
  type LivingFrameCompleteCharacterKeyposeInput,
  type LivingFrameCompleteCharacterKeyposePlan,
  type LivingFrameCompleteCharacterKeyposePlanDraft,
  type LivingFrameCompleteCharacterKeyposeRole,
  type LivingFrameCompleteCharacterKeyposeUnit,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import type {
  LivingFrameAi2dCharacterMotionStrategyRecord,
} from '../../src/types/living-frame-ai-2d-character-motion'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameAi2dCharacterMotionStrategy,
} from './living-frame-ai-2d-character-motion'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export interface CreateLivingFrameCompleteCharacterKeyposePlanInput {
  readonly planId: string
  readonly strategy:
    LivingFrameAi2dCharacterMotionStrategyRecord
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings:
    Omit<
      LivingFrameCompleteCharacterKeyposePlanDraft['sourceBindings'],
      | 'motionStrategyVersion'
      | 'motionStrategyDigestSha256'
    >
  readonly keyposes:
    readonly LivingFrameCompleteCharacterKeyposeInput[]
}

export function compileLivingFrameCompleteCharacterKeyposePlan(
  input:
    CreateLivingFrameCompleteCharacterKeyposePlanInput,
): LivingFrameCompleteCharacterKeyposePlan {
  assertInput(input)
  if (
    !verifyLivingFrameAi2dCharacterMotionStrategy(
      input.strategy,
    )
    || input.strategy.decision
      .selectedStrategy !==
        'ai_2d_complete_keyposes'
    || input.strategy.decision
      .strategyState !==
        'source_only_ai_2d_feasibility_candidate'
    || input.strategy.decision
      .completeKeyposeCount !==
        input.keyposes.length
    || input.strategy.evidence.sceneId !==
      input.canonicalScope.sceneId
    || input.strategy.evidence.componentId !==
      input.canonicalScope.componentId
    || input.strategy.evidence.sourceArtifactId !==
      input.sourceBindings
        .completeCharacterSourceArtifactId
  ) {
    throw new Error(
      'Living Frame complete-character keypose strategy lineage is invalid.',
    )
  }
  const roles = expectedRoles(
    input.keyposes.length,
  )
  const keyposeUnits =
    input.keyposes.map(
      (keypose, order) => {
        if (
          keypose.order !== order
          || keypose.role !== roles[order]
        ) {
          throw new Error(
            'Living Frame complete-character keypose order or role is invalid.',
          )
        }
        return compileUnit(
          input,
          keypose,
        )
      },
    )
  const draft:
    LivingFrameCompleteCharacterKeyposePlanDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_VERSION,
      resultClass:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PLAN_CLASS,
      planState:
        'source_only_complete_keypose_plan_runtime_and_visual_qa_pending',
      planId: input.planId,
      canonicalScope:
        structuredClone(
          input.canonicalScope,
        ),
      sourceBindings: {
        motionStrategyVersion:
          input.strategy.contractVersion,
        motionStrategyDigestSha256:
          input.strategy
            .strategyDigestSha256,
        ...structuredClone(
          input.sourceBindings,
        ),
      },
      selectedStrategy:
        'ai_2d_complete_keyposes',
      keyposeUnits,
      sequencePolicy: {
        keyposeCount:
          input.keyposes.length as 3 | 4,
        everyPoseIsCompleteCharacter:
          true,
        everyPoseRequiresProfessionalVisualAcceptance:
          true,
        interpolationBlockedUntilEveryPoseAccepted:
          true,
        independentPerFrameGenerationForbidden:
          true,
        toonCrafterEvaluationMayBegin:
          false,
        rifeEvaluationMayBegin: false,
        remotionFinalCompositionMayBegin:
          false,
      },
      openGateCodes: [
        'qualified_comfyui_complete_keypose_runtime_required',
        'gpt_image_2_source_or_repair_route_approval_required_when_used',
        'create_only_private_keypose_persistence_required',
        'every_complete_keypose_professional_visual_acceptance_required',
        'tooncrafter_interpolation_qualification_required',
        'rendered_motion_professional_visual_acceptance_required',
        'optional_rife_cadence_qualification_required',
        'remotion_final_composition_required',
      ],
      authorityBoundary: {
        privatePlanningEvidenceAuthority:
          true,
        providerAuthority: false,
        operationRegistryAuthority:
          false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        assetManifestAuthority:
          false,
        qaApprovalAuthority: false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      containsRawPromptChatTranscriptPathUrlModelBytesCredentialCommandOrEnvironment:
        false,
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
    planDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCompleteCharacterKeyposePlan(
  value: unknown,
  input:
    CreateLivingFrameCompleteCharacterKeyposePlanInput,
): value is LivingFrameCompleteCharacterKeyposePlan {
  if (
    !isRecord(value)
    || typeof value.planDigestSha256
      !== 'string'
  ) return false
  const {
    planDigestSha256,
    ...draft
  } = value
  try {
    const expected =
      compileLivingFrameCompleteCharacterKeyposePlan(
        input,
      )
    return planDigestSha256
      === sha256AuthorityValue(draft)
      && stableAuthorityStringify(
        value,
      ) === stableAuthorityStringify(
        expected,
      )
  } catch {
    return false
  }
}

function compileUnit(
  input:
    CreateLivingFrameCompleteCharacterKeyposePlanInput,
  keypose:
    LivingFrameCompleteCharacterKeyposeInput,
): LivingFrameCompleteCharacterKeyposeUnit {
  const draft = {
    order: keypose.order,
    role: keypose.role,
    keyposeUnitId:
      `${input.planId}.${keypose.role}`,
    sourceArtifactId:
      input.sourceBindings
        .completeCharacterSourceArtifactId,
    styleReferenceArtifactId:
      input.sourceBindings
        .styleReferenceArtifactId,
    poseControlArtifactId:
      keypose.poseControlArtifactId,
    poseControlDigestSha256:
      keypose.poseControlDigestSha256,
    approvedWorkItemId:
      keypose.approvedWorkItemId,
    plannedAssetManifestEntryId:
      keypose
        .plannedAssetManifestEntryId,
    outputKey: keypose.outputKey,
    actionDescription:
      keypose.actionDescription,
    generationRoute: {
      optionalDesignOrRepairProviderRoute:
        'gpt_image_2' as const,
      controlledPoseHostToolId:
        'comfyui' as const,
      controlledPoseOperationId:
        'tool.comfyui.generate_controlled_image.v1' as const,
      poseControlRequired: true as const,
      completeCharacterReferenceRequired:
        true as const,
      styleReferenceRequired: true as const,
      optionalLoRaAllowed: true as const,
      genericIpAdapterAllowed: true as const,
      controlNetAllowed: true as const,
      faceIdOrInsightFaceAllowed:
        false as const,
      oneSupervisedGpuAttempt: true as const,
      exactModelRoleCount: 5 as const,
    },
    generationCanvas: {
      canvasClass:
        'isolated_complete_character_square_1024' as const,
      widthPixels: 1024 as const,
      heightPixels: 1024 as const,
      callerSelectedDimensionsAllowed:
        false as const,
      finalCanvasCreatedByGenerationTool:
        false as const,
    },
    characterIntegrity: {
      completeCharacterRequired:
        true as const,
      detachedLimbOutputForbidden:
        true as const,
      visiblePuppetJointOutputForbidden:
        true as const,
      identityCostumeBodyAndPropContinuityRequired:
        true as const,
      correctHandsAndLimbCountRequired:
        true as const,
      secondaryPartsMustRemainAttached:
        true as const,
    },
    privateOutput: {
      contentType: 'image/png' as const,
      outputCount: 1 as const,
      privateArtifactRequired:
        true as const,
      byteFreePlan: true as const,
      professionalVisualReviewDisposition:
        'pending' as const,
    },
    operationRegistered: false as const,
    dispatched: false as const,
    runtimeExecuted: false as const,
    assetCreated: false as const,
    qaApproved: false as const,
  }
  return deepFreeze({
    ...draft,
    keyposeUnitDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertInput(
  input:
    CreateLivingFrameCompleteCharacterKeyposePlanInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(input.planId)
    || !isRecord(input.canonicalScope)
    || Object.values(
      input.canonicalScope,
    ).some(
      (value) =>
        typeof value !== 'string'
        || !SAFE_ID.test(value),
    )
    || !isRecord(input.sourceBindings)
    || !Array.isArray(input.keyposes)
    || ![
      3,
      4,
    ].includes(input.keyposes.length)
    || !Object.values(
      input.sourceBindings,
    ).every(
      (value) =>
        typeof value === 'string',
    )
    || ![
      input.sourceBindings
        .approvedSnapshotHashSha256,
      input.sourceBindings
        .selectedSceneBindingDigestSha256,
      input.sourceBindings
        .currentMasterTimingDigestSha256,
      input.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
      input.sourceBindings
        .completeCharacterSourceDigestSha256,
      input.sourceBindings
        .styleReferenceDigestSha256,
    ].every(
      (digest) => SHA256.test(digest),
    )
    || ![
      input.sourceBindings
        .approvedSnapshotId,
      input.sourceBindings
        .completeCharacterSourceArtifactId,
      input.sourceBindings
        .styleReferenceArtifactId,
    ].every(
      (value) => SAFE_ID.test(value),
    )
    || input.keyposes.some(
      (keypose) =>
        !Number.isSafeInteger(
          keypose.order,
        )
        || !SAFE_ID.test(
          keypose.poseControlArtifactId,
        )
        || !SHA256.test(
          keypose.poseControlDigestSha256,
        )
        || !SAFE_ID.test(
          keypose.approvedWorkItemId,
        )
        || !SAFE_ID.test(
          keypose
            .plannedAssetManifestEntryId,
        )
        || !SAFE_ID.test(
          keypose.outputKey,
        )
        || typeof keypose
          .actionDescription !== 'string'
        || keypose.actionDescription
          .length < 8
        || keypose.actionDescription
          .length > 320
        || UNSAFE_TEXT.test(
          keypose.actionDescription,
        ),
    )
  ) {
    throw new Error(
      'Living Frame complete-character keypose plan input is invalid.',
    )
  }
}

function expectedRoles(
  count: number,
): readonly LivingFrameCompleteCharacterKeyposeRole[] {
  if (count === 3) {
    return [
      'start',
      'action_apex',
      'settle',
    ]
  }
  if (count === 4) {
    return [
      'start',
      'anticipation',
      'action_apex',
      'settle',
    ]
  }
  throw new Error(
    'Living Frame complete-character keypose count is invalid.',
  )
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
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
