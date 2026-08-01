import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH,
  LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION,
} from '../../src/types/living-frame-blender-fixed-textured-adapter-internal-test'
import type {
  LivingFrameBlenderFixedAdapterMesh,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import type {
  LivingFrameCharacterAnimationRouteDecision,
} from '../../src/types/living-frame-character-animation-route'
import type {
  LivingFrameBlenderSelectedSceneAdmission,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_CLASS,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_VERSION,
  type LivingFrameBlenderSelectedSceneTextureBindingInternalTest,
  type LivingFrameBlenderSelectedSceneTextureBindingInternalTestDraft,
} from '../../src/types/living-frame-blender-selected-scene-texture-binding-internal-test'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from './living-frame-blender-selected-scene-admission'
import {
  verifyLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'
import type {
  LivingFrameMusashiBlenderTexturePrivateFixture,
} from './living-frame-musashi-blender-texture-private-fixture'
import {
  decodeLivingFrameEnvironmentalParticleRgbaPng,
} from './living-frame-environmental-particle-sequence-observation'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface CompileLivingFrameBlenderSelectedSceneTextureBindingInternalTestInput {
  readonly admission:
    LivingFrameBlenderSelectedSceneAdmission
  readonly admissionInput:
    InspectLivingFrameBlenderSelectedSceneAdmissionInput
  readonly textureFixture:
    LivingFrameMusashiBlenderTexturePrivateFixture
  readonly fullFrameUvMesh:
    LivingFrameBlenderFixedAdapterMesh
  readonly characterAnimationRouteDecision:
    LivingFrameCharacterAnimationRouteDecision
}

export async function compileLivingFrameBlenderSelectedSceneTextureBindingInternalTest(
  input:
    CompileLivingFrameBlenderSelectedSceneTextureBindingInternalTestInput,
):
Promise<LivingFrameBlenderSelectedSceneTextureBindingInternalTest> {
  assertInput(input)
  if (
    !await verifyLivingFrameBlenderSelectedSceneAdmission(
      input.admission,
      input.admissionInput,
    )
  ) {
    throw new Error(
      'Living Frame Blender selected-scene texture admission is invalid.',
    )
  }
  if (
    !verifyLivingFrameCharacterAnimationRouteDecision(
      input.characterAnimationRouteDecision,
    )
    || input.characterAnimationRouteDecision
      .evidence.sceneId !==
      input.admission.canonicalScope.sceneId
    || input.characterAnimationRouteDecision
      .evidence.componentId !==
      input.admission.canonicalScope.componentId
    || input.characterAnimationRouteDecision
      .decision.selectedRoute !==
      'blender_articulated_2_5d'
    || !input.characterAnimationRouteDecision
      .decision.blenderAdmissionAllowed
  ) {
    throw new Error(
      'Living Frame Blender selected-scene texture binding requires a qualified articulated Blender route.',
    )
  }
  const admission = input.admission
  const texture =
    input.textureFixture.swordArmComponent
  const decoded =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      texture.pngBytes,
    )
  if (
    decoded.width !== texture.widthPixels
    || decoded.height !== texture.heightPixels
    || decoded.rgba.byteLength
      !== texture.widthPixels
        * texture.heightPixels
        * 4
    || texture.byteLength
      !== texture.pngBytes.byteLength
    || texture.sha256
      !== digestBytes(texture.pngBytes)
  ) {
    throw new Error(
      'Living Frame Blender selected-scene texture bytes changed.',
    )
  }
  const source = admission.sourceBindings
  const decomposition =
    input.textureFixture.decomposition
  const basePlate =
    input.textureFixture.basePlateComponent
  const caption =
    input.textureFixture.captionComponent
  assertExactRgbaArtifact(
    basePlate,
    'base plate',
  )
  assertExactRgbaArtifact(
    caption,
    'caption',
  )
  const draft:
    LivingFrameBlenderSelectedSceneTextureBindingInternalTestDraft = {
      contractVersion:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_CLASS,
      canonicalScope: {
        ...admission.canonicalScope,
      },
      sourceBindings: {
        characterAnimationRouteDecisionDigestSha256:
          input.characterAnimationRouteDecision
            .decisionDigestSha256,
        admissionDigestSha256:
          admission.admissionDigestSha256,
        approvedSnapshotDigestSha256:
          source.approvedSnapshotDigestSha256,
        selectedSceneBindingDigestSha256:
          source.selectedSceneBindingDigestSha256,
        plannedWorkItemDigestSha256:
          source.plannedWorkItemDigestSha256,
        riggingPlanDigestSha256:
          source.riggingPlanDigestSha256,
        actionPlanDigestSha256:
          source.actionPlanDigestSha256,
        confirmedOutputFrameDigestSha256:
          source.confirmedOutputFrameDigestSha256,
        currentMasterTimingDigestSha256:
          source.currentMasterTimingDigestSha256,
      },
      textureArtifact: {
        artifactId: texture.artifactId,
        sourceArtifactId:
          input.textureFixture.sourceArtifactId,
        sourceAlphaSha256:
          input.textureFixture
            .sourceAlphaSha256,
        contentType: 'image/png',
        widthPixels: 640,
        heightPixels: 360,
        byteLength: texture.byteLength,
        sha256: texture.sha256,
        alphaMode: 'straight',
        colorSpace: 'srgb',
        illustrativeNotArchivalEvidence:
          true,
      },
      finalCompositionArtifacts: {
        basePlate: {
          artifactId:
            basePlate.artifactId,
          contentType: 'image/png',
          widthPixels: 640,
          heightPixels: 360,
          byteLength:
            basePlate.byteLength,
          sha256: basePlate.sha256,
          alphaMode: 'straight',
          colorSpace: 'srgb',
        },
        captionOverlay: {
          artifactId:
            caption.artifactId,
          contentType: 'image/png',
          widthPixels: 640,
          heightPixels: 360,
          byteLength:
            caption.byteLength,
          sha256: caption.sha256,
          alphaMode: 'straight',
          colorSpace: 'srgb',
        },
        remotionOwnsFinalCanvas: true,
      },
      decompositionEvidence: {
        profile: decomposition.profile,
        swordArmSelectedPixelCount:
          decomposition
            .swordArmSelectedPixelCount,
        swordArmReconstructedPixelCount:
          decomposition
            .swordArmReconstructedPixelCount,
        swordArmTransparentClearedPixelCount:
          decomposition
            .swordArmTransparentClearedPixelCount,
        pivot: decomposition.swordArmPivot,
        hiddenAreaReconstructionRequired:
          true,
      },
      adapterBinding: {
        requestVersion:
          LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION,
        fixedRelativePath:
          LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH,
        exactOneTexturePerComponentAttempt:
          true,
        componentTextureOnly: true,
        fullFrameUvMeshDigestSha256:
          sha256AuthorityValue(
            input.fullFrameUvMesh,
          ),
        fullFrameUvMeshUsesTextureSpace:
          true,
        finalCanvasClaimed: false,
        remotionRemainsFinalCanvas: true,
      },
      authorityBoundary: {
        privateInternalBindingEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvedSnapshotAuthority: false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        artifactPersistenceAuthority: false,
        assetManifestAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      containsRawChatPathUrlCredentialCommandEnvironmentOrTextureBytes:
        false,
      operationRegistered: false,
      canonicalWorkAdmitted: false,
      dispatchGranted: false,
      canonicalAssetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    bindingDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertExactRgbaArtifact(
  artifact: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly byteLength: number
    readonly sha256: string
    readonly pngBytes: Buffer
  },
  label: string,
): void {
  const decoded =
    decodeLivingFrameEnvironmentalParticleRgbaPng(
      artifact.pngBytes,
    )
  if (
    decoded.width !== artifact.widthPixels
    || decoded.height !==
      artifact.heightPixels
    || decoded.rgba.byteLength
      !== artifact.widthPixels
        * artifact.heightPixels
        * 4
    || artifact.byteLength
      !== artifact.pngBytes.byteLength
    || artifact.sha256
      !== digestBytes(artifact.pngBytes)
  ) {
    throw new Error(
      `Living Frame Blender selected-scene ${label} bytes changed.`,
    )
  }
}

export async function verifyLivingFrameBlenderSelectedSceneTextureBindingInternalTest(
  value: unknown,
  input:
    CompileLivingFrameBlenderSelectedSceneTextureBindingInternalTestInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.bindingDigestSha256
        !== 'string'
      || !SHA256.test(
        value.bindingDigestSha256,
      )
    ) return false
    const {
      bindingDigestSha256,
      ...draft
    } = value
    if (
      bindingDigestSha256
        !== sha256AuthorityValue(draft)
    ) return false
    const expected =
      await compileLivingFrameBlenderSelectedSceneTextureBindingInternalTest(
        input,
      )
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertInput(
  input:
    CompileLivingFrameBlenderSelectedSceneTextureBindingInternalTestInput,
): void {
  if (
    !isRecord(input)
    || !isRecord(input.admission)
    || !isRecord(input.admissionInput)
    || !isRecord(input.textureFixture)
    || !isRecord(
      input.fullFrameUvMesh,
    )
    || !isRecord(
      input.characterAnimationRouteDecision,
    )
    || !SAFE_ID.test(
      input.textureFixture
        .swordArmComponent.artifactId,
    )
    || input.textureFixture
      .authorityBoundary
      .privateInternalFixtureAuthority
      !== true
    || Object.entries(
      input.textureFixture
        .authorityBoundary,
    ).some(([key, value]) =>
      key !== 'privateInternalFixtureAuthority'
      && value !== false)
  ) {
    throw new Error(
      'Living Frame Blender selected-scene texture binding input is invalid.',
    )
  }
}

function digestBytes(bytes: Buffer): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
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
