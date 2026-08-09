import assert from 'node:assert/strict'
import {
  CAPTION_DESIGN_COMPOSITE_ID,
  CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION,
  CAPTION_DIRECTION_COMPATIBILITY_ALIAS,
  NO_CAPTIONS_RESTRAINT_ID,
  type CaptionDesignComposite,
} from '../../src/types/caption-design-composite'
import {
  getProfessionalSkillDefinition,
  listProfessionalSkillDefinitions,
} from '../../src/lib/professional-skills/professional-skill-registry'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_DESIGN_COMPOSITE,
  CAPTION_MINI_SKILL_GROUPS,
  CAPTION_MINI_SKILL_IDS,
  activateCaptionMiniSkillsForScene,
  assertCaptionSceneSkillActivation,
  parseCaptionDesignComposite,
} from '../captions-specialist/caption-design-composite'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}

function redigestComposite(value: CaptionDesignComposite): CaptionDesignComposite {
  const candidate = structuredClone(value)
  candidate.compositeDigestSha256 = calculateSkillContractDigest(
    candidate as unknown as Record<string, unknown>,
    'compositeDigestSha256',
  )
  return candidate
}

function activationInput(overrides: Record<string, unknown> = {}) {
  return {
    sceneId: 'scene.cap02',
    sceneDigestSha256: 'a'.repeat(64),
    captionPolicy: 'captions',
    integrationClasses: ['clean_phrase'],
    requestedLegacySkillIds: [],
    features: {
      multiSpeaker: false,
      brollCoComposition: false,
      cameraCoordination: false,
      soundChoreography: false,
      multilingual: false,
      reducedMotion: false,
      claimSensitive: false,
      quoteSensitive: false,
      needsRevisionAnalysis: false,
    },
    ...overrides,
  }
}

check(
  CAPTION_DESIGN_COMPOSITE.schemaVersion
    === CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION,
  'Composite schema must be exact.',
)
check(
  CAPTION_DESIGN_COMPOSITE.compositeId === CAPTION_DESIGN_COMPOSITE_ID,
  'Internal composite identity must be caption_design.',
)
check(CAPTION_MINI_SKILL_IDS.length === 55, 'All 55 required mini skills must exist.')
check(
  Object.values(CAPTION_MINI_SKILL_GROUPS).every((group) => group.length > 0),
  'Every required mini-skill group must be populated.',
)
check(
  new Set(CAPTION_MINI_SKILL_IDS).size === CAPTION_MINI_SKILL_IDS.length,
  'Mini-skill identities must be unique.',
)
check(
  CAPTION_DESIGN_COMPOSITE.nodes.length === CAPTION_MINI_SKILL_IDS.length + 3,
  'Composite, alias, restraint, and every mini skill must be represented.',
)
check(
  CAPTION_DESIGN_COMPOSITE.nodes.every(
    (node) => !node.selectableAsTopLevelSpecialist && !node.ownsNumericSetting,
  ),
  'No mini skill or numeric setting may become a top-level specialist.',
)
check(
  CAPTION_DESIGN_COMPOSITE.relationships.filter(
    (item) => item.relationshipKind === 'composed_of',
  ).length === CAPTION_MINI_SKILL_IDS.length,
  'Every mini skill needs one composed_of relationship.',
)
check(
  CAPTION_DESIGN_COMPOSITE.relationships.filter(
    (item) => item.relationshipKind === 'component_of',
  ).length === CAPTION_MINI_SKILL_IDS.length,
  'Every mini skill needs one component_of relationship.',
)
check(
  CAPTION_DESIGN_COMPOSITE.relationships.some((item) =>
    item.relationshipKind === 'compatibility_alias_of'
    && item.sourceSkillId === CAPTION_DIRECTION_COMPATIBILITY_ALIAS
    && item.targetSkillId === CAPTION_DESIGN_COMPOSITE_ID),
  'caption_direction must remain a compatibility alias.',
)
check(
  CAPTION_DESIGN_COMPOSITE.relationships.filter((item) =>
    item.relationshipKind === 'conflicts_with'
    && [CAPTION_DESIGN_COMPOSITE_ID, NO_CAPTIONS_RESTRAINT_ID]
      .includes(item.sourceSkillId as typeof CAPTION_DESIGN_COMPOSITE_ID))
    .length === 2,
  'caption_design and no_captions must conflict symmetrically.',
)
check(
  CAPTION_DESIGN_COMPOSITE.legacyMappings.every(
    (mapping) => mapping.preservesLegacyReadability
      && !mapping.independentPrimaryOwner,
  ),
  'Legacy definitions must remain readable without retaining primary ownership.',
)

