import { z } from 'zod'

import {
  createLivingFrameSemanticSceneProposalJsonSchema,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import {
  getReEditProReasoningModelRoute,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  createLivingFrameControlledInternalBudgetAdmission,
  createPrePlanLivingFrameSemanticReasoningPreparedAuthority,
  validateLivingFrameControlledInternalBudgetAdmission,
  validatePrePlanLivingFrameSemanticReasoningPreparedAuthority,
  type LivingFrameControlledInternalBudgetAdmission,
  type PrePlanLivingFrameSemanticReasoningPreparedAuthority,
} from '../reasoning-model-cost'
import {
  canonicalLivingFrameSemanticReasoningAdmissionSchema,
  verifyCanonicalLivingFrameProviderNeutralPayload,
  verifyCanonicalLivingFrameSemanticReasoningAdmission,
  type CanonicalLivingFrameSemanticReasoningAdmission,
} from './canonical-living-frame-semantic-reasoning-admission'
import {
  canonicalLivingFramePreapprovalInputAuthoritySchema,
  type CanonicalLivingFramePreapprovalInputAuthority,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_PROVIDER_ENVELOPE_VERSION =
  'canonical-living-frame-preapproval-provider-envelope-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_VERSION =
  'canonical-living-frame-preapproval-reasoning-run-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_LOCATOR_VERSION =
  'canonical-living-frame-preapproval-reasoning-run-locator-v1' as const

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

const workloadAuthoritySchema =
  z.custom<PrePlanLivingFrameSemanticReasoningPreparedAuthority>(
    (value) => (
      typeof value === 'object'
      && value !== null
      && validatePrePlanLivingFrameSemanticReasoningPreparedAuthority(
        value as PrePlanLivingFrameSemanticReasoningPreparedAuthority,
      ).ok
    ),
    {
      message:
        'Prepared Living Frame reasoning workload authority is invalid.',
    },
  )

const budgetAdmissionSchema =
  z.custom<LivingFrameControlledInternalBudgetAdmission>(
    (value) => (
      typeof value === 'object'
      && value !== null
      && validateLivingFrameControlledInternalBudgetAdmission(
        value as LivingFrameControlledInternalBudgetAdmission,
      ).ok
    ),
    {
      message:
        'Prepared Living Frame reasoning internal-budget admission is invalid.',
    },
  )

const identitySchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  handoffId: safeIdentitySchema,
}).strict()

const preparedProviderEnvelopeDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_PROVIDER_ENVELOPE_VERSION,
  ),
  envelopeClass: z.literal(
    'private_preapproval_reasoning_provider_envelope',
  ),
  state: z.literal('prepared_transport_not_authorized'),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  identity: identitySchema,
  reasoningRunId: safeIdentitySchema,
  attemptId: safeIdentitySchema,
  attemptOrdinal: z.literal(1),
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
    structuredOutputRequired: z.literal(true),
    routeAuthorizationDigestSha256: sha256Schema,
  }).strict(),
  canonicalBindings: z.object({
    semanticAdmissionContractDigestSha256: sha256Schema,
    livingFramePreapprovalInputAuthorityDigestSha256: sha256Schema,
    planningEvidenceBindingDigestSha256: sha256Schema,
    providerNeutralPayloadDigestSha256: sha256Schema,
    semanticRequestContractDigestSha256: sha256Schema,
    sourceSpeechEvidencePackageDigestSha256: sha256Schema,
    routeDataAssuranceContractDigestSha256: sha256Schema,
    routeDecisionSetDigestSha256: sha256Schema,
    outputJsonSchemaDigestSha256: sha256Schema,
    workloadAuthorityDigestSha256: sha256Schema,
    internalCostBudgetAdmissionDigestSha256: sha256Schema,
  }).strict(),
  privatePayload: z.object({
    providerNeutralPayload:
      canonicalLivingFrameSemanticReasoningAdmissionSchema.shape
        .providerNeutralPayload,
    strictOutputJsonSchema: z.record(z.string(), z.unknown()),
    rawTranscriptIncluded: z.literal(false),
    rawMediaIncluded: z.literal(false),
    browserShareable: z.literal(false),
  }).strict(),
  oneUseSubmission: z.object({
    idempotencyKeyDigestSha256: sha256Schema,
    submissionAuthorityState: z.literal('not_issued'),
    providerSubmissionCount: z.literal(0),
    resubmissionAllowed: z.literal(false),
  }).strict(),
  runtimeBlockers: z.tuple([
    z.literal('provider_specific_request_adapter_required'),
    z.literal('provider_credential_capability_required'),
    z.literal('one_use_submission_authority_required'),
    z.literal('distributed_reasoning_lifecycle_required'),
  ]),
  providerTransportAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  providerRequestBodyPersisted: z.literal(false),
  providerResponsePersisted: z.literal(false),
  customerPriceCalculated: z.literal(false),
  customerCreditsCalculated: z.literal(false),
  creditReservationCreated: z.literal(false),
  walletMutationMade: z.literal(false),
  serviceFeeIncluded: z.literal(false),
}).strict()

