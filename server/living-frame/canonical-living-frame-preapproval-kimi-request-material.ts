import { z } from 'zod'

import {
  getReEditProReasoningModelRoute,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  canonicalLivingFrameSemanticReasoningAdmissionSchema,
} from './canonical-living-frame-semantic-reasoning-admission'
import {
  assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches,
  verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation,
  type CanonicalLivingFramePreapprovalReasoningAttemptReservation,
} from './canonical-living-frame-preapproval-reasoning-attempt-reservation'
import {
  verifyCanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRun,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_VERSION = (
  'canonical-living-frame-preapproval-kimi-request-material-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_ADAPTER_ID = (
  'living-frame-kimi-k3-preapproval-request-material-adapter-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_SYSTEM_INSTRUCTION = (
  'Return exactly one JSON object that satisfies the supplied strict schema. Use only the bounded semantic evidence in the request. Do not emit hidden reasoning, raw evidence, provider or tool choices, exact timing, approval, snapshot, work, queue, rendering, runtime, or production authority.'
) as const

const MAXIMUM_REQUEST_MATERIAL_BYTES = 4_194_304
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))

const authorityBoundarySchema = z.object({
  providerSpecificRequestMaterialCompilationAuthority: z.literal(true),
  currentSourceAuthorityAtTransport: z.literal(false),
  providerApiContractQualificationAuthority: z.literal(false),
  providerModelRevisionQualificationAuthority: z.literal(false),
  providerRequestReservationAuthority: z.literal(false),
  oneUseSubmissionAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerObservationAuthority: z.literal(false),
  checkbackAuthority: z.literal(false),
  fallbackAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  creditReservationAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_BOUNDARY =
  Object.freeze({
    providerSpecificRequestMaterialCompilationAuthority: true as const,
    currentSourceAuthorityAtTransport: false as const,
    providerApiContractQualificationAuthority: false as const,
    providerModelRevisionQualificationAuthority: false as const,
    providerRequestReservationAuthority: false as const,
    oneUseSubmissionAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCredentialAuthority: false as const,
    providerCallAuthority: false as const,
    providerObservationAuthority: false as const,
    checkbackAuthority: false as const,
    fallbackAuthority: false as const,
    providerAttemptCostAuthority: false as const,
    reasoningResultAuthority: false as const,
    selectedSceneAuthority: false as const,
    timingAuthority: false as const,
    soundAuthority: false as const,
    estimateAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    creditReservationAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workGraphAuthority: false as const,
    queueAuthority: false as const,
    toolRouteAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const internalRequestMaterialSchema = z.object({
  materialProtocol:
    z.literal('canonical_internal_structured_messages_v1'),
  route: z.object({
    routeContractVersion: z.literal(
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    ),
    routeId: z.literal('kimi_k3_primary'),
    routeRole: z.literal('primary'),
    provider: z.literal('moonshot_ai'),
    modelRoleId: z.literal('kimi_k3_main_edit_agent'),
    exactProviderModelId: z.literal('kimi-k3'),
    providerBoundary: z.literal('kimi_k3_provider_boundary'),
  }).strict(),
  providerApiContractVersion: z.null(),
  providerModelRevision: z.null(),
  providerModelAggregateSha256: z.null(),
  messages: z.tuple([
    z.object({
      role: z.literal('system'),
      contentType: z.literal('server_owned_instruction'),
      content: z.literal(
        CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_SYSTEM_INSTRUCTION,
      ),
    }).strict(),
    z.object({
      role: z.literal('user'),
      contentType: z.literal('canonical_provider_neutral_json'),
      content:
        canonicalLivingFrameSemanticReasoningAdmissionSchema.shape
          .providerNeutralPayload,
    }).strict(),
  ]),
  responseContract: z.object({
    kind: z.literal('strict_json_schema'),
    schemaName: z.literal(
      'living_frame_semantic_scene_proposal_result_v1',
    ),
    strict: z.literal(true),
    jsonSchema: z.record(z.string(), z.unknown()),
    jsonSchemaDigestSha256: sha256Schema,
  }).strict(),
  tools: z.tuple([]),
  samplingOverridesOmitted: z.literal(true),
  hiddenReasoningRequested: z.literal(false),
  streamingRequested: z.literal(false),
  rawTranscriptIncluded: z.literal(false),
  rawMediaIncluded: z.literal(false),
}).strict()

const requestMaterialDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_VERSION,
  ),
  adapterId: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_ADAPTER_ID,
  ),
  recordClass: z.literal(
    'private_process_bound_preapproval_provider_request_material',
  ),
  state: z.literal(
    'compiled_provider_api_and_model_revision_unqualified',
  ),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  identity:
    canonicalLivingFrameSemanticReasoningAdmissionSchema.shape.identity,
  reasoningRunId: safeIdentitySchema,
  attemptId: safeIdentitySchema,
  canonicalSourcePreparedAt: z.string().datetime({ offset: true }),
  canonicalBindings: z.object({
    preparedRunRecordDigestSha256: sha256Schema,
    preparedProviderEnvelopeDigestSha256: sha256Schema,
    attemptReservationRecordDigestSha256: sha256Schema,
    semanticAdmissionContractDigestSha256: sha256Schema,
    providerNeutralPayloadDigestSha256: sha256Schema,
    outputJsonSchemaDigestSha256: sha256Schema,
    routeAuthorizationDigestSha256: sha256Schema,
    submissionIdempotencyKeyDigestSha256: sha256Schema,
    routeDataAssuranceContractDigestSha256: sha256Schema,
    internalCostBudgetAdmissionDigestSha256: sha256Schema,
  }).strict(),
  internalRequestMaterial: internalRequestMaterialSchema,
  internalRequestMaterialByteLength: z.number().int().positive()
    .max(MAXIMUM_REQUEST_MATERIAL_BYTES),
  internalRequestMaterialDigestSha256: sha256Schema,
  providerSpecificMaterialCompiled: z.literal(true),
  currentSourceAuthorityRereadAtTransportRequired: z.literal(true),
  providerApiRequestBodyCreated: z.literal(false),
  providerApiContractQualified: z.literal(false),
  providerModelRevisionQualified: z.literal(false),
  providerRequestRecordCreated: z.literal(false),
  providerSubmissionAuthorityIssued: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  requestMaterialPersisted: z.literal(false),
  requestMaterialBrowserShareable: z.literal(false),
  requestMaterialLoggable: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  remoteMutationMade: z.literal(false),
  runtimeBlockers: z.tuple([
    z.literal('current_source_authority_reread_required'),
    z.literal('provider_api_contract_qualification_required'),
    z.literal('immutable_provider_model_revision_required'),
    z.literal('distributed_reasoning_lifecycle_required'),
    z.literal('provider_credential_capability_required'),
    z.literal('one_use_submission_authority_required'),
  ]),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalKimiRequestMaterialSchema =
  requestMaterialDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export type CanonicalLivingFramePreapprovalKimiRequestMaterial =
  z.infer<
    typeof canonicalLivingFramePreapprovalKimiRequestMaterialSchema
  >

export function compileCanonicalLivingFramePreapprovalKimiRequestMaterial(
  input: {
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly attemptReservation:
      CanonicalLivingFramePreapprovalReasoningAttemptReservation
  },
): CanonicalLivingFramePreapprovalKimiRequestMaterial {
  const preparedRun =
    verifyCanonicalLivingFramePreapprovalReasoningRun(
      input.preparedRun,
    )
  const attemptReservation =
    assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches({
      reservation: input.attemptReservation,
      preparedRun,
      currentSemanticAdmission: preparedRun.semanticAdmission,
    })
  const internalRequestMaterial =
    createExpectedInternalRequestMaterial(preparedRun)
  const internalRequestMaterialText =
    stableAuthorityStringify(internalRequestMaterial)
  const draft = requestMaterialDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_VERSION,
    adapterId:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_ADAPTER_ID,
    recordClass:
      'private_process_bound_preapproval_provider_request_material',
    state:
      'compiled_provider_api_and_model_revision_unqualified',
    promotionAllowed: false,
    productionReady: false,
    identity: preparedRun.identity,
    reasoningRunId: preparedRun.reasoningRunId,
    attemptId: attemptReservation.attemptControl.attemptId,
    canonicalSourcePreparedAt: preparedRun.canonicalPreparedAt,
    canonicalBindings: createExpectedBindings({
      preparedRun,
      attemptReservation,
    }),
    internalRequestMaterial,
    internalRequestMaterialByteLength:
      Buffer.byteLength(internalRequestMaterialText, 'utf8'),
    internalRequestMaterialDigestSha256:
      sha256AuthorityValue(internalRequestMaterial),
    providerSpecificMaterialCompiled: true,
    currentSourceAuthorityRereadAtTransportRequired: true,
    providerApiRequestBodyCreated: false,
    providerApiContractQualified: false,
    providerModelRevisionQualified: false,
    providerRequestRecordCreated: false,
    providerSubmissionAuthorityIssued: false,
    providerCallMade: false,
    credentialReadMade: false,
    requestMaterialPersisted: false,
    requestMaterialBrowserShareable: false,
    requestMaterialLoggable: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    runtimeBlockers: [
      'current_source_authority_reread_required',
      'provider_api_contract_qualification_required',
      'immutable_provider_model_revision_required',
      'distributed_reasoning_lifecycle_required',
      'provider_credential_capability_required',
      'one_use_submission_authority_required',
    ],
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_REQUEST_MATERIAL_BOUNDARY,
  })
  return verifyCanonicalLivingFramePreapprovalKimiRequestMaterial({
    material: {
      ...draft,
      recordDigestSha256: sha256AuthorityValue(draft),
    },
    preparedRun,
    attemptReservation,
  })
}

