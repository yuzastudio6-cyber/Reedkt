import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_STATE,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_VERSION,
  type LivingFrameCompleteCharacterKeyposeControlledImageBinding,
  type LivingFrameCompleteCharacterKeyposeControlledImageBindingAuthority,
  type LivingFrameCompleteCharacterKeyposeControlledImageBindingDraft,
  type LivingFrameCompleteCharacterKeyposeControlledImageBindingIssue,
  type LivingFrameCompleteCharacterKeyposeControlledImageBindingIssueCode,
  type LivingFrameCompleteCharacterKeyposeControlledImageBindingUnit,
} from '../../src/types/living-frame-complete-character-keypose-controlled-image-binding'
import type {
  LivingFrameCharacterControlledPreparation,
} from '../../src/types/living-frame-character-controlled-preparation'
import type {
  LivingFrameCompleteCharacterKeyposePlan,
} from '../../src/types/living-frame-complete-character-keypose-plan'
import type {
  LivingFrameMotionSubjectClassGate,
} from '../../src/types/living-frame-motion-subject-class-gate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameCharacterControlledPreparationInput,
  verifyLivingFrameCharacterControlledPreparation,
} from './living-frame-character-controlled-preparation'
import {
  type CreateLivingFrameCompleteCharacterKeyposePlanInput,
  verifyLivingFrameCompleteCharacterKeyposePlan,
} from './living-frame-complete-character-keypose-plan'
import {
  type CreateLivingFrameMotionSubjectClassGateInput,
  verifyLivingFrameMotionSubjectClassGate,
} from './living-frame-motion-subject-class-gate'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameCompleteCharacterKeyposeControlledImageBindingAuthority =
  deepFreeze({
    keyposeControlledImageBindingAuthority: true,
    actionChoreographyAuthority: false,
    storyTimingAuthority: false,
    selectedSceneAuthority: false,
    promptPlanningAuthority: false,
    promptMaterializationAuthority: false,
    modelSelectionAuthority: false,
    operationRegistryAuthority: false,
    workGraphMutationAuthority: false,
    approvedSnapshotAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    assetPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    actualCostAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput {
  readonly bindingId: string
  readonly keyposePlan:
    LivingFrameCompleteCharacterKeyposePlan
  readonly keyposePlanInput:
    CreateLivingFrameCompleteCharacterKeyposePlanInput
  readonly controlledPreparation:
    LivingFrameCharacterControlledPreparation
  readonly controlledPreparationInput:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly motionSubjectClassGate:
    LivingFrameMotionSubjectClassGate
  readonly motionSubjectClassGateInput:
    CreateLivingFrameMotionSubjectClassGateInput
}

export class LivingFrameCompleteCharacterKeyposeControlledImageBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameCompleteCharacterKeyposeControlledImageBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameCompleteCharacterKeyposeControlledImageBindingIssue[],
  ) {
    super(
      'Living Frame complete-character action keypose controlled-image binding failed.',
    )
    this.name =
      'LivingFrameCompleteCharacterKeyposeControlledImageBindingError'
    this.issues = issues
  }
}