export const canonicalLivingFramePreapprovalProviderEnvelopeSchema =
  preparedProviderEnvelopeDraftSchema.extend({
    envelopeDigestSha256: sha256Schema,
  }).strict()

const preparedRunAuthorityBoundarySchema = z.object({
  preparedRunPersistenceAuthority: z.literal(true),
  providerEnvelopePreparationAuthority: z.literal(true),
  backendLocalSingleHostRestartSafety: z.literal(true),
  distributedDurabilityAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerAttemptAuthority: z.literal(false),
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

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_BOUNDARY =
  Object.freeze({
    preparedRunPersistenceAuthority: true as const,
    providerEnvelopePreparationAuthority: true as const,
    backendLocalSingleHostRestartSafety: true as const,
    distributedDurabilityAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCallAuthority: false as const,
    providerCredentialAuthority: false as const,
    providerAttemptAuthority: false as const,
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

const preparedRunDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_VERSION,
  ),
  recordClass: z.literal(
    'private_content_addressed_preapproval_reasoning_prepared_run',
  ),
  state: z.literal('prepared_awaiting_transport_admission'),
  revision: z.literal(1),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  identity: identitySchema,
  reasoningRunId: safeIdentitySchema,
  canonicalPreparedAt: timestampSchema,
  semanticAdmission:
    canonicalLivingFrameSemanticReasoningAdmissionSchema,
  budgetAdmission: budgetAdmissionSchema,
  workloadAuthority: workloadAuthoritySchema,
  preparedProviderEnvelope:
    canonicalLivingFramePreapprovalProviderEnvelopeSchema,
  attemptRecords: z.tuple([]),
  activeAttemptId: z.null(),
  terminalState: z.null(),
  finalResultDigestSha256: z.null(),
  nextRouteId: z.literal('kimi_k3_primary'),
  checkbackState: z.literal('not_started'),
  fallbackState: z.literal('not_started'),
  persistence: z.object({
    storageClass: z.literal(
      'backend_local_private_content_addressed',
    ),
    restartSafeSingleHost: z.literal(true),
    cooperativeWriterLockRequired: z.literal(true),
    createOnlyVersionRequired: z.literal(true),
    atomicLatestPointerRequired: z.literal(true),
    distributedDurability: z.literal(false),
    databaseBacked: z.literal(false),
    remoteMutationMade: z.literal(false),
  }).strict(),
  authorityBoundary: preparedRunAuthorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalReasoningRunSchema =
  preparedRunDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export const canonicalLivingFramePreapprovalReasoningRunLocatorSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_LOCATOR_VERSION,
    ),
    serverOwnedLocatorId: safeIdentitySchema,
  }).strict()

export type CanonicalLivingFramePreapprovalProviderEnvelope = z.infer<
  typeof canonicalLivingFramePreapprovalProviderEnvelopeSchema
>
export type CanonicalLivingFramePreapprovalReasoningRun = z.infer<
  typeof canonicalLivingFramePreapprovalReasoningRunSchema
