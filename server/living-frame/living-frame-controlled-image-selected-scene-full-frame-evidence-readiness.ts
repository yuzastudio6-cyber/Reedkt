import { createHash } from 'node:crypto'

import type {
  CanonicalLivingFrameWorkGraphProjection,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  LivingFrameControlledImageFullFrameRatioComponentRole,
  LivingFrameControlledImageFullFrameRatioExtension,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceAuthority,
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssue,
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssueCode,
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness,
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessDraft,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_VERSION,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness'
import type {
  LivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-output-observation'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
} from './living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import {
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from './living-frame-controlled-image-full-frame-ratio-extension'
import {
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from './living-frame-controlled-image-selected-scene-private-output-observation'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const EXACT_FACT_SAFETY_MODES = new Set([
  'exact_geography_verification_required',
  'exact_data_verification_required',
  'documentary_source_verification_required',
])

const FULL_FRAME_ROLES =
  new Set<LivingFrameControlledImageFullFrameRatioComponentRole>(
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES,
  )

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceAuthority =
  deepFreeze({
    serverDerivedReadOnlyEvidenceReadinessAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
    documentaryFactAuthority: false,
    outputFrameAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    workerCompletionAuthority: false,
    runtimeAuthority: false,
    gpuAttemptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    artifactQaAuthority: false,
    continuityQaAuthority: false,
    sceneEvidencePackageAuthority: false,
    assetManifestAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput {
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly fullFrameRatioExtension:
    LivingFrameControlledImageFullFrameRatioExtension
  readonly fullFrameRatioExtensionInput:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput
  readonly privateOutputObservation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation
  readonly canonicalWorkGraphProjection:
    CanonicalLivingFrameWorkGraphProjection
}

export class LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssue[],
  ) {
    super(
      'Living Frame selected-scene full-frame evidence readiness projection failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessError'
    this.issues = issues
  }
}

export async function compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput,
): Promise<LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness> {
  await assertInput(input)
  const request = input.selectedSceneRequest
  const extension = input.fullFrameRatioExtension
  const observation = input.privateOutputObservation
  const alphaReconciliation =
    compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation({
      selectedSceneRequest: request,
      selectedSceneRequestInput: input.selectedSceneRequestInput,
      privateOutputObservation: observation,
      canonicalWorkGraphProjection:
        input.canonicalWorkGraphProjection,
    })
  if (
    alphaReconciliation.reconciliationState !==
      'not_applicable_to_confirmed_full_frame_plate'
    || observation.verifiedOutput.canvasClass !==
      'confirmed_full_frame_ratio'
    || observation.verifiedOutput.stillAlphaPipelineRequired
    || observation.verifiedOutput.sourceDisposition !==
      'opaque_full_frame_plate_requires_destination_continuity_and_documentary_fact_qa'
  ) {
    throw invalid(
      'full_frame_output_required',
      '$.privateOutputObservation.verifiedOutput',
    )
  }

  const requestUnitCandidates = request.requestUnits.filter(
    (unit) =>
      unit.requestUnitId ===
        observation.exactOutputLineage.requestUnitId
      && unit.componentId ===
        observation.exactOutputLineage.componentId
      && unit.outputKey ===
        observation.exactOutputLineage.outputKey
      && unit.approvedWorkItemId ===
        observation.exactOutputLineage.approvedWorkItemId
      && unit.approvedWorkItemKey ===
        observation.exactOutputLineage.approvedWorkItemKey
      && unit.approvedPlannedAssetManifestEntryId ===
        observation.exactOutputLineage
          .approvedPlannedAssetManifestEntryId
      && unit.rendererLayerId ===
        observation.exactOutputLineage.rendererLayerId,
  )
  if (requestUnitCandidates.length !== 1) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.privateOutputObservation.exactOutputLineage',
    )
  }
  const requestUnit = requestUnitCandidates[0]!
  if (!FULL_FRAME_ROLES.has(
    requestUnit.componentRole as
      LivingFrameControlledImageFullFrameRatioComponentRole,
  )) {
    throw invalid(
      'full_frame_output_required',
      '$.selectedSceneRequest.requestUnits',
    )
  }
  const extensionUnitCandidates =
    extension.fullFrameRequestUnits.filter(
      (unit) =>
        unit.selectedSceneRequestUnitId ===
          requestUnit.requestUnitId
        && unit.selectedSceneRequestUnitDigestSha256 ===
          requestUnit.requestUnitDigestSha256
        && unit.sceneId === requestUnit.sceneId
        && unit.componentId === requestUnit.componentId
        && unit.assetIntentId === requestUnit.assetIntentId
        && unit.outputKey === requestUnit.outputKey
        && unit.approvedWorkItemId ===
          requestUnit.approvedWorkItemId
        && unit.approvedWorkItemKey ===
          requestUnit.approvedWorkItemKey
        && unit.approvedPlannedAssetManifestEntryId ===
          requestUnit.approvedPlannedAssetManifestEntryId
        && unit.rendererLayerId === requestUnit.rendererLayerId,
    )
  if (extensionUnitCandidates.length !== 1) {
    throw invalid(
      'full_frame_ratio_unit_missing',
      '$.fullFrameRatioExtension.fullFrameRequestUnits',
    )
  }
  const extensionUnit = extensionUnitCandidates[0]!
  assertFrameLineage(input, extensionUnit)
  const generatedAssetIntentId =
    alphaReconciliation.exactOutputLineage.generatedAssetIntentId
  if (
    !alphaReconciliation.workGraphEvidence
      .generationWorkItemMatched
    || !alphaReconciliation.workGraphEvidence
      .generationOutputMatched
    || !alphaReconciliation.workGraphEvidence
      .exactGeneratedAssetIntentMatched
    || generatedAssetIntentId == null
    || generatedAssetIntentId !== requestUnit.assetIntentId
  ) {
    throw invalid(
      'generation_output_lineage_missing',
      '$.canonicalWorkGraphProjection.workItems',
    )
  }

  const continuityRequired =
    request.sourceBindings.visualContinuityPackDigestSha256 !== null
  const factRequired = EXACT_FACT_SAFETY_MODES.has(
    request.selectedSceneSummary.sourceTruthMode,
  )
  const draft:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_CLASS,
      readinessState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_STATE,
      readinessId:
        `lf-selected-full-frame-evidence.${digest({
          observation: observation.observationDigestSha256,
          extension: extension.extensionDigestSha256,
          workGraph:
            input.canonicalWorkGraphProjection
              .projectionDigestSha256,
        }).slice(0, 40)}`,
      canonicalScope: observation.canonicalScope,
      exactOutputLineage: {
        componentId: requestUnit.componentId,
        componentRole:
          requestUnit.componentRole as
            LivingFrameControlledImageFullFrameRatioComponentRole,
        materializationUnitId:
          observation.exactOutputLineage.materializationUnitId,
        requestUnitId: requestUnit.requestUnitId,
        extensionUnitId: extensionUnit.extensionUnitId,
        outputKey: requestUnit.outputKey,
        approvedWorkItemId: requestUnit.approvedWorkItemId,
        approvedWorkItemKey: requestUnit.approvedWorkItemKey,
        generatedAssetIntentId,
        approvedPlannedAssetManifestEntryId:
          requestUnit.approvedPlannedAssetManifestEntryId,
        rendererLayerId: requestUnit.rendererLayerId,
        outputCandidateId:
          observation.verifiedOutput.outputCandidateId,
      },
      sourceBindings: {
        operationRequestReceiptDigestSha256:
          observation.sourceBindings
            .operationRequestReceiptDigestSha256,
        privateOperationRequestDigestSha256:
          observation.sourceBindings
            .privateOperationRequestDigestSha256,
        promptMaterializationDigestSha256:
          observation.sourceBindings
            .promptMaterializationDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          request.requestBindingDigestSha256,
        fullFrameRatioExtensionDigestSha256:
          extension.extensionDigestSha256,
        privateOutputObservationDigestSha256:
          observation.observationDigestSha256,
        alphaWorkChainReconciliationDigestSha256:
          alphaReconciliation.reconciliationDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          input.canonicalWorkGraphProjection
            .projectionDigestSha256,
        approvedSnapshotId:
          observation.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          observation.sourceBindings
            .approvedSnapshotHashSha256,
        selectedSceneBindingDigestSha256:
          observation.sourceBindings
            .selectedSceneBindingDigestSha256,
        visualContinuityPackDigestSha256:
          observation.sourceBindings
            .visualContinuityPackDigestSha256,
        currentMasterTimingDigestSha256:
          observation.sourceBindings
            .currentMasterTimingDigestSha256,
        controlledIllustrationCostWorkBindingDigestSha256:
          observation.sourceBindings
            .controlledIllustrationCostWorkBindingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          observation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
      },
      confirmedFrameBinding: {
        frameClass: extensionUnit.frameProfile.frameClass,
        confirmedAspectRatioLabel:
          extensionUnit.frameProfile.confirmedAspectRatioLabel,
        widthPixels: extensionUnit.frameProfile.widthPixels,
        heightPixels: extensionUnit.frameProfile.heightPixels,
        pixelCount: extensionUnit.frameProfile.pixelCount,
        confirmedFrameIsSquare:
          extensionUnit.frameProfile.confirmedFrameIsSquare,
        dimensionsDerivedOnlyFromConfirmedOutputFrame: true,
        sourceGenerationCanvasMatchesConfirmedRatio: true,
        callerSelectedDimensionsAllowed: false,
        squareSubstitutionApplied: false,
        distortionAllowed: false,
      },
      canonicalArtifactCandidate: {
        artifactId:
          observation.verifiedOutput.outputCandidateId,
        artifactDigestSha256:
          observation.verifiedOutput.contentSha256,
        contentType: 'image/png',
        byteLength: observation.verifiedOutput.byteLength,
        decodedRgbaDigestSha256:
          observation.verifiedOutput.decodedRgbaSha256,
        sceneEvidenceArtifactKind: 'opaque_raster',
        expectedAssetRole: 'generated',
        privateCreateOnlyPersistenceRequired: true,
        bytesDeliveredOutOfBandOnly: true,
        rawBytesIncluded: false,
      },
      destinationEvidenceExpectation: {
        sourceTruthMode:
          request.selectedSceneSummary.sourceTruthMode,
        continuityRequirement: continuityRequired
          ? 'required_by_approved_visual_continuity_pack'
          : 'canonical_continuity_revalidation_then_not_applicable',
        documentaryFactRequirement: factRequired
          ? 'required_by_source_truth_mode'
          : 'canonical_source_truth_revalidation_then_not_applicable',
        continuityReferenceArtifactRequired:
          continuityRequired,
        continuityMeasurementRequired: continuityRequired,
        maskArtifactRequired: false,
        alphaMeasurementRequired: false,
        alphaEdgeDecontaminationRequired: false,
        temporalMaskMeasurementRequired: false,
        destinationAlphaCompositeMeasurementRequired: false,
        fullFramePlateMayEnterRembg: false,
        fullFramePlateMayReplaceRemotionFinalCanvas: false,
      },
      canonicalOwnerBindings: {
        privateImagePersistenceOwner:
          'persistCanonicalPrivateImageArtifact',
        artifactQaAuthorityVersion:
          'private-artifact-qa-authority-aggregate-v1',
        requiredArtifactQaGateIds: [
          'asset_received_gate',
          'asset_quality_gate',
        ],
        visualContinuityMeasurementContractVersion:
          'living-frame-visual-continuity-measurement-v1',
        sceneEvidencePackageContractVersion:
          'living-frame-scene-evidence-package-v1',
        documentaryFactSafetyOwner:
          'documentaryFactSafetyPlan',
        approvedAssetManifestOwner:
          'canonical_approved_asset_manifest',
        privateReviewOwner:
          'canonical_private_review_assembly_service',
        finalCanvasOwner: 'remotion',
      },
      evidenceReadiness: {
        exactSelectedGenerationOutputBound: true,
        exactConfirmedFrameRatioBound: true,
        alphaWorkChainCorrectlyNotApplicable: true,
        privateArtifactPersisted: false,
        artifactQaPassed: false,
        continuityReferenceResolved: false,
        continuityMeasurementPassed: false,
        documentaryFactSafetyRevalidated: false,
        sceneEvidencePackageCompiled: false,
        assetManifestReconciled: false,
        privateReviewReady: false,
        remotionCompositionReady: false,
      },
      fixedRuntimeLineage: {
        expectedCanonicalToolId: 'comfyui',
        expectedCanonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        processEntrypointKind:
          observation.fixedRuntimeLineage.processEntrypointKind,
        runtimeConfinementRequirementDigestSha256:
          observation.fixedRuntimeLineage
            .runtimeConfinementRequirementDigestSha256,
        deniedTopLevelImports: ['sam2'],
        nonRootRequired: true,
        readOnlyRootFilesystemRequired: true,
        allLinuxCapabilitiesDroppedRequired: true,
        noNewPrivilegesRequired: true,
        externalNetworkAllowed: false,
        runtimeDownloadsAllowed: false,
        exactModelArtifactCount: 5,
        exactModelArtifactByteLength: 11_700_367_157,
        allFiveModelRolesMountedReadOnlyForAttempt: true,
        allFiveModelRolesVerifiedBeforeAndAfterInference: true,
        oneProcessPerAttemptRequired: true,
        oneRequestUnitPerAttemptRequired: true,
        oneImagePerAttemptRequired: true,
      },
      costAndRegistryPolicy: {
        sharedGpuCapabilityRoles: [
          'comfyui_host',
          'controlnet_aux_preprocessing',
          'controlnet_conditioning',
          'generic_ip_adapter_conditioning',
          'lora_adapter_loading',
        ],
        comfyUiGpuAttemptMustNotBeChargedAgain: true,
        fiveGpuCapabilitiesCreateOneAttemptCostEvent: true,
        auraFaceCpuMeasurementExcluded: true,
        currentObservedCountIsProductCap: false,
        registryExpansionPermitted: true,
        postAdmissionCountDerivedFromReleasedDistinctIdentities:
          true,
        fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
          false,
        actualCostAmountIncluded: false,
        customerPriceOrCreditIncluded: false,
        serviceFeeIncluded: false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneRequestRevalidated: true,
      fullFrameRatioExtensionRevalidated: true,
      privateOutputObservationRevalidated: true,
      canonicalWorkGraphRevalidated: true,
      currentSnapshotTimingFrameCostAndWorkLineageMatched: true,
      canonicalWorkGraphMutated: false,
      persistenceExecuted: false,
      qaExecuted: false,
      sceneEvidencePackageCompiled: false,
      assetManifestMutated: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    readinessDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput,
): Promise<boolean> {
  try {
    const expected =
      await compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
        input,
      )
    return (
      isRecord(value)
      && typeof value.readinessDigestSha256 === 'string'
      && SHA256.test(value.readinessDigestSha256)
      && value.readinessDigestSha256 ===
        digest(withoutDigest(value))
      && canonicalJson(value) === canonicalJson(expected)
    )
  } catch {
    return false
  }
}

