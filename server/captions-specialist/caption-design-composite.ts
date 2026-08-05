import { z } from 'zod'
import {
  CAPTION_DESIGN_COMPOSITE_ID,
  CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION,
  CAPTION_DESIGN_RELATIONSHIP_VERSION,
  CAPTION_DIRECTION_COMPATIBILITY_ALIAS,
  CAPTION_LEGACY_SKILL_MAPPING_VERSION,
  CAPTION_SCENE_SKILL_ACTIVATION_VERSION,
  NO_CAPTIONS_RESTRAINT_ID,
  type CaptionCreativeSkillNode,
  type CaptionDesignComposite,
  type CaptionLegacySkillMapping,
  type CaptionMiniSkillGroup,
  type CaptionSceneSkillActivation,
  type CaptionSceneSkillActivationInput,
  type CaptionSkillRelationship,
} from '../../src/types/caption-design-composite'
import {
  assertClosedContractTree,
  isClosedContractRecord,
} from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

export const CAPTION_MINI_SKILL_GROUPS: Readonly<
Record<CaptionMiniSkillGroup, readonly string[]>
> = Object.freeze({
  strategy_and_restraint: Object.freeze([
    'caption_role_direction',
    'caption_opportunity_mapping',
    'caption_integration_classification',
    'caption_space_reservation',
    'caption_blocking_preview',
    'caption_approval_envelope',
    'caption_restraint',
  ]),
  language_and_meaning: Object.freeze([
    'caption_transcript_integrity',
    'semantic_phrase_design',
    'caption_line_breaking',
    'caption_rhythm_direction',
    'caption_text_transformation',
    'caption_quote_safety',
    'caption_claim_safety',
  ]),
  visual_design: Object.freeze([
    'caption_visual_hierarchy',
    'multi_style_typography_direction',
    'optical_caption_sizing',
    'semantic_scale_direction',
    'semantic_color_direction',
    'adaptive_caption_legibility',
    'caption_color_management',
  ]),
  spatial_composition: Object.freeze([
    'spatial_sentence_composition',
    'spatial_caption_compositing',
    'typographic_depth_choreography',
    'subject_occluded_typography',
    'object_anchored_typography',
    'environmental_typography',
    'persistent_topic_list_typography',
    'hero_typography_direction',
    'caption_broll_co_composition',
    'caption_camera_coordination',
    'caption_collision_avoidance',
    'occlusion_readability_qa',
  ]),
  motion_and_transformation: Object.freeze([
    'caption_animation',
    'kinetic_type_support',
    'semantic_kinetic_typography',
    'caption_to_visual_bridge',
    'caption_mode_switching',
    'typographic_scene_continuity',
  ]),
  sound: Object.freeze([
    'caption_sound_choreography',
    'caption_sound_restraint',
    'caption_final_mix_handoff',
  ]),
  accessibility_and_language: Object.freeze([
    'caption_speaker_identification',
    'caption_accessibility_planning',
    'reduced_motion_caption_projection',
    'caption_localization',
    'multilingual_caption_layout',
  ]),
  finish_and_qa: Object.freeze([
    'picture_lock_readiness',
    'late_bound_caption_resolution',
    'final_frame_spatial_analysis',
    'multi_format_caption_recomposition',
    'caption_revision_impact_analysis',
    'caption_readability_qa',
    'caption_render_qa',
    'caption_delivery_qa',
  ]),
})

export const CAPTION_MINI_SKILL_IDS = Object.freeze(
  Object.values(CAPTION_MINI_SKILL_GROUPS).flat(),
)

const miniSkillGroupById = new Map<string, CaptionMiniSkillGroup>(
  Object.entries(CAPTION_MINI_SKILL_GROUPS).flatMap(([group, ids]) =>
    ids.map((id) => [id, group as CaptionMiniSkillGroup])),
)

