import type {
  EditingCategory,
  EditLevel,
  PlannerInput,
  ProfessionalEditingDirective,
  ReferenceAdaptationFocus,
  ReferenceDNA,
  ReferenceVideoMode,
  ReferenceVideoPlan,
  TargetPlatform,
} from '../types/reeditpro'

type ReferenceDefaults = {
  topic: string
  openingStyle: string
  hookStyle: string
  pacing: string
  cutRhythm: string
  captionStyle: string
  captionDensity: string
  transitionStyle: string
  musicIntro: string
  soundSyncStyle: string
  visualEffectStyle: string
  brollStyle: string
  colorGradeMood: string
  signatureSystemUsage: string[]
  frameLayoutHints: string[]
  moodTone: string
  whatWorks: string[]
}

const defaultDoNotCopyRules = [
  'Do not copy the reference shot-for-shot.',
  'Do not copy exact timing one-to-one.',
  'Do not copy exact music, melodies, lyrics, or sound design.',
  'Do not copy copyrighted visuals, brand assets, or a creator identity as an exact replica.',
]

const focusLabels: Record<ReferenceAdaptationFocus, string> = {
  overall_style: 'overall style',
  opening_style: 'opening style',
  pacing: 'pacing',
  caption_style: 'caption style',
  transition_style: 'transition style',
  music_sound: 'music and SoundSync',
  visual_effects: 'visual effects',
  b_roll: 'b-roll',
  color_mood: 'color and mood',
  signature_system_usage: 'signature system usage',
  ignore_reference: 'ignore reference',
}

function createStableId(parts: string[]) {
  const source = parts.join('|').toLowerCase()
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 1000000007
  }

  return `reference-dna-${hash.toString(36)}`
}

function uniqueFocus(focus: ReferenceAdaptationFocus[] = []): ReferenceAdaptationFocus[] {
  const normalized: ReferenceAdaptationFocus[] = focus.length ? focus : ['overall_style']
  return Array.from(new Set<ReferenceAdaptationFocus>(normalized))
}

function includesFocus(focus: ReferenceAdaptationFocus[], values: ReferenceAdaptationFocus[]) {
  return focus.includes('overall_style') || values.some((value) => focus.includes(value))
}

function getReferenceMode(referenceUrl?: string): ReferenceVideoMode {
  return referenceUrl?.trim() ? 'user_pasted_link' : 'mock_reference'
}

function getUrlTopicHint(referenceUrl?: string) {
  const value = referenceUrl?.toLowerCase() ?? ''

  if (value.includes('product')) {
    return 'clean product reference'
  }

  if (value.includes('real-estate') || value.includes('listing') || value.includes('property')) {
    return 'premium property reference'
  }

  if (value.includes('education') || value.includes('lesson') || value.includes('explainer')) {
    return 'education reference'
  }

  if (value.includes('documentary') || value.includes('case')) {
    return 'documentary reference'
  }

  if (value.includes('lifestyle') || value.includes('travel') || value.includes('vlog')) {
    return 'lifestyle reference'
  }

  return 'reference edit style'
}

