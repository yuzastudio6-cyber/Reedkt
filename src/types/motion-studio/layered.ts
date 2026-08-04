import type { ID, ISODateString } from '../shared'
import type { MotionStudioJobStatus } from './jobs'
import type { MotionStudioPreviewBindingDto } from './render'
import type { MotionStudioDigest, MotionStudioTimingAuthority, MotionStudioVersionReference } from './shared'

export const MOTION_STUDIO_LAYERED_PROFILE_ID = 'motion_studio_native_layered_scene_v1' as const
export const MOTION_STUDIO_LAYER_MANIFEST_VERSION = 'motion-studio-layer-manifest-v1' as const

export type MotionStudioLayerPlaneRole = 'background' | 'headline' | 'subject' | 'caption'

export interface MotionStudioLayerPlane {
  planeId: 'background-plane' | 'headline-plane' | 'subject-plane' | 'caption-plane'
  role: MotionStudioLayerPlaneRole
  zIndex: 0 | 10 | 20 | 30
  sourceKind: 'remotion_native' | 'approved_cutout_slot'
  motionToken: 'ambient_drift' | 'headline_reveal' | 'subject_parallax' | 'caption_hold'
  editablePropertyKeys: readonly string[]
}

/**
 * Strict server-derived semantic layer authority. It is a reviewable,
 * versioned contract—not caller-authored Remotion props or arbitrary code.
 */
export interface MotionStudioLayerManifestV1 {
  schemaVersion: typeof MOTION_STUDIO_LAYER_MANIFEST_VERSION
  compositionProfileId: typeof MOTION_STUDIO_LAYERED_PROFILE_ID
  depthModel: 'semantic_planes_v1'
  sceneId: ID
  semanticPurpose: string
  headline: string
  caption: string
  timingAuthority: MotionStudioTimingAuthority
  sceneRange: {
    startFrame: number
    endFrame: number
  }
  planes: readonly MotionStudioLayerPlane[]
  design: {
    panelBackground: '#0F172A'
    panelHighlight: '#16213E'
    headlineColor: '#E0F2FE'
    accentColor: '#FF4D8D'
    captionColor: '#F8FAFC'
  }
  safeZones: {
    horizontalPercent: 8
    verticalPercent: 8
    captionBottomPercent: 9
  }
  maskPolicy: {
    sourceFixtureId: 'server_owned_rembg_portrait_v1'
    maskRisk: 'low_fixture_only'
    contactObjectPresent: false
    captionAboveMask: true
    callerMediaAllowed: false
    automaticDepthModelUsed: false
    productionLicenseReviewRequired: true
  }
  fallbackPolicy: {
    automaticFallbackAllowed: false
    aiVideoFallbackAllowed: false
    approvedAlternative: 'new_approval_required_for_full_panel_native_graphics'
  }
  revisionPolicy: {
    immutableAssembly: true
    newSceneDocumentVersionRequired: true
    freeFormLayerJsonAllowed: false
  }
}

export interface CreateMotionStudioLayeredAssemblyRequest {
  approvedSnapshotId: ID
  sceneDocumentArtifactId: ID
  sceneDocumentVersionId: ID
  sceneDocumentContentDigest: MotionStudioDigest
  timelineProposalId: ID
  cutoutJobId: ID
  renderJobId: ID
}

export interface ExecuteMotionStudioLayeredCutoutRequest {
  assemblyId: ID
}

export interface ExecuteMotionStudioLayeredPreviewRequest {
  bindingId: ID
}

export interface MotionStudioLayeredCutoutArtifactDto {
  id: ID
  assemblyId: ID
  jobId: ID
  attemptId: ID
  sha256: MotionStudioDigest
  byteLength: number
  mimeType: 'image/png'
  width: 128
  height: 128
  alphaMinimum: 0
  alphaMaximum: 255
  alphaUniqueValueCount: 160
  foregroundAlphaMean: 226.802912
  backgroundAlphaMean: 2.492606
  subjectCoverageVerified: true
  modelId: 'u2netp'
  modelSha256: MotionStudioDigest
  executionDurationMilliseconds: number
  qaEvidenceDigest: MotionStudioDigest
  createdAt: ISODateString
  fixtureOnly: true
  productionLicenseReviewRequired: true
  localCandidateOnly: true
}

export interface MotionStudioLayeredAssemblyDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  sceneDocument: MotionStudioVersionReference
  timelineProposalId: ID
  timelineProposalOutputDigest: MotionStudioDigest
  cutoutJobId: ID
  renderJobId: ID
  layerManifest: MotionStudioLayerManifestV1
  layerManifestDigest: MotionStudioDigest
  cutoutStatus: MotionStudioJobStatus
  renderStatus: MotionStudioJobStatus
  cutout?: MotionStudioLayeredCutoutArtifactDto
  renderBinding: MotionStudioPreviewBindingDto
  createdAt: ISODateString
  fixtureOnly: true
  localCandidateOnly: true
}

export interface MotionStudioLayeredWorkspaceDto {
  productionId: ID
  assemblies: readonly MotionStudioLayeredAssemblyDto[]
  localCandidateOnly: true
}

export interface MotionStudioLayeredCutoutExecutionReceiptDto {
  assembly: MotionStudioLayeredAssemblyDto
  artifact: MotionStudioLayeredCutoutArtifactDto
  usage: {
    costEstimateItemId: ID
    meterId: 'cpu_second'
    quantity: number
    internalCostMicros: number
  }
  localCandidateOnly: true
}