>
export type CanonicalLivingFramePreapprovalReasoningRunLocator = z.infer<
  typeof canonicalLivingFramePreapprovalReasoningRunLocatorSchema
>

export function createCanonicalLivingFramePreapprovalReasoningRun(input: {
  readonly semanticAdmission:
    CanonicalLivingFrameSemanticReasoningAdmission
  readonly preapprovalInputAuthority:
    CanonicalLivingFramePreapprovalInputAuthority
}): CanonicalLivingFramePreapprovalReasoningRun {
  const semanticAdmission =
    verifyCanonicalLivingFrameSemanticReasoningAdmission(
      input.semanticAdmission,
    )
  const preapprovalInputAuthority =
    canonicalLivingFramePreapprovalInputAuthoritySchema.parse(
      input.preapprovalInputAuthority,
    )
  assertAdmissionMatchesPreapproval({
    semanticAdmission,
    preapprovalInputAuthority,
  })
  const runIdentitySeed = {
    domain:
      'canonical_living_frame_preapproval_reasoning_run_identity_v1',
    semanticAdmissionContractDigestSha256:
      semanticAdmission.contractDigestSha256,
    livingFramePreapprovalInputAuthorityDigestSha256:
      preapprovalInputAuthority.authorityDigestSha256,
    providerNeutralPayloadDigestSha256:
      semanticAdmission.providerNeutralPayload.payloadDigestSha256,
    routeDataAssuranceContractDigestSha256:
      semanticAdmission.routeDataAssurance.contractDigestSha256,
  }
  const reasoningRunId =
    `lf-preplan-run-${sha256AuthorityValue(runIdentitySeed)}`
  const attemptId = `lf-preplan-attempt-${sha256AuthorityValue({
    reasoningRunId,
    attemptOrdinal: 1,
    routeId: 'kimi_k3_primary',
  })}`
  const budgetAdmissionResult =
    createLivingFrameControlledInternalBudgetAdmission({
      sourceAuthority:
        'canonical_living_frame_preapproval_reasoning_lifecycle_service',
      budgetAdmissionId: `lf-preplan-budget-${sha256AuthorityValue({
        reasoningRunId,
        budgetExpectationId:
          preapprovalInputAuthority.internalCost.budgetExpectationId,
        maximumAuthorizedInternalCostMicros:
          preapprovalInputAuthority.internalCost
            .maximumAuthorizedInternalCostMicros,
      })}`,
      budgetExpectationId:
        preapprovalInputAuthority.internalCost.budgetExpectationId,
      livingFramePreapprovalInputAuthorityDigestSha256:
        preapprovalInputAuthority.authorityDigestSha256,
      rateCardIdentityDigestSha256:
        preapprovalInputAuthority.internalCost
          .rateCardIdentityDigestSha256,
      maximumAuthorizedInternalCostMicros:
        preapprovalInputAuthority.internalCost
          .maximumAuthorizedInternalCostMicros,
    })
  if (!budgetAdmissionResult.ok) {
    throw new Error(
      'canonical_living_frame_preapproval_reasoning_budget_invalid',
    )
  }
  const budgetAdmission = budgetAdmissionResult.data
  const workloadAuthorityResult =
    createPrePlanLivingFrameSemanticReasoningPreparedAuthority({
      ...semanticAdmission.identity,
      livingFramePreapprovalInputAuthorityDigestSha256:
        preapprovalInputAuthority.authorityDigestSha256,
      planningEvidenceBindingDigestSha256:
        semanticAdmission.providerNeutralPayload.canonicalBindings
          .planningEvidenceBindingDigestSha256,
      semanticAdmissionContractDigestSha256:
        semanticAdmission.contractDigestSha256,
      providerNeutralPayloadDigestSha256:
        semanticAdmission.providerNeutralPayload.payloadDigestSha256,
      sourceSpeechEvidencePackageDigestSha256:
        semanticAdmission.providerNeutralPayload.sourceSpeechProjection
          .sourceSpeechEvidencePackageDigestSha256,
      semanticRequestContractDigestSha256:
        semanticAdmission.providerNeutralPayload.canonicalBindings
          .semanticRequestContractDigestSha256,
      routeDataAssuranceContractDigestSha256:
        semanticAdmission.routeDataAssurance.contractDigestSha256,
      routeDataAssuranceEvidenceSnapshotId:
        semanticAdmission.routeDataAssurance.evidenceSnapshotId,
      routeDataAssuranceEvidenceRevision:
        semanticAdmission.routeDataAssurance.evidenceRevision,
      routeDataAssuranceValidUntil:
        semanticAdmission.routeDataAssurance.validUntil,
      routeDecisionSetDigestSha256:
        semanticAdmission.routeDataAssurance
          .routeDecisionSetDigestSha256,
      reasoningResultSchemaDigestSha256:
        semanticAdmission.providerNeutralPayload.outputContract
          .outputJsonSchemaDigestSha256,
      routeContractVersion:
        REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
      orderedRouteIds:
        semanticAdmission.routeDataAssurance.orderedRouteIds,
      routeIdentityDigestSha256:
        preapprovalInputAuthority.reasoning
          .routeIdentityDigestSha256,
      rateCardIdentityDigestSha256:
        preapprovalInputAuthority.internalCost
          .rateCardIdentityDigestSha256,
      budgetAdmission,
    })
  if (!workloadAuthorityResult.ok) {
    throw new Error(
      'canonical_living_frame_preapproval_reasoning_workload_invalid',
    )
  }
  const workloadAuthority = workloadAuthorityResult.data
  const route = getReEditProReasoningModelRoute('kimi_k3_primary')
  const strictOutputJsonSchema =
    createLivingFrameSemanticSceneProposalJsonSchema()
  const routeAuthorizationDigestSha256 = sha256AuthorityValue({
    domain:
      'canonical_living_frame_preapproval_route_authorization_v1',
    semanticAdmissionContractDigestSha256:
      semanticAdmission.contractDigestSha256,
    routeDataAssuranceContractDigestSha256:
      semanticAdmission.routeDataAssurance.contractDigestSha256,
    routeDecisionSetDigestSha256:
      semanticAdmission.routeDataAssurance
        .routeDecisionSetDigestSha256,
    routeId: route.routeId,
    attemptOrdinal: route.priority,
    provider: route.provider,
    exactProviderModelId: route.exactProviderModelId,
    providerBoundary: route.providerBoundary,
  })
  const envelopeDraft =
    preparedProviderEnvelopeDraftSchema.parse({
      contractVersion:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_PROVIDER_ENVELOPE_VERSION,
      envelopeClass:
        'private_preapproval_reasoning_provider_envelope',
      state: 'prepared_transport_not_authorized',
      promotionAllowed: false,
      productionReady: false,
      identity: semanticAdmission.identity,
      reasoningRunId,
      attemptId,
      attemptOrdinal: 1,
      route: {
        routeContractVersion:
          REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
        routeId: route.routeId,
        routeRole: route.routeRole,
        provider: route.provider,
        modelRoleId: route.modelRoleId,
        exactProviderModelId: route.exactProviderModelId,
        providerBoundary: route.providerBoundary,
        structuredOutputRequired: route.structuredOutputRequired,
        routeAuthorizationDigestSha256,
      },
      canonicalBindings: {
        semanticAdmissionContractDigestSha256:
          semanticAdmission.contractDigestSha256,
        livingFramePreapprovalInputAuthorityDigestSha256:
          preapprovalInputAuthority.authorityDigestSha256,
        planningEvidenceBindingDigestSha256:
          workloadAuthority.planningEvidenceBindingDigestSha256,
        providerNeutralPayloadDigestSha256:
          semanticAdmission.providerNeutralPayload
            .payloadDigestSha256,
        semanticRequestContractDigestSha256:
          workloadAuthority.semanticRequestContractDigestSha256,
        sourceSpeechEvidencePackageDigestSha256:
          workloadAuthority
            .sourceSpeechEvidencePackageDigestSha256,
        routeDataAssuranceContractDigestSha256:
          semanticAdmission.routeDataAssurance
            .contractDigestSha256,
        routeDecisionSetDigestSha256:
          semanticAdmission.routeDataAssurance
            .routeDecisionSetDigestSha256,
        outputJsonSchemaDigestSha256:
          workloadAuthority.reasoningResultSchemaDigestSha256,
        workloadAuthorityDigestSha256:
          workloadAuthority.authorityDigestSha256,
        internalCostBudgetAdmissionDigestSha256:
          budgetAdmission.admissionDigestSha256,
      },
      privatePayload: {
        providerNeutralPayload:
          semanticAdmission.providerNeutralPayload,
        strictOutputJsonSchema,
        rawTranscriptIncluded: false,
        rawMediaIncluded: false,
        browserShareable: false,
      },
      oneUseSubmission: {
        idempotencyKeyDigestSha256: sha256AuthorityValue({
          domain:
            'canonical_living_frame_preapproval_submission_idempotency_v1',
          reasoningRunId,
          attemptId,
          providerNeutralPayloadDigestSha256:
            workloadAuthority.providerNeutralPayloadDigestSha256,
        }),
        submissionAuthorityState: 'not_issued',
        providerSubmissionCount: 0,
        resubmissionAllowed: false,
      },
      runtimeBlockers: [
        'provider_specific_request_adapter_required',
        'provider_credential_capability_required',
        'one_use_submission_authority_required',
        'distributed_reasoning_lifecycle_required',
      ],
      providerTransportAuthorized: false,
      providerCallMade: false,
      credentialReadMade: false,
      providerRequestBodyPersisted: false,
      providerResponsePersisted: false,
      customerPriceCalculated: false,
      customerCreditsCalculated: false,
      creditReservationCreated: false,
      walletMutationMade: false,
      serviceFeeIncluded: false,
    })
  const preparedProviderEnvelope =
    canonicalLivingFramePreapprovalProviderEnvelopeSchema.parse({
      ...envelopeDraft,
      envelopeDigestSha256:
        sha256AuthorityValue(envelopeDraft),
    })
  const runDraft = preparedRunDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_VERSION,
    recordClass:
      'private_content_addressed_preapproval_reasoning_prepared_run',
    state: 'prepared_awaiting_transport_admission',
    revision: 1,
    promotionAllowed: false,
    productionReady: false,
    identity: semanticAdmission.identity,
    reasoningRunId,
    canonicalPreparedAt:
      new Date(
        semanticAdmission.routeDataAssurance.evaluatedAt,
      ).toISOString(),
    semanticAdmission,
    budgetAdmission,
    workloadAuthority,
    preparedProviderEnvelope,
    attemptRecords: [],
    activeAttemptId: null,
    terminalState: null,
    finalResultDigestSha256: null,
    nextRouteId: 'kimi_k3_primary',
    checkbackState: 'not_started',
    fallbackState: 'not_started',
    persistence: {
      storageClass:
        'backend_local_private_content_addressed',
      restartSafeSingleHost: true,
      cooperativeWriterLockRequired: true,
      createOnlyVersionRequired: true,
      atomicLatestPointerRequired: true,
      distributedDurability: false,
      databaseBacked: false,
      remoteMutationMade: false,
    },
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_BOUNDARY,
  })
  return verifyCanonicalLivingFramePreapprovalReasoningRun({
    ...runDraft,
    recordDigestSha256: sha256AuthorityValue(runDraft),
  })
}

