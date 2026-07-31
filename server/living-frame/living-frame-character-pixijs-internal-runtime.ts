import {
  createHash,
} from 'node:crypto'
import {
  spawn,
} from 'node:child_process'
import {
  constants,
} from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  rm,
  writeFile,
} from 'node:fs/promises'
import {
  tmpdir,
} from 'node:os'
import {
  dirname,
  join,
} from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION,
  LIVING_FRAME_CHARACTER_PIXIJS_PRIVATE_SEQUENCE_LEASE_VERSION,
  type LivingFrameCharacterPixiJsInternalConfinementEvidence,
  type LivingFrameCharacterPixiJsInternalFrameMeasurement,
  type LivingFrameCharacterPixiJsInternalImageEvidence,
  type LivingFrameCharacterPixiJsInternalRuntimeExecution,
  type LivingFrameCharacterPixiJsInternalRuntimeReport,
  type LivingFrameCharacterPixiJsInternalRuntimeReportDraft,
  type LivingFrameCharacterPixiJsPrivateSequenceLease,
  type LivingFrameCharacterPixiJsPrivateSequenceOutput,
} from '../../src/types/living-frame-character-pixijs-internal-runtime'
import {
  ApiError,
} from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  inspectExistingOfflineBrowserGraphicsDockerRuntime,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-docker-runtime'
import type {
  OfflineBrowserGraphicsImageEvidence,
} from '../tool-execution/browser-graphics-execution/offline-browser-graphics-types'
import {
  createPrivateDockerCliInvocation,
} from '../tool-execution/private-docker-cli'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'
import {
  compileLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'
import {
  materializeLivingFrameMusashiBlenderTexturePrivateFixture,
} from './living-frame-musashi-blender-texture-private-fixture'

const IMAGE_TAG =
  'reeditpro-living-frame-character-pixijs-qualification:private-local-v1' as const
const ENTRYPOINT = [
  'node',
  '/app/living-frame-character-pixijs-runner.mjs',
] as const
const REQUEST_VERSION =
  'living-frame-character-pixijs-internal-request-v1' as const
const CONTAINER_VERSION =
  'living-frame-character-pixijs-internal-container-v1' as const
const OPERATION =
  'tool.pixijs.render_pixi_scene.v1' as const
const QUALIFICATION_ID =
  'lf-character-pixijs-musashi-whole-character-private-v2' as const
const WIDTH = 640 as const
const HEIGHT = 360 as const
const FPS = 30 as const
const START_FRAME = 0 as const
const END_FRAME_EXCLUSIVE = 120 as const
const FRAME_COUNT = 120 as const
const COMPONENT_PIVOT_X = 320 as const
const COMPONENT_PIVOT_Y = 180 as const
const DESTINATION_PIVOT_X = 320 as const
const DESTINATION_PIVOT_Y = 180 as const
const SUBJECT_ANCHOR_X = 445 as const
const SUBJECT_ANCHOR_Y = 180 as const
const FACE_REGION = {
  regionId: 'musashi.face',
  role: 'face',
  x: 390,
  y: 42,
  width: 86,
  height: 90,
} as const
const SOURCE_FILES = [
  'Dockerfile.template',
  'browser-operation.ts',
  'build-bundle.mjs',
  'runner.mjs',
] as const
const TIMEOUT_MS = 10 * 60_000
const MAXIMUM_REQUEST_BYTES = 16 * 1024 * 1024
const MAXIMUM_OUTPUT_BYTES = 256 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/u

interface DockerInspect {
  readonly Image?: unknown
  readonly State?: unknown
  readonly HostConfig?: unknown
  readonly Mounts?: unknown
  readonly Config?: unknown
  readonly RootFS?: unknown
  readonly Id?: unknown
  readonly Os?: unknown
  readonly Architecture?: unknown
}

interface HostResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

interface RuntimeRequestDraft {
  readonly schemaVersion: typeof REQUEST_VERSION
  readonly requestClass:
    'server_derived_private_internal_character_rigid_cutout_request'
  readonly toolId: 'pixijs'
  readonly operationId: typeof OPERATION
  readonly sourceBindings: {
    readonly sceneId: 'scene.musashi-strike'
    readonly componentId:
      'musashi.whole-character'
    readonly sourceArtifactId:
      'lf.animation-aware-illustration.musashi.whole-character.v1'
    readonly sourceArtifactDigestSha256: string
    readonly characterAnimationRouteDecisionDigestSha256: string
  }
  readonly renderCanvas: {
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly fps: typeof FPS
    readonly startFrame: typeof START_FRAME
    readonly endFrameExclusive:
      typeof END_FRAME_EXCLUSIVE
    readonly durationFrames: typeof FRAME_COUNT
    readonly backgroundMode: 'transparent'
    readonly alphaMode: 'straight_alpha_png'
    readonly finalVideoCanvas: false
  }
  readonly componentAsset: {
    readonly artifactId:
      'lf.animation-aware-illustration.musashi.whole-character.v1'
    readonly contentType: 'image/png'
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly byteLength: number
    readonly sha256: string
    readonly pngBase64: string
    readonly pivotXPixels:
      typeof COMPONENT_PIVOT_X
    readonly pivotYPixels:
      typeof COMPONENT_PIVOT_Y
  }
  readonly protectedRegions:
    readonly [typeof FACE_REGION]
  readonly frameSamples:
    readonly RuntimeFrameSample[]
  readonly policy: {
    readonly serverOwnedTemplateId:
      'living_frame_character_rigid_cutout_v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly oneRequestOneAttempt: true
    readonly networkAllowed: false
    readonly callerCodeAllowed: false
    readonly callerAssetsAllowed: false
    readonly serverBoundComponentAsset: true
    readonly arbitrarySaveOrPreviewAllowed: false
    readonly generateNewPixels: false
    readonly remotionOwnsFinalComposition: true
    readonly selectedSceneAdmissionAllowed:
      true
    readonly operationRegistered: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly productionReady: false
  }
}

interface RuntimeRequest
  extends RuntimeRequestDraft {
  readonly requestDigestSha256: string
}

interface RuntimeFrameSample {
  readonly order: number
  readonly absoluteFrame: number
  readonly pivotPositionXPixels:
    typeof DESTINATION_PIVOT_X
  readonly pivotPositionYPixels:
    typeof DESTINATION_PIVOT_Y
  readonly rotationDegrees: number
  readonly scale: 1
  readonly opacity: 1
}

interface RuntimeFrameOutput {
  readonly order: number
  readonly absoluteFrame: number
  readonly bytesBase64: string
  readonly byteLength: number
  readonly sha256: string
  readonly nonTransparentPixelCount: number
}

interface RuntimeResponse {
  readonly schemaVersion: typeof CONTAINER_VERSION
  readonly ok: true
  readonly status:
    'actual_private_internal_pixijs_character_rigid_cutout_sequence_completed'
  readonly toolId: 'pixijs'
  readonly operationId: typeof OPERATION
  readonly requestDigestSha256: string
  readonly packageIdentity: {
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
  }
  readonly renderIdentity: {
    readonly widthPixels: typeof WIDTH
    readonly heightPixels: typeof HEIGHT
    readonly fps: typeof FPS
    readonly startFrame: typeof START_FRAME
    readonly endFrameExclusive:
      typeof END_FRAME_EXCLUSIVE
    readonly frameImageCount:
      typeof FRAME_COUNT
    readonly frameImageContentType: 'image/png'
    readonly alphaMode: 'straight_alpha'
    readonly finalVideoCanvas: false
  }
  readonly frames:
    readonly RuntimeFrameOutput[]
  readonly semanticEvidence: {
    readonly actualPackageEntrypointExecuted: true
    readonly entrypoint: 'Application.init'
    readonly stageRendered: true
    readonly transparentCanvasRequested: true
    readonly rigidPivotApplied: true
    readonly exactFrameDimensionsVerified: true
    readonly rgbaColorTypeVerified: true
    readonly everyFrameContainsComponentPixels: true
    readonly sourcePoseRestoredExactly: true
    readonly temporalVariationPresent: true
    readonly uniqueFrameDigestCount: number
    readonly zeroNetworkVerified: true
    readonly oneRequestOneAttemptVerified: true
    readonly privatePngSequenceProduced: true
  }
  readonly networkRequestCount: 0
  readonly readiness: {
    readonly privateInternalQualificationOnly: true
    readonly operationRegistered: false
    readonly canonicalDispatchIntegrated: false
    readonly artifactPersisted: false
    readonly qaApproved: false
    readonly productReady: false
    readonly externalBetaReady: false
    readonly productionReady: false
  }
}

const outputLeases = new WeakSet<object>()
const consumedOutputLeases =
  new WeakSet<object>()
const privateOutputs = new WeakMap<
  object,
  LivingFrameCharacterPixiJsPrivateSequenceOutput
>()

export async function executeLivingFrameCharacterPixiJsInternalRuntime():
Promise<LivingFrameCharacterPixiJsInternalRuntimeExecution> {
  if (arguments.length !== 0) {
    throw validationFailure(
      'Character PixiJS internal runtime accepts no caller input.',
    )
  }
  const fixture =
    await materializeLivingFrameMusashiBlenderTexturePrivateFixture()
  try {
    const routeDecision =
      compileLivingFrameCharacterAnimationRouteDecision({
        evidenceId:
          'evidence.musashi.whole-character-pixijs-runtime',
        sceneId: 'scene.musashi-strike',
        componentId:
          'musashi.whole-character',
        sourceArtifactId:
          fixture.wholeCharacterComponent
            .artifactId,
        illustrativeNotArchivalEvidence: true,
        componentTopology:
          'single_rigid_cutout',
        requestedMotionMagnitude: 'restrained',
        desiredPoseRequiresNewPixels: false,
        sourcePoseOccludesProtectedFace: false,
        upperArmSeparated: false,
        forearmSeparated: false,
        handSeparated: false,
        propSeparated: false,
        exactJointPivotsReviewed: true,
        hiddenJointArtworkReconstructed:
          true,
        deformableMeshTopologyReviewed:
          false,
        skinWeightMapReviewed: false,
        referenceIdentityAvailable: true,
        poseControlAvailable: true,
        deterministicRigidPivotAvailable:
          true,
        componentMotionExposesHiddenSourcePixels:
          true,
        exposedSourcePlateReconstructedAndReviewed:
          true,
        componentBoundaryDecontaminatedAndReviewed:
          true,
        protectedFaceMotionPathReviewed:
          true,
        motionPathClearsProtectedFace:
          true,
        componentAttachmentContinuityReviewed:
          true,
        flatMeshDeformationSufficient:
          false,
        continuousNaturalMotionRequired:
          false,
        rawChatPromptPathUrlModelCodeOrBytesIncluded:
          false,
      })
    if (
      routeDecision.decision.selectedRoute !==
        'pixijs_rigid_cutout'
      || routeDecision.decision.selectedToolId !==
        'pixijs'
      || routeDecision.decision.selectedOperationId !==
        OPERATION
      || routeDecision.decision
        .controlledComponentPreparationRequired !==
          false
      || routeDecision.decision
        .downstreamRouteAfterPreparation !==
          null
    ) {
      throw validationFailure(
        'Musashi whole-character PixiJS route is not qualified.',
      )
    }
    const rejectedSwordArmRouteDecision =
      compileLivingFrameCharacterAnimationRouteDecision({
        ...routeDecision.evidence,
        evidenceId:
          'evidence.musashi.sword-arm-rejected-runtime',
        componentId:
          'musashi.sword-arm',
        sourceArtifactId:
          fixture.swordArmComponent
            .artifactId,
        componentTopology:
          'merged_limb_hand_clothing_and_prop_cutout',
        sourcePoseOccludesProtectedFace:
          true,
        hiddenJointArtworkReconstructed:
          false,
        exposedSourcePlateReconstructedAndReviewed:
          false,
        componentBoundaryDecontaminatedAndReviewed:
          false,
        motionPathClearsProtectedFace:
          false,
      })
    if (
      rejectedSwordArmRouteDecision
        .decision.selectedRoute !==
          'comfyui_controlled_component_preparation'
      || rejectedSwordArmRouteDecision
        .decision
        .controlledComponentPreparationRequired !==
          true
      || rejectedSwordArmRouteDecision
        .decision
        .downstreamRouteAfterPreparation !==
          'pixijs_rigid_cutout'
    ) {
      throw validationFailure(
        'Musashi articulated sword action did not fail closed to controlled component preparation.',
      )
    }
    const request = compileRuntimeRequest({
      fixture,
      routeDecisionDigestSha256:
        routeDecision
          .decisionDigestSha256,
    })
    const serializedRequest =
      stableAuthorityStringify(request)
    if (
      Buffer.byteLength(
        serializedRequest,
        'utf8',
      ) > MAXIMUM_REQUEST_BYTES
    ) {
      throw validationFailure(
        'Character PixiJS request exceeds its ceiling.',
      )
    }
    const image =
      await prepareLivingFrameCharacterPixiJsInternalImage()
    const execution =
      await runQualificationContainer({
        image,
        serializedRequest,
      })
    if (
      execution.exitCode !== 0
      || execution.oomKilled
      || execution.stderr.trim()
    ) {
      throw runtimeFailure(
        `Character PixiJS qualification failed: ${execution.stderr.trim() || execution.stdout.slice(-500)}`,
      )
    }
    const response =
      validateRuntimeResponse(
        JSON.parse(
          execution.stdout,
        ) as unknown,
        request,
      )
    const {
      measurements,
      decodedFrames,
    } = measureFrames(
      response.frames,
    )
    const aggregate =
      compileAggregate(
        measurements,
        decodedFrames,
      )
    const reportDraft:
      LivingFrameCharacterPixiJsInternalRuntimeReportDraft = {
        contractVersion:
          LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION,
        resultClass:
          LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS,
        runtimeState:
          LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE,
        qualificationId:
          QUALIFICATION_ID,
        sourceBindings: {
          sceneId: 'scene.musashi-strike',
          componentId:
            'musashi.whole-character',
          sourceArtifactId:
            fixture.wholeCharacterComponent
              .artifactId,
          sourceArtifactDigestSha256:
            fixture.wholeCharacterComponent
              .sha256,
          characterAnimationRouteDecisionDigestSha256:
            routeDecision
              .decisionDigestSha256,
          rejectedSwordArmRouteDecisionDigestSha256:
            rejectedSwordArmRouteDecision
              .decisionDigestSha256,
          runtimeRequestDigestSha256:
            request.requestDigestSha256,
        },
        runtimeIdentity: {
          toolId: 'pixijs',
          operationId: OPERATION,
          packageName: 'pixi.js',
          packageVersion: '8.19.0',
          packageEntrypoint:
            'Application.init',
          actualPackageEntrypointExecuted:
            true,
          fixedSupervisedEntrypointExecuted:
            true,
          oneRequestOneAttemptVerified:
            true,
          zeroNetworkVerified: true,
        },
        renderIdentity: {
          widthPixels: WIDTH,
          heightPixels: HEIGHT,
          fps: FPS,
          startFrame: START_FRAME,
          endFrameExclusive:
            END_FRAME_EXCLUSIVE,
          frameImageCount: FRAME_COUNT,
          backgroundMode: 'transparent',
          alphaMode: 'straight_alpha',
          finalVideoCanvas: false,
          remotionOwnsFinalCanvas: true,
        },
        imageEvidence: image,
        confinementEvidence:
          execution.confinement,
        frameMeasurements:
          measurements,
        aggregateQa: aggregate,
        selectedSceneSuitability: {
          selectedRoute:
            'pixijs_rigid_cutout',
          routeState:
            'qualified_private_pixijs_route',
          pixiJsWholeCharacterAdmissionAllowed:
            true,
          componentRuntimeMechanicsPassed:
            true,
          supportedMotionIntent:
            'restrained_whole_character_drift',
          articulatedSwordActionSupported:
            false,
          articulatedSwordActionRoute:
            'comfyui_controlled_component_preparation',
          articulatedSwordActionFailureCodes: [
            'unreconstructed_hidden_source_plate',
            'component_boundary_not_professionally_prepared',
            'current_motion_path_intersects_protected_face',
          ],
          controlledComponentPreparationRequired:
            true,
          downstreamRouteAfterPreparation:
            'pixijs_rigid_cutout',
          remotionWholeCharacterCompositeMayProceed:
            true,
        },
        authorityBoundary: {
          privateInternalRuntimeEvidenceAuthority:
            true,
          selectedSceneAuthority: false,
          approvedSnapshotAuthority: false,
          masterTimingAuthority: false,
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
          publicDeliveryAuthority: false,
          productionAuthority: false,
        },
        operationRegistered: false,
        canonicalDispatchIntegrated: false,
        artifactPersisted: false,
        assetManifestMutated: false,
        rendererMutated: false,
        canonicalQaApproved: false,
        privateReviewApproved: false,
        actualCostCreated: false,
        customerCharged: false,
        publicDeliveryReady: false,
        productionReady: false,
      }
    const report:
      LivingFrameCharacterPixiJsInternalRuntimeReport =
        Object.freeze({
          ...reportDraft,
          reportDigestSha256:
            sha256AuthorityValue(
              reportDraft,
            ),
        })
    const privateFrames =
      response.frames.map((frame) =>
        Object.freeze({
          order: frame.order,
          absoluteFrame:
            frame.absoluteFrame,
          pngBytes: new Uint8Array(
            Buffer.from(
              frame.bytesBase64,
              'base64',
            ),
          ),
          pngByteLength:
            frame.byteLength,
          pngDigestSha256: frame.sha256,
        }))
    const sequenceDigestSha256 =
      sha256AuthorityValue(
        privateFrames.map((frame) => ({
          order: frame.order,
          absoluteFrame:
            frame.absoluteFrame,
          pngByteLength:
            frame.pngByteLength,
          pngDigestSha256:
            frame.pngDigestSha256,
        })),
      )
    const privateOutput:
      LivingFrameCharacterPixiJsPrivateSequenceOutput =
        Object.freeze({
          qualificationId:
            QUALIFICATION_ID,
          reportDigestSha256:
            report.reportDigestSha256,
          sequenceDigestSha256,
          widthPixels: WIDTH,
          heightPixels: HEIGHT,
          fps: FPS,
          startFrame: START_FRAME,
          endFrameExclusive:
            END_FRAME_EXCLUSIVE,
          frames:
            Object.freeze(privateFrames),
        })
    const lease =
      Object.freeze({
        contractVersion:
          LIVING_FRAME_CHARACTER_PIXIJS_PRIVATE_SEQUENCE_LEASE_VERSION,
        leaseId:
          `lf-character-pixijs-sequence.${sequenceDigestSha256.slice(0, 40)}`,
        qualificationId:
          QUALIFICATION_ID,
        reportDigestSha256:
          report.reportDigestSha256,
        sequenceDigestSha256,
        frameImageCount: FRAME_COUNT,
        processBound: true,
        singleUse: true,
        containsRawPngBytes: false,
        containsPathUrlCredentialCommandOrEnvironment:
          false,
        dispatchAuthority: false,
        artifactAuthority: false,
        assetManifestAuthority: false,
        rendererAuthority: false,
        qaApprovalAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        productionAuthority: false,
      } satisfies LivingFrameCharacterPixiJsPrivateSequenceLease)
    outputLeases.add(lease)
    privateOutputs.set(
      lease,
      privateOutput,
    )
    return Object.freeze({
      report,
      privateSequenceOutputLease:
        lease,
    })
  } finally {
    await fixture.cleanup()
  }
}

export function consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease(
  lease:
    LivingFrameCharacterPixiJsPrivateSequenceLease,
): LivingFrameCharacterPixiJsPrivateSequenceOutput {
  if (
    !isRecord(lease)
    || !outputLeases.has(lease)
    || consumedOutputLeases.has(lease)
  ) {
    throw validationFailure(
      'Character PixiJS private sequence lease is invalid or consumed.',
    )
  }
  const output = privateOutputs.get(lease)
  if (
    output == null
    || lease.contractVersion !==
      LIVING_FRAME_CHARACTER_PIXIJS_PRIVATE_SEQUENCE_LEASE_VERSION
    || lease.qualificationId !==
      output.qualificationId
    || lease.reportDigestSha256 !==
      output.reportDigestSha256
    || lease.sequenceDigestSha256 !==
      output.sequenceDigestSha256
    || lease.frameImageCount !==
      output.frames.length
    || lease.processBound !== true
    || lease.singleUse !== true
    || lease.containsRawPngBytes !== false
    || lease
      .containsPathUrlCredentialCommandOrEnvironment !==
        false
    || lease.dispatchAuthority
    || lease.artifactAuthority
    || lease.assetManifestAuthority
    || lease.rendererAuthority
    || lease.qaApprovalAuthority
    || lease.costAuthority
    || lease.billingAuthority
    || lease.productionAuthority
  ) {
    throw validationFailure(
      'Character PixiJS private sequence lineage is invalid.',
    )
  }
  consumedOutputLeases.add(lease)
  privateOutputs.delete(lease)
  return Object.freeze({
    ...output,
    frames: Object.freeze(
      output.frames.map((frame) =>
        Object.freeze({
          ...frame,
          pngBytes:
            new Uint8Array(
              frame.pngBytes,
            ),
        })),
    ),
  })
}

function compileRuntimeRequest(input: {
  readonly fixture:
    Awaited<
      ReturnType<
        typeof materializeLivingFrameMusashiBlenderTexturePrivateFixture
      >
    >
  readonly routeDecisionDigestSha256:
    string
}): RuntimeRequest {
  const draft: RuntimeRequestDraft = {
    schemaVersion: REQUEST_VERSION,
    requestClass:
      'server_derived_private_internal_character_rigid_cutout_request',
    toolId: 'pixijs',
    operationId: OPERATION,
    sourceBindings: {
      sceneId: 'scene.musashi-strike',
      componentId:
        'musashi.whole-character',
      sourceArtifactId:
        input.fixture
          .wholeCharacterComponent
          .artifactId,
      sourceArtifactDigestSha256:
        input.fixture
          .wholeCharacterComponent
          .sha256,
      characterAnimationRouteDecisionDigestSha256:
        input
          .routeDecisionDigestSha256,
    },
    renderCanvas: {
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      fps: FPS,
      startFrame: START_FRAME,
      endFrameExclusive:
        END_FRAME_EXCLUSIVE,
      durationFrames: FRAME_COUNT,
      backgroundMode: 'transparent',
      alphaMode: 'straight_alpha_png',
      finalVideoCanvas: false,
    },
    componentAsset: {
      artifactId:
        input.fixture
          .wholeCharacterComponent
          .artifactId,
      contentType: 'image/png',
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      byteLength:
        input.fixture
          .wholeCharacterComponent
          .byteLength,
      sha256:
        input.fixture
          .wholeCharacterComponent
          .sha256,
      pngBase64:
        input.fixture
          .wholeCharacterComponent
          .pngBytes.toString('base64'),
      pivotXPixels: COMPONENT_PIVOT_X,
      pivotYPixels: COMPONENT_PIVOT_Y,
    },
    protectedRegions: [FACE_REGION],
    frameSamples: Array.from(
      { length: FRAME_COUNT },
      (_, order) => ({
        order,
        absoluteFrame: order,
        pivotPositionXPixels:
          DESTINATION_PIVOT_X,
        pivotPositionYPixels:
          DESTINATION_PIVOT_Y,
        rotationDegrees:
          rotationAtFrame(order),
        scale: 1,
        opacity: 1,
      }),
    ),
    policy: {
      serverOwnedTemplateId:
        'living_frame_character_rigid_cutout_v1',
      packageName: 'pixi.js',
      packageVersion: '8.19.0',
      packageEntrypoint:
        'Application.init',
      oneRequestOneAttempt: true,
      networkAllowed: false,
      callerCodeAllowed: false,
      callerAssetsAllowed: false,
      serverBoundComponentAsset: true,
      arbitrarySaveOrPreviewAllowed:
        false,
      generateNewPixels: false,
      remotionOwnsFinalComposition:
        true,
      selectedSceneAdmissionAllowed:
        true,
      operationRegistered: false,
      dispatchAuthority: false,
      artifactAuthority: false,
      costAuthority: false,
      billingAuthority: false,
      productionReady: false,
    },
  }
  return {
    ...draft,
    requestDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function rotationAtFrame(
  frame: number,
): number {
  const keyframes = [
    [0, 0],
    [28, 0],
    [52, -0.8],
    [82, -0.2],
    [119, 0],
  ] as const
  for (
    let index = 1;
    index < keyframes.length;
    index += 1
  ) {
    const previous =
      keyframes[index - 1]!
    const next = keyframes[index]!
    if (frame <= next[0]) {
      const progress =
        (frame - previous[0])
        / (next[0] - previous[0])
      const eased =
        progress * progress
        * (3 - 2 * progress)
      return Number((
        previous[1]
        + (next[1] - previous[1])
        * eased
      ).toFixed(6))
    }
  }
  return 0
}

function validateRuntimeResponse(
  value: unknown,
  request: RuntimeRequest,
): RuntimeResponse {
  const response = record(value)
  const packageIdentity =
    record(response.packageIdentity)
  const renderIdentity =
    record(response.renderIdentity)
  const semantic =
    record(response.semanticEvidence)
  const readiness =
    record(response.readiness)
  const frames = array(response.frames)
  if (
    response.schemaVersion !==
      CONTAINER_VERSION
    || response.ok !== true
    || response.status !==
      'actual_private_internal_pixijs_character_rigid_cutout_sequence_completed'
    || response.toolId !== 'pixijs'
    || response.operationId !==
      OPERATION
    || response.requestDigestSha256 !==
      request.requestDigestSha256
    || packageIdentity.packageName !==
      'pixi.js'
    || packageIdentity.packageVersion !==
      '8.19.0'
    || packageIdentity.packageEntrypoint !==
      'Application.init'
    || renderIdentity.widthPixels !== WIDTH
    || renderIdentity.heightPixels !==
      HEIGHT
    || renderIdentity.fps !== FPS
    || renderIdentity.startFrame !==
      START_FRAME
    || renderIdentity.endFrameExclusive !==
      END_FRAME_EXCLUSIVE
    || renderIdentity.frameImageCount !==
      FRAME_COUNT
    || renderIdentity.frameImageContentType !==
      'image/png'
    || renderIdentity.alphaMode !==
      'straight_alpha'
    || renderIdentity.finalVideoCanvas !==
      false
    || frames.length !== FRAME_COUNT
    || semantic
      .actualPackageEntrypointExecuted !==
        true
    || semantic.entrypoint !==
      'Application.init'
    || semantic.stageRendered !== true
    || semantic
      .transparentCanvasRequested !==
        true
    || semantic.rigidPivotApplied !==
      true
    || semantic
      .exactFrameDimensionsVerified !==
        true
    || semantic.rgbaColorTypeVerified !==
      true
    || semantic
      .everyFrameContainsComponentPixels !==
        true
    || semantic.sourcePoseRestoredExactly !==
      true
    || semantic.temporalVariationPresent !==
      true
    || Number(
      semantic.uniqueFrameDigestCount,
    ) < 8
    || semantic.zeroNetworkVerified !==
      true
    || semantic.oneRequestOneAttemptVerified !==
      true
    || semantic.privatePngSequenceProduced !==
      true
    || response.networkRequestCount !== 0
    || readiness
      .privateInternalQualificationOnly !==
        true
    || readiness.operationRegistered !==
      false
    || readiness
      .canonicalDispatchIntegrated !==
        false
    || readiness.artifactPersisted !==
      false
    || readiness.qaApproved !== false
    || readiness.productReady !== false
    || readiness.externalBetaReady !==
      false
    || readiness.productionReady !== false
  ) {
    throw runtimeFailure(
      'Character PixiJS response evidence is invalid.',
    )
  }
  return value as RuntimeResponse
}

function measureFrames(
  frames: readonly RuntimeFrameOutput[],
): {
  readonly measurements:
    readonly LivingFrameCharacterPixiJsInternalFrameMeasurement[]
  readonly decodedFrames:
    readonly Uint8Array[]
} {
  const baselineFaceCoverage: {
    value?: number
  } = {}
  const decodedFrames:
    Uint8Array[] = []
  const measurements =
    frames.map((frame, order) => {
      if (
        !isRecord(frame)
        || frame.order !== order
        || frame.absoluteFrame !== order
        || typeof frame.bytesBase64 !==
          'string'
        || !Number.isSafeInteger(
          frame.byteLength,
        )
        || typeof frame.sha256 !==
          'string'
        || !SHA256.test(frame.sha256)
        || !Number.isSafeInteger(
          frame.nonTransparentPixelCount,
        )
      ) {
        throw runtimeFailure(
          'Character PixiJS frame envelope is invalid.',
        )
      }
      const bytes = Buffer.from(
        frame.bytesBase64,
        'base64',
      )
      if (
        bytes.byteLength !==
          frame.byteLength
        || bytes.toString('base64') !==
          frame.bytesBase64
        || digestBytes(bytes) !==
          frame.sha256
      ) {
        throw runtimeFailure(
          'Character PixiJS frame bytes are invalid.',
        )
      }
      const decoded =
        decodeLivingFrameEnvironmentalParticleRgbaPng(
          bytes,
        )
      if (
        decoded.width !== WIDTH
        || decoded.height !== HEIGHT
        || decoded.rgba.byteLength !==
          WIDTH * HEIGHT * 4
      ) {
        throw runtimeFailure(
          'Character PixiJS frame dimensions are invalid.',
        )
      }
      decodedFrames.push(decoded.rgba)
      const nonTransparentPixelCount =
        countAlphaPixels(
          decoded.rgba,
          {
            x: 0,
            y: 0,
            width: WIDTH,
            height: HEIGHT,
          },
        )
      const subjectAnchorAlphaPixelCount =
        countAlphaPixels(
          decoded.rgba,
          {
            x:
              SUBJECT_ANCHOR_X - 18,
            y:
              SUBJECT_ANCHOR_Y - 18,
            width: 36,
            height: 36,
          },
        )
      const protectedFaceAlphaPixelCount =
        countAlphaPixels(
          decoded.rgba,
          FACE_REGION,
        )
      if (order === 0) {
        baselineFaceCoverage.value =
          protectedFaceAlphaPixelCount
      }
      const baseline =
        baselineFaceCoverage.value
      const subjectAnchorCoveragePassed =
        subjectAnchorAlphaPixelCount >
          20
      const protectedFaceRegionBoundedRelativeToSourceComponent =
        baseline != null
        && protectedFaceAlphaPixelCount <=
          baseline + 600
      if (
        nonTransparentPixelCount !==
          frame.nonTransparentPixelCount
        || nonTransparentPixelCount < 1_000
        || !subjectAnchorCoveragePassed
        || !protectedFaceRegionBoundedRelativeToSourceComponent
      ) {
        throw runtimeFailure(
          `Character PixiJS semantic frame QA failed at frame ${order}.`,
        )
      }
      return {
        order,
        absoluteFrame: order,
        pngDigestSha256: frame.sha256,
        pngByteLength:
          frame.byteLength,
        decodedRgbaDigestSha256:
          digestBytes(decoded.rgba),
        nonTransparentPixelCount,
        subjectAnchorAlphaPixelCount,
        protectedFaceAlphaPixelCount,
        subjectAnchorCoveragePassed:
          true as const,
        protectedFaceRegionBoundedRelativeToSourceComponent:
          true as const,
      }
    })
  return {
    measurements,
    decodedFrames,
  }
}

function compileAggregate(
  frames:
    readonly LivingFrameCharacterPixiJsInternalFrameMeasurement[],
  decodedFrames:
    readonly Uint8Array[],
): LivingFrameCharacterPixiJsInternalRuntimeReportDraft['aggregateQa'] {
  const first = frames[0]
  const last = frames.at(-1)
  const middleIndex = 52
  const middle = frames[middleIndex]
  const firstDecoded =
    decodedFrames[0]
  const middleDecoded =
    decodedFrames[middleIndex]
  const unique =
    new Set(
      frames.map((frame) =>
        frame.pngDigestSha256),
    ).size
  if (
    first == null
    || last == null
    || middle == null
    || firstDecoded == null
    || middleDecoded == null
    || frames.length !== FRAME_COUNT
    || first.pngDigestSha256 !==
      last.pngDigestSha256
    || unique < 8
    || frames.some((frame) =>
      !frame.subjectAnchorCoveragePassed
      || !frame
        .protectedFaceRegionBoundedRelativeToSourceComponent)
  ) {
    throw runtimeFailure(
      'Character PixiJS aggregate sequence evidence is insufficient.',
    )
  }
  const middlePoseDifferentPixelCount =
    differentRgbaPixelCount(
      firstDecoded,
      middleDecoded,
    )
  const maximumProtectedFaceAlphaPixelIncrease =
    Math.max(
      ...frames.map((frame) =>
        frame.protectedFaceAlphaPixelCount
        - first.protectedFaceAlphaPixelCount),
    )
  if (
    middlePoseDifferentPixelCount < 1_000
    || maximumProtectedFaceAlphaPixelIncrease >
      600
  ) {
    throw runtimeFailure(
      'Character PixiJS motion or face-path evidence is insufficient.',
    )
  }
  return {
    everyPngDecodedFromBytes: true,
    everyFrameExactDimension: true,
    everyFrameContainsOnlyComponentPixels:
      true,
    sourcePoseRestoredExactly: true,
    temporalVariationPresent: true,
    subjectAnchorCoverageContinuous: true,
    protectedFaceRegionBoundedRelativeToSourceComponent:
      true,
    uniqueFramePngDigestCount: unique,
    middlePoseDifferentPixelCount,
    maximumProtectedFaceAlphaPixelIncrease,
  }
}

function countAlphaPixels(
  rgba: Uint8Array,
  region: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  },
): number {
  let count = 0
  for (
    let y = region.y;
    y < region.y + region.height;
    y += 1
  ) {
    for (
      let x = region.x;
      x < region.x + region.width;
      x += 1
    ) {
      if (
        x >= 0
        && x < WIDTH
        && y >= 0
        && y < HEIGHT
        && rgba[
          (y * WIDTH + x) * 4 + 3
        ]! > 0
      ) {
        count += 1
      }
    }
  }
  return count
}

function differentRgbaPixelCount(
  left: Uint8Array,
  right: Uint8Array,
): number {
  if (
    left.byteLength !==
      right.byteLength
  ) {
    throw runtimeFailure(
      'Character PixiJS decoded frame sizes diverged.',
    )
  }
  let count = 0
  for (
    let offset = 0;
    offset < left.byteLength;
    offset += 4
  ) {
    if (
      left[offset] !== right[offset]
      || left[offset + 1] !==
        right[offset + 1]
      || left[offset + 2] !==
        right[offset + 2]
      || left[offset + 3] !==
        right[offset + 3]
    ) {
      count += 1
    }
  }
  return count
}

export async function prepareLivingFrameCharacterPixiJsInternalImage():
Promise<LivingFrameCharacterPixiJsInternalImageEvidence> {
  const base =
    await inspectExistingOfflineBrowserGraphicsDockerRuntime()
  const sourceDigestSha256 =
    await sourceDigest()
  try {
    return await inspectQualificationImage({
      base,
      sourceDigestSha256,
    })
  } catch {
    // Rebuild only when the fixed source or immutable base differs.
  }
  const buildContext =
    await mkdtemp(join(
      tmpdir(),
      'reeditpro-lf-character-pixijs-',
    ))
  try {
    const relative =
      'docker/qualification/living-frame-character-pixijs'
    const target =
      join(buildContext, relative)
    await mkdir(target, {
      recursive: true,
      mode: 0o700,
    })
    for (const file of SOURCE_FILES) {
      if (
        file === 'Dockerfile.template'
      ) continue
      await copyBoundedFile(
        join(sourceDirectory(), file),
        join(target, file),
      )
    }
    const template =
      await readBoundedText(
        join(
          sourceDirectory(),
          'Dockerfile.template',
        ),
        64 * 1024,
      )
    const dockerfile = template
      .replaceAll(
        '__BASE_IMAGE_ID__',
        base.imageTag,
      )
      .replaceAll(
        '__BASE_IDENTITY_HASH__',
        base.imageIdentityHash,
      )
      .replaceAll(
        '__SOURCE_DIGEST__',
        sourceDigestSha256,
      )
    if (dockerfile.includes('__')) {
      throw runtimeFailure(
        'Character PixiJS Dockerfile contains an unresolved token.',
      )
    }
    await writeFile(
      join(target, 'Dockerfile'),
      dockerfile,
      {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx',
      },
    )
    const built = await runDocker([
      'build',
      '--pull=false',
      '--progress=plain',
      '--tag',
      IMAGE_TAG,
      '--file',
      `${relative}/Dockerfile`,
      '.',
    ], {
      cwd: buildContext,
      timeoutMs: 20 * 60_000,
      maxBytes: 32 * 1024 * 1024,
    })
    if (
      built.exitCode !== 0
    ) {
      throw runtimeFailure(
        `Character PixiJS image build failed: ${`${built.stderr}\n${built.stdout}`.trim().slice(-4_000)}`,
      )
    }
    return await inspectQualificationImage({
      base,
      sourceDigestSha256,
    })
  } finally {
    await rm(buildContext, {
      recursive: true,
      force: true,
    }).catch(() => undefined)
  }
}

async function inspectQualificationImage(input: {
  readonly base:
    OfflineBrowserGraphicsImageEvidence
  readonly sourceDigestSha256: string
}): Promise<LivingFrameCharacterPixiJsInternalImageEvidence> {
  const result = await runDocker([
    'image',
    'inspect',
    IMAGE_TAG,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 8 * 1024 * 1024,
  })
  if (
    result.exitCode !== 0
    || result.stderr.trim()
  ) {
    throw runtimeFailure(
      'Character PixiJS qualification image is unavailable.',
    )
  }
  const parsed =
    JSON.parse(result.stdout) as unknown
  if (
    !Array.isArray(parsed)
    || parsed.length !== 1
  ) {
    throw runtimeFailure(
      'Character PixiJS image inspect is invalid.',
    )
  }
  const inspect = record(parsed[0])
  const config = record(inspect.Config)
  const root = record(inspect.RootFS)
  const labels =
    stringRecord(config.Labels)
  const entrypoint =
    stringArray(config.Entrypoint)
  const environmentNames =
    extractEnvironmentNames(
      stringArray(config.Env),
    )
  const layers =
    stringArray(root.Layers)
  if (
    inspect.Os !== 'linux'
    || typeof inspect.Architecture !==
      'string'
    || typeof inspect.Id !== 'string'
    || config.User !== '10001:10001'
    || config.WorkingDir !== '/app'
    || stableAuthorityStringify(
      entrypoint,
    ) !== stableAuthorityStringify(
      ENTRYPOINT,
    )
    || labels[
      'com.reeditpro.runner.protocol'
    ] !== CONTAINER_VERSION
    || labels[
      'com.reeditpro.runner.base-image-identity-hash'
    ] !== input.base.imageIdentityHash
    || labels[
      'com.reeditpro.runner.source-digest'
    ] !== input.sourceDigestSha256
    || labels[
      'com.reeditpro.runner.private-internal-only'
    ] !== 'true'
    || labels[
      'com.reeditpro.runner.qualification-only'
    ] !== 'true'
    || labels[
      'com.reeditpro.runner.operation-registered'
    ] !== 'false'
    || labels[
      'com.reeditpro.runner.product-ready'
    ] !== 'false'
    || labels[
      'com.reeditpro.runner.external-beta-ready'
    ] !== 'false'
    || labels[
      'com.reeditpro.runner.production-ready'
    ] !== 'false'
    || secretLikeEnvironmentNames(
      environmentNames,
    ).length > 0
    || layers.length < 2
  ) {
    throw runtimeFailure(
      'Character PixiJS image identity is invalid.',
    )
  }
  return {
    imageTag: IMAGE_TAG,
    imageId: inspect.Id,
    imageIdentityHash:
      sha256AuthorityValue({
        imageId: inspect.Id,
        baseImageId:
          input.base.imageId,
        baseImageIdentityHash:
          input.base
            .imageIdentityHash,
        sourceDigestSha256:
          input.sourceDigestSha256,
        architecture:
          inspect.Architecture,
        entrypoint,
        environmentNames,
        layers,
        labels,
      }),
    baseImageId: input.base.imageId,
    baseImageIdentityHash:
      input.base.imageIdentityHash,
    sourceDigestSha256:
      input.sourceDigestSha256,
    architecture:
      inspect.Architecture,
    imageUser: '10001:10001',
    imageEntrypoint: ENTRYPOINT,
    imageEnvironmentNames:
      environmentNames,
    rootFilesystemLayerDigests:
      layers,
    labels,
  }
}

async function runQualificationContainer(input: {
  readonly image:
    LivingFrameCharacterPixiJsInternalImageEvidence
  readonly serializedRequest: string
}): Promise<HostResult & {
  readonly oomKilled: boolean
  readonly confinement:
    LivingFrameCharacterPixiJsInternalConfinementEvidence
}> {
  const created = await runDocker([
    'create',
    '--interactive',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--pids-limit',
    '256',
    '--memory',
    '2g',
    '--memory-swap',
    '2g',
    '--cpus',
    '2',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=536870912',
    '--shm-size',
    '268435456',
    '--user',
    '10001:10001',
    input.image.imageId,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 64 * 1024,
  })
  if (
    created.exitCode !== 0
    || created.stderr.trim()
  ) {
    throw runtimeFailure(
      'Character PixiJS container could not be created.',
    )
  }
  const containerId =
    created.stdout.trim()
  if (!/^[a-f0-9]{64}$/u.test(
    containerId,
  )) {
    throw runtimeFailure(
      'Docker returned an invalid character PixiJS container identity.',
    )
  }
  try {
    const confinement =
      validateConfinement(
        await inspectContainer(
          containerId,
        ),
        input.image,
      )
    const started = await runDocker([
      'start',
      '--attach',
      '--interactive',
      containerId,
    ], {
      input:
        `${input.serializedRequest}\n`,
      timeoutMs: TIMEOUT_MS,
      maxBytes: MAXIMUM_OUTPUT_BYTES,
    })
    const after =
      await inspectContainer(containerId)
    const state = record(after.State)
    if (
      state.Status !== 'exited'
      || state.Running !== false
      || state.ExitCode !==
        started.exitCode
      || typeof state.OOMKilled !==
        'boolean'
    ) {
      throw runtimeFailure(
        'Character PixiJS container exit state is inconsistent.',
      )
    }
    return {
      ...started,
      oomKilled: state.OOMKilled,
      confinement,
    }
  } finally {
    await runDocker([
      'rm',
      '--force',
      containerId,
    ], {
      timeoutMs: TIMEOUT_MS,
      maxBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

function validateConfinement(
  inspect: DockerInspect,
  image:
    LivingFrameCharacterPixiJsInternalImageEvidence,
): LivingFrameCharacterPixiJsInternalConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop)
  const security =
    stringArray(host.SecurityOpt)
  const tmpfs =
    stringRecord(host.Tmpfs)
  const tokens = new Set(
    String(tmpfs['/tmp'] ?? '')
      .split(','),
  )
  const mounts = array(inspect.Mounts)
  const binds =
    host.Binds == null
      ? []
      : array(host.Binds)
  const command =
    config.Cmd == null
      ? []
      : array(config.Cmd)
  const environmentNames =
    extractEnvironmentNames(
      stringArray(config.Env),
    )
  if (
    inspect.Image !== image.imageId
    || host.NetworkMode !== 'none'
    || host.ReadonlyRootfs !== true
    || host.Privileged !== false
    || caps.length !== 1
    || caps[0] !== 'ALL'
    || !security.some((value) =>
      value.startsWith(
        'no-new-privileges',
      ))
    || Number(host.PidsLimit) !==
      256
    || Number(host.Memory) !==
      2_147_483_648
    || Number(host.MemorySwap) !==
      2_147_483_648
    || Number(host.NanoCpus) !==
      2_000_000_000
    || Number(host.ShmSize) !==
      268_435_456
    || config.User !==
      '10001:10001'
    || command.length > 0
    || mounts.length > 0
    || binds.length > 0
    || !tokens.has('rw')
    || !tokens.has('noexec')
    || !tokens.has('nosuid')
    || !tokens.has('nodev')
    || !tokens.has(
      'size=536870912',
    )
    || stableAuthorityStringify(
      environmentNames,
    ) !== stableAuthorityStringify(
      image.imageEnvironmentNames,
    )
    || secretLikeEnvironmentNames(
      environmentNames,
    ).length > 0
  ) {
    throw runtimeFailure(
      'Character PixiJS container confinement is invalid.',
    )
  }
  return {
    networkMode: 'none',
    readOnlyRootFilesystem: true,
    capDropAll: true,
    noNewPrivileges: true,
    privileged: false,
    pidsLimit: 256,
    memoryLimitBytes: 2_147_483_648,
    memoryAndSwapLimitBytes:
      2_147_483_648,
    nanoCpus: 2_000_000_000,
    tmpfsPath: '/tmp',
    tmpfsSizeBytes: 536_870_912,
    tmpfsNoExec: true,
    tmpfsNoSuid: true,
    tmpfsNoDevice: true,
    shmSizeBytes: 268_435_456,
    user: '10001:10001',
    callerCommandPresent: false,
    callerBindsPresent: false,
    callerMountsPresent: false,
    callerEnvironmentPresent: false,
    secretLikeImageEnvironmentNames:
      [],
  }
}

async function sourceDigest():
Promise<string> {
  const hashes:
    Record<string, string> = {}
  for (const file of SOURCE_FILES) {
    hashes[file] =
      digestBytes(
        await readBoundedBuffer(
          join(
            sourceDirectory(),
            file,
          ),
          4 * 1024 * 1024,
        ),
      )
  }
  return sha256AuthorityValue(hashes)
}

async function copyBoundedFile(
  source: string,
  target: string,
): Promise<void> {
  const stat = await lstat(source)
  if (
    stat.isSymbolicLink()
    || !stat.isFile()
    || stat.size < 1
    || stat.size >
      4 * 1024 * 1024
  ) {
    throw runtimeFailure(
      'Character PixiJS build input is invalid.',
    )
  }
  await mkdir(dirname(target), {
    recursive: true,
    mode: 0o700,
  })
  await copyFile(
    source,
    target,
    constants.COPYFILE_EXCL,
  )
}

async function readBoundedText(
  path: string,
  maximumBytes: number,
): Promise<string> {
  return (
    await readBoundedBuffer(
      path,
      maximumBytes,
    )
  ).toString('utf8')
}

async function readBoundedBuffer(
  path: string,
  maximumBytes: number,
): Promise<Buffer> {
  const handle = await open(
    path,
    constants.O_RDONLY
      | constants.O_NOFOLLOW,
  )
  try {
    const stat = await handle.stat()
    if (
      !stat.isFile()
      || stat.size < 1
      || stat.size > maximumBytes
    ) {
      throw runtimeFailure(
        'Character PixiJS source file is invalid.',
      )
    }
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function inspectContainer(
  containerId: string,
): Promise<DockerInspect> {
  const result = await runDocker([
    'inspect',
    containerId,
  ], {
    timeoutMs: TIMEOUT_MS,
    maxBytes: 8 * 1024 * 1024,
  })
  if (
    result.exitCode !== 0
    || result.stderr.trim()
  ) {
    throw runtimeFailure(
      'Character PixiJS container inspect failed.',
    )
  }
  const parsed =
    JSON.parse(result.stdout) as unknown
  if (
    !Array.isArray(parsed)
    || parsed.length !== 1
  ) {
    throw runtimeFailure(
      'Character PixiJS container inspect is invalid.',
    )
  }
  return parsed[0] as DockerInspect
}

function runDocker(
  args: readonly string[],
  options: {
    readonly cwd?: string
    readonly input?: string
    readonly timeoutMs: number
    readonly maxBytes: number
  },
): Promise<HostResult> {
  return new Promise(
    (resolve, reject) => {
      const invocation =
        createPrivateDockerCliInvocation(
          args,
        )
      const child = spawn(
        invocation.executable,
        invocation.args,
        {
          cwd: options.cwd,
          env: invocation.env,
          stdio: [
            'pipe',
            'pipe',
            'pipe',
          ],
        },
      )
      const stdout: Buffer[] = []
      const stderr: Buffer[] = []
      let totalBytes = 0
      let settled = false
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        if (!settled) {
          settled = true
          reject(runtimeFailure(
            'Character PixiJS Docker command exceeded timeout.',
          ))
        }
      }, options.timeoutMs)
      const collect =
        (target: Buffer[]) =>
          (chunk: Buffer) => {
            totalBytes +=
              chunk.byteLength
            if (
              totalBytes >
                options.maxBytes
            ) {
              child.kill('SIGKILL')
              if (!settled) {
                settled = true
                clearTimeout(timer)
                reject(runtimeFailure(
                  'Character PixiJS Docker output exceeded its ceiling.',
                ))
              }
              return
            }
            target.push(
              Buffer.from(chunk),
            )
          }
      child.stdout.on(
        'data',
        collect(stdout),
      )
      child.stderr.on(
        'data',
        collect(stderr),
      )
      child.on('error', (cause) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(runtimeFailure(
            'Character PixiJS Docker runtime is unavailable.',
            cause,
          ))
        }
      })
      child.on('close', (code) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve({
            exitCode: code ?? -1,
            stdout:
              Buffer.concat(
                stdout,
              ).toString(),
            stderr:
              Buffer.concat(
                stderr,
              ).toString(),
          })
        }
      })
      child.stdin.end(
        options.input ?? '',
      )
    },
  )
}

