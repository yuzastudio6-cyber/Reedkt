import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES,
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_VERSION,
  type LivingFrameControlledImageFullFrameRatioAuthority,
  type LivingFrameControlledImageFullFrameRatioClass,
  type LivingFrameControlledImageFullFrameRatioComponentRole,
  type LivingFrameControlledImageFullFrameRatioExtension,
  type LivingFrameControlledImageFullFrameRatioExtensionDraft,
  type LivingFrameControlledImageFullFrameRatioIssue,
  type LivingFrameControlledImageFullFrameRatioIssueCode,
  type LivingFrameControlledImageFullFrameRatioUnit,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameComfyUiOperationAdmissionCandidate,
} from '../../src/types/living-frame-comfyui-operation-admission-candidate'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  livingFrameOutputFrameDigestProjection,
} from '../../src/lib/living-frame/living-frame-canonical-planning'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from './living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import {
  verifyLivingFrameComfyUiOperationAdmissionCandidate,
} from './living-frame-comfyui-operation-admission-candidate'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SAFE_ASPECT_RATIO =
  /^(?:custom|[1-9][0-9]{0,4}:[1-9][0-9]{0,4})$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
const MAXIMUM_TARGET_DIMENSION = 4_096
const MAXIMUM_TARGET_PIXEL_COUNT = 8_294_400
const MINIMUM_TARGET_DIMENSION = 512

const FULL_FRAME_COMPONENT_ROLES =
  new Set<LivingFrameControlledImageFullFrameRatioComponentRole>(
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES,
  )

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageFullFrameRatioAuthority =
  deepFreeze({
    fullFrameRatioExtensionCompilationAuthority: true,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
    promptAuthority: false,
    visualContinuityPackAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    modelArtifactAuthority: false,
    artifactMountAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageFullFrameRatioExtensionInput {
  readonly extensionId: string
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly admissionCandidate:
    LivingFrameComfyUiOperationAdmissionCandidate
}

export class
LivingFrameControlledImageFullFrameRatioExtensionError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageFullFrameRatioIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageFullFrameRatioIssue[],
  ) {
    super(
      'Living Frame controlled-image full-frame ratio extension failed.',
    )
    this.name =
      'LivingFrameControlledImageFullFrameRatioExtensionError'
    this.issues = issues
  }
}

