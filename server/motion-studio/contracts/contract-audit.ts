import {
  MOTION_STUDIO_ARTIFACT_KINDS,
  MOTION_STUDIO_PRODUCTION_MODES,
  MOTION_STUDIO_STAGE_ORDER,
} from '../../../src/lib/motion-studio/contracts'
import {
  listProfessionalSkillDefinitions,
  listProfessionalSkillFamilies,
} from '../../../src/lib/professional-skills'
import { PRODUCTION_TOOL_IDS } from '../../tool-registry'
import { inspectMotionStudioExistingCostCompatibility } from './cost-compatibility'
import {
  MOTION_STUDIO_SKILL_DOMAINS,
  buildMotionStudioSkillTaxonomy,
  listMotionStudioCapabilityRelationships,
  listMotionStudioExistingSkillExtensions,
  validateMotionStudioSkillTaxonomy,
} from './skill-taxonomy'
import { listMotionStudioToolCapabilityMappings } from './tool-capability-map'
import { listMotionStudioWorkflowDefinitions } from './workflow-catalog'
import { validateMotionStudioSemanticCatalogs } from '../../../src/lib/motion-studio/contracts/motion-semantics'

export interface MotionStudioContractAudit {
  ok: boolean
  errors: string[]
  productionModeCount: number
  stageCount: number
  artifactKindCount: number
  existingSkillCount: number
  existingFamilyCount: number
  toolCount: number
  workflowCount: number
  productReadyToolCount: 0
  costBoundary: ReturnType<typeof inspectMotionStudioExistingCostCompatibility>
}

export function runMotionStudioContractAudit(): MotionStudioContractAudit {
  const errors: string[] = []
  const skills = listProfessionalSkillDefinitions()
  const families = listProfessionalSkillFamilies()
  const extensions = listMotionStudioExistingSkillExtensions()
  const taxonomy = buildMotionStudioSkillTaxonomy()
  const capabilityRelationships = listMotionStudioCapabilityRelationships()
  const tools = listMotionStudioToolCapabilityMappings()
  const workflows = listMotionStudioWorkflowDefinitions()
  const semanticCatalogs = validateMotionStudioSemanticCatalogs()

  if (skills.length !== 109) errors.push(`Expected 109 existing professional skills, received ${skills.length}.`)
  if (families.length !== 12) errors.push(`Expected 12 existing professional skill families, received ${families.length}.`)
  if (extensions.length !== skills.length) errors.push('Every existing skill must have exactly one Motion Studio extension.')
  if (new Set(extensions.map((item) => item.sourceProfessionalSkillId)).size !== skills.length) errors.push('Motion Studio skill extensions must be unique and complete.')
  if (tools.length !== PRODUCTION_TOOL_IDS.length || tools.length !== 50) {
    errors.push(`Expected 50 canonical E2E tool mappings, received ${tools.length}.`)
  }
  if (tools.some((tool) => tool.productReady !== false)) errors.push('MS-001 must not promote any tool to product-ready.')
  if (new Set(tools.map((tool) => tool.toolId)).size !== PRODUCTION_TOOL_IDS.length) errors.push('Tool mappings must be unique and complete.')
  const taxonomyValidation = validateMotionStudioSkillTaxonomy(taxonomy, capabilityRelationships, extensions)
  errors.push(...taxonomyValidation.errors)
  if (MOTION_STUDIO_SKILL_DOMAINS.length !== 18) errors.push(`Expected 18 initial Motion Studio skill domains, received ${MOTION_STUDIO_SKILL_DOMAINS.length}.`)
  const taxonomyIds = new Set(taxonomy.map((node) => node.id))
  for (const tool of tools) {
    for (const domainId of tool.skillDomainIds) {
      if (!taxonomyIds.has(domainId)) errors.push(`Tool ${tool.toolId} references missing skill domain ${domainId}.`)
    }
  }
  if (workflows.length !== 27) errors.push(`Expected 27 workflow definitions, received ${workflows.length}.`)
  errors.push(...semanticCatalogs.errors)

  return {
    ok: errors.length === 0,
    errors,
    productionModeCount: MOTION_STUDIO_PRODUCTION_MODES.length,
    stageCount: MOTION_STUDIO_STAGE_ORDER.length,
    artifactKindCount: MOTION_STUDIO_ARTIFACT_KINDS.length,
    existingSkillCount: skills.length,
    existingFamilyCount: families.length,
    toolCount: tools.length,
    workflowCount: workflows.length,
    productReadyToolCount: 0,
    costBoundary: inspectMotionStudioExistingCostCompatibility(),
  }
}
