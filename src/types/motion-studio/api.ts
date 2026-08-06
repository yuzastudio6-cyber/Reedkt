import type { ID, ISODateString } from '../shared'
import type {
  ArtifactApproval,
  ArtifactDependencyKind,
  ArtifactInvalidationPolicy,
  MotionStudioArtifactKind,
  MotionStudioArtifactVersionState,
} from './artifacts'
import type { MotionStudioCommandOperation, MotionStudioCommandResult } from './commands'
import type {
  MotionStudioActiveModuleId,
  MotionStudioModuleCatalogVersion,
  MotionStudioStage,
  MotionStudioStageProfileId,
  MotionStudioStatus,
  MotionStudioWorkspaceMode,
  ProductionMode,
} from './production'
import type {
  StorytellingMotionStylePlanPreparationDto,
  StorytellingMotionStylePlanReviewInput,
} from './styles'
import type {
  StorytellingSceneContinuityReviewDto,
  StorytellingStoryContinuityGrammarProposal,
  StorytellingStoryContinuityPreparationDto,
} from './story-continuity'
import type { TimelineProposalOperation } from './scenes'
import type {
  MotionStudioArtifactPayload,
  MotionStudioDigest,
  MotionStudioProvenance,
  MotionStudioVersionReference,
} from './shared'

/** Browser-safe explicit module decision for one existing named edit. */
export interface CreateMotionStudioProductionRequest {
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
}

export interface PrepareStorytellingMotionStylePlanRequest {
  workspaceId: ID
  directionHistory: readonly string[]
  modelTier: 'basic' | 'pro' | 'premium'
}

export interface PrepareStorytellingMotionStylePlanResponse {
  preparation: StorytellingMotionStylePlanPreparationDto
}

export interface PrepareStorytellingStoryContinuityRequest {
  workspaceId: ID
  proposal: StorytellingStoryContinuityGrammarProposal
}

export interface PrepareStorytellingStoryContinuityResponse {
  preparation: StorytellingStoryContinuityPreparationDto
}

export interface PrepareCanonicalStorytellingPlanningRequest {
  storytellingStylePlan: StorytellingMotionStylePlanReviewInput
}

export interface MotionStudioCanonicalStorytellingProductionAuthorityDto
  extends Record<string, unknown> {
  schemaVersion: 'canonical-motion-studio-storytelling-production-authority-v1'
  componentKey: 'motionStudioStorytellingProductionAuthority'
  workspaceId: ID
  projectId: ID
  editSessionId: ID
  productionId: ID
  authorityHash: string
  sourceProposal: {
    componentProposalDigest: string
  }
  confirmedOutputFrame: {
    width: number
    height: number
    aspectRatio: string
    frameRate: 24 | 30
    durationFrames: number
  }
}

export interface MotionStudioCanonicalPlanningExpectedOutputDto {
  outputKey: string
  artifactType: string
  assetRole: 'processed' | 'generated' | 'qa' | 'preview' | 'final'
  required: boolean
  previewPlaceholderAllowed: boolean
  contentType?: string
  segmentIds: string[]
  timingIds: string[]
  rendererLayerIds: string[]
}

export interface MotionStudioCanonicalPlanningWorkItemDto {
  workItemKey: string
  workItemType:
    | 'validate_approved_snapshot'
    | 'custom'
    | 'render_remotion_preview'
    | 'run_asset_qa'
  workerClass: string
  executionInput: Record<string, unknown>
  sourceSequenceItemIds: string[]
  sourceCleanupDecisionIds: string[]
  expectedOutputs: MotionStudioCanonicalPlanningExpectedOutputDto[]
  dependencyKeys: string[]
  approvedToolIds: string[]
  providerExecutionMode: 'none'
  fallbackPolicy: Record<string, unknown>
  maxAttempts: number
  attemptTimeoutSeconds: number
  scheduledDelaySeconds: number
  maximumCreditBudget: number
  required: boolean
}