export async function
createLivingFrameControlledImageFullFrameRatioExtension(
  input:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
): Promise<LivingFrameControlledImageFullFrameRatioExtension> {
  assertInput(input)
  const frame = readConfirmedFrame(
    input.selectedSceneRequestInput,
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
    !await verifyLivingFrameComfyUiOperationAdmissionCandidate(
      input.admissionCandidate,
      { candidateId: input.admissionCandidate.candidateId },
    )
  ) throw invalid(
    'admission_candidate_invalid',
    '$.admissionCandidate',
  )
  assertCandidateBoundary(input.admissionCandidate)

  const recomputedFrameDigestSha256 =
    sha256AuthorityValue(
      livingFrameOutputFrameDigestProjection(
        input.selectedSceneRequestInput.components,
      ),
    )
  if (
    recomputedFrameDigestSha256 !==
      input.selectedSceneRequest.sourceBindings
        .outputFrameExpectationDigestSha256
    || recomputedFrameDigestSha256 !==
      input.selectedSceneRequestInput.publication.binding
        .sourceBindings.confirmedOutputFrameDigestSha256
  ) throw invalid(
    'frame_expectation_digest_mismatch',
    '$.selectedSceneRequest.sourceBindings.outputFrameExpectationDigestSha256',
  )

  const fullFrameSourceUnits =
    input.selectedSceneRequest.requestUnits.filter(
      (unit): unit is
        LivingFrameControlledImageSelectedSceneRequestUnit & {
          readonly componentRole:
            LivingFrameControlledImageFullFrameRatioComponentRole
        } =>
        FULL_FRAME_COMPONENT_ROLES.has(
          unit.componentRole as
            LivingFrameControlledImageFullFrameRatioComponentRole,
        ),
    )
  if (fullFrameSourceUnits.length < 1) {
    throw invalid(
      'full_frame_request_unit_missing',
      '$.selectedSceneRequest.requestUnits',
    )
  }
  assertSelectedRequestUnitBoundaries({
    request: input.selectedSceneRequest,
    fullFrameUnits: fullFrameSourceUnits,
    frame,
  })

  const fullFrameRequestUnits =
    fullFrameSourceUnits.map((unit, order) =>
      compileFullFrameUnit({
        order,
        unit,
        frame,
      }))
  const isolatedUnits =
    input.selectedSceneRequest.requestUnits.filter(
      (unit) =>
        !FULL_FRAME_COMPONENT_ROLES.has(
          unit.componentRole as
            LivingFrameControlledImageFullFrameRatioComponentRole,
        ),
    )
  assertIsolatedUnits(isolatedUnits, frame)

  const draft:
    LivingFrameControlledImageFullFrameRatioExtensionDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_CLASS,
    extensionState:
      LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_STATE,
    extensionId: input.extensionId,
    canonicalScope: {
      ...input.selectedSceneRequest.canonicalScope,
    },
    sourceBindings: {
      selectedSceneRequestContractVersion:
        input.selectedSceneRequest.contractVersion,
      selectedSceneRequestBindingId:
        input.selectedSceneRequest.requestBindingId,
      selectedSceneRequestBindingDigestSha256:
        input.selectedSceneRequest.requestBindingDigestSha256,
      approvedSnapshotId:
        input.selectedSceneRequest.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        input.selectedSceneRequest.sourceBindings
          .approvedSnapshotHashSha256,
      admissionCandidateContractVersion:
        input.admissionCandidate.contractVersion,
      admissionCandidateDigestSha256:
        input.admissionCandidate.candidateDigestSha256,
      confirmedOutputFrameExpectationDigestSha256:
        input.selectedSceneRequest.sourceBindings
          .outputFrameExpectationDigestSha256,
      recomputedConfirmedOutputFrameDigestSha256:
        recomputedFrameDigestSha256,
      currentMasterTimingDigestSha256:
        input.selectedSceneRequest.sourceBindings
          .currentMasterTimingDigestSha256,
      fixedLaunchSpecDigestSha256:
        input.admissionCandidate.sourceBindings
          .fixedLaunchSpecDigestSha256,
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
    },
    confirmedFrameProfile: {
      ...frame,
      outputFrameConfirmed: true,
      outputFramePurpose:
        'private_canonical_4k_master_review',
      maximumQualifiedTargetWidthPixels:
        MAXIMUM_TARGET_DIMENSION,
      maximumQualifiedTargetHeightPixels:
        MAXIMUM_TARGET_DIMENSION,
      maximumQualifiedTargetPixelCount:
        MAXIMUM_TARGET_PIXEL_COUNT,
    },
    fullFrameRequestUnits,
    isolatedComponentBoundary: {
      isolatedRequestUnitIds:
        isolatedUnits.map((unit) => unit.requestUnitId),
      isolatedUnitCount: isolatedUnits.length,
      isolatedUnitsIncludedInFullFrameExtension: false,
      isolatedGenerationCanvasClass:
        'isolated_component_square_1024',
      isolatedGenerationWidthPixels: 1_024,
      isolatedGenerationHeightPixels: 1_024,
      fullFrameExtensionMayMutateIsolatedUnits: false,
    },
    operationExpectation: {
      canonicalToolId: 'comfyui',
      canonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      currentObservedProductionToolIdentityCount:
        input.admissionCandidate.currentRegistryObservation
          .productionToolIdentityCount,
      currentObservedCountIsProductCap: false,
      registryExpansionPermitted: true,
      postAdmissionCountDerivedFromReleasedDistinctIdentities:
        true,
      oneComfyUiIdentityForSharedGpuAttempt: true,
      fakeIdentityForModelWeightAdapterOrLibraryAllowed:
        false,
      auraFaceMayUseDistinctReleasedCpuQaIdentity: true,
      qualificationOnly: true,
      productionToolSelectionAllowed: false,
      providerRoutingAllowed: false,
      approvedWorkDispatchAllowed: false,
      customerBillingAllowed: false,
      publicDeliveryAllowed: false,
      operationRegistered: false,
    },
    runtimeSafetyExpectation: {
      processEntrypointKind:
        'fixed_supervised_python_process',
      deniedTopLevelImports: ['sam2'],
      outOfScopeDirectVcsImportsAllowed: false,
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      readOnlyModelMountsRequired: true,
      atomicFiveModelMountLifetimeRequired: true,
      exactModelRoleCount: 5,
      everyModelVerifiedBeforeAndAfterInferenceRequired: true,
      oneProcessPerAttemptRequired: true,
      oneRequestUnitPerAttemptRequired: true,
      oneImagePerAttemptRequired: true,
      callerCommandArgumentsEnvironmentPathUrlCredentialAllowed:
        false,
      modelArtifactsTravelInRequestBindings: false,
      faceIdOrUnapprovedIdentityAdapterAllowed: false,
      auraFaceExecutionPlacement:
        'separate_optional_cpu_continuity_qa',
    },
    metrics: {
      fullFrameRequestUnitCount:
        fullFrameRequestUnits.length,
      isolatedRequestUnitCount: isolatedUnits.length,
      portraitRequestUnitCount:
        fullFrameRequestUnits.filter((unit) =>
          unit.frameProfile.frameClass === 'portrait_9_16').length,
      landscapeRequestUnitCount:
        fullFrameRequestUnits.filter((unit) =>
          unit.frameProfile.frameClass === 'landscape_16_9').length,
      customOrOtherRatioRequestUnitCount:
        fullFrameRequestUnits.filter((unit) =>
          unit.frameProfile.frameClass ===
            'custom_or_other_confirmed_ratio').length,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    selectedSceneRequestRevalidated: true,
    admissionCandidateRevalidated: true,
    confirmedOutputFrameRevalidated: true,
    fullFrameRatioExtensionImplemented: true,
    squareSubstitutionAllowed: false,
    callerDimensionsPromptPathUrlModelOrCredentialAllowed:
      false,
    finalCanvasClaimAllowed: false,
    executableRequestCreated: false,
    operationRegistered: false,
    dispatchGranted: false,
    workerLeaseCreated: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    productionReady: false,
  }
  assertProjectionSemantics(draft)
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    extensionDigestSha256: digest(draft),
  })
}

