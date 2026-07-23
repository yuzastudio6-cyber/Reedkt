import type {
  MotionLanguageDefinition,
  MotionLanguageReference,
  NarrativeFunctionDefinition,
  NarrativeFunctionReference,
} from '../../../types/motion-studio'
import {
  motionStudioMotionLanguageDefinitionSchema,
  motionStudioNarrativeFunctionDefinitionSchema,
} from './schemas'

export const MOTION_STUDIO_NARRATIVE_FUNCTION_IDS = [
  'narrative_function.establish_context',
  'narrative_function.establish_location',
  'narrative_function.introduce_person',
  'narrative_function.introduce_object_or_product',
  'narrative_function.establish_time',
  'narrative_function.explain_process',
  'narrative_function.explain_cause_and_effect',
  'narrative_function.show_change_over_time',
  'narrative_function.compare',
  'narrative_function.quantify',
  'narrative_function.reveal_evidence',
  'narrative_function.present_quote',
  'narrative_function.build_tension',
  'narrative_function.create_emotional_pause',
  'narrative_function.show_consequence',
  'narrative_function.transition_chapter',
  'narrative_function.summarize',
  'narrative_function.resolve_or_conclude',
] as const

export type MotionStudioNarrativeFunctionId = typeof MOTION_STUDIO_NARRATIVE_FUNCTION_IDS[number]

const narrativePurposes: Record<MotionStudioNarrativeFunctionId, string> = {
  'narrative_function.establish_context': 'Give the audience the minimum context required to understand the next claim or event.',
  'narrative_function.establish_location': 'Orient the audience to a verified or explicitly representative place.',
  'narrative_function.introduce_person': 'Introduce a person, role, and relevance without inventing unsupported characteristics.',
  'narrative_function.introduce_object_or_product': 'Introduce an object or product, its identity, and its approved relevance.',
  'narrative_function.establish_time': 'Orient the audience to the verified date, period, sequence position, or elapsed time.',
  'narrative_function.explain_process': 'Explain a sequence of steps without omitting required dependencies.',
  'narrative_function.explain_cause_and_effect': 'Show a supported causal relationship without presenting correlation as proof.',
  'narrative_function.show_change_over_time': 'Make a source-backed temporal change and its direction understandable.',
  'narrative_function.compare': 'Compare subjects on consistent, source-backed dimensions.',
  'narrative_function.quantify': 'Communicate a source-backed magnitude, rate, proportion, or count.',
  'narrative_function.reveal_evidence': 'Present evidence with provenance, uncertainty, and disclosure intact.',
  'narrative_function.present_quote': 'Present an attributed quote without changing its meaning.',
  'narrative_function.build_tension': 'Increase anticipation without fabricating facts or obscuring speech.',
  'narrative_function.create_emotional_pause': 'Create a deliberate reflective pause without obscuring required context.',
  'narrative_function.show_consequence': 'Show a supported outcome and its relationship to preceding events.',
  'narrative_function.transition_chapter': 'Close one approved idea and prepare the audience for the next chapter.',
  'narrative_function.summarize': 'Restate the supported argument, sequence, or findings and their limits concisely.',
  'narrative_function.resolve_or_conclude': 'Resolve the approved narrative arc and preserve remaining uncertainty.',
}

function narrativeCategory(id: MotionStudioNarrativeFunctionId): NarrativeFunctionDefinition['category'] {
  if (/establish_context|establish_location/.test(id)) return 'orientation'
  if (/introduce_/.test(id)) return 'introduction'
  if (/establish_time|change_over_time/.test(id)) return 'temporal'
  if (/explain_|show_consequence/.test(id)) return 'explanation'
  if (/compare|quantify/.test(id)) return 'comparison'
  if (/evidence|quote/.test(id)) return 'evidence'
  if (/tension|emotional_pause/.test(id)) return 'emotional'
  if (/transition_chapter/.test(id)) return 'transition'
  return 'resolution'
}

function requiredEvidenceLevel(id: MotionStudioNarrativeFunctionId): NarrativeFunctionDefinition['requiredEvidenceLevel'] {
  if (/quote|quantify|evidence/.test(id)) return 'source_exact'
  if (/person|object_or_product|time|process|cause|change|compare|consequence/.test(id)) return 'source_backed'
  return 'contextual'
}

