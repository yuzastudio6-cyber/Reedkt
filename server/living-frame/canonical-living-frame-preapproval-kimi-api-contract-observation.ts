import { z } from 'zod'

import {
  verifyCanonicalLivingFramePreapprovalKimiRequestMaterial,
  type CanonicalLivingFramePreapprovalKimiRequestMaterial,
} from './canonical-living-frame-preapproval-kimi-request-material'
import {
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
} from './canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  type CanonicalLivingFramePreapprovalReasoningRun,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_CONTRACT_OBSERVATION_VERSION = (
  'canonical-living-frame-preapproval-kimi-api-contract-observation-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_COMPATIBILITY_VERSION = (
  'canonical-living-frame-preapproval-kimi-api-compatibility-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVED_AT = (
  '2026-07-27T20:48:07.000Z'
) as const

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)

const OFFICIAL_DOCUMENT_SPECS = [
  {
    documentId: 'kimi_k3_quickstart',
    sourceUrl:
      'https://platform.kimi.ai/docs/guide/kimi-k3-quickstart.md',
    documentSha256:
      '41097a2bbb33c6fba0ede219568a0287abdd7bb87f00d61cb9ff10245b2cbfb9',
    byteLength: 17_434,
  },
  {
    documentId: 'chat_completions_api',
    sourceUrl: 'https://platform.kimi.ai/docs/api/chat.md',
    documentSha256:
      'e64b370c1b355dccc8ca4392a20ff1015352d3d87dd3791a0caed32e850ad03d',
    byteLength: 63_321,
  },
  {
    documentId: 'structured_output',
    sourceUrl:
      'https://platform.kimi.ai/docs/guide/response_format.md',
    documentSha256:
      'f18a97850f169aaef7caf6e68e85a91ac37c91125075f2040ca433ed0c52d639',
    byteLength: 15_697,
  },
  {
    documentId: 'reasoning_effort',
    sourceUrl:
      'https://platform.kimi.ai/docs/guide/use-reasoning-effort.md',
    documentSha256:
      '5276976f3f7d3ef76ecf1842afef16b8270dbc42f33c535b9e2754410c1d4e48',
    byteLength: 3_065,
  },
  {
    documentId: 'api_overview',
    sourceUrl: 'https://platform.kimi.ai/docs/api/overview.md',
    documentSha256:
      'c592389915ab10e616f65f9511eb1f43dd968412933a96ee3004a471d82e2aa6',
    byteLength: 4_739,
  },
  {
    documentId: 'api_errors',
    sourceUrl: 'https://platform.kimi.ai/docs/api/errors.md',
    documentSha256:
      '9503bbfad06bf7250cdd24615c23e8540099fc1f29234bac52a0d366d4790811',
    byteLength: 10_771,
  },
  {
    documentId: 'automatic_reconnect',
    sourceUrl:
      'https://platform.kimi.ai/docs/guide/auto-reconnect.md',
    documentSha256:
      'c18a1a91d3dc68907137f92a919562a342ecc65d0b21be67d5cd11cb0c44fc58',
    byteLength: 2_759,
  },
  {
    documentId: 'list_models',
    sourceUrl: 'https://platform.kimi.ai/docs/api/list-models.md',
    documentSha256:
      'fc7ecbf702303af7a0b915217fb51b497e3d6076e1405e3eba24543e773ff3cf',
    byteLength: 6_507,
  },
  {
    documentId: 'openapi',
    sourceUrl: 'https://platform.kimi.ai/docs/openapi.json',
    documentSha256:
      'd12471fbfbd0a38c440f19d978657797febeeda21952f81ed446f72081e1f738',
    byteLength: 86_534,
  },
  {
    documentId: 'kimi_k3_pricing',
    sourceUrl: 'https://platform.kimi.ai/docs/pricing/chat-k3.md',
    documentSha256:
      '46b6b081a39180a75bb3a60547973eff92e61c1d8227a04106b635e1b56ab711',
    byteLength: 2_980,
  },
] as const