export async function
verifyLivingFrameControlledImageFullFrameRatioExtension(
  value: unknown,
  input:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_VERSION
      || value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_CLASS
      || value.extensionState !==
        LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_STATE
      || typeof value.extensionDigestSha256 !== 'string'
      || !SHA256.test(value.extensionDigestSha256)
    ) return false
    const {
      extensionDigestSha256,
      ...draft
    } = value
    if (extensionDigestSha256 !== digest(draft)) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledImageFullFrameRatioExtension(
        input,
      ),
    )
  } catch {
    return false
  }
}

function compileFullFrameUnit(input: {
  readonly order: number
  readonly unit:
    LivingFrameControlledImageSelectedSceneRequestUnit & {
      readonly componentRole:
        LivingFrameControlledImageFullFrameRatioComponentRole
    }
  readonly frame: ConfirmedFrame
}): LivingFrameControlledImageFullFrameRatioUnit {
  const identity = {
    selectedSceneRequestUnitId: input.unit.requestUnitId,
    selectedSceneRequestUnitDigestSha256:
      input.unit.requestUnitDigestSha256,
    sceneId: input.unit.sceneId,
    componentId: input.unit.componentId,
    approvedWorkItemId: input.unit.approvedWorkItemId,
    approvedWorkItemKey: input.unit.approvedWorkItemKey,
    outputKey: input.unit.outputKey,
    rendererLayerId: input.unit.rendererLayerId,
    frameExpectationDigestSha256:
      input.unit.generationCanvas
        .finalOutputFrameExpectationDigestSha256,
  }
  const draft = {
    order: input.order,
    extensionUnitId:
      `lf-full-frame-ratio.${digest(identity).slice(0, 40)}`,
    selectedSceneRequestUnitId:
      input.unit.requestUnitId,
    selectedSceneRequestUnitDigestSha256:
      input.unit.requestUnitDigestSha256,
    sceneId: input.unit.sceneId,
    componentId: input.unit.componentId,
    componentRole: input.unit.componentRole,
    assetIntentId: input.unit.assetIntentId,
    outputKey: input.unit.outputKey,
    approvedWorkItemId: input.unit.approvedWorkItemId,
    approvedWorkItemKey: input.unit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.unit.approvedPlannedAssetManifestEntryId,
    rendererLayerId: input.unit.rendererLayerId,
    serverOwnedConditioningLocatorId:
      input.unit.serverOwnedConditioningLocatorId,
    privateSlotKinds: input.unit.privateSlotKinds,
    frameProfile: {
      frameClass: input.frame.frameClass,
      confirmedAspectRatioLabel:
        input.frame.aspectRatioLabel,
      confirmedOutputFrameExpectationDigestSha256:
        input.unit.generationCanvas
          .finalOutputFrameExpectationDigestSha256,
      widthPixels: input.frame.widthPixels,
      heightPixels: input.frame.heightPixels,
      pixelCount: input.frame.pixelCount,
      reducedAspectRatioNumerator:
        input.frame.reducedAspectRatioNumerator,
      reducedAspectRatioDenominator:
        input.frame.reducedAspectRatioDenominator,
      dimensionsDerivedOnlyFromConfirmedOutputFrame: true,
      callerSelectedDimensionsAllowed: false,
      sourceGenerationCanvasMatchesConfirmedRatio: true,
      confirmedFrameIsSquare:
        input.frame.widthPixels === input.frame.heightPixels,
      squareCanvasAllowedOnlyWhenConfirmedFrameIsSquare: true,
      squareSubstitutionApplied: false,
      distortionAllowed: false,
      finalCanvasCreatedByComfyUi: false,
    },
    sourceAssetPolicy: {
      assetPurpose:
        'living_frame_full_frame_source_or_background_plate',
      generatedArtifactType:
        'living_frame_generated_opaque_still_png',
      outputContentType: 'image/png',
      outputImageCount: 1,
      stillAlphaPipelineRequired:
        input.unit.downstreamPolicy.stillAlphaPipelineRequired,
      opaqueRectangleMayReplaceRequiredAlpha: false,
      aiVideoFallbackAllowed: false,
      generatedAssetRemainsInputToRemotion: true,
      remotionOwnsFinalComposition: true,
    },
    attemptPolicy: {
      oneRequestUnitProducesOneImage: true,
      oneRequestUnitConsumesOneGpuAttempt: true,
      outputBatchingAllowed: false,
      deterministicSeedDerivedServerSide: true,
      callerSeedAllowed: false,
      maximumSceneAttemptCount:
        input.unit.attemptPolicy.maximumSceneAttemptCount,
    },
    qualificationState:
      'ready_for_full_frame_ratio_operation_qualification',
    executableRequestCreated: false,
    runtimeExecuted: false,
    assetCreated: false,
  } as const
  return deepFreeze({
    ...draft,
    extensionUnitDigestSha256: digest(draft),
  })
}

