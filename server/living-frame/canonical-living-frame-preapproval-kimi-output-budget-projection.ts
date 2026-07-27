import { z } from 'zod'

import {
  createLivingFrameSemanticSceneProposalJsonSchema,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import {
  REEDITPRO_REASONING_MODEL_RATE_CARD,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
} from '../reasoning-model-cost/rate-card'
import {
  reasoningModelRateCardIdentityDigest,
} from '../reasoning-model-cost/workload-cost-evidence-v2'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyCanonicalLivingFramePreapprovalKimiApiCompatibility,
  verifyCanonicalLivingFramePreapprovalKimiApiContractObservation,
  type CanonicalLivingFramePreapprovalKimiApiCompatibility,
  type CanonicalLivingFramePreapprovalKimiApiContractObservation,
} from './canonical-living-frame-preapproval-kimi-api-contract-observation'
import {
  verifyCanonicalLivingFramePreapprovalKimiMfjsSchemaProjection,
  type CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection,
} from './canonical-living-frame-preapproval-kimi-mfjs-schema-projection'
import {
  verifyCanonicalLivingFramePreapprovalKimiRequestMaterial,
  type CanonicalLivingFramePreapprovalKimiRequestMaterial,
} from './canonical-living-frame-preapproval-kimi-request-material'
import {
  verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
} from './canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  verifyCanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRun,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BUDGET_PROJECTION_VERSION =
  'canonical-living-frame-preapproval-kimi-output-budget-projection-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_PROFILE_ID =
  'single-scene-bounded-semantic-result-profile-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BOUND_ALGORITHM =
  'canonical-minimal-json-utf8-upper-bound-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_TOKENIZER_OBSERVED_AT =
  '2026-07-27T21:45:00.000Z' as const

const MAXIMUM_COMPLETION_TOKENS = 131_072
const MAXIMUM_SCENE_PROPOSALS = 1
const MAXIMUM_DECISIONS = 4
const MAXIMUM_COMPONENTS_PER_SCENE = 8
const MAXIMUM_COMPONENT_DEPENDENCIES_PER_SCENE =
  MAXIMUM_COMPONENTS_PER_SCENE
  * (MAXIMUM_COMPONENTS_PER_SCENE - 1)
  / 2
const MAXIMUM_MINI_SKILLS_PER_SCENE = 12
const MAXIMUM_TIMING_CONSTRAINTS_PER_SCENE = 5
const MAXIMUM_ATTENTION_CONSTRAINTS_PER_SCENE = 5
const MAXIMUM_SCALE_CONSTRAINTS_PER_SCENE =
  MAXIMUM_COMPONENTS_PER_SCENE
const MAXIMUM_SOUND_CONSTRAINTS_PER_SCENE = 6
const MAXIMUM_EVIDENCE_CITATIONS_PER_ENTRY = 8
const MAXIMUM_ACTIVATION_REFERENCES = 7
const MAXIMUM_GENERATED_IDENTIFIER_LENGTH = 96
const MAXIMUM_DERIVED_SUMMARY_LENGTH = 160
const MAXIMUM_SCENE_DERIVED_SUMMARY_LENGTH = 200
const MAXIMUM_QA_EXPECTATIONS_PER_SCENE = 19
const MAXIMUM_CANONICAL_FINITE_NUMBER_UTF8_BYTES = 32
const MONEY_MICROS = /^(?:0|[1-9][0-9]{0,23})$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN =
  '^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$'
const SHA256_PATTERN = '^[a-f0-9]{64}$'
const MILLION = 1_000_000n

const sha256Schema = z.string().regex(SHA256)
const jsonSchemaObjectSchema = z.record(z.string(), z.unknown())
const moneyMicrosSchema = z.string().regex(MONEY_MICROS)