const officialDocumentSchema = z.object({
  documentId: z.enum([
    'kimi_k3_quickstart',
    'chat_completions_api',
    'structured_output',
    'reasoning_effort',
    'api_overview',
    'api_errors',
    'automatic_reconnect',
    'list_models',
    'openapi',
    'kimi_k3_pricing',
  ]),
  sourceUrl: z.string().url(),
  documentSha256: sha256Schema,
  byteLength: z.number().int().positive().max(1_000_000),
  capturedAt: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVED_AT,
  ),
  authorityClass: z.literal(
    'official_provider_document_observation',
  ),
}).strict()

const authorityBoundarySchema = z.object({
  controlledOfficialSourceObservationAuthority: z.literal(true),
  sourceObservedApiShapeAssessmentAuthority: z.literal(true),
  currentSourceAuthorityAtTransport: z.literal(false),
  providerApiContractQualificationAuthority: z.literal(false),
  providerModelRevisionQualificationAuthority: z.literal(false),
  providerAccountAvailabilityAuthority: z.literal(false),
  providerSchemaCompatibilityAuthority: z.literal(false),
  providerRequestReservationAuthority: z.literal(false),
  oneUseSubmissionAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerObservationAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
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

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVATION_BOUNDARY =
  Object.freeze({
    controlledOfficialSourceObservationAuthority: true as const,
    sourceObservedApiShapeAssessmentAuthority: true as const,
    currentSourceAuthorityAtTransport: false as const,
    providerApiContractQualificationAuthority: false as const,
    providerModelRevisionQualificationAuthority: false as const,
    providerAccountAvailabilityAuthority: false as const,
    providerSchemaCompatibilityAuthority: false as const,
    providerRequestReservationAuthority: false as const,
    oneUseSubmissionAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCredentialAuthority: false as const,
    providerCallAuthority: false as const,
    providerObservationAuthority: false as const,
    providerAttemptCostAuthority: false as const,
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

const observationDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_CONTRACT_OBSERVATION_VERSION,
  ),
  recordClass: z.literal(
    'controlled_official_kimi_api_contract_observation',
  ),
  state: z.literal('source_observed_transport_blocked'),
  observedAt: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVED_AT,
  ),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  officialDocuments: z.array(officialDocumentSchema)
    .length(OFFICIAL_DOCUMENT_SPECS.length),
  providerIdentity: z.object({
    provider: z.literal('moonshot_ai'),
    serviceBaseUrl: z.literal('https://api.moonshot.ai'),
    apiBaseUrl: z.literal('https://api.moonshot.ai/v1'),
    apiFamily: z.literal('openai_compatible_chat_completions'),
    openApiDeclaredVersion: z.literal('1.0.0'),
    observedApiContractIdentity: z.literal(
      'moonshot-openapi-1.0.0+d12471fbfbd0a38c',
    ),
    exactProviderModelId: z.literal('kimi-k3'),
    modelIdentityClass: z.literal(
      'mutable_provider_model_id_without_immutable_revision',
    ),
    immutableProviderModelRevision: z.null(),
    providerModelAggregateSha256: z.null(),
    modelListCreatedTimestampIsRevisionAuthority: z.literal(false),
    currentAccountModelAvailabilityRereadRequired: z.literal(true),
  }).strict(),
  requestContract: z.object({
    method: z.literal('POST'),
    path: z.literal('/v1/chat/completions'),
    contentType: z.literal('application/json'),
    authorization: z.literal('bearer_server_secret'),
    modelField: z.literal('kimi-k3'),
    messagesField: z.literal(
      'ordered_system_and_user_string_messages',
    ),
    internalUserJsonEncoding: z.literal(
      'stable_canonical_json_string',
    ),
    reasoningEffortField: z.literal('reasoning_effort'),
    reasoningEffortValue: z.literal('max'),
    streamField: z.literal(false),
    responseFormatType: z.literal('json_schema'),
    responseFormatStrict: z.literal(true),
    responseSchemaDialect: z.literal(
      'moonshot_flavored_json_schema',
    ),
    toolsFieldDisposition: z.literal('omit_empty_tools'),
    samplingFieldsDisposition: z.tuple([
      z.literal('temperature_omitted_fixed_1_0'),
      z.literal('top_p_omitted_fixed_0_95'),
      z.literal('n_omitted_fixed_1'),
      z.literal('presence_penalty_omitted_fixed_0'),
      z.literal('frequency_penalty_omitted_fixed_0'),
    ]),
    providerDefaultMaximumCompletionTokens: z.literal(131_072),
    providerMaximumCompletionTokens: z.literal(1_048_576),
    canonicalMaximumCompletionTokens: z.null(),
    canonicalCompletionTokenCeilingRequired: z.literal(true),
  }).strict(),
  responseContract: z.object({
    successObject: z.literal('chat.completion'),
    completionIdReturnedOnSuccess: z.literal(true),
    completionLookupEndpointDocumented: z.literal(false),
    requestIdCorrelationContractDocumented: z.literal(false),
    responseModelStringReturned: z.literal(true),
    immutableModelRevisionReturned: z.literal(false),
    finalContentPath: z.literal('choices[0].message.content'),
    reasoningContentPath: z.literal(
      'choices[0].message.reasoning_content',
    ),
    reasoningContentMustNotBeParsedOrPersisted: z.literal(true),
    usageObjectDocumented: z.literal(true),
    usageRequiredByOpenApiSchema: z.literal(false),
    successfulFinishReasonRequired: z.literal('stop'),
    lengthAndToolCallFinishReasonsRejected: z.literal(true),
  }).strict(),
  deliverySemantics: z.object({
    providerIdempotencyHeaderDocumented: z.literal(false),
    providerIdempotencyBodyFieldDocumented: z.literal(false),
    synchronousCompletionRetrievalDocumented: z.literal(false),
    batchRetrievalApplicableToSynchronousRequest: z.literal(false),
    automaticReconnectExampleResubmitsRequests: z.literal(true),
    automaticReconnectSafeForCanonicalOneUseAttempt:
      z.literal(false),
    unknownOutcomeMustBlockResubmissionAndFallback:
      z.literal(true),
  }).strict(),
  sourceAssessment: z.object({
    providerApiShapeObserved: z.literal(true),
    exactModelIdObserved: z.literal(true),
    strictStructuredOutputObserved: z.literal(true),
    nonStreamingRequestObserved: z.literal(true),
    internalRequestMaterialMappingObserved: z.literal(true),
    currentProviderApiContractQualified: z.literal(false),
    immutableProviderModelRevisionQualified: z.literal(false),
    currentAccountModelAvailabilityQualified: z.literal(false),
    exactSchemaMfjsCompatibilityQualified: z.literal(false),
    liveTargetSchemaProbeCompleted: z.literal(false),
    boundedCompletionTokenPolicyQualified: z.literal(false),
    safeUnknownOutcomeReconciliationQualified: z.literal(false),
    executable: z.literal(false),
  }).strict(),
  runtimeBlockers: z.tuple([
    z.literal('current_official_source_reread_required'),
    z.literal('current_account_model_availability_required'),
    z.literal('immutable_provider_model_revision_required'),
    z.literal('exact_schema_mfjs_validation_required'),
    z.literal('live_target_schema_probe_required'),
    z.literal('canonical_completion_token_ceiling_required'),
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

export const canonicalLivingFramePreapprovalKimiApiContractObservationSchema =
  observationDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export type CanonicalLivingFramePreapprovalKimiApiContractObservation =
  z.infer<
    typeof canonicalLivingFramePreapprovalKimiApiContractObservationSchema
  >

const compatibilityDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_COMPATIBILITY_VERSION,
  ),
  recordClass: z.literal(
    'controlled_kimi_api_request_material_compatibility_assessment',
  ),
  state: z.literal('compatible_shape_transport_blocked'),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  canonicalBindings: z.object({
    requestMaterialRecordDigestSha256: sha256Schema,
    officialApiObservationRecordDigestSha256: sha256Schema,
    outputJsonSchemaDigestSha256: sha256Schema,
    openApiDocumentSha256: sha256Schema,
  }).strict(),
  requestMapping: z.object({
    endpoint: z.literal(
      'https://api.moonshot.ai/v1/chat/completions',
    ),
    method: z.literal('POST'),
    model: z.literal('kimi-k3'),
    systemMessageEncoding: z.literal('literal_utf8_string'),
    userMessageEncoding: z.literal('stable_canonical_json_string'),
    responseFormatType: z.literal('json_schema'),
    responseFormatStrict: z.literal(true),
    reasoningEffort: z.literal('max'),
    stream: z.literal(false),
    toolsOmitted: z.literal(true),
    samplingFieldsOmitted: z.literal(true),
    maximumCompletionTokens: z.null(),
  }).strict(),
  assessment: z.object({
    exactRouteAndModelMatch: z.literal(true),
    orderedMessagesMappable: z.literal(true),
    strictSchemaMappable: z.literal(true),
    noToolRequestMappable: z.literal(true),
    sourceObservedApiShapeCompatible: z.literal(true),
    exactSchemaMfjsCompatibilityQualified: z.literal(false),
    liveTargetSchemaProbeCompleted: z.literal(false),
    canonicalCompletionTokenCeilingQualified: z.literal(false),
    currentProviderApiContractQualified: z.literal(false),
    immutableProviderModelRevisionQualified: z.literal(false),
    providerRequestBodyCreated: z.literal(false),
    providerTransportAuthorized: z.literal(false),
    executable: z.literal(false),
  }).strict(),
  runtimeBlockers:
    observationDraftSchema.shape.runtimeBlockers,
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalKimiApiCompatibilitySchema =
  compatibilityDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export type CanonicalLivingFramePreapprovalKimiApiCompatibility =
  z.infer<
    typeof canonicalLivingFramePreapprovalKimiApiCompatibilitySchema
  >

const EXPECTED_OBSERVATION_DRAFT =
  observationDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_CONTRACT_OBSERVATION_VERSION,
    recordClass:
      'controlled_official_kimi_api_contract_observation',
    state: 'source_observed_transport_blocked',
    observedAt:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVED_AT,
    promotionAllowed: false,
    productionReady: false,
    officialDocuments: OFFICIAL_DOCUMENT_SPECS.map((document) => ({
      ...document,
      capturedAt:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVED_AT,
      authorityClass:
        'official_provider_document_observation' as const,
    })),
    providerIdentity: {
      provider: 'moonshot_ai',
      serviceBaseUrl: 'https://api.moonshot.ai',
      apiBaseUrl: 'https://api.moonshot.ai/v1',
      apiFamily: 'openai_compatible_chat_completions',
      openApiDeclaredVersion: '1.0.0',
      observedApiContractIdentity:
        'moonshot-openapi-1.0.0+d12471fbfbd0a38c',
      exactProviderModelId: 'kimi-k3',
      modelIdentityClass:
        'mutable_provider_model_id_without_immutable_revision',
      immutableProviderModelRevision: null,
      providerModelAggregateSha256: null,
      modelListCreatedTimestampIsRevisionAuthority: false,
      currentAccountModelAvailabilityRereadRequired: true,
    },
    requestContract: {
      method: 'POST',
      path: '/v1/chat/completions',
      contentType: 'application/json',
      authorization: 'bearer_server_secret',
      modelField: 'kimi-k3',
      messagesField: 'ordered_system_and_user_string_messages',
      internalUserJsonEncoding: 'stable_canonical_json_string',
      reasoningEffortField: 'reasoning_effort',
      reasoningEffortValue: 'max',
      streamField: false,
      responseFormatType: 'json_schema',
      responseFormatStrict: true,
      responseSchemaDialect: 'moonshot_flavored_json_schema',
      toolsFieldDisposition: 'omit_empty_tools',
      samplingFieldsDisposition: [
        'temperature_omitted_fixed_1_0',
        'top_p_omitted_fixed_0_95',
        'n_omitted_fixed_1',
        'presence_penalty_omitted_fixed_0',
        'frequency_penalty_omitted_fixed_0',
      ],
      providerDefaultMaximumCompletionTokens: 131_072,
      providerMaximumCompletionTokens: 1_048_576,
      canonicalMaximumCompletionTokens: null,
      canonicalCompletionTokenCeilingRequired: true,
    },
    responseContract: {
      successObject: 'chat.completion',
      completionIdReturnedOnSuccess: true,
      completionLookupEndpointDocumented: false,
      requestIdCorrelationContractDocumented: false,
      responseModelStringReturned: true,
      immutableModelRevisionReturned: false,
      finalContentPath: 'choices[0].message.content',
      reasoningContentPath:
        'choices[0].message.reasoning_content',
      reasoningContentMustNotBeParsedOrPersisted: true,
      usageObjectDocumented: true,
      usageRequiredByOpenApiSchema: false,
      successfulFinishReasonRequired: 'stop',
      lengthAndToolCallFinishReasonsRejected: true,
    },
    deliverySemantics: {
      providerIdempotencyHeaderDocumented: false,
      providerIdempotencyBodyFieldDocumented: false,
      synchronousCompletionRetrievalDocumented: false,
      batchRetrievalApplicableToSynchronousRequest: false,
      automaticReconnectExampleResubmitsRequests: true,
      automaticReconnectSafeForCanonicalOneUseAttempt: false,
      unknownOutcomeMustBlockResubmissionAndFallback: true,
    },
    sourceAssessment: {
      providerApiShapeObserved: true,
      exactModelIdObserved: true,
      strictStructuredOutputObserved: true,
      nonStreamingRequestObserved: true,
      internalRequestMaterialMappingObserved: true,
      currentProviderApiContractQualified: false,
      immutableProviderModelRevisionQualified: false,
      currentAccountModelAvailabilityQualified: false,
      exactSchemaMfjsCompatibilityQualified: false,
      liveTargetSchemaProbeCompleted: false,
      boundedCompletionTokenPolicyQualified: false,
      safeUnknownOutcomeReconciliationQualified: false,
      executable: false,
    },
    runtimeBlockers: [
      'current_official_source_reread_required',
      'current_account_model_availability_required',
      'immutable_provider_model_revision_required',
      'exact_schema_mfjs_validation_required',
      'live_target_schema_probe_required',
      'canonical_completion_token_ceiling_required',
      'distributed_one_use_lifecycle_required',
      'provider_credential_capability_required',
      'unknown_outcome_operator_reconciliation_required',
    ],
    browserShareable: false,
    providerCallMade: false,
    credentialReadMade: false,
    remoteMutationMade: false,
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVATION_BOUNDARY,
  })

export function createCanonicalLivingFramePreapprovalKimiApiContractObservation(
): CanonicalLivingFramePreapprovalKimiApiContractObservation {
  return verifyCanonicalLivingFramePreapprovalKimiApiContractObservation({
    ...EXPECTED_OBSERVATION_DRAFT,
    recordDigestSha256:
      sha256AuthorityValue(EXPECTED_OBSERVATION_DRAFT),
  })
}

export function verifyCanonicalLivingFramePreapprovalKimiApiContractObservation(
  input: unknown,
): CanonicalLivingFramePreapprovalKimiApiContractObservation {
  const observation =
    canonicalLivingFramePreapprovalKimiApiContractObservationSchema
      .parse(input)
  const {
    recordDigestSha256,
    ...draft
  } = observation
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(draft) !==
      stableAuthorityStringify(EXPECTED_OBSERVATION_DRAFT)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_api_observation_invalid',
    )
  }
  return structuredClone(observation)
}

