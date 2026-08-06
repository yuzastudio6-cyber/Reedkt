import { listProfessionalSkillDefinitions } from '../../../src/lib/professional-skills'
import type { ProfessionalSkillDefinition } from '../../../src/types/professional-skills'
import type { ProductionMode } from '../../../src/types/motion-studio'
import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../../tool-registry'

export const MOTION_STUDIO_SKILL_DOMAINS = [
  'project_understanding',
  'story_research',
  'claim_verification',
  'visual_asset_research',
  'reference_intelligence',
  'story_and_script_development',
  'motion_dna_and_creative_direction',
  'native_graphic_design',
  'layered_motion',
  'generative_motion',
  'footage_motion',
  'hybrid_composition',
  'voice',
  'music',
  'synchronized_foley',
  'editing',
  'quality_control',
  'delivery',
] as const

export type MotionStudioSkillDomain = typeof MOTION_STUDIO_SKILL_DOMAINS[number]

export type MotionStudioSkillNodeKind =
  | 'system'
  | 'skill_family'
  | 'parent_skill'
  | 'subskill'
  | 'procedure'

export interface MotionStudioSkillNode {
  id: string
  version: string
  nodeKind: MotionStudioSkillNodeKind
  displayName: string
  description: string
  parentNodeId?: string
  supportedProductionModes: ProductionMode[]
  sceneRecipeIds: string[]
  capabilityRequirements: ProductionToolId[]
  status: 'active' | 'deferred' | 'deprecated'
  domain?: MotionStudioSkillDomain
  professionalSkillId?: string
  procedureDefinitionId?: string
}

export const MOTION_STUDIO_CAPABILITY_RELATIONSHIP_KINDS = [
  'supports',
  'requires',
  'conflicts_with',
  'alternative_to',
  'lower_cost_alternative_to',
  'blocks',
  'blocked_by',
  'coordinates_with',
  'inherits_from',
] as const

export type MotionStudioCapabilityRelationshipKind =
  typeof MOTION_STUDIO_CAPABILITY_RELATIONSHIP_KINDS[number]

export interface MotionStudioCapabilityRelationship {
  sourceNodeId: string
  targetNodeId: string
  relationship: MotionStudioCapabilityRelationshipKind
  rationale: string
}

export type MotionStudioProfessionalSkillDispositionKind =
  | 'bound_to_taxonomy_node'
  | 'retained_outside_motion_studio'
  | 'available_as_cross_domain_capability'
  | 'superseded_or_aliased'
  | 'deferred'
  | 'excluded_with_reason'

export interface MotionStudioProfessionalSkillDisposition {
  sourceProfessionalSkillId: string
  sourceProfessionalSkillFamily: string
  disposition: MotionStudioProfessionalSkillDispositionKind
  recommendedDomainId: string
  boundProcedureNodeId?: string
  rationale: string
}

interface MotionStudioSkillDomainDefinition {
  domain: MotionStudioSkillDomain
  familyId: string
  label: string
  description: string
  subskillLabel: string
  procedureLabel: string
  sourceProfessionalSkillId: string
  sceneRecipeIds: string[]
}

const allModes: ProductionMode[] = [
  'generative_first',
  'layered_first',
  'native_graphics_first',
  'footage_first',
  'hybrid_directed',
]

const FAMILY_DEFINITIONS = [
  {
    id: 'motion_studio.family.direction_intelligence',
    label: 'Direction and intelligence',
    description: 'Understands the project, researches the story, verifies claims, and interprets references.',
  },
  {
    id: 'motion_studio.family.story_creative',
    label: 'Story and creative direction',
    description: 'Develops the story, script, Motion DNA, and the approved creative direction.',
  },
  {
    id: 'motion_studio.family.visual_production',
    label: 'Visual motion production',
    description: 'Builds native, layered, generated, footage-led, and hybrid motion scenes.',
  },
  {
    id: 'motion_studio.family.audio',
    label: 'Voice, music, and synchronized sound',
    description: 'Plans voice, music, and synchronized Foley without collapsing them into one audio capability.',
  },
  {
    id: 'motion_studio.family.finishing',
    label: 'Editing, quality, and delivery',
    description: 'Finishes, validates, packages, and delivers approved production artifacts.',
  },
] as const