const authorityBoundarySchema = z.object({
  deterministicRequestSpecificProviderSchemaAuthority:
    z.literal(true),
  controlledPublicTokenizerObservationAuthority:
    z.literal(true),
  controlledInternalCostCeilingCalculationAuthority:
    z.literal(true),
  canonicalAcceptanceSchemaAuthority: z.literal(false),
  currentApiTokenizerAuthority: z.literal(false),
  completionTokenCeilingAuthority: z.literal(false),
  hiddenReasoningTokenSufficiencyAuthority: z.literal(false),
  providerSchemaCompatibilityAuthority: z.literal(false),
  liveTargetSchemaProbeAuthority: z.literal(false),
  providerApiContractQualificationAuthority: z.literal(false),
  providerModelRevisionQualificationAuthority: z.literal(false),
  providerRequestBodyAuthority: z.literal(false),
  providerRequestReservationAuthority: z.literal(false),
  oneUseSubmissionAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerObservationAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  fallbackAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BUDGET_PROJECTION_BOUNDARY =
  Object.freeze({
    deterministicRequestSpecificProviderSchemaAuthority: true as const,
    controlledPublicTokenizerObservationAuthority: true as const,
    controlledInternalCostCeilingCalculationAuthority: true as const,
    canonicalAcceptanceSchemaAuthority: false as const,
    currentApiTokenizerAuthority: false as const,
    completionTokenCeilingAuthority: false as const,
    hiddenReasoningTokenSufficiencyAuthority: false as const,
    providerSchemaCompatibilityAuthority: false as const,
    liveTargetSchemaProbeAuthority: false as const,
    providerApiContractQualificationAuthority: false as const,
    providerModelRevisionQualificationAuthority: false as const,
    providerRequestBodyAuthority: false as const,
    providerRequestReservationAuthority: false as const,
    oneUseSubmissionAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCredentialAuthority: false as const,
    providerCallAuthority: false as const,
    providerObservationAuthority: false as const,
    providerAttemptCostAuthority: false as const,
    reasoningResultAuthority: false as const,
    selectedSceneAuthority: false as const,
    fallbackAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workGraphAuthority: false as const,
    queueAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const outputProfileSchema = z.object({
  profileId: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_PROFILE_ID,
  ),
  maximumDecisions: z.literal(MAXIMUM_DECISIONS),
  maximumSceneProposals: z.number().int().min(0)
    .max(MAXIMUM_SCENE_PROPOSALS),
  maximumSegmentContextsPerScene: z.literal(1),
  maximumComponentsPerScene:
    z.literal(MAXIMUM_COMPONENTS_PER_SCENE),
  maximumComponentDependenciesPerScene:
    z.literal(MAXIMUM_COMPONENT_DEPENDENCIES_PER_SCENE),
  maximumMiniSkillsPerScene:
    z.literal(MAXIMUM_MINI_SKILLS_PER_SCENE),
  maximumTimingConstraintsPerScene:
    z.literal(MAXIMUM_TIMING_CONSTRAINTS_PER_SCENE),
  maximumAttentionConstraintsPerScene:
    z.literal(MAXIMUM_ATTENTION_CONSTRAINTS_PER_SCENE),
  maximumScaleConstraintsPerScene:
    z.literal(MAXIMUM_SCALE_CONSTRAINTS_PER_SCENE),
  maximumSoundConstraintsPerScene:
    z.literal(MAXIMUM_SOUND_CONSTRAINTS_PER_SCENE),
  maximumEvidenceCitationsPerEntry: z.number().int().min(0)
    .max(MAXIMUM_EVIDENCE_CITATIONS_PER_ENTRY),
  maximumActivationReferences:
    z.literal(MAXIMUM_ACTIVATION_REFERENCES),
  maximumGeneratedIdentifierLength:
    z.literal(MAXIMUM_GENERATED_IDENTIFIER_LENGTH),
  maximumDerivedSummaryLength:
    z.literal(MAXIMUM_DERIVED_SUMMARY_LENGTH),
  maximumSceneDerivedSummaryLength:
    z.literal(MAXIMUM_SCENE_DERIVED_SUMMARY_LENGTH),
  maximumQaExpectationsPerScene:
    z.literal(MAXIMUM_QA_EXPECTATIONS_PER_SCENE),
  allowedDecisionKinds: z.array(z.enum([
    'semantic_candidate',
    'rejected_candidate',
    'deliberate_non_use',
    'blocked',
  ])).min(1).max(4),
  allowedModes: z.array(z.enum([
    'living_a_roll',
    'living_still',
    'living_archive',
    'living_diagram',
    'hybrid_expansion',
  ])).max(5),
  exactSegmentContextIds: z.array(z.string().min(1).max(240))
    .max(256),
  exactEvidenceReferenceIds: z.array(z.string().min(1).max(240))
    .max(128),
  oneScenePerAttemptPolicy: z.literal(true),
  completeMultiSceneBatchAuthority: z.literal(false),
}).strict()

const projectionDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BUDGET_PROJECTION_VERSION,
  ),
  recordClass: z.literal(
    'controlled_kimi_request_specific_output_budget_projection',
  ),
  state: z.literal(
    'request_specific_output_budget_validated_transport_blocked',
  ),
  observedAt: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_TOKENIZER_OBSERVED_AT,
  ),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  canonicalBindings: z.object({
    requestMaterialRecordDigestSha256: sha256Schema,
    preparedRunRecordDigestSha256: sha256Schema,
    attemptReservationRecordDigestSha256: sha256Schema,
    apiObservationRecordDigestSha256: sha256Schema,
    apiCompatibilityRecordDigestSha256: sha256Schema,
    mfjsSchemaProjectionRecordDigestSha256: sha256Schema,
    canonicalAcceptanceJsonSchemaDigestSha256: sha256Schema,
    baseProviderMfjsJsonSchemaDigestSha256: sha256Schema,
    boundedCanonicalProfileJsonSchemaDigestSha256: sha256Schema,
    requestSpecificProviderJsonSchemaDigestSha256: sha256Schema,
    providerNeutralPayloadDigestSha256: sha256Schema,
    internalCostBudgetAdmissionDigestSha256: sha256Schema,
    rateCardIdentityDigestSha256: sha256Schema,
  }).strict(),
  outputProfile: outputProfileSchema,
  schemaProjection: z.object({
    schemaName: z.literal(
      'living_frame_semantic_scene_proposal_result_v1',
    ),
    providerProjectionClass: z.literal(
      'request_specific_mfjs_constrained_decode_profile',
    ),
    baseProviderMfjsJsonSchemaByteLength:
      z.number().int().positive().max(1_000_000),
    requestSpecificProviderJsonSchemaByteLength:
      z.number().int().positive().max(1_000_000),
    requestSpecificProviderJsonSchema:
      jsonSchemaObjectSchema,
    requestSpecificEnumsBound: z.object({
      decisionKinds: z.literal(true),
      sceneModes: z.literal(true),
      segmentContextIds: z.literal(true),
      evidenceReferenceIds: z.literal(true),
    }).strict(),
    canonicalResultDtoChanged: z.literal(false),
    canonicalAcceptanceSchemaChanged: z.literal(false),
    canonicalPostParseRevalidationRequired: z.literal(true),
    canonicalSemanticCrossValidationRequired: z.literal(true),
  }).strict(),
  canonicalJsonOutputBound: z.object({
    algorithmId: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BOUND_ALGORITHM,
    ),
    boundedCanonicalProfileJsonSchema:
      jsonSchemaObjectSchema,
    upperBoundUtf8Bytes:
      z.number().int().positive().max(MAXIMUM_COMPLETION_TOKENS),
    countsAllRequiredObjectProperties: z.literal(true),
    usesEveryArrayMaximum: z.literal(true),
    usesLongestEnumSerialization: z.literal(true),
    usesConservativeThirtyTwoUtf8BytesPerFiniteNumber:
      z.literal(true),
    usesSixUtf8BytesPerUnrestrictedStringCodeUnit:
      z.literal(true),
    usesOneUtf8BytePerCanonicalPatternRestrictedAsciiCharacter:
      z.literal(true),
    crossValidatorReductionsExcluded: z.literal(true),
    rawEquivalentJsonLexemeInflationBounded: z.literal(false),
  }).strict(),
  tokenizerObservation: z.object({
    observationClass: z.literal(
      'controlled_public_kimi_k3_tokenizer_source_observation',
    ),
    repositoryUrl:
      z.literal('https://huggingface.co/moonshotai/Kimi-K3'),
    sourceRevision: z.literal(
      '9f62e4e9fffbd0a83ddd60e1c209d828994b3569',
    ),
    sourceLastModifiedAt:
      z.literal('2026-07-27T16:29:18.000Z'),
    metadataByteLength: z.literal(7_423),
    metadataSha256: z.literal(
      'af86b3d18c745221133b09ac19c61a0b032aa193380b05af6b6b6a386e2ce867',
    ),
    tokenizerImplementation: z.object({
      repositoryPath: z.literal('tokenization_kimi.py'),
      byteLength: z.literal(16_145),
      sha256: z.literal(
        'f28ea66e2d862a2a5814970b2ce40c2f7d8296ff09aed90a7e7def689b906944',
      ),
      tokenizerClass: z.literal('TikTokenTokenizer'),
    }).strict(),
    tokenizerConfiguration: z.object({
      repositoryPath: z.literal('tokenizer_config.json'),
      byteLength: z.literal(3_478),
      sha256: z.literal(
        '5d0803c94db9cd78763499e0956c95fd5a225c14a727e5a6cf5db3f96f010a6e',
      ),
    }).strict(),
    mergeableRanks: z.object({
      repositoryPath: z.literal('tiktoken.model'),
      byteLength: z.literal(2_795_286),
      sha256: z.literal(
        'b6c497a7469b33ced9c38afb1ad6e47f03f5e5dc05f15930799210ec050c5103',
      ),
      entryCount: z.literal(163_584),
      oneByteTokenCount: z.literal(256),
      oneByteRanksCompleteFromZeroThrough255: z.literal(true),
    }).strict(),
    visibleUtf8TextTokenCountNoGreaterThanUtf8ByteLength:
      z.literal(true),
    requestChatFramingTokenCountBounded: z.literal(false),
    hiddenReasoningTokenCountBounded: z.literal(false),
    apiModelAliasTokenizerMatchProven: z.literal(false),
    currentSourceRereadRequiredAtTransport: z.literal(true),
  }).strict(),
  completionBudget: z.object({
    providerObservedDefaultMaximumCompletionTokens:
      z.literal(MAXIMUM_COMPLETION_TOKENS),
    proposedMaximumCompletionTokens:
      z.literal(MAXIMUM_COMPLETION_TOKENS),
    controlledObservedTokenizerVisibleJsonTokenUpperBound:
      z.number().int().positive().max(MAXIMUM_COMPLETION_TOKENS),
    remainingCompletionTokenHeadroom:
      z.number().int().nonnegative().max(MAXIMUM_COMPLETION_TOKENS),
    reasoningTokensShareCompletionCeiling: z.literal(true),
    reasoningTokenRequirementUnproven: z.literal(true),
    rawJsonLexemeInflationMayConsumeHeadroom: z.literal(true),
    truncationFinishReasonMustFailClosed: z.literal(true),
    liveTargetModelProbeCompleted: z.literal(false),
    currentApiTokenizerMatchProven: z.literal(false),
    completionTokenCeilingTransportQualified: z.literal(false),
  }).strict(),
  internalCostBudget: z.object({
    rateCardVersion: z.literal(
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    ),
    routeId: z.literal('kimi_k3_primary'),
    denomination: z.literal('normalized_usd_micros'),
    contextWindowTokens: z.literal(1_000_000),
    cacheMissInputMicrosPerMillionTokens: z.literal(3_000_000),
    outputMicrosPerMillionTokens: z.literal(15_000_000),
    conservativeInputTokenUpperBoundUsesFullContextWindow:
      z.literal(true),
    maximumCacheMissInputCostMicros: moneyMicrosSchema,
    maximumCompletionCostMicros: moneyMicrosSchema,
    maximumCombinedInternalCostMicros: moneyMicrosSchema,
    maximumAuthorizedInternalCostMicros: moneyMicrosSchema,
    remainingAuthorizedInternalCostMicros: moneyMicrosSchema,
    maximumCombinedCostWithinControlledBudget: z.literal(true),
    currentRateCardRereadRequiredAtTransport: z.literal(true),
    actualAttemptCostKnown: z.literal(false),
    customerPriceCalculated: z.literal(false),
    customerCreditsCalculated: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  acceptanceBoundary: z.object({
    constrainedDecodeUsesRequestSpecificProviderSchema:
      z.literal(true),
    canonicalAcceptanceUsesOriginalResultSchema: z.literal(true),
    canonicalSemanticCrossValidationRequired: z.literal(true),
    secondResultDtoCreated: z.literal(false),
    finalContentOnlyMayEnterAcceptance: z.literal(true),
    invalidOrTruncatedContentFailsClosed: z.literal(true),
    providerRequestBodyCreated: z.literal(false),
    executable: z.literal(false),
  }).strict(),
  runtimeBlockers: z.tuple([
    z.literal('current_official_source_reread_required'),
    z.literal('current_public_tokenizer_source_reread_required'),
    z.literal('current_api_model_tokenizer_equivalence_required'),
    z.literal('current_account_model_availability_required'),
    z.literal('immutable_provider_model_revision_required'),
    z.literal('live_target_schema_and_completion_probe_required'),
    z.literal('transport_completion_ceiling_qualification_required'),
    z.literal('distributed_one_use_lifecycle_required'),
    z.literal('provider_credential_capability_required'),
    z.literal('unknown_outcome_operator_reconciliation_required'),
  ]),
  browserShareable: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  remoteMutationMade: z.literal(false),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalKimiOutputBudgetProjectionSchema =
  projectionDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export type CanonicalLivingFramePreapprovalKimiOutputBudgetProjection =
  z.infer<
    typeof canonicalLivingFramePreapprovalKimiOutputBudgetProjectionSchema
  >

interface VerifiedInputs {
  readonly requestMaterial:
    CanonicalLivingFramePreapprovalKimiRequestMaterial
  readonly preparedRun: CanonicalLivingFramePreapprovalReasoningRun
  readonly attemptReservation:
    CanonicalLivingFramePreapprovalReasoningAttemptReservation
  readonly apiObservation:
    CanonicalLivingFramePreapprovalKimiApiContractObservation
  readonly apiCompatibility:
    CanonicalLivingFramePreapprovalKimiApiCompatibility
  readonly mfjsProjection:
    CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection
}

interface ProfileValues {
  readonly maximumSceneProposals: number
  readonly maximumEvidenceCitationsPerEntry: number
  readonly allowedDecisionKinds: readonly string[]
  readonly allowedModes: readonly string[]
  readonly exactSegmentContextIds: readonly string[]
  readonly exactEvidenceReferenceIds: readonly string[]
}

export function createCanonicalLivingFramePreapprovalKimiOutputBudgetProjection(
  input: {
    readonly requestMaterial:
      CanonicalLivingFramePreapprovalKimiRequestMaterial
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
    readonly apiObservation:
      CanonicalLivingFramePreapprovalKimiApiContractObservation
    readonly apiCompatibility:
      CanonicalLivingFramePreapprovalKimiApiCompatibility
    readonly mfjsProjection:
      CanonicalLivingFramePreapprovalKimiMfjsSchemaProjection
  },
): CanonicalLivingFramePreapprovalKimiOutputBudgetProjection {
  const verified = verifyInputs(input)
  const draft = createExpectedDraft(verified)
  return verifyCanonicalLivingFramePreapprovalKimiOutputBudgetProjection({
    projection: {
      ...draft,
      recordDigestSha256: sha256AuthorityValue(draft),
    },
    ...input,
  })
}

export function verifyCanonicalLivingFramePreapprovalKimiOutputBudgetProjection(
  input: {
    readonly projection: unknown
    readonly requestMaterial: unknown
    readonly preparedRun: unknown
    readonly attemptReservation: unknown
    readonly apiObservation: unknown
    readonly apiCompatibility: unknown
    readonly mfjsProjection: unknown
  },
): CanonicalLivingFramePreapprovalKimiOutputBudgetProjection {
  const projection =
    canonicalLivingFramePreapprovalKimiOutputBudgetProjectionSchema
      .parse(input.projection)
  const verified = verifyInputs(input)
  const {
    recordDigestSha256,
    ...draft
  } = projection
  const expected = createExpectedDraft(verified)
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(draft) !==
      stableAuthorityStringify(expected)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_output_budget_projection_invalid',
    )
  }
  return structuredClone(projection)
}

