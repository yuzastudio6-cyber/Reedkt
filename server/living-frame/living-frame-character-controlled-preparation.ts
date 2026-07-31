import {
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CLASS,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_OPEN_GATES,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_STATE,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_VERSION,
  type LivingFrameCharacterControlledPreparation,
  type LivingFrameCharacterControlledPreparationAuthority,
  type LivingFrameCharacterControlledPreparationDraft,
  type LivingFrameCharacterControlledPreparationGraphNodeClass,
  type LivingFrameCharacterControlledPreparationIssue,
  type LivingFrameCharacterControlledPreparationIssueCode,
  type LivingFrameCharacterControlledPreparationPrivateSlotKind,
  type LivingFrameCharacterControlledPreparationUnit,
} from '../../src/types/living-frame-character-controlled-preparation'
import type {
  LivingFrameCharacterAnimationRouteDecision,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameControlledImageFullFrameRatioExtension,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from './living-frame-controlled-image-full-frame-ratio-extension'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import {
  verifyLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameCharacterControlledPreparationAuthority =
  deepFreeze({
    characterPreparationProjectionAuthority: true,
    selectedSceneAuthority: false,
    promptMaterializationAuthority: false,
    outputFrameAuthority: false,
    timingAuthority: false,
    approvalAuthority: false,
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    actualCostAuthority: false,
    assetAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameCharacterControlledPreparationInput {
  readonly candidateId: string
  readonly routeDecision:
    LivingFrameCharacterAnimationRouteDecision
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly fullFrameRatioExtension:
    LivingFrameControlledImageFullFrameRatioExtension
  readonly fullFrameRatioExtensionInput:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput
}

export class LivingFrameCharacterControlledPreparationError
  extends Error {
  readonly issues:
    readonly LivingFrameCharacterControlledPreparationIssue[]

  constructor(
    issues:
      readonly LivingFrameCharacterControlledPreparationIssue[],
  ) {
    super(
      'Living Frame character controlled preparation projection failed.',
    )
    this.name =
      'LivingFrameCharacterControlledPreparationError'
    this.issues = issues
  }
}

export async function
compileLivingFrameCharacterControlledPreparation(
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): Promise<LivingFrameCharacterControlledPreparation> {
  assertInput(input)
  if (
    !verifyLivingFrameCharacterAnimationRouteDecision(
      input.routeDecision,
    )
  ) throw invalid(
    'route_decision_invalid',
    '$.routeDecision',
  )
  if (
    !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  ) throw invalid(
    'selected_scene_request_invalid',
    '$.selectedSceneRequest',
  )
  if (
    !await verifyLivingFrameControlledImageFullFrameRatioExtension(
      input.fullFrameRatioExtension,
      input.fullFrameRatioExtensionInput,
    )
  ) throw invalid(
    'full_frame_ratio_extension_invalid',
    '$.fullFrameRatioExtension',
  )
  assertSharedLineage(input)

  const selectedRoute =
    input.routeDecision.decision.selectedRoute
  if (
    selectedRoute !==
      'comfyui_controlled_component_preparation'
    && selectedRoute !==
      'comfyui_controlled_keyposes'
  ) throw invalid(
    'route_not_controlled_generation',
    '$.routeDecision.decision.selectedRoute',
  )

  const preparationUnits =
    selectedRoute ===
      'comfyui_controlled_component_preparation'
      ? compileComponentPreparationUnits(input)
      : compileAnchorKeyposeUnits(input)
  const draft:
    LivingFrameCharacterControlledPreparationDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CLASS,
      preparationState:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_STATE,
      candidateId: input.candidateId,
      canonicalScope: {
        workspaceId:
          input.selectedSceneRequest.canonicalScope.workspaceId,
        projectId:
          input.selectedSceneRequest.canonicalScope.projectId,
        editSessionId:
          input.selectedSceneRequest.canonicalScope.editSessionId,
        sceneId:
          input.routeDecision.evidence.sceneId,
        componentId:
          input.routeDecision.evidence.componentId,
      },
      sourceBindings: {
        characterRouteDecisionVersion:
          input.routeDecision.contractVersion,
        characterRouteDecisionDigestSha256:
          input.routeDecision.decisionDigestSha256,
        selectedSceneRequestVersion:
          input.selectedSceneRequest.contractVersion,
        selectedSceneRequestBindingDigestSha256:
          input.selectedSceneRequest.requestBindingDigestSha256,
        fullFrameRatioExtensionVersion:
          input.fullFrameRatioExtension.contractVersion,
        fullFrameRatioExtensionDigestSha256:
          input.fullFrameRatioExtension.extensionDigestSha256,
        approvedSnapshotId:
          input.selectedSceneRequest.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.selectedSceneRequest.sourceBindings
            .approvedSnapshotHashSha256,
        approvedWorkGraphDigestSha256:
          input.selectedSceneRequest.sourceBindings
            .canonicalWorkGraphProjectionDigestSha256,
        currentMasterTimingDigestSha256:
          input.selectedSceneRequest.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          input.selectedSceneRequest.sourceBindings
            .outputFrameExpectationDigestSha256,
        sourceArtifactId:
          input.routeDecision.evidence.sourceArtifactId,
      },
      selectedRoute,
      preparationUnits,
      metrics: {
        preparationUnitCount:
          preparationUnits.length,
        maskedInpaintUnitCount:
          preparationUnits.filter((unit) =>
            unit.graphProfile.graphFamily ===
              'controlled_sdxl_masked_inpaint_v1').length,
        isolatedComponentUnitCount:
          preparationUnits.filter((unit) =>
            unit.purpose ===
              'prepare_clean_isolated_component').length,
        anchorKeyposeUnitCount:
          preparationUnits.filter((unit) =>
            unit.purpose ===
              'generate_controlled_anchor_keypose').length,
        maximumAnchorKeyposeCount: 4,
      },
      graphBoundary: {
        existingSelectedSceneGraphSupportsMaskedInpaint:
          false,
        existingSelectedSceneGraphMaySubstituteForMaskedInpaint:
          false,
        maskedInpaintRequiresVersionedNamespacedExtension:
          true,
        maskedInpaintRequiredNodes: [
          'LoadImageMask',
          'VAEEncodeForInpaint',
        ],
        sourcePlateMaskEncodingProfile:
          'gray8_mask_png_v1',
        sourcePlateMaskChannel: 'red',
        sourcePlateMaskPolarity:
          'white_one_means_inpaint',
        plainLoadImageMaskOutputAllowed: false,
        sourceAndMaskInputsPreparedOutsideComfyUi:
          true,
        oneComfyUiHostIdentityAndOperation:
          true,
        auxiliaryModelsOrLibrariesCreateToolIdentity:
          false,
      },
      professionalRules: {
        reconstructPlateBeforeMovingOccludingComponent:
          true,
        cleanComponentBoundaryBeforeRigging:
          true,
        redesignMotionPathBeforeProtectedFaceCrossing:
          true,
        controlledGenerationCreatesComponentsOrAnchorKeyposesOnly:
          true,
        independentPerFrameGenerationForbidden:
          true,
        recompileRouteAfterPreparationQa:
          true,
        riggingCannotInventMissingArtwork:
          true,
        finalCanvasOwnedByRemotion:
          true,
      },
      openGateCodes:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_OPEN_GATES,
      authorityBoundary:
        AUTHORITY_BOUNDARY,
      routeDecisionRevalidated: true,
      selectedSceneRequestRevalidated: true,
      fullFrameRatioExtensionRevalidated: true,
      rawPromptPathUrlModelBytesCredentialCommandOrEnvironmentIncluded:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      actualCostReceiptCreated: false,
      assetCreated: false,
      qaApproved: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertProjection(draft)
  const result = deepFreeze({
    ...draft,
    preparationDigestSha256:
      sha256AuthorityValue(draft),
  })
  return result
}

export async function
verifyLivingFrameCharacterControlledPreparation(
  value: unknown,
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CLASS
      || value.preparationState !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_STATE
      || typeof value.preparationDigestSha256 !== 'string'
      || !SHA256.test(value.preparationDigestSha256)
    ) return false
    const {
      preparationDigestSha256,
      ...draft
    } = value
    if (
      preparationDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(
        await compileLivingFrameCharacterControlledPreparation(
          input,
        ),
      )
  } catch {
    return false
  }
}

function compileComponentPreparationUnits(
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): readonly LivingFrameCharacterControlledPreparationUnit[] {
  const route = input.routeDecision
  if (
    route.decision
      .controlledComponentPreparationRequired !== true
    || route.decision
      .controlledKeyposeGenerationRequired !== false
    || route.decision.downstreamRouteAfterPreparation !==
      'pixijs_rigid_cutout'
  ) throw invalid(
    'route_not_controlled_generation',
    '$.routeDecision.decision',
  )
  const componentUnits =
    input.selectedSceneRequest.requestUnits.filter((unit) =>
      unit.componentId === route.evidence.componentId)
  if (componentUnits.length !== 1) throw invalid(
    'component_request_unit_missing',
    '$.selectedSceneRequest.requestUnits',
  )
  const componentUnit = componentUnits[0]!
  if (
    componentUnit.generationCanvas.canvasClass !==
      'isolated_component_square_1024'
    || componentUnit.generationCanvas.widthPixels !== 1024
    || componentUnit.generationCanvas.heightPixels !== 1024
  ) throw invalid(
    'generation_canvas_invalid',
    '$.selectedSceneRequest.requestUnits.component',
  )
  const fullFrameUnits =
    input.fullFrameRatioExtension.fullFrameRequestUnits
  const plateUnits = fullFrameUnits.filter((unit) =>
    unit.componentRole === 'opaque_background_plate'
    || unit.componentRole === 'reconstructed_background_plate'
    || unit.componentRole === 'source_still')
  if (plateUnits.length !== 1) throw invalid(
    'background_plate_request_unit_missing',
    '$.fullFrameRatioExtension.fullFrameRequestUnits',
  )
  const plate = plateUnits[0]!
  const plateRequest =
    input.selectedSceneRequest.requestUnits.find((unit) =>
      unit.requestUnitId ===
        plate.selectedSceneRequestUnitId)
  if (!plateRequest) throw invalid(
    'source_lineage_mismatch',
    '$.fullFrameRatioExtension.fullFrameRequestUnits[0]',
  )
  return deepFreeze([
    compileMaskedPlateUnit({
      order: 0,
      input,
      requestUnit: plateRequest,
      widthPixels: plate.frameProfile.widthPixels,
      heightPixels: plate.frameProfile.heightPixels,
    }),
    compileGeneratedUnit({
      order: 1,
      input,
      requestUnit: componentUnit,
      purpose: 'prepare_clean_isolated_component',
    }),
  ])
}

function compileAnchorKeyposeUnits(
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): readonly LivingFrameCharacterControlledPreparationUnit[] {
  const route = input.routeDecision
  if (
    route.decision
      .controlledKeyposeGenerationRequired !== true
    || route.decision
      .controlledComponentPreparationRequired !== false
  ) throw invalid(
    'route_not_controlled_generation',
    '$.routeDecision.decision',
  )
  const componentUnits =
    input.selectedSceneRequest.requestUnits.filter((unit) =>
      unit.componentId === route.evidence.componentId)
  if (
    componentUnits.length < 2
    || componentUnits.length > 4
  ) throw invalid(
    'anchor_keypose_unit_count_invalid',
    '$.selectedSceneRequest.requestUnits',
  )
  return deepFreeze(componentUnits.map((requestUnit, order) =>
    compileGeneratedUnit({
      order,
      input,
      requestUnit,
      purpose: 'generate_controlled_anchor_keypose',
    })))
}

function compileMaskedPlateUnit(input: {
  readonly order: number
  readonly input:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly widthPixels: number
  readonly heightPixels: number
}): LivingFrameCharacterControlledPreparationUnit {
  const nodeClasses = maskedInpaintNodeClasses(
    input.requestUnit,
  )
  if (
    !nodeClasses.includes('VAEEncodeForInpaint')
    || !nodeClasses.includes('LoadImageMask')
    || nodeClasses.includes('EmptyLatentImage')
  ) throw invalid(
    'masked_inpaint_graph_invalid',
    '$.preparationUnits.reconstruct_exposed_source_plate.graphProfile',
  )
  const slots = uniqueSlots([
    ...input.requestUnit.privateSlotKinds,
    'source_plate_image_artifact',
    'source_plate_inpaint_mask_artifact',
  ])
  return compileUnit({
    order: input.order,
    input: input.input,
    requestUnit: input.requestUnit,
    purpose: 'reconstruct_exposed_source_plate',
    graphFamily:
      'controlled_sdxl_masked_inpaint_v1',
    nodeClasses,
    requiredPrivateSlotKinds: slots,
    canvasClass: 'confirmed_full_frame_ratio',
    widthPixels: input.widthPixels,
    heightPixels: input.heightPixels,
    qaRequirementCodes: [
      'hidden_source_plate_complete',
      'alpha_destination_composite_clean',
      'illustrative_fact_treatment_preserved',
    ],
  })
}

function compileGeneratedUnit(input: {
  readonly order: number
  readonly input:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly purpose:
    | 'prepare_clean_isolated_component'
    | 'generate_controlled_anchor_keypose'
}): LivingFrameCharacterControlledPreparationUnit {
  if (
    input.requestUnit.generationCanvas.canvasClass !==
      'isolated_component_square_1024'
    || input.requestUnit.generationCanvas.widthPixels !== 1024
    || input.requestUnit.generationCanvas.heightPixels !== 1024
  ) throw invalid(
    'generation_canvas_invalid',
    '$.selectedSceneRequest.requestUnits',
  )
  return compileUnit({
    order: input.order,
    input: input.input,
    requestUnit: input.requestUnit,
    purpose: input.purpose,
    graphFamily:
      'controlled_sdxl_selected_scene_v1',
    nodeClasses:
      selectedSceneNodeClasses(input.requestUnit),
    requiredPrivateSlotKinds:
      input.requestUnit.privateSlotKinds,
    canvasClass:
      'isolated_component_square_1024',
    widthPixels: 1024,
    heightPixels: 1024,
    qaRequirementCodes: input.purpose ===
      'prepare_clean_isolated_component'
      ? [
          'component_boundary_decontaminated',
          'alpha_destination_composite_clean',
          'protected_face_clearance_verified',
          'attachment_continuity_verified',
          'character_prop_style_continuity_verified',
          'illustrative_fact_treatment_preserved',
        ]
      : [
          'protected_face_clearance_verified',
          'attachment_continuity_verified',
          'character_prop_style_continuity_verified',
          'illustrative_fact_treatment_preserved',
        ],
  })
}

function compileUnit(input: {
  readonly order: number
  readonly input:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly purpose:
    LivingFrameCharacterControlledPreparationUnit['purpose']
  readonly graphFamily:
    LivingFrameCharacterControlledPreparationUnit['graphProfile']['graphFamily']
  readonly nodeClasses:
    readonly LivingFrameCharacterControlledPreparationGraphNodeClass[]
  readonly requiredPrivateSlotKinds:
    readonly LivingFrameCharacterControlledPreparationPrivateSlotKind[]
  readonly canvasClass:
    LivingFrameCharacterControlledPreparationUnit['generationCanvas']['canvasClass']
  readonly widthPixels: number
  readonly heightPixels: number
  readonly qaRequirementCodes:
    LivingFrameCharacterControlledPreparationUnit['qaRequirementCodes']
}): LivingFrameCharacterControlledPreparationUnit {
  const identity = {
    routeDecisionDigestSha256:
      input.input.routeDecision.decisionDigestSha256,
    selectedSceneRequestUnitId:
      input.requestUnit.requestUnitId,
    selectedSceneRequestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    purpose: input.purpose,
    sourceArtifactId:
      input.input.routeDecision.evidence.sourceArtifactId,
  }
  const draft = {
    order: input.order,
    preparationUnitId:
      `lf-character-prep.${sha256AuthorityValue(identity).slice(0, 40)}`,
    purpose: input.purpose,
    sceneId: input.requestUnit.sceneId,
    componentId: input.requestUnit.componentId,
    componentRole:
      input.requestUnit.componentRole,
    sourceArtifactId:
      input.input.routeDecision.evidence.sourceArtifactId,
    selectedSceneRequestUnitId:
      input.requestUnit.requestUnitId,
    selectedSceneRequestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit.approvedPlannedAssetManifestEntryId,
    outputKey: input.requestUnit.outputKey,
    rendererLayerId:
      input.requestUnit.rendererLayerId,
    graphProfile: {
      graphFamily: input.graphFamily,
      nodeClasses: input.nodeClasses,
      requiredPrivateSlotKinds:
        input.requiredPrivateSlotKinds,
      sourceAndMaskStayPrivate: true,
      inGraphPreprocessorAllowed: false,
      faceIdOrInsightFaceAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
    },
    generationCanvas: {
      canvasClass: input.canvasClass,
      widthPixels: input.widthPixels,
      heightPixels: input.heightPixels,
      confirmedOutputFrameExpectationDigestSha256:
        input.input.selectedSceneRequest.sourceBindings
          .outputFrameExpectationDigestSha256,
      callerSelectedDimensionsAllowed: false,
      squareFullFrameSubstitutionApplied: false,
      finalCanvasCreatedByComfyUi: false,
    },
    attemptPolicy: {
      onePreparationUnitPerApprovedOutput: true,
      oneImagePerGpuAttempt: true,
      outputBatchingAllowed: false,
      deterministicSeedDerivedServerSide: true,
      callerSeedAllowed: false,
      exactModelRoleCount: 5,
      atomicReadOnlyModelMountLifetimeRequired: true,
      fixedSupervisedProcessRequired: true,
      deniedTopLevelImports: ['sam2'] as const,
    },
    downstreamPolicy: {
      outputContentType: 'image/png',
      outputImageCount: 1,
      outputIsIntermediateComponentOrPlate: true,
      stillAlphaPipelineRequired:
        input.purpose !==
          'reconstruct_exposed_source_plate',
      opaqueRectangleMayReplaceRequiredAlpha:
        false,
      generatedFrameSequenceAllowed: false,
      generateEveryAnimationFrameIndependently: false,
      rerunCharacterRouteAfterQa: true,
      remotionOwnsFinalComposition: true,
    },
    qaRequirementCodes:
      input.qaRequirementCodes,
    operationRegistered: false,
    dispatched: false,
    runtimeExecuted: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  return deepFreeze({
    ...draft,
    preparationUnitDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function maskedInpaintNodeClasses(
  unit:
    LivingFrameControlledImageSelectedSceneRequestUnit,
): readonly LivingFrameCharacterControlledPreparationGraphNodeClass[] {
  const nodes:
    LivingFrameCharacterControlledPreparationGraphNodeClass[] = [
      'CheckpointLoaderSimple',
    ]
  if (unit.controlPolicy.loraAdapterRequired) {
    nodes.push('LoraLoader')
  }
  nodes.push(
    'CLIPTextEncode',
    'CLIPTextEncode',
    'LoadImage',
    'LoadImageMask',
  )
  if (unit.controlPolicy.structureConditioningRequired) {
    nodes.push(
      'ControlNetLoader',
      'LoadImage',
      'ControlNetApplyAdvanced',
    )
  }
  if (unit.controlPolicy.referenceConditioningRequired) {
    nodes.push(
      'CLIPVisionLoader',
      'IPAdapterModelLoader',
      'LoadImage',
      'IPAdapterAdvanced',
    )
  }
  nodes.push(
    'VAEEncodeForInpaint',
    'KSampler',
    'VAEDecode',
    'SaveImageWebsocket',
  )
  return deepFreeze(nodes)
}

function selectedSceneNodeClasses(
  unit:
    LivingFrameControlledImageSelectedSceneRequestUnit,
): readonly LivingFrameCharacterControlledPreparationGraphNodeClass[] {
  const nodes:
    LivingFrameCharacterControlledPreparationGraphNodeClass[] = [
      'CheckpointLoaderSimple',
    ]
  if (unit.controlPolicy.loraAdapterRequired) {
    nodes.push('LoraLoader')
  }
  nodes.push('CLIPTextEncode', 'CLIPTextEncode')
  if (unit.controlPolicy.structureConditioningRequired) {
    nodes.push(
      'ControlNetLoader',
      'LoadImage',
      'ControlNetApplyAdvanced',
    )
  }
  nodes.push('EmptyLatentImage')
  if (unit.controlPolicy.referenceConditioningRequired) {
    nodes.push(
      'CLIPVisionLoader',
      'IPAdapterModelLoader',
      'LoadImage',
      'IPAdapterAdvanced',
    )
  }
  nodes.push(
    'KSampler',
    'VAEDecode',
    'SaveImageWebsocket',
  )
  return deepFreeze(nodes)
}

function uniqueSlots(
  slots:
    readonly LivingFrameCharacterControlledPreparationPrivateSlotKind[],
): readonly LivingFrameCharacterControlledPreparationPrivateSlotKind[] {
  return deepFreeze([...new Set(slots)])
}

function assertSharedLineage(
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): void {
  const route = input.routeDecision
  const request = input.selectedSceneRequest
  const extension = input.fullFrameRatioExtension
  if (
    route.evidence.sceneId !==
      request.canonicalScope.sceneId
    || extension.canonicalScope.sceneId !==
      request.canonicalScope.sceneId
    || extension.sourceBindings
      .selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256
    || extension.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
      request.sourceBindings.outputFrameExpectationDigestSha256
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertInput(
  input:
    CreateLivingFrameCharacterControlledPreparationInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(input.candidateId)
    || Object.keys(input).sort().join('|') !== [
      'candidateId',
      'fullFrameRatioExtension',
      'fullFrameRatioExtensionInput',
      'routeDecision',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
    ].sort().join('|')
  ) throw invalid('input_invalid', '$')
}

function assertProjection(
  draft:
    LivingFrameCharacterControlledPreparationDraft,
): void {
  if (
    draft.preparationUnits.length === 0
    || draft.preparationUnits.some((unit) =>
      unit.graphProfile.nodeClasses.at(-1) !==
        'SaveImageWebsocket'
      || unit.graphProfile.nodeClasses.includes(
        'SaveImage' as
          LivingFrameCharacterControlledPreparationGraphNodeClass,
      )
      || unit.generationCanvas.finalCanvasCreatedByComfyUi
      || (
        unit.purpose ===
          'reconstruct_exposed_source_plate'
        ? unit.downstreamPolicy
          .stillAlphaPipelineRequired
        : (
            !unit.downstreamPolicy
              .stillAlphaPipelineRequired
            || unit.downstreamPolicy
              .opaqueRectangleMayReplaceRequiredAlpha
          )
      )
      || unit.downstreamPolicy
        .generateEveryAnimationFrameIndependently
      || unit.operationRegistered
      || unit.dispatched
      || unit.runtimeExecuted
      || unit.assetCreated
      || unit.qaApproved)
    || draft.metrics.preparationUnitCount !==
      draft.preparationUnits.length
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.assetCreated
    || draft.qaApproved
    || draft.productionReady
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
  const inpaintUnits =
    draft.preparationUnits.filter((unit) =>
      unit.purpose ===
        'reconstruct_exposed_source_plate')
  if (
    inpaintUnits.some((unit) =>
      unit.graphProfile.graphFamily !==
        'controlled_sdxl_masked_inpaint_v1'
      || !unit.graphProfile.nodeClasses.includes(
        'VAEEncodeForInpaint',
      )
      || !unit.graphProfile.nodeClasses.includes(
        'LoadImageMask',
      )
      || unit.graphProfile.nodeClasses.includes(
        'EmptyLatentImage',
      ))
  ) throw invalid(
    'generic_graph_substitution_forbidden',
    '$.preparationUnits',
  )
}

function invalid(
  code:
    LivingFrameCharacterControlledPreparationIssueCode,
  path: string,
): LivingFrameCharacterControlledPreparationError {
  return new LivingFrameCharacterControlledPreparationError([{
    code,
    path,
  }])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }
  return value
}
