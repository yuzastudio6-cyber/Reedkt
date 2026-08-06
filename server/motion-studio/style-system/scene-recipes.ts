import type {
  MotionLanguageReference,
  NarrativeFunctionReference,
  ProductionMode,
  SceneRecipe,
  StorytellingMotionStyleProfileReference,
  StorytellingMotionStyleRecipeFamily,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS,
  MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS,
  motionLanguageReference,
  motionStudioSceneRecipeSchema,
  narrativeFunctionReference,
  type MotionStudioNarrativeFunctionId,
} from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { MOTION_STUDIO_SCENE_COMPILER_VERSION } from '../scenes/compiler'
import {
  getStorytellingMotionStyleProfile,
  storytellingMotionStyleProfileReference,
} from './catalog'

type SceneRecipeDraft = Omit<SceneRecipe, 'definitionDigest'>

const editorialLanguage = language('motion_language.editorial_collage_documentary')
const cinematicLanguage = language('motion_language.cinematic_historical_documentary')
const paperLanguage = language('motion_language.cinematic_paper_diorama_documentary')
const blueprintLanguage = language('motion_language.technical_blueprint_documentary')

/**
 * Versioned system Scene Recipes. These bind reusable construction semantics to
 * existing professional skills and capability IDs. They are not a second tool
 * registry and contain no provider route or executable arbitrary code.
 */