export function verifyCanonicalLivingFramePreapprovalReasoningRun(
  input: unknown,
): CanonicalLivingFramePreapprovalReasoningRun {
  const parsed =
    canonicalLivingFramePreapprovalReasoningRunSchema.parse(input)
  const semanticAdmission =
    verifyCanonicalLivingFrameSemanticReasoningAdmission(
      parsed.semanticAdmission,
    )
  const budget =
    validateLivingFrameControlledInternalBudgetAdmission(
      parsed.budgetAdmission,
    )
  const workload =
    validatePrePlanLivingFrameSemanticReasoningPreparedAuthority(
      parsed.workloadAuthority,
    )
  if (!budget.ok || !workload.ok) {
    throw new Error(
      'canonical_living_frame_preapproval_reasoning_run_invalid',
    )
  }
  const envelope = verifyPreparedProviderEnvelope(
    parsed.preparedProviderEnvelope,
  )
  const { recordDigestSha256, ...draft } = parsed
  const expectedRunId =
    `lf-preplan-run-${sha256AuthorityValue({
      domain:
        'canonical_living_frame_preapproval_reasoning_run_identity_v1',
      semanticAdmissionContractDigestSha256:
        semanticAdmission.contractDigestSha256,
      livingFramePreapprovalInputAuthorityDigestSha256:
        workload.data
          .livingFramePreapprovalInputAuthorityDigestSha256,
      providerNeutralPayloadDigestSha256:
        semanticAdmission.providerNeutralPayload.payloadDigestSha256,
      routeDataAssuranceContractDigestSha256:
        semanticAdmission.routeDataAssurance.contractDigestSha256,
    })}`
  if (
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.reasoningRunId !== expectedRunId
    || stableAuthorityStringify(parsed.identity) !==
      stableAuthorityStringify(semanticAdmission.identity)
    || parsed.canonicalPreparedAt !==
      new Date(
        semanticAdmission.routeDataAssurance.evaluatedAt,
      ).toISOString()
    || budget.data.sourceAuthority !==
      'canonical_living_frame_preapproval_reasoning_lifecycle_service'
    || stableAuthorityStringify({
      workspaceId: workload.data.workspaceId,
      projectId: workload.data.projectId,
      editSessionId: workload.data.editSessionId,
      handoffId: workload.data.handoffId,
    }) !== stableAuthorityStringify(semanticAdmission.identity)
    || workload.data
      .livingFramePreapprovalInputAuthorityDigestSha256 !==
      semanticAdmission.providerNeutralPayload.canonicalBindings
        .preapprovalInputAuthorityDigestSha256
    || workload.data.planningEvidenceBindingDigestSha256 !==
      semanticAdmission.providerNeutralPayload.canonicalBindings
        .planningEvidenceBindingDigestSha256
    || workload.data.providerNeutralPayloadDigestSha256 !==
      semanticAdmission.providerNeutralPayload.payloadDigestSha256
    || workload.data.sourceSpeechEvidencePackageDigestSha256 !==
      semanticAdmission.providerNeutralPayload.sourceSpeechProjection
        .sourceSpeechEvidencePackageDigestSha256
    || workload.data.semanticRequestContractDigestSha256 !==
      semanticAdmission.providerNeutralPayload.canonicalBindings
        .semanticRequestContractDigestSha256
    || workload.data.reasoningRequestDigestSha256 !==
      semanticAdmission.providerNeutralPayload.payloadDigestSha256
    || workload.data.semanticAdmissionContractDigestSha256 !==
      semanticAdmission.contractDigestSha256
    || workload.data.routeDataAssuranceContractDigestSha256 !==
      semanticAdmission.routeDataAssurance.contractDigestSha256
    || workload.data.routeDecisionSetDigestSha256 !==
      semanticAdmission.routeDataAssurance
        .routeDecisionSetDigestSha256
    || workload.data.routeDataAssuranceEvidenceSnapshotId !==
      semanticAdmission.routeDataAssurance.evidenceSnapshotId
    || workload.data.routeDataAssuranceEvidenceRevision !==
      semanticAdmission.routeDataAssurance.evidenceRevision
    || workload.data.routeDataAssuranceValidUntil !==
      semanticAdmission.routeDataAssurance.validUntil
    || workload.data.routeContractVersion !==
      semanticAdmission.routeDataAssurance.routeContractVersion
    || stableAuthorityStringify(workload.data.orderedRouteIds) !==
      stableAuthorityStringify(
        semanticAdmission.routeDataAssurance.orderedRouteIds,
      )
    || workload.data.reasoningResultSchemaDigestSha256 !==
      semanticAdmission.providerNeutralPayload.outputContract
        .outputJsonSchemaDigestSha256
    || budget.data
      .livingFramePreapprovalInputAuthorityDigestSha256 !==
      workload.data
        .livingFramePreapprovalInputAuthorityDigestSha256
    || budget.data.budgetExpectationId !==
      workload.data.internalCostBudgetExpectationId
    || budget.data.budgetAdmissionId !==
      workload.data.internalCostBudgetAdmissionId
    || budget.data.maximumAuthorizedInternalCostMicros !==
      workload.data.maximumAuthorizedInternalCostMicros
    || budget.data.rateCardIdentityDigestSha256 !==
      workload.data.rateCardIdentityDigestSha256
    || workload.data.internalCostBudgetAdmissionDigestSha256 !==
      budget.data.admissionDigestSha256
    || envelope.reasoningRunId !== parsed.reasoningRunId
    || stableAuthorityStringify(envelope.identity) !==
      stableAuthorityStringify(semanticAdmission.identity)
    || envelope.canonicalBindings
      .semanticAdmissionContractDigestSha256 !==
      semanticAdmission.contractDigestSha256
    || envelope.canonicalBindings
      .livingFramePreapprovalInputAuthorityDigestSha256 !==
      workload.data
        .livingFramePreapprovalInputAuthorityDigestSha256
    || envelope.canonicalBindings
      .planningEvidenceBindingDigestSha256 !==
      workload.data.planningEvidenceBindingDigestSha256
    || envelope.canonicalBindings
      .providerNeutralPayloadDigestSha256 !==
      workload.data.providerNeutralPayloadDigestSha256
    || envelope.canonicalBindings
      .semanticRequestContractDigestSha256 !==
      workload.data.semanticRequestContractDigestSha256
    || envelope.canonicalBindings
      .sourceSpeechEvidencePackageDigestSha256 !==
      workload.data.sourceSpeechEvidencePackageDigestSha256
    || envelope.canonicalBindings
      .routeDataAssuranceContractDigestSha256 !==
      workload.data.routeDataAssuranceContractDigestSha256
    || envelope.canonicalBindings
      .routeDecisionSetDigestSha256 !==
      workload.data.routeDecisionSetDigestSha256
    || envelope.canonicalBindings.outputJsonSchemaDigestSha256 !==
      workload.data.reasoningResultSchemaDigestSha256
    || envelope.canonicalBindings.workloadAuthorityDigestSha256 !==
      workload.data.authorityDigestSha256
    || envelope.canonicalBindings
      .internalCostBudgetAdmissionDigestSha256 !==
      budget.data.admissionDigestSha256
    || stableAuthorityStringify(
      envelope.privatePayload.providerNeutralPayload,
    ) !== stableAuthorityStringify(
      semanticAdmission.providerNeutralPayload,
    )
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_reasoning_run_invalid',
    )
  }
  return structuredClone(parsed)
}