const DOMAIN_DEFINITIONS: readonly MotionStudioSkillDomainDefinition[] = [
  {
    domain: 'project_understanding', familyId: FAMILY_DEFINITIONS[0].id,
    label: 'Project understanding', description: 'Compiles the user request and approved project context into production direction.',
    subskillLabel: 'Compile project intent', procedureLabel: 'Compile approved prompt direction',
    sourceProfessionalSkillId: 'intent.compile_prompt_direction', sceneRecipeIds: ['procedure.project_understanding'],
  },
  {
    domain: 'story_research', familyId: FAMILY_DEFINITIONS[0].id,
    label: 'Story research', description: 'Organizes source material and researches the story without treating sources as instructions.',
    subskillLabel: 'Structure story evidence', procedureLabel: 'Detect source story beats',
    sourceProfessionalSkillId: 'source.detect_story_beats', sceneRecipeIds: ['procedure.story_research'],
  },
  {
    domain: 'claim_verification', familyId: FAMILY_DEFINITIONS[0].id,
    label: 'Claim verification', description: 'Separates verified facts, allegations, inference, reconstruction, and fiction.',
    subskillLabel: 'Review factual claims', procedureLabel: 'Apply documentary fact safety',
    sourceProfessionalSkillId: 'source.documentary_fact_safety', sceneRecipeIds: ['procedure.claim_verification'],
  },
  {
    domain: 'visual_asset_research', familyId: FAMILY_DEFINITIONS[0].id,
    label: 'Visual asset research', description: 'Finds and qualifies visual evidence and production assets.',
    subskillLabel: 'Plan visual sourcing', procedureLabel: 'Plan browser-based visual capture',
    sourceProfessionalSkillId: 'graphics.browser_capture_plan', sceneRecipeIds: ['procedure.visual_asset_research'],
  },
  {
    domain: 'reference_intelligence', familyId: FAMILY_DEFINITIONS[0].id,
    label: 'Reference intelligence', description: 'Extracts reference roles, motion grammar, and reusable visual direction.',
    subskillLabel: 'Analyze reference DNA', procedureLabel: 'Extract reference DNA',
    sourceProfessionalSkillId: 'source.reference_dna_extraction', sceneRecipeIds: ['procedure.reference_intelligence'],
  },
  {
    domain: 'story_and_script_development', familyId: FAMILY_DEFINITIONS[1].id,
    label: 'Story and script development', description: 'Develops structure, narration, and on-screen text while preserving approved meaning.',
    subskillLabel: 'Develop chapter structure', procedureLabel: 'Create chapter structure',
    sourceProfessionalSkillId: 'source.chapter_structure', sceneRecipeIds: ['procedure.story_and_script_development'],
  },
  {
    domain: 'motion_dna_and_creative_direction', familyId: FAMILY_DEFINITIONS[1].id,
    label: 'Motion DNA and creative direction', description: 'Defines the approved visual identity without conflating it with scene purpose.',
    subskillLabel: 'Define visual direction', procedureLabel: 'Create a brand-safe visual style',
    sourceProfessionalSkillId: 'graphics.brand_safe_visual_style', sceneRecipeIds: ['procedure.motion_dna_and_creative_direction'],
  },
  {
    domain: 'native_graphic_design', familyId: FAMILY_DEFINITIONS[2].id,
    label: 'Native graphic design', description: 'Builds exact text, maps, charts, diagrams, and native motion graphics.',
    subskillLabel: 'Design native graphics', procedureLabel: 'Build a visual-explanation layer',
    sourceProfessionalSkillId: 'graphics.visual_explain_layer', sceneRecipeIds: ['recipe.native_graphics'],
  },
  {
    domain: 'layered_motion', familyId: FAMILY_DEFINITIONS[2].id,
    label: 'Layered motion', description: 'Builds depth-aware, masked, and layered image motion.',
    subskillLabel: 'Compose depth-aware layers', procedureLabel: 'Apply depth-aware overlay policy',
    sourceProfessionalSkillId: 'mask.depth_aware_overlay_policy', sceneRecipeIds: ['recipe.layered_image_motion'],
  },
  {
    domain: 'generative_motion', familyId: FAMILY_DEFINITIONS[2].id,
    label: 'Generative motion', description: 'Plans generated motion assets behind approval, policy, and fallback gates.',
    subskillLabel: 'Direct generated motion', procedureLabel: 'Match generated visual assets',
    sourceProfessionalSkillId: 'color.generated_asset_match', sceneRecipeIds: ['recipe.generated_motion'],
  },
  {
    domain: 'footage_motion', familyId: FAMILY_DEFINITIONS[2].id,
    label: 'Footage motion', description: 'Selects and treats uploaded footage while preserving source truth.',
    subskillLabel: 'Prepare footage treatment', procedureLabel: 'Review source sequence and structure',
    sourceProfessionalSkillId: 'source.review_sequence_and_structure', sceneRecipeIds: ['recipe.footage_edit'],
  },
  {
    domain: 'hybrid_composition', familyId: FAMILY_DEFINITIONS[2].id,
    label: 'Hybrid composition', description: 'Combines generated, layered, footage, and deterministic renderer layers.',
    subskillLabel: 'Plan hybrid composition', procedureLabel: 'Create a renderer-layer brief',
    sourceProfessionalSkillId: 'motion.renderer_layer_brief', sceneRecipeIds: ['recipe.hybrid_scene'],
  },
  {
    domain: 'voice', familyId: FAMILY_DEFINITIONS[3].id,
    label: 'Voice', description: 'Plans scene-level narration and controlled voice mixing.',
    subskillLabel: 'Plan narration treatment', procedureLabel: 'Apply voiceover mix policy',
    sourceProfessionalSkillId: 'audio.voiceover_mix_policy', sceneRecipeIds: ['recipe.voice_scene_take'],
  },
  {
    domain: 'music', familyId: FAMILY_DEFINITIONS[3].id,
    label: 'Music', description: 'Plans licensed or generated music as a separate production stem.',
    subskillLabel: 'Plan musical timing', procedureLabel: 'Plan music timing and energy cues',
    sourceProfessionalSkillId: 'music.timing_and_energy_cues', sceneRecipeIds: ['recipe.music_cue'],
  },
  {
    domain: 'synchronized_foley', familyId: FAMILY_DEFINITIONS[3].id,
    label: 'Synchronized Foley', description: 'Plans visible-event Foley and ambience separately from speech and music.',
    subskillLabel: 'Plan story-linked sound cues', procedureLabel: 'Apply SFX story-cue policy',
    sourceProfessionalSkillId: 'audio.sfx_story_cue_policy', sceneRecipeIds: ['recipe.synchronized_foley'],
  },
  {
    domain: 'editing', familyId: FAMILY_DEFINITIONS[4].id,
    label: 'Editing', description: 'Assembles source, motion, captions, audio, and timing without overriding approved meaning.',
    subskillLabel: 'Edit approved source', procedureLabel: 'Trim silence and dead air',
    sourceProfessionalSkillId: 'source.trim_silence_and_dead_air', sceneRecipeIds: ['recipe.footage_edit'],
  },
  {
    domain: 'quality_control', familyId: FAMILY_DEFINITIONS[4].id,
    label: 'Quality control', description: 'Validates intent, timing, safety, continuity, and professional finish.',
    subskillLabel: 'Review production quality', procedureLabel: 'Review intent match',
    sourceProfessionalSkillId: 'qa.intent_match_review', sceneRecipeIds: ['procedure.quality_control'],
  },
  {
    domain: 'delivery', familyId: FAMILY_DEFINITIONS[4].id,
    label: 'Delivery', description: 'Packages approved artifacts without silently crossing public-export gates.',
    subskillLabel: 'Prepare delivery package', procedureLabel: 'Apply safe export boundary',
    sourceProfessionalSkillId: 'render.safe_export_boundary', sceneRecipeIds: ['recipe.delivery_package'],
  },
]

