import type { EditSkillArtifactReference } from '../core/edit-skill-artifact-store'
import type { SkillFrameRange } from '../core/skill-assignment-types'
import type { SkillManifestReference } from '../core/skill-capability-manifest-types'

export type BrollDecision =
  | 'use_existing_project_clip'
  | 'use_uploaded_user_asset'
  | 'generate_with_gemini_omni'
  | 'edit_uploaded_video_with_gemini_omni'
  | 'refine_generated_omni_candidate'
  | 'use_no_broll'
  | 'needs_other_skill'
  | 'needs_user_confirmation'
  | 'blocked'

export type BrollEditorialRole =
  | 'proof_support'
  | 'context'
  | 'cut_cover'
  | 'visual_break'
  | 'product_detail'
  | 'location_detail'
  | 'process_step'
  | 'before_after'
  | 'emotional_support'
  | 'establishing'
  | 'screen_or_app_support'
  | 'transition_bridge'

export type BrollDisplayTreatment =
  | 'full_frame_takeover'
  | 'full_frame_cutaway'
  | 'inset'
  | 'picture_in_picture'
  | 'split_screen'
  | 'partial_overlay'
  | 'background_layer'
  | 'no_display'

export type BrollAudioDisposition =
  | 'discard'
  | 'retain_as_ambient_candidate'
  | 'extract_for_sound_skill_review'
  | 'retain_source_audio'

export interface BrollSkillAssignment {
  schemaVersion: 'b_roll_assignment_v1'
  assignmentId: string
  orchestrationRunId: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  editPlanVersion: number
  masterTimingHash: string
  masterTimingRange: SkillFrameRange
  segmentIds: readonly string[]
  sourceSequenceIds: readonly string[]
  readContextAuthority: {
    wholeVideoReadOnly: true
    adjacentScenesReadOnly: true
    contextArtifactRefs: readonly EditSkillArtifactReference[]
  }
  writeRangeAuthority: {
    authorizedRange: SkillFrameRange
    outsideAuthorizedRangeModified: false
  }
  reason: string
  pointToProveClarifyCoverOrSupport: string
  expectedViewerBenefit: string
  requestedVisualOwnership: 'primary' | 'support'
  forbiddenInterpretations: readonly string[]
  permittedSourceRoutes: readonly BrollDecision[]
  providerPermission: 'forbidden' | 'approved_within_ceiling'
  maximumInitialCandidates: 1
  maximumRefinements: 1
  maximumTimeSeconds: number
  maximumCredits: number
  requiredOutputTypes: readonly string[]
  manifestRef: SkillManifestReference
  assignmentHash: string
}

export interface BrollSourceCandidate {
  sourceId: string
  sourceType: 'existing_project_clip' | 'approved_user_asset' | 'uploaded_video_for_edit' | 'reference_image'
  artifactRef: EditSkillArtifactReference
  sourceRange?: SkillFrameRange
  semanticRelevance: number
  visualQuality: number
  temporalFit: number
  storyContinuity: number
  provenanceVerified: boolean
  rightsApproved: boolean
  privacyApproved: boolean
  proofSafe: boolean
  repetitionRisk: number
  cropFeasibility: number
  speakerActionProtection: number
  audioUsefulness: number
  costCredits: number
  approvedByUser: boolean
}

export interface BrollPlanningContext {
  schemaVersion: 'b_roll_context_manifest_v1'
  ownerUserId: string
  workspaceId: string
  projectId: string
  assignmentId: string
  baseFootageStrength: number
  speakerEmotionImportance: number
  meaningfulVisualNeed: number
  userVisualPreference: 'no_extra_visuals' | 'minimal' | 'balanced' | 'rich'
  claimSensitivity: 'none' | 'supporting' | 'claim_sensitive' | 'verified_proof_required'
  generatedMediaWouldMislead: boolean
  primaryVisualOwner?: string
  captionReservedZoneCount: number
  trackingRequired: boolean
  trackGraphRef?: EditSkillArtifactReference
  sourceCandidates: readonly BrollSourceCandidate[]
  priorConceptKeys: readonly string[]
  confirmedAspectRatio: string
  uploadedVideoEditRegionEligible: boolean
  referenceDnaDoNotCopyRules: readonly string[]
  contextHash: string
}

export interface BrollShotSpecification {
  conceptKey: string
  purpose: string
  singleContinuousShot: true
  noSceneCuts: true
  subject: string
  action: string
  environment: string
  framing: string
  cameraMovement: string
  lensDepthIntent: string
  lighting: string
  colorMood: string
  cameraIntent: string
  visualStyle: string
  durationFrames: number
  durationSeconds: number
  aspectRatio: string
  audioIntent: 'silent_visual_candidate'
  continuityRequirements: readonly string[]
  cropSafeSubjectArea: string
  allowedTransformationClass:
    | 'illustrative_generation'
    | 'contextual_generation'
    | 'approved_source_edit'
  proofClassification: 'source_verified' | 'illustrative' | 'contextual' | 'atmospheric' | 'symbolic'
  avoid: readonly string[]
}

export interface BrollCoordinationPlan {
  visualOwnership: 'primary' | 'support'
  captionHandoffRequired: boolean
  soundHandoffRequired: boolean
  colorHandoffRequired: boolean
  transitionHandoffRequired: boolean
  renderHandoffRequired: true
  trackingDependency: 'not_required' | 'satisfied' | 'needs_other_skill'
  trackGraphRef?: EditSkillArtifactReference
  finalOwners: readonly ['captions', 'sound', 'color', 'transition', 'track_all', 'render']
}

export interface BrollPlanArtifact {
  schemaVersion: 'b_roll_plan_v1'
  planId: string
  assignmentId: string
  assignmentHash: string
  manifestRef: SkillManifestReference
  authorizedRange: SkillFrameRange
  decision: BrollDecision
  editorialRole: BrollEditorialRole
  reason: string
  sourceCandidateId?: string
  sourceArtifactRef?: EditSkillArtifactReference
  sourceScore?: number
  shotSpecification?: BrollShotSpecification
  displayTreatment: BrollDisplayTreatment
  sourceTrim?: SkillFrameRange
  cropSafeProviderAspectRatio?: '16:9' | '9:16'
  speakerVisibilityIntent: 'preserve' | 'temporarily_hidden' | 'not_applicable'
  captionSafeBehavior: string
  audioDisposition: BrollAudioDisposition
  entryIntent: string
  exitIntent: string
  coordination: BrollCoordinationPlan
  providerRequestPlanned: boolean
  providerRequestPackageHash?: string
  providerCreditEstimate: number
  dependencySkillKey?: string
  requiredDependencyArtifactType?: string
  requiredForPhase?: string
  refinementAuthority?: {
    previousCandidateVersionId: string
    previousCandidateVersionHash: string
    priorQaReportHash: string
    requestedCandidateVersion: 2
    refinementCount: 1
    maximumRefinements: 1
  }
  timeEstimateSeconds: number
  creditEstimate: number
  lowerCostDecision: 'use_existing_project_clip' | 'use_no_broll'
  planningQaPassed: boolean
  outsideAuthorizedRangeModified: false
  planHash: string
}
