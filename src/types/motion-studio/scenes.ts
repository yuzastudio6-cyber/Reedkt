import type { ID, ISODateString } from '../shared'
import type { TimelineManifest } from '../../backend/contracts/timeline-manifest-contracts'
import type { ProductionMode } from './production'
import type { MotionLanguageReference, NarrativeFunctionReference } from './story'
import type { StorytellingSceneContinuitySlice } from './story-continuity'
import type {
  MotionStudioCompilerFingerprint,
  MotionStudioContractValue,
  MotionStudioDigest,
  MotionStudioOwnership,
  MotionStudioTimingAuthority,
  MotionStudioVersionReference,
} from './shared'

export interface MotionStudioTimingAnchorRange {
  startAnchorId: ID
  endAnchorId: ID
}

export interface Chapter {
  id: ID
  title: string
  purpose: string
  sceneIds: ID[]
}

export interface Scene {
  id: ID
  chapterId: ID
  title: string
  semanticPurpose: string
  productionMode: ProductionMode
  timing: MotionStudioTimingAnchorRange
  shotIds: ID[]
  requiredAssetIds: ID[]
  approvalStatus: 'draft' | 'review_needed' | 'approved' | 'locked'
}

export interface Shot {
  id: ID
  sceneId: ID
  narrativePurpose: string
  timing: MotionStudioTimingAnchorRange
  visualConcept: string
  productionRouteId: ID
  assetIds: ID[]
  referenceContractIds: ID[]
  exactTextRequired: boolean
  exactDataRequired: boolean
  riskScore: number
}

export interface SceneGraph extends MotionStudioOwnership {
  id: ID
  productionId: ID
  chapterIds: ID[]
  chapters: Chapter[]
  scenes: Scene[]
  shots: Shot[]
}

export interface LayerPlanItem {
  id: ID
  layerType: 'source_footage' | 'image' | 'generated_video' | 'text' | 'caption' | 'map' | 'chart' | 'mask' | 'audio' | 'effect'
  assetIds: ID[]
  timing: MotionStudioTimingAnchorRange
  zIndex: number
  relationshipIds: ID[]
  extensions: import('./shared').MotionStudioRegisteredExtension[]
}

export interface LayerPlan extends MotionStudioOwnership {
  id: ID
  productionId: ID
  sceneId: ID
  layers: LayerPlanItem[]
}

export interface AnimationKeyframeReference {
  id: ID
  timingAnchorId: ID
  frameOffset: number
  propertyPath: string
  value: MotionStudioContractValue
  easingId?: string
}

export interface SceneDocument extends MotionStudioOwnership {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  sceneId: ID
  semanticPurpose: string
  productionMode: ProductionMode
  timingAuthority: MotionStudioTimingAuthority
  timing: MotionStudioTimingAnchorRange
  assetIds: ID[]
  layerPlanVersion: MotionStudioVersionReference
  keyframes: AnimationKeyframeReference[]
  designTokenReferences: string[]
  maskAssetIds: ID[]
  effectCapabilityIds: string[]
  audioCueIds: ID[]
  propertyLockIds: ID[]
  manualOverrideIds: ID[]
  productionRouteIds: ID[]
  generationReferenceContractVersions?: MotionStudioVersionReference[]
  storyContinuity?: StorytellingSceneContinuitySlice
  recipeInstantiationIds: ID[]
  compilerFingerprint: MotionStudioCompilerFingerprint
  brollReferences: ExistingBrollAssetReference[]
}

export interface SceneDocumentVersion extends MotionStudioOwnership {
  id: ID
  productionId: ID
  sceneDocumentId: ID
  versionNumber: number
  parentVersionId?: ID
  contentDigest: MotionStudioDigest
  document: SceneDocument
  immutable: boolean
  state: 'draft' | 'in_review' | 'approved' | 'locked' | 'superseded'
  createdAt: ISODateString
}

export interface ExistingBrollAssetReference {
  referenceKind: 'existing_b_roll_asset'
  assetId: ID
  editSystemRecordId: ID
  intendedUse: string
}

export interface SceneRecipe {
  id: ID
  definitionVersion: string
  definitionDigest: MotionStudioDigest
  name: string
  scope: 'system' | 'workspace_private'
  workspaceId?: ID
  compatibleProductionModes: ProductionMode[]
  requiredInputArtifactKinds: string[]
  outputArtifactKinds: string[]
  professionalSkillIds: string[]
  toolCapabilityIds: string[]
  qualityGateIds: string[]
  fallbackPolicyIds: string[]
  approvalClass: 'none' | 'stage' | 'expensive_work'
  costClass: 'no_incremental_provider_cost' | 'low' | 'medium' | 'high'
  compilerVersion: string
  arbitraryCodeAllowed: false
  brollWorkflowEmbedded: false
  compatibleMotionLanguages: MotionLanguageReference[]
  compatibleNarrativeFunctions: NarrativeFunctionReference[]
  immutable: true
}

export interface SceneRecipeVersion {
  id: ID
  recipeId: ID
  versionNumber: number
  contentDigest: MotionStudioDigest
  recipe: SceneRecipe
  immutable: true
  createdAt: ISODateString
}

export interface SceneRecipeInstantiation extends MotionStudioOwnership {
  id: ID
  productionId: ID
  sceneDocumentVersionId: ID
  sceneId: ID
  recipeVersion: MotionStudioVersionReference
  recipeDefinitionVersion: string
  recipeDefinitionDigest: MotionStudioDigest
  recipeInputDigest: MotionStudioDigest
  motionLanguage: MotionLanguageReference
  narrativeFunction: NarrativeFunctionReference
  productionMode: ProductionMode
  inputArtifactDigests: MotionStudioDigest[]
  outputBindingIds: ID[]
  approvalStatus: 'approved'
  immutable: true
}

export interface ProductionRoute {
  id: ID
  mode: ProductionMode
  capabilityIds: string[]
  requiredAssetIds: ID[]
  deterministic: boolean
  providerNeutral: boolean
  approvalRequired: boolean
  costEstimateRequired: boolean
  rationale: string
  motionLanguage: MotionLanguageReference
  narrativeFunction: NarrativeFunctionReference
  sceneRecipeVersion: MotionStudioVersionReference
  sceneRecipeDefinitionVersion: string
  sceneRecipeDefinitionDigest: MotionStudioDigest
}

export interface SceneDocumentCompilationRequest extends MotionStudioOwnership {
  productionId: ID
  approvedSnapshotId: ID
  sceneDocumentVersion: MotionStudioVersionReference
  targetTimelineManifestId: ID
  timingAuthority: MotionStudioTimingAuthority
  compilerFingerprint: MotionStudioCompilerFingerprint
}

export interface SceneDocumentCompilationResult {
  sourceSceneDocumentVersion: MotionStudioVersionReference
  targetTimelineManifestId: ID
  operations: TimelineProposalOperation[]
  materializedTimelineProposal: TimelineManifest
  storyContinuity?: StorytellingSceneContinuitySlice
  compilerFingerprint: MotionStudioCompilerFingerprint
  warnings: string[]
}

/**
 * A proposal operation targets the one existing ReeditPro TimelineManifest.
 * It is not a second timeline and it never grants render or mutation authority.
 */
export interface TimelineProposalOperation {
  id: ID
  kind: 'upsert_layer'
  targetCollection: 'audioLayers' | 'captionLayers' | 'overlayLayers' | 'maskLayers'
  layer: TimelineManifest['audioLayers'][number]
}