function node(
  skillId: string,
  nodeKind: CaptionCreativeSkillNode['nodeKind'],
  group: CaptionMiniSkillGroup | null,
): CaptionCreativeSkillNode {
  return {
    skillId,
    skillVersion: `${skillId}-v1`,
    nodeKind,
    group,
    displayName: skillId.replaceAll('_', ' '),
    reusable: nodeKind === 'mini_skill',
    selectableAsTopLevelSpecialist: false,
    sceneAwareActivation: nodeKind === 'mini_skill',
    ownsNumericSetting: false,
  }
}

const nodes: CaptionCreativeSkillNode[] = [
  node(CAPTION_DESIGN_COMPOSITE_ID, 'composite', null),
  node(CAPTION_DIRECTION_COMPATIBILITY_ALIAS, 'compatibility_alias', null),
  node(NO_CAPTIONS_RESTRAINT_ID, 'restraint', null),
  ...CAPTION_MINI_SKILL_IDS.map((id) =>
    node(id, 'mini_skill', miniSkillGroupById.get(id) ?? null)),
]

function relationship(
  kind: CaptionSkillRelationship['relationshipKind'],
  sourceSkillId: string,
  targetSkillId: string,
): CaptionSkillRelationship {
  return {
    relationshipId: `${kind}.${sourceSkillId}.${targetSkillId}`,
    relationshipVersion: CAPTION_DESIGN_RELATIONSHIP_VERSION,
    relationshipKind: kind,
    sourceSkillId,
    targetSkillId,
  }
}

const relationships: CaptionSkillRelationship[] = [
  ...CAPTION_MINI_SKILL_IDS.flatMap((id) => [
    relationship('composed_of', CAPTION_DESIGN_COMPOSITE_ID, id),
    relationship('component_of', id, CAPTION_DESIGN_COMPOSITE_ID),
  ]),
  relationship(
    'compatibility_alias_of',
    CAPTION_DIRECTION_COMPATIBILITY_ALIAS,
    CAPTION_DESIGN_COMPOSITE_ID,
  ),
  relationship(
    'conflicts_with',
    CAPTION_DESIGN_COMPOSITE_ID,
    NO_CAPTIONS_RESTRAINT_ID,
  ),
  relationship(
    'conflicts_with',
    NO_CAPTIONS_RESTRAINT_ID,
    CAPTION_DESIGN_COMPOSITE_ID,
  ),
]

function mapping(
  legacySkillId: string,
  componentSkillIds: string[],
): CaptionLegacySkillMapping {
  return {
    mappingVersion: CAPTION_LEGACY_SKILL_MAPPING_VERSION,
    legacySkillId,
    disposition: 'mapped_to_components',
    canonicalSpecialistKey: 'captions',
    compositeSkillId: CAPTION_DESIGN_COMPOSITE_ID,
    restraintSkillId: null,
    componentSkillIds,
    preservesLegacyReadability: true,
    independentPrimaryOwner: false,
  }
}

const legacyMappings: CaptionLegacySkillMapping[] = [
  mapping(CAPTION_DIRECTION_COMPATIBILITY_ALIAS, []),
  mapping('captions.clean_readable_captions', [
    'caption_line_breaking', 'adaptive_caption_legibility',
    'caption_readability_qa',
  ]),
  mapping('captions.speech_aligned_subtitles', [
    'caption_transcript_integrity', 'caption_rhythm_direction',
    'picture_lock_readiness',
  ]),
  mapping('captions.small_premium_subtitles', [
    'caption_visual_hierarchy', 'optical_caption_sizing',
    'adaptive_caption_legibility',
  ]),
  mapping('captions.bold_social_captions', [
    'caption_visual_hierarchy', 'semantic_scale_direction',
    'adaptive_caption_legibility',
  ]),
  mapping('captions.keyword_emphasis', [
    'semantic_phrase_design', 'semantic_color_direction',
    'semantic_kinetic_typography',
  ]),
  mapping('captions.lower_third_labels', [
    'caption_speaker_identification', 'spatial_caption_compositing',
    'caption_collision_avoidance',
  ]),
  mapping('captions.accessibility_review', [
    'caption_accessibility_planning', 'caption_readability_qa',
    'caption_delivery_qa',
  ]),
  mapping('captions.multilingual_placeholder_policy', [
    'caption_localization', 'multilingual_caption_layout',
  ]),
  {
    mappingVersion: CAPTION_LEGACY_SKILL_MAPPING_VERSION,
    legacySkillId: 'captions.no_caption_policy',
    disposition: 'mapped_to_restraint',
    canonicalSpecialistKey: 'captions',
    compositeSkillId: null,
    restraintSkillId: NO_CAPTIONS_RESTRAINT_ID,
    componentSkillIds: ['caption_restraint'],
    preservesLegacyReadability: true,
    independentPrimaryOwner: false,
  },
]

