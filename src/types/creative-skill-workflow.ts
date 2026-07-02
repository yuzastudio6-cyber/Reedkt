import type {
  ApprovalStatus,
  CreditImpact,
  ID,
  ISODateString,
  JSONObject,
  ProcessingStatus,
  TargetPlatform,
  TimeRange,
} from './shared'
import type {
  CreativeSkillApprovalTendency,
  CreativeSkillCreditTendency,
  CreativeSkillFamily,
  CreativeSkillKey,
  CreativeSkillPlanningContractType,
  CreativeSkillRecommendationLevel,
  CreativeSkillRuntimeReadiness,
  CreativeSkillSourceSafetyStatus,
} from './creative-skills-core'
import type { SkillPlanStatus, SkillRestraintDecision } from './creative-skill-plans'

export type EditPreferenceSourceType =
  | 'direct_instruction'
  | 'project_preference'
  | 'workspace_default'
  | 'user_default'
  | 'brand_brief'
  | 'reference_dna'
  | 'workflow_context'
  | 'skill_default'
  | 'ai_judgment'

export type EditPreferenceConfidence = 'low' | 'medium' | 'high' | 'confirmed'

export type EditPreferenceStrength = 'must_follow' | 'strong' | 'medium' | 'soft' | 'avoid'

export type VisualDensityPreference = 'minimal' | 'clean' | 'balanced' | 'rich' | 'maximal'

export type MotionIntensityPreference = 'none' | 'subtle' | 'moderate' | 'energetic' | 'hero'

export type TransitionEnergyPreference = 'none' | 'clean' | 'smooth' | 'expressive' | 'hero'

export type CaptionStylePreference = 'none' | 'clean' | 'bold' | 'animated' | 'brand_styled' | 'accessibility_first'

export type CaptionDensityPreference = 'none' | 'low' | 'medium' | 'high'

export type BRollPreference = 'none' | 'source_only' | 'proof_first' | 'contextual' | 'generated_future_allowed'

export type GraphicDesignPreference = 'none' | 'minimal' | 'clean_explain' | 'brand_rich' | 'hero_graphics'

export type ThreeDPreference = 'none' | 'avoid' | 'subtle' | 'hero_only' | 'premium_allowed'

export type RealMotionPreference = 'none' | 'avoid' | 'subtle_overlay' | 'hero_allowed'

export type StrokeMotionPreference = 'none' | 'avoid' | 'story_layer_allowed' | 'source_reading_allowed'

export type SoundSyncPreference = 'none' | 'voice_first' | 'subtle_music' | 'beat_aware' | 'premium_music_allowed'

export type SFXPreference = 'none' | 'avoid' | 'subtle' | 'edit_layer_only' | 'expressive_allowed'

export type RestraintLevel = 'minimal' | 'balanced' | 'strong' | 'strict'

export type WowFactorTarget = 'none' | 'subtle' | 'moderate' | 'high' | 'maximum_when_earned'

export type CreditSensitivityPreference = 'lowest_cost' | 'balanced' | 'premium_when_earned' | 'user_approved_premium'