function verifyInputs(input: {
  readonly requestMaterial: unknown
  readonly preparedRun: unknown
  readonly attemptReservation: unknown
  readonly apiObservation: unknown
  readonly apiCompatibility: unknown
  readonly mfjsProjection: unknown
}): VerifiedInputs {
  const preparedRun =
    verifyCanonicalLivingFramePreapprovalReasoningRun(
      input.preparedRun,
    )
  const attemptReservation =
    verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
      input.attemptReservation,
    )
  const requestMaterial =
    verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
      material: input.requestMaterial,
      preparedRun,
      attemptReservation,
    })
  const apiObservation =
    verifyCanonicalLivingFramePreapprovalKimiApiContractObservation(
      input.apiObservation,
    )
  const apiCompatibility =
    verifyCanonicalLivingFramePreapprovalKimiApiCompatibility({
      compatibility: input.apiCompatibility,
      requestMaterial,
      preparedRun,
      attemptReservation,
      apiObservation,
    })
  const mfjsProjection =
    verifyCanonicalLivingFramePreapprovalKimiMfjsSchemaProjection({
      projection: input.mfjsProjection,
      requestMaterial,
      preparedRun,
      attemptReservation,
      apiObservation,
      apiCompatibility,
    })
  return {
    requestMaterial,
    preparedRun,
    attemptReservation,
    apiObservation,
    apiCompatibility,
    mfjsProjection,
  }
}