function parentId(domain: MotionStudioSkillDomain): string {
  return `motion_studio.domain.${domain}`
}

function subskillId(domain: MotionStudioSkillDomain): string {
  return `motion_studio.subskill.${domain}`
}

function procedureId(domain: MotionStudioSkillDomain): string {
  return `motion_studio.procedure.${domain}`
}

function domainForSkill(skill: ProfessionalSkillDefinition): MotionStudioSkillDomain {
  const id = skill.id
  if (/reference|dna/i.test(id)) return id.includes('reference') ? 'reference_intelligence' : 'motion_dna_and_creative_direction'
  if (/claim|fact|evidence|license/i.test(id)) return 'claim_verification'
  if (/research|archive|source.*visual|browser_capture/i.test(id)) return 'visual_asset_research'
  if (/script|narrat|hook|chapter|story/i.test(id)) return 'story_and_script_development'
  if (skill.family === 'intent_direction') return 'project_understanding'
  if (skill.family === 'source_structure') return 'story_research'
  if (skill.family === 'captions') return 'editing'
  if (skill.family === 'audio_cleanup') return 'voice'
  if (skill.family === 'music_sound') return /sfx|soundscape|cue/i.test(id) ? 'synchronized_foley' : 'music'
  if (skill.family === 'visual_graphics' || skill.family === 'data_visuals') return 'native_graphic_design'
  if (skill.family === 'motion_design') {
    if (/3d|parallax|depth|layer/i.test(id)) return 'layered_motion'
    if (/generated|real_motion|image_to_video/i.test(id)) return 'generative_motion'
    return 'hybrid_composition'
  }
  if (skill.family === 'color_image') return 'footage_motion'
  if (skill.family === 'mask_enhancement') return 'layered_motion'
  if (skill.family === 'render_packaging') return 'delivery'
  if (skill.family === 'qa_review') return 'quality_control'
  return 'hybrid_composition'
}