export const MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS: readonly NarrativeFunctionDefinition[] =
  MOTION_STUDIO_NARRATIVE_FUNCTION_IDS.map((id, index) => ({
    id,
    version: '1.0.0',
    contentDigest: (index + 1).toString(16).padStart(64, '0'),
    name: id.replace('narrative_function.', '').replaceAll('_', ' '),
    category: narrativeCategory(id),
    semanticPurpose: narrativePurposes[id],
    inputEvidenceRequirements: ['Use approved story, claim, source, and timing references appropriate to this function.'],
    intendedViewerUnderstanding: ['The audience can state the intended person, object, time, relationship, event, fact, emotion, or transition accurately.'],
    intendedEmotionalOutcome: /tension/.test(id)
      ? ['Anticipation grounded in approved facts.']
      : /emotional_pause/.test(id)
        ? ['A reflective pause with meaning preserved.']
        : /resolve_or_conclude/.test(id)
          ? ['Resolution with remaining uncertainty visible.']
          : [],
    requiredEvidenceLevel: requiredEvidenceLevel(id),
    supportedStoryBeatForms: ['narration-led beat', 'evidence-led beat', 'visual-led beat'],
    continuityExpectations: ['Preserve approved chronology, identity, terminology, and incoming/outgoing scene context.'],
    completionCriteria: ['The intended viewer understanding is legible and all required evidence, precision, disclosure, and timing checks pass.'],
    truthAccuracyRequirements: ['Preserve source truth, uncertainty, approved disclosures, and user-marked important context.'],
    allowedVisualTreatmentFamilies: ['native graphics', 'layered motion', 'footage', 'generated reconstruction', 'hybrid composition'],
    pacingGuidance: ['Protect speech clarity and provide enough hold time for the required understanding.'],
    transitionGuidance: ['Use a motivated transition that preserves chronology and meaning.'],
    textDataPrecision: ['quantify', 'present_quote', 'establish_time', 'reveal_evidence'].some((part) => id.endsWith(part))
      ? 'source_exact'
      : 'precise',
    disclosureRequirements: id.includes('evidence') || id.includes('person') || id.includes('object_or_product')
      ? ['Preserve applicable fact-safety, attribution, and reconstruction disclosures.']
      : [],
    failureRules: ['Fail closed when required evidence, timing authority, or disclosure is missing.'],
    fallbackRules: ['Use a lower-risk accurate treatment or request review; do not invent unsupported detail.'],
    providerRoutingAllowed: false,
    toolExecutionAllowed: false,
    immutable: true,
  }))

