export const LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION =
  'living-frame-character-pixijs-internal-runtime-v2' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS =
  'actual_private_internal_pixijs_whole_character_rigid_cutout_sequence' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE =
  'passed_actual_pixijs_whole_character_sequence_with_semantic_route_qa' as const

export const LIVING_FRAME_CHARACTER_PIXIJS_PRIVATE_SEQUENCE_LEASE_VERSION =
  'living-frame-character-pixijs-private-sequence-lease-v2' as const

export interface LivingFrameCharacterPixiJsInternalImageEvidence {
  readonly imageTag: string
  readonly imageId: string
  readonly imageIdentityHash: string
  readonly baseImageId: string
  readonly baseImageIdentityHash: string
  readonly sourceDigestSha256: string
  readonly architecture: string
  readonly imageUser: '10001:10001'
  readonly imageEntrypoint:
    readonly [
      'node',
      '/app/living-frame-character-pixijs-runner.mjs',
    ]
  readonly imageEnvironmentNames: readonly string[]
  readonly rootFilesystemLayerDigests: readonly string[]
  readonly labels: Readonly<Record<string, string>>
}

export interface LivingFrameCharacterPixiJsInternalConfinementEvidence {
  readonly networkMode: 'none'
  readonly readOnlyRootFilesystem: true
  readonly capDropAll: true
  readonly noNewPrivileges: true
  readonly privileged: false
  readonly pidsLimit: 256
  readonly memoryLimitBytes: 2147483648
  readonly memoryAndSwapLimitBytes: 2147483648
  readonly nanoCpus: 2000000000
  readonly tmpfsPath: '/tmp'
  readonly tmpfsSizeBytes: 536870912
  readonly tmpfsNoExec: true
  readonly tmpfsNoSuid: true
  readonly tmpfsNoDevice: true
  readonly shmSizeBytes: 268435456
  readonly user: '10001:10001'
  readonly callerCommandPresent: false
  readonly callerBindsPresent: false
  readonly callerMountsPresent: false
  readonly callerEnvironmentPresent: false
  readonly secretLikeImageEnvironmentNames: readonly []
}

export interface LivingFrameCharacterPixiJsInternalFrameMeasurement {
  readonly order: number
  readonly absoluteFrame: number
  readonly pngDigestSha256: string
  readonly pngByteLength: number
  readonly decodedRgbaDigestSha256: string
  readonly nonTransparentPixelCount: number
  readonly subjectAnchorAlphaPixelCount: number
  readonly protectedFaceAlphaPixelCount: number
  readonly subjectAnchorCoveragePassed: true
  readonly protectedFaceRegionBoundedRelativeToSourceComponent:
    true
}

