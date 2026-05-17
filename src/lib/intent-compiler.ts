import type {
  AspectRatio,
  BrollPolicyId,
  CaptionStyleId,
  ClarifyingQuestion,
  ColorGradeStyleId,
  CompiledEditingIntent,
  CompiledIntentRequirement,
  CustomEditingDirective,
  EditLevel,
  EditingCategory,
  FrameTemplateType,
  LockedTierConstraint,
  PlannerInput,
  ProfessionalEditingDirective,
  ProfessionalEditStyleId,
  SoundStyleId,
  TargetPlatform,
} from '../types/reeditpro'
import { createCustomEditingDirective, getDefaultProfessionalEditingDirective } from './professional-editing-ontology'

type CompileEditingIntentParams = {
  userMessages: string[]
  currentInput: PlannerInput
  sourceOrderConfirmed?: boolean
  referenceProvided?: boolean
}

type MutableDirective = ProfessionalEditingDirective

type IntentAccumulator = {
  requirements: CompiledIntentRequirement[]
  mustFollowRules: string[]
  avoidRules: string[]
  customDirectives: CustomEditingDirective[]
  clarifyingQuestions: ClarifyingQuestion[]
  compilerNotes: string[]
}

type KeywordMatch<T extends string> = {
  value: T
  keywords: string[]
  requirement: string
}