function normalizedCompositionEdges(
  value: CaptionSkillRelationship[],
): Array<[string, string]> {
  const edges = new Map<string, [string, string]>()
  for (const item of value) {
    const edge: [string, string] | null = item.relationshipKind === 'composed_of'
      ? [item.sourceSkillId, item.targetSkillId]
      : item.relationshipKind === 'component_of'
        ? [item.targetSkillId, item.sourceSkillId]
        : null
    if (edge) edges.set(`${edge[0]}\u0000${edge[1]}`, edge)
  }
  return [...edges.values()]
}

function compositionHasCycle(value: CaptionSkillRelationship[]): boolean {
  const graph = new Map<string, string[]>()
  for (const [parent, child] of normalizedCompositionEdges(value)) {
    graph.set(parent, [...(graph.get(parent) ?? []), child])
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const child of graph.get(id) ?? []) {
      if (visit(child)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }
  return [...graph.keys()].some(visit)
}

function validateCompositeRelationships(value: CaptionDesignComposite): string[] {
  const errors: string[] = []
  const nodeIds = new Set(value.nodes.map((item) => item.skillId))
  if (nodeIds.size !== value.nodes.length) errors.push('Duplicate skill node.')
  const relationshipIds = new Set(value.relationships.map((item) => item.relationshipId))
  if (relationshipIds.size !== value.relationships.length) {
    errors.push('Duplicate skill relationship.')
  }
  for (const item of value.relationships) {
    if (!nodeIds.has(item.sourceSkillId) || !nodeIds.has(item.targetSkillId)) {
      errors.push(`Relationship ${item.relationshipId} references an unknown node.`)
    }
  }
  for (const id of CAPTION_MINI_SKILL_IDS) {
    const composed = value.relationships.filter((item) =>
      item.relationshipKind === 'composed_of'
      && item.sourceSkillId === CAPTION_DESIGN_COMPOSITE_ID
      && item.targetSkillId === id)
    const component = value.relationships.filter((item) =>
      item.relationshipKind === 'component_of'
      && item.sourceSkillId === id
      && item.targetSkillId === CAPTION_DESIGN_COMPOSITE_ID)
    if (composed.length !== 1 || component.length !== 1) {
      errors.push(`Mini skill ${id} requires exact inverse relationships.`)
    }
  }
  const conflict = (source: string, target: string) =>
    value.relationships.some((item) => item.relationshipKind === 'conflicts_with'
      && item.sourceSkillId === source && item.targetSkillId === target)
  if (!conflict(CAPTION_DESIGN_COMPOSITE_ID, NO_CAPTIONS_RESTRAINT_ID)
    || !conflict(NO_CAPTIONS_RESTRAINT_ID, CAPTION_DESIGN_COMPOSITE_ID)) {
    errors.push('caption_design and no_captions require a symmetric conflict.')
  }
  if (compositionHasCycle(value.relationships)) {
    errors.push('Caption component graph contains a cycle.')
  }
  const mappingIds = new Set<string>()
  for (const item of value.legacyMappings) {
    if (mappingIds.has(item.legacySkillId)) {
      errors.push(`Duplicate legacy mapping ${item.legacySkillId}.`)
    }
    mappingIds.add(item.legacySkillId)
    if (item.independentPrimaryOwner !== false) {
      errors.push(`Legacy mapping ${item.legacySkillId} retained primary ownership.`)
    }
    for (const id of item.componentSkillIds) {
      if (!CAPTION_MINI_SKILL_IDS.includes(id)) {
        errors.push(`Legacy mapping ${item.legacySkillId} references unknown component ${id}.`)
      }
    }
  }
  return errors
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index])
}

