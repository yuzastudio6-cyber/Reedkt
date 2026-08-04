export const CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION =
  'caption-design-composite-v1' as const
export const CAPTION_DESIGN_RELATIONSHIP_VERSION =
  'caption-design-relationship-v1' as const
export const CAPTION_LEGACY_SKILL_MAPPING_VERSION =
  'caption-legacy-skill-mapping-v1' as const
export const CAPTION_SCENE_SKILL_ACTIVATION_VERSION =
  'caption-scene-skill-activation-v1' as const

export const CAPTION_DESIGN_COMPOSITE_ID = 'caption_design' as const
export const CAPTION_DIRECTION_COMPATIBILITY_ALIAS = 'caption_direction' as const
export const NO_CAPTIONS_RESTRAINT_ID = 'no_captions' as const

export type CaptionMiniSkillGroup =
  | 'strategy_and_restraint'
  | 'language_and_meaning'
  | 'visual_design'
  | 'spatial_composition'
  | 'motion_and_transformation'
  | 'sound'
  | 'accessibility_and_language'
  | 'finish_and_qa'

export interface CaptionCreativeSkillNode {
  skillId: string
  skillVersion: string
  nodeKind: 'composite' | 'mini_skill' | 'restraint' | 'compatibility_alias'
  group: CaptionMiniSkillGroup | null
  displayName: string
  reusable: boolean
  selectableAsTopLevelSpecialist: false
  sceneAwareActivation: boolean
  ownsNumericSetting: false
}

export interface CaptionSkillRelationship {
  relationshipId: string
  relationshipVersion: typeof CAPTION_DESIGN_RELATIONSHIP_VERSION
  relationshipKind:
    | 'composed_of'
    | 'component_of'
    | 'conflicts_with'
    | 'compatibility_alias_of'
  sourceSkillId: string
  targetSkillId: string
}

export interface CaptionLegacySkillMapping {
  mappingVersion: typeof CAPTION_LEGACY_SKILL_MAPPING_VERSION
  legacySkillId: string
  disposition: 'mapped_to_components' | 'mapped_to_restraint'
  canonicalSpecialistKey: 'captions'
  compositeSkillId: typeof CAPTION_DESIGN_COMPOSITE_ID | null
  restraintSkillId: typeof NO_CAPTIONS_RESTRAINT_ID | null
  componentSkillIds: string[]
  preservesLegacyReadability: true
  independentPrimaryOwner: false
}

export interface CaptionDesignComposite {
  schemaVersion: typeof CAPTION_DESIGN_COMPOSITE_SCHEMA_VERSION
  compositeId: typeof CAPTION_DESIGN_COMPOSITE_ID
  compositeVersion: string
  compositeDigestSha256: string
  specialistKey: 'captions'
  compatibilityAlias: typeof CAPTION_DIRECTION_COMPATIBILITY_ALIAS
  restraintId: typeof NO_CAPTIONS_RESTRAINT_ID
  nodes: CaptionCreativeSkillNode[]
  relationships: CaptionSkillRelationship[]
  legacyMappings: CaptionLegacySkillMapping[]
  directPeerDispatchAllowed: false
  cycleFree: true
  conflictValidated: true
}

export type CaptionIntegrationClass =
  | 'clean_phrase'
  | 'active_word'
  | 'semantic_kinetic'
  | 'spatial_composite'
  | 'subject_occluded'
  | 'object_anchored'
  | 'environmental'
  | 'persistent_topic'
  | 'hero'
  | 'caption_to_visual'

export interface CaptionSceneSkillActivationInput {
  sceneId: string
  sceneDigestSha256: string
  captionPolicy: 'captions' | typeof NO_CAPTIONS_RESTRAINT_ID
  integrationClasses: CaptionIntegrationClass[]
  requestedLegacySkillIds: string[]
  features: {
    multiSpeaker: boolean
    brollCoComposition: boolean
    cameraCoordination: boolean
    soundChoreography: boolean
    multilingual: boolean
    reducedMotion: boolean
    claimSensitive: boolean
    quoteSensitive: boolean
    needsRevisionAnalysis: boolean
  }
}

export interface CaptionSceneSkillActivation {
  schemaVersion: typeof CAPTION_SCENE_SKILL_ACTIVATION_VERSION
  activationId: string
  activationDigestSha256: string
  sceneId: string
  sceneDigestSha256: string
  compositeId: typeof CAPTION_DESIGN_COMPOSITE_ID
  compositeDigestSha256: string
  compositeActive: boolean
  restraintId: typeof NO_CAPTIONS_RESTRAINT_ID | null
  activeComponentSkillIds: string[]
  skippedComponentSkillIds: string[]
  appliedLegacyMappingIds: string[]
  reasonCodes: string[]
  sceneAwareSelection: true
  directPeerDispatchCreated: false
}
