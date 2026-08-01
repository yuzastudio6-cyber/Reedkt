export const LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_VERSION =
  'living-frame-blender-selected-scene-texture-binding-internal-test-v1' as const

export const LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_CLASS =
  'server_derived_private_internal_selected_scene_blender_texture_binding' as const

export interface LivingFrameBlenderSelectedSceneTextureBindingInternalTestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_SELECTED_SCENE_TEXTURE_BINDING_INTERNAL_TEST_CLASS
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly characterAnimationRouteDecisionDigestSha256:
      string
    readonly admissionDigestSha256: string
    readonly approvedSnapshotDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly plannedWorkItemDigestSha256: string
    readonly riggingPlanDigestSha256: string
    readonly actionPlanDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
  }
  readonly textureArtifact: {
    readonly artifactId: string
    readonly sourceArtifactId: string
    readonly sourceAlphaSha256: string
    readonly contentType: 'image/png'
    readonly widthPixels: 640
    readonly heightPixels: 360
    readonly byteLength: number
    readonly sha256: string
    readonly alphaMode: 'straight'
    readonly colorSpace: 'srgb'
    readonly illustrativeNotArchivalEvidence: true
  }
  readonly finalCompositionArtifacts: {
    readonly basePlate: {
      readonly artifactId: string
      readonly contentType: 'image/png'
      readonly widthPixels: 640
      readonly heightPixels: 360
      readonly byteLength: number
      readonly sha256: string
      readonly alphaMode: 'straight'
      readonly colorSpace: 'srgb'
    }
    readonly captionOverlay: {
      readonly artifactId: string
      readonly contentType: 'image/png'
      readonly widthPixels: 640
      readonly heightPixels: 360
      readonly byteLength: number
      readonly sha256: string
      readonly alphaMode: 'straight'
      readonly colorSpace: 'srgb'
    }
    readonly remotionOwnsFinalCanvas: true
  }
  readonly decompositionEvidence: {
    readonly profile:
      'fixture_specific_character_action_cutout_rig_v2'
    readonly swordArmSelectedPixelCount: number
    readonly swordArmReconstructedPixelCount: number
    readonly swordArmTransparentClearedPixelCount: number
    readonly pivot: readonly [390, 104]
    readonly hiddenAreaReconstructionRequired: true
  }
  readonly adapterBinding: {
    readonly requestVersion:
      'living-frame-blender-fixed-textured-adapter-internal-request-v2'
    readonly fixedRelativePath:
      'input/component-texture.png'
    readonly exactOneTexturePerComponentAttempt: true
    readonly componentTextureOnly: true
    readonly fullFrameUvMeshDigestSha256: string
    readonly fullFrameUvMeshUsesTextureSpace: true
    readonly finalCanvasClaimed: false
    readonly remotionRemainsFinalCanvas: true
  }
  readonly authorityBoundary: {
    readonly privateInternalBindingEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly containsRawChatPathUrlCredentialCommandEnvironmentOrTextureBytes:
    false
  readonly operationRegistered: false
  readonly canonicalWorkAdmitted: false
  readonly dispatchGranted: false
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameBlenderSelectedSceneTextureBindingInternalTest
  extends LivingFrameBlenderSelectedSceneTextureBindingInternalTestDraft {
  readonly bindingDigestSha256: string
}
