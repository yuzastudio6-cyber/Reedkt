import type {
  LivingFrameBlenderFixedAdapterAuthorityBoundary,
  LivingFrameBlenderFixedAdapterBone,
  LivingFrameBlenderFixedAdapterIk,
  LivingFrameBlenderFixedAdapterJoint,
  LivingFrameBlenderFixedAdapterMesh,
  LivingFrameBlenderFixedAdapterOutput,
  LivingFrameBlenderFixedAdapterResult,
} from './living-frame-blender-fixed-adapter-internal-test'

export const LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION =
  'living-frame-blender-fixed-textured-adapter-internal-request-v2' as const

export const LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_CLASS =
  'private_internal_fixed_blender_textured_adapter_request' as const

export const LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_ENVELOPE_VERSION =
  'living-frame-fixed-textured-adapter-envelope-v2' as const

export const LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH =
  'input/component-texture.png' as const

export interface LivingFrameBlenderFixedTextureCommitment {
  readonly artifactId: string
  readonly contentType: 'image/png'
  readonly widthPixels: number
  readonly heightPixels: number
  readonly byteLength: number
  readonly sha256: string
  readonly fixedRelativePath:
    typeof LIVING_FRAME_BLENDER_FIXED_TEXTURE_RELATIVE_PATH
  readonly alphaMode: 'straight'
  readonly colorSpace: 'srgb'
}

export interface LivingFrameBlenderFixedTexturedAdapterMaterial {
  readonly baseColorRgba:
    readonly [number, number, number, number]
  readonly roughness: number
  readonly texture:
    LivingFrameBlenderFixedTextureCommitment
}

export interface LivingFrameBlenderFixedTexturedAdapterRequestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_VERSION
  readonly requestClass:
    typeof LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_INTERNAL_REQUEST_CLASS
  readonly candidateRequestDigestSha256: string
  readonly riggingPlanDigestSha256: string
  readonly actionPlanDigestSha256: string
  readonly componentId: string
  readonly output: LivingFrameBlenderFixedAdapterOutput
  readonly mesh: LivingFrameBlenderFixedAdapterMesh
  readonly bones:
    readonly LivingFrameBlenderFixedAdapterBone[]
  readonly joints:
    readonly LivingFrameBlenderFixedAdapterJoint[]
  readonly ik: LivingFrameBlenderFixedAdapterIk
  readonly animation: {
    readonly interpolation: 'BEZIER'
    readonly deterministicBakeRequired: true
    readonly secondaryMotionEnabled: false
  }
  readonly material:
    LivingFrameBlenderFixedTexturedAdapterMaterial
  readonly authorityBoundary:
    LivingFrameBlenderFixedAdapterAuthorityBoundary
  readonly payloadDigestBindingSha256: string
}

export interface LivingFrameBlenderFixedTexturedAdapterEnvelope {
  readonly envelopeVersion:
    typeof LIVING_FRAME_BLENDER_FIXED_TEXTURED_ADAPTER_ENVELOPE_VERSION
  readonly payloadCanonicalJson: string
  readonly payloadDigestSha256: string
}

/**
 * Texturing changes the request and staged-input contract, while the Blender
 * output-pass shape remains the already-qualified fixed-adapter result v1.
 * The result payload digest binds the complete v2 texture commitment.
 */
export type LivingFrameBlenderFixedTexturedAdapterResult =
  LivingFrameBlenderFixedAdapterResult