function requirementsForSourceSkill(sourceProfessionalSkillId: string): ProductionToolId[] {
  const skill = listProfessionalSkillDefinitions().find((item) => item.id === sourceProfessionalSkillId)
  if (!skill) return []
  const registeredTools = new Set<string>(PRODUCTION_TOOL_IDS)
  return skill.hiddenAdapterToolNames.filter((toolId): toolId is ProductionToolId => registeredTools.has(toolId))
}

export function buildMotionStudioSkillTaxonomy(): MotionStudioSkillNode[] {
  const system: MotionStudioSkillNode = {
    id: 'motion_studio.system',
    version: '1.0.0',
    nodeKind: 'system',
    displayName: 'Motion Studio',
    description: 'The root of the Motion Studio professional procedure hierarchy.',
    supportedProductionModes: [...allModes],
    sceneRecipeIds: [],
    capabilityRequirements: [],
    status: 'active',
  }
  const families: MotionStudioSkillNode[] = FAMILY_DEFINITIONS.map((family) => ({
    id: family.id,
    version: '1.0.0',
    nodeKind: 'skill_family',
    displayName: family.label,
    description: family.description,
    parentNodeId: system.id,
    supportedProductionModes: [...allModes],
    sceneRecipeIds: [],
    capabilityRequirements: [],
    status: 'active',
  }))
  const domainNodes = DOMAIN_DEFINITIONS.flatMap<MotionStudioSkillNode>((definition) => {
    const parentNode: MotionStudioSkillNode = {
      id: parentId(definition.domain),
      version: '1.0.0',
      nodeKind: 'parent_skill',
      displayName: definition.label,
      description: definition.description,
      parentNodeId: definition.familyId,
      supportedProductionModes: [...allModes],
      sceneRecipeIds: [...definition.sceneRecipeIds],
      capabilityRequirements: [],
      status: 'active',
      domain: definition.domain,
    }
    const subskillNode: MotionStudioSkillNode = {
      id: subskillId(definition.domain),
      version: '1.0.0',
      nodeKind: 'subskill',
      displayName: definition.subskillLabel,
      description: `A bounded subskill of ${definition.label.toLowerCase()}.`,
      parentNodeId: parentNode.id,
      supportedProductionModes: [...allModes],
      sceneRecipeIds: [...definition.sceneRecipeIds],
      capabilityRequirements: [],
      status: 'active',
      domain: definition.domain,
    }
    const procedureNode: MotionStudioSkillNode = {
      id: procedureId(definition.domain),
      version: '1.0.0',
      nodeKind: 'procedure',
      displayName: definition.procedureLabel,
      description: `The first registered procedure for ${definition.label.toLowerCase()}.`,
      parentNodeId: subskillNode.id,
      supportedProductionModes: [...allModes],
      sceneRecipeIds: [...definition.sceneRecipeIds],
      capabilityRequirements: requirementsForSourceSkill(definition.sourceProfessionalSkillId),
      status: 'active',
      domain: definition.domain,
      professionalSkillId: definition.sourceProfessionalSkillId,
      procedureDefinitionId: `motion_studio.procedure_definition.${definition.domain}.v1`,
    }
    return [parentNode, subskillNode, procedureNode]
  })
  return [system, ...families, ...domainNodes]
}