function createExpectedDraft(
  input: VerifiedInputs,
): z.infer<typeof projectionDraftSchema> {
  const semanticPayload =
    input.requestMaterial.internalRequestMaterial.messages[1]
      .content.semanticPayload
  const profileValues = createProfileValues(semanticPayload)
  const canonicalSchema =
    createLivingFrameSemanticSceneProposalJsonSchema()
  const baseProviderSchema =
    input.mfjsProjection.schemaProjection.providerMfjsJsonSchema
  const boundedCanonicalSchema = applyOutputProfile({
    schema: canonicalSchema,
    profileValues,
  })
  const requestSpecificProviderSchema = applyOutputProfile({
    schema: baseProviderSchema,
    profileValues,
  })
  const canonicalJsonUpperBound =
    calculateCanonicalJsonUtf8UpperBound(
      boundedCanonicalSchema,
      '$',
    )
  if (canonicalJsonUpperBound > MAXIMUM_COMPLETION_TOKENS) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_output_profile_exceeds_completion_ceiling',
    )
  }

  const rateCard =
    REEDITPRO_REASONING_MODEL_RATE_CARD.kimi_k3_primary
  const maximumInputCost = calculateTokenCostMicros({
    tokens: rateCard.contextWindowTokens,
    microsPerMillionTokens:
      rateCard.cacheMissInputMicrosPerMillionTokens,
  })
  const maximumCompletionCost = calculateTokenCostMicros({
    tokens: MAXIMUM_COMPLETION_TOKENS,
    microsPerMillionTokens:
      rateCard.outputMicrosPerMillionTokens,
  })
  const maximumCombinedCost =
    maximumInputCost + maximumCompletionCost
  const maximumAuthorizedCost = BigInt(
    input.preparedRun.budgetAdmission
      .maximumAuthorizedInternalCostMicros,
  )
  if (
    input.preparedRun.budgetAdmission
      .rateCardIdentityDigestSha256 !==
      reasoningModelRateCardIdentityDigest()
    || input.apiObservation.requestContract
      .providerDefaultMaximumCompletionTokens !==
      MAXIMUM_COMPLETION_TOKENS
    || maximumCombinedCost > maximumAuthorizedCost
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_output_budget_invalid',
    )
  }

  const boundedCanonicalSchemaDigest =
    sha256AuthorityValue(boundedCanonicalSchema)
  const requestSpecificProviderSchemaDigest =
    sha256AuthorityValue(requestSpecificProviderSchema)
  const requestSpecificProviderSchemaText =
    stableAuthorityStringify(requestSpecificProviderSchema)
  const remainingCost =
    maximumAuthorizedCost - maximumCombinedCost

  return projectionDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BUDGET_PROJECTION_VERSION,
    recordClass:
      'controlled_kimi_request_specific_output_budget_projection',
    state:
      'request_specific_output_budget_validated_transport_blocked',
    observedAt:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_TOKENIZER_OBSERVED_AT,
    promotionAllowed: false,
    productionReady: false,
    canonicalBindings: {
      requestMaterialRecordDigestSha256:
        input.requestMaterial.recordDigestSha256,
      preparedRunRecordDigestSha256:
        input.preparedRun.recordDigestSha256,
      attemptReservationRecordDigestSha256:
        input.attemptReservation.recordDigestSha256,
      apiObservationRecordDigestSha256:
        input.apiObservation.recordDigestSha256,
      apiCompatibilityRecordDigestSha256:
        input.apiCompatibility.recordDigestSha256,
      mfjsSchemaProjectionRecordDigestSha256:
        input.mfjsProjection.recordDigestSha256,
      canonicalAcceptanceJsonSchemaDigestSha256:
        sha256AuthorityValue(canonicalSchema),
      baseProviderMfjsJsonSchemaDigestSha256:
        sha256AuthorityValue(baseProviderSchema),
      boundedCanonicalProfileJsonSchemaDigestSha256:
        boundedCanonicalSchemaDigest,
      requestSpecificProviderJsonSchemaDigestSha256:
        requestSpecificProviderSchemaDigest,
      providerNeutralPayloadDigestSha256:
        input.requestMaterial.canonicalBindings
          .providerNeutralPayloadDigestSha256,
      internalCostBudgetAdmissionDigestSha256:
        input.preparedRun.budgetAdmission.admissionDigestSha256,
      rateCardIdentityDigestSha256:
        input.preparedRun.budgetAdmission
          .rateCardIdentityDigestSha256,
    },
    outputProfile: {
      profileId:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_PROFILE_ID,
      maximumDecisions: MAXIMUM_DECISIONS,
      maximumSceneProposals:
        profileValues.maximumSceneProposals,
      maximumSegmentContextsPerScene: 1,
      maximumComponentsPerScene:
        MAXIMUM_COMPONENTS_PER_SCENE,
      maximumComponentDependenciesPerScene:
        MAXIMUM_COMPONENT_DEPENDENCIES_PER_SCENE,
      maximumMiniSkillsPerScene:
        MAXIMUM_MINI_SKILLS_PER_SCENE,
      maximumTimingConstraintsPerScene:
        MAXIMUM_TIMING_CONSTRAINTS_PER_SCENE,
      maximumAttentionConstraintsPerScene:
        MAXIMUM_ATTENTION_CONSTRAINTS_PER_SCENE,
      maximumScaleConstraintsPerScene:
        MAXIMUM_SCALE_CONSTRAINTS_PER_SCENE,
      maximumSoundConstraintsPerScene:
        MAXIMUM_SOUND_CONSTRAINTS_PER_SCENE,
      maximumEvidenceCitationsPerEntry:
        profileValues.maximumEvidenceCitationsPerEntry,
      maximumActivationReferences:
        MAXIMUM_ACTIVATION_REFERENCES,
      maximumGeneratedIdentifierLength:
        MAXIMUM_GENERATED_IDENTIFIER_LENGTH,
      maximumDerivedSummaryLength:
        MAXIMUM_DERIVED_SUMMARY_LENGTH,
      maximumSceneDerivedSummaryLength:
        MAXIMUM_SCENE_DERIVED_SUMMARY_LENGTH,
      maximumQaExpectationsPerScene:
        MAXIMUM_QA_EXPECTATIONS_PER_SCENE,
      allowedDecisionKinds:
        profileValues.allowedDecisionKinds,
      allowedModes: profileValues.allowedModes,
      exactSegmentContextIds:
        profileValues.exactSegmentContextIds,
      exactEvidenceReferenceIds:
        profileValues.exactEvidenceReferenceIds,
      oneScenePerAttemptPolicy: true,
      completeMultiSceneBatchAuthority: false,
    },
    schemaProjection: {
      schemaName:
        'living_frame_semantic_scene_proposal_result_v1',
      providerProjectionClass:
        'request_specific_mfjs_constrained_decode_profile',
      baseProviderMfjsJsonSchemaByteLength:
        Buffer.byteLength(
          stableAuthorityStringify(baseProviderSchema),
          'utf8',
        ),
      requestSpecificProviderJsonSchemaByteLength:
        Buffer.byteLength(requestSpecificProviderSchemaText, 'utf8'),
      requestSpecificProviderJsonSchema:
        requestSpecificProviderSchema,
      requestSpecificEnumsBound: {
        decisionKinds: true,
        sceneModes: true,
        segmentContextIds: true,
        evidenceReferenceIds: true,
      },
      canonicalResultDtoChanged: false,
      canonicalAcceptanceSchemaChanged: false,
      canonicalPostParseRevalidationRequired: true,
      canonicalSemanticCrossValidationRequired: true,
    },
    canonicalJsonOutputBound: {
      algorithmId:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BOUND_ALGORITHM,
      boundedCanonicalProfileJsonSchema:
        boundedCanonicalSchema,
      upperBoundUtf8Bytes: canonicalJsonUpperBound,
      countsAllRequiredObjectProperties: true,
      usesEveryArrayMaximum: true,
      usesLongestEnumSerialization: true,
      usesConservativeThirtyTwoUtf8BytesPerFiniteNumber:
        true,
      usesSixUtf8BytesPerUnrestrictedStringCodeUnit: true,
      usesOneUtf8BytePerCanonicalPatternRestrictedAsciiCharacter:
        true,
      crossValidatorReductionsExcluded: true,
      rawEquivalentJsonLexemeInflationBounded: false,
    },
    tokenizerObservation: {
      observationClass:
        'controlled_public_kimi_k3_tokenizer_source_observation',
      repositoryUrl:
        'https://huggingface.co/moonshotai/Kimi-K3',
      sourceRevision:
        '9f62e4e9fffbd0a83ddd60e1c209d828994b3569',
      sourceLastModifiedAt: '2026-07-27T16:29:18.000Z',
      metadataByteLength: 7_423,
      metadataSha256:
        'af86b3d18c745221133b09ac19c61a0b032aa193380b05af6b6b6a386e2ce867',
      tokenizerImplementation: {
        repositoryPath: 'tokenization_kimi.py',
        byteLength: 16_145,
        sha256:
          'f28ea66e2d862a2a5814970b2ce40c2f7d8296ff09aed90a7e7def689b906944',
        tokenizerClass: 'TikTokenTokenizer',
      },
      tokenizerConfiguration: {
        repositoryPath: 'tokenizer_config.json',
        byteLength: 3_478,
        sha256:
          '5d0803c94db9cd78763499e0956c95fd5a225c14a727e5a6cf5db3f96f010a6e',
      },
      mergeableRanks: {
        repositoryPath: 'tiktoken.model',
        byteLength: 2_795_286,
        sha256:
          'b6c497a7469b33ced9c38afb1ad6e47f03f5e5dc05f15930799210ec050c5103',
        entryCount: 163_584,
        oneByteTokenCount: 256,
        oneByteRanksCompleteFromZeroThrough255: true,
      },
      visibleUtf8TextTokenCountNoGreaterThanUtf8ByteLength:
        true,
      requestChatFramingTokenCountBounded: false,
      hiddenReasoningTokenCountBounded: false,
      apiModelAliasTokenizerMatchProven: false,
      currentSourceRereadRequiredAtTransport: true,
    },
    completionBudget: {
      providerObservedDefaultMaximumCompletionTokens:
        MAXIMUM_COMPLETION_TOKENS,
      proposedMaximumCompletionTokens:
        MAXIMUM_COMPLETION_TOKENS,
      controlledObservedTokenizerVisibleJsonTokenUpperBound:
        canonicalJsonUpperBound,
      remainingCompletionTokenHeadroom:
        MAXIMUM_COMPLETION_TOKENS - canonicalJsonUpperBound,
      reasoningTokensShareCompletionCeiling: true,
      reasoningTokenRequirementUnproven: true,
      rawJsonLexemeInflationMayConsumeHeadroom: true,
      truncationFinishReasonMustFailClosed: true,
      liveTargetModelProbeCompleted: false,
      currentApiTokenizerMatchProven: false,
      completionTokenCeilingTransportQualified: false,
    },
    internalCostBudget: {
      rateCardVersion:
        REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
      routeId: 'kimi_k3_primary',
      denomination: 'normalized_usd_micros',
      contextWindowTokens: rateCard.contextWindowTokens,
      cacheMissInputMicrosPerMillionTokens:
        rateCard.cacheMissInputMicrosPerMillionTokens,
      outputMicrosPerMillionTokens:
        rateCard.outputMicrosPerMillionTokens,
      conservativeInputTokenUpperBoundUsesFullContextWindow: true,
      maximumCacheMissInputCostMicros:
        maximumInputCost.toString(),
      maximumCompletionCostMicros:
        maximumCompletionCost.toString(),
      maximumCombinedInternalCostMicros:
        maximumCombinedCost.toString(),
      maximumAuthorizedInternalCostMicros:
        maximumAuthorizedCost.toString(),
      remainingAuthorizedInternalCostMicros:
        remainingCost.toString(),
      maximumCombinedCostWithinControlledBudget: true,
      currentRateCardRereadRequiredAtTransport: true,
      actualAttemptCostKnown: false,
      customerPriceCalculated: false,
      customerCreditsCalculated: false,
      serviceFeeIncluded: false,
    },
    acceptanceBoundary: {
      constrainedDecodeUsesRequestSpecificProviderSchema: true,
      canonicalAcceptanceUsesOriginalResultSchema: true,
      canonicalSemanticCrossValidationRequired: true,
      secondResultDtoCreated: false,
      finalContentOnlyMayEnterAcceptance: true,
      invalidOrTruncatedContentFailsClosed: true,
      providerRequestBodyCreated: false,
      executable: false,
    },
    runtimeBlockers: [
      'current_official_source_reread_required',
      'current_public_tokenizer_source_reread_required',
      'current_api_model_tokenizer_equivalence_required',
      'current_account_model_availability_required',
      'immutable_provider_model_revision_required',
      'live_target_schema_and_completion_probe_required',
      'transport_completion_ceiling_qualification_required',
      'distributed_one_use_lifecycle_required',
      'provider_credential_capability_required',
      'unknown_outcome_operator_reconciliation_required',
    ],
    browserShareable: false,
    providerCallMade: false,
    credentialReadMade: false,
    remoteMutationMade: false,
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_OUTPUT_BUDGET_PROJECTION_BOUNDARY,
  })
}