export const MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS: readonly MotionLanguageDefinition[] = [
  {
    id: 'motion_language.editorial_collage_documentary',
    version: '1.0.0',
    contentDigest: 'a'.repeat(64),
    name: 'Editorial Collage Documentary',
    scope: 'system',
    visualGrammar: {
      visualFamilies: ['editorial collage', 'document reconstruction', 'restrained cutout'],
      shapeLanguage: ['bold paper blocks', 'clean outlined callouts'],
      depthLanguage: ['shallow layered paper depth', 'legible foreground evidence'],
    },
    typographyGrammar: {
      hierarchyRules: ['one dominant statement', 'small labels remain deterministic'],
      typeTokenIds: ['type.documentary.display', 'type.documentary.label'],
      textMotionRules: ['short directional entrances', 'no generated baked-in essential text'],
    },
    colorSemantics: {
      paletteTokenIds: ['color.paper.near-white', 'color.ink.navy', 'color.accent.cyan'],
      accentRules: ['one accent family per scene'],
      contrastRules: ['meet approved readability contrast'],
    },
    textureMaterialGrammar: {
      materials: ['matte paper', 'printed photograph'],
      textures: ['restrained paper grain'],
      grainRules: ['grain must not reduce text readability'],
    },
    compositionGrammar: {
      hierarchyRules: ['single primary focus', 'supporting evidence remains subordinate'],
      safeZoneRules: ['protect captions, faces, labels, and disclosure notes'],
      densityRules: ['split overloaded compositions into additional shots'],
    },
    cameraGrammar: {
      allowedMoves: ['slow push', 'restrained lateral reveal'],
      lensLanguage: ['graphic orthographic', 'mild documentary parallax'],
      focusRules: ['focus follows the current evidence or narration beat'],
    },
    motionGrammar: {
      entrances: ['paper slide', 'masked reveal'],
      exits: ['clean wipe', 'motivated dissolve'],
      emphasis: ['single scale accent', 'underline trace'],
      easingTokenIds: ['ease.documentary.standard'],
    },
    transitionGrammar: {
      families: ['paper wipe', 'evidence match cut'],
      continuityRules: ['preserve direction and reading order'],
    },
    atmosphereGrammar: {
      lightingRules: ['flat editorial light'],
      environmentalRules: ['near-white or approved panel background'],
      emotionalQualities: ['credible', 'restrained', 'curious'],
    },
    pacingCharacter: ['favor readable holds and one primary action per beat'],
    soundDesignInfluence: ['use restrained paper and interface cues that do not cover speech'],
    prohibitedCharacteristics: ['publisher imitation', 'random collage', 'illegible microtext'],
    immutable: true,
  },
  {
    id: 'motion_language.technical_blueprint_documentary',
    version: '1.0.0',
    contentDigest: 'b'.repeat(64),
    name: 'Technical Blueprint Documentary',
    scope: 'system',
    visualGrammar: {
      visualFamilies: ['technical drawing', 'measured diagram', 'route schematic'],
      shapeLanguage: ['precise linework', 'measured geometric panels'],
      depthLanguage: ['flat plan view', 'controlled exploded layers'],
    },
    typographyGrammar: {
      hierarchyRules: ['precise title, label, and measurement hierarchy'],
      typeTokenIds: ['type.technical.heading', 'type.technical.label'],
      textMotionRules: ['labels appear only after their geometry is established'],
    },
    colorSemantics: {
      paletteTokenIds: ['color.blueprint.base', 'color.blueprint.line', 'color.warning.amber'],
      accentRules: ['amber is reserved for active evidence or risk'],
      contrastRules: ['technical labels maintain review contrast'],
    },
    textureMaterialGrammar: {
      materials: ['blueprint paper', 'technical overlay'],
      textures: ['subtle grid'],
      grainRules: ['grid and texture remain below labels'],
    },
    compositionGrammar: {
      hierarchyRules: ['geometry first, labels second, evidence accents third'],
      safeZoneRules: ['protect dimensions, captions, and source notes'],
      densityRules: ['progressively disclose complex systems'],
    },
    cameraGrammar: {
      allowedMoves: ['orthographic push', 'measured pan'],
      lensLanguage: ['plan view', 'technical isometric'],
      focusRules: ['focus tracks the current system component'],
    },
    motionGrammar: {
      entrances: ['line draw', 'measured reveal'],
      exits: ['diagram collapse', 'grid match'],
      emphasis: ['pulse line', 'measurement bracket'],
      easingTokenIds: ['ease.technical.precise'],
    },
    transitionGrammar: {
      families: ['grid align', 'line continuation'],
      continuityRules: ['preserve coordinate orientation across transitions'],
    },
    atmosphereGrammar: {
      lightingRules: ['graphic technical light'],
      environmentalRules: ['controlled blueprint field'],
      emotionalQualities: ['precise', 'analytical', 'credible'],
    },
    pacingCharacter: ['hold complex diagrams long enough for labels and relationships to be read'],
    soundDesignInfluence: ['use precise drawing and mechanical cues beneath speech-safe thresholds'],
    prohibitedCharacteristics: ['decorative false precision', 'unverified measurements', 'unreadable dense grids'],
    immutable: true,
  },
  {
    id: 'motion_language.cinematic_historical_documentary',
    version: '1.0.0',
    contentDigest: 'c'.repeat(64),
    name: 'Cinematic Historical Documentary',
    scope: 'system',
    visualGrammar: {
      visualFamilies: ['layered archive', 'cinematic reconstruction', 'evidence-led photography'],
      shapeLanguage: ['restrained cinematic panels', 'archival frames'],
      depthLanguage: ['layered foreground evidence', 'controlled environmental depth'],
    },
    typographyGrammar: {
      hierarchyRules: ['documentary title, date, location, and source-note hierarchy'],
      typeTokenIds: ['type.historical.heading', 'type.historical.source-note'],
      textMotionRules: ['essential text remains deterministic and speech-safe'],
    },
    colorSemantics: {
      paletteTokenIds: ['color.historical.neutral', 'color.historical.shadow', 'color.historical.accent'],
      accentRules: ['accent identifies current evidence, person, or consequence'],
      contrastRules: ['archive and reconstruction labels remain legible'],
    },
    textureMaterialGrammar: {
      materials: ['archival photograph', 'document paper', 'cinematic panel'],
      textures: ['restrained film grain', 'subtle paper wear'],
      grainRules: ['texture never implies false age or authenticity'],
    },
    compositionGrammar: {
      hierarchyRules: ['source evidence remains distinguishable from reconstruction'],
      safeZoneRules: ['protect faces, captions, dates, source notes, and reconstruction disclosures'],
      densityRules: ['hold evidence-heavy scenes or split them into additional beats'],
    },
    cameraGrammar: {
      allowedMoves: ['slow documentary push', 'layered parallax reveal', 'restrained establishing drift'],
      lensLanguage: ['documentary medium lens', 'controlled environmental wide'],
      focusRules: ['focus follows approved evidence or emotional emphasis'],
    },
    motionGrammar: {
      entrances: ['archival reveal', 'depth-aware dissolve'],
      exits: ['motivated fade', 'evidence match cut'],
      emphasis: ['restrained light shift', 'single evidence focus'],
      easingTokenIds: ['ease.cinematic_documentary.restrained'],
    },
    transitionGrammar: {
      families: ['archive-to-reconstruction match', 'time-motivated dissolve'],
      continuityRules: ['preserve chronology, screen direction, and authenticity labels'],
    },
    atmosphereGrammar: {
      lightingRules: ['motivated documentary lighting'],
      environmentalRules: ['historically appropriate, source-safe environment'],
      emotionalQualities: ['credible', 'tense when supported', 'reflective'],
    },
    pacingCharacter: ['use deliberate cinematic holds without sacrificing factual context or speech clarity'],
    soundDesignInfluence: ['use period-safe ambience and restrained visible-event cues; never manufacture evidentiary speech'],
    prohibitedCharacteristics: ['unlabeled reconstruction', 'false archive treatment', 'sensationalized historical claims'],
    immutable: true,
  },
  {
    id: 'motion_language.cinematic_paper_diorama_documentary',
    version: '1.0.0',
    contentDigest: 'dc29aff1f1116381a6cc9556aaf3dc474e63fbc7b75a25cc58c26b012863cc92',
    name: 'Cinematic Paper Diorama Documentary',
    scope: 'system',
    visualGrammar: {
      visualFamilies: ['handcrafted paper diorama', 'layered documentary miniature', 'restrained archival cutout'],
      shapeLanguage: ['torn paper planes', 'cardboard structures', 'single tactile accent object'],
      depthLanguage: ['measured miniature depth', 'foreground paper layers', 'legible evidence plane'],
    },
    typographyGrammar: {
      hierarchyRules: ['one short deterministic prop label at most', 'source and reconstruction disclosures remain separate'],
      typeTokenIds: ['type.diorama.heading', 'type.diorama.label', 'type.documentary.source-note'],
      textMotionRules: ['essential typography is composed after image generation', 'prop labels remain exact and independently editable'],
    },
    colorSemantics: {
      paletteTokenIds: ['color.paper.sepia', 'color.ink.charcoal', 'color.accent.burnt-orange'],
      accentRules: ['one restrained burnt-orange accent family per scene'],
      contrastRules: ['labels, captions, and disclosures preserve approved readability contrast'],
    },
    textureMaterialGrammar: {
      materials: ['aged paper', 'matte cardboard', 'printed archival photograph'],
      textures: ['restrained newsprint', 'paper fiber', 'subtle film grain'],
      grainRules: ['texture must not simulate false archive authenticity or reduce evidence readability'],
    },
    compositionGrammar: {
      hierarchyRules: ['one primary tactile idea per beat', 'evidence remains distinguishable from decorative depth'],
      safeZoneRules: ['protect captions, faces, exact labels, source notes, and reconstruction disclosures'],
      densityRules: ['split overloaded dioramas instead of stacking unrelated props'],
    },
    cameraGrammar: {
      allowedMoves: ['restrained macro push', 'measured tilt-shift drift', 'motivated paper-plane transition'],
      lensLanguage: ['macro documentary', 'controlled tilt-shift miniature'],
      focusRules: ['focus follows the current evidence, subject, or approved through-line object'],
    },
    motionGrammar: {
      entrances: ['layered paper rise', 'tactile masked reveal'],
      exits: ['motivated paper occlusion', 'depth-aware dissolve'],
      emphasis: ['single prop impact', 'restrained scale reveal'],
      easingTokenIds: ['ease.cinematic_documentary.restrained', 'ease.paper_tactile.measured'],
    },
    transitionGrammar: {
      families: ['paper-plane match', 'foreground occlusion', 'motivated depth continuation'],
      continuityRules: ['preserve screen direction, chronology, material scale, and approved through-line continuity'],
    },
    atmosphereGrammar: {
      lightingRules: ['warm motivated miniature light with controlled shadows'],
      environmentalRules: ['handcrafted paper world with source-safe reconstruction disclosure'],
      emotionalQualities: ['tactile', 'cinematic', 'credible', 'restrained'],
    },
    pacingCharacter: ['use deliberate readable holds; high-energy impacts and speed ramps are optional narrative choices, never defaults'],
    soundDesignInfluence: ['use restrained paper, cardboard, and visible-event cues below speech-safe thresholds'],
    prohibitedCharacteristics: [
      'publisher imitation',
      'unlicensed reusable prop adoption',
      'generated essential typography',
      'forced fake-oner structure',
      'unlabeled historical reconstruction',
    ],
    immutable: true,
  },
]