export function deriveMotionStudioSkillChildIds(
  nodes: readonly MotionStudioSkillNode[],
  parentNodeId: string,
): string[] {
  return nodes.filter((node) => node.parentNodeId === parentNodeId).map((node) => node.id).sort()
}

export interface MotionStudioPrimaryHierarchyEdge {
  parentNodeId: string
  childNodeId: string
}

export type MotionStudioDerivedChildReadModel = Readonly<Record<string, readonly string[]>>

export function listMotionStudioPrimaryHierarchyEdges(
  nodes: readonly MotionStudioSkillNode[],
): MotionStudioPrimaryHierarchyEdge[] {
  return nodes
    .filter((node): node is MotionStudioSkillNode & { parentNodeId: string } => Boolean(node.parentNodeId))
    .map((node) => ({ parentNodeId: node.parentNodeId, childNodeId: node.id }))
}

export function buildMotionStudioDerivedChildReadModel(
  nodes: readonly MotionStudioSkillNode[],
): MotionStudioDerivedChildReadModel {
  return Object.fromEntries(nodes.map((node) => [node.id, deriveMotionStudioSkillChildIds(nodes, node.id)]))
}

export function listMotionStudioCapabilityRelationships(): MotionStudioCapabilityRelationship[] {
  const requires: Array<[MotionStudioSkillDomain, MotionStudioSkillDomain, string]> = [
    ['story_research', 'project_understanding', 'Research requires an approved understanding of the project.'],
    ['claim_verification', 'story_research', 'Claim verification requires identified story evidence.'],
    ['visual_asset_research', 'claim_verification', 'Factual visual sourcing must preserve verified claim status.'],
    ['reference_intelligence', 'project_understanding', 'Reference analysis must follow the project intent.'],
    ['story_and_script_development', 'claim_verification', 'Factual scripts depend on verified claim treatment.'],
    ['motion_dna_and_creative_direction', 'reference_intelligence', 'Creative direction uses approved reference intelligence.'],
    ['native_graphic_design', 'motion_dna_and_creative_direction', 'Native graphics follow the approved visual direction.'],
    ['layered_motion', 'motion_dna_and_creative_direction', 'Layered motion follows the approved visual direction.'],
    ['generative_motion', 'motion_dna_and_creative_direction', 'Generated motion follows the approved visual direction.'],
    ['footage_motion', 'story_and_script_development', 'Footage treatment follows approved story meaning.'],
    ['hybrid_composition', 'native_graphic_design', 'Hybrid composition can combine native graphic layers.'],
    ['hybrid_composition', 'layered_motion', 'Hybrid composition can combine layered motion.'],
    ['voice', 'story_and_script_development', 'Voice production requires approved narration.'],
    ['music', 'story_and_script_development', 'Music direction follows the approved emotional arc.'],
    ['synchronized_foley', 'editing', 'Synchronized Foley requires approved visible-event timing.'],
    ['editing', 'story_and_script_development', 'Editing must preserve the approved story and script.'],
    ['quality_control', 'editing', 'Quality control reviews the assembled edit.'],
    ['delivery', 'quality_control', 'Delivery requires completed quality gates.'],
  ]
  const requiredRelationships: MotionStudioCapabilityRelationship[] = requires.map(([source, target, rationale]) => ({
    sourceNodeId: parentId(source),
    targetNodeId: parentId(target),
    relationship: 'requires',
    rationale,
  }))
  return [
    ...requiredRelationships,
    {
      sourceNodeId: parentId('project_understanding'),
      targetNodeId: parentId('story_research'),
      relationship: 'supports',
      rationale: 'Approved project understanding supports bounded story research.',
    },
    {
      sourceNodeId: parentId('native_graphic_design'),
      targetNodeId: parentId('generative_motion'),
      relationship: 'alternative_to',
      rationale: 'Native graphics are an accuracy-focused alternative where generated motion is unsuitable.',
    },
    {
      sourceNodeId: parentId('layered_motion'),
      targetNodeId: parentId('generative_motion'),
      relationship: 'lower_cost_alternative_to',
      rationale: 'Layered motion can be the approved lower-cost alternative for suitable scenes.',
    },
    {
      sourceNodeId: parentId('voice'),
      targetNodeId: parentId('music'),
      relationship: 'coordinates_with',
      rationale: 'Voice and music coordinate through speech-protection and timing policy.',
    },
    {
      sourceNodeId: parentId('quality_control'),
      targetNodeId: parentId('delivery'),
      relationship: 'blocks',
      rationale: 'Blocking quality failures prevent delivery.',
    },
    {
      sourceNodeId: parentId('delivery'),
      targetNodeId: parentId('quality_control'),
      relationship: 'blocked_by',
      rationale: 'Delivery remains blocked by unresolved required quality gates.',
    },
  ]
}