type ConfirmedFrame = {
  readonly frameClass:
    LivingFrameControlledImageFullFrameRatioClass
  readonly aspectRatioLabel: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly pixelCount: number
  readonly reducedAspectRatioNumerator: number
  readonly reducedAspectRatioDenominator: number
}

function readConfirmedFrame(
  selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput,
): ConfirmedFrame {
  const settings =
    selectedSceneRequestInput.components.confirmedSettings
  if (
    !isRecord(settings)
    || settings.outputFrameConfirmed !== true
    || settings.outputFramePurpose !==
      'private_canonical_4k_master_review'
    || !isRecord(settings.outputFrame)
  ) throw invalid(
    'confirmed_output_frame_required',
    '$.selectedSceneRequestInput.components.confirmedSettings',
  )
  const aspectRatioLabel = String(settings.aspectRatio)
  const widthPixels = Number(settings.outputFrame.width)
  const heightPixels = Number(settings.outputFrame.height)
  const fps = Number(settings.outputFrame.fps)
  const pixelCount = widthPixels * heightPixels
  if (
    !SAFE_ASPECT_RATIO.test(aspectRatioLabel)
    || !Number.isInteger(widthPixels)
    || !Number.isInteger(heightPixels)
    || widthPixels < MINIMUM_TARGET_DIMENSION
    || heightPixels < MINIMUM_TARGET_DIMENSION
    || widthPixels > MAXIMUM_TARGET_DIMENSION
    || heightPixels > MAXIMUM_TARGET_DIMENSION
    || !Number.isSafeInteger(pixelCount)
    || pixelCount > MAXIMUM_TARGET_PIXEL_COUNT
    || !Number.isFinite(fps)
    || fps <= 0
    || fps > 240
  ) throw invalid(
    'confirmed_output_frame_unsupported',
    '$.selectedSceneRequestInput.components.confirmedSettings.outputFrame',
  )
  const divisor = greatestCommonDivisor(
    widthPixels,
    heightPixels,
  )
  const reducedAspectRatioNumerator =
    widthPixels / divisor
  const reducedAspectRatioDenominator =
    heightPixels / divisor
  if (aspectRatioLabel !== 'custom') {
    const [
      labelNumerator,
      labelDenominator,
    ] = aspectRatioLabel.split(':').map(Number)
    const labelDivisor = greatestCommonDivisor(
      labelNumerator!,
      labelDenominator!,
    )
    if (
      labelNumerator! / labelDivisor !==
        reducedAspectRatioNumerator
      || labelDenominator! / labelDivisor !==
        reducedAspectRatioDenominator
    ) throw invalid(
      'frame_ratio_mismatch',
      '$.selectedSceneRequestInput.components.confirmedSettings.aspectRatio',
    )
  }
  return {
    frameClass: frameClass(
      reducedAspectRatioNumerator,
      reducedAspectRatioDenominator,
    ),
    aspectRatioLabel,
    widthPixels,
    heightPixels,
    fps,
    pixelCount,
    reducedAspectRatioNumerator,
    reducedAspectRatioDenominator,
  }
}