function getCategoryDefaults(editingCategory: EditingCategory): ReferenceDefaults {
  if (editingCategory === 'vlog_lifestyle' || editingCategory === 'real_estate_property_tour') {
    return {
      topic: 'Lifestyle reference',
      openingStyle: 'natural human moment',
      hookStyle: 'soft contextual hook',
      pacing: 'natural and warm',
      cutRhythm: 'clean human rhythm with breathing room',
      captionStyle: 'light clean captions',
      captionDensity: 'low to medium',
      transitionStyle: 'clean cuts and smooth premium transitions',
      musicIntro: 'warm lifestyle bed',
      soundSyncStyle: 'warm music support with gentle ducking',
      visualEffectStyle: 'restrained polish and natural texture',
      brollStyle: 'human detail shots that preserve place and mood',
      colorGradeMood: 'warm premium natural',
      signatureSystemUsage: ['light graphics', 'minimal animation', 'SoundSync'],
      frameLayoutHints: ['keep subject and place readable', 'avoid heavy overlay density'],
      moodTone: 'warm, natural, polished',
      whatWorks: ['It keeps the footage human.', 'It uses rhythm without feeling forced.', 'It lets mood lead the edit.'],
    }
  }

  if (editingCategory === 'product_demo' || editingCategory === 'marketing_ad') {
    return {
      topic: 'Business / brand reference',
      openingStyle: 'problem or benefit hook',
      hookStyle: 'clear product value opener',
      pacing: 'clean and tight',
      cutRhythm: 'efficient proof-led cuts',
      captionStyle: 'keyword emphasis captions',
      captionDensity: 'medium',
      transitionStyle: 'graphic and motion design transitions',
      musicIntro: 'subtle premium business pulse',
      soundSyncStyle: 'corporate/subtle premium support',
      visualEffectStyle: 'clean product cards and proof overlays',
      brollStyle: 'feature proof and product detail inserts',
      colorGradeMood: 'polished brand contrast',
      signatureSystemUsage: ['VisualExplain', 'product cards', 'possible Real Motion'],
      frameLayoutHints: ['reserve space for product proof', 'keep CTA/captions in safe zones'],
      moodTone: 'clean, direct, premium',
      whatWorks: ['It makes the benefit easy to understand.', 'It uses graphics for clarity.', 'It stays efficient.'],
    }
  }

  if (editingCategory === 'education_explainer') {
    return {
      topic: 'Education / explainer reference',
      openingStyle: 'concept question or lesson promise',
      hookStyle: 'learning promise hook',
      pacing: 'structured and clear',
      cutRhythm: 'step-based reveals with readable pauses',
      captionStyle: 'education labels',
      captionDensity: 'medium to high where speech is central',
      transitionStyle: 'graphic motion design',
      musicIntro: 'clean voice-first intro',
      soundSyncStyle: 'subtle non-distracting support',
      visualEffectStyle: 'diagrams, cards, and step reveals',
      brollStyle: 'examples and supporting proof only',
      colorGradeMood: 'clean educational clarity',
      signatureSystemUsage: ['VisualExplain', 'diagrams', 'cards', 'step reveals'],
      frameLayoutHints: ['leave room for diagrams', 'prioritize label readability'],
      moodTone: 'clear, useful, structured',
      whatWorks: ['It creates a learning path.', 'It makes abstract ideas visible.', 'It keeps captions readable.'],
    }
  }

  if (editingCategory === 'testimonial_case_study') {
    return {
      topic: 'Documentary / case study reference',
      openingStyle: 'case setup or what happened',
      hookStyle: 'credible case setup',
      pacing: 'serious measured or clean social',
      cutRhythm: 'measured proof-first cuts',
      captionStyle: 'documentary lower-third or small premium captions',
      captionDensity: 'low to medium',
      transitionStyle: 'evidence board or timeline transitions',
      musicIntro: 'serious documentary bed',
      soundSyncStyle: 'serious restrained SoundSync',
      visualEffectStyle: 'evidence cards, timelines, selected reenactment-style overlays',
      brollStyle: 'contextual proof, artifacts, timelines, and neutral detail',
      colorGradeMood: 'neutral serious documentary',
      signatureSystemUsage: ['evidence cards', 'timelines', 'selected reenactments'],
      frameLayoutHints: ['use neutral treatment for real people', 'separate allegations from verified facts'],
      moodTone: 'serious, careful, credible',
      whatWorks: ['It builds trust.', 'It separates context from claims.', 'It keeps evidence readable.'],
    }
  }

  return {
    topic: 'Storytelling reference',
    openingStyle: 'emotional setup or strong story hook',
    hookStyle: 'story-first opening beat',
    pacing: 'fast but readable story beats',
    cutRhythm: 'story-timed cuts with clear beat changes',
    captionStyle: 'clear supportive captions',
    captionDensity: 'medium, not cluttered',
    transitionStyle: 'Stroke Motion or smooth story transitions',
    musicIntro: 'emotional but not overpowering',
    soundSyncStyle: 'story beat support with voice-first ducking',
    visualEffectStyle: 'still/story cards and selective motion',
    brollStyle: 'story proof and emotional detail inserts',
    colorGradeMood: 'emotionally polished and readable',
    signatureSystemUsage: ['Stroke Motion', 'still/story cards', 'SoundSync'],
    frameLayoutHints: ['protect faces and captions', 'keep story cards secondary to footage'],
    moodTone: 'emotional, clear, story-led',
    whatWorks: ['It establishes stakes quickly.', 'It keeps emotion readable.', 'It supports the story without clutter.'],
  }
}