export function verifyCanonicalLivingFramePreapprovalKimiRequestMaterial(
  input: {
    readonly material: unknown
    readonly preparedRun: unknown
    readonly attemptReservation: unknown
  },
): CanonicalLivingFramePreapprovalKimiRequestMaterial {
  const material =
    canonicalLivingFramePreapprovalKimiRequestMaterialSchema
      .parse(input.material)
  const preparedRun =
    verifyCanonicalLivingFramePreapprovalReasoningRun(
      input.preparedRun,
    )
  const attemptReservation =
    verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
      input.attemptReservation,
    )
  assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches({
    reservation: attemptReservation,
    preparedRun,
    currentSemanticAdmission: preparedRun.semanticAdmission,
  })
  const {
    recordDigestSha256,
    ...draft
  } = material
  const expectedRequestMaterial =
    createExpectedInternalRequestMaterial(preparedRun)
  const expectedRequestMaterialText =
    stableAuthorityStringify(expectedRequestMaterial)
  const expectedBindings = createExpectedBindings({
    preparedRun,
    attemptReservation,
  })
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(material.identity) !==
      stableAuthorityStringify(preparedRun.identity)
    || material.reasoningRunId !== preparedRun.reasoningRunId
    || material.attemptId !==
      attemptReservation.attemptControl.attemptId
    || material.canonicalSourcePreparedAt !==
      preparedRun.canonicalPreparedAt
    || stableAuthorityStringify(material.canonicalBindings) !==
      stableAuthorityStringify(expectedBindings)
    || stableAuthorityStringify(material.internalRequestMaterial) !==
      expectedRequestMaterialText
    || material.internalRequestMaterialByteLength !==
      Buffer.byteLength(expectedRequestMaterialText, 'utf8')
    || material.internalRequestMaterialDigestSha256 !==
      sha256AuthorityValue(expectedRequestMaterial)
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_kimi_request_material_invalid',
    )
  }
  return structuredClone(material)
}