function sourceDirectory(): string {
  return join(
    repositoryRoot(),
    'docker/qualification/living-frame-character-pixijs',
  )
}

function repositoryRoot(): string {
  return fileURLToPath(
    new URL('../../', import.meta.url),
  ).replace(/[\\/]$/u, '')
}

function digestBytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) {
    throw runtimeFailure(
      'Character PixiJS evidence contains an invalid object.',
    )
  }
  return value as Record<
    string,
    unknown
  >
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function array(
  value: unknown,
): unknown[] {
  if (!Array.isArray(value)) {
    throw runtimeFailure(
      'Character PixiJS evidence contains an invalid array.',
    )
  }
  return value
}

function stringArray(
  value: unknown,
): string[] {
  const values = array(value)
  if (
    values.some((item) =>
      typeof item !== 'string')
  ) {
    throw runtimeFailure(
      'Character PixiJS evidence contains a non-string array.',
    )
  }
  return values as string[]
}

function stringRecord(
  value: unknown,
): Record<string, string> {
  const object = record(value)
  if (
    Object.values(object).some(
      (item) =>
        typeof item !== 'string',
    )
  ) {
    throw runtimeFailure(
      'Character PixiJS evidence contains a non-string record.',
    )
  }
  return object as Record<
    string,
    string
  >
}

function extractEnvironmentNames(
  values: readonly string[],
): string[] {
  return values
    .map((value) =>
      value.split('=', 1)[0] ?? '')
    .sort()
}

function secretLikeEnvironmentNames(
  values: readonly string[],
): string[] {
  return values.filter((name) =>
    /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/iu
      .test(name))
}

function runtimeFailure(
  message: string,
  cause?: unknown,
): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    message,
    503,
    undefined,
    { cause },
  )
}

function validationFailure(
  message: string,
): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    message,
    400,
  )
}