function createProfileValues(
  semanticPayload: CanonicalLivingFramePreapprovalKimiRequestMaterial[
    'internalRequestMaterial'
  ]['messages'][1]['content']['semanticPayload'],
): ProfileValues {
  const allowedDecisionKinds =
    uniqueSorted(semanticPayload.requestedDecisionKinds)
  const allowedModes = uniqueSorted(semanticPayload.allowedModes)
  const exactSegmentContextIds = uniqueSorted(
    semanticPayload.segmentContexts.map(
      (context) => context.segmentContextId,
    ),
  )
  const exactEvidenceReferenceIds = uniqueSorted(
    semanticPayload.evidence.evidenceReferences.map(
      (reference) => reference.evidenceRefId,
    ),
  )
  const semanticCandidatesAllowed =
    allowedDecisionKinds.includes('semantic_candidate')
    && allowedModes.length > 0
    && exactSegmentContextIds.length > 0
  return {
    maximumSceneProposals:
      semanticCandidatesAllowed ? MAXIMUM_SCENE_PROPOSALS : 0,
    maximumEvidenceCitationsPerEntry:
      Math.min(
        exactEvidenceReferenceIds.length,
        MAXIMUM_EVIDENCE_CITATIONS_PER_ENTRY,
      ),
    allowedDecisionKinds,
    allowedModes,
    exactSegmentContextIds,
    exactEvidenceReferenceIds,
  }
}