export function listMotionStudioExistingSkillExtensions(): MotionStudioProfessionalSkillDisposition[] {
  const boundBySkillId = new Map(DOMAIN_DEFINITIONS.map((definition) => [
    definition.sourceProfessionalSkillId,
    procedureId(definition.domain),
  ]))
  return listProfessionalSkillDefinitions().map((skill) => {
    const domain = domainForSkill(skill)
    const boundProcedureNodeId = boundBySkillId.get(skill.id)
    return {
      sourceProfessionalSkillId: skill.id,
      sourceProfessionalSkillFamily: skill.family,
      disposition: boundProcedureNodeId ? 'bound_to_taxonomy_node' : 'available_as_cross_domain_capability',
      recommendedDomainId: parentId(domain),
      boundProcedureNodeId,
      rationale: boundProcedureNodeId
        ? 'Existing professional skill is reused by one registered Motion Studio procedure.'
        : 'Existing professional skill remains in the canonical registry and is available without becoming a hierarchy node.',
    }
  })
}

export interface MotionStudioSkillTaxonomyValidation {
  ok: boolean
  errors: string[]
}

const rankByKind: Record<MotionStudioSkillNodeKind, number> = {
  system: 0,
  skill_family: 1,
  parent_skill: 2,
  subskill: 3,
  procedure: 4,
}

