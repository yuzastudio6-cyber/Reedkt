import { z } from 'zod'

import {
  getReEditProReasoningModelRoute,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  canonicalLivingFrameSemanticReasoningAdmissionSchema,
  verifyCanonicalLivingFrameSemanticReasoningAdmission,
  type CanonicalLivingFrameSemanticReasoningAdmission,
} from './canonical-living-frame-semantic-reasoning-admission'
import {
  canonicalLivingFramePreapprovalReasoningRunSchema,
  verifyCanonicalLivingFramePreapprovalReasoningRun,
  type CanonicalLivingFramePreapprovalReasoningRun,
} from './canonical-living-frame-preapproval-reasoning-lifecycle'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_VERSION = (
  'canonical-living-frame-preapproval-reasoning-attempt-reservation-v1'
) as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_LOCATOR_VERSION = (
  'canonical-living-frame-preapproval-reasoning-attempt-reservation-locator-v1'
) as const

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestampSchema = z.string().datetime({ offset: true })

const authorityBoundarySchema = z.object({
  attemptReservationAuthority: z.literal(true),
  backendLocalSingleHostRestartSafety: z.literal(true),
  distributedDurabilityAuthority: z.literal(false),
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

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_BOUNDARY =
  Object.freeze({
    attemptReservationAuthority: true as const,
    backendLocalSingleHostRestartSafety: true as const,
    distributedDurabilityAuthority: false as const,
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

const reservationDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_VERSION,
  ),
  recordClass: z.literal(
    'private_content_addressed_preapproval_reasoning_attempt_reservation',
  ),
  state: z.literal('reserved_transport_qualification_required'),
  revision: z.literal(1),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  identity:
    canonicalLivingFramePreapprovalReasoningRunSchema.shape.identity,
  reasoningRunId: safeIdentitySchema,
  canonicalReservedAt: timestampSchema,
  canonicalBindings: z.object({
    preparedRunRecordDigestSha256: sha256Schema,
    preparedProviderEnvelopeDigestSha256: sha256Schema,
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
  attemptControl: z.object({
    attemptId: safeIdentitySchema,
    attemptOrdinal: z.literal(1),
    routeContractVersion: z.literal(
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    ),
    routeId: z.literal('kimi_k3_primary'),
    routeRole: z.literal('primary'),
    provider: z.literal('moonshot_ai'),
    modelRoleId: z.literal('kimi_k3_main_edit_agent'),
    exactProviderModelId: z.literal('kimi-k3'),
    providerBoundary: z.literal('kimi_k3_provider_boundary'),
    routeAuthorizationDigestSha256: sha256Schema,
    requestPayloadDigestSha256: sha256Schema,
    submissionIdempotencyKeyDigestSha256: sha256Schema,
    submissionAuthorityState: z.literal('not_issued'),
    providerSubmissionCount: z.literal(0),
    submissionAuthorityConsumed: z.literal(false),
    resubmissionAllowed: z.literal(false),
  }).strict(),
  providerRequest: z.object({
    providerRequestRecordId: z.null(),
    providerRequestIdDigestSha256: z.null(),
    state: z.literal('not_created'),
    providerCallMayHaveOccurred: z.literal(false),
    rawRequestPersisted: z.literal(false),
    rawResponsePersisted: z.literal(false),
    credentialPersisted: z.literal(false),
    signedUrlPersisted: z.literal(false),
    localPathPersisted: z.literal(false),
  }).strict(),
  lifecycle: z.object({
    providerObservationState: z.literal('not_started'),
    checkbackState: z.literal('not_scheduled'),
    fallbackState: z.literal('not_authorized'),
    unknownOutcomeReconciliationRequired: z.literal(false),
    automaticRetryStarted: z.literal(false),
  }).strict(),
  internalCost: z.object({
    budgetAdmissionDigestSha256: sha256Schema,
    maximumAuthorizedInternalCostMicros: z.string()
      .regex(/^(?:0|[1-9][0-9]{0,23})$/u),
    attemptCostState: z.literal('not_incurred'),
    attemptCostEvidenceDigestSha256: z.null(),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    customerPriceCalculated: z.literal(false),
    customerCreditsMutated: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  runtimeBlockers: z.tuple([
    z.literal('distributed_reasoning_lifecycle_required'),
    z.literal('provider_specific_request_adapter_required'),
    z.literal('provider_credential_capability_required'),
    z.literal('one_use_submission_authority_required'),
  ]),
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
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFramePreapprovalReasoningAttemptReservationSchema =
  reservationDraftSchema.extend({
    recordDigestSha256: sha256Schema,
  }).strict()

export const canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_LOCATOR_VERSION,
    ),
    serverOwnedLocatorId: safeIdentitySchema,
  }).strict()

export type CanonicalLivingFramePreapprovalReasoningAttemptReservation =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningAttemptReservationSchema
  >
export type CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema
  >

export function createCanonicalLivingFramePreapprovalReasoningAttemptReservation(
  input: {
    readonly preparedRun:
      CanonicalLivingFramePreapprovalReasoningRun
    readonly currentSemanticAdmission:
      CanonicalLivingFrameSemanticReasoningAdmission
  },
): CanonicalLivingFramePreapprovalReasoningAttemptReservation {
  const preparedRun =
    verifyCanonicalLivingFramePreapprovalReasoningRun(
      input.preparedRun,
    )
  const currentSemanticAdmission =
    verifyCanonicalLivingFrameSemanticReasoningAdmission(
      input.currentSemanticAdmission,
    )
  assertPreparedRunMatchesCurrentAdmission({
    preparedRun,
    currentSemanticAdmission,
  })
  const envelope = preparedRun.preparedProviderEnvelope
  const draft = reservationDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_VERSION,
    recordClass:
      'private_content_addressed_preapproval_reasoning_attempt_reservation',
    state: 'reserved_transport_qualification_required',
    revision: 1,
    promotionAllowed: false,
    productionReady: false,
    identity: preparedRun.identity,
    reasoningRunId: preparedRun.reasoningRunId,
    canonicalReservedAt: preparedRun.canonicalPreparedAt,
    canonicalBindings: {
      preparedRunRecordDigestSha256:
        preparedRun.recordDigestSha256,
      preparedProviderEnvelopeDigestSha256:
        envelope.envelopeDigestSha256,
      semanticAdmissionContractDigestSha256:
        currentSemanticAdmission.contractDigestSha256,
      livingFramePreapprovalInputAuthorityDigestSha256:
        envelope.canonicalBindings
          .livingFramePreapprovalInputAuthorityDigestSha256,
      planningEvidenceBindingDigestSha256:
        envelope.canonicalBindings
          .planningEvidenceBindingDigestSha256,
      providerNeutralPayloadDigestSha256:
        currentSemanticAdmission.providerNeutralPayload
          .payloadDigestSha256,
      semanticRequestContractDigestSha256:
        envelope.canonicalBindings
          .semanticRequestContractDigestSha256,
      sourceSpeechEvidencePackageDigestSha256:
        envelope.canonicalBindings
          .sourceSpeechEvidencePackageDigestSha256,
      routeDataAssuranceContractDigestSha256:
        currentSemanticAdmission.routeDataAssurance
          .contractDigestSha256,
      routeDecisionSetDigestSha256:
        currentSemanticAdmission.routeDataAssurance
          .routeDecisionSetDigestSha256,
      outputJsonSchemaDigestSha256:
        envelope.canonicalBindings.outputJsonSchemaDigestSha256,
      workloadAuthorityDigestSha256:
        envelope.canonicalBindings.workloadAuthorityDigestSha256,
      internalCostBudgetAdmissionDigestSha256:
        envelope.canonicalBindings
          .internalCostBudgetAdmissionDigestSha256,
    },
    attemptControl: {
      attemptId: envelope.attemptId,
      attemptOrdinal: envelope.attemptOrdinal,
      routeContractVersion: envelope.route.routeContractVersion,
      routeId: envelope.route.routeId,
      routeRole: envelope.route.routeRole,
      provider: envelope.route.provider,
      modelRoleId: envelope.route.modelRoleId,
      exactProviderModelId: envelope.route.exactProviderModelId,
      providerBoundary: envelope.route.providerBoundary,
      routeAuthorizationDigestSha256:
        envelope.route.routeAuthorizationDigestSha256,
      requestPayloadDigestSha256:
        currentSemanticAdmission.providerNeutralPayload
          .payloadDigestSha256,
      submissionIdempotencyKeyDigestSha256:
        envelope.oneUseSubmission.idempotencyKeyDigestSha256,
      submissionAuthorityState: 'not_issued',
      providerSubmissionCount: 0,
      submissionAuthorityConsumed: false,
      resubmissionAllowed: false,
    },
    providerRequest: {
      providerRequestRecordId: null,
      providerRequestIdDigestSha256: null,
      state: 'not_created',
      providerCallMayHaveOccurred: false,
      rawRequestPersisted: false,
      rawResponsePersisted: false,
      credentialPersisted: false,
      signedUrlPersisted: false,
      localPathPersisted: false,
    },
    lifecycle: {
      providerObservationState: 'not_started',
      checkbackState: 'not_scheduled',
      fallbackState: 'not_authorized',
      unknownOutcomeReconciliationRequired: false,
      automaticRetryStarted: false,
    },
    internalCost: {
      budgetAdmissionDigestSha256:
        preparedRun.budgetAdmission.admissionDigestSha256,
      maximumAuthorizedInternalCostMicros:
        preparedRun.budgetAdmission
          .maximumAuthorizedInternalCostMicros,
      attemptCostState: 'not_incurred',
      attemptCostEvidenceDigestSha256: null,
      failedOrUnknownAttemptCostRetained: true,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      serviceFeeIncluded: false,
    },
    runtimeBlockers: [
      'distributed_reasoning_lifecycle_required',
      'provider_specific_request_adapter_required',
      'provider_credential_capability_required',
      'one_use_submission_authority_required',
    ],
    persistence: {
      storageClass: 'backend_local_private_content_addressed',
      restartSafeSingleHost: true,
      cooperativeWriterLockRequired: true,
      createOnlyVersionRequired: true,
      atomicLatestPointerRequired: true,
      distributedDurability: false,
      databaseBacked: false,
      remoteMutationMade: false,
    },
    authorityBoundary:
      CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_BOUNDARY,
  })
  return verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation({
    ...draft,
    recordDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
  input: unknown,
): CanonicalLivingFramePreapprovalReasoningAttemptReservation {
  const parsed =
    canonicalLivingFramePreapprovalReasoningAttemptReservationSchema
      .parse(input)
  const { recordDigestSha256, ...draft } = parsed
  const route = getReEditProReasoningModelRoute(
    parsed.attemptControl.routeId,
  )
  const expectedAttemptId =
    `lf-preplan-attempt-${sha256AuthorityValue({
      reasoningRunId: parsed.reasoningRunId,
      attemptOrdinal: 1,
      routeId: 'kimi_k3_primary',
    })}`
  const expectedSubmissionDigest = sha256AuthorityValue({
    domain:
      'canonical_living_frame_preapproval_submission_idempotency_v1',
    reasoningRunId: parsed.reasoningRunId,
    attemptId: parsed.attemptControl.attemptId,
    providerNeutralPayloadDigestSha256:
      parsed.canonicalBindings.providerNeutralPayloadDigestSha256,
  })
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
    recordDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.attemptControl.attemptId !== expectedAttemptId
    || parsed.attemptControl.routeContractVersion !==
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION
    || parsed.attemptControl.routeRole !== route.routeRole
    || parsed.attemptControl.provider !== route.provider
    || parsed.attemptControl.modelRoleId !== route.modelRoleId
    || parsed.attemptControl.exactProviderModelId !==
      route.exactProviderModelId
    || parsed.attemptControl.providerBoundary !==
      route.providerBoundary
    || parsed.attemptControl.routeAuthorizationDigestSha256 !==
      expectedRouteAuthorizationDigest
    || parsed.attemptControl.requestPayloadDigestSha256 !==
      parsed.canonicalBindings.providerNeutralPayloadDigestSha256
    || parsed.attemptControl
      .submissionIdempotencyKeyDigestSha256 !==
      expectedSubmissionDigest
    || parsed.internalCost.budgetAdmissionDigestSha256 !==
      parsed.canonicalBindings
        .internalCostBudgetAdmissionDigestSha256
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_attempt_reservation_invalid',
    )
  }
  return structuredClone(parsed)
}

export function assertCanonicalLivingFramePreapprovalReasoningAttemptReservationMatches(
  input: {
    readonly reservation: unknown
    readonly preparedRun: unknown
    readonly currentSemanticAdmission: unknown
  },
): CanonicalLivingFramePreapprovalReasoningAttemptReservation {
  const reservation =
    verifyCanonicalLivingFramePreapprovalReasoningAttemptReservation(
      input.reservation,
    )
  const preparedRun =
    verifyCanonicalLivingFramePreapprovalReasoningRun(
      input.preparedRun,
    )
  const currentSemanticAdmission =
    canonicalLivingFrameSemanticReasoningAdmissionSchema.parse(
      input.currentSemanticAdmission,
    )
  assertPreparedRunMatchesCurrentAdmission({
    preparedRun,
    currentSemanticAdmission,
  })
  const envelope = preparedRun.preparedProviderEnvelope
  if (
    stableAuthorityStringify(reservation.identity) !==
      stableAuthorityStringify(preparedRun.identity)
    || reservation.reasoningRunId !== preparedRun.reasoningRunId
    || reservation.canonicalReservedAt !==
      preparedRun.canonicalPreparedAt
    || reservation.canonicalBindings
      .preparedRunRecordDigestSha256 !==
      preparedRun.recordDigestSha256
    || reservation.canonicalBindings
      .preparedProviderEnvelopeDigestSha256 !==
      envelope.envelopeDigestSha256
    || reservation.canonicalBindings
      .semanticAdmissionContractDigestSha256 !==
      currentSemanticAdmission.contractDigestSha256
    || reservation.canonicalBindings
      .livingFramePreapprovalInputAuthorityDigestSha256 !==
      envelope.canonicalBindings
        .livingFramePreapprovalInputAuthorityDigestSha256
    || reservation.canonicalBindings
      .planningEvidenceBindingDigestSha256 !==
      envelope.canonicalBindings.planningEvidenceBindingDigestSha256
    || reservation.canonicalBindings
      .providerNeutralPayloadDigestSha256 !==
      currentSemanticAdmission.providerNeutralPayload
        .payloadDigestSha256
    || reservation.canonicalBindings
      .semanticRequestContractDigestSha256 !==
      envelope.canonicalBindings.semanticRequestContractDigestSha256
    || reservation.canonicalBindings
      .sourceSpeechEvidencePackageDigestSha256 !==
      envelope.canonicalBindings
        .sourceSpeechEvidencePackageDigestSha256
    || reservation.canonicalBindings
      .routeDataAssuranceContractDigestSha256 !==
      currentSemanticAdmission.routeDataAssurance
        .contractDigestSha256
    || reservation.canonicalBindings
      .routeDecisionSetDigestSha256 !==
      currentSemanticAdmission.routeDataAssurance
        .routeDecisionSetDigestSha256
    || reservation.canonicalBindings
      .outputJsonSchemaDigestSha256 !==
      envelope.canonicalBindings.outputJsonSchemaDigestSha256
    || reservation.canonicalBindings
      .workloadAuthorityDigestSha256 !==
      envelope.canonicalBindings.workloadAuthorityDigestSha256
    || reservation.canonicalBindings
      .internalCostBudgetAdmissionDigestSha256 !==
      envelope.canonicalBindings
        .internalCostBudgetAdmissionDigestSha256
    || reservation.attemptControl.attemptId !== envelope.attemptId
    || reservation.attemptControl
      .routeAuthorizationDigestSha256 !==
      envelope.route.routeAuthorizationDigestSha256
    || reservation.attemptControl
      .submissionIdempotencyKeyDigestSha256 !==
      envelope.oneUseSubmission.idempotencyKeyDigestSha256
    || reservation.internalCost.maximumAuthorizedInternalCostMicros !==
      preparedRun.budgetAdmission
        .maximumAuthorizedInternalCostMicros
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_attempt_reservation_lineage_invalid',
    )
  }
  return reservation
}

export function deriveCanonicalLivingFramePreapprovalReasoningAttemptReservationLocator(
  reservation: Pick<
    CanonicalLivingFramePreapprovalReasoningAttemptReservation,
    'identity' | 'reasoningRunId' | 'attemptControl'
  >,
): CanonicalLivingFramePreapprovalReasoningAttemptReservationLocator {
  return canonicalLivingFramePreapprovalReasoningAttemptReservationLocatorSchema
    .parse({
      schemaVersion:
        CANONICAL_LIVING_FRAME_PREAPPROVAL_REASONING_ATTEMPT_RESERVATION_LOCATOR_VERSION,
      serverOwnedLocatorId:
        `lf-preplan-reservation-${sha256AuthorityValue({
          identity: reservation.identity,
          reasoningRunId: reservation.reasoningRunId,
          attemptId: reservation.attemptControl.attemptId,
        })}`,
    })
}

function assertPreparedRunMatchesCurrentAdmission(input: {
  preparedRun: CanonicalLivingFramePreapprovalReasoningRun
  currentSemanticAdmission:
    CanonicalLivingFrameSemanticReasoningAdmission
}): void {
  const runAdmission = input.preparedRun.semanticAdmission
  const currentAdmission =
    verifyCanonicalLivingFrameSemanticReasoningAdmission(
      input.currentSemanticAdmission,
    )
  if (
    stableAuthorityStringify(input.preparedRun.identity) !==
      stableAuthorityStringify(currentAdmission.identity)
    || input.preparedRun.state !==
      'prepared_awaiting_transport_admission'
    || runAdmission.contractDigestSha256 !==
      currentAdmission.contractDigestSha256
    || sha256AuthorityValue(runAdmission) !==
      sha256AuthorityValue(currentAdmission)
    || input.preparedRun.preparedProviderEnvelope
      .canonicalBindings.semanticAdmissionContractDigestSha256 !==
      currentAdmission.contractDigestSha256
    || input.preparedRun.preparedProviderEnvelope
      .canonicalBindings.providerNeutralPayloadDigestSha256 !==
      currentAdmission.providerNeutralPayload.payloadDigestSha256
    || input.preparedRun.preparedProviderEnvelope
      .canonicalBindings.routeDataAssuranceContractDigestSha256 !==
      currentAdmission.routeDataAssurance.contractDigestSha256
  ) {
    throw new Error(
      'canonical_living_frame_preapproval_attempt_reservation_stale',
    )
  }
}