export interface MotionStudioCanonicalStorytellingPlanningComponentsDto {
  sourceCleanupSummary: Record<string, unknown>
  sourceCleanupPlan: Record<string, unknown>
  masterTimingPlan: Record<string, unknown>
  captionVisualCueTimingPlan: Record<string, unknown>
  soundSyncTransitionTimingPlan: Record<string, unknown>
  timingValidationPlan: Record<string, unknown>
  timingSummary: {
    validationStatus: 'warning'
    approvalBlocked: false
    fps: 24 | 30
    totalFrames: number
  }
  segments: Array<{
    segmentId: string
    startFrame: number
    endFrameExclusive: number
    operationIds: string[]
  }>
  visualAssetPlan: Record<string, unknown>
  colorPipelinePlan: Record<string, unknown>
  rendererPlan: Record<string, unknown>
  toolStrategyPlan: Record<string, unknown>
  qaPlan: Record<string, unknown>
  qaSummary: { status: 'warning'; approvalBlocked: false }
  providerPolicy: { veoPolicy: 'forbidden'; approvedRoutes: [] }
  fallbackPolicy: Record<string, unknown>
}

export type PrepareCanonicalStorytellingPlanningResponse = {
  preparation:
    | {
        schemaVersion: 'motion-studio.canonical-storytelling-planning-preparation.v1'
        state: 'ready_for_canonical_plan'
        authority: MotionStudioCanonicalStorytellingProductionAuthorityDto
        components: MotionStudioCanonicalStorytellingPlanningComponentsDto
        workItems: MotionStudioCanonicalPlanningWorkItemDto[]
        blocker: null
        sideEffects: Record<string, number>
        productionReady: false
      }
    | {
        schemaVersion: 'motion-studio.canonical-storytelling-planning-preparation.v1'
        state: 'blocked'
        blocker: {
          code: string
          message: string
          retryable: boolean
        }
        sideEffects: Record<string, number>
        productionReady: false
      }
}

export interface MotionStudioProductionDto {
  id: ID
  projectId: ID
  editSessionId: ID
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  status: MotionStudioStatus
  currentStage: MotionStudioStage
  workspaceMode: MotionStudioWorkspaceMode
  defaultProductionMode: ProductionMode
  userFacingStrategy: "Director's Hybrid"
  recordVersion: number
  createdAt: ISODateString
  updatedAt: ISODateString
  localCandidateOnly: true
}

export interface CreateMotionStudioArtifactDependencyRequest {
  upstreamVersionId: ID
  dependencyKind: ArtifactDependencyKind
  invalidationPolicy: ArtifactInvalidationPolicy
}

export interface CreateMotionStudioArtifactVersionRequest {
  kind: MotionStudioArtifactKind
  state: Extract<MotionStudioArtifactVersionState, 'draft' | 'in_review'>
  payload: MotionStudioArtifactPayload
  provenance: Omit<MotionStudioProvenance, 'createdBy' | 'createdAt'>
  dependencies: readonly CreateMotionStudioArtifactDependencyRequest[]
}

export interface ApplyMotionStudioCommandRequest {
  baseVersionId: ID
  baseVersionDigest: MotionStudioDigest
  operations: readonly MotionStudioCommandOperation[]
  reason: string
}

export interface ApproveMotionStudioArtifactVersionRequest {
  artifactVersionId: ID
  artifactContentDigest: MotionStudioDigest
  approvedSnapshotId: ID
  approvalKind: ArtifactApproval['approvalKind']
}

export interface MotionStudioArtifactVersionDto {
  id: ID
  artifactId: ID
  productionId: ID
  kind: MotionStudioArtifactKind
  versionNumber: number
  parentVersionId?: ID
  state: MotionStudioArtifactVersionState
  payload: MotionStudioArtifactPayload
  contentDigest: MotionStudioDigest
  immutable: true
  provenance: MotionStudioProvenance
  createdAt: ISODateString
}