function createAdaptationRules(defaults: ReferenceDefaults, focus: ReferenceAdaptationFocus[], targetPlatform: TargetPlatform) {
  const rules = [
    'Use reference DNA as style guidance, not a shot-for-shot plan.',
    `Adapt the reference to ReeditPro planning, the user's source order, and ${targetPlatform.replaceAll('_', ' ')} frame constraints.`,
    'Explicit user instructions override reference DNA when they conflict.',
  ]

  if (includesFocus(focus, ['pacing', 'opening_style'])) {
    rules.push(`Adapt pacing loosely: ${defaults.pacing}.`)
  }

  if (includesFocus(focus, ['caption_style'])) {
    rules.push(`Adapt caption language and density: ${defaults.captionStyle}, ${defaults.captionDensity}.`)
  }

  if (includesFocus(focus, ['transition_style'])) {
    rules.push(`Use transition logic only when it supports the new footage: ${defaults.transitionStyle}.`)
  }

  if (includesFocus(focus, ['music_sound'])) {
    rules.push(`Let SoundSync study the energy shape without copying tracks: ${defaults.soundSyncStyle}.`)
  }

  if (includesFocus(focus, ['visual_effects', 'signature_system_usage'])) {
    rules.push(`Route visual systems per segment; do not force reference effects where they do not help.`)
  }

  return rules
}

function getUserOverrides(customInstructions = '') {
  const text = customInstructions.toLowerCase()
  const overrides: string[] = []

  if (text.includes('calmer') || text.includes('less aggressive')) {
    overrides.push('Make the reference influence calmer and less aggressive.')
  }

  if (text.includes('only caption') || text.includes('only captions')) {
    overrides.push('Use only the caption style from the reference.')
  }

  if (text.includes('only pacing')) {
    overrides.push('Use only the pacing from the reference.')
  }

  if (text.includes('ignore reference')) {
    overrides.push('Ignore the reference for planning.')
  }

  if (text.includes('do not copy') || text.includes("don't copy")) {
    overrides.push('User explicitly asked not to copy the reference exactly.')
  }

  return overrides
}

export function createMockReferenceDNA(params: {
  referenceUrl?: string
  editingCategory: EditingCategory
  editLevel: EditLevel
  targetPlatform: TargetPlatform
  customInstructions?: string
  focus?: ReferenceAdaptationFocus[]
}): ReferenceDNA {
  const defaults = getCategoryDefaults(params.editingCategory)
  const focus = uniqueFocus(params.focus)
  const topicHint = getUrlTopicHint(params.referenceUrl)
  const userOverrides = getUserOverrides(params.customInstructions)
  const mode = getReferenceMode(params.referenceUrl)

  return {
    id: createStableId([
      params.referenceUrl ?? 'mock-reference',
      params.editingCategory,
      params.editLevel,
      params.targetPlatform,
      focus.join(','),
      params.customInstructions ?? '',
    ]),
    mode,
    referenceUrl: params.referenceUrl?.trim() || undefined,
    referenceLabel: mode === 'mock_reference' ? 'Mock reference' : topicHint,
    topic: `${defaults.topic}: ${topicHint}`,
    openingStyle: defaults.openingStyle,
    hookStyle: defaults.hookStyle,
    pacing: defaults.pacing,
    cutRhythm: defaults.cutRhythm,
    captionStyle: defaults.captionStyle,
    captionDensity: defaults.captionDensity,
    transitionStyle: defaults.transitionStyle,
    musicIntro: defaults.musicIntro,
    soundSyncStyle: defaults.soundSyncStyle,
    visualEffectStyle: defaults.visualEffectStyle,
    brollStyle: defaults.brollStyle,
    colorGradeMood: defaults.colorGradeMood,
    signatureSystemUsage: defaults.signatureSystemUsage,
    frameLayoutHints: defaults.frameLayoutHints,
    moodTone: defaults.moodTone,
    whatWorks: defaults.whatWorks,
    adaptationRules: createAdaptationRules(defaults, focus, params.targetPlatform),
    doNotCopyRules: defaultDoNotCopyRules,
    userOverrides,
    focus,
    confidence: params.referenceUrl ? 'medium' : 'low',
    sourceLimitations: [
      'Frontend prototype uses deterministic mock analysis only.',
      'No reference video was downloaded or analyzed.',
      'Reference guidance must be reviewed in the edit plan before generation.',
    ],
  }
}