export const STORYTELLING_SCENE_RECIPE_CATALOG: Readonly<
Record<StorytellingMotionStyleRecipeFamily, SceneRecipe>
> = deepFreeze({
  editorial_archive_reveal: recipe({
    id: 'scene-recipe-storytelling-editorial_archive_reveal',
    definitionVersion: '1.0.0',
    name: 'Editorial archive reveal',
    scope: 'system',
    compatibleProductionModes: ['hybrid_directed', 'layered_first', 'footage_first'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'reference_contract', 'claim_ledger',
    ],
    outputArtifactKinds: ['layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'graphics.evidence_board',
      'graphics.evidence_annotation',
      'motion.controlled_2d_motion',
      'motion.transition_language',
    ],
    toolCapabilityIds: [
      'motion.compose_image_layer',
      'motion.compose_existing_mask',
      'remotion.precise_typography',
      'remotion.deterministic_effect',
    ],
    qualityGateIds: [
      'fact_safety', 'claim_source_trace', 'source_truth_preserved',
      'safe_zone_preserved', 'text_readability',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'stage',
    costClass: 'low',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(editorialLanguage, paperLanguage),
    compatibleNarrativeFunctions: narratives(
      'narrative_function.establish_context',
      'narrative_function.establish_time',
      'narrative_function.show_change_over_time',
      'narrative_function.compare',
      'narrative_function.reveal_evidence',
      'narrative_function.present_quote',
      'narrative_function.transition_chapter',
    ),
    immutable: true,
  }),
  native_evidence_graphic: recipe({
    id: 'scene-recipe-storytelling-native_evidence_graphic',
    definitionVersion: '1.0.0',
    name: 'Native evidence graphic',
    scope: 'system',
    compatibleProductionModes: ['native_graphics_first', 'hybrid_directed', 'layered_first'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'claim_ledger', 'master_timing_plan',
    ],
    outputArtifactKinds: ['layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'graphics.visual_explain_layer',
      'graphics.chart_or_data_visual',
      'graphics.map_route_visual',
      'motion.frame_layout_animation',
    ],
    toolCapabilityIds: [
      'remotion.precise_typography',
      'remotion.map_scene',
      'remotion.chart_scene',
      'remotion.caption_layer',
    ],
    qualityGateIds: [
      'source_truth_preserved', 'chart_not_misleading', 'map_label_accuracy',
      'data_label_readability', 'caption_collision', 'safe_zone_preserved',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'stage',
    costClass: 'no_incremental_provider_cost',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(
      editorialLanguage, cinematicLanguage, paperLanguage, blueprintLanguage,
    ),
    compatibleNarrativeFunctions: narratives(
      'narrative_function.establish_location',
      'narrative_function.establish_time',
      'narrative_function.explain_process',
      'narrative_function.explain_cause_and_effect',
      'narrative_function.show_change_over_time',
      'narrative_function.compare',
      'narrative_function.quantify',
      'narrative_function.reveal_evidence',
      'narrative_function.summarize',
    ),
    immutable: true,
  }),
  layered_paper_depth: recipe({
    id: 'scene-recipe-storytelling-layered_paper_depth',
    definitionVersion: '1.0.0',
    name: 'Layered paper depth',
    scope: 'system',
    compatibleProductionModes: ['layered_first', 'hybrid_directed'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'motion_dna', 'reference_contract',
    ],
    outputArtifactKinds: ['layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'motion.controlled_2d_motion',
      'motion.controlled_3d_layer',
      'motion.frame_layout_animation',
      'motion.transition_language',
    ],
    toolCapabilityIds: [
      'motion.compose_image_layer',
      'motion.compose_existing_mask',
      'remotion.deterministic_effect',
      'remotion.precise_typography',
    ],
    qualityGateIds: [
      'motion_supports_story', 'no_random_animation', 'safe_zone_preserved',
      'text_readability', 'reconstruction_disclosure',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'stage',
    costClass: 'medium',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(paperLanguage),
    compatibleNarrativeFunctions: narratives(
      'narrative_function.establish_context',
      'narrative_function.introduce_person',
      'narrative_function.introduce_object_or_product',
      'narrative_function.establish_time',
      'narrative_function.explain_cause_and_effect',
      'narrative_function.build_tension',
      'narrative_function.show_consequence',
      'narrative_function.transition_chapter',
    ),
    immutable: true,
  }),
  cinematic_reconstruction: recipe({
    id: 'scene-recipe-storytelling-cinematic_reconstruction',
    definitionVersion: '1.0.0',
    name: 'Cinematic reconstruction',
    scope: 'system',
    compatibleProductionModes: ['generative_first', 'hybrid_directed', 'layered_first'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'claim_ledger', 'reference_contract', 'character_anchor_pack',
      'project_video_routing_profile',
    ],
    outputArtifactKinds: ['private_generated_media_candidate', 'layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'motion.controlled_2d_motion',
      'motion.frame_layout_animation',
      'motion.renderer_layer_brief',
    ],
    toolCapabilityIds: [
      'motion.compose_generated_video_asset',
      'motion.compose_image_layer',
      'remotion.deterministic_effect',
      'remotion.precise_typography',
    ],
    qualityGateIds: [
      'fact_safety', 'character_continuity', 'reconstruction_disclosure',
      'first_last_frame_continuity', 'safe_zone_preserved',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'expensive_work',
    costClass: 'high',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(cinematicLanguage, paperLanguage),
    compatibleNarrativeFunctions: narratives(
      'narrative_function.establish_context',
      'narrative_function.establish_location',
      'narrative_function.introduce_person',
      'narrative_function.establish_time',
      'narrative_function.build_tension',
      'narrative_function.create_emotional_pause',
      'narrative_function.show_consequence',
    ),
    immutable: true,
  }),
  footage_evidence: recipe({
    id: 'scene-recipe-storytelling-footage_evidence',
    definitionVersion: '1.0.0',
    name: 'Footage evidence',
    scope: 'system',
    compatibleProductionModes: ['footage_first', 'hybrid_directed'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'claim_ledger', 'private_media_asset',
    ],
    outputArtifactKinds: ['layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'graphics.evidence_annotation',
      'graphics.callout_labels',
      'motion.transition_language',
      'motion.frame_layout_animation',
    ],
    toolCapabilityIds: [
      'timeline.compose_source_footage',
      'remotion.precise_typography',
      'remotion.caption_layer',
      'remotion.deterministic_effect',
    ],
    qualityGateIds: [
      'source_truth_preserved', 'claim_source_trace', 'meaning_preserved',
      'caption_collision', 'safe_zone_preserved',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'stage',
    costClass: 'no_incremental_provider_cost',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(editorialLanguage, cinematicLanguage),
    compatibleNarrativeFunctions: narratives(
      'narrative_function.establish_context',
      'narrative_function.establish_location',
      'narrative_function.introduce_person',
      'narrative_function.reveal_evidence',
      'narrative_function.present_quote',
      'narrative_function.show_consequence',
      'narrative_function.resolve_or_conclude',
    ),
    immutable: true,
  }),
  hybrid_documentary: recipe({
    id: 'scene-recipe-storytelling-hybrid_documentary',
    definitionVersion: '1.0.0',
    name: 'Hybrid documentary',
    scope: 'system',
    compatibleProductionModes: ['hybrid_directed'],
    requiredInputArtifactKinds: [
      'scene_document', 'layer_plan', 'motion_language', 'narrative_function',
      'motion_dna', 'claim_ledger', 'reference_contract',
    ],
    outputArtifactKinds: ['layer_plan', 'timeline_proposal'],
    professionalSkillIds: [
      'graphics.visual_explain_layer',
      'graphics.evidence_annotation',
      'motion.controlled_2d_motion',
      'motion.frame_layout_animation',
      'motion.renderer_layer_brief',
    ],
    toolCapabilityIds: [
      'timeline.compose_source_footage',
      'motion.compose_image_layer',
      'motion.compose_generated_video_asset',
      'remotion.precise_typography',
      'remotion.deterministic_effect',
    ],
    qualityGateIds: [
      'fact_safety', 'source_truth_preserved', 'motion_supports_story',
      'character_continuity', 'caption_collision', 'safe_zone_preserved',
    ],
    fallbackPolicyIds: ['request_user_review'],
    approvalClass: 'expensive_work',
    costClass: 'high',
    compilerVersion: MOTION_STUDIO_SCENE_COMPILER_VERSION,
    arbitraryCodeAllowed: false,
    brollWorkflowEmbedded: false,
    compatibleMotionLanguages: references(
      editorialLanguage, cinematicLanguage, paperLanguage, blueprintLanguage,
    ),
    compatibleNarrativeFunctions: MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS.map(
      narrativeFunctionReference,
    ),
    immutable: true,
  }),
})

export interface StorytellingSceneRecipeCompatibilityQuery {
  styleProfile: StorytellingMotionStyleProfileReference
  motionLanguage: MotionLanguageReference
  narrativeFunction: NarrativeFunctionReference
  productionMode: ProductionMode
}

/** Returns compatible options for Director/user review; it never selects one. */
export function listCompatibleStorytellingSceneRecipes(
  input: StorytellingSceneRecipeCompatibilityQuery,
): readonly SceneRecipe[] {
  const profile = getStorytellingMotionStyleProfile(input.styleProfile.styleProfileId)
  assertExactStyleProfileReference(input.styleProfile, profile)
  if (!sameMotionLanguage(input.motionLanguage, profile.motionLanguage)) {
    throw new Error('Scene Recipe compatibility requires the exact selected style Motion Language.')
  }
  return profile.recipeFamilies
    .map((family) => STORYTELLING_SCENE_RECIPE_CATALOG[family])
    .filter((candidate) =>
      candidate.compatibleProductionModes.includes(input.productionMode) &&
      candidate.compatibleMotionLanguages.some((reference) => sameMotionLanguage(reference, input.motionLanguage)) &&
      candidate.compatibleNarrativeFunctions.some((reference) => sameNarrativeFunction(reference, input.narrativeFunction)))
}

export function resolveStorytellingSceneRecipe(
  input: StorytellingSceneRecipeCompatibilityQuery & {
    recipeFamily: StorytellingMotionStyleRecipeFamily
  },
): SceneRecipe {
  const compatible = listCompatibleStorytellingSceneRecipes(input)
  const expected = STORYTELLING_SCENE_RECIPE_CATALOG[input.recipeFamily]
  if (!compatible.some((candidate) => candidate.id === expected.id)) {
    throw new Error('Selected Scene Recipe is incompatible with the exact style, Motion Language, Narrative Function, or Production Mode.')
  }
  return expected
}

export function verifyStorytellingSceneRecipeDigest(value: SceneRecipe): boolean {
  const base = { ...value }
  delete (base as Partial<SceneRecipe>).definitionDigest
  return sha256CanonicalJson(base) === value.definitionDigest
}

function recipe(draft: SceneRecipeDraft): SceneRecipe {
  const value = motionStudioSceneRecipeSchema.parse({
    ...draft,
    definitionDigest: sha256CanonicalJson(draft),
  })
  return deepFreeze(value)
}

function language(id: string) {
  const result = MOTION_STUDIO_MOTION_LANGUAGE_DEFINITIONS.find((candidate) => candidate.id === id)
  if (!result) throw new Error(`Missing Motion Language for Storytelling Scene Recipe: ${id}`)
  return result
}

function references(...definitions: Parameters<typeof motionLanguageReference>[0][]) {
  return definitions.map(motionLanguageReference)
}

function narratives(...ids: MotionStudioNarrativeFunctionId[]) {
  return ids.map((id) => {
    const definition = MOTION_STUDIO_NARRATIVE_FUNCTION_DEFINITIONS.find((candidate) => candidate.id === id)
    if (!definition) throw new Error(`Missing Narrative Function for Storytelling Scene Recipe: ${id}`)
    return narrativeFunctionReference(definition)
  })
}

function assertExactStyleProfileReference(
  reference: StorytellingMotionStyleProfileReference,
  profile: ReturnType<typeof getStorytellingMotionStyleProfile>,
): void {
  if (sha256CanonicalJson(reference) !== sha256CanonicalJson(storytellingMotionStyleProfileReference(profile))) {
    throw new Error('Scene Recipe compatibility received a stale Storytelling style profile reference.')
  }
}

function sameMotionLanguage(left: MotionLanguageReference, right: MotionLanguageReference): boolean {
  return left.motionLanguageId === right.motionLanguageId &&
    left.motionLanguageVersion === right.motionLanguageVersion &&
    left.motionLanguageDigest === right.motionLanguageDigest
}

function sameNarrativeFunction(left: NarrativeFunctionReference, right: NarrativeFunctionReference): boolean {
  return left.narrativeFunctionId === right.narrativeFunctionId &&
    left.narrativeFunctionVersion === right.narrativeFunctionVersion &&
    left.narrativeFunctionDigest === right.narrativeFunctionDigest
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}
