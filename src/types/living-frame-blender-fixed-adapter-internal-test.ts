export const LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_VERSION =
  'living-frame-blender-fixed-adapter-internal-request-v1' as const

export const LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_CLASS =
  'private_internal_fixed_blender_adapter_request' as const

export const LIVING_FRAME_BLENDER_FIXED_ADAPTER_ENVELOPE_VERSION =
  'living-frame-fixed-adapter-envelope-v1' as const

export const LIVING_FRAME_BLENDER_FIXED_ADAPTER_RESULT_VERSION =
  'living-frame-blender-fixed-adapter-result-v1' as const

export const LIVING_FRAME_BLENDER_FIXED_ADAPTER_RUNTIME_EVIDENCE_VERSION =
  'living-frame-blender-fixed-adapter-runtime-evidence-v1' as const

export interface LivingFrameBlenderFixedAdapterPoint {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface LivingFrameBlenderFixedAdapterUv {
  readonly x: number
  readonly y: number
}

export interface LivingFrameBlenderFixedAdapterVertex {
  readonly position: LivingFrameBlenderFixedAdapterPoint
  readonly uv: LivingFrameBlenderFixedAdapterUv
}

export interface LivingFrameBlenderFixedAdapterVertexWeight {
  readonly boneId: string
  readonly weight: number
}

export interface LivingFrameBlenderFixedAdapterMesh {
  readonly meshId: string
  readonly vertices: readonly LivingFrameBlenderFixedAdapterVertex[]
  readonly triangles: readonly (readonly [number, number, number])[]
  readonly weights:
    readonly (readonly LivingFrameBlenderFixedAdapterVertexWeight[])[]
}

export interface LivingFrameBlenderFixedAdapterBone {
  readonly order: number
  readonly boneId: string
  readonly parentBoneId: string | null
  readonly head: LivingFrameBlenderFixedAdapterPoint
  readonly tail: LivingFrameBlenderFixedAdapterPoint
  readonly deform: boolean
}

export interface LivingFrameBlenderFixedAdapterJoint {
  readonly order: number
  readonly jointId: string
  readonly boneId: string
  readonly minimumAngleDegrees: number
  readonly maximumAngleDegrees: number
}

export interface LivingFrameBlenderFixedAdapterIkKeyframe {
  readonly frame: number
  readonly position: LivingFrameBlenderFixedAdapterPoint
}

export interface LivingFrameBlenderFixedAdapterIk {
  readonly effectorBoneId: string
  readonly chainLength: number
  readonly iterationLimit: number
  readonly targetKeyframes:
    readonly LivingFrameBlenderFixedAdapterIkKeyframe[]
}

export interface LivingFrameBlenderFixedAdapterOutput {
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly frameStep: number
  readonly transparentRgbaRequired: true
  readonly maskPassRequired: true
  readonly depthPassRequired: true
  readonly previewScale: number
}

export interface LivingFrameBlenderFixedAdapterMaterial {
  readonly baseColorRgba: readonly [number, number, number, number]
  readonly roughness: number
}

export interface LivingFrameBlenderFixedAdapterAuthorityBoundary {
  readonly privateInternalQualificationOnly: true
  readonly runtimeDispatchAuthority: false
  readonly assetPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly costAuthority: false
  readonly billingAuthority: false
  readonly qaApprovalAuthority: false
  readonly finalCanvasAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
  readonly remotionOwnsFinalCanvas: true
}

export interface LivingFrameBlenderFixedAdapterRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_VERSION
  readonly requestClass:
    typeof LIVING_FRAME_BLENDER_FIXED_ADAPTER_INTERNAL_REQUEST_CLASS
  readonly candidateRequestDigestSha256: string
  readonly riggingPlanDigestSha256: string
  readonly actionPlanDigestSha256: string
  readonly componentId: string
  readonly output: LivingFrameBlenderFixedAdapterOutput
  readonly mesh: LivingFrameBlenderFixedAdapterMesh
  readonly bones: readonly LivingFrameBlenderFixedAdapterBone[]
  readonly joints: readonly LivingFrameBlenderFixedAdapterJoint[]
  readonly ik: LivingFrameBlenderFixedAdapterIk
  readonly animation: {
    readonly interpolation: 'BEZIER'
    readonly deterministicBakeRequired: true
    readonly secondaryMotionEnabled: false
  }
  readonly material: LivingFrameBlenderFixedAdapterMaterial
  readonly authorityBoundary:
    LivingFrameBlenderFixedAdapterAuthorityBoundary
  /**
   * The digest of the canonical draft excluding this field. The envelope binds
   * the resulting complete payload independently.
   */
  readonly payloadDigestBindingSha256: string
}

