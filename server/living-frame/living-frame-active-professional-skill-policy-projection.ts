import {
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID,
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_CLASS,
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_VERSION,
  LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
  LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
  type LivingFrameActiveProfessionalSkillPolicyProjection,
  type LivingFrameActiveProfessionalSkillPolicyProjectionDraft,
} from '../../src/types/living-frame-active-professional-skill-policy-projection'
import {
  getProfessionalSkillDefinition,
  listProfessionalSkillDefinitions,
} from '../../src/lib/professional-skills'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const OBSERVED_REGISTRY_DEFINITION_COUNT = 110 as const
const OBSERVED_LIVING_FRAME_DEFINITION_DIGEST_SHA256 =
  'c5c1190db98624c7e22eb2c26731eb43a04d274f1459779b9bb10307bb1d6537' as const

const AUTHORITY_BOUNDARY = Object.freeze({
  sourcePolicyProjectionOnly: true as const,
  professionalSkillRegistryAuthority: false as const,
  plannerSelectionAuthority: false as const,
  publicationAuthority: false as const,
  approvedSnapshotAuthority: false as const,
  toolAuthority: false as const,
  providerAuthority: false as const,
  runtimeAuthority: false as const,
  dispatchAuthority: false as const,
  costAuthority: false as const,
  qaApprovalAuthority: false as const,
  privateReviewAuthority: false as const,
  publicDeliveryAuthority: false as const,
  productionAuthority: false as const,
})

export function compileLivingFrameActiveProfessionalSkillPolicyProjection():
LivingFrameActiveProfessionalSkillPolicyProjection {
  const definitions = listProfessionalSkillDefinitions()
  const livingFrameDefinitions = definitions.filter((definition) =>
    definition.id === LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID)
  const definition = getProfessionalSkillDefinition(
    LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID,
  )
  if (
    definitions.length !== OBSERVED_REGISTRY_DEFINITION_COUNT
    || livingFrameDefinitions.length !== 1
    || definition == null
    || sha256AuthorityValue(definition)
      !== OBSERVED_LIVING_FRAME_DEFINITION_DIGEST_SHA256
    || !sameStrings(
      definition.qaGates,
      LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
    )
    || definition.hiddenAdapterToolNames.length !== 0
    || (definition.backendIntents ?? []).length !== 0
    || !sameStrings(definition.executionModes, ['plan_only'])
    || LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA.some(
      (gate) => definition.qaGates.includes(gate),
    )
  ) throw new Error(
    'Living Frame shared professional-skill definition drift requires canonical one-writer reconciliation.',
  )

  const ownerScopeAmendment = compileLivingFrameOwnerScopeAmendment()
  const projectedQaGates = [
    ...LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES,
    ...LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA,
  ] as const
  const draft: LivingFrameActiveProfessionalSkillPolicyProjectionDraft = {
    contractVersion:
      LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_VERSION,
    projectionClass:
      LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_POLICY_PROJECTION_CLASS,
    projectionState:
      'feature_branch_policy_delta_frozen_canonical_one_writer_reconciliation_pending',
    canonicalSkillId: LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_ID,
    canonicalSkillDefinitionVersion: null,
    canonicalSkillDefinitionVersionState:
      'shared_definition_has_no_explicit_version_field',
    canonicalSkillDefinitionSnapshot: structuredClone(definition),
    canonicalSkillDefinitionDigestSha256:
      OBSERVED_LIVING_FRAME_DEFINITION_DIGEST_SHA256,
    observedRegistryDefinitionCount:
      OBSERVED_REGISTRY_DEFINITION_COUNT,
    observedRegistryDefinitionCountIsProductCap: false,
    canonicalLivingFrameDefinitionCount: 1,
    currentQaGates:
      structuredClone(LIVING_FRAME_CURRENT_PROFESSIONAL_SKILL_QA_GATES),
    additiveOrderedQaGateDelta:
      structuredClone(LIVING_FRAME_ACTIVE_PROFESSIONAL_SKILL_QA_GATE_DELTA),
    projectedQaGates: structuredClone(projectedQaGates),
    projectedQaGateSetDigestSha256:
      sha256AuthorityValue(projectedQaGates),
    ownerScopeAmendmentVersion:
      ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      ownerScopeAmendment.amendmentDigestSha256,
    hiddenAdapterToolNames: [],
    backendIntents: [],
    executionModes: ['plan_only'],
    currentCanonicalRegistryAlreadyEmitsDelta: false,
    sharedRegistryMutatedByProjection: false,
    canonicalConsumptionPending: true,
    canonicalOneWriterReconciliationRequired: true,
    selectionPublicationAndApprovedSnapshotDigestPropagationRequired:
      true,
    fullCanonicalPlannerRegistryRegressionRequired: true,
    containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
      false,
    authorityBoundary: AUTHORITY_BOUNDARY,
    toolSelected: false,
    providerSelected: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    costAdmitted: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameActiveProfessionalSkillPolicyProjection(
  value: unknown,
): value is LivingFrameActiveProfessionalSkillPolicyProjection {
  if (
    value == null
    || typeof value !== 'object'
    || Array.isArray(value)
  ) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameActiveProfessionalSkillPolicyProjection(),
      )
  } catch {
    return false
  }
}

function sameStrings(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child)
  }
  return value
}