async function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput,
): Promise<void> {
  if (
    !input
    || !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  ) {
    throw invalid(
      'selected_scene_request_invalid',
      '$.selectedSceneRequest',
    )
  }
  if (
    !await verifyLivingFrameControlledImageFullFrameRatioExtension(
      input.fullFrameRatioExtension,
      input.fullFrameRatioExtensionInput,
    )
  ) {
    throw invalid(
      'full_frame_ratio_extension_invalid',
      '$.fullFrameRatioExtension',
    )
  }
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
      input.privateOutputObservation,
    )
  ) {
    throw invalid(
      'output_observation_invalid',
      '$.privateOutputObservation',
    )
  }
  if (
    input.fullFrameRatioExtensionInput.selectedSceneRequest
      .requestBindingDigestSha256 !==
      input.selectedSceneRequest.requestBindingDigestSha256
    || input.fullFrameRatioExtensionInput.selectedSceneRequestInput
      .requestBindingId !==
      input.selectedSceneRequestInput.requestBindingId
    || input.fullFrameRatioExtensionInput.selectedSceneRequestInput
      .sceneId !== input.selectedSceneRequestInput.sceneId
    || input.fullFrameRatioExtensionInput.selectedSceneRequestInput
      .workGraphProjection.projectionDigestSha256 !==
      input.canonicalWorkGraphProjection.projectionDigestSha256
    || input.selectedSceneRequestInput.workGraphProjection
      .projectionDigestSha256 !==
      input.canonicalWorkGraphProjection.projectionDigestSha256
  ) {
    throw invalid('input_invalid', '$')
  }
  const request = input.selectedSceneRequest
  const extension = input.fullFrameRatioExtension
  const observation = input.privateOutputObservation
  if (
    canonicalJson(request.canonicalScope) !==
      canonicalJson(extension.canonicalScope)
    || canonicalJson(request.canonicalScope) !==
      canonicalJson(observation.canonicalScope)
    || request.requestBindingDigestSha256 !==
      extension.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || request.requestBindingDigestSha256 !==
      observation.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || extension.extensionDigestSha256 !==
      observation.sourceBindings
        .fullFrameRatioExtensionDigestSha256
    || request.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
      input.canonicalWorkGraphProjection.projectionDigestSha256
    || observation.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
      input.canonicalWorkGraphProjection.projectionDigestSha256
    || request.sourceBindings.approvedSnapshotId !==
      observation.sourceBindings.approvedSnapshotId
    || request.sourceBindings.approvedSnapshotHashSha256 !==
      observation.sourceBindings.approvedSnapshotHashSha256
    || request.sourceBindings.selectedSceneBindingDigestSha256 !==
      observation.sourceBindings.selectedSceneBindingDigestSha256
    || request.sourceBindings
      .visualContinuityPackDigestSha256 !==
      observation.sourceBindings
        .visualContinuityPackDigestSha256
    || request.sourceBindings.currentMasterTimingDigestSha256 !==
      observation.sourceBindings.currentMasterTimingDigestSha256
    || request.sourceBindings
      .controlledIllustrationCostWorkBindingDigestSha256 !==
      observation.sourceBindings
        .controlledIllustrationCostWorkBindingDigestSha256
    || request.sourceBindings.outputFrameExpectationDigestSha256 !==
      observation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.sourceBindings',
    )
  }
}