export function assessCanonicalLivingFramePreapprovalKimiApiCompatibility(
  input: {
    readonly requestMaterial:
      CanonicalLivingFramePreapprovalKimiRequestMaterial
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
    readonly apiObservation:
      CanonicalLivingFramePreapprovalKimiApiContractObservation
  },
): CanonicalLivingFramePreapprovalKimiApiCompatibility {
  const requestMaterial =
    verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
      material: input.requestMaterial,
      preparedRun: input.preparedRun,
      attemptReservation: input.attemptReservation,
    })
  const apiObservation =
    verifyCanonicalLivingFramePreapprovalKimiApiContractObservation(
      input.apiObservation,
    )
  const draft = createExpectedCompatibilityDraft({
    requestMaterial,
    apiObservation,
  })
  return verifyCanonicalLivingFramePreapprovalKimiApiCompatibility({
    compatibility: {
      ...draft,
      recordDigestSha256: sha256AuthorityValue(draft),
    },
    requestMaterial,
    preparedRun: input.preparedRun,
    attemptReservation: input.attemptReservation,
    apiObservation,
  })
}

export function verifyCanonicalLivingFramePreapprovalKimiApiCompatibility(
  input: {
    readonly compatibility: unknown
    readonly requestMaterial: unknown
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
    readonly apiObservation: unknown
  },
): CanonicalLivingFramePreapprovalKimiApiCompatibility {
  const compatibility =
    canonicalLivingFramePreapprovalKimiApiCompatibilitySchema
      .parse(input.compatibility)
  const requestMaterial =
    verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
      material: input.requestMaterial,
      preparedRun: input.preparedRun,
      attemptReservation: input.attemptReservation,
    })
  const apiObservation =
    verifyCanonicalLivingFramePreapprovalKimiApiContractObservation(
      input.apiObservation,
    )
  const {
    recordDigestSha256,
    ...draft
  } = compatibility
  const expected = createExpectedCompatibilityDraft({
    requestMaterial,
    apiObservation,
  })
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(draft) !==
      stableAuthorityStringify(expected)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_api_compatibility_invalid',
    )
  }
  return structuredClone(compatibility)
}