export function parseCaptionDesignComposite(value: unknown): CaptionDesignComposite {
  assertClosedContractTree(value, 'Caption design composite')
  if (!isClosedContractRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'compositeId', 'compositeVersion', 'compositeDigestSha256',
    'specialistKey', 'compatibilityAlias', 'restraintId', 'nodes',
    'relationships', 'legacyMappings', 'directPeerDispatchAllowed', 'cycleFree',
    'conflictValidated',
  ])) throw new Error('Caption design composite has an invalid closed shape.')
  if (value.schemaVersion !== CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION
    || value.compositeId !== CAPTION_DESIGN_COMPOSITE_ID
    || value.specialistKey !== 'captions'
    || value.compatibilityAlias !== CAPTION_DIRECTION_COMPATIBILITY_ALIAS
    || value.restraintId !== NO_CAPTIONS_RESTRAINT_ID
    || value.directPeerDispatchAllowed !== false
    || value.cycleFree !== true
    || value.conflictValidated !== true
    || typeof value.compositeVersion !== 'string'
    || !/^[a-z0-9][a-z0-9._:-]*$/u.test(value.compositeVersion)
    || typeof value.compositeDigestSha256 !== 'string'
    || !/^[a-f0-9]{64}$/u.test(value.compositeDigestSha256)
    || !Array.isArray(value.nodes)
    || !Array.isArray(value.relationships)
    || !Array.isArray(value.legacyMappings)) {
    throw new Error('Caption design composite contains an invalid field.')
  }
  const validGroups = new Set(Object.keys(CAPTION_MINI_SKILL_GROUPS))
  for (const item of value.nodes) {
    if (!isClosedContractRecord(item) || !hasExactKeys(item, [
      'skillId', 'skillVersion', 'nodeKind', 'group', 'displayName', 'reusable',
      'selectableAsTopLevelSpecialist', 'sceneAwareActivation',
      'ownsNumericSetting',
    ]) || typeof item.skillId !== 'string'
      || typeof item.skillVersion !== 'string'
      || typeof item.displayName !== 'string'
      || !['composite', 'mini_skill', 'restraint', 'compatibility_alias']
        .includes(String(item.nodeKind))
      || !(item.group === null || validGroups.has(String(item.group)))
      || typeof item.reusable !== 'boolean'
      || item.selectableAsTopLevelSpecialist !== false
      || typeof item.sceneAwareActivation !== 'boolean'
      || item.ownsNumericSetting !== false) {
      throw new Error('Caption design composite contains an invalid node.')
    }
  }
  for (const item of value.relationships) {
    if (!isClosedContractRecord(item) || !hasExactKeys(item, [
      'relationshipId', 'relationshipVersion', 'relationshipKind',
      'sourceSkillId', 'targetSkillId',
    ]) || item.relationshipVersion !== CAPTION_DESIGN_RELATIONSHIP_VERSION
      || typeof item.relationshipId !== 'string'
      || typeof item.sourceSkillId !== 'string'
      || typeof item.targetSkillId !== 'string'
      || !['composed_of', 'component_of', 'conflicts_with', 'compatibility_alias_of']
        .includes(String(item.relationshipKind))) {
      throw new Error('Caption design composite contains an invalid relationship.')
    }
  }
  for (const item of value.legacyMappings) {
    if (!isClosedContractRecord(item) || !hasExactKeys(item, [
      'mappingVersion', 'legacySkillId', 'disposition', 'canonicalSpecialistKey',
      'compositeSkillId', 'restraintSkillId', 'componentSkillIds',
      'preservesLegacyReadability', 'independentPrimaryOwner',
    ]) || item.mappingVersion !== CAPTION_LEGACY_SKILL_MAPPING_VERSION
      || typeof item.legacySkillId !== 'string'
      || !['mapped_to_components', 'mapped_to_restraint']
        .includes(String(item.disposition))
      || item.canonicalSpecialistKey !== 'captions'
      || !Array.isArray(item.componentSkillIds)
      || item.componentSkillIds.some((id) => typeof id !== 'string')
      || new Set(item.componentSkillIds).size !== item.componentSkillIds.length
      || item.preservesLegacyReadability !== true
      || item.independentPrimaryOwner !== false) {
      throw new Error('Caption design composite contains an invalid legacy mapping.')
    }
    if (item.disposition === 'mapped_to_components'
      && (item.compositeSkillId !== CAPTION_DESIGN_COMPOSITE_ID
        || item.restraintSkillId !== null)) {
      throw new Error('Component legacy mappings must target caption_design only.')
    }
    if (item.disposition === 'mapped_to_restraint'
      && (item.compositeSkillId !== null
        || item.restraintSkillId !== NO_CAPTIONS_RESTRAINT_ID
        || item.componentSkillIds.length !== 1
        || item.componentSkillIds[0] !== 'caption_restraint')) {
      throw new Error('Restraint legacy mapping must target only no_captions.')
    }
  }
  const parsed = value as unknown as CaptionDesignComposite
  const errors = validateCompositeRelationships(parsed)
  if (errors.length > 0) throw new Error(errors.join(' '))
  const expectedDigest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'compositeDigestSha256',
  )
  if (expectedDigest !== parsed.compositeDigestSha256) {
    throw new Error('Caption design composite digest verification failed.')
  }
  return parsed
}

