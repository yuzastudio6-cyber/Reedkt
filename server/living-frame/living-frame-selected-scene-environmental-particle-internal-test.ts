import {
  validateLivingFrameVisualContinuityPack,
} from '../../src/lib/living-frame/living-frame-visual-continuity-contract'
import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION,
  type LivingFrameEnvironmentalParticleInternalTestProfileBindingId,
  type LivingFrameSelectedSceneEnvironmentalParticleInternalTestExecution,
  type LivingFrameSelectedSceneEnvironmentalParticleInternalTestReportDraft,
} from '../../src/types/living-frame-selected-scene-environmental-particle-internal-test'
import type {
  LivingFrameEnvironmentalParticleAdmission,
} from '../../src/types/living-frame-selected-scene-environmental-particle-admission'
import type {
  LivingFrameEnvironmentalParticleProfileId,
} from '../../src/types/living-frame-environmental-particle-kernel'
import type {
  LivingFrameVisualContinuityPack,
} from '../../src/types/living-frame-visual-continuity'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from './living-frame-environmental-particle-kernel'
import {
  createLivingFrameEnvironmentalParticleOperationMaterialization,
} from './living-frame-environmental-particle-operation-materialization'
import {
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntimeWithPrivateSequenceOutput,
} from './living-frame-environmental-particle-pixijs-internal-runtime'
import {
  verifyLivingFrameEnvironmentalParticleAdmission,
  type InspectLivingFrameEnvironmentalParticleAdmissionInput,
} from './living-frame-selected-scene-environmental-particle-admission'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

const INTERNAL_TEST_PROFILE_BINDINGS:
  Readonly<Record<
    LivingFrameEnvironmentalParticleInternalTestProfileBindingId,
    LivingFrameEnvironmentalParticleProfileId
  >> = Object.freeze({
    'internal-test.environmental-particle.restrained-airborne-dust-settle.v1':
      'restrained_airborne_dust_settle_v1',
  })

export interface ExecuteLivingFrameSelectedSceneEnvironmentalParticleInternalTestInput {
  readonly qualificationId: string
  readonly admission:
    LivingFrameEnvironmentalParticleAdmission
  readonly admissionInput:
    InspectLivingFrameEnvironmentalParticleAdmissionInput
  readonly profileBindingId:
    LivingFrameEnvironmentalParticleInternalTestProfileBindingId
  readonly visualContinuityPack:
    LivingFrameVisualContinuityPack
  readonly sceneDesignSheetId: string
  readonly environmentSheetId: string
}

