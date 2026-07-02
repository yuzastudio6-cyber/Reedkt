import type {
  BrollPolicyId,
  CaptionStyleId,
  ColorGradeStyleId,
  CustomEditingDirective,
  EditLevel,
  EditingCategory,
  EditingOperationType,
  MoodStyle,
  PacingStyleId,
  ProfessionalEditingDirective,
  ProfessionalEditStyleId,
  SoundStyleId,
  TargetPlatform,
  TransitionFamilyId,
  VisualPreference,
} from '../types/reeditpro'

type DefaultDirectiveParams = {
  editingCategory: EditingCategory
  editLevel: EditLevel
  targetPlatform: TargetPlatform
  moodStyle?: MoodStyle
  visualPreference?: VisualPreference
}

type ProfessionalEditStylePreset = {
  id: ProfessionalEditStyleId
  label: string
  description: string
  bestUseCases: string[]
  defaultForCategories: EditingCategory[]
  defaultForLevels?: EditLevel[]
  behaviorNotes: string[]
  avoidRules: string[]
  qaChecks: string[]
}

type StandardPreset<T extends string> = {
  id: T
  label: string
  description: string
  bestUseCases: string[]
  defaultForCategories: EditingCategory[]
  defaultForLevels?: EditLevel[]
  behaviorNotes: string[]
  avoidRules: string[]
  qaChecks: string[]
}

type TransitionFamilyPreset = StandardPreset<TransitionFamilyId> & {
  transitions: string[]
}

type ColorGradePreset = StandardPreset<ColorGradeStyleId> & {
  look: string
  operations: string[]
}

type CaptionStylePreset = StandardPreset<CaptionStyleId> & {
  placement: string
  density: string
  animation: string
  safeZoneRules: string[]
}

type BrollPolicyPreset = StandardPreset<BrollPolicyId> & {
  sourcePriority: string[]
  meaningRule: string
}

const universalDirectiveQaChecks = [
  'must-follow rules satisfied',
  'avoid rules not violated',
  'captions stay readable and safe',
  'b-roll supports meaning',
  'transitions match edit style',
  'sound is clean and not overpowering voice',
  'AI visuals stay inside frame panels',
  'approval happens before generation',
]

export const professionalEditStyles: ProfessionalEditStylePreset[] = [
  {
    id: 'clean_professional',
    label: 'Clean professional',
    description: 'A polished clean edit without heavy stylization.',
    bestUseCases: ['training clips', 'client updates', 'simple talking-head', 'internal content'],
    defaultForCategories: ['lifestyle', 'education_explainer'],
    defaultForLevels: ['basic'],
    behaviorNotes: ['Preserve natural meaning', 'Use simple clean cuts', 'Keep visual density low'],
    avoidRules: ['No random b-roll', 'No aggressive social effects', 'No unnecessary AI video'],
    qaChecks: ['clean pacing', 'readable captions', 'natural color correction'],
  },
  {
    id: 'premium_clean',
    label: 'Premium clean',
    description: 'Refined, confident, and polished without clutter.',
    bestUseCases: ['founder clips', 'brand videos', 'testimonials', 'premium creator content'],
    defaultForCategories: ['business_brand', 'storytelling'],
    defaultForLevels: ['pro', 'premium'],
    behaviorNotes: ['Use tasteful visual polish', 'Prioritize clarity', 'Keep transitions motivated'],
    avoidRules: ['Avoid noisy captions', 'Avoid overproduced social effects'],
    qaChecks: ['premium polish remains restrained', 'visuals do not hide speaker or product'],
  },
  {
    id: 'high_retention_social',
    label: 'High-retention social',
    description: 'A hook-aware short-form style built to hold attention.',
    bestUseCases: ['TikTok', 'Reels', 'Shorts', 'creator clips'],
    defaultForCategories: ['storytelling', 'lifestyle'],
    behaviorNotes: ['Use strong early payoff', 'Cut on keywords and beats', 'Use captions as retention support'],
    avoidRules: ['Avoid meaningless transitions', 'Avoid fake drama', 'Avoid visual clutter'],
    qaChecks: ['hook is justified', 'pacing remains understandable'],
  },
  {
    id: 'cinematic_story',
    label: 'Cinematic story',
    description: 'Narrative editing for emotional or dramatic story arcs.',
    bestUseCases: ['personal stories', 'relationship stories', 'dramatic explanations', 'case stories'],
    defaultForCategories: ['storytelling'],
    behaviorNotes: ['Use emotional pauses', 'Support story turns', 'Use Stroke Motion only where motion improves meaning'],
    avoidRules: ['Avoid comedy timing unless requested', 'Avoid random dramatic filters'],
    qaChecks: ['emotion supports story', 'pauses are intentional'],
  },
  {
    id: 'documentary_evidence',
    label: 'Documentary evidence',
    description: 'Neutral evidence-led editing for timelines, claims, and investigations.',
    bestUseCases: ['scam stories', 'fraud breakdowns', 'case studies', 'investigations'],
    defaultForCategories: ['documentary_case_study'],
    behaviorNotes: ['Separate fact from interpretation', 'Use neutral proof cards', 'Show timeline logic clearly'],
    avoidRules: ['Avoid speculative visuals', 'Avoid playful colors', 'Avoid overstated claims'],
    qaChecks: ['claims stay neutral', 'evidence supports the edit'],
  },
  {
    id: 'education_explainer',
    label: 'Education explainer',
    description: 'Structured teaching style for concepts, frameworks, and steps.',
    bestUseCases: ['tutorials', 'course clips', 'finance explainers', 'step-by-step teaching'],
    defaultForCategories: ['education_explainer'],
    behaviorNotes: ['Use diagrams and cards', 'Prefer exact labels', 'Sequence ideas clearly'],
    avoidRules: ['Avoid random AI video when diagrams are clearer', 'Avoid overloaded text'],
    qaChecks: ['concept hierarchy is clear', 'labels are readable'],
  },
  {
    id: 'luxury_real_estate',
    label: 'Luxury real estate',
    description: 'Smooth premium spatial editing for properties and places.',
    bestUseCases: ['property tours', 'rental listings', 'luxury walkthroughs', 'hospitality'],
    defaultForCategories: ['business_brand', 'lifestyle'],
    behaviorNotes: ['Preserve spatial clarity', 'Use smooth movement', 'Let footage breathe'],
    avoidRules: ['Avoid chaotic cuts', 'Avoid glitch effects', 'Avoid breaking room continuity'],
    qaChecks: ['space feels coherent', 'features remain visible'],
  },
  {
    id: 'business_product',
    label: 'Business product',
    description: 'Benefit-led editing for products, services, offers, and brands.',
    bestUseCases: ['SaaS demos', 'product demos', 'ecommerce', 'agency offers'],
    defaultForCategories: ['business_brand'],
    behaviorNotes: ['Lead with problem and proof', 'Use product feature b-roll', 'Keep claims clear'],
    avoidRules: ['Avoid vague visuals', 'Avoid hiding product details'],
    qaChecks: ['offer is understandable', 'product proof is visible'],
  },
  {
    id: 'lifestyle_natural',
    label: 'Lifestyle natural',
    description: 'Human creator editing for casual stories and daily-life footage.',
    bestUseCases: ['day-in-life', 'travel', 'fitness', 'food', 'beauty'],
    defaultForCategories: ['lifestyle'],
    behaviorNotes: ['Preserve human rhythm', 'Use light visual support', 'Let source footage stay primary'],
    avoidRules: ['Avoid corporate polish unless requested', 'Avoid heavy AI video'],
    qaChecks: ['pacing feels human', 'visual support stays light'],
  },
  {
    id: 'energetic_creator',
    label: 'Energetic creator',
    description: 'High-energy creator editing with strong rhythm.',
    bestUseCases: ['fitness', 'motivation', 'creator launches', 'casual social'],
    defaultForCategories: ['lifestyle', 'storytelling'],
    behaviorNotes: ['Use beat-synced emphasis', 'Keep captions energetic', 'Use impacts only where useful'],
    avoidRules: ['Avoid overpowering voice', 'Avoid unreadable captions'],
    qaChecks: ['energy supports message', 'sound does not overpower speech'],
  },
]