export function deriveCanonicalLivingFramePreapprovalReasoningRunLocator(
  run: Pick<
    CanonicalLivingFramePreapprovalReasoningRun,
    'identity' | 'reasoningRunId'
  >,
): CanonicalLivingFramePreapprovalReasoningRunLocator {
  return canonicalLivingFramePreapprovalReasoningRunLocatorSchema.parse({
    schemaVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_RUN_LOCATOR_VERSION,
    serverOwnedLocatorId: `lf-preplan-run-${sha256AuthorityValue({
      identity: run.identity,
      reasoningRunId: run.reasoningRunId,
    })}`,
  })
}

function verifyPreparedProviderEnvelope(
  input: unknown,
): CanonicalLivingFramePreapprovalProviderEnvelope {
  const parsed =
    canonicalLivingFramePreapprovalProviderEnvelopeSchema.parse(input)
  const providerNeutralPayload =
    verifyCanonicalLivingFrameProviderNeutralPayload(
      parsed.privatePayload.providerNeutralPayload,
    )
  const { envelopeDigestSha256, ...draft } = parsed
  const route = getReEditProReasoningModelRoute(parsed.route.routeId)
  const expectedSchema =
    createLivingFrameSemanticSceneProposalJsonSchema()
  const expectedAttemptId =
    `lf-preplan-attempt-${sha256AuthorityValue({
      reasoningRunId: parsed.reasoningRunId,
      attemptOrdinal: 1,
      routeId: 'kimi_k3_primary',
    })}`
  const expectedRouteAuthorizationDigest = sha256AuthorityValue({
    domain:
      'canonical_living_frame_preapproval_route_authorization_v1',
    semanticAdmissionContractDigestSha256:
      parsed.canonicalBindings
        .semanticAdmissionContractDigestSha256,
    routeDataAssuranceContractDigestSha256:
      parsed.canonicalBindings
        .routeDataAssuranceContractDigestSha256,
    routeDecisionSetDigestSha256:
      parsed.canonicalBindings.routeDecisionSetDigestSha256,
    routeId: route.routeId,
    attemptOrdinal: route.priority,
    provider: route.provider,
    exactProviderModelId: route.exactProviderModelId,
    providerBoundary: route.providerBoundary,
  })
  if (
    envelopeDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.attemptId !== expectedAttemptId
    || parsed.route.routeRole !== route.routeRole
    || parsed.route.provider !== route.provider
    || parsed.route.modelRoleId !== route.modelRoleId
    || parsed.route.exactProviderModelId !==
      route.exactProviderModelId
    || parsed.route.providerBoundary !== route.providerBoundary
    || parsed.route.structuredOutputRequired !==
      route.structuredOutputRequired
    || parsed.route.routeAuthorizationDigestSha256 !==
      expectedRouteAuthorizationDigest
    || stableAuthorityStringify(
      parsed.privatePayload.strictOutputJsonSchema,
    ) !== stableAuthorityStringify(expectedSchema)
    || sha256AuthorityValue(expectedSchema) !==
      parsed.canonicalBindings.outputJsonSchemaDigestSha256
    || providerNeutralPayload.payloadDigestSha256 !==
      parsed.canonicalBindings.providerNeutralPayloadDigestSha256
    || parsed.oneUseSubmission.idempotencyKeyDigestSha256 !==
      sha256AuthorityValue({
        domain:
          'canonical_living_frame_preapproval_submission_idempotency_v1',
        reasoningRunId: parsed.reasoningRunId,
        attemptId: parsed.attemptId,
        providerNeutralPayloadDigestSha256:
          parsed.canonicalBindings
            .providerNeutralPayloadDigestSha256,
      })
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_provider_envelope_invalid',
    )
  }
  return structuredClone(parsed)
}