export interface EditPreferenceProfileRecord {
  id: ID
  projectId?: ID
  workspaceId?: ID
  userId?: ID
  sourceType: EditPreferenceSourceType
  confidence: EditPreferenceConfidence
  strength: EditPreferenceStrength
  visualDensity?: VisualDensityPreference
  motionIntensity?: MotionIntensityPreference
  transitionEnergy?: TransitionEnergyPreference
  captionStyle?: CaptionStylePreference
  captionDensity?: CaptionDensityPreference
  bRollPreference?: BRollPreference
  graphicDesignPreference?: GraphicDesignPreference
  threeDPreference?: ThreeDPreference
  realMotionPreference?: RealMotionPreference
  strokeMotionPreference?: StrokeMotionPreference
  soundSyncPreference?: SoundSyncPreference
  sfxPreference?: SFXPreference
  restraintLevel?: RestraintLevel
  wowFactorTarget?: WowFactorTarget
  creditSensitivity?: CreditSensitivityPreference
  preferredSkillKeys: CreativeSkillKey[]
  blockedSkillKeys: CreativeSkillKey[]
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface ResolvedEditPreferenceSnapshotRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  sourceProfileIds: ID[]
  targetPlatform?: TargetPlatform
  resolvedVisualDensity: VisualDensityPreference
  resolvedMotionIntensity: MotionIntensityPreference
  resolvedTransitionEnergy: TransitionEnergyPreference
  resolvedCreditSensitivity: CreditSensitivityPreference
  resolvedRestraintLevel: RestraintLevel
  preferredSkillKeys: CreativeSkillKey[]
  blockedSkillKeys: CreativeSkillKey[]
  mustFollowRules: string[]
  avoidRules: string[]
  confidence: EditPreferenceConfidence
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface EditPreferenceConflictResolutionRecord {
  id: ID
  snapshotId: ID
  conflictSourceIds: ID[]
  conflictSummary: string
  winningSourceType: EditPreferenceSourceType
  resolutionReason: string
  affectedSkillKeys: CreativeSkillKey[]
  affectedStoryTimingWindowIds: ID[]
  createdAt: ISODateString
  metadata?: JSONObject
}

export type VisualOpportunityType =
  | 'clarity'
  | 'proof'
  | 'emotion'
  | 'rhythm'
  | 'transition'
  | 'monotony_break'
  | 'hero_candidate'
  | 'source_safety'
  | 'restraint'

export type VisualOpportunitySourceType =
  | 'user_intent'
  | 'source_sequence'
  | 'transcript'
  | 'visual_observation'
  | 'audio_observation'
  | 'reference_dna'
  | 'workflow_context'
  | 'edit_preference'
  | 'qa_signal'

export type VisualOpportunityConfidence = 'low' | 'medium' | 'high' | 'needs_user_confirmation'

export type VisualOpportunityStatus =
  | 'candidate'
  | 'selected'
  | 'rejected'
  | 'merged'
  | 'deferred'
  | 'needs_user_question'
  | 'blocked'

export type VisualOpportunityPriorityBand = 'low' | 'medium' | 'high' | 'hero' | 'must_fix'

export interface VisualOpportunityRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  opportunityType: VisualOpportunityType
  sourceType: VisualOpportunitySourceType
  confidence: VisualOpportunityConfidence
  status: VisualOpportunityStatus
  priorityBand: VisualOpportunityPriorityBand
  timeRange?: TimeRange
  evidenceSummary: string
  viewerBenefit: string
  possibleSkillFamilies: CreativeSkillFamily[]
  possibleSkillKeys: CreativeSkillKey[]
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RestraintOpportunityRecord {
  id: ID
  projectId: ID
  opportunityId?: ID
  reason: string
  restraintDecision: SkillRestraintDecision
  affectedSkillFamilies: CreativeSkillFamily[]
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface OpportunityUserQuestionRecord {
  id: ID
  opportunityId: ID
  question: string
  reason: string
  blocksSelection: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface VisualOpportunityEngineRunRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  status: ProcessingStatus
  opportunityIds: ID[]
  restraintOpportunityIds: ID[]
  userQuestionIds: ID[]
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface VisualOpportunityScoreReviewRecord {
  id: ID
  opportunityId: ID
  score: number
  scoreReason: string
  priorityBand: VisualOpportunityPriorityBand
  lowerCostAlternative?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export type CreativeConceptType =
  | 'visual_explain'
  | 'proof_moment'
  | 'emotional_support'
  | 'rhythm_support'
  | 'hero_moment'
  | 'restraint'
  | 'lower_cost_alternative'
  | 'question'

export type CreativeConceptPrimaryRole =
  | 'clarify'
  | 'prove'
  | 'cover'
  | 'support_emotion'
  | 'support_rhythm'
  | 'create_wow'
  | 'reduce_noise'
  | 'ask_user'

export type CreativeConceptStatus =
  | 'candidate'
  | 'selected'
  | 'rejected'
  | 'deferred'
  | 'needs_user_question'
  | 'blocked'

export type CreativeConceptPriorityBand = 'low' | 'medium' | 'high' | 'hero'

export interface CreativeConceptCandidateRecord {
  id: ID
  opportunityId: ID
  projectId: ID
  conceptType: CreativeConceptType
  title: string
  primaryRole: CreativeConceptPrimaryRole
  viewerBenefit: string
  possibleSkillFamilies: CreativeSkillFamily[]
  possibleSkillKeys: CreativeSkillKey[]
  status: CreativeConceptStatus
  priorityBand: CreativeConceptPriorityBand
  creditTendency: CreativeSkillCreditTendency
  approvalTendency: CreativeSkillApprovalTendency
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeConceptSelectionRecord {
  id: ID
  selectedConceptId: ID
  selectedSkillFamilyCandidates: CreativeSkillFamily[]
  selectedSkillKeyCandidates: CreativeSkillKey[]
  whySelected: string
  lowerCostAlternativeIds: ID[]
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeConceptRejectionRecord {
  id: ID
  rejectedConceptId: ID
  rejectionReason: string
  rejectedFor: 'restraint' | 'duplicate' | 'credit' | 'source_safety' | 'preference' | 'storytiming' | 'quality'
  saferAlternativeConceptId?: ID
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeConceptLowerCostAlternativeRecord {
  id: ID
  conceptId: ID
  alternativeConceptId?: ID
  alternativeSkillKeys: CreativeSkillKey[]
  tradeoffSummary: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeConceptUserQuestionRecord {
  id: ID
  conceptId: ID
  question: string
  reason: string
  blocksSkillScoring: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface CreativeConceptIdeationRunRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  opportunityIds: ID[]
  candidateConceptIds: ID[]
  selectedConceptIds: ID[]
  rejectedConceptIds: ID[]
  userQuestionIds: ID[]
  status: ProcessingStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export type SkillCandidateType =
  | 'primary'
  | 'support'
  | 'optional'
  | 'optional_premium'
  | 'lower_cost_alternative'
  | 'restraint'
  | 'blocked'

export type SkillCandidateStatus =
  | 'candidate'
  | 'recommended'
  | 'selected'
  | 'rejected'
  | 'blocked'
  | 'needs_storytiming'
  | 'needs_approval'
  | 'needs_user_input'

export type SkillResolverRecommendationLevel = CreativeSkillRecommendationLevel

export type StoryTimingReadiness = 'not_needed' | 'ready' | 'needs_coordination' | 'conflict_detected' | 'blocked'

export type RuntimeReadiness = CreativeSkillRuntimeReadiness

export interface SkillCandidateRecord {
  id: ID
  conceptId: ID
  projectId: ID
  editPlanId?: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  candidateType: SkillCandidateType
  status: SkillCandidateStatus
  recommendationLevel: SkillResolverRecommendationLevel
  planningContractType: CreativeSkillPlanningContractType
  score: number
  scoreReason: string
  storyTimingReadiness: StoryTimingReadiness
  runtimeReadiness: RuntimeReadiness
  creditTendency: CreativeSkillCreditTendency
  approvalTendency: CreativeSkillApprovalTendency
  lowerCostAlternativeSkillKeys: CreativeSkillKey[]
  conflictsWithSkillKeys: CreativeSkillKey[]
  supportsSkillKeys: CreativeSkillKey[]
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillCandidateBundleRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  conceptIds: ID[]
  candidateIds: ID[]
  primaryCandidateId?: ID
  supportCandidateIds: ID[]
  storyTimingRequirements: string
  bundleStatus: SkillCandidateStatus
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillCandidateScoreReviewRecord {
  id: ID
  candidateId: ID
  score: number
  scoreReason: string
  preferenceImpact: string
  creditImpact: CreditImpact
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillResolverRunRecord {
  id: ID
  projectId: ID
  editPlanId?: ID
  selectedConceptIds: ID[]
  candidateIds: ID[]
  bundleIds: ID[]
  rejectedCandidateIds: ID[]
  routeDecisionPreviewIds: ID[]
  status: ProcessingStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillRouteDecisionPreviewRecord {
  id: ID
  candidateId: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  routeType: SkillCandidateType
  recommendationLevel: SkillResolverRecommendationLevel
  routeReason: string
  planningContractType: CreativeSkillPlanningContractType
  storyTimingReadiness: StoryTimingReadiness
  approvalRequired: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillLowerCostAlternativeDecisionRecord {
  id: ID
  candidateId: ID
  originalSkillKey: CreativeSkillKey
  alternativeSkillKey: CreativeSkillKey
  tradeoffSummary: string
  selected: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export type SkillRouteDecisionType =
  | 'primary'
  | 'support'
  | 'optional'
  | 'optional_premium'
  | 'lower_cost'
  | 'restraint'
  | 'blocked'
  | 'rejected'
  | 'confirmation_required'
  | 'storytiming_dependent'
  | 'qa_sensitive'

export type SkillRouteStatus =
  | 'draft'
  | 'assembled'
  | 'needs_contract'
  | 'needs_storytiming'
  | 'needs_credit_approval'
  | 'needs_qa'
  | 'ready_for_user_summary'
  | 'approved'
  | 'blocked'
  | 'superseded'

export type SkillRouteRole = 'primary' | 'support' | 'optional' | 'restraint' | 'qa' | 'summary'

export type ApprovalScope = 'none' | 'plan' | 'credit' | 'premium_optional' | 'source_sensitive' | 'generation'

export type RouteCreditBehavior = 'none' | 'estimate_only' | 'approval_required' | 'lower_cost_available' | 'future_reserved'

export interface EditPlanSkillRouteRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  candidateId: ID
  routeBundleId?: ID
  skillKey: CreativeSkillKey
  skillFamily: CreativeSkillFamily
  routeDecisionType: SkillRouteDecisionType
  routeStatus: SkillRouteStatus
  routeRole: SkillRouteRole
  planningContractType: CreativeSkillPlanningContractType
  timeRange?: TimeRange
  scopeSummary: string
  storyTimingReadiness: StoryTimingReadiness
  sourceSafetyStatus: CreativeSkillSourceSafetyStatus
  approvalScope: ApprovalScope
  creditBehavior: RouteCreditBehavior
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface EditPlanSkillRouteBundleRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  routeIds: ID[]
  primaryRouteId?: ID
  supportRouteIds: ID[]
  optionalRouteIds: ID[]
  bundleStatus: SkillRouteStatus
  userVisibleSummaryId?: ID
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillPlanningContractAttachmentRecord {
  id: ID
  routeId: ID
  planningContractType: CreativeSkillPlanningContractType
  planRecordId?: ID
  required: boolean
  attachmentStatus: SkillPlanStatus
  missingReason?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RequiredSkillPlanRecordSet {
  id: ID
  routeId: ID
  requiredContractTypes: CreativeSkillPlanningContractType[]
  attachedPlanRecordIds: ID[]
  missingContractTypes: CreativeSkillPlanningContractType[]
  complete: boolean
  metadata?: JSONObject
}

export interface LowerCostAlternativeRouteLinkRecord {
  id: ID
  routeId: ID
  alternativeRouteId?: ID
  alternativeSkillKey: CreativeSkillKey
  tradeoffSummary: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillRouteConflictFlagRecord {
  id: ID
  routeId: ID
  conflictType: 'storytiming' | 'caption' | 'speech' | 'source_proof' | 'credit_approval' | 'runtime_boundary' | 'preference'
  severity: 'info' | 'warning' | 'blocking' | 'critical'
  summary: string
  resolved: boolean
  metadata?: JSONObject
}

export interface SkillRouteQARequirementRecord {
  id: ID
  routeId: ID
  qaCategory: string
  requiredBefore: 'plan_display' | 'credit_approval' | 'preview_future' | 'execution_future'
  requirementSummary: string
  metadata?: JSONObject
}

export interface SkillRouteRevisionLinkRecord {
  id: ID
  routeId: ID
  revisionRequestId: ID
  revisionImpactSummary: string
  reapprovalRequired: boolean
  reestimateRequired: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillRouteUserVisibleSummaryRecord {
  id: ID
  routeBundleId: ID
  summary: string
  approvalCaveat?: string
  creditCaveat?: string
  sourceSafetyCaveat?: string
  lowerCostAlternativeSummary?: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillPlanAssemblyRunRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  candidateBundleIds: ID[]
  routeBundleIds: ID[]
  conflictFlagIds: ID[]
  qaRequirementIds: ID[]
  status: ProcessingStatus
  routeAssemblyCompleteness?: number
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export type SkillCreditImpact = CreativeSkillCreditTendency

export type SkillCreditEstimateReadiness =
  | 'ready'
  | 'missing_route'
  | 'missing_storytiming'
  | 'missing_source_confirmation'
  | 'missing_user_input'
  | 'blocked'
  | 'future_pending'

export type SkillCreditEstimateCategory =
  | 'included'
  | 'low_cost'
  | 'standard'
  | 'premium_optional'
  | 'generated_future'
  | 'source_sensitive'
  | 'unknown'

export type SkillCreditEstimateConfidence = 'low' | 'medium' | 'high' | 'future_pending'

export type SkillCreditRequiredOrOptional = 'required' | 'optional' | 'optional_premium' | 'lower_cost_alternative'

export type SkillApprovalGroupType = 'plan' | 'credit' | 'premium_optional' | 'source_sensitive' | 'revision' | 'generation_future'

export type SkillApprovalStatus = ApprovalStatus | 'not_requested' | 'future_pending'

export type SkillCreditReservationBoundaryStatus =
  | 'not_applicable'
  | 'estimate_only'
  | 'reservation_future'
  | 'spend_forbidden'
  | 'blocked'

export interface SkillCreditEstimateItemRecord {
  id: ID
  routeId: ID
  routeBundleId?: ID
  skillKey: CreativeSkillKey
  creditImpact: SkillCreditImpact
  estimateCategory: SkillCreditEstimateCategory
  estimateConfidence: SkillCreditEstimateConfidence
  requiredOrOptional: SkillCreditRequiredOrOptional
  approvalGroupId?: ID
  lowerCostAlternativeIds: ID[]
  noGenerationBeforeApproval: true
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface SkillCreditLowerCostAlternativeRecord {
  id: ID
  estimateItemId: ID
  alternativeSkillKey: CreativeSkillKey
  alternativeCreditImpact: SkillCreditImpact
  tradeoffSummary: string
  selected: boolean
  metadata?: JSONObject
}

export interface SkillApprovalGroupRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  approvalGroupType: SkillApprovalGroupType
  approvalStatus: SkillApprovalStatus
  approvalScope: ApprovalScope
  estimateItemIds: ID[]
  approvalCopyId?: ID
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillApprovalCopyRecord {
  id: ID
  approvalGroupId: ID
  headline: string
  body: string
  riskSummary?: string
  lowerCostAlternativeSummary?: string
  noGenerationBeforeApprovalCopy: string
  metadata?: JSONObject
}

export interface SkillCreditEstimateSummaryRecord {
  id: ID
  projectId: ID
  editPlanId: ID
  estimateReadiness: SkillCreditEstimateReadiness
  totalCreditImpact: SkillCreditImpact
  estimateItemIds: ID[]
  approvalGroupIds: ID[]
  reservationBoundaryStatus: SkillCreditReservationBoundaryStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  metadata?: JSONObject
}

export interface SkillRevisionCreditImpactRecord {
  id: ID
  revisionRequestId: ID
  affectedEstimateItemIds: ID[]
  creditImpactChange: SkillCreditImpact
  reapprovalRequired: boolean
  reestimateRequired: boolean
  reason: string
  createdAt: ISODateString
  metadata?: JSONObject
}
