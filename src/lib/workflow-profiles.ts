import type {
  AspectRatio,
  CreditPreference,
  EditLevel,
  MoodStyle,
  StructurePreference,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../types/reeditpro'

export type SelectOption<T extends string> = {
  value: T
  label: string
  description?: string
}

export type WorkflowProfile = {
  value: VideoWorkflowType
  label: string
  purpose: string
  hookGuidance: string
  pacingGuidance: string
  creditExpectation: string
}

export const targetPlatformOptions: SelectOption<TargetPlatform>[] = [
  { value: 'tiktok_reels_shorts', label: 'TikTok/Reels/Shorts' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Website' },
  { value: 'course_training', label: 'Course/training' },
  { value: 'client_review', label: 'Client review' },
  { value: 'custom', label: 'Custom' },
]

export const aspectRatioOptions: SelectOption<AspectRatio>[] = [
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
  { value: 'let_ai_decide', label: 'Let AI decide' },
]

export const editLevelOptions: SelectOption<EditLevel>[] = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Professional clean editing with lower compute, fewer generated assets, and simpler planning.',
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'Polished production planning with Wan/Hailuo routing where animation improves the story.',
  },
  {
    value: 'premium',
    label: 'Premium - deeper planning and fallback',
    description: 'Strongest planning, more fallbacks, more retries, and Premium-only Veo final fallback when needed.',
  },
]

export const structurePreferenceOptions: SelectOption<StructurePreference>[] = [
  { value: 'preserve_source_order', label: 'Preserve my source order' },
  { value: 'improve_if_needed', label: 'Improve the structure if needed' },
  { value: 'restructure_for_social', label: 'Restructure for best social performance' },
  { value: 'let_ai_recommend', label: 'Let AI recommend' },
]

export const moodStyleOptions: SelectOption<MoodStyle>[] = [
  { value: 'clean', label: 'Clean' },
  { value: 'premium', label: 'Premium' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'educational', label: 'Educational' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'funny_playful', label: 'Funny / playful' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'viral_fast_paced', label: 'Viral / fast-paced' },
  { value: 'let_ai_decide', label: 'Let AI decide' },
]

export const visualPreferenceOptions: SelectOption<VisualPreference>[] = [
  { value: 'let_ai_decide', label: 'Let AI decide' },
  { value: 'keep_visuals_minimal', label: 'Keep visuals minimal' },
  { value: 'balanced_visual_mix', label: 'Balanced visual mix' },
  { value: 'more_stroke_motion', label: 'Use more Stroke Motion' },
  { value: 'more_graphic_design', label: 'Use more Graphic Design' },
  { value: 'real_motion_if_useful', label: 'Use Real Motion if useful' },
  { value: 'no_extra_visuals', label: 'No extra visuals' },
]

export const creditPreferenceOptions: SelectOption<CreditPreference>[] = [
  { value: 'low_credit_cost', label: 'Low credit cost' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'premium_best_result', label: 'Premium / best result' },
  { value: 'let_ai_estimate', label: 'Let AI estimate' },
]

export const workflowProfiles: WorkflowProfile[] = [
  {
    value: 'simple_clean_edit',
    label: 'Simple Clean Edit',
    purpose: 'Clean up footage without changing the natural structure.',
    hookGuidance: 'Not needed or avoid unless the user asks.',
    pacingGuidance: 'Remove dead space, stumbles, and filler while preserving natural speech.',
    creditExpectation: 'Low',
  },
  {
    value: 'social_short_viral_clip',
    label: 'Social Short / Viral Clip',
    purpose: 'Create a high-retention short-form edit for TikTok, Reels, or Shorts.',
    hookGuidance: 'Recommended or required depending on the user goal.',
    pacingGuidance: 'Fast, tight, clear, with strong early payoff.',
    creditExpectation: 'Medium to high',
  },
  {
    value: 'talking_head_personal_brand',
    label: 'Talking Head / Personal Brand',
    purpose: 'Turn speaker-led footage into a polished personal brand edit.',
    hookGuidance: 'Optional or recommended depending on distribution goal.',
    pacingGuidance: 'Tighten delivery while keeping authenticity.',
    creditExpectation: 'Medium',
  },
  {
    value: 'podcast_clip',
    label: 'Podcast Clip',
    purpose: 'Extract a compelling moment from conversational footage.',
    hookGuidance: 'Recommended for social clips, optional for archive clips.',
    pacingGuidance: 'Remove rambling while preserving conversational meaning.',
    creditExpectation: 'Medium',
  },
  {
    value: 'vlog_lifestyle',
    label: 'Vlog / Lifestyle',
    purpose: 'Shape casual footage into a natural, watchable story.',
    hookGuidance: 'Natural hook or optional.',
    pacingGuidance: 'Keep human rhythm while trimming dull moments.',
    creditExpectation: 'Medium',
  },
  {
    value: 'product_demo',
    label: 'Product Demo',
    purpose: 'Explain or sell a product clearly.',
    hookGuidance: 'Recommended for public demos, optional for internal training.',
    pacingGuidance: 'Clear, efficient, benefit-led.',
    creditExpectation: 'Medium to high',
  },
  {
    value: 'real_estate_property_tour',
    label: 'Real Estate / Property Tour',
    purpose: 'Present a property, place, room, or location with clarity and mood.',
    hookGuidance: 'Optional depending on luxury/natural vs social performance goal.',
    pacingGuidance: 'Smooth, spatially coherent, and not chaotic.',
    creditExpectation: 'Medium, higher if Real Motion is approved',
  },
  {
    value: 'education_explainer',
    label: 'Education / Explainer',
    purpose: 'Help viewers understand a concept, lesson, process, or framework.',
    hookGuidance: 'Optional for course/training, recommended for public social clips.',
    pacingGuidance: 'Clear, structured, and easy to follow.',
    creditExpectation: 'Medium',
  },
  {
    value: 'marketing_ad',
    label: 'Marketing Ad',
    purpose: 'Create a persuasive edit that drives action.',
    hookGuidance: 'Usually required.',
    pacingGuidance: 'Direct, benefit-led, proof-oriented, and CTA-aware.',
    creditExpectation: 'Medium to high',
  },
  {
    value: 'testimonial_case_study',
    label: 'Testimonial / Case Study',
    purpose: 'Turn proof, customer story, or outcome footage into a trustworthy edit.',
    hookGuidance: 'Recommended for public social, optional for sales pages.',
    pacingGuidance: 'Credible, clear, and not overhyped.',
    creditExpectation: 'Medium',
  },
  {
    value: 'custom_let_ai_decide',
    label: 'Custom / Let AI Decide',
    purpose: 'Let AI choose the planning approach for unusual or mixed content.',
    hookGuidance: 'Determined by user goal, platform, and content.',
    pacingGuidance: 'Determined by edit strategy.',
    creditExpectation: 'Variable',
  },
]

export function getWorkflowProfile(value: VideoWorkflowType) {
  return workflowProfiles.find((profile) => profile.value === value) ?? workflowProfiles[0]
}