function createExpectedInternalRequestMaterial(
  preparedRun: CanonicalLivingFramePreapprovalReasoningRun,
): z.infer<typeof internalRequestMaterialSchema> {
  const route = getReEditProReasoningModelRoute('kimi_k3_primary')
  return internalRequestMaterialSchema.parse({
    materialProtocol:
      'canonical_internal_structured_messages_v1',
    route: {
      routeContractVersion:
        REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
      routeId: route.routeId,
      routeRole: route.routeRole,
      provider: route.provider,
      modelRoleId: route.modelRoleId,
      exactProviderModelId: route.exactProviderModelId,
      providerBoundary: route.providerBoundary,
    },
    providerApiContractVersion: null,
    providerModelRevision: null,
    providerModelAggregateSha256: null,
    messages: [
      {
        role: 'system',
        contentType: 'server_owned_instruction',
        content:
          CANONICAL_LIVING_FRAME_PREAPPROVAL_KIMI_SYSTEM_INSTRUCTION,
      },
      {
        role: 'user',
        contentType: 'canonical_provider_neutral_json',
        content:
          preparedRun.preparedProviderEnvelope.privatePayload
            .providerNeutralPayload,
      },
    ],
    responseContract: {
      kind: 'strict_json_schema',
      schemaName:
        'living_frame_semantic_scene_proposal_result_v1',
      strict: true,
      jsonSchema:
        preparedRun.preparedProviderEnvelope.privatePayload
          .strictOutputJsonSchema,
      jsonSchemaDigestSha256:
        preparedRun.preparedProviderEnvelope.canonicalBindings
          .outputJsonSchemaDigestSha256,
    },
    tools: [],
    samplingOverridesOmitted: true,
    hiddenReasoningRequested: false,
    streamingRequested: false,
    rawTranscriptIncluded: false,
    rawMediaIncluded: false,
  })
}

function createExpectedBindings(input: {
  preparedRun: CanonicalLivingFramePreapprovalReasoningRun
  attemptReservation:
    CanonicalLivingFramePreapprovalReasoningAttemptReservation
}) {
  const envelope = input.preparedRun.preparedProviderEnvelope
  return {
    preparedRunRecordDigestSha256:
      input.preparedRun.recordDigestSha256,
    preparedProviderEnvelopeDigestSha256:
      envelope.envelopeDigestSha256,
    attemptReservationRecordDigestSha256:
      input.attemptReservation.recordDigestSha256,
    semanticAdmissionContractDigestSha256:
      input.preparedRun.semanticAdmission.contractDigestSha256,
    providerNeutralPayloadDigestSha256:
      input.preparedRun.semanticAdmission.providerNeutralPayload
        .payloadDigestSha256,
    outputJsonSchemaDigestSha256:
      envelope.canonicalBindings.outputJsonSchemaDigestSha256,
    routeAuthorizationDigestSha256:
      input.attemptReservation.attemptControl
        .routeAuthorizationDigestSha256,
    submissionIdempotencyKeyDigestSha256:
      input.attemptReservation.attemptControl
        .submissionIdempotencyKeyDigestSha256,
    routeDataAssuranceContractDigestSha256:
      input.preparedRun.semanticAdmission.routeDataAssurance
        .contractDigestSha256,
    internalCostBudgetAdmissionDigestSha256:
      input.preparedRun.budgetAdmission.admissionDigestSha256,
  }
}