export function createReferenceVideoPlan(params: {
  referenceUrl?: string
  referenceAttached: boolean
  skipped?: boolean
  input: PlannerInput
}): ReferenceVideoPlan {
  const requestedFocus = uniqueFocus(params.input.referenceAdaptationFocus)
  const ignoreReference = requestedFocus.includes('ignore_reference')

  if (params.skipped || params.input.referenceVideoMode === 'reference_skipped' || ignoreReference) {
    return {
      mode: 'reference_skipped',
      referenceProvided: false,
      skipped: true,
      userNotes: ['Reference skipped by user.'],
      requiredBeforeApproval: false,
      status: 'skipped',
    }
  }

  const referenceUrl = params.referenceUrl?.trim() || undefined

  if (!params.referenceAttached && !referenceUrl) {
    return {
      mode: 'no_reference',
      referenceProvided: false,
      skipped: false,
      userNotes: params.input.referenceNotes ?? [],
      requiredBeforeApproval: false,
      status: 'not_started',
    }
  }

  const mode: ReferenceVideoMode =
    params.input.referenceVideoMode === 'mock_reference'
      ? 'mock_reference'
      : referenceUrl
        ? 'user_pasted_link'
        : 'mock_reference'

  const referenceDNA = createMockReferenceDNA({
    referenceUrl,
    editingCategory: params.input.workflowType,
    editLevel: params.input.editLevel,
    targetPlatform: params.input.targetPlatform,
    customInstructions: params.input.customInstructions,
    focus: requestedFocus,
  })

  return {
    mode,
    referenceUrl,
    referenceProvided: true,
    referenceDNA: {
      ...referenceDNA,
      mode,
      referenceLabel: mode === 'mock_reference' ? 'Mock reference' : referenceDNA.referenceLabel,
    },
    skipped: false,
    userNotes: params.input.referenceNotes ?? [],
    requiredBeforeApproval: true,
    status: 'analyzed_mock',
  }
}

export function getReferenceAdaptationSummary(referenceDNA: ReferenceDNA): string {
  const focusSummary = referenceDNA.focus.map((focus) => focusLabels[focus]).join(', ')
  return `${referenceDNA.openingStyle}; ${referenceDNA.pacing}; ${referenceDNA.captionStyle}; ${referenceDNA.transitionStyle}. Focus: ${focusSummary}.`
}

export function getReferenceDoNotCopySummary(referenceDNA: ReferenceDNA): string {
  return referenceDNA.doNotCopyRules.join(' ')
}

export function mergeReferenceDNAIntoProfessionalDirective(params: {
  directive: ProfessionalEditingDirective
  referenceDNA?: ReferenceDNA
  userInstructions: string
}): ProfessionalEditingDirective {
  const { directive, referenceDNA, userInstructions } = params

  if (!referenceDNA || referenceDNA.focus.includes('ignore_reference')) {
    return {
      ...directive,
      transitionFamilies: [...directive.transitionFamilies],
      signatureSystemGuidance: [...directive.signatureSystemGuidance],
      customDirectives: [...directive.customDirectives],
      avoidRules: [...directive.avoidRules],
      tierModelRules: [...directive.tierModelRules],
    }
  }

  const focus = referenceDNA.focus
  const transitionFamilies = [...directive.transitionFamilies]
  const signatureSystemGuidance = [...directive.signatureSystemGuidance]
  const customDirectives = [...directive.customDirectives]
  const avoidRules = [...directive.avoidRules, ...referenceDNA.doNotCopyRules]
  let pacingStyle = directive.pacingStyle
  let captionStyle = directive.captionStyle
  let soundStyle = directive.soundStyle
  let visualDensity = directive.visualDensity

  if (includesFocus(focus, ['pacing', 'opening_style'])) {
    pacingStyle = `${directive.pacingStyle}; reference-guided ${referenceDNA.pacing}`
  }

  if (includesFocus(focus, ['caption_style'])) {
    captionStyle = `${directive.captionStyle}; adapt ${referenceDNA.captionStyle}`
  }

  if (includesFocus(focus, ['transition_style'])) {
    transitionFamilies.push(referenceDNA.transitionStyle)
  }

  if (includesFocus(focus, ['music_sound'])) {
    soundStyle = `${directive.soundStyle}; reference-guided ${referenceDNA.soundSyncStyle}`
  }

  if (includesFocus(focus, ['visual_effects', 'b_roll', 'color_mood', 'signature_system_usage'])) {
    visualDensity = `${directive.visualDensity}; reference mood ${referenceDNA.moodTone}`
    signatureSystemGuidance.push(`Reference style suggests: ${referenceDNA.signatureSystemUsage.join(', ')}.`)
  }

  customDirectives.push(`Reference adaptation: ${getReferenceAdaptationSummary(referenceDNA)}`)
  customDirectives.push('Reference DNA guides style and does not override explicit user instructions.')

  if (userInstructions.trim()) {
    customDirectives.push(`User instruction remains primary: ${userInstructions.trim()}`)
  }

  return {
    ...directive,
    pacingStyle,
    captionStyle,
    soundStyle,
    visualDensity,
    transitionFamilies: Array.from(new Set(transitionFamilies)),
    signatureSystemGuidance: Array.from(new Set(signatureSystemGuidance)),
    customDirectives: Array.from(new Set(customDirectives)),
    avoidRules: Array.from(new Set(avoidRules)),
    tierModelRules: [...directive.tierModelRules],
  }
}
