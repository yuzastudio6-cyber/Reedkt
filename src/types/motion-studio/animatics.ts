import type { ID, ISODateString } from '../shared'
import type { MotionStudioPreviewStatus } from './render'
import type {
  MotionStudioDigest,
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'
import type { StorytellingSceneContinuitySlice } from './story-continuity'

export interface MotionStudioStoryboardPanel {
  id: ID
  order: number
  chapterId: ID
  sceneId: ID
  sceneDocument: MotionStudioVersionReference
  timelineProposalId: ID
  timelineProposalOutputDigest: MotionStudioDigest
  narrationSegmentIds: ID[]
  startFrame: number
  endFrame: number
  title: string
  visualDescription: string
  storyContinuity?: StorytellingSceneContinuitySlice
  visualTreatment: 'deterministic_placeholder'
  finalAssetEligible: false
}

export interface MotionStudioStoryboard extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactType: 'storyboard'
  approvedSnapshotId: ID
  preparedScriptVersion: MotionStudioVersionReference
  voiceBibleVersion: MotionStudioVersionReference
  timingAuthority: MotionStudioTimingAuthority
  panels: MotionStudioStoryboardPanel[]
  placeholderPolicy: {
    previewOnly: true
    finalRenderAllowed: false
    userVisibleDisclosure: string
  }
  status: 'review_needed'
  notes: string[]
}

export interface MotionStudioAnimaticSceneBinding {
  order: number
  sceneId: ID
  storyboardPanelId: ID
  sceneDocument: MotionStudioVersionReference
  timelineProposalId: ID
  timelineProposalOutputDigest: MotionStudioDigest
  narrationSegmentIds: ID[]
  startFrame: number
  endFrame: number
  storyContinuity?: StorytellingSceneContinuitySlice
}

export interface MotionStudioAnimaticPlan extends MotionStudioOwnership {
  id: ID
  productionId: ID
  artifactType: 'animatic'
  approvedSnapshotId: ID
  preparedScriptVersion: MotionStudioVersionReference
  voiceBibleVersion: MotionStudioVersionReference
  storyboardVersion: MotionStudioVersionReference
  timingAuthority: MotionStudioTimingAuthority
  narrationAuthorityDigest: MotionStudioDigest
  registeredProfileId: 'motion_studio_prepared_script_animatic_v1'
  orderedScenes: MotionStudioAnimaticSceneBinding[]
  placeholderPolicy: {
    previewOnly: true
    finalRenderAllowed: false
    userVisibleDisclosure: string
  }
  status: 'review_needed'
  privateReviewOnly: true
  finalAssetEligible: false
  notes: string[]
}

/** Browser selection only; payload construction and media resolution are server-owned. */
export interface AssembleMotionStudioAnimaticRequest {
  approvedSnapshotId: ID
  preparedScriptArtifactId: ID
  preparedScriptVersionId: ID
  preparedScriptContentDigest: MotionStudioDigest
  narrationMediaAssetId: ID
  narrationChecksumSha256: MotionStudioDigest
  scenes: readonly {
    sceneDocumentArtifactId: ID
    sceneDocumentVersionId: ID
    sceneDocumentContentDigest: MotionStudioDigest
    timelineProposalId: ID
  }[]
}

export interface MotionStudioAnimaticAssemblyReceiptDto {
  productionId: ID
  approvedSnapshotId: ID
  preparedScript: MotionStudioVersionReference
  voiceBible: MotionStudioVersionReference
  storyboard: MotionStudioVersionReference
  animatic: MotionStudioVersionReference
  narrationAuthorityDigest: MotionStudioDigest
  localCandidateOnly: true
}

/** Exact approved animatic selection only; render properties are server-derived. */
export interface CreateMotionStudioAnimaticBindingRequest {
  approvedSnapshotId: ID
  animaticArtifactId: ID
  animaticVersionId: ID
  animaticContentDigest: MotionStudioDigest
  jobId: ID
}

export interface ExecuteMotionStudioAnimaticRequest {
  bindingId: ID
}

export interface MotionStudioAnimaticFrameEvidenceDto {
  frame: number
  sha256: MotionStudioDigest
}

export interface MotionStudioAnimaticArtifactDto {
  id: ID
  bindingId: ID
  jobId: ID
  attemptId: ID
  sha256: MotionStudioDigest
  byteLength: number
  mimeType: 'video/mp4'
  codec: 'h264'
  pixelFormat: 'yuv420p'
  colorSpace: 'bt709'
  audioCodec: 'aac'
  audioSampleRateHertz: number
  audioChannelCount: number
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  renderedFrameCount: number
  frameEvidence: readonly MotionStudioAnimaticFrameEvidenceDto[]
  runtimeIdentityDigest: MotionStudioDigest
  attestationDigest: MotionStudioDigest
  qaEvidenceDigest: MotionStudioDigest
  createdAt: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioAnimaticBindingDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  preparedScript: MotionStudioVersionReference
  voiceBible: MotionStudioVersionReference
  storyboard: MotionStudioVersionReference
  animatic: MotionStudioVersionReference
  narrationAuthorityDigest: MotionStudioDigest
  jobId: ID
  approvedWorkItemId: ID
  width: number
  height: number
  fpsNumerator: number
  fpsDenominator: number
  renderedFrameCount: number
  sceneCount: number
  status: MotionStudioPreviewStatus
  failureCategory?: string
  currentAttemptId?: ID
  artifact?: MotionStudioAnimaticArtifactDto
  createdAt: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioAnimaticWorkspaceDto {
  productionId: ID
  assemblies: readonly MotionStudioAnimaticAssemblyReceiptDto[]
  bindings: readonly MotionStudioAnimaticBindingDto[]
  localCandidateOnly: true
}

export interface MotionStudioAnimaticExecutionReceiptDto {
  binding: MotionStudioAnimaticBindingDto
  artifact: MotionStudioAnimaticArtifactDto
  usage: {
    costEstimateItemId: ID
    meterId: 'render_frame'
    quantity: number
    internalCostMicros: number
  }
  localCandidateOnly: true
}