export interface LivingFrameBlenderFixedAdapterEnvelope {
  readonly envelopeVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_ADAPTER_ENVELOPE_VERSION
  readonly payloadCanonicalJson: string
  readonly payloadDigestSha256: string
}

export interface LivingFrameBlenderFixedAdapterResult {
  readonly resultVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_ADAPTER_RESULT_VERSION
  readonly componentId: string
  readonly candidateRequestDigestSha256: string
  readonly riggingPlanDigestSha256: string
  readonly actionPlanDigestSha256: string
  readonly payloadDigestSha256: string
  readonly frameCount: number
  readonly rgbaBytes: number
  readonly rgbaAggregateDigestSha256: string
  readonly maskBytes: number
  readonly maskAggregateDigestSha256: string
  readonly depthBytes: number
  readonly depthAggregateDigestSha256: string
  readonly rigCompileDurationMs: number
  readonly renderDurationMs: number
  readonly transparentRgbaProduced: true
  readonly maskPassProduced: true
  readonly depthPassProduced: true
  readonly remotionOwnsFinalCanvas: true
  readonly runtimeDispatchAuthority: false
  readonly assetPersistenceAuthority: false
  readonly qaApprovalAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameBlenderFixedAdapterRuntimeEvidence {
  readonly evidenceVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_ADAPTER_RUNTIME_EVIDENCE_VERSION
  readonly scope: 'private_internal_native_host_qualification'
  readonly blender: {
    readonly version: '4.5.11 LTS'
    readonly buildHash: '4db51e9d1e1e'
    readonly platform: 'Darwin'
    readonly architecture: 'arm64'
    readonly packageSha256:
      '1fad76c7da9451c7d6db99f1a5ed3c0a1a461d0aa07bf2b639e2fb4804ca4f13'
    readonly signedBy:
      'Developer ID Application: Stichting Blender Foundation (68UA947AUU)'
    readonly notarized: true
    readonly autoExecutionDisabled: true
    readonly factoryStartupRequired: true
  }
  readonly adapterSourceDigestSha256: string
  readonly candidateRequestDigestSha256: string
  readonly riggingPlanDigestSha256: string
  readonly actionPlanDigestSha256: string
  readonly payloadDigestSha256: string
  readonly coldStartDurationMs: number
  readonly coldStartMaximumResidentBytes: number
  readonly warmStartDurationMs: number
  readonly previewMaximumResidentBytes: number
  readonly fullRenderMaximumResidentBytes: number
  readonly result: LivingFrameBlenderFixedAdapterResult
  readonly qa: {
    readonly exactFrameCount: true
    readonly exactCanvasDimensions: true
    readonly rgbaPixelFormatObserved: true
    readonly transparentAndOpaquePixelsObserved: true
    readonly maskPixelFormatObserved: true
    readonly depthPassObserved: true
    readonly firstAndDemonstrationFrameDiffer: true
    readonly finalFrameRestoresInitialPose: true
    readonly deterministicDecodedRgbaAndMaskPreviewReplay: true
    readonly outputContainsBackgroundPlate: false
    readonly outputClaimsFinalCanvas: false
  }
  readonly confinement: {
    readonly fixedNoArgumentAdapter: true
    readonly factoryStartup: true
    readonly blenderAutoExecutionDisabled: true
    readonly rawChatAccepted: false
    readonly callerCodeAccepted: false
    readonly callerCommandAccepted: false
    readonly callerPathAccepted: false
    readonly callerEnvironmentAccepted: false
    readonly networkIsolationProven: false
  }
  readonly authorityBoundary:
    LivingFrameBlenderFixedAdapterAuthorityBoundary
  readonly runtimeOperationRegistered: false
  readonly dispatchAuthority: false
  readonly canonicalAssetPersistenceAuthority: false
  readonly canonicalCostAuthority: false
  readonly customerBillingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
  readonly evidenceDigestSha256: string
}
