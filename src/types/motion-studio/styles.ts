import type { ID, ISODateString } from '../shared'
import type { MotionStudioGenerationRoutePolicy } from './generation'
import type { ProductionMode } from './production'
import type {
  MotionStudioArtifactKind,
} from './artifacts'
import type {
  ProductionRoute,
  SceneRecipe,
  SceneRecipeInstantiation,
} from './scenes'
import type {
  MotionLanguageReference,
  NarrativeFunctionReference,
} from './story'
import type { StorytellingSceneContinuitySlice } from './story-continuity'
import type {
  MotionStudioOwnership,
  MotionStudioVersionReference,
  TimingAuthorityRef,
} from './shared'

export const MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION =
  'motion-studio.storytelling-style-profile.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION =
  'motion-studio.storytelling-style-source-audit.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION =
  'motion-studio.storytelling-style-selection.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION =
  'motion-studio.storytelling-style-plan-review-input.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION =
  'motion-studio.storytelling-style-plan-binding.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION =
  'motion-studio.storytelling-style-change-impact.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION =
  'motion-studio.storytelling-style-review.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION =
  'motion-studio.storytelling-style-decision.v1' as const
export const MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION =
  'motion-studio.storytelling-style-plan-preparation.v1' as const
export const MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION =
  'motion-studio.style-calibration-plan.v1' as const
export const MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION =
  'motion-studio.style-calibration-candidate-evidence.v1' as const
export const MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION =
  'motion-studio.style-calibration-reel.v1' as const
export const MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION =
  'motion-studio.project-video-routing-profile.v2' as const
export const MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION =
  'motion-studio.storytelling-scene-recipe-compilation.v1' as const

export type StorytellingMotionStyleProfileId =
  | 'storytelling_style.editorial_collage'
  | 'storytelling_style.cinematic_realist_documentary'
  | 'storytelling_style.paper_diorama_documentary'
  | 'storytelling_style.technical_blueprint'

export type StorytellingMotionStyleRecipeFamily =
  | 'editorial_archive_reveal'
  | 'native_evidence_graphic'
  | 'layered_paper_depth'
  | 'cinematic_reconstruction'
  | 'footage_evidence'
  | 'hybrid_documentary'

export type StorytellingMotionStyleCostTendency =
  | 'lower'
  | 'moderate'
  | 'higher'

export type StorytellingMotionStyleEditability = 'high' | 'medium'

export interface StorytellingMotionStyleDirectionDto {
  styleProfile: StorytellingMotionStyleProfileReference
  displayName: string
  shortDescription: string
  bestFor: readonly string[]
  constructionLabel: 'Directed hybrid' | 'Native graphics'
  relativeCostTendency: StorytellingMotionStyleCostTendency
  editability: StorytellingMotionStyleEditability
}

/**
 * Browser-safe comparison of immutable style profiles. It is deliberately not
 * a selection or approval record: the exact choice is discussed in Chat and
 * becomes authoritative only through the existing Plan Review snapshot.
 */
export interface StorytellingMotionStyleReviewDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_REVIEW_VERSION
  catalogVersion: string
  catalogDigest: string
  state: 'comparison_only'
  directions: readonly StorytellingMotionStyleDirectionDto[]
  decisionAuthority: 'chat_then_plan_review'
  notice: string
  readOnly: true
  runtimeExecutionAuthorized: false
}

export type StorytellingMotionStyleDecisionState =
  | 'comparison_only'
  | 'selected_for_plan'
  | 'awaiting_plan_review'
  | 'approved_locked'
  | 'stale_replan_required'

export type StorytellingMotionStyleDecisionNextAction =
  | 'discuss_in_chat'
  | 'continue_in_chat'
  | 'review_plan'
  | 'request_revision'
  | 'continue_replanning'

export interface StorytellingMotionStyleChangeImpactDto {
  preservedVersionCount: number
  reviewRequiredVersionCount: number
  rebuildRequiredVersionCount: number
  priorApprovalRemainsImmutable: true
}

/**
 * Browser-safe, read-only projection of the exact style decision lifecycle.
 * It deliberately excludes plan/snapshot IDs, digests, prompts, provider or
 * tool routes, jobs, and cost amounts. The existing Plan Review remains the
 * only approval authority.
 */
export interface StorytellingMotionStyleDecisionDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_DECISION_VERSION
  state: StorytellingMotionStyleDecisionState
  selectedStyleProfileId?: StorytellingMotionStyleProfileId
  selectedStyleDisplayName?: string
  statusLabel: string
  title: string
  summary: string
  nextAction: {
    kind: StorytellingMotionStyleDecisionNextAction
    label: string
  }
  planReviewRequired: boolean
  approvedLocked: boolean
  approvedDecisionPreserved: boolean
  calibrationState: 'not_planned' | 'planning_only' | 'approved_not_executed' | 'stale'
  calibrationScenarioCount: number
  changeImpact?: StorytellingMotionStyleChangeImpactDto
  decisionAuthority: 'existing_plan_review'
  readOnly: true
  runtimeExecutionAuthorized: false
}

export type StorytellingMotionStylePlanPreparationState =
  | 'needs_selection'
  | 'ready_for_plan_review'

/**
 * Exact planning-only bridge between the existing Chat and the existing Plan
 * Review. The decision is safe to render; the optional plan input is consumed
 * only by the ordinary approved-snapshot compiler. It creates no second
 * approval, execution, pricing, credit, or persistence authority.
 */
export interface StorytellingMotionStylePlanPreparationDto {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_PLAN_PREPARATION_VERSION
  productionId: ID
  projectId: ID
  editSessionId: ID
  state: StorytellingMotionStylePlanPreparationState
  decision: StorytellingMotionStyleDecisionDto
  planReviewInput?: StorytellingMotionStylePlanReviewInput
  blockerMessage?: string
  planReviewIsSoleApprovalAuthority: true
  customerPriceCalculatedHere: false
  customerCreditsMutated: false
  runtimeExecutionAuthorized: false
  localCandidateOnly: true
}

export interface StorytellingMotionStyleProfileReference {
  styleProfileId: StorytellingMotionStyleProfileId
  styleProfileVersion: string
  styleProfileDigest: string
}

/**
 * User-facing style packaging over an exact Motion Language version. It
 * describes creative grammar and compatibility only; it cannot select a
 * provider, execute a tool, spend money, or approve production.
 */
export interface StorytellingMotionStyleProfile {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION
  id: StorytellingMotionStyleProfileId
  version: string
  contentDigest: string
  displayName: string
  shortDescription: string
  inputAliases: readonly string[]
  motionLanguage: MotionLanguageReference
  defaultProductionMode: ProductionMode
  supportedProductionModes: readonly ProductionMode[]
  recipeFamilies: readonly StorytellingMotionStyleRecipeFamily[]
  bestFor: readonly string[]
  relativeCostTendency: StorytellingMotionStyleCostTendency
  editability: StorytellingMotionStyleEditability
  sourceAndBrandPolicy: {
    publisherImitationAllowed: false
    unlicensedReferenceBundlingAllowed: false
    providerPresetOrJobIdentityAdoptionAllowed: false
    doNotCopyReferenceRequiredForNamedPublisherRequests: true
  }
  deterministicCompositionPolicy: {
    exactTextGeneratedInMediaAllowed: false
    captionsGeneratedInMediaAllowed: false
    exactMapsChartsAndDataGeneratedInMediaAllowed: false
    finalCanvasOwnedByReeditpro: true
    editableTimelineRequired: true
  }
  providerNeutral: true
  runtimeExecutionAuthorized: false
  immutable: true
}

export type StorytellingStyleSourceKind =
  | 'uploaded_skill_archive'
  | 'reference_video'
  | 'reference_image'
  | 'reference_document'

export interface StorytellingStyleSourceAudit {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_SOURCE_AUDIT_VERSION
  sourceId: ID
  sourceKind: StorytellingStyleSourceKind
  sourceContentDigest: string
  sourceLabel: string
  trustStatus: 'untrusted_reference'
  licenseEvidenceStatus: 'missing' | 'present_unverified' | 'reviewed'
  commercialReuseAuthorizationStatus: 'unknown' | 'restricted' | 'authorized'
  extractedTechniqueFamilies: readonly string[]
  rejectedDirectiveFamilies: readonly string[]
  executableInstructionsAllowed: false
  exactPromptBundlingAllowed: false
  providerPresetOrJobIdentityAdopted: false
  originalAssetBundlingAllowed: false
  disposition: 'reference_only_generalized_grammar'
  auditDigest: string
  immutable: true
}

export type StorytellingMotionStyleSelectionState =
  | 'draft'
  | 'in_review'
  | 'selected_for_plan'
  | 'approved_snapshot_bound'
  | 'stale'

