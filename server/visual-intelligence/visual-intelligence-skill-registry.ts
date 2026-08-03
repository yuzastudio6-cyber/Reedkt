import {
  VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  VISUAL_INTELLIGENCE_EXECUTION_ROUTE,
  VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID,
  VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
  VISUAL_INTELLIGENCE_INSPECTION_ROUTE,
  VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID,
  VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE,
  VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID,
  VISUAL_INTELLIGENCE_QUERY_PROFILES,
  VISUAL_INTELLIGENCE_SKILL_IDS,
  type VisualIntelligenceOperation,
  type VisualIntelligenceProfile,
  type VisualIntelligenceRequest,
  type VisualIntelligenceSkillId,
} from '../../src/types/visual-intelligence'
import { visualIntelligenceDigest } from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION =
  'visual-intelligence-skill-registry-v1' as const

export interface VisualIntelligenceSkillDefinition {
  readonly registryVersion: typeof VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION
  readonly capabilityId: typeof VISUAL_INTELLIGENCE_CAPABILITY_ID
  readonly skillId: VisualIntelligenceSkillId
  readonly operation: VisualIntelligenceOperation
  readonly profiles: readonly VisualIntelligenceProfile[]
  readonly admissionMode:
    | 'planning_evidence'
    | 'approved_edit_inspection'
  readonly executionRouteId:
    | typeof VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID
    | typeof VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID
    | typeof VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID
  readonly executionRoute:
    | typeof VISUAL_INTELLIGENCE_EXECUTION_ROUTE
    | typeof VISUAL_INTELLIGENCE_INSPECTION_ROUTE
    | typeof VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE
  readonly providerPromptOwnedByVisualIntelligence: true
  readonly callerPromptPolicy: 'forbidden' | 'bounded_question_only'
  readonly providerNeutralConsumerContract: true
  readonly directProviderInvocationAllowed: false
  readonly timelineMutationAuthority: false
  readonly skillDigestSha256: string
}

type DefinitionInput = Omit<
  VisualIntelligenceSkillDefinition,
  | 'registryVersion'
  | 'capabilityId'
  | 'providerPromptOwnedByVisualIntelligence'
  | 'providerNeutralConsumerContract'
  | 'directProviderInvocationAllowed'
  | 'timelineMutationAuthority'
  | 'skillDigestSha256'
>

const definitions = Object.freeze([
  definition({
    skillId: VISUAL_INTELLIGENCE_SKILL_IDS[0],
    operation: 'analyze_media',
    profiles: VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
    admissionMode: 'planning_evidence',
    executionRouteId: VISUAL_INTELLIGENCE_EXECUTION_ROUTE_ID,
    executionRoute: VISUAL_INTELLIGENCE_EXECUTION_ROUTE,
    callerPromptPolicy: 'forbidden',
  }),
  definition({
    skillId: VISUAL_INTELLIGENCE_SKILL_IDS[1],
    operation: 'inspect_edit',
    profiles: VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
    admissionMode: 'approved_edit_inspection',
    executionRouteId: VISUAL_INTELLIGENCE_INSPECTION_ROUTE_ID,
    executionRoute: VISUAL_INTELLIGENCE_INSPECTION_ROUTE,
    callerPromptPolicy: 'forbidden',
  }),
  definition({
    skillId: VISUAL_INTELLIGENCE_SKILL_IDS[2],
    operation: 'query_range',
    profiles: VISUAL_INTELLIGENCE_QUERY_PROFILES,
    admissionMode: 'planning_evidence',
    executionRouteId: VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID,
    executionRoute: VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE,
    callerPromptPolicy: 'bounded_question_only',
  }),
  definition({
    skillId: VISUAL_INTELLIGENCE_SKILL_IDS[3],
    operation: 'compare_media',
    profiles: VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
    admissionMode: 'planning_evidence',
    executionRouteId: VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE_ID,
    executionRoute: VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE,
    callerPromptPolicy: 'forbidden',
  }),
])

const definitionByOperation = new Map(
  definitions.map((item) => [item.operation, item]),
)

assertCompleteRegistry()

export function listVisualIntelligenceSkillDefinitions():
readonly VisualIntelligenceSkillDefinition[] {
  return definitions
}

export function getVisualIntelligenceSkillDefinition(
  operation: VisualIntelligenceOperation,
): VisualIntelligenceSkillDefinition {
  const result = definitionByOperation.get(operation)
  if (!result) throw new Error('Visual Intelligence skill is not registered.')
  return result
}

export function getVisualIntelligenceSkillDefinitionForRequest(
  request: VisualIntelligenceRequest,
): VisualIntelligenceSkillDefinition {
  const result = getVisualIntelligenceSkillDefinition(request.operation)
  if (
    !result.profiles.includes(request.profile)
    || result.admissionMode !== request.admission.mode
    || (result.callerPromptPolicy === 'forbidden'
      && request.callerQuestion !== null)
    || (result.callerPromptPolicy === 'bounded_question_only'
      && request.callerQuestion === null)
  ) throw new Error('Visual Intelligence request does not match its registered skill.')
  return result
}

function definition(input: DefinitionInput): VisualIntelligenceSkillDefinition {
  const withoutDigest = {
    registryVersion: VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION,
    capabilityId: VISUAL_INTELLIGENCE_CAPABILITY_ID,
    ...input,
    profiles: Object.freeze([...input.profiles]),
    providerPromptOwnedByVisualIntelligence: true as const,
    providerNeutralConsumerContract: true as const,
    directProviderInvocationAllowed: false as const,
    timelineMutationAuthority: false as const,
  }
  return deepFreeze({
    ...withoutDigest,
    skillDigestSha256: visualIntelligenceDigest(withoutDigest),
  })
}

function assertCompleteRegistry(): void {
  if (
    definitions.length !== VISUAL_INTELLIGENCE_SKILL_IDS.length
    || definitions.some(
      (item, index) => item.skillId !== VISUAL_INTELLIGENCE_SKILL_IDS[index],
    )
    || new Set(definitions.map((item) => item.operation)).size
      !== definitions.length
    || new Set(definitions.map((item) => item.skillId)).size
      !== definitions.length
  ) throw new Error('Visual Intelligence skill registry is incomplete.')
  const registeredProfiles = definitions.flatMap((item) => item.profiles)
  const expectedProfiles = [
    ...VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
    ...VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
    ...VISUAL_INTELLIGENCE_QUERY_PROFILES,
    ...VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  ]
  if (
    registeredProfiles.length !== expectedProfiles.length
    || registeredProfiles.some(
      (profile, index) => profile !== expectedProfiles[index],
    )
    || new Set(registeredProfiles).size !== registeredProfiles.length
  ) throw new Error('Visual Intelligence profile routing is incomplete.')
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const item of Object.values(value as Record<string, unknown>)) {
    deepFreeze(item)
  }
  return value
}