function normalizeMessage(messages: string[]) {
  return messages.join(' ').trim().toLowerCase()
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function addUnique(list: string[], value: string) {
  if (!list.includes(value)) {
    list.push(value)
  }
}

function addRequirement(
  accumulator: IntentAccumulator,
  kind: CompiledIntentRequirement['kind'],
  text: string,
  mappedField?: string,
  priority: CompiledIntentRequirement['priority'] = 'medium',
  notes?: string,
) {
  const id = `intent-${accumulator.requirements.length + 1}`
  accumulator.requirements.push({
    id,
    kind,
    mappedField,
    notes,
    priority,
    source: kind === 'constraint' ? 'system_constraint' : 'user_chat',
    text,
  })
}

function makeQuestion(
  id: string,
  question: string,
  reason: string,
  priority: ClarifyingQuestion['priority'],
  blocksPlanning: boolean,
  suggestedAnswers?: string[],
): ClarifyingQuestion {
  return {
    id,
    blocksPlanning,
    priority,
    question,
    reason,
    suggestedAnswers,
  }
}

function firstMatch<T extends string>(text: string, matches: KeywordMatch<T>[]) {
  return matches.find((match) => hasAny(text, match.keywords))
}

function getFrameForAspectRatio(aspectRatio: AspectRatio): FrameTemplateType {
  if (aspectRatio === '16:9') return 'youtube_side_panel'
  if (aspectRatio === '1:1') return 'square_center_panel'
  if (aspectRatio === 'let_ai_decide') return 'let_ai_decide'
  return 'vertical_talking_head_lower_panel'
}

const categoryMatches: KeywordMatch<EditingCategory>[] = [
  { value: 'documentary_case_study', keywords: ['scam', 'fraud', 'case', 'timeline', 'investigation', 'evidence', 'documentary'], requirement: 'Documentary/case-study language detected.' },
  { value: 'education_explainer', keywords: ['explain', 'tutorial', 'teach', 'lesson', 'framework', 'steps'], requirement: 'Education/explainer language detected.' },
  { value: 'business_brand', keywords: ['business', 'brand', 'product', 'service', 'offer', 'saas', 'ecommerce'], requirement: 'Business/brand language detected.' },
  { value: 'lifestyle', keywords: ['lifestyle', 'vlog', 'day in the life', 'travel', 'fitness', 'food'], requirement: 'Lifestyle language detected.' },
  { value: 'storytelling', keywords: ['story', 'what happened', 'emotional', 'relationship', 'betrayal'], requirement: 'Storytelling language detected.' },
]

const editStyleMatches: KeywordMatch<ProfessionalEditStyleId>[] = [
  { value: 'documentary_evidence', keywords: ['documentary', 'serious', 'evidence'], requirement: 'Use documentary/evidence editing language.' },
  { value: 'luxury_real_estate', keywords: ['luxury', 'real estate', 'property'], requirement: 'Use luxury/property editing language.' },
  { value: 'education_explainer', keywords: ['educational', 'explainer'], requirement: 'Use education/explainer editing language.' },
  { value: 'business_product', keywords: ['product', 'business'], requirement: 'Use business/product editing language.' },
  { value: 'lifestyle_natural', keywords: ['natural', 'lifestyle'], requirement: 'Use natural/lifestyle editing language.' },
  { value: 'energetic_creator', keywords: ['energetic', 'creator', 'upbeat'], requirement: 'Use energetic creator editing language.' },
  { value: 'high_retention_social', keywords: ['viral', 'fast paced', 'fast-paced', 'high retention'], requirement: 'Use high-retention social editing language.' },
  { value: 'cinematic_story', keywords: ['cinematic', 'emotional', 'dramatic'], requirement: 'Use cinematic story editing language.' },
  { value: 'premium_clean', keywords: ['premium', 'polished', 'high end', 'high-end'], requirement: 'Use premium clean editing language.' },
  { value: 'clean_professional', keywords: ['clean', 'simple', 'professional'], requirement: 'Use clean professional editing language.' },
]

const captionMatches: KeywordMatch<CaptionStyleId>[] = [
  { value: 'small_premium_subtitle', keywords: ['small captions', 'small subtitle', 'premium captions'], requirement: 'Use small premium captions.' },
  { value: 'bold_social_captions', keywords: ['bold captions', 'big captions'], requirement: 'Use bold social captions.' },
  { value: 'keyword_emphasis_captions', keywords: ['keyword captions', 'highlight keywords', 'keyword emphasis'], requirement: 'Use keyword emphasis captions.' },
  { value: 'karaoke_word_by_word', keywords: ['word by word', 'karaoke'], requirement: 'Use word-by-word captions.' },
  { value: 'documentary_lower_third', keywords: ['lower third', 'lower thirds'], requirement: 'Use lower-third caption language.' },
]

const colorMatches: KeywordMatch<ColorGradeStyleId>[] = [
  { value: 'documentary_neutral', keywords: ['serious documentary', 'documentary color'], requirement: 'Use documentary neutral color.' },
  { value: 'clean_natural', keywords: ['natural color'], requirement: 'Use clean natural color.' },
  { value: 'premium_clean', keywords: ['premium color', 'polished color', 'nice color'], requirement: 'Use premium clean color.' },
  { value: 'warm_lifestyle', keywords: ['warm'], requirement: 'Use warm lifestyle color.' },
  { value: 'cinematic_contrast', keywords: ['cinematic'], requirement: 'Use cinematic contrast color.' },
  { value: 'luxury_real_estate', keywords: ['luxury'], requirement: 'Use luxury real estate color.' },
  { value: 'bright_social', keywords: ['bright'], requirement: 'Use bright social color.' },
  { value: 'moody_dramatic', keywords: ['moody'], requirement: 'Use moody dramatic color.' },
  { value: 'monochrome', keywords: ['black and white', 'monochrome'], requirement: 'Use monochrome color.' },
]

const brollMatches: KeywordMatch<BrollPolicyId>[] = [
  { value: 'support_key_points', keywords: ['b-roll only when it helps', 'broll only when it helps', 'b-roll when it helps', 'only when it helps'], requirement: 'Use b-roll only when it supports meaning.' },
  { value: 'documentary_evidence_b_roll', keywords: ['proof', 'evidence'], requirement: 'Use proof/evidence b-roll.' },
  { value: 'product_feature_b_roll', keywords: ['product shots'], requirement: 'Use product feature b-roll.' },
  { value: 'uploaded_footage_first', keywords: ['use my clips first', 'uploaded footage first'], requirement: 'Use uploaded footage first.' },
]

const soundMatches: KeywordMatch<SoundStyleId>[] = [
  { value: 'clean_voice_only', keywords: ['clean audio', 'voice only'], requirement: 'Use clean voice-first audio.' },
  { value: 'subtle_premium_bed', keywords: ['subtle music'], requirement: 'Use a subtle premium music bed.' },
  { value: 'cinematic_emotional', keywords: ['cinematic music'], requirement: 'Use cinematic emotional sound.' },
  { value: 'documentary_serious', keywords: ['serious documentary'], requirement: 'Use serious documentary sound.' },
  { value: 'energetic_social', keywords: ['upbeat'], requirement: 'Use energetic social sound.' },
]

function applyCategory(text: string, input: PlannerInput, accumulator: IntentAccumulator) {
  const match = firstMatch(text, categoryMatches)

  if (!match) {
    return input.editingCategory
  }

  addRequirement(accumulator, 'preference', match.requirement, 'editingCategory')
  return match.value
}

function applyPlatform(text: string, input: PlannerInput, accumulator: IntentAccumulator) {
  if (hasAny(text, ['tiktok', 'reels', 'shorts', 'short form', 'short-form'])) {
    addRequirement(accumulator, 'preference', 'Use TikTok/Reels/Shorts vertical format.', 'targetPlatform')
    return {
      aspectRatio: '9:16' as AspectRatio,
      frameTemplateType: 'vertical_talking_head_lower_panel' as FrameTemplateType,
      targetPlatform: 'tiktok_reels_shorts' as TargetPlatform,
    }
  }

  if (text.includes('youtube')) {
    addRequirement(accumulator, 'preference', 'Use YouTube landscape format.', 'targetPlatform')
    return {
      aspectRatio: '16:9' as AspectRatio,
      frameTemplateType: 'youtube_side_panel' as FrameTemplateType,
      targetPlatform: 'youtube' as TargetPlatform,
    }
  }

  if (text.includes('square')) {
    addRequirement(accumulator, 'preference', 'Use square format.', 'aspectRatio')
    return {
      aspectRatio: '1:1' as AspectRatio,
      frameTemplateType: 'square_center_panel' as FrameTemplateType,
      targetPlatform: 'custom' as TargetPlatform,
    }
  }

  return {
    aspectRatio: input.aspectRatio,
    frameTemplateType: input.frameTemplateType ?? getFrameForAspectRatio(input.aspectRatio),
    targetPlatform: input.targetPlatform,
  }
}

function applyEditLevel(text: string, input: PlannerInput, accumulator: IntentAccumulator) {
  if (text.includes('premium') || text.includes('best possible')) {
    addRequirement(accumulator, 'preference', 'Premium or best-result language detected.', 'editLevel')
    return 'premium'
  }

  if (/\bpro\b/.test(text)) {
    addRequirement(accumulator, 'preference', 'Pro edit level requested.', 'editLevel')
    return 'pro'
  }

  if (text.includes('basic')) {
    addRequirement(accumulator, 'preference', 'Basic edit level requested.', 'editLevel')
    return 'basic'
  }

  return input.editLevel
}

function applyCreditPreference(text: string, input: PlannerInput, accumulator: IntentAccumulator) {
  if (hasAny(text, ['cheap', 'low cost', 'save credits', 'lower credit', 'less credits'])) {
    addRequirement(accumulator, 'preference', 'User asked to save credits.', 'creditPreference')
    return 'low_credit_cost'
  }

  if (hasAny(text, ['best possible', 'premium best'])) {
    addRequirement(accumulator, 'preference', 'User asked for best possible result.', 'creditPreference')
    return 'premium_best_result'
  }

  return input.creditPreference
}

function applyVisualPreference(text: string, input: PlannerInput, accumulator: IntentAccumulator) {
  if (hasAny(text, ['no extra visuals', 'no visuals', 'no b-roll', 'no broll'])) {
    addRequirement(accumulator, 'avoid', 'Avoid extra visuals unless essential.', 'visualPreference')
    addUnique(accumulator.avoidRules, 'Avoid extra visuals unless essential for clarity.')
    return 'no_extra_visuals'
  }

  if (hasAny(text, ['keep visuals minimal', 'minimal visuals', 'not too much', "don't overdo", 'dont overdo'])) {
    addRequirement(accumulator, 'preference', 'Keep visuals minimal.', 'visualPreference')
    addUnique(accumulator.avoidRules, 'Avoid clutter and excessive effects.')
    return 'keep_visuals_minimal'
  }

  if (hasAny(text, ['more stroke motion', 'stroke motion'])) {
    addRequirement(accumulator, 'preference', 'Use more Stroke Motion where it improves story beats.', 'visualPreference')
    return 'more_stroke_motion'
  }

  if (hasAny(text, ['more graphic design', 'visualexplain', 'diagrams'])) {
    addRequirement(accumulator, 'preference', 'Use more Graphic Design / VisualExplain where useful.', 'visualPreference')
    return 'more_graphic_design'
  }

  if (hasAny(text, ['real motion if useful', 'real motion'])) {
    addRequirement(accumulator, 'preference', 'Allow Real Motion only where useful.', 'visualPreference')
    return 'real_motion_if_useful'
  }

  return input.visualPreference
}

function applyMood(text: string, input: PlannerInput) {
  if (hasAny(text, ['cinematic', 'dramatic'])) return 'cinematic'
  if (hasAny(text, ['premium', 'polished', 'high end', 'high-end'])) return 'premium'
  if (hasAny(text, ['energetic', 'upbeat'])) return 'energetic'
  if (hasAny(text, ['emotional'])) return 'emotional'
  if (hasAny(text, ['educational', 'explainer'])) return 'educational'
  if (hasAny(text, ['luxury'])) return 'luxury'
  if (hasAny(text, ['corporate'])) return 'corporate'
  if (hasAny(text, ['viral', 'fast paced', 'high retention'])) return 'viral_fast_paced'
  if (hasAny(text, ['clean', 'simple', 'natural'])) return 'clean'
  return input.moodStyle
}

function applyDirectiveOverrides(text: string, directive: MutableDirective, accumulator: IntentAccumulator) {
  const editStyle = firstMatch(text, editStyleMatches)
  if (editStyle) {
    directive.editStyle = editStyle.value
    addRequirement(accumulator, 'preference', editStyle.requirement, 'professionalEditingDirective.editStyle')
  }

  const caption = firstMatch(text, captionMatches)
  if (caption) {
    directive.captionStyle = caption.value
    addRequirement(accumulator, 'preference', caption.requirement, 'professionalEditingDirective.captionStyle')
  }

  const color = firstMatch(text, colorMatches)
  if (color) {
    directive.colorGradeStyle = color.value
    addRequirement(accumulator, 'preference', color.requirement, 'professionalEditingDirective.colorGradeStyle')
  }

  const broll = firstMatch(text, brollMatches)
  if (broll) {
    directive.brollPolicy = broll.value
    addRequirement(accumulator, 'preference', broll.requirement, 'professionalEditingDirective.brollPolicy')
  }

  const sound = firstMatch(text, soundMatches)
  if (sound) {
    directive.soundStyle = sound.value
    addRequirement(accumulator, 'preference', sound.requirement, 'professionalEditingDirective.soundStyle')
  }

  if (hasAny(text, ['not too viral', "don't make it viral", 'dont make it viral', 'not chaotic'])) {
    directive.pacingStyle = directive.pacingStyle === 'high_retention' || directive.pacingStyle === 'fast_social' ? 'clean_tight' : directive.pacingStyle
    addUnique(accumulator.avoidRules, 'Avoid overly viral effects and aggressive pacing.')
    addRequirement(accumulator, 'avoid', 'Avoid overly viral effects and chaotic pacing.', 'professionalEditingDirective.avoidRules', 'high')
  }

  if (hasAny(text, ['not childish', 'not cartoonish'])) {
    addUnique(accumulator.avoidRules, 'Avoid childish, cartoonish, or playful visuals.')
    addRequirement(accumulator, 'avoid', 'Avoid childish or cartoonish visuals.', 'professionalEditingDirective.avoidRules', 'high')
  }

  if (hasAny(text, ['no captions'])) {
    directive.captionStyle = 'minimal_accessibility_captions'
    addUnique(accumulator.avoidRules, 'Avoid captions unless they are required for accessibility or the user approves them.')
    addRequirement(accumulator, 'avoid', 'Avoid captions unless required.', 'professionalEditingDirective.captionStyle', 'high')
  }

  if (hasAny(text, ['no music'])) {
    directive.soundStyle = 'clean_voice_only'
    addUnique(accumulator.avoidRules, 'Avoid music bed.')
    addRequirement(accumulator, 'avoid', 'Avoid music bed.', 'professionalEditingDirective.soundStyle', 'high')
  }

  if (hasAny(text, ['no random b-roll', 'no random broll'])) {
    directive.brollPolicy = 'support_key_points'
    addUnique(accumulator.avoidRules, 'No random b-roll.')
    addRequirement(accumulator, 'avoid', 'No random b-roll; b-roll must support meaning.', 'professionalEditingDirective.brollPolicy', 'high')
  }

  if (hasAny(text, ['keep it natural'])) {
    directive.editStyle = directive.editStyle === 'high_retention_social' ? 'lifestyle_natural' : directive.editStyle
    directive.pacingStyle = 'natural'
    addUnique(accumulator.avoidRules, 'Avoid heavy effects and random visuals.')
    addRequirement(accumulator, 'must_follow', 'Keep the edit natural.', 'professionalEditingDirective.pacingStyle')
  }
}

function applyTransitionOverrides(text: string, directive: MutableDirective, accumulator: IntentAccumulator) {
  if (hasAny(text, ['documentary', 'evidence', 'case'])) {
    directive.transitionFamilies = ['documentary_evidence_transitions', 'clean_cut_transitions']
  }

  if (hasAny(text, ['modern social pacing', 'high retention', 'fast paced', 'fast-paced'])) {
    directive.pacingStyle = 'high_retention'
    directive.transitionFamilies = directive.transitionFamilies.includes('social_viral_transitions')
      ? directive.transitionFamilies
      : [...directive.transitionFamilies, 'social_viral_transitions']
  }

  if (hasAny(text, ['clean', 'simple', 'not too viral'])) {
    directive.transitionFamilies = directive.transitionFamilies.filter((family) => family !== 'social_viral_transitions')
    if (!directive.transitionFamilies.includes('clean_cut_transitions')) {
      directive.transitionFamilies.unshift('clean_cut_transitions')
    }
  }

  addRequirement(accumulator, 'preference', 'Transition families resolved from user request and ontology defaults.', 'professionalEditingDirective.transitionFamilies', 'low')
}

function applyCustomDirectives(text: string, directive: MutableDirective, accumulator: IntentAccumulator) {
  if (hasAny(text, ['courtroom breakdown', 'courtroom'])) {
    const customDirective = createCustomEditingDirective({
      rawUserRequest: 'serious courtroom breakdown with modern social pacing',
      interpretedMeaning: 'Use a serious evidence-led tone with cleaner modern social pacing.',
      mappedPresetIds: ['documentary_evidence', 'high_retention', 'documentary_neutral', 'documentary_evidence_transitions'],
      customOverrides: ['Serious courtroom breakdown tone', 'Modern social pacing without comedy or childish visuals'],
      mustFollowRules: ['Keep evidence language serious and credible'],
      avoidRules: ['Avoid comedy, playful colors, childish motion, or speculative visuals'],
      confidence: 'high',
    })
    accumulator.customDirectives.push(customDirective)
    directive.editStyle = 'documentary_evidence'
    directive.pacingStyle = 'high_retention'
    directive.colorGradeStyle = 'documentary_neutral'
    directive.captionStyle = 'documentary_lower_third'
    directive.brollPolicy = 'documentary_evidence_b_roll'
    directive.soundStyle = 'documentary_serious'
    directive.transitionFamilies = ['documentary_evidence_transitions', 'clean_cut_transitions', 'social_viral_transitions']
    addRequirement(accumulator, 'must_follow', 'Capture serious courtroom breakdown tone as a custom directive.', 'customDirectives', 'high')
  }
}

function applyModelSignals(text: string, editLevel: EditLevel, accumulator: IntentAccumulator) {
  if (text.includes('veo')) {
    if (editLevel === 'premium') {
      addRequirement(accumulator, 'constraint', 'Veo Lite can be considered only as Premium final fallback/rescue.', 'lockedTierConstraints', 'high')
      addUnique(accumulator.mustFollowRules, 'Keep Veo Lite final fallback only; never primary or default.')
    } else {
      addRequirement(accumulator, 'constraint', 'User requested Veo, but this tier cannot use Veo.', 'lockedTierConstraints', 'high', 'Offer Wan/Hailuo in Basic/Pro or Premium final fallback.')
      addUnique(accumulator.avoidRules, 'Do not enable Veo for Basic or Pro.')
    }
  }

  if (text.includes('wan')) {
    addRequirement(accumulator, 'preference', 'User mentioned Wan; keep provider preference as a note while obeying router policy.', 'providerPreference')
  }

  if (text.includes('hailuo')) {
    addRequirement(accumulator, 'preference', 'User mentioned Hailuo; keep fallback preference as a note while obeying router policy.', 'providerPreference')
  }
}

function buildTierConstraints(editLevel: EditLevel): LockedTierConstraint[] {
  return [
    {
      id: 'constraint-basic-no-veo',
      applies: editLevel === 'basic',
      label: 'Basic no Veo',
      rule: 'Basic must never route to Veo.',
      userFacingMessage: 'Veo Lite is locked for Basic. Use Wan/simple animation, stills, editor motion, or upgrade to Premium for final fallback rescue.',
    },
    {
      id: 'constraint-pro-no-veo',
      applies: editLevel === 'pro',
      label: 'Pro no Veo',
      rule: 'Pro must never route to Veo.',
      userFacingMessage: 'Veo Lite is locked for Pro. I can use Wan primary and Hailuo fallback in Pro.',
    },
    {
      id: 'constraint-premium-veo-fallback',
      applies: editLevel === 'premium',
      label: 'Premium Veo final fallback only',
      rule: 'Premium may use Veo Lite only as final fallback/rescue.',
      userFacingMessage: 'Veo Lite is available only as final fallback/rescue. It is never default.',
    },
    {
      id: 'constraint-no-1080p-default',
      applies: true,
      label: 'No default 1080P',
      rule: 'Generated AI video defaults to 720P-class output.',
      userFacingMessage: 'Generated AI video stays 720P-class by default: Wan 720P, Hailuo 768P, Veo 720P.',
    },
    {
      id: 'constraint-panel-background',
      applies: true,
      label: 'Matching panel background',
      rule: 'AI video generation defaults to matching panel backgrounds, not transparent AI video.',
      userFacingMessage: 'AI clips use matching frame/panel backgrounds by default for clean composition.',
    },
    {
      id: 'constraint-approval-gate',
      applies: true,
      label: 'Approval before generation',
      rule: 'No editing, generation, rendering, or credit deduction before approval.',
      userFacingMessage: 'ReeditPro plans first, estimates credits second, and starts mock progress only after approval.',
    },
  ]
}

function addClarifyingQuestions(
  text: string,
  input: PlannerInput,
  editLevel: EditLevel,
  sourceOrderConfirmed: boolean,
  accumulator: IntentAccumulator,
) {
  if (!sourceOrderConfirmed) {
    accumulator.clarifyingQuestions.push(
      makeQuestion(
        'question-source-order',
        'Are these clips in the right source order?',
        'Source order changes affect the source sequence map and recommended structure.',
        'blocking',
        true,
        ['Yes, keep this order', 'I need to reorder clips'],
      ),
    )
  }

  if (input.aspectRatio === 'let_ai_decide' && !hasAny(text, ['tiktok', 'reels', 'shorts', 'youtube', 'square'])) {
    accumulator.clarifyingQuestions.push(
      makeQuestion(
        'question-platform',
        'Is this for Shorts/Reels/TikTok, YouTube, or square social?',
        'Platform changes aspect ratio, caption safe zones, and frame layout.',
        'recommended',
        false,
        ['TikTok/Reels/Shorts', 'YouTube', 'Square', 'Let ReeditPro decide'],
      ),
    )
  }

  if (hasAny(text, ['best possible', 'premium']) && input.editLevel !== editLevel) {
    accumulator.clarifyingQuestions.push(
      makeQuestion(
        'question-tier-cost',
        'Should I switch this to Premium, or keep the current edit level and lower the credit estimate?',
        'Changing edit level affects fallback depth, asset count, and credit estimate.',
        'recommended',
        false,
        ['Switch to Premium', 'Keep current level', 'Show lower-cost plan'],
      ),
    )
  }

  if (hasAny(text, ['scam', 'fraud', 'accusation', 'allegation', 'courtroom', 'case']) && !hasAny(text, ['verified', 'alleged', 'allegation'])) {
    accumulator.clarifyingQuestions.push(
      makeQuestion(
        'question-claim-status',
        'Are the names and claims verified facts or allegations?',
        'Documentary/case-study edits need claim-safe wording and neutral evidence cards.',
        'recommended',
        false,
        ['Verified facts', 'Allegations', 'Mixed/unsure'],
      ),
    )
  }

  if (hasAny(text, ['very viral', 'super viral']) && hasAny(text, ['not fast', 'slow', 'natural'])) {
    accumulator.clarifyingQuestions.push(
      makeQuestion(
        'question-style-conflict',
        'Should I prioritize high-retention viral pacing or a more natural pace?',
        'The request contains conflicting pacing instructions.',
        'recommended',
        false,
        ['High-retention', 'Natural', 'Balanced'],
      ),
    )
  }

  accumulator.clarifyingQuestions = accumulator.clarifyingQuestions.slice(0, 3)
}

function getGoalSummary(text: string, directive: ProfessionalEditingDirective) {
  if (text.trim().length > 0) {
    return `Compile the user request into a ${directive.editStyle.replaceAll('_', ' ')} edit with ${directive.pacingStyle.replaceAll('_', ' ')} pacing and explicit approval before generation.`
  }

  return `Compile the confirmed chat setup into a ${directive.editStyle.replaceAll('_', ' ')} edit with ${directive.pacingStyle.replaceAll('_', ' ')} pacing.`
}

function confidenceFor(accumulator: IntentAccumulator) {
  if (accumulator.clarifyingQuestions.some((question) => question.blocksPlanning)) {
    return 'medium'
  }

  if (accumulator.requirements.length >= 3 || accumulator.customDirectives.length > 0) {
    return 'high'
  }

  return 'medium'
}

export function compileEditingIntent(params: CompileEditingIntentParams): CompiledEditingIntent {
  const text = normalizeMessage(params.userMessages)
  const accumulator: IntentAccumulator = {
    avoidRules: [],
    clarifyingQuestions: [],
    compilerNotes: [],
    customDirectives: [],
    mustFollowRules: [],
    requirements: [],
  }
  const editingCategory = applyCategory(text, params.currentInput, accumulator)
  const editLevel = applyEditLevel(text, params.currentInput, accumulator)
  const platformSettings = applyPlatform(text, params.currentInput, accumulator)
  const visualPreference = applyVisualPreference(text, params.currentInput, accumulator)
  const moodStyle = applyMood(text, params.currentInput)
  const creditPreference = applyCreditPreference(text, params.currentInput, accumulator)
  const professionalEditingDirective: MutableDirective = {
    ...getDefaultProfessionalEditingDirective({
      editLevel,
      editingCategory,
      moodStyle,
      targetPlatform: platformSettings.targetPlatform,
      visualPreference,
    }),
  }

  applyDirectiveOverrides(text, professionalEditingDirective, accumulator)
  applyTransitionOverrides(text, professionalEditingDirective, accumulator)
  applyCustomDirectives(text, professionalEditingDirective, accumulator)
  applyModelSignals(text, editLevel, accumulator)

  for (const rule of accumulator.mustFollowRules) {
    addUnique(professionalEditingDirective.mustFollowRules, rule)
  }

  for (const rule of accumulator.avoidRules) {
    addUnique(professionalEditingDirective.avoidRules, rule)
  }

  professionalEditingDirective.customDirectives = [
    ...professionalEditingDirective.customDirectives,
    ...accumulator.customDirectives,
  ]

  addUnique(accumulator.mustFollowRules, 'Compile chat into structured editing intent before plan generation.')
  addUnique(accumulator.mustFollowRules, 'No editing, generation, rendering, or credit deduction before plan and credit approval.')
  addUnique(accumulator.avoidRules, 'Avoid random b-roll, random transitions, random captions, random color grading, and random visuals.')

  addClarifyingQuestions(text, params.currentInput, editLevel, Boolean(params.sourceOrderConfirmed), accumulator)

  const lockedTierConstraints = buildTierConstraints(editLevel)
  const qaImplications = [
    'captions safe',
    'color matches requested grade',
    'avoid rules respected',
    'b-roll supports meaning',
    'transitions match style',
    'no random effects',
    params.sourceOrderConfirmed ? 'source order confirmed' : 'source order needs confirmation',
    editLevel === 'premium' ? 'Premium uses Veo only as final fallback' : 'Basic/Pro no Veo',
    'frame panel background matched',
    'approval before generation',
  ]

  if (params.referenceProvided) {
    accumulator.compilerNotes.push('Reference DNA may influence style, but it must not be copied shot-for-shot.')
  }

  accumulator.compilerNotes.push('Mock deterministic compiler only; no model API was called.')

  const customDirectives = professionalEditingDirective.customDirectives

  return {
    id: `compiled-intent-${editingCategory}-${editLevel}`,
    avoidRules: [...new Set([...professionalEditingDirective.avoidRules, ...accumulator.avoidRules])],
    clarifyingQuestions: accumulator.clarifyingQuestions,
    compilerNotes: accumulator.compilerNotes,
    confidence: confidenceFor(accumulator),
    customDirectives,
    goalSummary: getGoalSummary(text, professionalEditingDirective),
    lockedTierConstraints,
    mustFollowRules: [...new Set([...professionalEditingDirective.mustFollowRules, ...accumulator.mustFollowRules])],
    professionalEditingDirective,
    qaImplications,
    requirements: accumulator.requirements,
    resolvedSettings: {
      aspectRatio: platformSettings.aspectRatio,
      creditPreference,
      editLevel,
      editingCategory,
      frameTemplateType: platformSettings.frameTemplateType,
      moodStyle,
      targetPlatform: platformSettings.targetPlatform,
      visualPreference,
    },
  }
}
