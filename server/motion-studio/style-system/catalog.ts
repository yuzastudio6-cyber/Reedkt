import type {
  MotionLanguageDefinition,
  StorytellingMotionStyleProfile,
  StorytellingMotionStyleProfileId,
  StorytellingMotionStyleProfileReference,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
  motionLanguageReference,
  storytellingMotionStyleProfileSchema,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'

type StyleProfileDraft = Omit<StorytellingMotionStyleProfile, 'contentDigest'>

const sourceAndBrandPolicy = Object.freeze({
  publisherImitationAllowed: false as const,
  unlicensedReferenceBundlingAllowed: false as const,
  providerPresetOrJobIdentityAdoptionAllowed: false as const,
  doNotCopyReferenceRequiredForNamedPublisherRequests: true as const,
})

const deterministicCompositionPolicy = Object.freeze({
  exactTextGeneratedInMediaAllowed: false as const,
  captionsGeneratedInMediaAllowed: false as const,
  exactMapsChartsAndDataGeneratedInMediaAllowed: false as const,
  finalCanvasOwnedByReeditpro: true as const,
  editableTimelineRequired: true as const,
})

const editorialCollage = language('motion_language.editorial_collage_documentary')
const cinematicRealist = language('motion_language.cinematic_historical_documentary')
const paperDiorama = language('motion_language.cinematic_paper_diorama_documentary')
const technicalBlueprint = language('motion_language.technical_blueprint_documentary')

export const STORYTELLING_MOTION_STYLE_PROFILES: readonly StorytellingMotionStyleProfile[] = deepFreeze([
  profile({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
    id: 'storytelling_style.editorial_collage',
    version: '1.0.0',
    displayName: 'Editorial Collage',
    shortDescription: 'A modern explanatory collage built from archival cutouts, restrained print texture, native maps, data, and purposeful annotations.',
    inputAliases: ['editorial collage', 'vox style', 'mixed media explainer', 'modern news explainer'],
    motionLanguage: motionLanguageReference(editorialCollage),
    defaultProductionMode: 'hybrid_directed',
    supportedProductionModes: ['hybrid_directed', 'layered_first', 'native_graphics_first', 'footage_first'],
    recipeFamilies: ['editorial_archive_reveal', 'native_evidence_graphic', 'footage_evidence', 'hybrid_documentary'],
    bestFor: ['data-led explainers', 'cause-and-effect stories', 'maps and comparisons', 'archive-supported current affairs'],
    relativeCostTendency: 'moderate',
    editability: 'high',
    sourceAndBrandPolicy,
    deterministicCompositionPolicy,
    providerNeutral: true,
    runtimeExecutionAuthorized: false,
    immutable: true,
  }),
  profile({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
    id: 'storytelling_style.cinematic_realist_documentary',
    version: '1.0.0',
    displayName: 'Cinematic Realist Documentary',
    shortDescription: 'Evidence-led footage, photographic depth, restrained cinematic reconstruction, and explicit archive-versus-reconstruction disclosure.',
    inputAliases: ['cinematic realist documentary', 'realistic documentary', 'cinematic documentary', 'photoreal documentary'],
    motionLanguage: motionLanguageReference(cinematicRealist),
    defaultProductionMode: 'hybrid_directed',
    supportedProductionModes: ['hybrid_directed', 'footage_first', 'layered_first', 'generative_first'],
    recipeFamilies: ['footage_evidence', 'cinematic_reconstruction', 'hybrid_documentary', 'native_evidence_graphic'],
    bestFor: ['history', 'investigations', 'biographies', 'location-led stories', 'evidence-heavy documentaries'],
    relativeCostTendency: 'higher',
    editability: 'medium',
    sourceAndBrandPolicy,
    deterministicCompositionPolicy,
    providerNeutral: true,
    runtimeExecutionAuthorized: false,
    immutable: true,
  }),
  profile({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
    id: 'storytelling_style.paper_diorama_documentary',
    version: '1.0.0',
    displayName: 'Paper Diorama Documentary',
    shortDescription: 'A tactile cinematic paper world using measured miniature depth, layered evidence, warm motivated light, and exact editable typography.',
    inputAliases: ['paper diorama documentary', 'paper documentary', 'newspaper diorama', 'cinematic paper collage'],
    motionLanguage: motionLanguageReference(paperDiorama),
    defaultProductionMode: 'hybrid_directed',
    supportedProductionModes: ['hybrid_directed', 'layered_first', 'native_graphics_first', 'generative_first'],
    recipeFamilies: ['layered_paper_depth', 'editorial_archive_reveal', 'cinematic_reconstruction', 'native_evidence_graphic'],
    bestFor: ['geopolitics', 'money and power', 'historical systems', 'investigative chapter transitions'],
    relativeCostTendency: 'higher',
    editability: 'high',
    sourceAndBrandPolicy,
    deterministicCompositionPolicy,
    providerNeutral: true,
    runtimeExecutionAuthorized: false,
    immutable: true,
  }),
  profile({
    schemaVersion: MOTION_STUDIO_STORYTELLING_STYLE_PROFILE_VERSION,
    id: 'storytelling_style.technical_blueprint',
    version: '1.0.0',
    displayName: 'Technical Blueprint',
    shortDescription: 'A precise native-graphics language for processes, routes, systems, measurements, diagrams, and exact explanatory data.',
    inputAliases: ['technical blueprint', 'blueprint explainer', 'technical documentary', 'diagram led explainer'],
    motionLanguage: motionLanguageReference(technicalBlueprint),
    defaultProductionMode: 'native_graphics_first',
    supportedProductionModes: ['native_graphics_first', 'hybrid_directed', 'layered_first'],
    recipeFamilies: ['native_evidence_graphic', 'hybrid_documentary'],
    bestFor: ['technical systems', 'operations', 'routes', 'engineering', 'process explanations'],
    relativeCostTendency: 'lower',
    editability: 'high',
    sourceAndBrandPolicy,
    deterministicCompositionPolicy,
    providerNeutral: true,
    runtimeExecutionAuthorized: false,
    immutable: true,
  }),
])

export function getStorytellingMotionStyleProfile(
  id: StorytellingMotionStyleProfileId,
): StorytellingMotionStyleProfile {
  const result = STORYTELLING_MOTION_STYLE_PROFILES.find((item) => item.id === id)
  if (!result) throw new Error(`Unknown Storytelling motion style profile: ${id}`)
  return result
}

export function storytellingMotionStyleProfileReference(
  value: StorytellingMotionStyleProfile,
): StorytellingMotionStyleProfileReference {
  return deepFreeze({
    styleProfileId: value.id,
    styleProfileVersion: value.version,
    styleProfileDigest: value.contentDigest,
  })
}

/**
 * Returns up to three relevant directions; it never silently selects one.
 * Named-publisher language is treated only as an intake alias for the generic
 * Editorial Collage profile.
 */
export function recommendStorytellingMotionStyleProfiles(
  direction: string,
): readonly StorytellingMotionStyleProfile[] {
  const normalized = normalize(direction)
  const ranked = STORYTELLING_MOTION_STYLE_PROFILES.map((item, index) => ({
    item,
    index,
    score: Math.max(0, ...item.inputAliases.map((alias) => normalized.includes(normalize(alias)) ? normalize(alias).length : 0)),
  }))
  const matched = ranked.filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.item)
  if (matched.length > 0) return matched.slice(0, 3)
  return [
    getStorytellingMotionStyleProfile('storytelling_style.editorial_collage'),
    getStorytellingMotionStyleProfile('storytelling_style.cinematic_realist_documentary'),
    getStorytellingMotionStyleProfile('storytelling_style.technical_blueprint'),
  ]
}