function frameClass(
  numerator: number,
  denominator: number,
): LivingFrameControlledImageFullFrameRatioClass {
  if (numerator === 9 && denominator === 16) {
    return 'portrait_9_16'
  }
  if (numerator === 16 && denominator === 9) {
    return 'landscape_16_9'
  }
  return 'custom_or_other_confirmed_ratio'
}

function assertCandidateBoundary(
  candidate: LivingFrameComfyUiOperationAdmissionCandidate,
): void {
  if (
    !Number.isInteger(
      candidate.currentRegistryObservation
        .productionToolIdentityCount,
    )
    || candidate.currentRegistryObservation
      .productionToolIdentityCount < 1
    || candidate.currentRegistryObservation
      .productionToolIdentityCountIsProductCap !== false
    || candidate.currentRegistryObservation.catalogIdentity
      !== 'comfyui'
    || candidate.currentRegistryObservation.catalogState
      !== 'non_e2e_evaluation_only'
    || candidate.currentRegistryObservation
      .productionToolIdentityPresent !== false
    || candidate.currentRegistryObservation
      .canonicalOperationPresent !== false
    || candidate.admissionDecision.canonicalOperationId
      !== 'tool.comfyui.generate_controlled_image.v1'
    || candidate.admissionDecision
      .executableToolIdentityCountRequested !== 1
    || candidate.admissionDecision.registryExpansionPermitted
      !== true
    || candidate.admissionDecision
      .postAdmissionToolIdentityCountDerivedFromReleasedDistinctIdentities
        !== true
    || candidate.admissionDecision
      .postAdmissionToolIdentityCountAsserted !== false
    || candidate.admissionDecision
      .fakeIdentityForModelWeightAdapterOrLibraryAllowed
        !== false
    || candidate.requestProjection.exactModelRoleCount !== 5
    || candidate.workerRuntimeExpectation.processEntrypointKind
      !== 'fixed_supervised_python_process'
    || candidate.sourceBindings.deniedTopLevelImports.length !== 1
    || candidate.sourceBindings.deniedTopLevelImports[0] !== 'sam2'
    || candidate.sourceBindings.outOfScopeDirectVcsImportsAllowed
      !== false
    || candidate.registryMutated !== false
    || candidate.operationRegistered !== false
    || candidate.dispatchGranted !== false
    || candidate.productionReady !== false
  ) throw invalid(
    'admission_candidate_invalid',
    '$.admissionCandidate',
  )
}