function assertFrameLineage(
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput,
  extensionUnit:
    LivingFrameControlledImageFullFrameRatioExtension['fullFrameRequestUnits'][number],
): void {
  const observation = input.privateOutputObservation
  const extension = input.fullFrameRatioExtension
  const profile = extensionUnit.frameProfile
  if (
    profile.widthPixels !==
      extension.confirmedFrameProfile.widthPixels
    || profile.heightPixels !==
      extension.confirmedFrameProfile.heightPixels
    || profile.pixelCount !==
      extension.confirmedFrameProfile.pixelCount
    || profile.confirmedOutputFrameExpectationDigestSha256 !==
      extension.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
    || observation.verifiedOutput.widthPixels !==
      profile.widthPixels
    || observation.verifiedOutput.heightPixels !==
      profile.heightPixels
    || observation.verifiedOutput.opaquePixelCount !==
      profile.pixelCount
  ) {
    const squareSubstitution =
      observation.verifiedOutput.widthPixels ===
        observation.verifiedOutput.heightPixels
      && !profile.confirmedFrameIsSquare
    throw invalid(
      squareSubstitution
        ? 'square_full_frame_substitution_forbidden'
        : 'confirmed_frame_ratio_mismatch',
      '$.privateOutputObservation.verifiedOutput',
    )
  }
  if (
    profile.squareSubstitutionApplied
    || profile.distortionAllowed
    || profile.callerSelectedDimensionsAllowed
    || profile.finalCanvasCreatedByComfyUi
  ) {
    throw invalid(
      'square_full_frame_substitution_forbidden',
      '$.fullFrameRatioExtension.fullFrameRequestUnits',
    )
  }
}