export interface StorytellingMotionStyleSelection extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_SELECTION_VERSION
  id: ID
  productionId: ID
  styleProfile: StorytellingMotionStyleProfileReference
  motionLanguage: MotionLanguageReference
  motionDnaVersion: MotionStudioVersionReference
  referenceContractVersions: readonly MotionStudioVersionReference[]
  sourceAuditDigests: readonly string[]
  selectionOrigin: 'director_recommendation' | 'user_selected' | 'user_customized'
  matchedInputAliases: readonly string[]
  customizationNotes: readonly string[]
  state: StorytellingMotionStyleSelectionState
  approvedPlanSnapshotId?: ID
  approvedPlanSnapshotDigest?: string
  selectionDigest: string
  runtimeExecutionAuthorized: false
  immutable: true
}

/**
 * Motion-owned input embedded in the existing Plan Review snapshot. It does
 * not create another approval boundary: the selected style and the bounded
 * calibration plan are reviewed with the edit's existing credit estimate.
 */
export interface StorytellingMotionStylePlanReviewInput extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_PLAN_REVIEW_INPUT_VERSION
  productionId: ID
  styleSelection: StorytellingMotionStyleSelection
  calibrationPlan: StyleCalibrationPlan
  internalCostEstimateId: ID
  internalCostEstimateDigest: string
  internalCostEnvelopeIncludedInPlanReview: true
  customerPricingCalculatedHere: false
  customerCreditsMutated: false
  decisionAuthority: 'existing_plan_review'
  runtimeExecutionAuthorized: false
  immutable: true
}

/**
 * Server-derived result of freezing the Motion style input inside one exact
 * approved plan snapshot. Approval is immutable planning authority only; the
 * canonical queue, lease, cost, and worker gates still own every side effect.
 */
export interface StorytellingMotionStylePlanBinding extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_PLAN_BINDING_VERSION
  id: ID
  productionId: ID
  approvedPlanSnapshotId: ID
  approvedPlanSnapshotDigest: string
  approvedEditPlanVersionId: ID
  approvedCreditEstimateId: ID
  approvedCreditEstimateDigest: string
  approvedInternalCostEstimateId: ID
  approvedInternalCostEstimateDigest: string
  preApprovalSelectionDigest: string
  approvedStyleSelection: StorytellingMotionStyleSelection
  approvedCalibrationPlan: StyleCalibrationPlan
  decisionAuthority: 'existing_plan_review'
  approvalState: 'approved_locked'
  previousApprovedSnapshotRemainsImmutable: true
  runtimeExecutionAuthorized: false
  customerPriceCalculatedHere: false
  customerCreditsMutated: false
  bindingDigest: string
  immutable: true
}

export type StorytellingStyleArtifactImpactDisposition =
  | 'preserve'
  | 'review_required'
  | 'rebuild_required'

export interface StorytellingStyleArtifactImpactPolicyEntry {
  artifactKind: MotionStudioArtifactKind
  disposition: StorytellingStyleArtifactImpactDisposition
  reason: string
}

export interface StorytellingStyleVersionImpact {
  artifactKind: MotionStudioArtifactKind
  artifactVersion: MotionStudioVersionReference
  disposition: StorytellingStyleArtifactImpactDisposition
  reason: string
}

/**
 * Append-only change-impact projection for a style revision. It carries exact
 * current versions when they exist and never mutates the prior approved plan.
 */
export interface StorytellingMotionStyleChangeImpact extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_STYLE_CHANGE_IMPACT_VERSION
  id: ID
  productionId: ID
  priorPlanBindingDigest: string
  priorApprovedPlanSnapshotId: ID
  priorApprovedPlanSnapshotDigest: string
  staleStyleSelection: StorytellingMotionStyleSelection
  proposedStyleSelection: StorytellingMotionStyleSelection
  artifactPolicy: readonly StorytellingStyleArtifactImpactPolicyEntry[]
  currentVersionImpacts: readonly StorytellingStyleVersionImpact[]
  preservedArtifactVersions: readonly MotionStudioVersionReference[]
  reviewRequiredArtifactVersions: readonly MotionStudioVersionReference[]
  rebuildRequiredArtifactVersions: readonly MotionStudioVersionReference[]
  approvalResetRequired: true
  newPlanReviewRequired: true
  newCreditEstimateRequired: true
  providerWorkAuthorized: false
  renderAuthorized: false
  customerCreditsMutated: false
  impactDigest: string
  immutable: true
}