function assertSelectedRequestUnitBoundaries(input: {
  readonly request:
    LivingFrameControlledImageSelectedSceneRequest
  readonly fullFrameUnits:
    readonly LivingFrameControlledImageSelectedSceneRequestUnit[]
  readonly frame: ConfirmedFrame
}): void {
  const outputKeys = new Set<string>()
  for (const unit of input.fullFrameUnits) {
    if (
      unit.sceneId !== input.request.canonicalScope.sceneId
      || unit.requestUnitState !==
        'blocked_by_full_frame_generation_canvas_extension'
      || unit.generationCanvas.canvasClass !==
        'full_frame_ratio_extension_required'
      || unit.generationCanvas.widthPixels !== 1_024
      || unit.generationCanvas.heightPixels !== 1_024
      || unit.generationCanvas
        .finalOutputFrameExpectationDigestSha256 !==
          input.request.sourceBindings
            .outputFrameExpectationDigestSha256
      || unit.generationCanvas.finalOutputFrameWidthPixels
        !== input.frame.widthPixels
      || unit.generationCanvas.finalOutputFrameHeightPixels
        !== input.frame.heightPixels
      || unit.generationCanvas.finalCanvasCreatedByComfyUi
        !== false
      || unit.attemptPolicy.oneImagePerAttempt !== true
      || unit.attemptPolicy.callerSeedAllowed !== false
      || unit.downstreamPolicy
        .remotionOwnsFinalComposition !== true
      || unit.downstreamPolicy.aiVideoFallbackAllowed !== false
      || outputKeys.has(unit.outputKey)
      || !SAFE_ID.test(unit.approvedWorkItemId)
      || !SAFE_ID.test(unit.approvedWorkItemKey)
      || !SAFE_ID.test(
        unit.approvedPlannedAssetManifestEntryId,
      )
      || !SAFE_ID.test(unit.rendererLayerId)
    ) throw invalid(
      'cross_scene_or_work_item_substitution',
      `$.selectedSceneRequest.requestUnits.${unit.requestUnitId}`,
    )
    outputKeys.add(unit.outputKey)
  }
}