export function validateMotionStudioSkillTaxonomy(
  nodes: readonly MotionStudioSkillNode[],
  relationships: readonly MotionStudioCapabilityRelationship[],
  dispositions: readonly MotionStudioProfessionalSkillDisposition[],
  childReadModel: MotionStudioDerivedChildReadModel = buildMotionStudioDerivedChildReadModel(nodes),
): MotionStudioSkillTaxonomyValidation {
  const errors: string[] = []
  const nodeById = new Map<string, MotionStudioSkillNode>()
  const professionalSkillIds = new Set(listProfessionalSkillDefinitions().map((skill) => skill.id))
  const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
  const relationshipKinds = new Set<string>(MOTION_STUDIO_CAPABILITY_RELATIONSHIP_KINDS)

  for (const node of nodes) {
    const existing = nodeById.get(node.id)
    if (existing) {
      errors.push(`Duplicate taxonomy node ID: ${node.id}.`)
      if (existing.parentNodeId !== node.parentNodeId) errors.push(`Multiple canonical parents declared for ${node.id}.`)
    }
    nodeById.set(node.id, node)
  }
  const roots = nodes.filter((node) => node.nodeKind === 'system')
  if (roots.length !== 1) errors.push(`Expected exactly one system root, received ${roots.length}.`)
  if (!nodes.some((node) => node.nodeKind === 'parent_skill')) errors.push('At least one parent-skill node is required.')
  if (!nodes.some((node) => node.nodeKind === 'subskill')) errors.push('At least one subskill node is required.')
  if (!nodes.some((node) => node.nodeKind === 'procedure')) errors.push('At least one procedure node is required.')

  const primaryEdgeKeys = new Set<string>()
  for (const edge of listMotionStudioPrimaryHierarchyEdges(nodes)) {
    const key = `${edge.parentNodeId}|${edge.childNodeId}`
    if (primaryEdgeKeys.has(key)) errors.push(`Duplicate primary hierarchy edge ${key}.`)
    primaryEdgeKeys.add(key)
  }

  for (const node of nodes) {
    if (!node.version.trim()) errors.push(`Taxonomy node ${node.id} requires a version.`)
    if (!node.displayName.trim()) errors.push(`Taxonomy node ${node.id} requires a display name.`)
    if (!node.description.trim()) errors.push(`Taxonomy node ${node.id} requires a description.`)
    if (!['active', 'deferred', 'deprecated'].includes(node.status)) errors.push(`Taxonomy node ${node.id} has invalid status ${node.status}.`)
    if (node.nodeKind === 'system') {
      if (node.parentNodeId) errors.push(`System node ${node.id} must not have a parent.`)
    } else if (!node.parentNodeId) {
      errors.push(`Missing parent for ${node.id}.`)
    } else {
      if (node.parentNodeId === node.id) errors.push(`Self-parent relationship for ${node.id}.`)
      const parent = nodeById.get(node.parentNodeId)
      if (!parent) errors.push(`Missing parent node ${node.parentNodeId} for ${node.id}.`)
      else if (rankByKind[parent.nodeKind] + 1 !== rankByKind[node.nodeKind]) {
        errors.push(`Invalid hierarchy rank ${parent.nodeKind} -> ${node.nodeKind} for ${node.id}.`)
      }
    }
    if (node.nodeKind === 'procedure' && deriveMotionStudioSkillChildIds(nodes, node.id).length > 0) {
      errors.push(`Procedure ${node.id} must not have child nodes.`)
    }
    if (node.nodeKind === 'procedure' && !node.procedureDefinitionId) {
      errors.push(`Procedure ${node.id} requires procedureDefinitionId.`)
    }
    if (node.nodeKind !== 'procedure' && node.procedureDefinitionId) {
      errors.push(`Only procedure nodes may declare procedureDefinitionId: ${node.id}.`)
    }
    if (node.professionalSkillId && !professionalSkillIds.has(node.professionalSkillId)) {
      errors.push(`Missing professional skill reference ${node.professionalSkillId} on ${node.id}.`)
    }
    for (const toolId of node.capabilityRequirements) {
      if (!productionToolIds.has(toolId)) errors.push(`Missing tool reference ${toolId} on ${node.id}.`)
    }
  }

  for (const node of nodes) {
    const expectedChildren = deriveMotionStudioSkillChildIds(nodes, node.id)
    const exposedChildren = [...(childReadModel[node.id] ?? [])].sort()
    if (JSON.stringify(expectedChildren) !== JSON.stringify(exposedChildren)) {
      errors.push(`Derived child read model contradicts canonical parent references for ${node.id}.`)
    }
  }
  for (const parentIdInReadModel of Object.keys(childReadModel)) {
    if (!nodeById.has(parentIdInReadModel)) errors.push(`Derived child read model contains missing parent ${parentIdInReadModel}.`)
  }

  for (const node of nodes) {
    const visited = new Set<string>([node.id])
    let cursor = node
    while (cursor.parentNodeId) {
      if (visited.has(cursor.parentNodeId)) {
        errors.push(`Hierarchy cycle detected from ${node.id} through ${cursor.parentNodeId}.`)
        break
      }
      visited.add(cursor.parentNodeId)
      const parent = nodeById.get(cursor.parentNodeId)
      if (!parent) break
      cursor = parent
    }
  }

  for (const node of nodes.filter((item) => item.nodeKind === 'parent_skill')) {
    if (!deriveMotionStudioSkillChildIds(nodes, node.id).some((id) => nodeById.get(id)?.nodeKind === 'subskill')) {
      errors.push(`Parent skill ${node.id} has no subskill.`)
    }
  }
  for (const node of nodes.filter((item) => item.nodeKind === 'subskill')) {
    if (!deriveMotionStudioSkillChildIds(nodes, node.id).some((id) => nodeById.get(id)?.nodeKind === 'procedure')) {
      errors.push(`Subskill ${node.id} has no procedure.`)
    }
  }

  const relationKeys = new Set<string>()
  for (const relation of relationships) {
    if (!relationshipKinds.has(relation.relationship)) errors.push(`Unsupported capability relationship ${relation.relationship}.`)
    if (!nodeById.has(relation.sourceNodeId)) errors.push(`Missing capability source ${relation.sourceNodeId}.`)
    if (!nodeById.has(relation.targetNodeId)) errors.push(`Missing capability target ${relation.targetNodeId}.`)
    if (relation.sourceNodeId === relation.targetNodeId) errors.push(`Self capability relationship on ${relation.sourceNodeId}.`)
    const key = `${relation.sourceNodeId}|${relation.relationship}|${relation.targetNodeId}`
    if (relationKeys.has(key)) errors.push(`Duplicate capability relationship ${key}.`)
    relationKeys.add(key)
  }
  const directionalRelationships = new Map<string, Set<MotionStudioCapabilityRelationshipKind>>()
  for (const relation of relationships) {
    const pair = `${relation.sourceNodeId}|${relation.targetNodeId}`
    const reversePair = `${relation.targetNodeId}|${relation.sourceNodeId}`
    const kinds = directionalRelationships.get(pair) ?? new Set<MotionStudioCapabilityRelationshipKind>()
    kinds.add(relation.relationship)
    directionalRelationships.set(pair, kinds)
    const reverseKinds = directionalRelationships.get(reversePair)
    if ((kinds.has('conflicts_with') && kinds.size > 1) ||
      (kinds.has('conflicts_with') && reverseKinds && reverseKinds.size > 0) ||
      (reverseKinds?.has('conflicts_with') && kinds.size > 0)) {
      errors.push(`Contradictory capability relationships for ${relation.sourceNodeId} and ${relation.targetNodeId}.`)
    }
  }

  const dispositionBySkillId = new Map<string, MotionStudioProfessionalSkillDisposition>()
  for (const disposition of dispositions) {
    if (dispositionBySkillId.has(disposition.sourceProfessionalSkillId)) {
      errors.push(`Duplicate skill disposition for ${disposition.sourceProfessionalSkillId}.`)
    }
    dispositionBySkillId.set(disposition.sourceProfessionalSkillId, disposition)
    if (!professionalSkillIds.has(disposition.sourceProfessionalSkillId)) {
      errors.push(`Disposition references missing professional skill ${disposition.sourceProfessionalSkillId}.`)
    }
    if (!nodeById.has(disposition.recommendedDomainId)) {
      errors.push(`Disposition references missing domain ${disposition.recommendedDomainId}.`)
    }
    if (disposition.disposition === 'bound_to_taxonomy_node') {
      const boundNode = disposition.boundProcedureNodeId ? nodeById.get(disposition.boundProcedureNodeId) : undefined
      if (!boundNode || boundNode.nodeKind !== 'procedure') {
        errors.push(`Bound skill ${disposition.sourceProfessionalSkillId} lacks a valid procedure node.`)
      } else if (boundNode.professionalSkillId !== disposition.sourceProfessionalSkillId) {
        errors.push(`Bound procedure ${boundNode.id} contradicts skill ${disposition.sourceProfessionalSkillId}.`)
      }
    }
  }
  for (const skillId of professionalSkillIds) {
    if (!dispositionBySkillId.has(skillId)) errors.push(`Missing disposition for professional skill ${skillId}.`)
  }

  return { ok: errors.length === 0, errors }
}
