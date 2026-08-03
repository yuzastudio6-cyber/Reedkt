import {
  VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
  VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS,
  VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
  VISUAL_INTELLIGENCE_QUERY_PROFILES,
  type VisualIntelligenceInternalOperationId,
  type VisualIntelligenceOperation,
  type VisualIntelligenceProfile,
  type VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { visualIntelligenceDigest } from './visual-intelligence-contract'

export const VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION =
  'visual-intelligence-internal-operation-registry-v2' as const

export interface VisualIntelligenceInternalOperationDefinition {
  readonly registryVersion: typeof VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION
  readonly topLevelSkillKey: typeof VISUAL_INTELLIGENCE_CAPABILITY_ID
  readonly operationId: VisualIntelligenceInternalOperationId
  readonly operation: VisualIntelligenceOperation
  readonly profiles: readonly VisualIntelligenceProfile[]
  readonly allowedAdmissionModes: readonly (
    | 'planning_evidence'
    | 'approved_edit_inspection'
  )[]
  readonly topLevelSkillManifestRequired: true
  readonly internalOperationOnly: true
  readonly legacyRouteInvocationAuthoritative: false
  readonly providerPromptOwnedByVisualIntelligence: true
  readonly callerPromptPolicy: 'forbidden' | 'bounded_question_only'
  readonly providerNeutralConsumerContract: true
  readonly directUserInvocationAllowed: false
  readonly directPeerSkillInvocationAllowed: false
  readonly directProviderInvocationAllowed: false
  readonly timelineMutationAuthority: false
  readonly operationDigestSha256: string
}

/** @deprecated Use VisualIntelligenceInternalOperationDefinition. */
export type VisualIntelligenceSkillDefinition =
  VisualIntelligenceInternalOperationDefinition

type DefinitionInput = Omit<
  VisualIntelligenceInternalOperationDefinition,
  | 'registryVersion'
  | 'topLevelSkillKey'
  | 'topLevelSkillManifestRequired'
  | 'internalOperationOnly'
  | 'legacyRouteInvocationAuthoritative'
  | 'providerPromptOwnedByVisualIntelligence'
  | 'providerNeutralConsumerContract'
  | 'directUserInvocationAllowed'
  | 'directPeerSkillInvocationAllowed'
  | 'directProviderInvocationAllowed'
  | 'timelineMutationAuthority'
  | 'operationDigestSha256'
>

const definitions = Object.freeze([
  definition({
    operationId: VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[0],
    operation: 'analyze_media',
    profiles: VISUAL_INTELLIGENCE_ANALYZE_PROFILES,
    allowedAdmissionModes: ['planning_evidence'],
    callerPromptPolicy: 'forbidden',
  }),
  definition({
    operationId: VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[1],
    operation: 'inspect_edit',
    profiles: VISUAL_INTELLIGENCE_INSPECTION_PROFILES,
    allowedAdmissionModes: ['approved_edit_inspection'],
    callerPromptPolicy: 'forbidden',
  }),
  definition({
    operationId: VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[2],
    operation: 'query_range',
    profiles: VISUAL_INTELLIGENCE_QUERY_PROFILES,
    allowedAdmissionModes: [
      'planning_evidence',
      'approved_edit_inspection',
    ],
    callerPromptPolicy: 'bounded_question_only',
  }),
  definition({
    operationId: VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[3],
    operation: 'compare_media',
    profiles: VISUAL_INTELLIGENCE_COMPARISON_PROFILES,
    allowedAdmissionModes: [
      'planning_evidence',
      'approved_edit_inspection',
    ],
    callerPromptPolicy: 'forbidden',
  }),
])

const definitionByOperation = new Map(
  definitions.map((item) => [item.operation, item]),
)

assertCompleteRegistry()

export function listVisualIntelligenceSkillDefinitions():
readonly VisualIntelligenceInternalOperationDefinition[] {
  return definitions
}

export function getVisualIntelligenceSkillDefinition(
  operation: VisualIntelligenceOperation,
): VisualIntelligenceInternalOperationDefinition {
  const result = definitionByOperation.get(operation)
  if (!result) throw new Error('Visual Intelligence skill is not registered.')
  return result
}

export function getVisualIntelligenceSkillDefinitionForRequest(
  request: VisualIntelligenceRequest,
): VisualIntelligenceInternalOperationDefinition {
  const result = getVisualIntelligenceSkillDefinition(request.operation)
  if (
    !result.profiles.includes(request.profile)
    || !result.allowedAdmissionModes.includes(request.admission.mode)
    || (result.callerPromptPolicy === 'forbidden'
      && request.callerQuestion !== null)
    || (result.callerPromptPolicy === 'bounded_question_only'
      && request.callerQuestion === null)
  ) throw new Error('Visual Intelligence request does not match its registered skill.')
  return result
}

function definition(
  input: DefinitionInput,
): VisualIntelligenceInternalOperationDefinition {
  const withoutDigest = {
    registryVersion: VISUAL_INTELLIGENCE_SKILL_REGISTRY_VERSION,
    topLevelSkillKey: VISUAL_INTELLIGENCE_CAPABILITY_ID,
    ...input,
    profiles: Object.freeze([...input.profiles]),
    allowedAdmissionModes: Object.freeze([...input.allowedAdmissionModes]),
    topLevelSkillManifestRequired: true as const,
    internalOperationOnly: true as const,
    legacyRouteInvocationAuthoritative: false as const,
    providerPromptOwnedByVisualIntelligence: true as const,
    providerNeutralConsumerContract: true as const,
    directUserInvocationAllowed: false as const,
    directPeerSkillInvocationAllowed: false as const,
    directProviderInvocationAllowed: false as const,
    timelineMutationAuthority: false as const,
  }
  return deepFreeze({
    ...withoutDigest,
    operationDigestSha256: visualIntelligenceDigest(withoutDigest),
  })
}

function assertCompleteRegistry(): void {
  if (
    definitions.length !== VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS.length
    || definitions.some(
      (item, index) =>
        item.operationId !== VISUAL_INTELLIGENCE_INTERNAL_OPERATION_IDS[index],
    )
    || new Set(definitions.map((item) => item.operation)).size
      !== definitions.length
    || new Set(definitions.map((item) => item.operationId)).size
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