function assertIsolatedUnits(
  units:
    readonly LivingFrameControlledImageSelectedSceneRequestUnit[],
  frame: ConfirmedFrame,
): void {
  for (const unit of units) {
    if (
      unit.requestUnitState !== 'ready_for_exact_operation_binding'
      || unit.generationCanvas.canvasClass !==
        'isolated_component_square_1024'
      || unit.generationCanvas.widthPixels !== 1_024
      || unit.generationCanvas.heightPixels !== 1_024
      || unit.generationCanvas.finalOutputFrameWidthPixels
        !== frame.widthPixels
      || unit.generationCanvas.finalOutputFrameHeightPixels
        !== frame.heightPixels
      || unit.generationCanvas.finalCanvasCreatedByComfyUi
        !== false
    ) throw invalid(
      'isolated_component_boundary_invalid',
      `$.selectedSceneRequest.requestUnits.${unit.requestUnitId}`,
    )
  }
}

function assertInput(
  input:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'extensionId',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
      'admissionCandidate',
    ])
    || typeof input.extensionId !== 'string'
    || !SAFE_ID.test(input.extensionId)
    || !isRecord(input.selectedSceneRequest)
    || !isRecord(input.selectedSceneRequestInput)
    || !isRecord(input.admissionCandidate)
  ) throw invalid('input_invalid', '$')
}

function assertProjectionSemantics(
  draft:
    LivingFrameControlledImageFullFrameRatioExtensionDraft,
): void {
  const {
    fullFrameRatioExtensionCompilationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  const portraitCount =
    draft.fullFrameRequestUnits.filter((unit) =>
      unit.frameProfile.frameClass === 'portrait_9_16').length
  const landscapeCount =
    draft.fullFrameRequestUnits.filter((unit) =>
      unit.frameProfile.frameClass === 'landscape_16_9').length
  const customCount =
    draft.fullFrameRequestUnits.filter((unit) =>
      unit.frameProfile.frameClass ===
        'custom_or_other_confirmed_ratio').length
  if (
    draft.fullFrameRequestUnits.length < 1
    || new Set(
      draft.fullFrameRequestUnits.map((unit) =>
        unit.extensionUnitId),
    ).size !== draft.fullFrameRequestUnits.length
    || new Set(
      draft.fullFrameRequestUnits.map((unit) => unit.outputKey),
    ).size !== draft.fullFrameRequestUnits.length
    || draft.fullFrameRequestUnits.some((unit, order) =>
      unit.order !== order
      || !FULL_FRAME_COMPONENT_ROLES.has(unit.componentRole)
      || unit.frameProfile.widthPixels !==
        draft.confirmedFrameProfile.widthPixels
      || unit.frameProfile.heightPixels !==
        draft.confirmedFrameProfile.heightPixels
      || unit.frameProfile
        .confirmedOutputFrameExpectationDigestSha256 !==
          draft.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256
      || unit.frameProfile.squareSubstitutionApplied !== false
      || (
        !unit.frameProfile.confirmedFrameIsSquare
        && unit.frameProfile.widthPixels ===
          unit.frameProfile.heightPixels
      )
      || unit.sourceAssetPolicy
        .generatedAssetRemainsInputToRemotion !== true
      || unit.sourceAssetPolicy.remotionOwnsFinalComposition !== true
      || unit.attemptPolicy
        .oneRequestUnitConsumesOneGpuAttempt !== true
      || unit.attemptPolicy.outputBatchingAllowed !== false
      || unit.executableRequestCreated !== false
      || unit.runtimeExecuted !== false
      || unit.assetCreated !== false
      || unit.extensionUnitDigestSha256 !==
        digest(withoutUnitDigest(unit)))
    || draft.metrics.fullFrameRequestUnitCount !==
      draft.fullFrameRequestUnits.length
    || draft.metrics.isolatedRequestUnitCount !==
      draft.isolatedComponentBoundary.isolatedUnitCount
    || draft.metrics.portraitRequestUnitCount !== portraitCount
    || draft.metrics.landscapeRequestUnitCount !== landscapeCount
    || draft.metrics.customOrOtherRatioRequestUnitCount !==
      customCount
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_OPEN_GATES,
      )
    || draft.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
        draft.sourceBindings
          .recomputedConfirmedOutputFrameDigestSha256
    || draft.sourceBindings
      .runtimeConfinementRequirementDigestSha256 !==
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256
    || draft.runtimeSafetyExpectation
      .runtimeConfinementRequirementDigestSha256 !==
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256
    || draft.runtimeSafetyExpectation.deniedTopLevelImports.length
      !== 1
    || draft.runtimeSafetyExpectation.deniedTopLevelImports[0]
      !== 'sam2'
    || draft.runtimeSafetyExpectation.exactModelRoleCount !== 5
    || draft.runtimeSafetyExpectation
      .atomicFiveModelMountLifetimeRequired !== true
    || draft.runtimeSafetyExpectation
      .oneRequestUnitPerAttemptRequired !== true
    || !Number.isInteger(
      draft.operationExpectation
        .currentObservedProductionToolIdentityCount,
    )
    || draft.operationExpectation
      .currentObservedProductionToolIdentityCount < 1
    || draft.operationExpectation
      .currentObservedCountIsProductCap !== false
    || draft.operationExpectation.registryExpansionPermitted
      !== true
    || draft.operationExpectation
      .postAdmissionCountDerivedFromReleasedDistinctIdentities
        !== true
    || draft.operationExpectation
      .oneComfyUiIdentityForSharedGpuAttempt !== true
    || draft.operationExpectation
      .fakeIdentityForModelWeightAdapterOrLibraryAllowed
        !== false
    || draft.operationExpectation.qualificationOnly !== true
    || draft.operationExpectation.operationRegistered !== false
    || fullFrameRatioExtensionCompilationAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.selectedSceneRequestRevalidated !== true
    || draft.admissionCandidateRevalidated !== true
    || draft.confirmedOutputFrameRevalidated !== true
    || draft.fullFrameRatioExtensionImplemented !== true
    || draft.squareSubstitutionAllowed !== false
    || draft.finalCanvasClaimAllowed !== false
    || draft.executableRequestCreated !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.workerLeaseCreated !== false
    || draft.actualCostReceiptCreated !== false
    || draft.assetCreated !== false
    || draft.productionReady !== false
  ) throw invalid('authority_promotion_forbidden', '$')
}