export async function compileLivingFrameCompleteCharacterKeyposeControlledImageBinding(
  input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
): Promise<LivingFrameCompleteCharacterKeyposeControlledImageBinding> {
  assertInput(input)
  if (!verifyLivingFrameCompleteCharacterKeyposePlan(
    input.keyposePlan,
    input.keyposePlanInput,
  )) throw invalid(
    'keypose_plan_invalid',
    '$.keyposePlan',
  )
  if (!await verifyLivingFrameCharacterControlledPreparation(
    input.controlledPreparation,
    input.controlledPreparationInput,
  )) throw invalid(
    'controlled_preparation_invalid',
    '$.controlledPreparation',
  )
  if (!verifyLivingFrameMotionSubjectClassGate(
    input.motionSubjectClassGate,
    input.motionSubjectClassGateInput,
  )) throw invalid(
    'subject_class_gate_invalid',
    '$.motionSubjectClassGate',
  )
  assertSourceLineage(input)
  const units = compileUnits(input)
  const count = units.length
  const draft:
    LivingFrameCompleteCharacterKeyposeControlledImageBindingDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_VERSION,
      resultClass:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_CLASS,
      bindingState:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_STATE,
      bindingId: input.bindingId,
      canonicalScope: {
        ...input.keyposePlan.canonicalScope,
      },
      sourceBindings: {
        keyposePlanVersion:
          input.keyposePlan.contractVersion,
        keyposePlanId:
          input.keyposePlan.planId,
        keyposePlanDigestSha256:
          input.keyposePlan.planDigestSha256,
        actionChoreographyDigestSha256:
          input.keyposePlan.sourceBindings
            .actionChoreographyDigestSha256,
        authoritativeActionTimingArtifactId:
          input.keyposePlan.sourceBindings
            .authoritativeActionTimingArtifactId,
        authoritativeActionTimingDigestSha256:
          input.keyposePlan.sourceBindings
            .authoritativeActionTimingDigestSha256,
        characterPreparationVersion:
          input.controlledPreparation.contractVersion,
        characterPreparationDigestSha256:
          input.controlledPreparation
            .preparationDigestSha256,
        characterRouteDecisionDigestSha256:
          input.controlledPreparation.sourceBindings
            .characterRouteDecisionDigestSha256,
        motionSubjectClassGateVersion:
          input.motionSubjectClassGate.contractVersion,
        motionSubjectClassGateId:
          input.motionSubjectClassGate.gateId,
        motionSubjectClassGateDigestSha256:
          input.motionSubjectClassGate.gateDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          input.controlledPreparation.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        approvedSnapshotId:
          input.controlledPreparation.sourceBindings
            .approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.controlledPreparation.sourceBindings
            .approvedSnapshotHashSha256,
        approvedWorkGraphDigestSha256:
          input.controlledPreparation.sourceBindings
            .approvedWorkGraphDigestSha256,
        currentMasterTimingDigestSha256:
          input.controlledPreparation.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          input.controlledPreparation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
      },
      bindingUnits: units,
      metrics: {
        keyposeUnitCount:
          count as 3 | 4,
        boundPreparationUnitCount: count,
        boundSelectedSceneRequestUnitCount: count,
        poseControlledUnitCount: count,
        referenceConditionedUnitCount: count,
        pendingPrivateActionConditioningUnitCount:
          count,
      },
      sequencingPolicy: {
        everyPlannedKeyposeHasExactlyOneApprovedControlledImageOutput:
          true,
        everyControlledImageOutputMapsToExactlyOnePlannedKeypose:
          true,
        exactActionOrderPreserved: true,
        storyTimingFramesReinterpreted: false,
        genericStartMiddleEndSubstitutionAllowed: false,
        sceneLevelConditioningMayReplaceActionConditioning:
          false,
        independentPerFrameGenerationAllowed: false,
        livingOrOrganicSubjectCompleteFrameAnimationOnly:
          true,
        livingOrOrganicSubjectPartBasedRiggingAllowed:
          false,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      keyposePlanRevalidated: true,
      controlledPreparationRevalidated: true,
      motionSubjectClassGateRevalidated: true,
      selectedSceneRequestRevalidatedThroughPreparation:
        true,
      privateActionConditioningReconciled: false,
      privatePromptMaterialized: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      actualCostReceiptCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertProjection(draft)
  return deepFreeze({
    ...draft,
    bindingDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding(
  value: unknown,
  input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_VERSION
      || value.resultClass !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_CLASS
      || value.bindingState !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_STATE
      || typeof value.bindingDigestSha256 !== 'string'
      || !SHA256.test(value.bindingDigestSha256)
    ) return false
    const {
      bindingDigestSha256,
      ...draft
    } = value
    if (
      bindingDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(
        await compileLivingFrameCompleteCharacterKeyposeControlledImageBinding(
          input,
        ),
      )
  } catch {
    return false
  }
}

function compileUnits(
  input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
): readonly LivingFrameCompleteCharacterKeyposeControlledImageBindingUnit[] {
  const keyposes = input.keyposePlan.keyposeUnits
  const preparationUnits =
    input.controlledPreparation.preparationUnits
  const requestUnits =
    input.controlledPreparationInput
      .selectedSceneRequest.requestUnits
  if (
    (keyposes.length !== 3 && keyposes.length !== 4)
    || preparationUnits.length !== keyposes.length
    || preparationUnits.some((unit) =>
      unit.purpose !==
        'generate_controlled_anchor_keypose')
  ) throw invalid(
    'unit_set_mismatch',
    '$.controlledPreparation.preparationUnits',
  )
  return deepFreeze(keyposes.map((keypose, order) => {
    const preparation = preparationUnits[order]
    if (!preparation) throw invalid(
      'unit_set_mismatch',
      `$.controlledPreparation.preparationUnits.${order}`,
    )
    const requestMatches = requestUnits.filter((unit) =>
      unit.requestUnitId ===
        preparation.selectedSceneRequestUnitId)
    if (requestMatches.length !== 1) throw invalid(
      'unit_set_mismatch',
      `$.controlledPreparation.preparationUnits.${order}.selectedSceneRequestUnitId`,
    )
    const request = requestMatches[0]!
    if (
      keypose.order !== order
      || preparation.order !== order
      || keypose.approvedWorkItemId !==
        preparation.approvedWorkItemId
      || keypose.plannedAssetManifestEntryId !==
        preparation.approvedPlannedAssetManifestEntryId
      || keypose.outputKey !== preparation.outputKey
      || request.approvedWorkItemId !==
        preparation.approvedWorkItemId
      || request.approvedWorkItemKey !==
        preparation.approvedWorkItemKey
      || request.approvedPlannedAssetManifestEntryId !==
        preparation.approvedPlannedAssetManifestEntryId
      || request.outputKey !== preparation.outputKey
      || request.requestUnitDigestSha256 !==
        preparation.selectedSceneRequestUnitDigestSha256
    ) throw invalid(
      'cross_keypose_work_item_or_output_substitution',
      `$.keyposePlan.keyposeUnits.${order}`,
    )
    if (
      !SAFE_ID.test(keypose.poseControlArtifactId)
      || !SHA256.test(keypose.poseControlDigestSha256)
      || request.controlPolicy
        .structureConditioningRequired !== true
      || request.controlPolicy
        .controlImagePreparedOutsideComfyUi !== true
    ) throw invalid(
      'pose_control_binding_invalid',
      `$.keyposePlan.keyposeUnits.${order}.poseControlArtifactId`,
    )
    if (
      request.controlPolicy
        .referenceConditioningRequired !== true
      || request.controlPolicy
        .referenceImageMustComeFromApprovedContinuityPack !== true
      || request.controlPolicy.genericIpAdapterOnly !== true
      || request.controlPolicy
        .faceIdOrUnapprovedIdentityAdapterAllowed !== false
      || preparation.graphProfile.graphFamily !==
        'controlled_sdxl_selected_scene_v1'
      || preparation.graphProfile
        .inGraphPreprocessorAllowed !== false
      || preparation.graphProfile
        .faceIdOrInsightFaceAllowed !== false
      || preparation.graphProfile
        .arbitrarySaveOrPreviewNodeAllowed !== false
      || preparation.graphProfile.websocketOutputOnly !== true
      || !preparation.graphProfile.nodeClasses.includes(
        'ControlNetApplyAdvanced',
      )
      || !preparation.graphProfile.nodeClasses.includes(
        'IPAdapterAdvanced',
      )
      || preparation.graphProfile.nodeClasses.at(-1) !==
        'SaveImageWebsocket'
    ) throw invalid(
      'controlled_graph_policy_invalid',
      `$.controlledPreparation.preparationUnits.${order}.graphProfile`,
    )
    if (
      preparation.generationCanvas.canvasClass !==
        'isolated_component_square_1024'
      || preparation.generationCanvas.widthPixels !== 1024
      || preparation.generationCanvas.heightPixels !== 1024
      || preparation.generationCanvas
        .callerSelectedDimensionsAllowed !== false
      || preparation.generationCanvas
        .finalCanvasCreatedByComfyUi !== false
    ) throw invalid(
      'generation_canvas_invalid',
      `$.controlledPreparation.preparationUnits.${order}.generationCanvas`,
    )
    return compileUnit({
      input,
      keypose,
      preparation,
      request,
      order,
    })
  }))
}

function compileUnit(input: {
  readonly input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput
  readonly keypose:
    LivingFrameCompleteCharacterKeyposePlan['keyposeUnits'][number]
  readonly preparation:
    LivingFrameCharacterControlledPreparation['preparationUnits'][number]
  readonly request:
    CreateLivingFrameCharacterControlledPreparationInput['selectedSceneRequest']['requestUnits'][number]
  readonly order: number
}): LivingFrameCompleteCharacterKeyposeControlledImageBindingUnit {
  const identity = {
    bindingId: input.input.bindingId,
    keyposeUnitDigestSha256:
      input.keypose.keyposeUnitDigestSha256,
    preparationUnitDigestSha256:
      input.preparation.preparationUnitDigestSha256,
    requestUnitDigestSha256:
      input.request.requestUnitDigestSha256,
  }
  const draft = {
    order: input.order,
    bindingUnitId:
      `lf-keypose-control.${sha256AuthorityValue(identity).slice(0, 40)}`,
    keyposeUnitId: input.keypose.keyposeUnitId,
    keyposeUnitDigestSha256:
      input.keypose.keyposeUnitDigestSha256,
    role: input.keypose.role,
    actionPhaseId: input.keypose.actionPhaseId,
    actionDescription:
      input.keypose.actionDescription,
    keyposeSelectionReason:
      input.keypose.keyposeSelectionReason,
    bodyMechanicIntent:
      input.keypose.bodyMechanicIntent,
    propConstraint: input.keypose.propConstraint,
    storyTimingFrame:
      input.keypose.storyTimingFrame,
    minimumHoldFrames:
      input.keypose.minimumHoldFrames,
    preparationUnitId:
      input.preparation.preparationUnitId,
    preparationUnitDigestSha256:
      input.preparation.preparationUnitDigestSha256,
    selectedSceneRequestUnitId:
      input.request.requestUnitId,
    selectedSceneRequestUnitDigestSha256:
      input.request.requestUnitDigestSha256,
    sceneId: input.preparation.sceneId,
    componentId: input.preparation.componentId,
    approvedWorkItemId:
      input.preparation.approvedWorkItemId,
    approvedWorkItemKey:
      input.preparation.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.preparation
        .approvedPlannedAssetManifestEntryId,
    outputKey: input.preparation.outputKey,
    poseControlArtifactRef: {
      artifactId:
        input.keypose.poseControlArtifactId,
      digestSha256:
        input.keypose.poseControlDigestSha256,
      preparedOutsideComfyUi: true,
      exactPoseForActionPhaseRequired: true,
      callerReplacementAllowed: false,
    },
    continuityReferenceRefs: {
      completeCharacterSourceArtifactId:
        input.input.keyposePlan.sourceBindings
          .completeCharacterSourceArtifactId,
      completeCharacterSourceDigestSha256:
        input.input.keyposePlan.sourceBindings
          .completeCharacterSourceDigestSha256,
      styleReferenceArtifactId:
        input.input.keyposePlan.sourceBindings
          .styleReferenceArtifactId,
      styleReferenceDigestSha256:
        input.input.keyposePlan.sourceBindings
          .styleReferenceDigestSha256,
      genericIpAdapterOnly: true,
      faceIdOrInsightFaceAllowed: false,
    },
    controlledGraphPolicy: {
      graphFamily:
        'controlled_sdxl_selected_scene_v1',
      canonicalToolId: 'comfyui',
      canonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      controlNetRequired: true,
      genericIpAdapterAndClipVisionRequired:
        true,
      optionalLoRaAllowed: true,
      inGraphPreprocessorAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
      exactModelRoleCount: 5,
      oneSupervisedGpuAttempt: true,
      oneImagePerAttempt: true,
    },
    generationCanvas: {
      canvasClass:
        'isolated_component_square_1024',
      widthPixels: 1024,
      heightPixels: 1024,
      confirmedOutputFrameExpectationDigestSha256:
        input.preparation.generationCanvas
          .confirmedOutputFrameExpectationDigestSha256,
      callerSelectedDimensionsAllowed: false,
      finalCanvasCreatedByComfyUi: false,
    },
    privateActionConditioningRequirement: {
      serverDerivedActionConditioningRequired: true,
      mustIncludeActionPhaseSemanticsBodyMechanicsAndPropConstraint:
        true,
      rawChatOrCallerPromptAllowed: false,
      selectedSceneConditioningAloneSufficient: false,
      privatePromptMaterializationMayProceedBeforeActionConditioningReconciled:
        false,
    },
    outputPolicy: {
      contentType: 'image/png',
      completeCharacterRequired: true,
      completeFramePoseCandidateRequired: true,
      partBasedLivingSubjectRiggingAllowed:
        false,
      detachedLimbOrVisiblePuppetJointAllowed:
        false,
      independentAnimationFrameGenerationAllowed:
        false,
      professionalVisualAcceptanceRequiredBeforeInterpolation:
        true,
      remotionOwnsFinalCanvas: true,
    },
    operationRegistered: false,
    dispatched: false,
    runtimeExecuted: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  return deepFreeze({
    ...draft,
    bindingUnitDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertSourceLineage(
  input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
): void {
  const plan = input.keyposePlan
  const preparation = input.controlledPreparation
  const preparationInput =
    input.controlledPreparationInput
  const subjectGate = input.motionSubjectClassGate
  if (
    preparation.selectedRoute !==
      'comfyui_controlled_keyposes'
    || preparationInput.routeDecision.decision.selectedRoute !==
      'comfyui_controlled_keyposes'
    || !subjectGate.routeAdmissionGranted
    || subjectGate.classification.subjectClass !==
      'living_or_organic_subject'
    || subjectGate.routeEvaluation.disposition !==
      'accepted_complete_frame_living_motion'
    || subjectGate.routeEvaluation.selectedRoute !==
      'comfyui_controlled_keyposes'
    || subjectGate.sourceBindings.routeDecisionDigestSha256 !==
      preparationInput.routeDecision.decisionDigestSha256
    || subjectGate.classification.sceneId !==
      preparation.canonicalScope.sceneId
    || subjectGate.classification.componentId !==
      preparation.canonicalScope.componentId
    || plan.canonicalScope.workspaceId !==
      preparation.canonicalScope.workspaceId
    || plan.canonicalScope.projectId !==
      preparation.canonicalScope.projectId
    || plan.canonicalScope.editSessionId !==
      preparation.canonicalScope.editSessionId
    || plan.canonicalScope.sceneId !==
      preparation.canonicalScope.sceneId
    || plan.canonicalScope.componentId !==
      preparation.canonicalScope.componentId
    || plan.sourceBindings.approvedSnapshotId !==
      preparation.sourceBindings.approvedSnapshotId
    || plan.sourceBindings.approvedSnapshotHashSha256 !==
      preparation.sourceBindings.approvedSnapshotHashSha256
    || plan.sourceBindings.currentMasterTimingDigestSha256 !==
      preparation.sourceBindings.currentMasterTimingDigestSha256
    || plan.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
        preparation.sourceBindings
          .confirmedOutputFrameExpectationDigestSha256
    || plan.sourceBindings.completeCharacterSourceArtifactId !==
      preparation.sourceBindings.sourceArtifactId
    || plan.sourceBindings.completeCharacterSourceArtifactId !==
      preparationInput.routeDecision.evidence.sourceArtifactId
    || plan.sequencePolicy.actionSpecificKeyposeSelectionRequired !== true
    || plan.sequencePolicy.storyTimingOwnsExactKeyposeFrames !== true
    || plan.sequencePolicy.genericStartMiddleEndPlanningForbidden !== true
    || plan.sequencePolicy.independentPerFrameGenerationForbidden !== true
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertProjection(
  draft:
    LivingFrameCompleteCharacterKeyposeControlledImageBindingDraft,
): void {
  if (
    draft.bindingUnits.length !==
      draft.metrics.keyposeUnitCount
    || draft.metrics.keyposeUnitCount < 3
    || draft.metrics.keyposeUnitCount > 4
    || draft.metrics.boundPreparationUnitCount !==
      draft.metrics.keyposeUnitCount
    || draft.metrics.boundSelectedSceneRequestUnitCount !==
      draft.metrics.keyposeUnitCount
    || draft.metrics.poseControlledUnitCount !==
      draft.metrics.keyposeUnitCount
    || draft.metrics.referenceConditionedUnitCount !==
      draft.metrics.keyposeUnitCount
    || draft.metrics.pendingPrivateActionConditioningUnitCount !==
      draft.metrics.keyposeUnitCount
    || !draft.motionSubjectClassGateRevalidated
    || !draft.sequencingPolicy
      .livingOrOrganicSubjectCompleteFrameAnimationOnly
    || draft.sequencingPolicy
      .livingOrOrganicSubjectPartBasedRiggingAllowed
    || draft.privateActionConditioningReconciled
    || draft.privatePromptMaterialized
    || draft.bindingUnits.some((unit) =>
      unit.operationRegistered
      || unit.dispatched
      || unit.runtimeExecuted
      || unit.assetCreated
      || unit.qaApproved
      || unit.privateActionConditioningRequirement
        .selectedSceneConditioningAloneSufficient
      || unit.privateActionConditioningRequirement
        .privatePromptMaterializationMayProceedBeforeActionConditioningReconciled
      || unit.outputPolicy
        .independentAnimationFrameGenerationAllowed
      || !unit.outputPolicy
        .completeFramePoseCandidateRequired
      || unit.outputPolicy
        .partBasedLivingSubjectRiggingAllowed
      || unit.generationCanvas
        .finalCanvasCreatedByComfyUi)
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.assetCreated
    || draft.canonicalQaApproved
    || draft.actualCostReceiptCreated
    || draft.customerCharged
    || draft.publicDeliveryReady
    || draft.productionReady
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
}

function assertInput(
  input:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'bindingId',
      'controlledPreparation',
      'controlledPreparationInput',
      'keyposePlan',
      'keyposePlanInput',
      'motionSubjectClassGate',
      'motionSubjectClassGateInput',
    ].sort().join('|')
    || typeof input.bindingId !== 'string'
    || !SAFE_ID.test(input.bindingId)
  ) throw invalid('input_invalid', '$')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(
  code:
    LivingFrameCompleteCharacterKeyposeControlledImageBindingIssueCode,
  path: string,
): LivingFrameCompleteCharacterKeyposeControlledImageBindingError {
  return new LivingFrameCompleteCharacterKeyposeControlledImageBindingError([{
    code,
    path,
  }])
}