function assertSafe(
  draft:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessDraft,
): void {
  const {
    serverDerivedReadOnlyEvidenceReadinessAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    !SAFE_ID.test(draft.readinessId)
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_OPEN_GATES,
      )
    || serverDerivedReadOnlyEvidenceReadinessAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.canonicalArtifactCandidate.sceneEvidenceArtifactKind !==
      'opaque_raster'
    || draft.destinationEvidenceExpectation.maskArtifactRequired
    || draft.destinationEvidenceExpectation.alphaMeasurementRequired
    || draft.destinationEvidenceExpectation
      .alphaEdgeDecontaminationRequired
    || draft.destinationEvidenceExpectation
      .temporalMaskMeasurementRequired
    || draft.destinationEvidenceExpectation
      .destinationAlphaCompositeMeasurementRequired
    || draft.destinationEvidenceExpectation
      .fullFramePlateMayEnterRembg
    || draft.destinationEvidenceExpectation
      .fullFramePlateMayReplaceRemotionFinalCanvas
    || !draft.evidenceReadiness
      .exactSelectedGenerationOutputBound
    || !draft.evidenceReadiness.exactConfirmedFrameRatioBound
    || !draft.evidenceReadiness
      .alphaWorkChainCorrectlyNotApplicable
    || draft.evidenceReadiness.privateArtifactPersisted
    || draft.evidenceReadiness.artifactQaPassed
    || draft.evidenceReadiness.continuityReferenceResolved
    || draft.evidenceReadiness.continuityMeasurementPassed
    || draft.evidenceReadiness
      .documentaryFactSafetyRevalidated
    || draft.evidenceReadiness.sceneEvidencePackageCompiled
    || draft.evidenceReadiness.assetManifestReconciled
    || draft.evidenceReadiness.privateReviewReady
    || draft.evidenceReadiness.remotionCompositionReady
    || draft.canonicalWorkGraphMutated
    || draft.persistenceExecuted
    || draft.qaExecuted
    || draft.sceneEvidencePackageCompiled
    || draft.assetManifestMutated
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.productionReady
    || containsUnsafeKeyOrValue(draft)
  ) {
    throw invalid('unsafe_readiness_projection_forbidden', '$')
  }
}

function containsUnsafeKeyOrValue(value: unknown): boolean {
  const deniedKeys = new Set([
    'bytes',
    'path',
    'url',
    'credential',
    'secret',
    'prompt',
    'seed',
    'modelAlias',
    'command',
    'environment',
    'actualCostMicros',
    'price',
    'credits',
    'serviceFeeAmount',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walk(value, (key, child) => {
    if (deniedKeys.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) unsafe = true
  })
  return unsafe
}

function walk(
  value: unknown,
  visit: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walk(child, visit))
    return
  }
  if (!isRecord(value)) return
  for (const [key, child] of Object.entries(value)) {
    visit(key, child)
    walk(child, visit)
  }
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const clone = structuredClone(value)
  delete clone.readinessDigestSha256
  return clone
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [
          key,
          canonicalize(child),
        ]),
    )
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) deepFreeze(child)
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

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessError {
  if (
    !(LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_ISSUE_CODES as
      readonly string[]).includes(code)
  ) throw new Error('Unknown full-frame evidence readiness issue.')
  return new LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessError([
    { code, path },
  ])
}