const compositeWithoutDigest: Omit<CaptionDesignComposite, 'compositeDigestSha256'> = {
  schemaVersion: CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION,
  compositeId: CAPTION_DESIGN_COMPOSITE_ID,
  compositeVersion: 'caption-design-composite-contract-v1',
  specialistKey: 'captions',
  compatibilityAlias: CAPTION_DIRECTION_COMPATIBILITY_ALIAS,
  restraintId: NO_CAPTIONS_RESTRAINT_ID,
  nodes,
  relationships,
  legacyMappings,
  directPeerDispatchAllowed: false,
  cycleFree: true,
  conflictValidated: true,
}

export const CAPTION_DESIGN_COMPOSITE = parseCaptionDesignComposite({
  ...compositeWithoutDigest,
  compositeDigestSha256: calculateSkillContractDigest(
    { ...compositeWithoutDigest, compositeDigestSha256: '' },
    'compositeDigestSha256',
  ),
})

const safeKey = z.string().min(1).max(180)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const activationInputSchema: z.ZodType<CaptionSceneSkillActivationInput> = z.object({
  sceneId: safeKey,
  sceneDigestSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  captionPolicy: z.enum(['captions', NO_CAPTIONS_RESTRAINT_ID]),
  integrationClasses: z.array(z.enum([
    'clean_phrase', 'active_word', 'semantic_kinetic', 'spatial_composite',
    'subject_occluded', 'object_anchored', 'environmental', 'persistent_topic',
    'hero', 'caption_to_visual',
  ])).max(10),
  requestedLegacySkillIds: z.array(safeKey).max(32),
  features: z.object({
    multiSpeaker: z.boolean(),
    brollCoComposition: z.boolean(),
    cameraCoordination: z.boolean(),
    soundChoreography: z.boolean(),
    multilingual: z.boolean(),
    reducedMotion: z.boolean(),
    claimSensitive: z.boolean(),
    quoteSensitive: z.boolean(),
    needsRevisionAnalysis: z.boolean(),
  }).strict(),
}).strict().superRefine((input, context) => {
  if (new Set(input.integrationClasses).size !== input.integrationClasses.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate integration class.' })
  }
  if (new Set(input.requestedLegacySkillIds).size !== input.requestedLegacySkillIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate legacy skill request.' })
  }
})

