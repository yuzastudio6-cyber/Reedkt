export type SignatureSystem =
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'sound_sync'
  | 'none'

export type EditLevel = 'basic' | 'pro' | 'advanced_viral'

export type HookPolicy = 'required' | 'recommended' | 'optional' | 'not_needed' | 'avoid'

export type StructurePreference =
  | 'preserve_source_order'
  | 'improve_if_needed'
  | 'restructure_for_social'
  | 'let_ai_recommend'

export type VideoWorkflowType =
  | 'simple_clean_edit'
  | 'social_short_viral_clip'
  | 'talking_head_personal_brand'
  | 'podcast_clip'
  | 'vlog_lifestyle'
  | 'product_demo'
  | 'real_estate_property_tour'
  | 'education_explainer'
  | 'marketing_ad'
  | 'testimonial_case_study'
  | 'custom_let_ai_decide'

export type TargetPlatform =
  | 'tiktok_reels_shorts'
  | 'youtube'
  | 'website'
  | 'course_training'
  | 'client_review'
  | 'custom'

export type AspectRatio = '9:16' | '16:9' | '1:1' | 'let_ai_decide'

export type MoodStyle =
  | 'clean'
  | 'premium'
  | 'cinematic'
  | 'energetic'
  | 'emotional'
  | 'educational'
  | 'luxury'
  | 'funny_playful'
  | 'corporate'
  | 'viral_fast_paced'
  | 'let_ai_decide'

export type VisualPreference =
  | 'let_ai_decide'
  | 'keep_visuals_minimal'
  | 'balanced_visual_mix'
  | 'more_stroke_motion'
  | 'more_graphic_design'
  | 'real_motion_if_useful'
  | 'no_extra_visuals'

export type CreditPreference = 'low_credit_cost' | 'balanced' | 'premium_best_result' | 'let_ai_estimate'

export interface ClipSource {
  id: string
  uploadedOrder: number
  fileName: string
  duration: string
  detectedType: string
  notes?: string
  isImportant?: boolean
  isOptional?: boolean
}

export interface SourceSequenceMapItem {
  clipId: string
  uploadedOrder: number
  detectedRole: string
  strengths: string[]
  concerns: string[]
  possibleUses: string[]
}

export interface SignatureRoute {
  timeRange: string
  system: SignatureSystem
  reason: string
  creditImpact: 'none' | 'low' | 'medium' | 'high' | 'premium'
}

export interface CreditEstimate {
  total: number
  breakdown: {
    label: string
    credits: number
    reason: string
  }[]
}

export interface EditPlan {
  goalSummary: string
  sourceSequenceMap: SourceSequenceMapItem[]
  recommendedStructure: string[]
  hookDecision: {
    policy: HookPolicy
    recommendation: string
    reason: string
  }
  referenceDNA?: {
    pacing: string
    music: string
    captions: string
    transitions: string
    visualStyle: string
    adaptationRule: string
  }
  signatureRoutes: SignatureRoute[]
  soundSyncDirection: string
  captionDirection: string
  creditEstimate: CreditEstimate
  approvalRequired: boolean
}

export interface PlannerInput {
  projectName: string
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  workflowType: VideoWorkflowType
  editLevel: EditLevel
  structurePreference: StructurePreference
  moodStyle: MoodStyle
  visualPreference: VisualPreference
  referenceUrl: string
  customInstructions: string
  creditPreference: CreditPreference
  clips: ClipSource[]
}