function applyOutputProfile(input: {
  readonly schema: Record<string, unknown>
  readonly profileValues: ProfileValues
}): Record<string, unknown> {
  const schema = structuredClone(input.schema)
  capGeneratedIdentifierLengths(schema)
  const root = objectProperties(schema, '$')
  const decisions = arrayNode(root.decisions, '$.decisions')
  const decision = objectProperties(
    decisions.items,
    '$.decisions.items',
  )
  const scenes = arrayNode(root.sceneProposals, '$.sceneProposals')
  const scene = objectProperties(
    scenes.items,
    '$.sceneProposals.items',
  )
  const components = arrayNode(
    scene.components,
    '$.sceneProposals.items.components',
  )
  const component = objectProperties(
    components.items,
    '$.sceneProposals.items.components.items',
  )
  const componentDependencies = arrayNode(
    scene.componentDependencies,
    '$.sceneProposals.items.componentDependencies',
  )
  const miniSkills = arrayNode(
    scene.miniSkillProposals,
    '$.sceneProposals.items.miniSkillProposals',
  )
  const miniSkill = objectProperties(
    miniSkills.items,
    '$.sceneProposals.items.miniSkillProposals.items',
  )
  const timing = arrayNode(
    scene.semanticTimingConstraints,
    '$.sceneProposals.items.semanticTimingConstraints',
  )
  const timingItem = objectProperties(
    timing.items,
    '$.sceneProposals.items.semanticTimingConstraints.items',
  )
  const attention = arrayNode(
    scene.attentionConstraints,
    '$.sceneProposals.items.attentionConstraints',
  )
  const attentionItem = objectProperties(
    attention.items,
    '$.sceneProposals.items.attentionConstraints.items',
  )
  const scale = arrayNode(
    scene.semanticScaleConstraints,
    '$.sceneProposals.items.semanticScaleConstraints',
  )
  const scaleItem = objectProperties(
    scale.items,
    '$.sceneProposals.items.semanticScaleConstraints.items',
  )
  const sound = arrayNode(
    scene.soundConstraints,
    '$.sceneProposals.items.soundConstraints',
  )
  const soundItem = objectProperties(
    sound.items,
    '$.sceneProposals.items.soundConstraints.items',
  )

  narrowMaximum(decisions, 'maxItems', MAXIMUM_DECISIONS, '$.decisions')
  narrowMaximum(
    scenes,
    'maxItems',
    input.profileValues.maximumSceneProposals,
    '$.sceneProposals',
  )
  narrowMaximum(
    arrayNode(
      decision.evidenceCitations,
      '$.decisions.items.evidenceCitations',
    ),
    'maxItems',
    input.profileValues.maximumEvidenceCitationsPerEntry,
    '$.decisions.items.evidenceCitations',
  )
  narrowMaximum(
    arrayNode(
      decision.sceneProposalKeys,
      '$.decisions.items.sceneProposalKeys',
    ),
    'maxItems',
    input.profileValues.maximumSceneProposals,
    '$.decisions.items.sceneProposalKeys',
  )
  narrowMaximum(
    arrayNode(
      scene.segmentContextIds,
      '$.sceneProposals.items.segmentContextIds',
    ),
    'maxItems',
    1,
    '$.sceneProposals.items.segmentContextIds',
  )
  narrowMaximum(
    components,
    'maxItems',
    MAXIMUM_COMPONENTS_PER_SCENE,
    '$.sceneProposals.items.components',
  )
  narrowMaximum(
    componentDependencies,
    'maxItems',
    MAXIMUM_COMPONENT_DEPENDENCIES_PER_SCENE,
    '$.sceneProposals.items.componentDependencies',
  )
  narrowMaximum(
    miniSkills,
    'maxItems',
    MAXIMUM_MINI_SKILLS_PER_SCENE,
    '$.sceneProposals.items.miniSkillProposals',
  )
  narrowMaximum(
    timing,
    'maxItems',
    MAXIMUM_TIMING_CONSTRAINTS_PER_SCENE,
    '$.sceneProposals.items.semanticTimingConstraints',
  )
  narrowMaximum(
    attention,
    'maxItems',
    MAXIMUM_ATTENTION_CONSTRAINTS_PER_SCENE,
    '$.sceneProposals.items.attentionConstraints',
  )
  narrowMaximum(
    scale,
    'maxItems',
    MAXIMUM_SCALE_CONSTRAINTS_PER_SCENE,
    '$.sceneProposals.items.semanticScaleConstraints',
  )
  narrowMaximum(
    sound,
    'maxItems',
    MAXIMUM_SOUND_CONSTRAINTS_PER_SCENE,
    '$.sceneProposals.items.soundConstraints',
  )
  narrowMaximum(
    arrayNode(
      scene.qaExpectationCodes,
      '$.sceneProposals.items.qaExpectationCodes',
    ),
    'maxItems',
    MAXIMUM_QA_EXPECTATIONS_PER_SCENE,
    '$.sceneProposals.items.qaExpectationCodes',
  )
  narrowMaximum(
    arrayNode(
      component.evidenceCitations,
      '$.sceneProposals.items.components.items.evidenceCitations',
    ),
    'maxItems',
    input.profileValues.maximumEvidenceCitationsPerEntry,
    '$.sceneProposals.items.components.items.evidenceCitations',
  )
  narrowMaximum(
    arrayNode(
      miniSkill.linkedComponentKeys,
      '$.sceneProposals.items.miniSkillProposals.items.linkedComponentKeys',
    ),
    'maxItems',
    MAXIMUM_COMPONENTS_PER_SCENE,
    '$.sceneProposals.items.miniSkillProposals.items.linkedComponentKeys',
  )
  narrowMaximum(
    arrayNode(
      miniSkill.linkedTimingConstraintKeys,
      '$.sceneProposals.items.miniSkillProposals.items.linkedTimingConstraintKeys',
    ),
    'maxItems',
    MAXIMUM_TIMING_CONSTRAINTS_PER_SCENE,
    '$.sceneProposals.items.miniSkillProposals.items.linkedTimingConstraintKeys',
  )
  for (const key of [
    'dependsOnActivationKeys',
    'conflictsWithActivationKeys',
  ] as const) {
    narrowMaximum(
      arrayNode(
        miniSkill[key],
        `$.sceneProposals.items.miniSkillProposals.items.${key}`,
      ),
      'maxItems',
      MAXIMUM_ACTIVATION_REFERENCES,
      `$.sceneProposals.items.miniSkillProposals.items.${key}`,
    )
  }

  for (const [node, maximum, path] of [
    [
      decision.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.decisions.items.derivedSummary',
    ],
    [
      scene.derivedSummary,
      MAXIMUM_SCENE_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.derivedSummary',
    ],
    [
      component.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.components.items.derivedSummary',
    ],
    [
      miniSkill.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.miniSkillProposals.items.derivedSummary',
    ],
    [
      timingItem.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.semanticTimingConstraints.items.derivedSummary',
    ],
    [
      attentionItem.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.attentionConstraints.items.derivedSummary',
    ],
    [
      scaleItem.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.semanticScaleConstraints.items.derivedSummary',
    ],
    [
      soundItem.derivedSummary,
      MAXIMUM_DERIVED_SUMMARY_LENGTH,
      '$.sceneProposals.items.soundConstraints.items.derivedSummary',
    ],
  ] as const) {
    narrowMaximum(
      schemaNode(node, path),
      'maxLength',
      maximum,
      path,
    )
  }

  setEnum(
    schemaNode(decision.decisionKind, '$.decisions.items.decisionKind'),
    input.profileValues.allowedDecisionKinds,
    '$.decisions.items.decisionKind',
  )
  if (input.profileValues.allowedModes.length > 0) {
    setEnum(
      schemaNode(scene.mode, '$.sceneProposals.items.mode'),
      input.profileValues.allowedModes,
      '$.sceneProposals.items.mode',
    )
  }
  bindArrayItemEnum(
    scene.segmentContextIds,
    input.profileValues.exactSegmentContextIds,
    '$.sceneProposals.items.segmentContextIds',
  )
  bindEvidenceEnum(
    decision.evidenceCitations,
    input.profileValues.exactEvidenceReferenceIds,
    '$.decisions.items.evidenceCitations',
  )
  bindEvidenceEnum(
    component.evidenceCitations,
    input.profileValues.exactEvidenceReferenceIds,
    '$.sceneProposals.items.components.items.evidenceCitations',
  )

  return schema
}