export type StyleCalibrationScenarioKind =
  | 'style_led_motion'
  | 'character_continuity'
  | 'strict_first_last_frame'
  | 'reference_heavy'
  | 'exact_text_data'

export interface StyleCalibrationScenario {
  id: ID
  kind: StyleCalibrationScenarioKind
  narrativeFunction: NarrativeFunctionReference
  motionLanguage: MotionLanguageReference
  productionMode: ProductionMode
  recipeFamily: StorytellingMotionStyleRecipeFamily
  requiresGeneratedMedia: boolean
  deterministicTextDataRequired: boolean
  referenceContractVersions: readonly MotionStudioVersionReference[]
  acceptanceCriteria: readonly string[]
}

export type StyleCalibrationApprovalState =
  | 'planning_only'
  | 'approved_bounded_execution'

export interface StyleCalibrationApprovalAuthority {
  state: StyleCalibrationApprovalState
  approvedPlanSnapshotId?: ID
  approvedPlanSnapshotDigest?: string
  approvedEstimateId?: ID
  approvedEstimateDigest?: string
  maximumAuthorizedInternalCostMicros?: number
  customerPriceIncluded: false
  customerCreditsMutated: false
}

export interface StyleCalibrationPlan extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STYLE_CALIBRATION_PLAN_VERSION
  id: ID
  productionId: ID
  styleSelectionDigest: string
  styleProfile: StorytellingMotionStyleProfileReference
  motionLanguage: MotionLanguageReference
  motionDnaVersion: MotionStudioVersionReference
  routePolicy: MotionStudioGenerationRoutePolicy
  scenarios: readonly StyleCalibrationScenario[]
  estimatedInternalCostRangeMicros: {
    minimum: number
    maximum: number
  }
  approvalAuthority: StyleCalibrationApprovalAuthority
  automaticFallbackAllowed: false
  fallbackRequiresNewApproval: true
  bulkGenerationAllowed: false
  planDigest: string
  immutable: true
}

export type StyleCalibrationCreativeDecision = 'pending' | 'accepted' | 'rejected'

export type StyleCalibrationSourceEvidenceKind =
  | 'canonical_tool_attempt'
  | 'canonical_provider_attempt'
  | 'non_promotable_private_injected'
  | 'contract_only'

export type StyleCalibrationSourceEvidenceReadiness =
  | 'canonical_private_routing_eligible'
  | 'unreleased_runtime_blocked'
  | 'non_promotable_injected'
  | 'contract_only'

export interface StyleCalibrationPrivateOutputEvidence {
  assetId: ID
  assetVersionId: ID
  mimeType: 'video/mp4'
  contentDigest: string
  byteLength: number
  timingAuthority: TimingAuthorityRef
  privateObjectIdentityHash: string
  storageEvidenceDigest: string
  checksumReadbackEvidenceDigest: string
  createOnly: true
  privateProjectAsset: true
}

/**
 * Immutable evidence for every accepted, rejected, failed, or unknown
 * calibration attempt. It references the canonical attempt/storage/cost
 * authorities; it does not replace them.
 */
export interface StyleCalibrationCandidateEvidence extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STYLE_CALIBRATION_CANDIDATE_EVIDENCE_VERSION
  id: ID
  productionId: ID
  calibrationPlanDigest: string
  scenarioId: ID
  scenarioKind: StyleCalibrationScenarioKind
  routeCandidateId: ID
  productionMode: ProductionMode
  sourceEvidence: {
    kind: StyleCalibrationSourceEvidenceKind
    readiness: StyleCalibrationSourceEvidenceReadiness
    sourceAttemptId: ID
    sourceEvidenceDigest: string
    sourceVerifierId: ID
    sourceVerified: boolean
  }
  attemptOutcome: 'succeeded' | 'failed' | 'unknown'
  output?: StyleCalibrationPrivateOutputEvidence
  technicalQa: {
    status: 'not_run' | 'passed' | 'failed'
    evidenceDigest?: string
    blockingIssueCodes: readonly string[]
  }
  creativeReview: {
    decision: StyleCalibrationCreativeDecision
    reviewedBy?: ID
    reviewedAt?: ISODateString
    selectionReason?: string
  }
  knownFailureModes: readonly string[]
  measuredLatencyMilliseconds: number
  cost: {
    providerCostMicros: number | null
    infrastructureCostMicros: number
    totalInternalProductionCostMicros: number | null
    costEvidenceDigest: string
    reconciled: boolean
    failedOrUnknownAttemptCostRetained: true
    internalProductionCostOnly: true
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
  }
  costPerAcceptedSecondMicros: number | null
  routingEligible: boolean
  candidateDigest: string
  immutable: true
}