const baselineComponents = [
  'caption_role_direction', 'caption_opportunity_mapping',
  'caption_integration_classification', 'caption_space_reservation',
  'caption_transcript_integrity', 'caption_line_breaking',
  'caption_rhythm_direction', 'caption_visual_hierarchy',
  'optical_caption_sizing', 'adaptive_caption_legibility',
  'caption_collision_avoidance', 'caption_accessibility_planning',
  'picture_lock_readiness', 'late_bound_caption_resolution',
  'caption_readability_qa', 'caption_render_qa', 'caption_delivery_qa',
]

const integrationComponents: Record<string, string[]> = {
  clean_phrase: [],
  active_word: ['semantic_phrase_design', 'semantic_color_direction', 'caption_animation'],
  semantic_kinetic: ['semantic_phrase_design', 'semantic_scale_direction', 'semantic_kinetic_typography'],
  spatial_composite: ['spatial_sentence_composition', 'spatial_caption_compositing'],
  subject_occluded: ['typographic_depth_choreography', 'subject_occluded_typography', 'occlusion_readability_qa'],
  object_anchored: ['object_anchored_typography', 'typographic_depth_choreography'],
  environmental: ['environmental_typography', 'typographic_depth_choreography'],
  persistent_topic: ['persistent_topic_list_typography', 'typographic_scene_continuity'],
  hero: ['hero_typography_direction', 'multi_style_typography_direction'],
  caption_to_visual: ['caption_to_visual_bridge', 'caption_mode_switching'],
}

function addAll(target: Set<string>, values: readonly string[]): void {
  for (const value of values) target.add(value)
}

export function activateCaptionMiniSkillsForScene(
  value: unknown,
): CaptionSceneSkillActivation {
  assertClosedContractTree(value, 'Caption scene skill activation input')
  const input = activationInputSchema.parse(value)
  const knownMappings = new Map(
    CAPTION_DESIGN_COMPOSITE.legacyMappings.map((item) => [item.legacySkillId, item]),
  )
  const mappings = input.requestedLegacySkillIds.map((id) => {
    const item = knownMappings.get(id)
    if (!item) throw new Error(`Unknown legacy Caption skill ${id}.`)
    return item
  })
  const requestedRestraint = input.captionPolicy === NO_CAPTIONS_RESTRAINT_ID
    || mappings.some((item) => item.disposition === 'mapped_to_restraint')
  const requestedComposite = input.captionPolicy === 'captions'
    || mappings.some((item) => item.disposition === 'mapped_to_components')
  if (requestedRestraint && requestedComposite) {
    throw new Error('caption_design conflicts with no_captions for the same scene.')
  }

  const active = new Set<string>()
  const reasonCodes: string[] = []
  if (requestedRestraint) {
    active.add('caption_restraint')
    reasonCodes.push('explicit.no_captions.restraint')
  } else {
    addAll(active, baselineComponents)
    for (const integrationClass of input.integrationClasses) {
      addAll(active, integrationComponents[integrationClass] ?? [])
      reasonCodes.push(`integration.${integrationClass}`)
    }
    for (const item of mappings) addAll(active, item.componentSkillIds)
    if (input.features.multiSpeaker) active.add('caption_speaker_identification')
    if (input.features.brollCoComposition) active.add('caption_broll_co_composition')
    if (input.features.cameraCoordination) active.add('caption_camera_coordination')
    if (input.features.soundChoreography) {
      addAll(active, ['caption_sound_choreography', 'caption_final_mix_handoff'])
    } else active.add('caption_sound_restraint')
    if (input.features.multilingual) {
      addAll(active, ['caption_localization', 'multilingual_caption_layout'])
    }
    if (input.features.reducedMotion) active.add('reduced_motion_caption_projection')
    if (input.features.claimSensitive) active.add('caption_claim_safety')
    if (input.features.quoteSensitive) active.add('caption_quote_safety')
    if (input.features.needsRevisionAnalysis) {
      active.add('caption_revision_impact_analysis')
    }
  }
  const activeComponentSkillIds = CAPTION_MINI_SKILL_IDS.filter((id) => active.has(id))
  const skippedComponentSkillIds = CAPTION_MINI_SKILL_IDS.filter((id) => !active.has(id))
  const activationWithoutDigest: Omit<
    CaptionSceneSkillActivation,
    'activationDigestSha256'
  > = {
    schemaVersion: CAPTION_SCENE_SKILL_ACTIVATION_VERSION,
    activationId: `caption.activation.${input.sceneId}`,
    sceneId: input.sceneId,
    sceneDigestSha256: input.sceneDigestSha256,
    compositeId: CAPTION_DESIGN_COMPOSITE_ID,
    compositeDigestSha256: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
    compositeActive: !requestedRestraint,
    restraintId: requestedRestraint ? NO_CAPTIONS_RESTRAINT_ID : null,
    activeComponentSkillIds,
    skippedComponentSkillIds,
    appliedLegacyMappingIds: mappings.map((item) => item.legacySkillId),
    reasonCodes: requestedRestraint
      ? reasonCodes
      : ['caption_design.scene_activation', ...reasonCodes],
    sceneAwareSelection: true,
    directPeerDispatchCreated: false,
  }
  return {
    ...activationWithoutDigest,
    activationDigestSha256: calculateSkillContractDigest(
      { ...activationWithoutDigest, activationDigestSha256: '' },
      'activationDigestSha256',
    ),
  }
}