function capGeneratedIdentifierLengths(
  node: unknown,
): void {
  if (Array.isArray(node)) {
    node.forEach(capGeneratedIdentifierLengths)
    return
  }
  if (!isPlainRecord(node)) return
  if (
    node.type === 'string'
    && node.maxLength === 240
  ) {
    node.maxLength = MAXIMUM_GENERATED_IDENTIFIER_LENGTH
  }
  Object.values(node).forEach(capGeneratedIdentifierLengths)
}

function bindEvidenceEnum(
  node: unknown,
  values: readonly string[],
  path: string,
): void {
  const citations = arrayNode(node, path)
  if (values.length === 0) return
  const citation = objectProperties(citations.items, `${path}.items`)
  setEnum(
    schemaNode(citation.evidenceRefId, `${path}.items.evidenceRefId`),
    values,
    `${path}.items.evidenceRefId`,
  )
}

function bindArrayItemEnum(
  node: unknown,
  values: readonly string[],
  path: string,
): void {
  if (values.length === 0) return
  const array = arrayNode(node, path)
  setEnum(schemaNode(array.items, `${path}.items`), values, `${path}.items`)
}

function setEnum(
  node: Record<string, unknown>,
  values: readonly unknown[],
  path: string,
): void {
  if (values.length === 0) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_profile_empty_enum:${path}`,
    )
  }
  if (Array.isArray(node.enum)) {
    const source = new Set(
      node.enum.map((value) => stableAuthorityStringify(value)),
    )
    if (
      values.some(
        (value) => !source.has(stableAuthorityStringify(value)),
      )
    ) {
      throw new Error(
        `canonical_living_frame_preapproval_kimi_output_profile_enum_widened:${path}`,
      )
    }
  }
  node.enum = structuredClone(values)
  if (
    node.type === 'string'
    && values.every((value) => typeof value === 'string')
  ) {
    node.maxLength = Math.max(
      1,
      ...values.map((value) => value.length),
    )
  }
}

function narrowMaximum(
  node: Record<string, unknown>,
  keyword: 'maxItems' | 'maxLength',
  maximum: number,
  path: string,
): void {
  const current = node[keyword]
  const minimumKeyword =
    keyword === 'maxItems' ? 'minItems' : 'minLength'
  const minimum = node[minimumKeyword]
  if (
    !Number.isInteger(current)
    || Number(current) < maximum
    || (
      minimum !== undefined
      && (
        !Number.isInteger(minimum)
        || Number(minimum) > maximum
      )
    )
  ) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_profile_maximum_invalid:${path}.${keyword}`,
    )
  }
  node[keyword] = maximum
}