export type StyleCalibrationReelState =
  | 'collecting'
  | 'awaiting_review'
  | 'approved'
  | 'blocked'
  | 'stale'

export interface StyleCalibrationReel extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STYLE_CALIBRATION_REEL_VERSION
  id: ID
  productionId: ID
  calibrationPlanDigest: string
  approvedPlanSnapshotId: ID
  approvedPlanSnapshotDigest: string
  candidates: readonly StyleCalibrationCandidateEvidence[]
  decisions: readonly StyleCalibrationRouteDecision[]
  state: StyleCalibrationReelState
  totalActualInternalProductionCostMicros: number
  maximumAuthorizedInternalCostMicros: number
  costWithinAuthority: boolean
  unreconciledCostCandidateCount: number
  rejectedCandidateCount: number
  failedCandidateCount: number
  unknownCandidateCount: number
  allRequiredScenariosAccepted: boolean
  humanReviewComplete: boolean
  productionScaleRoutingApproved: boolean
  acceptedAndRejectedOutputsRetained: true
  automaticSelectionAllowed: false
  automaticFallbackAllowed: false
  runtimeExecutionAuthorized: false
  customerPriceIncluded: false
  customerCreditsMutated: false
  reelDigest: string
  immutable: true
}

export interface StyleCalibrationRouteDecision {
  scenarioKind: StyleCalibrationScenarioKind
  calibrationCandidateId: ID
  candidateEvidenceDigest: string
  routeCandidateId: ID
  productionMode: ProductionMode
  outputPerformanceDigest: string
  technicalQaStatus: 'passed' | 'failed'
  creativeDecision: StyleCalibrationCreativeDecision
  selectionReason: string
  knownFailureModes: readonly string[]
  acceptedDurationFrames: number
  fpsNumerator: number
  fpsDenominator: number
  measuredLatencyMilliseconds: number
  internalProductionCostMicros: number
  costPerAcceptedSecondMicros: number
}

export type ProjectVideoRoutingProfileState =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'stale'

/**
 * Project-scoped result of the Style Calibration Reel. Route candidates are
 * chosen by accepted project evidence, never by a universal provider winner.
 */
export interface ProjectVideoRoutingProfile extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_PROJECT_VIDEO_ROUTING_PROFILE_VERSION
  id: ID
  productionId: ID
  calibrationPlanDigest: string
  calibrationReelDigest: string
  approvedPlanSnapshotId?: ID
  approvedPlanSnapshotDigest?: string
  styleProfile: StorytellingMotionStyleProfileReference
  motionDnaVersion: MotionStudioVersionReference
  routePolicyId: MotionStudioGenerationRoutePolicy['policyId']
  routePolicyDigest: string
  decisions: readonly StyleCalibrationRouteDecision[]
  state: ProjectVideoRoutingProfileState
  allRequiredScenariosAccepted: boolean
  bulkGenerationAllowed: boolean
  automaticFallbackAllowed: false
  fallbackRequiresNewApproval: true
  normalUserUiExposesProviderInternals: false
  runtimeExecutionAuthorized: false
  profileDigest: string
  immutable: true
}

/**
 * Provider-neutral compilation of one explicitly chosen style Scene Recipe.
 * This is approved planning evidence only; the canonical queue/lease authority
 * still owns any tool, media, provider, render, or billing side effect.
 */
export interface StorytellingSceneRecipeCompilation extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_SCENE_RECIPE_COMPILATION_VERSION
  productionId: ID
  approvedPlanSnapshotId: ID
  approvedPlanSnapshotDigest: string
  styleSelectionDigest: string
  styleProfile: StorytellingMotionStyleProfileReference
  recipeFamily: StorytellingMotionStyleRecipeFamily
  recipe: SceneRecipe
  instantiation: SceneRecipeInstantiation
  storyContinuity: StorytellingSceneContinuitySlice
  productionRoute: ProductionRoute
  requiresGeneratedMedia: boolean
  projectVideoRoutingProfileDigest?: string
  runtimeExecutionAuthorized: false
  automaticFallbackAllowed: false
  compilationDigest: string
  immutable: true
}