/**
 * Resolves only directions the user actually named. Unlike recommendations,
 * an empty result never falls back to a default and therefore cannot become a
 * silent style decision.
 */
export function matchExplicitStorytellingMotionStyleProfiles(
  direction: string,
): readonly StorytellingMotionStyleProfile[] {
  const normalized = normalize(direction)
  if (!normalized) return []
  return STORYTELLING_MOTION_STYLE_PROFILES.map((item, index) => ({
    item,
    index,
    score: Math.max(
      affirmativeAliasScore(normalized, item.displayName),
      ...item.inputAliases.map((alias) => affirmativeAliasScore(normalized, alias)),
    ),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.item)
}

/**
 * Finds every catalog direction named in a message, including directions the
 * user explicitly rejected. Ordered-history resolution uses this to ensure a
 * later revocation cannot silently resurrect an older affirmative choice.
 */
export function findReferencedStorytellingMotionStyleProfiles(
  direction: string,
): readonly StorytellingMotionStyleProfile[] {
  const normalized = normalize(direction)
  if (!normalized) return []
  return STORYTELLING_MOTION_STYLE_PROFILES.filter((item) =>
    [item.displayName, ...item.inputAliases]
      .some((alias) => normalized.includes(normalize(alias))),
  )
}

function affirmativeAliasScore(direction: string, alias: string): number {
  const normalizedAlias = normalize(alias)
  let offset = direction.indexOf(normalizedAlias)
  while (offset >= 0) {
    if (!aliasIsNegated(direction, offset, normalizedAlias.length)) {
      return normalizedAlias.length
    }
    offset = direction.indexOf(normalizedAlias, offset + normalizedAlias.length)
  }
  return 0
}

function aliasIsNegated(direction: string, offset: number, aliasLength: number): boolean {
  const prefix = direction.slice(Math.max(0, offset - 96), offset).trimEnd()
  const suffix = direction.slice(offset + aliasLength, offset + aliasLength + 72).trimStart()
  const explicitAffirmationBefore = /(?:^|\s)(?:do\s+not|don\s+t|dont)\s+stop(?:\s+using)?\s*$/.test(prefix) ||
    /(?:^|\s)(?:use|choose|select|pick|keep|want)\s+no\s+(?:style|direction|look|option)\s+other\s+than\s*$/.test(prefix)
  const explicitAffirmationAfter = /^(?:is|was)\s+no\s+longer\s+(?:rejected|excluded|forbidden|avoided|unwanted|off\s+limits)(?:\s|$)/.test(suffix)
  if (explicitAffirmationBefore || explicitAffirmationAfter) return false
  const negatedBefore = /(?:^|\s)(?:no\s+longer|no|not|never|stop|stopping|avoid|avoiding|without|except|exclude|excluding|reject|rejecting|drop|dropping|remove|removing|anything\s+(?:but|except|other\s+than)|other\s+than|away\s+from|do\s+not|don\s+t|dont)(?:\s+(?:please|more|longer|ever|do|use|using|want|choose|select|pick|make\s+it|go\s+with|anything|something|a|an|the|any|like))*\s*$/.test(prefix)
  const negatedAfter = /^(?:(?:is|was|should|must|can|will|would)\s+(?:not|never|no\s+longer)|isn\s+t|wasn\s+t|excluded|rejected|off\s+limits|no\s+longer)(?:\s|$)/.test(suffix)
  return negatedBefore || negatedAfter
}

function profile(draft: StyleProfileDraft): StorytellingMotionStyleProfile {
  const value = storytellingMotionStyleProfileSchema.parse({
    ...draft,
    contentDigest: sha256CanonicalJson(draft),
  })
  return deepFreeze(value)
}

function language(id: string): MotionLanguageDefinition {
  const result = MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS.find((item) => item.id === id)
  if (!result) throw new Error(`Missing Motion Language required by Storytelling style catalog: ${id}`)
  return result
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