function calculateCanonicalJsonUtf8UpperBound(
  input: unknown,
  path: string,
): number {
  const node = schemaNode(input, path)
  if (Array.isArray(node.enum)) {
    if (node.enum.length === 0) {
      throw new Error(
        `canonical_living_frame_preapproval_kimi_output_bound_empty_enum:${path}`,
      )
    }
    return Math.max(...node.enum.map(jsonValueByteLength))
  }
  if (Object.hasOwn(node, 'const')) {
    return jsonValueByteLength(node.const)
  }
  if (Array.isArray(node.anyOf)) {
    return Math.max(
      ...node.anyOf.map((branch, index) =>
        calculateCanonicalJsonUtf8UpperBound(
          branch,
          `${path}.anyOf[${index}]`,
        ),
      ),
    )
  }
  switch (node.type) {
    case 'null':
      return 4
    case 'boolean':
      return 5
    case 'integer':
    case 'number':
      return MAXIMUM_CANONICAL_FINITE_NUMBER_UTF8_BYTES
    case 'string': {
      const maximumLength = node.maxLength
      if (!Number.isInteger(maximumLength)) {
        throw new Error(
          `canonical_living_frame_preapproval_kimi_output_bound_unbounded_string:${path}`,
        )
      }
      const bytesPerCharacter = canonicalStringBytesPerCharacter(
        node.pattern,
        path,
      )
      return safeAdd(
        2,
        safeMultiply(Number(maximumLength), bytesPerCharacter, path),
        path,
      )
    }
    case 'array': {
      const maximumItems = node.maxItems
      if (!Number.isInteger(maximumItems)) {
        throw new Error(
          `canonical_living_frame_preapproval_kimi_output_bound_unbounded_array:${path}`,
        )
      }
      const count = Number(maximumItems)
      if (count === 0) return 2
      const itemBytes = calculateCanonicalJsonUtf8UpperBound(
        node.items,
        `${path}.items`,
      )
      return safeAdd(
        2,
        safeAdd(
          safeMultiply(count, itemBytes, path),
          count - 1,
          path,
        ),
        path,
      )
    }
    case 'object': {
      const properties = objectProperties(node, path)
      if (!Array.isArray(node.required)) {
        throw new Error(
          `canonical_living_frame_preapproval_kimi_output_bound_optional_object:${path}`,
        )
      }
      const propertyNames = Object.keys(properties)
      const requiredNames = new Set(node.required)
      if (
        node.additionalProperties !== false
        || requiredNames.size !== node.required.length
        || propertyNames.length !== requiredNames.size
        || propertyNames.some((propertyName) =>
          !requiredNames.has(propertyName))
      ) {
        throw new Error(
          `canonical_living_frame_preapproval_kimi_output_bound_open_or_optional_object:${path}`,
        )
      }
      let total = 2
      for (
        const [index, propertyName]
        of node.required.entries()
      ) {
        if (
          typeof propertyName !== 'string'
          || !Object.hasOwn(properties, propertyName)
        ) {
          throw new Error(
            `canonical_living_frame_preapproval_kimi_output_bound_required_property_invalid:${path}`,
          )
        }
        total = safeAdd(
          total,
          (index === 0 ? 0 : 1)
          + jsonValueByteLength(propertyName)
          + 1
          + calculateCanonicalJsonUtf8UpperBound(
            properties[propertyName],
            `${path}.${propertyName}`,
          ),
          path,
        )
      }
      return total
    }
    default:
      throw new Error(
        `canonical_living_frame_preapproval_kimi_output_bound_type_unsupported:${path}`,
      )
  }
}

function canonicalStringBytesPerCharacter(
  pattern: unknown,
  path: string,
): number {
  if (pattern === undefined) return 6
  if (
    pattern === SAFE_ID_PATTERN
    || pattern === SHA256_PATTERN
  ) {
    return 1
  }
  throw new Error(
    `canonical_living_frame_preapproval_kimi_output_bound_pattern_unsupported:${path}`,
  )
}

function calculateTokenCostMicros(input: {
  readonly tokens: number
  readonly microsPerMillionTokens: number
}): bigint {
  const numerator =
    BigInt(input.tokens)
    * BigInt(input.microsPerMillionTokens)
  return (numerator + MILLION - 1n) / MILLION
}

function objectProperties(
  input: unknown,
  path: string,
): Record<string, unknown> {
  const node = schemaNode(input, path)
  if (node.type !== 'object' || !isPlainRecord(node.properties)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_profile_object_invalid:${path}`,
    )
  }
  return node.properties
}

function arrayNode(
  input: unknown,
  path: string,
): Record<string, unknown> & { items: unknown } {
  const node = schemaNode(input, path)
  if (node.type !== 'array' || !Object.hasOwn(node, 'items')) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_profile_array_invalid:${path}`,
    )
  }
  return node as Record<string, unknown> & { items: unknown }
}

function schemaNode(
  input: unknown,
  path: string,
): Record<string, unknown> {
  if (!isPlainRecord(input)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_profile_node_invalid:${path}`,
    )
  }
  return input
}

function jsonValueByteLength(value: unknown): number {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_output_bound_json_value_invalid',
    )
  }
  return Buffer.byteLength(serialized, 'utf8')
}

function safeAdd(
  left: number,
  right: number,
  path: string,
): number {
  const result = left + right
  if (!Number.isSafeInteger(result)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_bound_overflow:${path}`,
    )
  }
  return result
}

function safeMultiply(
  left: number,
  right: number,
  path: string,
): number {
  const result = left * right
  if (!Number.isSafeInteger(result)) {
    throw new Error(
      `canonical_living_frame_preapproval_kimi_output_bound_overflow:${path}`,
    )
  }
  return result
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  )
}

function isPlainRecord(
  input: unknown,
): input is Record<string, unknown> {
  return typeof input === 'object'
    && input !== null
    && !Array.isArray(input)
}