function createExpectedCompatibilityDraft(input: {
  requestMaterial:
    CanonicalLivingFramePreapprovalKimiRequestMaterial
  apiObservation:
    CanonicalLivingFramePreapprovalKimiApiContractObservation
}): z.infer<typeof compatibilityDraftSchema> {
  const openApiDocument = input.apiObservation.officialDocuments
    .find((document) => document.documentId === 'openapi')
  if (!openApiDocument) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_openapi_observation_missing',
    )
  }
  return compatibilityDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_COMPATIBILITY_VERSION,
    recordClass:
      'controlled_kimi_api_request_material_compatibility_assessment',
    state: 'compatible_shape_transport_blocked',
    promotionAllowed: false,
    productionReady: false,
    canonicalBindings: {
      requestMaterialRecordDigestSha256:
        input.requestMaterial.recordDigestSha256,
      officialApiObservationRecordDigestSha256:
        input.apiObservation.recordDigestSha256,
      outputJsonSchemaDigestSha256:
        input.requestMaterial.canonicalBindings
          .outputJsonSchemaDigestSha256,
      openApiDocumentSha256: openApiDocument.documentSha256,
    },
    requestMapping: {
      endpoint: 'https://api.moonshot.ai/v1/chat/completions',
      method: 'POST',
      model: 'kimi-k3',
      systemMessageEncoding: 'literal_utf8_string',
      userMessageEncoding: 'stable_canonical_json_string',
      responseFormatType: 'json_schema',
      responseFormatStrict: true,
      reasoningEffort: 'max',
      stream: false,
      toolsOmitted: true,
      samplingFieldsOmitted: true,
      maximumCompletionTokens: null,
    },
    assessment: {
      exactRouteAndModelMatch: true,
      orderedMessagesMappable: true,
      strictSchemaMappable: true,
      noToolRequestMappable: true,
      sourceObservedApiShapeCompatible: true,
      exactSchemaMfjsCompatibilityQualified: false,
      liveTargetSchemaProbeCompleted: false,
      canonicalCompletionTokenCeilingQualified: false,
      currentProviderApiContractQualified: false,
      immutableProviderModelRevisionQualified: false,
      providerRequestBodyCreated: false,
      providerTransportAuthorized: false,
      executable: false,
    },
    runtimeBlockers: input.apiObservation.runtimeBlockers,
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_API_OBSERVATION_BOUNDARY,
  })
}