export function motionLanguageReference(definition: MotionLanguageDefinition): MotionLanguageReference {
  return {
    motionLanguageId: definition.id,
    motionLanguageVersion: definition.version,
    motionLanguageDigest: definition.contentDigest,
  }
}

export function narrativeFunctionReference(definition: NarrativeFunctionDefinition): NarrativeFunctionReference {
  return {
    narrativeFunctionId: definition.id,
    narrativeFunctionVersion: definition.version,
    narrativeFunctionDigest: definition.contentDigest,
  }
}

export function validateMotionStudioSemanticCatalogs(): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS.length !== 18) {
    errors.push(`Expected 18 narrative functions, received ${MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS.length}.`)
  }
  const narrativeIds = new Set<string>()
  const narrativeDigests = new Set<string>()
  for (const definition of MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS) {
    const result = motionStudioNarrativeFunctionDefinitionSchema.safeParse(definition)
    if (!result.success) errors.push(...result.error.issues.map((issue) => `${definition.id}.${issue.path.join('.')}: ${issue.message}`))
    if (narrativeIds.has(definition.id)) errors.push(`Duplicate narrative function ${definition.id}.`)
    if (narrativeDigests.has(definition.contentDigest)) {
      errors.push(`Duplicate narrative function digest ${definition.contentDigest}.`)
    }
    narrativeIds.add(definition.id)
    narrativeDigests.add(definition.contentDigest)
  }
  const languageIds = new Set<string>()
  const languageDigests = new Set<string>()
  for (const definition of MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS) {
    const result = motionStudioMotionLanguageDefinitionSchema.safeParse(definition)
    if (!result.success) errors.push(...result.error.issues.map((issue) => `${definition.id}.${issue.path.join('.')}: ${issue.message}`))
    if (languageIds.has(definition.id)) errors.push(`Duplicate motion language ${definition.id}.`)
    if (languageDigests.has(definition.contentDigest)) {
      errors.push(`Duplicate motion language digest ${definition.contentDigest}.`)
    }
    languageIds.add(definition.id)
    languageDigests.add(definition.contentDigest)
    if (narrativeIds.has(definition.id)) errors.push(`Motion language ${definition.id} collides with a narrative function.`)
  }
  return { ok: errors.length === 0, errors }
}