export async function executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticleInternalTestExecution> {
  assertInput(input)
  if (
    !await verifyLivingFrameEnvironmentalParticleAdmission(
      input.admission,
      input.admissionInput,
    )
  ) throw validationFailure('The selected-scene environmental admission could not be revalidated.')

  const continuityValidation =
    await validateLivingFrameVisualContinuityPack(
      input.visualContinuityPack,
    )
  if (!continuityValidation.ok) {
    throw validationFailure('The selected-scene Visual Continuity Pack is invalid.')
  }
  const visualContinuityPack =
    continuityValidation.pack
  const selectedScene =
    input.admissionInput.publication.binding
      .selectedComponent.scenePlans.find(
        (scene) =>
          scene.sceneId ===
            input.admission.canonicalScope.sceneId,
      )
  const sceneDesignSheet =
    visualContinuityPack.sceneDesignSheets.find(
      (sheet) =>
        sheet.sceneDesignSheetId ===
          input.sceneDesignSheetId,
    )
  const environmentSheet =
    visualContinuityPack.environmentSheets.find(
      (sheet) =>
        sheet.environmentSheetId ===
          input.environmentSheetId,
    )
  const canonicalBindings =
    visualContinuityPack.canonicalBindings
  const publicationBindings =
    input.admissionInput.publication.binding.sourceBindings
  if (
    selectedScene == null
    || sceneDesignSheet == null
    || environmentSheet == null
    || !sceneDesignSheet.environmentSheetIds.includes(
      environmentSheet.environmentSheetId,
    )
    || sceneDesignSheet.mode !== selectedScene.mode
    || canonicalBindings.workspaceId !==
      input.admission.canonicalScope.workspaceId
    || canonicalBindings.projectId !==
      input.admission.canonicalScope.projectId
    || canonicalBindings.editSessionId !==
      input.admission.canonicalScope.editSessionId
    || canonicalBindings
      .deferredLivingFrameComponentDigestSha256 !==
        input.admission.sourceBindings
          .livingFrameComponentDigestSha256
    || canonicalBindings.outputFrameDigestSha256 !==
      input.admission.sourceBindings
        .confirmedOutputFrameDigestSha256
    || publicationBindings
      .visualContinuityPackDigestSha256 !==
        visualContinuityPack.contractDigestSha256
  ) {
    throw validationFailure('The Visual Continuity Pack does not belong to the exact selected scene.')
  }

  const profileId =
    INTERNAL_TEST_PROFILE_BINDINGS[
      input.profileBindingId
    ]
  const exact =
    input.admission.exactFrameAndGeometryBinding
  const kernelInput:
    CompileLivingFrameEnvironmentalParticleKernelInput = {
      kernelCandidateId:
        `${input.qualificationId}.kernel`,
      profileId,
      sceneDesignSheetId:
        sceneDesignSheet.sceneDesignSheetId,
      environmentSheetId:
        environmentSheet.environmentSheetId,
      visualContinuityPack,
      frameBinding: {
        widthPixels: exact.widthPixels,
        heightPixels: exact.heightPixels,
        fps: exact.fps,
        startFrame: exact.startFrame,
        endFrameExclusive:
          exact.endFrameExclusive,
        emitterRect: { ...exact.rect },
        anchorPoint: {
          ...exact.anchorPoint,
        },
        confirmedOutputFrameDigestSha256:
          input.admission.sourceBindings
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          input.admission.sourceBindings
            .currentMasterTimingDigestSha256,
        serverSeedDigestSha256:
          input.admission.requiredPrimitiveContract
            .deterministicServerSeedDigestSha256,
        confirmedOutputFrameRevalidationRequired:
          true,
        masterTimingRevalidationRequired:
          true,
      },
    }
  const kernelCandidate =
    await compileLivingFrameEnvironmentalParticleKernel(
      kernelInput,
    )
  const materialization =
    await createLivingFrameEnvironmentalParticleOperationMaterialization({
      materializationCandidateId:
        `${input.qualificationId}.materialization`,
      kernelCandidate,
      kernelInput,
    })
  const pixiExecution =
    await executeLivingFrameEnvironmentalParticlePixiJsInternalRuntimeWithPrivateSequenceOutput({
      qualificationId:
        `${input.qualificationId}.pixijs`,
      materialization:
        materialization.receipt,
      privateRequestLease:
        materialization.privateRequestLease,
      kernelCandidate,
      kernelInput,
    })
  const pixiReport = pixiExecution.report
  if (
    pixiReport.sequenceIdentity.widthPixels !==
      exact.widthPixels
    || pixiReport.sequenceIdentity.heightPixels !==
      exact.heightPixels
    || pixiReport.sequenceIdentity.fps !== exact.fps
    || pixiReport.sequenceIdentity.startFrame !==
      exact.startFrame
    || pixiReport.sequenceIdentity
      .endFrameExclusive !==
        exact.endFrameExclusive
    || pixiReport.sequenceIdentity.frameImageCount !==
      exact.durationFrames
    || pixiReport.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
        input.admission.sourceBindings
          .confirmedOutputFrameDigestSha256
    || pixiReport.sourceBindings
      .masterTimingDigestSha256 !==
        input.admission.sourceBindings
          .currentMasterTimingDigestSha256
    || !pixiReport.aggregateMeasurement
      .firstFrameFullyTransparent
    || !pixiReport.aggregateMeasurement
      .lastFrameFullyTransparent
    || !pixiReport.aggregateMeasurement
      .temporalVariationPresent
    || !pixiReport.aggregateMeasurement
      .alphaCentroidMovementPresent
    || !pixiReport.runtimeIdentity
      .actualPackageEntrypointExecuted
    || !pixiReport.runtimeIdentity
      .oneRequestOneAttemptVerified
  ) {
    throw validationFailure('The PixiJS sequence diverged from the selected-scene environmental range.')
  }

  const draft:
    LivingFrameSelectedSceneEnvironmentalParticleInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_STATE,
      qualificationId: input.qualificationId,
      canonicalScope: {
        ...input.admission.canonicalScope,
      },
      sourceBindings: {
        environmentalAdmissionDigestSha256:
          input.admission.admissionDigestSha256,
        selectedSceneBindingDigestSha256:
          input.admission.sourceBindings
            .selectedSceneBindingDigestSha256,
        livingFrameComponentDigestSha256:
          input.admission.sourceBindings
            .livingFrameComponentDigestSha256,
        visualContinuityPackDigestSha256:
          visualContinuityPack
            .contractDigestSha256,
        currentMasterTimingDigestSha256:
          input.admission.sourceBindings
            .currentMasterTimingDigestSha256,
        timingBindingDigestSha256:
          input.admission.sourceBindings
            .timingBindingDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.admission.sourceBindings
            .confirmedOutputFrameDigestSha256,
        kernelCandidateDigestSha256:
          kernelCandidate
            .kernelCandidateDigestSha256,
        materializationDigestSha256:
          materialization.receipt
            .materializationDigestSha256,
        pixiJsRuntimeReportDigestSha256:
          pixiReport.reportDigestSha256,
        pixiJsSequenceDigestSha256:
          pixiExecution.privateSequenceOutputLease
            .sequenceDigestSha256,
      },
      explicitInternalProfileBinding: {
        profileBindingId:
          input.profileBindingId,
        profileId,
        source:
          'server_owned_private_internal_test_profile_binding_v1',
        componentSummaryParsingUsed: false,
        componentIdParsingUsed: false,
        subjectOrGenreRoutingUsed: false,
        canonicalProfileSelectionAuthority: false,
        productionProfileSelectionAuthority: false,
      },
      visualContinuityBinding: {
        sceneDesignSheetId:
          sceneDesignSheet.sceneDesignSheetId,
        environmentSheetId:
          environmentSheet.environmentSheetId,
        selectedSceneModeMatchesContinuitySceneMode:
          true,
        workspaceProjectEditSessionMatch: true,
        outputFrameDigestMatches: true,
        selectedComponentDigestMatches: true,
      },
      exactExecutionRange: {
        widthPixels: exact.widthPixels,
        heightPixels: exact.heightPixels,
        fps: exact.fps,
        startFrame: exact.startFrame,
        endFrameExclusive:
          exact.endFrameExclusive,
        durationFrames: exact.durationFrames,
        firstAndLastFramesTransparent: true,
        allFramesEmitted: true,
        temporalVariationPresent: true,
        alphaCentroidMovementPresent: true,
      },
      runtimeIdentity: {
        toolId: 'pixijs',
        operationId:
          'tool.pixijs.render_living_frame_environmental_particles.v1',
        packageName: 'pixi.js',
        packageVersion: '8.19.0',
        packageEntrypoint:
          'Application.init',
        actualPackageEntrypointExecuted: true,
        oneRequestOneAttemptVerified: true,
        exactSelectedSceneFrameRangeExecuted:
          true,
      },
      authorityBoundary: {
        privateInternalSelectedSceneQualificationAuthority:
          true,
        selectedSceneSelectionAuthority: false,
        environmentalProfileSelectionAuthority:
          false,
        timingMutationAuthority: false,
        operationRegistryAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        artifactAuthority: false,
        assetManifestAuthority: false,
        rendererAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        externalBetaAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_OPEN_GATES,
      selectedSceneBound: true,
      canonicalTimingBound: true,
      fullSelectedEnvironmentalRangeExecuted:
        true,
      remotionCompositeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsRawPngBytes: false,
      containsRawChatTranscriptMediaPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      internalTestReadyForRemotion: true,
      externalBetaReady: false,
      productionReady: false,
    }
  const report = deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
  return Object.freeze({
    report,
    pixiJsRuntimeReport:
      pixiExecution.report,
    privateSequenceOutputLease:
      pixiExecution.privateSequenceOutputLease,
  })
}

function assertInput(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleInternalTestInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'qualificationId',
      'admission',
      'admissionInput',
      'profileBindingId',
      'visualContinuityPack',
      'sceneDesignSheetId',
      'environmentSheetId',
    ])
    || typeof input.qualificationId !== 'string'
    || !SAFE_ID.test(input.qualificationId)
    || typeof input.sceneDesignSheetId !== 'string'
    || !SAFE_ID.test(input.sceneDesignSheetId)
    || typeof input.environmentSheetId !== 'string'
    || !SAFE_ID.test(input.environmentSheetId)
    || !Object.hasOwn(
      INTERNAL_TEST_PROFILE_BINDINGS,
      input.profileBindingId,
    )
    || !isRecord(input.admission)
    || !isRecord(input.admissionInput)
    || !isRecord(input.visualContinuityPack)
  ) throw validationFailure('The selected-scene environmental internal-test input is invalid.')
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|') ===
    [...keys].sort().join('|')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function validationFailure(message: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    message,
    400,
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
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