const committedCaptionDefinitions = listProfessionalSkillDefinitions()
  .filter((definition) => definition.family === 'captions')
check(committedCaptionDefinitions.length === 9, 'Committed Caption legacy set changed unexpectedly.')
check(
  committedCaptionDefinitions.every((definition) =>
    CAPTION_DESIGN_COMPOSITE.legacyMappings.some(
      (mapping) => mapping.legacySkillId === definition.id,
    )),
  'Every committed Caption definition must have a compatibility mapping.',
)
check(
  getProfessionalSkillDefinition('captions.no_caption_policy') !== undefined,
  'Legacy no-caption definition must remain readable before CAP-03 migration.',
)

const clean = assertCaptionSceneSkillActivation(
  activateCaptionMiniSkillsForScene(activationInput()),
)
check(clean.compositeActive && clean.restraintId === null, 'Clean scene must activate composite.')
check(
  clean.activeComponentSkillIds.length < CAPTION_MINI_SKILL_IDS.length,
  'Scene activation must select only needed mini skills.',
)
check(
  clean.activeComponentSkillIds.includes('adaptive_caption_legibility')
    && !clean.activeComponentSkillIds.includes('subject_occluded_typography'),
  'Clean captions need legibility but not unused masking work.',
)
check(
  clean.activeComponentSkillIds.includes('caption_sound_restraint')
    && !clean.activeComponentSkillIds.includes('caption_sound_choreography'),
  'Sound restraint must be selected when sound choreography is not requested.',
)

const advanced = assertCaptionSceneSkillActivation(
  activateCaptionMiniSkillsForScene(activationInput({
    integrationClasses: [
      'active_word', 'subject_occluded', 'hero', 'caption_to_visual',
    ],
    requestedLegacySkillIds: ['captions.keyword_emphasis'],
    features: {
      multiSpeaker: true,
      brollCoComposition: true,
      cameraCoordination: true,
      soundChoreography: true,
      multilingual: true,
      reducedMotion: true,
      claimSensitive: true,
      quoteSensitive: true,
      needsRevisionAnalysis: true,
    },
  })),
)
check(
  ['subject_occluded_typography', 'hero_typography_direction',
    'caption_to_visual_bridge', 'caption_broll_co_composition',
    'caption_camera_coordination', 'caption_sound_choreography',
    'multilingual_caption_layout', 'reduced_motion_caption_projection',
    'caption_claim_safety', 'caption_quote_safety',
    'caption_revision_impact_analysis'].every((id) =>
    advanced.activeComponentSkillIds.includes(id)),
  'Advanced scene signals must activate their exact mini skills.',
)
check(
  advanced.appliedLegacyMappingIds.includes('captions.keyword_emphasis'),
  'Legacy selection must be recorded in scene activation lineage.',
)

const restrained = assertCaptionSceneSkillActivation(
  activateCaptionMiniSkillsForScene(activationInput({
    captionPolicy: NO_CAPTIONS_RESTRAINT_ID,
    integrationClasses: [],
  })),
)
check(!restrained.compositeActive, 'no_captions must disable the composite.')
check(
  restrained.restraintId === NO_CAPTIONS_RESTRAINT_ID
    && restrained.activeComponentSkillIds.length === 1
    && restrained.activeComponentSkillIds[0] === 'caption_restraint',
  'no_captions must activate only the explicit restraint component.',
)