function withoutUnitDigest(
  unit: LivingFrameControlledImageFullFrameRatioUnit,
): Omit<
  LivingFrameControlledImageFullFrameRatioUnit,
  'extensionUnitDigestSha256'
> {
  return Object.fromEntries(
    Object.entries(unit).filter(
      ([key]) => key !== 'extensionUnitDigestSha256',
    ),
  ) as Omit<
    LivingFrameControlledImageFullFrameRatioUnit,
    'extensionUnitDigestSha256'
  >
}

function assertSafe(value: unknown): void {
  const serialized = canonicalJson(value)
  if (
    URL_LIKE.test(serialized)
    || SECRET_LIKE.test(serialized)
    || serialized.includes('/Users/')
    || serialized.includes('/Volumes/')
    || serialized.includes('/private/tmp/')
    || serialized.includes('"rawPrompt"')
    || serialized.includes('"modelPath"')
    || serialized.includes('"modelUrl"')
    || serialized.includes('"modelFilename"')
  ) throw invalid('unsafe_projection_forbidden', '$')
}

function invalid(
  code: LivingFrameControlledImageFullFrameRatioIssueCode,
  path: string,
): LivingFrameControlledImageFullFrameRatioExtensionError {
  if (
    !(LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_ISSUE_CODES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown full-frame ratio extension issue.')
  return new LivingFrameControlledImageFullFrameRatioExtensionError([
    { code, path },
  ])
}

function greatestCommonDivisor(
  left: number,
  right: number,
): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value
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
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