export interface LivingFrameCharacterPixiJsInternalRuntimeReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE
  readonly qualificationId:
    'lf-character-pixijs-musashi-whole-character-private-v2'
  readonly sourceBindings: {
    readonly sceneId: 'scene.musashi-strike'
    readonly componentId:
      'musashi.whole-character'
    readonly sourceArtifactId:
      'lf.animation-aware-illustration.musashi.whole-character.v1'
    readonly sourceArtifactDigestSha256: string
    readonly characterAnimationRouteDecisionDigestSha256: string
    readonly rejectedSwordArmRouteDecisionDigestSha256:
      string
    readonly runtimeRequestDigestSha256: string
  }
  readonly runtimeIdentity: {
    readonly toolId: 'pixijs'
    readonly operationId:
      'tool.pixijs.render_pixi_scene.v1'
    readonly packageName: 'pixi.js'
    readonly packageVersion: '8.19.0'
    readonly packageEntrypoint: 'Application.init'
    readonly actualPackageEntrypointExecuted: true
    readonly fixedSupervisedEntrypointExecuted: true
    readonly oneRequestOneAttemptVerified: true
    readonly zeroNetworkVerified: true
  }
  readonly renderIdentity: {
    readonly widthPixels: 640
    readonly heightPixels: 360
    readonly fps: 30
    readonly startFrame: 0
    readonly endFrameExclusive: 120
    readonly frameImageCount: 120
    readonly backgroundMode: 'transparent'
    readonly alphaMode: 'straight_alpha'
    readonly finalVideoCanvas: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly imageEvidence:
    LivingFrameCharacterPixiJsInternalImageEvidence
  readonly confinementEvidence:
    LivingFrameCharacterPixiJsInternalConfinementEvidence
  readonly frameMeasurements:
    readonly LivingFrameCharacterPixiJsInternalFrameMeasurement[]
  readonly aggregateQa: {
    readonly everyPngDecodedFromBytes: true
    readonly everyFrameExactDimension: true
    readonly everyFrameContainsOnlyComponentPixels: true
    readonly sourcePoseRestoredExactly: true
    readonly temporalVariationPresent: true
    readonly subjectAnchorCoverageContinuous: true
    readonly protectedFaceRegionBoundedRelativeToSourceComponent:
      true
    readonly uniqueFramePngDigestCount: number
    readonly middlePoseDifferentPixelCount: number
    readonly maximumProtectedFaceAlphaPixelIncrease: number
  }
  readonly selectedSceneSuitability: {
    readonly selectedRoute:
      'pixijs_rigid_cutout'
    readonly routeState:
      'qualified_private_pixijs_route'
    readonly pixiJsWholeCharacterAdmissionAllowed:
      true
    readonly componentRuntimeMechanicsPassed:
      true
    readonly supportedMotionIntent:
      'restrained_whole_character_drift'
    readonly articulatedSwordActionSupported:
      false
    readonly articulatedSwordActionRoute:
      'comfyui_controlled_component_preparation'
    readonly articulatedSwordActionFailureCodes: readonly [
      'unreconstructed_hidden_source_plate',
      'component_boundary_not_professionally_prepared',
      'current_motion_path_intersects_protected_face',
    ]
    readonly controlledComponentPreparationRequired:
      true
    readonly downstreamRouteAfterPreparation:
      'pixijs_rigid_cutout'
    readonly remotionWholeCharacterCompositeMayProceed:
      true
  }
  readonly authorityBoundary: {
    readonly privateInternalRuntimeEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly masterTimingAuthority: false
    readonly operationRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactAuthority: false
    readonly assetManifestAuthority: false
    readonly rendererAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly canonicalDispatchIntegrated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly rendererMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterPixiJsInternalRuntimeReport
  extends LivingFrameCharacterPixiJsInternalRuntimeReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameCharacterPixiJsPrivateSequenceFrame {
  readonly order: number
  readonly absoluteFrame: number
  readonly pngBytes: Uint8Array
  readonly pngByteLength: number
  readonly pngDigestSha256: string
}

export interface LivingFrameCharacterPixiJsPrivateSequenceOutput {
  readonly qualificationId:
    'lf-character-pixijs-musashi-whole-character-private-v2'
  readonly reportDigestSha256: string
  readonly sequenceDigestSha256: string
  readonly widthPixels: 640
  readonly heightPixels: 360
  readonly fps: 30
  readonly startFrame: 0
  readonly endFrameExclusive: 120
  readonly frames:
    readonly LivingFrameCharacterPixiJsPrivateSequenceFrame[]
}

export interface LivingFrameCharacterPixiJsPrivateSequenceLease {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_PIXIJS_PRIVATE_SEQUENCE_LEASE_VERSION
  readonly leaseId: string
  readonly qualificationId:
    'lf-character-pixijs-musashi-whole-character-private-v2'
  readonly reportDigestSha256: string
  readonly sequenceDigestSha256: string
  readonly frameImageCount: 120
  readonly processBound: true
  readonly singleUse: true
  readonly containsRawPngBytes: false
  readonly containsPathUrlCredentialCommandOrEnvironment: false
  readonly dispatchAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly qaApprovalAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterPixiJsInternalRuntimeExecution {
  readonly report:
    LivingFrameCharacterPixiJsInternalRuntimeReport
  readonly privateSequenceOutputLease:
    LivingFrameCharacterPixiJsPrivateSequenceLease
}