function assertAdmissionMatchesPreapproval(input: {
  semanticAdmission: CanonicalLivingFrameSemanticReasoningAdmission
  preapprovalInputAuthority:
    CanonicalLivingFramePreapprovalInputAuthority
}): void {
  const { semanticAdmission, preapprovalInputAuthority } = input
  if (
    stableAuthorityStringify(semanticAdmission.identity) !==
      stableAuthorityStringify(preapprovalInputAuthority.identity)
    || semanticAdmission.providerNeutralPayload.canonicalBindings
      .preapprovalInputAuthorityDigestSha256 !==
      preapprovalInputAuthority.authorityDigestSha256
    || semanticAdmission.providerNeutralPayload.canonicalBindings
      .planningEvidenceBindingDigestSha256 !==
      preapprovalInputAuthority.lineage
        .planningEvidenceBindingDigestSha256
    || stableAuthorityStringify(
      semanticAdmission.providerNeutralPayload.workflowContext,
    ) !== stableAuthorityStringify(
      preapprovalInputAuthority.workflowContext,
    )
    || stableAuthorityStringify(
      semanticAdmission.routeDataAssurance.orderedRouteIds,
    ) !== stableAuthorityStringify(
      preapprovalInputAuthority.reasoning.orderedRouteIds,
    )
    || semanticAdmission.routeDataAssurance.routeContractVersion !==
      preapprovalInputAuthority.reasoning.routeContractVersion
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_reasoning_admission_mismatch',
    )
  }
}