export const pacingStyles: StandardPreset<PacingStyleId>[] = [
  { id: 'natural', label: 'Natural', description: 'Human rhythm with light cleanup.', bestUseCases: ['lifestyle', 'vlogs', 'simple updates'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Keep authentic pauses'], avoidRules: ['Do not over-tighten'], qaChecks: ['natural flow preserved'] },
  { id: 'clean_tight', label: 'Clean tight', description: 'Clean pacing with weak gaps removed.', bestUseCases: ['business', 'talking-head', 'education'], defaultForCategories: ['business_brand', 'education_explainer'], behaviorNotes: ['Remove dead space'], avoidRules: ['Do not remove meaning'], qaChecks: ['pacing stays clear'] },
  { id: 'fast_social', label: 'Fast social', description: 'Short-form speed and quick visual changes.', bestUseCases: ['social clips', 'creator edits'], defaultForCategories: ['storytelling', 'lifestyle'], behaviorNotes: ['Cut quickly but clearly'], avoidRules: ['Do not create confusion'], qaChecks: ['viewer can follow'] },
  { id: 'high_retention', label: 'High retention', description: 'Hook-aware pacing that protects attention.', bestUseCases: ['ads', 'shorts', 'viral clips'], defaultForCategories: ['storytelling', 'business_brand'], behaviorNotes: ['Move payoff earlier'], avoidRules: ['Do not fake urgency'], qaChecks: ['hook supports goal'] },
  { id: 'cinematic_slow_build', label: 'Cinematic slow build', description: 'Story pacing with gradual emotional build.', bestUseCases: ['storytelling', 'premium edits'], defaultForCategories: ['storytelling'], behaviorNotes: ['Let emotional beats breathe'], avoidRules: ['Avoid dull dead space'], qaChecks: ['pauses are intentional'] },
  { id: 'documentary_measured', label: 'Documentary measured', description: 'Evidence-led pacing with room for clarity.', bestUseCases: ['documentary', 'case studies'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Prioritize clarity'], avoidRules: ['Avoid sensational rhythm'], qaChecks: ['timeline remains clear'] },
  { id: 'educational_structured', label: 'Educational structured', description: 'Step-by-step pacing for learning.', bestUseCases: ['tutorials', 'courses'], defaultForCategories: ['education_explainer'], behaviorNotes: ['Reveal ideas in order'], avoidRules: ['Avoid rushing labels'], qaChecks: ['steps are understandable'] },
  { id: 'luxury_smooth', label: 'Luxury smooth', description: 'Calm, premium movement and pacing.', bestUseCases: ['real estate', 'luxury lifestyle'], defaultForCategories: ['business_brand', 'lifestyle'], behaviorNotes: ['Use smooth transitions'], avoidRules: ['Avoid harsh jumps'], qaChecks: ['movement feels refined'] },
  { id: 'comedy_timing', label: 'Comedy timing', description: 'Timing for punchlines and reaction beats.', bestUseCases: ['playful creator edits'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Protect punchline beats'], avoidRules: ['Do not apply to serious content unless requested'], qaChecks: ['timing supports joke'] },
  { id: 'emotional_pause', label: 'Emotional pause', description: 'Keep meaningful pauses for emotional weight.', bestUseCases: ['personal stories', 'aftermath beats'], defaultForCategories: ['storytelling'], behaviorNotes: ['Keep silence when it matters'], avoidRules: ['Avoid cutting away from emotion too soon'], qaChecks: ['pause supports story'] },
]

export const transitionFamilies: TransitionFamilyPreset[] = [
  { id: 'clean_cut_transitions', label: 'Clean cut transitions', description: 'Professional cut-based transitions.', bestUseCases: ['clean edits', 'talking-head', 'education'], defaultForCategories: ['lifestyle', 'education_explainer', 'business_brand'], behaviorNotes: ['Use cuts as the default'], avoidRules: ['Avoid random movement'], qaChecks: ['cut is motivated'], transitions: ['hard cut', 'jump cut', 'cut on word', 'cut on action', 'cutaway', 'J-cut', 'L-cut', 'match cut', 'motivated cut', 'invisible cut', 'smash cut', 'reaction cut'] },
  { id: 'smooth_premium_transitions', label: 'Smooth premium transitions', description: 'Subtle premium movement and dissolves.', bestUseCases: ['premium clean', 'real estate', 'cinematic story'], defaultForCategories: ['storytelling', 'lifestyle', 'business_brand'], behaviorNotes: ['Use sparingly'], avoidRules: ['Avoid covering bad cuts with effects'], qaChecks: ['transition feels motivated'], transitions: ['cross dissolve', 'dip to black', 'dip to white', 'soft blur dissolve', 'film-style dissolve', 'slow push transition', 'elegant slide', 'masked reveal', 'light sweep', 'subtle parallax transition'] },
  { id: 'social_viral_transitions', label: 'Social viral transitions', description: 'High-energy social transition language.', bestUseCases: ['shorts', 'creator edits', 'ads'], defaultForCategories: ['storytelling', 'lifestyle'], behaviorNotes: ['Sync to beats or words'], avoidRules: ['Avoid clutter and nausea'], qaChecks: ['transition supports retention'], transitions: ['snap zoom', 'whip pan', 'flash cut', 'speed ramp', 'motion blur swipe', 'glitch hit', 'shake impact', 'freeze-frame punch', 'beat-synced cut', 'pop transition', 'whoosh transition', 'crash zoom'] },
  { id: 'graphic_motion_design_transitions', label: 'Graphic motion design transitions', description: 'Controlled VisualExplain motion transitions.', bestUseCases: ['education', 'business', 'diagrams'], defaultForCategories: ['education_explainer', 'business_brand'], behaviorNotes: ['Use exact layout control'], avoidRules: ['Avoid unreadable text'], qaChecks: ['text remains legible'], transitions: ['card slide', 'card stack', 'shape wipe', 'line-draw reveal', 'arrow flow', 'diagram build', 'step reveal', 'number count-up', 'highlight sweep', 'split panel reveal', 'mask reveal', 'label pop-in', 'icon morph'] },
  { id: 'documentary_evidence_transitions', label: 'Documentary evidence transitions', description: 'Neutral transitions for evidence and timelines.', bestUseCases: ['case studies', 'investigations'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Keep claims neutral'], avoidRules: ['Avoid sensational framing'], qaChecks: ['evidence remains clear'], transitions: ['timeline slide', 'evidence card pin', 'paper slide', 'document zoom', 'map zoom', 'red-circle highlight', 'case-board line connect', 'archival dissolve', 'neutral lower-third reveal', 'screenshot push-in'] },
  { id: 'stroke_motion_transitions', label: 'Stroke Motion transitions', description: 'Line and character transition language for narrative motion.', bestUseCases: ['storytelling', 'selected reenactments'], defaultForCategories: ['storytelling', 'documentary_case_study'], behaviorNotes: ['Use only when story movement helps'], avoidRules: ['Avoid decorative strokes'], qaChecks: ['motion supports beat'], transitions: ['line continuation', 'path draw', 'character morph', 'symbol transform', 'relationship line crack', 'line reconnect', 'motion trail', 'red danger flicker', 'emotion pulse', 'stroke wipe'] },
]

export const colorGradeStyles: ColorGradePreset[] = [
  { id: 'clean_natural', label: 'Clean natural', description: 'Balanced, accurate, natural correction.', look: 'Natural and clean', bestUseCases: ['basic edits', 'training', 'talking-head'], defaultForCategories: ['lifestyle', 'education_explainer'], behaviorNotes: ['Protect skin tones'], operations: ['exposure correction', 'white balance', 'shot matching', 'skin tone protection'], avoidRules: ['Avoid heavy LUTs'], qaChecks: ['faces look natural'] },
  { id: 'premium_clean', label: 'Premium clean', description: 'Refined contrast and polished tone.', look: 'Clean contrast and refined highlights', bestUseCases: ['brand', 'premium creator', 'testimonials'], defaultForCategories: ['business_brand', 'storytelling'], behaviorNotes: ['Keep image expensive but restrained'], operations: ['contrast curve', 'highlight recovery', 'secondary correction for faces/products'], avoidRules: ['Avoid crushed shadows'], qaChecks: ['premium look is not overdone'] },
  { id: 'warm_lifestyle', label: 'Warm lifestyle', description: 'Warm human creator look.', look: 'Warm and inviting', bestUseCases: ['family', 'travel', 'food', 'beauty'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Keep warmth gentle'], operations: ['warm white balance', 'vibrance', 'skin tone protection'], avoidRules: ['Avoid orange skin'], qaChecks: ['skin stays natural'] },
  { id: 'cinematic_contrast', label: 'Cinematic contrast', description: 'Dramatic but controlled contrast.', look: 'Deeper contrast with protected faces', bestUseCases: ['storytelling', 'dramatic explanations'], defaultForCategories: ['storytelling'], behaviorNotes: ['Preserve information'], operations: ['contrast curve', 'shadow control', 'highlight recovery'], avoidRules: ['Avoid hiding key details'], qaChecks: ['emotion supports story'] },
  { id: 'documentary_neutral', label: 'Documentary neutral', description: 'Neutral, factual color grade.', look: 'Restrained and evidence-safe', bestUseCases: ['documentary', 'case studies'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Avoid bias through color'], operations: ['shot matching', 'legal/social-safe levels', 'neutral saturation'], avoidRules: ['Avoid sensational color'], qaChecks: ['grade feels factual'] },
  { id: 'luxury_real_estate', label: 'Luxury real estate', description: 'Bright spacious property tone.', look: 'Bright, airy, premium', bestUseCases: ['property tours', 'hospitality'], defaultForCategories: ['business_brand'], behaviorNotes: ['Protect windows and interiors'], operations: ['exposure lift', 'white balance', 'highlight recovery'], avoidRules: ['Avoid blown windows'], qaChecks: ['spaces remain readable'] },
  { id: 'corporate_neutral', label: 'Corporate neutral', description: 'Restrained professional color.', look: 'Accurate and polished', bestUseCases: ['business', 'SaaS', 'training'], defaultForCategories: ['business_brand', 'education_explainer'], behaviorNotes: ['Keep product color accurate'], operations: ['white balance', 'mild contrast', 'secondary correction'], avoidRules: ['Avoid trendy filters'], qaChecks: ['brand/product color stays accurate'] },
  { id: 'bright_social', label: 'Bright social', description: 'High clarity social pop.', look: 'Bright and clear', bestUseCases: ['shorts', 'creator edits'], defaultForCategories: ['lifestyle', 'storytelling'], behaviorNotes: ['Increase clarity without clipping'], operations: ['exposure correction', 'vibrance', 'sharpening/clarity'], avoidRules: ['Avoid neon saturation'], qaChecks: ['highlights are safe'] },
  { id: 'moody_dramatic', label: 'Moody dramatic', description: 'Serious mood with controlled darkness.', look: 'Darker and more dramatic', bestUseCases: ['tension', 'serious story'], defaultForCategories: ['storytelling'], behaviorNotes: ['Protect face readability'], operations: ['shadow control', 'contrast curve', 'selective saturation'], avoidRules: ['Avoid muddy faces'], qaChecks: ['viewer can still see meaning'] },
  { id: 'film_emulation_light', label: 'Film emulation light', description: 'Subtle film tone without heavy grain.', look: 'Light filmic tone', bestUseCases: ['cinematic story', 'premium lifestyle'], defaultForCategories: ['storytelling', 'lifestyle'], behaviorNotes: ['Keep LUT strength low'], operations: ['LUT/preset strength', 'highlight rolloff', 'shot matching'], avoidRules: ['Avoid heavy vintage look by default'], qaChecks: ['film look remains subtle'] },
  { id: 'muted_editorial', label: 'Muted editorial', description: 'Soft restrained editorial palette.', look: 'Muted and refined', bestUseCases: ['documentary', 'luxury', 'reflective story'], defaultForCategories: ['documentary_case_study', 'lifestyle'], behaviorNotes: ['Keep skin alive'], operations: ['saturation control', 'contrast moderation', 'shot matching'], avoidRules: ['Avoid lifeless product shots'], qaChecks: ['image remains appealing'] },
  { id: 'high_key_clean', label: 'High-key clean', description: 'Bright airy clean grade.', look: 'Bright clean whites', bestUseCases: ['beauty', 'education', 'product'], defaultForCategories: ['business_brand', 'education_explainer'], behaviorNotes: ['Keep whites clean'], operations: ['exposure lift', 'highlight control', 'skin protection'], avoidRules: ['Avoid blown highlights'], qaChecks: ['highlights retain detail'] },
  { id: 'monochrome', label: 'Monochrome', description: 'Black-and-white or single-tone styling.', look: 'Monochrome and graphic', bestUseCases: ['serious story', 'memory', 'custom brand requests'], defaultForCategories: [], behaviorNotes: ['Use only when justified'], operations: ['channel mix', 'contrast', 'skin luminance protection'], avoidRules: ['Avoid unless requested or clearly useful'], qaChecks: ['monochrome supports intent'] },
]

export const captionStyles: CaptionStylePreset[] = [
  { id: 'clean_subtitle', label: 'Clean subtitle', description: 'Readable standard captions.', placement: 'Lower safe zone', density: '1-2 lines', animation: 'None or subtle fade', bestUseCases: ['clean edits'], defaultForCategories: ['lifestyle', 'education_explainer'], behaviorNotes: ['Use high contrast'], safeZoneRules: ['Avoid faces and products'], avoidRules: ['Avoid random emphasis'], qaChecks: ['captions readable'] },
  { id: 'small_premium_subtitle', label: 'Small premium subtitle', description: 'Refined small captions.', placement: 'Lower or mid safe zone', density: 'Low', animation: 'Subtle fade', bestUseCases: ['premium clean', 'luxury'], defaultForCategories: ['storytelling', 'lifestyle'], behaviorNotes: ['Keep elegant'], safeZoneRules: ['Avoid panel text'], avoidRules: ['Avoid oversized text'], qaChecks: ['captions feel premium'] },
  { id: 'bold_social_captions', label: 'Bold social captions', description: 'Large captions for short-form retention.', placement: 'Safe center/lower area', density: 'Medium', animation: 'Pop or word emphasis', bestUseCases: ['shorts', 'creator edits'], defaultForCategories: ['storytelling', 'lifestyle'], behaviorNotes: ['Highlight key words'], safeZoneRules: ['Avoid face and UI zones'], avoidRules: ['Avoid covering visuals'], qaChecks: ['caption does not dominate'] },
  { id: 'keyword_emphasis_captions', label: 'Keyword emphasis captions', description: 'Captions with selected emphasis words.', placement: 'Platform safe zone', density: 'Medium', animation: 'Keyword highlight', bestUseCases: ['business', 'storytelling'], defaultForCategories: ['business_brand', 'storytelling'], behaviorNotes: ['Emphasize meaning only'], safeZoneRules: ['Avoid animation panel'], avoidRules: ['Avoid highlighting every word'], qaChecks: ['emphasis supports meaning'] },
  { id: 'karaoke_word_by_word', label: 'Karaoke word by word', description: 'Word-level caption timing.', placement: 'Safe center/lower area', density: 'Low to medium', animation: 'Word-by-word reveal', bestUseCases: ['high-retention social'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Use for energetic pacing'], safeZoneRules: ['Avoid face/product'], avoidRules: ['Avoid for serious evidence unless requested'], qaChecks: ['timing is legible'] },
  { id: 'sentence_block_captions', label: 'Sentence block captions', description: 'Short sentence groups for clarity.', placement: 'Lower safe area', density: 'Medium', animation: 'Block reveal', bestUseCases: ['education', 'training'], defaultForCategories: ['education_explainer'], behaviorNotes: ['Group by idea'], safeZoneRules: ['Avoid diagrams'], avoidRules: ['Avoid long paragraphs'], qaChecks: ['caption chunks are clear'] },
  { id: 'documentary_lower_third', label: 'Documentary lower third', description: 'Names, roles, facts, and places.', placement: 'Lower third safe zone', density: 'Low', animation: 'Neutral reveal', bestUseCases: ['documentary', 'case studies'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Keep neutral'], safeZoneRules: ['Avoid evidence panels'], avoidRules: ['Avoid sensational labels'], qaChecks: ['names/facts are clear'] },
  { id: 'education_label_captions', label: 'Education label captions', description: 'Concept labels near diagrams and examples.', placement: 'Diagram-aware safe zone', density: 'Medium', animation: 'Label pop-in or step reveal', bestUseCases: ['explainers'], defaultForCategories: ['education_explainer'], behaviorNotes: ['Use exact terms'], safeZoneRules: ['Avoid collisions with diagram'], avoidRules: ['Avoid clutter'], qaChecks: ['labels stay readable'] },
  { id: 'minimal_accessibility_captions', label: 'Minimal accessibility captions', description: 'Simple accessible captions without stylization.', placement: 'Safe lower zone', density: 'Low', animation: 'None', bestUseCases: ['simple edits', 'training'], defaultForCategories: ['lifestyle', 'education_explainer'], behaviorNotes: ['Prioritize accessibility'], safeZoneRules: ['Avoid face/product'], avoidRules: ['Avoid motion effects'], qaChecks: ['accessibility maintained'] },
  { id: 'caption_icon_callout', label: 'Caption icon callout', description: 'Caption plus small icon or callout.', placement: 'Context-aware safe zone', density: 'Low', animation: 'Subtle pop-in', bestUseCases: ['product', 'education'], defaultForCategories: ['business_brand', 'education_explainer'], behaviorNotes: ['Use icons only for clarity'], safeZoneRules: ['Avoid main subject'], avoidRules: ['Avoid decorative icons'], qaChecks: ['callout supports meaning'] },
]

export const brollPolicies: BrollPolicyPreset[] = [
  { id: 'none', label: 'None', description: 'No b-roll unless later approved.', bestUseCases: ['simple edits'], defaultForCategories: [], behaviorNotes: ['Keep source footage primary'], sourcePriority: ['source video'], meaningRule: 'Use no extra b-roll.', avoidRules: ['Do not add random visuals'], qaChecks: ['no extra visuals added'] },
  { id: 'minimal_support_only', label: 'Minimal support only', description: 'Use only essential support visuals.', bestUseCases: ['Basic clean edits'], defaultForCategories: ['lifestyle'], defaultForLevels: ['basic'], behaviorNotes: ['Keep visual count low'], sourcePriority: ['uploaded footage', 'speaker cutaway'], meaningRule: 'Every insert must clarify a point.', avoidRules: ['Avoid filler inserts'], qaChecks: ['each insert has a reason'] },
  { id: 'support_key_points', label: 'Support key points', description: 'Use b-roll for important ideas only.', bestUseCases: ['storytelling', 'education'], defaultForCategories: ['storytelling', 'education_explainer'], behaviorNotes: ['Support meaning'], sourcePriority: ['uploaded b-roll', 'graphic card', 'ai generated visual if approved'], meaningRule: 'B-roll must support the spoken point.', avoidRules: ['No random b-roll'], qaChecks: ['b-roll supports key point'] },
  { id: 'high_visual_variety', label: 'High visual variety', description: 'More frequent supporting visuals for retention.', bestUseCases: ['social', 'creator edits'], defaultForCategories: ['lifestyle', 'storytelling'], behaviorNotes: ['Use variety without clutter'], sourcePriority: ['uploaded b-roll', 'reaction insert', 'graphic card'], meaningRule: 'Variety must support retention and meaning.', avoidRules: ['Avoid unrelated visuals'], qaChecks: ['variety remains coherent'] },
  { id: 'proof_first_b_roll', label: 'Proof-first b-roll', description: 'Prioritize evidence, proof, and source assets.', bestUseCases: ['case studies', 'testimonials'], defaultForCategories: ['documentary_case_study', 'business_brand'], behaviorNotes: ['Use proof before decoration'], sourcePriority: ['proof evidence shot', 'screen recording', 'uploaded b-roll'], meaningRule: 'Proof visuals must support the claim.', avoidRules: ['Avoid overclaiming'], qaChecks: ['proof aligns with claim'] },
  { id: 'documentary_evidence_b_roll', label: 'Documentary evidence b-roll', description: 'Evidence-led b-roll and neutral cards.', bestUseCases: ['investigations', 'timelines'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Stay neutral'], sourcePriority: ['proof evidence shot', 'timeline card', 'money trail visual'], meaningRule: 'Evidence visuals must be neutral and sourced.', avoidRules: ['Avoid speculative visuals'], qaChecks: ['evidence is safe'] },
  { id: 'product_feature_b_roll', label: 'Product feature b-roll', description: 'Product shots, UI, features, and proof.', bestUseCases: ['product demos', 'SaaS', 'ecommerce'], defaultForCategories: ['business_brand'], behaviorNotes: ['Show product clearly'], sourcePriority: ['product shot', 'screen recording', 'object close up'], meaningRule: 'B-roll must clarify product value.', avoidRules: ['Avoid hiding product'], qaChecks: ['feature is visible'] },
  { id: 'lifestyle_atmosphere_b_roll', label: 'Lifestyle atmosphere b-roll', description: 'Natural environment and detail inserts.', bestUseCases: ['vlogs', 'travel', 'food', 'beauty'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Keep mood natural'], sourcePriority: ['environment shot', 'object close up', 'uploaded b-roll'], meaningRule: 'Atmosphere should support story or feeling.', avoidRules: ['Avoid generic stock feel'], qaChecks: ['insert feels authentic'] },
  { id: 'uploaded_footage_first', label: 'Uploaded footage first', description: 'Use source footage before generated visuals.', bestUseCases: ['most production edits'], defaultForCategories: ['storytelling', 'lifestyle', 'business_brand', 'education_explainer', 'documentary_case_study'], behaviorNotes: ['Respect source material'], sourcePriority: ['uploaded b-roll', 'speaker cutaway', 'screen recording'], meaningRule: 'Source footage is preferred when it supports the point.', avoidRules: ['Avoid generated visuals without need'], qaChecks: ['source footage considered first'] },
  { id: 'ai_generated_only_if_approved', label: 'AI-generated only if approved', description: 'Generated b-roll remains behind plan and credit approval.', bestUseCases: ['visual storytelling', 'Premium edits'], defaultForCategories: ['storytelling', 'business_brand', 'education_explainer'], behaviorNotes: ['Estimate credits first'], sourcePriority: ['uploaded b-roll', 'graphic card', 'ai generated visual'], meaningRule: 'AI b-roll must support meaning and be approved.', avoidRules: ['No unapproved generation'], qaChecks: ['approval gate respected'] },
]

export const soundStyles: StandardPreset<SoundStyleId>[] = [
  { id: 'clean_voice_only', label: 'Clean voice only', description: 'Voice cleanup without a music-forward mix.', bestUseCases: ['training', 'education', 'simple edits'], defaultForCategories: ['education_explainer'], defaultForLevels: ['basic'], behaviorNotes: ['Prioritize speech'], avoidRules: ['Avoid distracting music'], qaChecks: ['voice is clear'] },
  { id: 'subtle_premium_bed', label: 'Subtle premium bed', description: 'Quiet music support under voice.', bestUseCases: ['premium clean', 'business'], defaultForCategories: ['business_brand', 'storytelling'], behaviorNotes: ['Duck under voice'], avoidRules: ['Avoid overpowering speech'], qaChecks: ['music supports tone'] },
  { id: 'energetic_social', label: 'Energetic social', description: 'Higher energy rhythm, impacts, and transitions.', bestUseCases: ['shorts', 'creator edits'], defaultForCategories: ['lifestyle', 'storytelling'], behaviorNotes: ['Use beat timing'], avoidRules: ['Avoid noisy mix'], qaChecks: ['energy does not hurt clarity'] },
  { id: 'cinematic_emotional', label: 'Cinematic emotional', description: 'Emotional music and subtle impacts.', bestUseCases: ['stories', 'dramatic explanations'], defaultForCategories: ['storytelling'], behaviorNotes: ['Support emotional arc'], avoidRules: ['Avoid melodrama unless requested'], qaChecks: ['sound supports story'] },
  { id: 'documentary_serious', label: 'Documentary serious', description: 'Restrained serious documentary audio.', bestUseCases: ['case studies', 'investigations'], defaultForCategories: ['documentary_case_study'], behaviorNotes: ['Stay neutral'], avoidRules: ['Avoid sensational hits'], qaChecks: ['tone remains credible'] },
  { id: 'corporate_clean', label: 'Corporate clean', description: 'Professional voice-forward business mix.', bestUseCases: ['SaaS', 'training', 'offers'], defaultForCategories: ['business_brand'], behaviorNotes: ['Clean and non-distracting'], avoidRules: ['Avoid trendy sounds'], qaChecks: ['business tone fits'] },
  { id: 'lifestyle_warm', label: 'Lifestyle warm', description: 'Warm natural music and ambience.', bestUseCases: ['vlogs', 'travel', 'food'], defaultForCategories: ['lifestyle'], behaviorNotes: ['Keep human warmth'], avoidRules: ['Avoid overproduction'], qaChecks: ['mood feels natural'] },
  { id: 'luxury_soft', label: 'Luxury soft', description: 'Soft premium sound bed.', bestUseCases: ['real estate', 'luxury brand'], defaultForCategories: ['business_brand', 'lifestyle'], behaviorNotes: ['Use refined music'], avoidRules: ['Avoid hard impacts'], qaChecks: ['sound feels premium'] },
  { id: 'high_retention_impact', label: 'High-retention impact', description: 'Impacts, risers, and beat support for retention.', bestUseCases: ['ads', 'short social'], defaultForCategories: ['storytelling', 'business_brand'], behaviorNotes: ['Use impacts intentionally'], avoidRules: ['Avoid overwhelming voice'], qaChecks: ['SFX supports transitions'] },
]

export const cutOperations = [
  'remove silence',
  'remove filler words',
  'tighten pauses',
  'keep emotional pause',
  'jump cut',
  'cut to b-roll',
  'cut on beat',
  'cut on keyword',
  'reaction cut',
  'CTA cut',
  'hook-first reorder',
  'source-order preserve',
]

export const editingOperationTypes: EditingOperationType[] = [
  'cut',
  'trim',
  'reorder',
  'speed_change',
  'caption',
  'b_roll',
  'color_grade',
  'sound_cleanup',
  'music',
  'sfx',
  'transition',
  'visual_asset',
  'renderer_layer',
  'qa_check',
]

function wantsSocialPlatform(targetPlatform: TargetPlatform) {
  return targetPlatform === 'tiktok_reels_shorts'
}

function moodIsPremium(moodStyle?: MoodStyle) {
  return moodStyle === 'premium' || moodStyle === 'luxury' || moodStyle === 'cinematic'
}

function defaultMapping(params: DefaultDirectiveParams): Omit<ProfessionalEditingDirective, 'mustFollowRules' | 'avoidRules' | 'customDirectives' | 'qaChecks'> {
  if (params.editingCategory === 'lifestyle') {
    return {
      editStyle: params.moodStyle === 'energetic' || params.moodStyle === 'viral_fast_paced' ? 'energetic_creator' : 'lifestyle_natural',
      pacingStyle: moodIsPremium(params.moodStyle) ? 'luxury_smooth' : 'natural',
      cutIntensity: wantsSocialPlatform(params.targetPlatform) ? 'balanced' : 'minimal',
      transitionFamilies: ['clean_cut_transitions', 'smooth_premium_transitions'],
      colorGradeStyle: params.moodStyle === 'premium' || params.moodStyle === 'luxury' ? 'premium_clean' : 'warm_lifestyle',
      captionStyle: params.editLevel === 'premium' ? 'small_premium_subtitle' : 'clean_subtitle',
      brollPolicy: 'lifestyle_atmosphere_b_roll',
      soundStyle: 'lifestyle_warm',
    }
  }

  if (params.editingCategory === 'business_brand') {
    return {
      editStyle: params.editLevel === 'basic' ? 'business_product' : 'premium_clean',
      pacingStyle: 'clean_tight',
      cutIntensity: 'tight',
      transitionFamilies: ['graphic_motion_design_transitions', 'clean_cut_transitions'],
      colorGradeStyle: params.editLevel === 'basic' ? 'corporate_neutral' : 'premium_clean',
      captionStyle: 'keyword_emphasis_captions',
      brollPolicy: 'product_feature_b_roll',
      soundStyle: params.editLevel === 'basic' ? 'corporate_clean' : 'subtle_premium_bed',
    }
  }

  if (params.editingCategory === 'education_explainer') {
    return {
      editStyle: 'education_explainer',
      pacingStyle: 'educational_structured',
      cutIntensity: 'balanced',
      transitionFamilies: ['graphic_motion_design_transitions'],
      colorGradeStyle: params.editLevel === 'premium' ? 'corporate_neutral' : 'clean_natural',
      captionStyle: 'education_label_captions',
      brollPolicy: 'support_key_points',
      soundStyle: 'clean_voice_only',
    }
  }

  if (params.editingCategory === 'documentary_case_study') {
    return {
      editStyle: 'documentary_evidence',
      pacingStyle: wantsSocialPlatform(params.targetPlatform) ? 'clean_tight' : 'documentary_measured',
      cutIntensity: wantsSocialPlatform(params.targetPlatform) ? 'tight' : 'balanced',
      transitionFamilies: ['documentary_evidence_transitions', 'clean_cut_transitions'],
      colorGradeStyle: 'documentary_neutral',
      captionStyle: params.editLevel === 'basic' ? 'small_premium_subtitle' : 'documentary_lower_third',
      brollPolicy: params.editLevel === 'premium' ? 'documentary_evidence_b_roll' : 'proof_first_b_roll',
      soundStyle: 'documentary_serious',
    }
  }

  return {
    editStyle: params.editLevel === 'basic' && !moodIsPremium(params.moodStyle) ? 'premium_clean' : 'cinematic_story',
    pacingStyle: params.moodStyle === 'emotional' || params.editLevel === 'premium' ? 'emotional_pause' : 'clean_tight',
    cutIntensity: wantsSocialPlatform(params.targetPlatform) ? 'tight' : 'balanced',
    transitionFamilies: ['stroke_motion_transitions', 'smooth_premium_transitions'],
    colorGradeStyle: moodIsPremium(params.moodStyle) ? 'cinematic_contrast' : 'premium_clean',
    captionStyle: wantsSocialPlatform(params.targetPlatform) ? 'keyword_emphasis_captions' : 'small_premium_subtitle',
    brollPolicy: 'support_key_points',
    soundStyle: 'cinematic_emotional',
  }
}

function applyLevelRules(
  directive: Omit<ProfessionalEditingDirective, 'mustFollowRules' | 'avoidRules' | 'customDirectives' | 'qaChecks'>,
  editLevel: EditLevel,
): Omit<ProfessionalEditingDirective, 'customDirectives'> {
  if (editLevel === 'basic') {
    return {
      ...directive,
      cutIntensity: directive.cutIntensity === 'aggressive' || directive.cutIntensity === 'beat_synced' ? 'balanced' : directive.cutIntensity,
      transitionFamilies: directive.transitionFamilies.includes('graphic_motion_design_transitions')
        ? ['clean_cut_transitions', 'graphic_motion_design_transitions']
        : ['clean_cut_transitions'],
      colorGradeStyle: directive.colorGradeStyle === 'cinematic_contrast' || directive.colorGradeStyle === 'moody_dramatic' ? 'clean_natural' : directive.colorGradeStyle,
      mustFollowRules: [
        'Meet a professional clean-edit standard',
        'Use lower-compute choices where they preserve quality',
        'Prefer uploaded footage, stills, cards, and editor motion before expensive generation',
        'Keep captions readable and safely placed',
      ],
      avoidRules: [
        'No Veo',
        'No unnecessary AI video generation',
        'No random b-roll',
        'No sloppy captions, color, sound, or transitions',
      ],
      qaChecks: [...universalDirectiveQaChecks, 'Basic/Pro do not use Veo', 'Basic remains professional, not low quality'],
    }
  }

  if (editLevel === 'pro') {
    return {
      ...directive,
      mustFollowRules: [
        'Use stronger structure and segment-level b-roll planning',
        'Use Graphic Design / VisualExplain or Stroke Motion only where useful',
        'Allow Hailuo fallback where planned',
        'Keep captions, color, sound, and transitions style-specific',
      ],
      avoidRules: ['No Veo', 'No random b-roll', 'No unplanned generation before approval'],
      qaChecks: [...universalDirectiveQaChecks, 'Basic/Pro do not use Veo', 'Hailuo fallback remains planned and justified'],
    }
  }

  return {
    ...directive,
    mustFollowRules: [
      'Use deeper story structure and stronger QA',
      'Plan more custom assets only where they improve the edit',
      'Use stronger character consistency checks when recurring people or objects appear',
      'Keep Veo Lite final fallback only and never primary',
    ],
    avoidRules: ['Never default to Veo', 'No random visuals', 'No generation before approval'],
    qaChecks: [...universalDirectiveQaChecks, 'Premium uses Veo only as final fallback', 'stronger QA and retries are planned before generation'],
  }
}

export function createCustomEditingDirective(params: {
  rawUserRequest: string
  interpretedMeaning: string
  mappedPresetIds: string[]
  customOverrides: string[]
  mustFollowRules?: string[]
  avoidRules?: string[]
  confidence?: 'low' | 'medium' | 'high'
  clarifyingQuestions?: string[]
}): CustomEditingDirective {
  const slug = params.rawUserRequest
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 36)

  return {
    id: `custom-directive-${slug || 'request'}-${params.mappedPresetIds.length}`,
    rawUserRequest: params.rawUserRequest,
    interpretedMeaning: params.interpretedMeaning,
    mappedPresetIds: params.mappedPresetIds,
    customOverrides: params.customOverrides,
    mustFollowRules: params.mustFollowRules ?? [],
    avoidRules: params.avoidRules ?? [],
    confidence: params.confidence ?? 'medium',
    clarifyingQuestions: params.clarifyingQuestions ?? [],
  }
}

export function getDefaultProfessionalEditingDirective(params: DefaultDirectiveParams): ProfessionalEditingDirective {
  const baseDirective = defaultMapping(params)
  const levelAdjusted = applyLevelRules(baseDirective, params.editLevel)

  return {
    ...levelAdjusted,
    customDirectives: params.visualPreference === 'no_extra_visuals'
      ? [
          createCustomEditingDirective({
            rawUserRequest: 'No extra visuals',
            interpretedMeaning: 'Keep visuals minimal unless an essential card is needed for clarity.',
            mappedPresetIds: [levelAdjusted.editStyle, levelAdjusted.brollPolicy],
            customOverrides: ['Avoid nonessential visual assets'],
            mustFollowRules: ['Respect no-extra-visuals preference until the user approves a revision'],
            avoidRules: ['Do not add decorative Stroke Motion, Real Motion, or generated b-roll'],
            confidence: 'high',
          }),
        ]
      : [],
  }
}