expectThrow(() => activateCaptionMiniSkillsForScene(activationInput({
  requestedLegacySkillIds: ['captions.no_caption_policy'],
})))
expectThrow(() => activateCaptionMiniSkillsForScene(activationInput({
  requestedLegacySkillIds: ['captions.unknown_legacy'],
})))
expectThrow(() => activateCaptionMiniSkillsForScene(activationInput({
  integrationClasses: ['hero', 'hero'],
})))

const cyclic = structuredClone(CAPTION_DESIGN_COMPOSITE)
cyclic.relationships.push({
  relationshipId: 'composed_of.caption_role_direction.caption_design',
  relationshipVersion: 'caption-design-relationship-v1',
  relationshipKind: 'composed_of',
  sourceSkillId: 'caption_role_direction',
  targetSkillId: CAPTION_DESIGN_COMPOSITE_ID,
})
expectThrow(() => parseCaptionDesignComposite(redigestComposite(cyclic)))

const missingInverse = structuredClone(CAPTION_DESIGN_COMPOSITE)
missingInverse.relationships = missingInverse.relationships.filter((item) =>
  !(item.relationshipKind === 'component_of'
    && item.sourceSkillId === 'caption_role_direction'))
expectThrow(() => parseCaptionDesignComposite(redigestComposite(missingInverse)))

const asymmetricConflict = structuredClone(CAPTION_DESIGN_COMPOSITE)
asymmetricConflict.relationships = asymmetricConflict.relationships.filter((item) =>
  !(item.relationshipKind === 'conflicts_with'
    && item.sourceSkillId === NO_CAPTIONS_RESTRAINT_ID))
expectThrow(() => parseCaptionDesignComposite(redigestComposite(asymmetricConflict)))

const duplicateMapping = structuredClone(CAPTION_DESIGN_COMPOSITE)
duplicateMapping.legacyMappings.push(structuredClone(duplicateMapping.legacyMappings[0]))
expectThrow(() => parseCaptionDesignComposite(redigestComposite(duplicateMapping)))

const unknownMappedComponent = structuredClone(CAPTION_DESIGN_COMPOSITE)
unknownMappedComponent.legacyMappings[0].componentSkillIds = ['font_size_72']
expectThrow(() => parseCaptionDesignComposite(redigestComposite(unknownMappedComponent)))

const unknownNestedField = structuredClone(CAPTION_DESIGN_COMPOSITE) as unknown as Record<string, unknown>
;(unknownNestedField.nodes as Array<Record<string, unknown>>)[0].hiddenOwner = true
expectThrow(() => parseCaptionDesignComposite(unknownNestedField))

const tampered = structuredClone(CAPTION_DESIGN_COMPOSITE)
tampered.compositeDigestSha256 = 'f'.repeat(64)
expectThrow(() => parseCaptionDesignComposite(tampered))

const inherited = Object.create({ hiddenOwner: true })
Object.assign(inherited, CAPTION_DESIGN_COMPOSITE)
expectThrow(() => parseCaptionDesignComposite(inherited))

const activationWithUnknown = {
  ...structuredClone(clean),
  hiddenOwner: true,
}
expectThrow(() => assertCaptionSceneSkillActivation(activationWithUnknown))

const overlappingActivation = structuredClone(clean)
overlappingActivation.skippedComponentSkillIds[0]
  = overlappingActivation.activeComponentSkillIds[0]
overlappingActivation.activationDigestSha256 = calculateSkillContractDigest(
  overlappingActivation as unknown as Record<string, unknown>,
  'activationDigestSha256',
)
expectThrow(() => assertCaptionSceneSkillActivation(overlappingActivation))

check(
  calculateSkillContractDigest(
    CAPTION_DESIGN_COMPOSITE as unknown as Record<string, unknown>,
    'compositeDigestSha256',
  ) === CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
  'Composite digest must recompute exactly.',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-02',
  compositeId: CAPTION_DESIGN_COMPOSITE_ID,
  miniSkillCount: CAPTION_MINI_SKILL_IDS.length,
  legacyMappingCount: CAPTION_DESIGN_COMPOSITE.legacyMappings.length,
  assertions,
  registryMutated: false,
  directPeerDispatchCreated: false,
  runtimeStarted: false,
  authorityPromoted: false,
}, null, 2)}\n`)