export function assertCaptionSceneSkillActivation(
  value: unknown,
): CaptionSceneSkillActivation {
  assertClosedContractTree(value, 'Caption scene skill activation')
  if (!isClosedContractRecord(value) || !hasExactKeys(value, [
    'schemaVersion', 'activationId', 'activationDigestSha256', 'sceneId',
    'sceneDigestSha256', 'compositeId', 'compositeDigestSha256',
    'compositeActive', 'restraintId', 'activeComponentSkillIds',
    'skippedComponentSkillIds', 'appliedLegacyMappingIds', 'reasonCodes',
    'sceneAwareSelection', 'directPeerDispatchCreated',
  ])) throw new Error('Caption activation must be a closed record.')
  const parsed = value as unknown as CaptionSceneSkillActivation
  const allComponentIds = [
    ...parsed.activeComponentSkillIds,
    ...parsed.skippedComponentSkillIds,
  ]
  if (parsed.schemaVersion !== CAPTION_SCENE_SKILL_ACTIVATION_VERSION
    || parsed.compositeId !== CAPTION_DESIGN_COMPOSITE_ID
    || parsed.compositeDigestSha256 !== CAPTION_DESIGN_COMPOSITE.compositeDigestSha256
    || parsed.sceneAwareSelection !== true
    || parsed.directPeerDispatchCreated !== false
    || !Array.isArray(parsed.activeComponentSkillIds)
    || !Array.isArray(parsed.skippedComponentSkillIds)
    || !Array.isArray(parsed.appliedLegacyMappingIds)
    || !Array.isArray(parsed.reasonCodes)
    || parsed.activeComponentSkillIds.some((id) => !CAPTION_MINI_SKILL_IDS.includes(id))
    || parsed.skippedComponentSkillIds.some((id) => !CAPTION_MINI_SKILL_IDS.includes(id))
    || allComponentIds.length !== CAPTION_MINI_SKILL_IDS.length
    || new Set(allComponentIds).size !== CAPTION_MINI_SKILL_IDS.length
    || typeof parsed.compositeActive !== 'boolean'
    || (parsed.compositeActive
      ? parsed.restraintId !== null
        || parsed.activeComponentSkillIds.includes('caption_restraint')
      : parsed.restraintId !== NO_CAPTIONS_RESTRAINT_ID
        || parsed.activeComponentSkillIds.length !== 1
        || parsed.activeComponentSkillIds[0] !== 'caption_restraint')) {
    throw new Error('Caption scene activation is invalid or incomplete.')
  }
  const expected = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'activationDigestSha256',
  )
  if (expected !== parsed.activationDigestSha256) {
    throw new Error('Caption scene activation digest verification failed.')
  }
  return parsed
}
