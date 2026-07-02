import type { EditLevel, EditingCategory, SignatureSystem, VisualAssetType } from '../types/reeditpro'

export type LaunchEditingCategoryDefinition = {
  value: EditingCategory
  label: string
  description: string
  bestUseCases: string[]
  defaultSignatureMix: string
  defaultAssetBehavior: string
  defaultFrameBehavior: string
}

export type EditLevelDefinition = {
  value: EditLevel
  label: string
  description: string
  computeBehavior: string
  routingRule: string
}

export type SignatureSystemDefinition = {
  value: SignatureSystem
  label: string
  description: string
  visualSystem: boolean
  supportEngine: boolean
}

export type VisualAssetTypeDefinition = {
  value: VisualAssetType
  label: string
  description: string
}

export const launchEditingCategories: LaunchEditingCategoryDefinition[] = [
  {
    value: 'storytelling',
    label: 'Storytelling',
    description: 'Signature narrative edits with Stroke Motion, still cards, character consistency, and story beats.',
    bestUseCases: ['emotional stories', 'scams', 'case studies', 'personal stories', 'dramatic explanations', 'relationship stories'],
    defaultSignatureMix: 'Stroke Motion, Graphic Design / VisualExplain for cards, SoundSync support.',
    defaultAssetBehavior: 'Animate emotional/reaction beats; use still cards for names/facts/short inserts.',
    defaultFrameBehavior: 'Panel-based story visuals.',
  },
  {
    value: 'lifestyle',
    label: 'Lifestyle',
    description: 'Creator-style edits for daily life, travel, fitness, food, beauty, motivational, and casual content.',
    bestUseCases: ['vlogs', 'day-in-life', 'travel', 'fitness', 'beauty', 'casual talking-head'],
    defaultSignatureMix: 'Clean edit, light graphics, light SoundSync, occasional Stroke Motion.',
    defaultAssetBehavior: 'Prefer stills/light graphics unless motion improves the story.',
    defaultFrameBehavior: 'Keep speaker/footage primary.',
  },
  {
    value: 'business_brand',
    label: 'Business / Brand',
    description: 'Product, service, offer, SaaS, ecommerce, agency, and brand content.',
    bestUseCases: ['product demos', 'service explainers', 'ads', 'ecommerce', 'SaaS', 'coaching', 'agency videos'],
    defaultSignatureMix: 'Graphic Design / VisualExplain, Real Motion if useful, Stroke Motion for story ads.',
    defaultAssetBehavior: 'Use cards, product frames, feature callouts, proof visuals.',
    defaultFrameBehavior: 'Branded panel layouts.',
  },
  {
    value: 'education_explainer',
    label: 'Education / Explainer',
    description: 'High-quality explanation edits using Graphic Design / VisualExplain.',
    bestUseCases: ['tutorials', 'finance explainers', 'health explainers', 'course content', 'step-by-step breakdowns'],
    defaultSignatureMix: 'Graphic Design / VisualExplain, editor motion, diagrams, cards.',
    defaultAssetBehavior: 'Prefer controlled graphic frames over random AI video.',
    defaultFrameBehavior: 'Clean diagram/card panels.',
  },
  {
    value: 'documentary_case_study',
    label: 'Documentary / Case Study',
    description: 'Timeline, evidence, scam/fraud, investigation, case-study, and what-happened videos.',
    bestUseCases: ['online scam stories', 'fraud breakdowns', 'case studies', 'timeline videos', 'public controversy explainers'],
    defaultSignatureMix: 'Evidence cards, name cards, timelines, Graphic Design / VisualExplain, selected Stroke Motion reenactments.',
    defaultAssetBehavior: 'Use neutral stills/cards for claims/names; animate only story/reaction/action beats.',
    defaultFrameBehavior: 'Evidence-board and timeline panels.',
  },
]

export const editLevelDefinitions: EditLevelDefinition[] = [
  {
    value: 'basic',
    label: 'Basic',
    description: 'Professional clean editing with simpler planning and fewer generated assets.',
    computeBehavior: 'Lower compute, fewer fallbacks, and fewer retries while preserving professional quality.',
    routingRule: 'Never route to Veo.',
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'Main production tier for polished ReeditPro edits.',
    computeBehavior: 'Balanced production planning with Wan primary and Hailuo fallback where useful.',
    routingRule: 'Never route to Veo.',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Deepest planning tier with stronger consistency, more fallbacks, and more retries.',
    computeBehavior: 'Allows Premium-only final rescue with Veo 3.1 Lite after Wan/Hailuo are unsuitable or fail QA.',
    routingRule: 'Veo is fallback-only and never primary.',
  },
]

export const signatureSystemDefinitions: SignatureSystemDefinition[] = [
  {
    value: 'stroke_motion',
    label: 'Stroke Motion',
    description: 'Narrative visual storytelling for emotion, transformation, action, and story beats.',
    visualSystem: true,
    supportEngine: false,
  },
  {
    value: 'graphic_design',
    label: 'Graphic Design / VisualExplain',
    description: 'Controlled graphic frames, cards, diagrams, labels, and information design.',
    visualSystem: true,
    supportEngine: false,
  },
  {
    value: 'real_motion',
    label: 'Real Motion',
    description: 'Premium, credit-heavy realistic motion that stays overlay-first and face-safe.',
    visualSystem: true,
    supportEngine: false,
  },
  {
    value: 'sound_sync',
    label: 'SoundSync',
    description: 'Audio and timing support for music, SFX, ducking, beat placement, and polish.',
    visualSystem: false,
    supportEngine: true,
  },
  {
    value: 'none',
    label: 'None',
    description: 'No extra visual or audio signature system for a beat.',
    visualSystem: false,
    supportEngine: false,
  },
]

export const visualAssetTypeDefinitions: VisualAssetTypeDefinition[] = [
  { value: 'animated_scene', label: 'Animated scene', description: 'A generated motion beat where movement improves the story.' },
  { value: 'still_scene', label: 'Still scene', description: 'A still image or key visual held in the edit.' },
  { value: 'fact_card', label: 'Fact card', description: 'A controlled card for facts, claims, amounts, or evidence.' },
  { value: 'name_card', label: 'Name card', description: 'A clear card for names, titles, people, places, or entities.' },
  { value: 'character_card', label: 'Character card', description: 'A consistency anchor or introduction card for a recurring character.' },
  { value: 'list_card', label: 'List card', description: 'A readable list or step sequence.' },
  { value: 'timeline_card', label: 'Timeline card', description: 'A time, event, or sequence marker.' },
  { value: 'graphic_design_frame', label: 'Graphic design frame', description: 'A controlled VisualExplain frame for diagrams, labels, or layouts.' },
  { value: 'motion_design_scene', label: 'Motion design scene', description: 'Editor-controlled animation or motion graphics.' },
  { value: 'real_motion_scene', label: 'Real Motion scene', description: 'A premium realistic visual moment with face-safe placement.' },
  { value: 'still_with_editor_motion', label: 'Still with editor motion', description: 'A still/card animated by ReeditPro editor motion.' },
  { value: 'transition_scene', label: 'Transition scene', description: 'A transition visual that connects story beats.' },
]
