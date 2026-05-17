import type { EditingCategory, SignatureSystem, VisualAssetPlanItem, VisualAssetType } from '../types/reeditpro'

export type StyleMode = {
  id: string
  label: string
  signatureSystem: SignatureSystem
  moodTags: string[]
  narrativePhaseTags: string[]
  actionIntensity: VisualAssetPlanItem['actionIntensity'][]
  strokeColorRule: string
  fillRule: string
  lineWeight: string
  lineShape: string
  motionBehavior: string
  backgroundRule: string
  transitionBehavior: string
  bestUseCases: string[]
  avoidUseCases: string[]
  promptNotes: string
}

type SelectStyleModeParams = {
  editingCategory: EditingCategory
  signatureSystem: SignatureSystem
  narrativePhase: string
  emotion: string
  actionIntensity: VisualAssetPlanItem['actionIntensity']
  assetType: VisualAssetType
}

export const styleModes: StyleMode[] = [
  {
    id: 'neutral_stroke',
    label: 'Neutral Stroke',
    signatureSystem: 'stroke_motion',
    moodTags: ['neutral', 'normal', 'setup', 'everyday', 'explanation'],
    narrativePhaseTags: ['setup', 'context', 'development'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Black stroke on white panel.',
    fillRule: 'Minimal/no fill.',
    lineWeight: 'Medium clean stroke.',
    lineShape: 'Rounded and readable.',
    motionBehavior: 'Calm motion with clear holds.',
    backgroundRule: 'White or near-white panel background.',
    transitionBehavior: 'Simple fade or slide.',
    bestUseCases: ['normal setup', 'everyday explanation', 'neutral story beats'],
    avoidUseCases: ['panic', 'danger', 'heavy conflict'],
    promptNotes: 'Keep the drawing language clean and restrained.',
  },
  {
    id: 'warm_minimal',
    label: 'Warm Minimal',
    signatureSystem: 'stroke_motion',
    moodTags: ['warm', 'happy', 'romance', 'family', 'comfort', 'peaceful'],
    narrativePhaseTags: ['setup', 'memory', 'resolution'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Black stroke with warm soft accent.',
    fillRule: 'Minimal fill with soft warm emphasis only.',
    lineWeight: 'Medium-light.',
    lineShape: 'Soft and rounded.',
    motionBehavior: 'Gentle motion and soft easing.',
    backgroundRule: 'White/near-white panel with warm accent allowed.',
    transitionBehavior: 'Soft dissolve or drift.',
    bestUseCases: ['romance', 'family', 'comfort', 'peaceful moments', 'happy setup'],
    avoidUseCases: ['danger', 'panic', 'sharp betrayal'],
    promptNotes: 'Use warmth without making the beat decorative.',
  },
  {
    id: 'tension_stroke',
    label: 'Tension Stroke',
    signatureSystem: 'stroke_motion',
    moodTags: ['confusion', 'suspicion', 'reveal', 'distrust', 'tension'],
    narrativePhaseTags: ['trigger', 'reveal', 'turning_point'],
    actionIntensity: ['medium', 'high'],
    strokeColorRule: 'Black stroke with darker/red accent.',
    fillRule: 'Sparse fill; reserve accent for reveal points.',
    lineWeight: 'Tighter medium stroke.',
    lineShape: 'Sharper line language.',
    motionBehavior: 'Tighter motion with quick holds and reveal beats.',
    backgroundRule: 'White panel with restrained danger accent.',
    transitionBehavior: 'Cut, snap, or quick push.',
    bestUseCases: ['confusion', 'suspicion', 'emotional shift', 'reveal', 'distrust'],
    avoidUseCases: ['calm happy setup', 'soft educational diagrams'],
    promptNotes: 'Use tension cues only where the story turns.',
  },
  {
    id: 'red_only_stroke',
    label: 'Red Only Stroke',
    signatureSystem: 'stroke_motion',
    moodTags: ['danger', 'pain', 'hell', 'panic', 'suffering', 'intensity'],
    narrativePhaseTags: ['crisis', 'conflict', 'climax'],
    actionIntensity: ['high', 'extreme'],
    strokeColorRule: 'Red stroke only.',
    fillRule: 'No fill or minimal fill.',
    lineWeight: 'High contrast medium-heavy stroke.',
    lineShape: 'Sharp symbolic marks.',
    motionBehavior: 'Chaotic flicker, jitter, and urgent movement.',
    backgroundRule: 'White panel for high contrast.',
    transitionBehavior: 'Jitter cut or hard flash.',
    bestUseCases: ['danger', 'pain', 'hell', 'panic', 'suffering', 'symbolic intensity'],
    avoidUseCases: ['calm scenes', 'romantic scenes', 'neutral explanations'],
    promptNotes: 'Use only for intense symbolic beats.',
  },
  {
    id: 'sadness_isolation',
    label: 'Sadness Isolation',
    signatureSystem: 'stroke_motion',
    moodTags: ['heartbreak', 'abandonment', 'grief', 'loneliness', 'aftermath', 'sad'],
    narrativePhaseTags: ['ending', 'aftermath', 'reflection'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Thin black/gray strokes.',
    fillRule: 'Minimal fill with more negative space.',
    lineWeight: 'Thin to medium-thin.',
    lineShape: 'Sparse, fragile lines.',
    motionBehavior: 'Slower motion and longer holds.',
    backgroundRule: 'White/near-white panel with negative space.',
    transitionBehavior: 'Slow fade or drift out.',
    bestUseCases: ['heartbreak', 'abandonment', 'grief', 'loneliness', 'aftermath'],
    avoidUseCases: ['product proof', 'energetic tutorial steps'],
    promptNotes: 'Make the beat feel quiet and uncluttered.',
  },
  {
    id: 'chaos_conflict',
    label: 'Chaos Conflict',
    signatureSystem: 'stroke_motion',
    moodTags: ['panic', 'argument', 'breakdown', 'crowd', 'conflict', 'stress'],
    narrativePhaseTags: ['conflict', 'climax', 'reaction'],
    actionIntensity: ['high', 'extreme'],
    strokeColorRule: 'Black stroke with urgent accent only if needed.',
    fillRule: 'Minimal fill; prioritize movement.',
    lineWeight: 'Thicker/jagged strokes.',
    lineShape: 'Jittered and angular.',
    motionBehavior: 'Fast transitions, shake, and jitter.',
    backgroundRule: 'White panel to keep chaos readable.',
    transitionBehavior: 'Fast cuts and sharp wipes.',
    bestUseCases: ['panic', 'argument', 'emotional breakdown', 'crowd stress', 'conflict'],
    avoidUseCases: ['neutral setup', 'premium brand proof'],
    promptNotes: 'Keep the chaos legible; do not overload the frame.',
  },
  {
    id: 'memory_flashback',
    label: 'Memory Flashback',
    signatureSystem: 'stroke_motion',
    moodTags: ['past', 'memory', 'reflection', 'flashback', 'time'],
    narrativePhaseTags: ['memory', 'flashback', 'context'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Faded gray or soft monochrome.',
    fillRule: 'Light fill only.',
    lineWeight: 'Light and airy.',
    lineShape: 'Soft sketch line.',
    motionBehavior: 'Lighter motion with drifting transitions.',
    backgroundRule: 'White/near-white panel with faded treatment.',
    transitionBehavior: 'Dissolve, blur, or soft wipe.',
    bestUseCases: ['past events', 'reflection', 'time jumps'],
    avoidUseCases: ['urgent danger', 'exact diagrams'],
    promptNotes: 'Signal memory without lowering clarity.',
  },
  {
    id: 'clean_visual_explain',
    label: 'Clean VisualExplain',
    signatureSystem: 'graphic_design',
    moodTags: ['clean', 'educational', 'clear', 'step', 'framework'],
    narrativePhaseTags: ['setup', 'development', 'summary'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Clean dark lines and brand-safe accents.',
    fillRule: 'Controlled card fills only.',
    lineWeight: 'Crisp UI-weight lines.',
    lineShape: 'Grid-aligned and readable.',
    motionBehavior: 'Diagram build, arrow flow, highlight, and count-up.',
    backgroundRule: 'White panel or dark card depending frame plan.',
    transitionBehavior: 'Slide, reveal, or build.',
    bestUseCases: ['education', 'frameworks', 'diagrams', 'step-by-step', 'lists'],
    avoidUseCases: ['raw emotional reenactment'],
    promptNotes: 'Prioritize exact hierarchy and readable labels.',
  },
  {
    id: 'evidence_board',
    label: 'Evidence Board',
    signatureSystem: 'graphic_design',
    moodTags: ['documentary', 'case', 'timeline', 'evidence', 'claim', 'proof'],
    narrativePhaseTags: ['setup', 'evidence', 'timeline', 'summary'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Neutral dark lines with proof-safe accents.',
    fillRule: 'Neutral cards, pins, and timeline blocks.',
    lineWeight: 'Crisp and restrained.',
    lineShape: 'Card/timeline geometry.',
    motionBehavior: 'Evidence reveal, timeline build, and connection lines.',
    backgroundRule: 'White or neutral panel background.',
    transitionBehavior: 'Card reveal or evidence-board pan.',
    bestUseCases: ['documentary', 'case study', 'timelines', 'claims', 'names', 'proof', 'evidence'],
    avoidUseCases: ['unverified sensational visuals'],
    promptNotes: 'Keep claims neutral and fact-safe.',
  },
  {
    id: 'business_premium',
    label: 'Business Premium',
    signatureSystem: 'graphic_design',
    moodTags: ['business', 'premium', 'brand', 'product', 'offer', 'saas'],
    narrativePhaseTags: ['problem', 'proof', 'offer', 'summary'],
    actionIntensity: ['low', 'medium'],
    strokeColorRule: 'Clean brand lines with premium restraint.',
    fillRule: 'Polished cards and product callouts.',
    lineWeight: 'Crisp medium UI weight.',
    lineShape: 'Precise, editorial, and product-friendly.',
    motionBehavior: 'Feature callout, count-up, highlight, and clean slide.',
    backgroundRule: 'White/custom brand panel background.',
    transitionBehavior: 'Clean slide or premium fade.',
    bestUseCases: ['product', 'brand', 'offer', 'SaaS', 'service explainers'],
    avoidUseCases: ['chaotic emotional reenactments'],
    promptNotes: 'Keep the layout polished and conversion-aware.',
  },
  {
    id: 'real_motion_clean',
    label: 'Real Motion Clean',
    signatureSystem: 'real_motion',
    moodTags: ['object', 'product', 'proof', 'realistic', 'clean'],
    narrativePhaseTags: ['proof', 'demo', 'feature', 'result'],
    actionIntensity: ['medium', 'high'],
    strokeColorRule: 'Not stroke-first; use realistic object edges.',
    fillRule: 'Realistic object/proof fill, face-safe.',
    lineWeight: 'N/A for realistic object motion.',
    lineShape: 'Clean object silhouette.',
    motionBehavior: 'Subtle realistic object/product/proof motion.',
    backgroundRule: 'Matching panel background; overlay-first and face-safe.',
    transitionBehavior: 'Clean placement and fade/slide into panel.',
    bestUseCases: ['object motion', 'product proof', 'realistic proof moments'],
    avoidUseCases: ['faces', 'identity-sensitive moments', 'cheap decorative motion'],
    promptNotes: 'Keep Real Motion face-safe, overlay-first, and credit-aware.',
  },
]

function textHasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

export function selectStyleMode(params: SelectStyleModeParams): string {
  const searchable = `${params.narrativePhase} ${params.emotion} ${params.assetType}`.toLowerCase()

  if (params.signatureSystem === 'real_motion') {
    return 'real_motion_clean'
  }

  if (params.editingCategory === 'education_explainer') {
    return 'clean_visual_explain'
  }

  if (params.editingCategory === 'documentary_case_study' && params.signatureSystem === 'graphic_design') {
    return 'evidence_board'
  }

  if (params.editingCategory === 'business_brand' && params.signatureSystem === 'graphic_design') {
    return params.assetType === 'motion_design_scene' ? 'clean_visual_explain' : 'business_premium'
  }

  if (params.signatureSystem === 'graphic_design') {
    return params.editingCategory === 'documentary_case_study' ? 'evidence_board' : 'clean_visual_explain'
  }

  if (textHasAny(searchable, ['danger', 'pain', 'hell', 'panic', 'suffering'])) {
    return 'red_only_stroke'
  }

  if (textHasAny(searchable, ['sad', 'grief', 'lonely', 'aftermath', 'ending', 'heartbreak', 'abandon'])) {
    return 'sadness_isolation'
  }

  if (textHasAny(searchable, ['conflict', 'argument', 'breakdown', 'chaos']) || params.actionIntensity === 'extreme') {
    return 'chaos_conflict'
  }

  if (textHasAny(searchable, ['reveal', 'trigger', 'suspicion', 'confusion', 'distrust', 'tension'])) {
    return 'tension_stroke'
  }

  if (textHasAny(searchable, ['past', 'memory', 'flashback', 'reflection'])) {
    return 'memory_flashback'
  }

  if (params.editingCategory === 'storytelling' && textHasAny(searchable, ['happy', 'warm', 'family', 'romance', 'comfort', 'setup'])) {
    return 'warm_minimal'
  }

  return 'neutral_stroke'
}

export function getStyleModeLabel(styleModeId?: string) {
  return styleModes.find((styleMode) => styleMode.id === styleModeId)?.label ?? styleModeId ?? 'Auto style'
}