export interface MotionStudioArtifactDto {
  id: ID
  productionId: ID
  kind: MotionStudioArtifactKind
  currentDraftVersion?: MotionStudioVersionReference
  currentApprovedVersion?: MotionStudioVersionReference
  currentDraft?: MotionStudioArtifactVersionDto
  currentApproved?: MotionStudioArtifactVersionDto
  latestApproval?: ArtifactApproval
  recordVersion: number
  createdAt: ISODateString
  archivedAt?: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioCommandResponseDto {
  result: MotionStudioCommandResult
  localCandidateOnly: true
}

export type MotionStudioSceneLayerType =
  | 'source_footage'
  | 'image'
  | 'generated_video'
  | 'text'
  | 'caption'
  | 'map'
  | 'chart'
  | 'mask'
  | 'audio'
  | 'effect'

/** Browser intent only. Exact ownership, timing, frame, and version authority are server-derived. */
export interface CreateMotionStudioSceneDraftRequest {
  approvedSnapshotId: ID
  title: string
  semanticPurpose: string
  productionMode: ProductionMode
  startAnchorId: ID
  endAnchorId: ID
  layerType: MotionStudioSceneLayerType
  assetIds: readonly ID[]
  zIndex: number
  motionLanguageVersionId: ID
  narrativeFunctionVersionId: ID
}

export interface MotionStudioSceneDraftReceiptDto {
  sceneId: ID
  sceneGraph: MotionStudioVersionReference
  layerPlan: MotionStudioVersionReference
  sceneRecipe: MotionStudioVersionReference
  sceneDocument: MotionStudioVersionReference
  recipeInstantiationId: ID
  localCandidateOnly: true
}

export interface CreateMotionStudioTimelineProposalRequest {
  approvedSnapshotId: ID
  sceneDocumentArtifactId: ID
  sceneDocumentVersionId: ID
  sceneDocumentContentDigest: MotionStudioDigest
  targetTimelineManifestId: ID
}

export interface MotionStudioTimelineProposalDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  sourceSceneDocument: MotionStudioVersionReference
  targetTimelineManifestId: ID
  compilerId: 'motion-studio-scene-compiler'
  compilerVersion: string
  inputDigest: MotionStudioDigest
  outputDigest: MotionStudioDigest
  operations: readonly TimelineProposalOperation[]
  warnings: readonly string[]
  status: 'proposed'
  createdAt: ISODateString
  localCandidateOnly: true
}

export interface MotionStudioSceneArtifactSummaryDto {
  artifactId: ID
  kind: Extract<MotionStudioArtifactKind,
    'scene_graph' | 'scene_recipe' | 'layer_plan' | 'scene_document' |
    'motion_language' | 'narrative_function'>
  version: MotionStudioVersionReference
  state: MotionStudioArtifactVersionState
  label: string
  sceneId?: ID
  sceneTitle?: string
  semanticPurpose?: string
  productionMode?: ProductionMode
  timing?: {
    startAnchorId: ID
    endAnchorId: ID
  }
  shotCount?: number
  layerTypes?: readonly (
    'source_footage' | 'image' | 'generated_video' | 'text' | 'caption' |
    'map' | 'chart' | 'mask' | 'audio' | 'effect'
  )[]
  layerCount?: number
  assetCount?: number
  keyframeCount?: number
  exactTextRequired?: boolean
  exactDataRequired?: boolean
  storyContinuityReview?: StorytellingSceneContinuityReviewDto
}

export interface MotionStudioSceneWorkspaceDto {
  productionId: ID
  artifacts: readonly MotionStudioSceneArtifactSummaryDto[]
  proposals: readonly MotionStudioTimelineProposalDto[]
  latestApprovedSnapshot?: {
    id: ID
    targetTimelineManifestId: ID
    timingAuthorityDigest: MotionStudioDigest
    frameRate: number
    timingAnchors: readonly { id: ID; frame: number }[]
  }
  readiness: {
    canAuthor: boolean
    canCompile: boolean
    blockers: readonly string[]
  }
  localCandidateOnly: true
}
