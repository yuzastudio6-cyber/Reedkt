import { z } from 'zod'

import {
  admitCanonicalProfessionalToolGpuDispatch,
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  assertCanonicalProfessionalToolGpuRuntimeRelease,
  canonicalProfessionalToolGpuDispatchAdmissionSchema,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import { canonicalWorkItemSchema } from '../validation/edit-planning-authority-schemas'
import {
  assertCanonicalProfessionalGoogleCloudGpuRateAuthority,
} from '../tool-cost-metering/canonical-professional-google-cloud-gpu-rate-authority'
import {
  assertCanonicalProfessionalGpuPlanDispatchEstimateSet,
  assertCanonicalProfessionalGpuPlanPreapprovalManifest,
  assertCanonicalProfessionalGpuPlanPricingBasis,
  assertCanonicalProfessionalGpuPlanPublicationBinding,
  canonicalProfessionalGpuPlanDispatchEstimateSetSchema,
  canonicalProfessionalGpuPlanPreapprovalManifestSchema,
  canonicalProfessionalGpuPlanPricingBasisSchema,
  canonicalProfessionalGpuPlanPublicationBindingSchema,
  canonicalProfessionalGpuWorkGraphPricingStructureDigest,
  canonicalProfessionalGpuWorkItemPricingStructureDigest,
  type CanonicalProfessionalGpuPlanDispatchEstimateSet,
  type CanonicalProfessionalGpuPlanPreapprovalManifest,
  type CanonicalProfessionalGpuPlanPricingBasis,
  type CanonicalProfessionalGpuPlanPublicationBinding,
} from './canonical-professional-gpu-plan-preapproval-authority-service'
import {
  type CanonicalApprovedExecutionAuthority,
  type CanonicalApprovedExecutionWorkItem,
} from './edit-planning-authority-service'
import {
  canonicalConfirmedOutputFrameAuthoritySchema,
  type CanonicalConfirmedOutputFrameAuthority,
} from './canonical-confirmed-output-frame-authority'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31CurrentA100CustomerDispatchAllowed,
  type CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'

export const CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_AUTHORITY_BUNDLE_VERSION =
  'canonical-professional-gpu-plan-pricing-authority-bundle-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_APPROVED_FUNDING_OBSERVATION_VERSION =
  'canonical-professional-gpu-approved-funding-observation-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_ATTEMPT_START_AUTHORITY_VERSION =
  'canonical-professional-gpu-attempt-start-authority-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_FUNDED_DISPATCH_ADMISSION_VERSION =
  'canonical-professional-gpu-funded-dispatch-admission-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
  'l4_standard_primary',
])
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  planningRequestId: safeId,
  editPlanId: safeId,
  editPlanVersion: positiveInteger,
  outputId: safeId,
}).strict()

const pricingBundleWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_AUTHORITY_BUNDLE_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_pricing_authority_repository',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  bundleId: safeId,
  repositoryRecordRef: evidenceRefSchema,
  pricingBasis: canonicalProfessionalGpuPlanPricingBasisSchema,
  preapprovalManifest: canonicalProfessionalGpuPlanPreapprovalManifestSchema,
  publicationBinding: canonicalProfessionalGpuPlanPublicationBindingSchema,
  dispatchEstimateSet: canonicalProfessionalGpuPlanDispatchEstimateSetSchema,
  createOnlyPersistenceVerified: z.literal(true),
  exactPostPersistenceReread: z.literal(true),
  browserOrCallerPricingArtifactAccepted: z.literal(false),
  persistedAt: timestamp,
}).strict()

export const canonicalProfessionalGpuPlanPricingAuthorityBundleSchema =
  pricingBundleWithoutHashSchema.extend({ bundleHash: sha256 }).strict()
export type CanonicalProfessionalGpuPlanPricingAuthorityBundle = z.infer<
  typeof canonicalProfessionalGpuPlanPricingAuthorityBundleSchema
>

const confirmedFrameSchema = z.object({
  outputFrameRef: evidenceRefSchema,
  outputId: safeId,
  aspectRatio: z.string().trim().min(1).max(32),
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  fpsNumerator: positiveInteger.max(1_000_000),
  fpsDenominator: positiveInteger.max(1_000_000),
  confirmedByUser: z.literal(true),
  confirmationRecordId: safeId,
}).strict()

const approvedWorkObservationSchema = z.object({
  workItemKey: safeId,
  approvedWorkItemRef: evidenceRefSchema,
  canonicalWorkItemDigestSha256: sha256,
  pricingStructureDigestSha256: sha256,
  workItemType: safeId,
  workerClass: safeId,
  approvedToolIds: z.array(safeId).min(1).max(64),
  maximumCreditBudget: nonnegativeInteger.max(10_000_000),
  required: z.boolean(),
}).strict()

const approvedFundingWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_APPROVED_FUNDING_OBSERVATION_VERSION,
  ),
  source: z.literal('canonical_edit_planning_authority_reread'),
  evidenceClass: z.literal('canonical_private_reread'),
  observationId: safeId,
  scope: scopeSchema,
  publishedPlanRef: evidenceRefSchema,
  publishedCustomerEstimateRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  confirmedOutputFrame: confirmedFrameSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItem: approvedWorkObservationSchema,
  canonicalWorkGraphDigestSha256: sha256,
  canonicalWorkGraphPricingStructureDigestSha256: sha256,
  canonicalCustomerEstimateDigestSha256: sha256,
  canonicalGpuEstimateLineSetDigestSha256: sha256,
  canonicalGpuEstimateLineCount: positiveInteger.max(256),
  approvedMaximumCredits: nonnegativeInteger.max(10_000_000),
  reservationStatus: z.enum(['reserved', 'partially_spent']),
  originallyReservedCredits: nonnegativeInteger.max(10_000_000),
  remainingReservedCredits: positiveInteger.max(10_000_000),
  reservationExpiresAt: timestamp,
  immutableSnapshotAndApprovalReread: z.literal(true),
  exactCustomerEstimateReread: z.literal(true),
  exactApprovedWorkAndFrameReread: z.literal(true),
  activeFundedReservationReread: z.literal(true),
  callerApprovalEstimateOrReservationAccepted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((observation, context) => {
  const exact = observation.confirmedOutputFrame.outputId ===
      observation.scope.outputId
    && observation.publishedPlanRef.id === observation.scope.editPlanId
    && observation.publishedPlanRef.version ===
      observation.scope.editPlanVersion
    && observation.originallyReservedCredits ===
      observation.approvedMaximumCredits
    && observation.remainingReservedCredits <=
      observation.originallyReservedCredits
    && Date.parse(observation.reservationExpiresAt) >
      Date.parse(observation.observedAt)
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'Approved GPU funding observation lost plan, frame, or credit truth.',
  })
})

export const canonicalProfessionalGpuApprovedFundingObservationSchema =
  approvedFundingWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalProfessionalGpuApprovedFundingObservation = z.infer<
  typeof canonicalProfessionalGpuApprovedFundingObservationSchema
>

const priorFailureClassSchema = z.enum([
  'not_applicable',
  'a100_capacity_unavailable_before_attempt_start',
  'a100_job_boot_failed_before_private_media_read',
  'a100_runtime_qualification_blocked_before_dispatch',
  'a100_driver_or_cuda_incompatible_before_model_load',
])

const attemptStartWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_ATTEMPT_START_AUTHORITY_VERSION,
  ),
  source: z.literal('canonical_server_user_triggered_gpu_attempt_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  attemptAuthorityId: safeId,
  scope: scopeSchema,
  approvedSnapshotRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  idempotencyKey: safeId,
  routeId: routeIdSchema,
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  priorPrimaryTerminalReceiptRef: evidenceRefSchema.nullable(),
  priorPrimaryFailureClass: priorFailureClassSchema,
  priorPrimaryOutcomeKnownNotExecuted: z.boolean(),
  authenticatedOwnerUserTriggerVerified: z.literal(true),
  createOnlyAttemptAndLeaseVerified: z.literal(true),
  serverSelectedRouteFromPlacementPolicy: z.literal(true),
  unknownPriorOutcomeMayRetryOrFallback: z.literal(false),
  callerRouteImageModelCommandOrPriceAccepted: z.literal(false),
  triggeredAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((attempt, context) => {
  const fallback = attempt.routeId === 'l4_heavy_fallback'
  const exactAttempt = fallback
    ? attempt.attemptOrdinal === 2
      && attempt.priorPrimaryTerminalReceiptRef !== null
      && attempt.priorPrimaryFailureClass !== 'not_applicable'
      && attempt.priorPrimaryOutcomeKnownNotExecuted
    : attempt.attemptOrdinal === 1
      && attempt.priorPrimaryTerminalReceiptRef === null
      && attempt.priorPrimaryFailureClass === 'not_applicable'
      && !attempt.priorPrimaryOutcomeKnownNotExecuted
  if (!exactAttempt
    || Date.parse(attempt.expiresAt) <= Date.parse(attempt.triggeredAt)) {
    context.addIssue({
      code: 'custom',
      message: 'GPU attempt-start authority lost safe trigger or fallback truth.',
    })
  }
})

export const canonicalProfessionalGpuAttemptStartAuthoritySchema =
  attemptStartWithoutHashSchema.extend({ attemptAuthorityHash: sha256 })
    .strict()
export type CanonicalProfessionalGpuAttemptStartAuthority = z.infer<
  typeof canonicalProfessionalGpuAttemptStartAuthoritySchema
>

const fundedAdmissionWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_FUNDED_DISPATCH_ADMISSION_VERSION,
  ),
  source: z.literal(
    'canonical_server_professional_gpu_funded_dispatch_reconciliation',
  ),
  fundedAdmissionId: safeId,
  scope: scopeSchema,
  pricingAuthorityBundleRef: evidenceRefSchema,
  pricingBasisRef: evidenceRefSchema,
  preapprovalManifestRef: evidenceRefSchema,
  publicationBindingRef: evidenceRefSchema,
  dispatchEstimateSetRef: evidenceRefSchema,
  approvedFundingObservationRef: evidenceRefSchema,
  attemptStartAuthorityRef: evidenceRefSchema,
  pricingUnitRef: evidenceRefSchema,
  preapprovalManifestEntryDigestSha256: sha256,
  approvedPlanRef: evidenceRefSchema,
  approvedCustomerEstimateRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  userApprovalRecordRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  gpuManifestTotalCeilingCredits: nonnegativeInteger.max(10_000_000),
  approvedCustomerEstimateMaximumCredits:
    nonnegativeInteger.max(10_000_000),
  originallyReservedCredits: nonnegativeInteger.max(10_000_000),
  remainingReservedCreditsAtAdmission: positiveInteger.max(10_000_000),
  approvedWorkItemGpuCeilingCredits: nonnegativeInteger.max(10_000_000),
  toolDispatchAdmission: canonicalProfessionalToolGpuDispatchAdmissionSchema,
  exactPreapprovalPriceCalculationReused: z.literal(true),
  exactPublishedPlanEstimateSnapshotApprovalReservationReread:
    z.literal(true),
  fullCustomerEstimateFundedBeforeDispatch: z.literal(true),
  currentWorkCeilingStillCovered: z.literal(true),
  exactQualifiedRuntimeReleaseAndCurrentRateReread: z.literal(true),
  authenticatedUserTriggeredScaleFromZero: z.literal(true),
  callerApprovalReservationRatePriceRouteOrRuntimeAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  cloudJobCreated: z.literal(false),
  admittedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((admission, context) => {
  if (
    admission.approvedCustomerEstimateMaximumCredits !==
      admission.originallyReservedCredits
    || admission.gpuManifestTotalCeilingCredits >
      admission.approvedCustomerEstimateMaximumCredits
    || admission.approvedWorkItemGpuCeilingCredits >
      admission.remainingReservedCreditsAtAdmission
    || Date.parse(admission.expiresAt) <= Date.parse(admission.admittedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Funded GPU admission lost exact plan or reservation coverage.',
  })
})

export const canonicalProfessionalGpuFundedDispatchAdmissionSchema =
  fundedAdmissionWithoutHashSchema.extend({ fundedAdmissionHash: sha256 })
    .strict()
export type CanonicalProfessionalGpuFundedDispatchAdmission = z.infer<
  typeof canonicalProfessionalGpuFundedDispatchAdmissionSchema
>

export interface CanonicalProfessionalGpuPlanPricingAuthorityReadPort {
  rereadPrivatePricingAuthority(input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuApprovedFundingReadPort {
  rereadApprovedFunding(input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuAttemptStartAuthorityReadPort {
  rereadCreateOnlyAttemptStart(input: {
    readonly workspaceId: string
    readonly snapshotId: string
    readonly workItemKey: string
    readonly at: string
  }): Promise<unknown>
}

export interface CanonicalProfessionalGpuRuntimeDispatchContextReadPort {
  rereadQualifiedRuntimeRelease(input: {
    readonly toolId: string
    readonly operationId: string
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly exactToolOrModelReleaseRef: z.infer<typeof evidenceRefSchema>
    readonly at: string
  }): Promise<unknown>
  rereadApprovedCurrentRate(input: {
    readonly rateAuthorityRef: z.infer<typeof evidenceRefSchema>
    readonly routeId: z.infer<typeof routeIdSchema>
    readonly at: string
  }): Promise<unknown>
}

export function createCanonicalProfessionalGpuPlanPricingAuthorityBundle(
  input: {
    readonly bundleId: string
    readonly repositoryRecordRef: z.input<typeof evidenceRefSchema>
    readonly pricingBasis: CanonicalProfessionalGpuPlanPricingBasis
    readonly preapprovalManifest:
      CanonicalProfessionalGpuPlanPreapprovalManifest
    readonly publicationBinding:
      CanonicalProfessionalGpuPlanPublicationBinding
    readonly dispatchEstimateSet:
      CanonicalProfessionalGpuPlanDispatchEstimateSet
    readonly persistedAt: string
  },
): CanonicalProfessionalGpuPlanPricingAuthorityBundle {
  assertPlainSerializedData(input, 'gpu_pricing_authority_bundle_input')
  const basis = assertCanonicalProfessionalGpuPlanPricingBasis(
    input.pricingBasis,
  )
  const manifest = assertCanonicalProfessionalGpuPlanPreapprovalManifest(
    input.preapprovalManifest,
    basis,
    input.persistedAt,
  )
  const binding = assertCanonicalProfessionalGpuPlanPublicationBinding(
    input.publicationBinding,
  )
  const estimateSet = assertCanonicalProfessionalGpuPlanDispatchEstimateSet(
    input.dispatchEstimateSet,
  )
  if (
    !sameRef(binding.pricingBasisRef, ref(
      `gpu-pricing-basis:${basis.scope.planningRequestId}`,
      basis.pricingBasisHash,
    ))
    || !sameRef(binding.preapprovalManifestRef, ref(
      manifest.manifestId,
      manifest.manifestHash,
      manifest.manifestVersion,
    ))
    || !sameRef(estimateSet.pricingBasisRef, binding.pricingBasisRef)
    || !sameRef(estimateSet.preapprovalManifestRef,
      binding.preapprovalManifestRef)
    || !sameRef(estimateSet.publicationBindingRef, ref(
      binding.bindingId,
      binding.bindingHash,
    ))
    || !sameRef(estimateSet.publishedPlanRef, binding.publishedPlanRef)
    || !sameRef(estimateSet.publishedCustomerEstimateRef,
      binding.publishedCustomerEstimateRef)
  ) throw new Error('GPU pricing authority bundle contains crossed lineage.')
  const payload = pricingBundleWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_PLAN_PRICING_AUTHORITY_BUNDLE_VERSION,
    source: 'canonical_server_professional_gpu_pricing_authority_repository',
    evidenceClass: 'canonical_private_reread',
    bundleId: input.bundleId,
    repositoryRecordRef: input.repositoryRecordRef,
    pricingBasis: basis,
    preapprovalManifest: manifest,
    publicationBinding: binding,
    dispatchEstimateSet: estimateSet,
    createOnlyPersistenceVerified: true,
    exactPostPersistenceReread: true,
    browserOrCallerPricingArtifactAccepted: false,
    persistedAt: input.persistedAt,
  })
  return canonicalProfessionalGpuPlanPricingAuthorityBundleSchema.parse({
    ...payload,
    bundleHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalProfessionalGpuApprovedFundingObservation(
  input: {
    readonly observationId: string
    readonly authority: CanonicalApprovedExecutionAuthority
    readonly confirmedOutputFrameAuthority:
      CanonicalConfirmedOutputFrameAuthority
    readonly workItemKey: string
    readonly observedAt: string
  },
): CanonicalProfessionalGpuApprovedFundingObservation {
  assertPlainSerializedData(input, 'gpu_approved_funding_input')
  const authority = input.authority
  const frameAuthority = canonicalConfirmedOutputFrameAuthoritySchema.parse(
    input.confirmedOutputFrameAuthority,
  )
  const { authorityDigestSha256, ...frameAuthorityPayload } = frameAuthority
  if (
    authorityDigestSha256 !== sha256AuthorityValue(frameAuthorityPayload)
    || frameAuthority.workspaceId !== authority.snapshot.workspaceId
    || frameAuthority.projectId !== authority.snapshot.projectId
    || frameAuthority.editSessionId !== authority.snapshot.editSessionId
  ) throw new Error(
    'Approved GPU funding confirmed-output authority is invalid or crossed.',
  )
  const workItems = authority.workItems.map(canonicalWorkItemFromApproved)
  const approvedWorkItem = authority.workItems.find((workItem) =>
    workItem.workItemKey === input.workItemKey)
  const canonicalWorkItem = workItems.find((workItem) =>
    workItem.workItemKey === input.workItemKey)
  const confirmed = frameAuthority.confirmedOutputBinding
  const masterTimingComponentRef =
    authority.snapshot.componentRefs.masterTimingPlan
  const customerEstimate = authority.canonicalCustomerEstimateAuthority
  const customerAuthorityWithoutDigest = {
    ...customerEstimate,
  }
  Reflect.deleteProperty(
    customerAuthorityWithoutDigest,
    'authorityDigestSha256',
  )
  const remaining = authority.reservation.reservedCredits
    - authority.reservation.spentCredits
    - authority.reservation.releasedCredits
    - authority.reservation.refundedCredits
  if (
    !approvedWorkItem
    || !canonicalWorkItem
    || !confirmed
    || !masterTimingComponentRef
    || customerEstimate.authorityDigestSha256 !==
      sha256AuthorityValue(customerAuthorityWithoutDigest)
    || !['reserved', 'partially_spent'].includes(
      authority.reservation.status,
    )
    || remaining <= 0
    || Date.parse(authority.reservation.expiresAt) <=
      Date.parse(input.observedAt)
  ) throw new Error('Approved GPU funding authority is incomplete or stale.')
  const gpuLines = customerEstimate.normalizedEstimate.lineItems.filter(
    (line) => line.category === 'gpu_tool_infrastructure'
      || line.lineKey.startsWith('gpu-tool-'),
  )
  if (gpuLines.length === 0) {
    throw new Error('Approved customer estimate has no GPU pricing lines.')
  }
  const fpsNumerator = confirmed.fpsNumerator
  const fpsDenominator = confirmed.fpsDenominator
  const payload = approvedFundingWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_APPROVED_FUNDING_OBSERVATION_VERSION,
    source: 'canonical_edit_planning_authority_reread',
    evidenceClass: 'canonical_private_reread',
    observationId: input.observationId,
    scope: {
      ownerUserId: authority.approval.approvedByUserId,
      workspaceId: authority.snapshot.workspaceId,
      projectId: authority.snapshot.projectId,
      editSessionId: authority.snapshot.editSessionId,
      planningRequestId: authority.plan.planningRequestId,
      editPlanId: authority.plan.id,
      editPlanVersion: authority.plan.planVersion,
      outputId: confirmed.outputId,
    },
    publishedPlanRef: ref(
      authority.plan.id,
      authority.plan.planHash,
      authority.plan.planVersion,
    ),
    publishedCustomerEstimateRef: ref(
      authority.estimate.id,
      authority.estimate.estimateHash,
      authority.estimate.estimateVersion,
    ),
    approvedSnapshotRef: ref(
      authority.snapshot.snapshotId,
      authority.snapshot.snapshotHash,
      authority.snapshot.planVersion,
    ),
    userApprovalRecordRef: ref(
      authority.approval.id,
      sha256AuthorityValue(authority.approval),
    ),
    fundedReservationRef: ref(
      authority.reservation.id,
      sha256AuthorityValue(authority.reservation),
    ),
    confirmedOutputFrame: {
      outputFrameRef: confirmed.confirmedOutputFrameRef,
      outputId: confirmed.outputId,
      aspectRatio: confirmed.aspectRatioLabel,
      width: confirmed.width,
      height: confirmed.height,
      fpsNumerator,
      fpsDenominator,
      confirmedByUser: confirmed.confirmedByUser,
      confirmationRecordId: confirmed.confirmationRecordId,
    },
    masterTimingRef: ref(
      'master-timing-plan',
      masterTimingComponentRef.sha256,
      authority.plan.planVersion,
    ),
    approvedWorkItem: {
      workItemKey: approvedWorkItem.workItemKey,
      approvedWorkItemRef: ref(
        approvedWorkItem.id,
        sha256AuthorityValue(approvedWorkItem),
        authority.plan.planVersion,
      ),
      canonicalWorkItemDigestSha256:
        sha256AuthorityValue(canonicalWorkItem),
      pricingStructureDigestSha256:
        canonicalProfessionalGpuWorkItemPricingStructureDigest(
          canonicalWorkItem,
        ),
      workItemType: approvedWorkItem.workItemType,
      workerClass: approvedWorkItem.workerClass,
      approvedToolIds: approvedWorkItem.approvedToolIds,
      maximumCreditBudget: approvedWorkItem.maximumCreditBudget,
      required: approvedWorkItem.required,
    },
    canonicalWorkGraphDigestSha256: sha256AuthorityValue(workItems),
    canonicalWorkGraphPricingStructureDigestSha256:
      canonicalProfessionalGpuWorkGraphPricingStructureDigest(workItems),
    canonicalCustomerEstimateDigestSha256:
      sha256AuthorityValue(customerEstimate.normalizedEstimate),
    canonicalGpuEstimateLineSetDigestSha256: sha256AuthorityValue(gpuLines),
    canonicalGpuEstimateLineCount: gpuLines.length,
    approvedMaximumCredits: authority.estimate.approvedMaximumCredits,
    reservationStatus: authority.reservation.status,
    originallyReservedCredits: authority.reservation.reservedCredits,
    remainingReservedCredits: remaining,
    reservationExpiresAt: authority.reservation.expiresAt,
    immutableSnapshotAndApprovalReread: true,
    exactCustomerEstimateReread: true,
    exactApprovedWorkAndFrameReread: true,
    activeFundedReservationReread: true,
    callerApprovalEstimateOrReservationAccepted: false,
    observedAt: input.observedAt,
  })
  return assertCanonicalProfessionalGpuApprovedFundingObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  }, input.observedAt)
}

export function createCanonicalProfessionalGpuAttemptStartAuthority(input: {
  readonly attemptAuthorityId: string
  readonly scope: z.input<typeof scopeSchema>
  readonly approvedSnapshotRef: z.input<typeof evidenceRefSchema>
  readonly approvedWorkItemRef: z.input<typeof evidenceRefSchema>
  readonly workerLeaseRef: z.input<typeof evidenceRefSchema>
  readonly userTriggerRecordRef: z.input<typeof evidenceRefSchema>
  readonly executionAttemptRef: z.input<typeof evidenceRefSchema>
  readonly idempotencyKey: string
  readonly routeId: z.infer<typeof routeIdSchema>
  readonly priorPrimaryTerminalReceiptRef?: z.input<typeof evidenceRefSchema>
  readonly priorPrimaryFailureClass?: z.infer<typeof priorFailureClassSchema>
  readonly priorPrimaryOutcomeKnownNotExecuted?: boolean
  readonly triggeredAt: string
  readonly expiresAt: string
}): CanonicalProfessionalGpuAttemptStartAuthority {
  assertPlainSerializedData(input, 'gpu_attempt_start_input')
  const fallback = input.routeId === 'l4_heavy_fallback'
  const payload = attemptStartWithoutHashSchema.parse({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_ATTEMPT_START_AUTHORITY_VERSION,
    source: 'canonical_server_user_triggered_gpu_attempt_owner',
    evidenceClass: 'canonical_private_reread',
    attemptAuthorityId: input.attemptAuthorityId,
    scope: input.scope,
    approvedSnapshotRef: input.approvedSnapshotRef,
    approvedWorkItemRef: input.approvedWorkItemRef,
    workerLeaseRef: input.workerLeaseRef,
    userTriggerRecordRef: input.userTriggerRecordRef,
    executionAttemptRef: input.executionAttemptRef,
    idempotencyKey: input.idempotencyKey,
    routeId: input.routeId,
    attemptOrdinal: fallback ? 2 : 1,
    priorPrimaryTerminalReceiptRef:
      input.priorPrimaryTerminalReceiptRef ?? null,
    priorPrimaryFailureClass:
      input.priorPrimaryFailureClass ?? 'not_applicable',
    priorPrimaryOutcomeKnownNotExecuted:
      input.priorPrimaryOutcomeKnownNotExecuted ?? false,
    authenticatedOwnerUserTriggerVerified: true,
    createOnlyAttemptAndLeaseVerified: true,
    serverSelectedRouteFromPlacementPolicy: true,
    unknownPriorOutcomeMayRetryOrFallback: false,
    callerRouteImageModelCommandOrPriceAccepted: false,
    triggeredAt: input.triggeredAt,
    expiresAt: input.expiresAt,
  })
  return assertCanonicalProfessionalGpuAttemptStartAuthority({
    ...payload,
    attemptAuthorityHash: sha256AuthorityValue(payload),
  }, input.triggeredAt)
}

export async function admitCanonicalProfessionalGpuPlanFundedDispatch(input: {
  readonly fundedAdmissionId: string
  readonly workspaceId: string
  readonly snapshotId: string
  readonly workItemKey: string
  readonly pricingAuthorityReadPort:
    CanonicalProfessionalGpuPlanPricingAuthorityReadPort
  readonly approvedFundingReadPort:
    CanonicalProfessionalGpuApprovedFundingReadPort
  readonly attemptStartReadPort:
    CanonicalProfessionalGpuAttemptStartAuthorityReadPort
  readonly runtimeContextReadPort:
    CanonicalProfessionalGpuRuntimeDispatchContextReadPort
  readonly a100CustomerDispatchReadinessReadPort?:
    CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
  readonly admittedAt: string
  readonly expiresAt: string
}): Promise<CanonicalProfessionalGpuFundedDispatchAdmission> {
  const [untrustedBundle, untrustedFunding, untrustedAttempt] =
    await Promise.all([
      input.pricingAuthorityReadPort.rereadPrivatePricingAuthority({
        workspaceId: input.workspaceId,
        snapshotId: input.snapshotId,
        workItemKey: input.workItemKey,
        at: input.admittedAt,
      }),
      input.approvedFundingReadPort.rereadApprovedFunding({
        workspaceId: input.workspaceId,
        snapshotId: input.snapshotId,
        workItemKey: input.workItemKey,
        at: input.admittedAt,
      }),
      input.attemptStartReadPort.rereadCreateOnlyAttemptStart({
        workspaceId: input.workspaceId,
        snapshotId: input.snapshotId,
        workItemKey: input.workItemKey,
        at: input.admittedAt,
      }),
    ])
  assertPlainSerializedData(untrustedBundle, 'gpu_pricing_authority_bundle')
  assertPlainSerializedData(untrustedFunding, 'gpu_approved_funding')
  assertPlainSerializedData(untrustedAttempt, 'gpu_attempt_start')
  const bundle = assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
    untrustedBundle,
    input.admittedAt,
  )
  const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
    untrustedFunding,
    input.admittedAt,
  )
  const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
    untrustedAttempt,
    input.admittedAt,
  )
  const basis = bundle.pricingBasis
  const manifest = bundle.preapprovalManifest
  const binding = bundle.publicationBinding
  const estimateSet = bundle.dispatchEstimateSet
  const manifestEntry = manifest.entries.find((entry) =>
    entry.workItemKey === input.workItemKey)
  const estimateEntry = estimateSet.entries.find((entry) =>
    entry.workItemKey === input.workItemKey)
  const pricingUnit = basis.pricingUnits.find((entry) =>
    entry.workItemKey === input.workItemKey)
  if (!manifestEntry || !estimateEntry || !pricingUnit) {
    throw new Error('GPU funded dispatch work item is not exactly priced.')
  }
  const expectedGpuLines = manifest.entries.map((entry) =>
    entry.customerEstimateLine)
  const fps = funding.confirmedOutputFrame.fpsNumerator
    / funding.confirmedOutputFrame.fpsDenominator
  if (
    input.workspaceId !== funding.scope.workspaceId
    || input.snapshotId !== funding.approvedSnapshotRef.id
    || !sameScope(funding.scope, basis.scope, binding.publishedPlanRef)
    || !sameScope(funding.scope, attempt.scope, binding.publishedPlanRef)
    || !sameRef(binding.publishedPlanRef, funding.publishedPlanRef)
    || !sameRef(binding.publishedCustomerEstimateRef,
      funding.publishedCustomerEstimateRef)
    || binding.publishedCanonicalWorkGraphDigestSha256 !==
      funding.canonicalWorkGraphDigestSha256
    || binding.publishedCustomerEstimateDigestSha256 !==
      funding.canonicalCustomerEstimateDigestSha256
    || basis.canonicalWorkGraphPricingStructureDigestSha256 !==
      funding.canonicalWorkGraphPricingStructureDigestSha256
    || basis.masterTimingDigestSha256 !==
      funding.masterTimingRef.contentHash.slice('sha256:'.length)
    || !sameRef(basis.confirmedOutputFrame.outputFrameRef,
      funding.confirmedOutputFrame.outputFrameRef)
    || basis.confirmedOutputFrame.outputId !==
      funding.confirmedOutputFrame.outputId
    || basis.confirmedOutputFrame.aspectRatio !==
      funding.confirmedOutputFrame.aspectRatio
    || basis.confirmedOutputFrame.width !== funding.confirmedOutputFrame.width
    || basis.confirmedOutputFrame.height !== funding.confirmedOutputFrame.height
    || basis.confirmedOutputFrame.fps !== fps
    || funding.canonicalGpuEstimateLineSetDigestSha256 !==
      sha256AuthorityValue(expectedGpuLines)
    || funding.canonicalGpuEstimateLineCount !== expectedGpuLines.length
    || funding.approvedMaximumCredits <
      manifest.totalMaximumReservedToolCostCredits
    || funding.originallyReservedCredits !== funding.approvedMaximumCredits
    || funding.remainingReservedCredits <
      estimateEntry.estimate.maximumReservedToolCostCredits
    || !sameRef(funding.approvedWorkItem.approvedWorkItemRef,
      estimateEntry.approvedWorkItemRef)
    || !sameRef(attempt.approvedSnapshotRef, funding.approvedSnapshotRef)
    || !sameRef(attempt.approvedWorkItemRef,
      funding.approvedWorkItem.approvedWorkItemRef)
    || funding.approvedWorkItem.pricingStructureDigestSha256 !==
      pricingUnit.workItemPricingStructureDigestSha256
    || funding.approvedWorkItem.maximumCreditBudget !==
      estimateEntry.estimate.maximumReservedToolCostCredits
    || funding.approvedWorkItem.approvedToolIds.length !== 1
    || funding.approvedWorkItem.approvedToolIds[0] !==
      estimateEntry.estimate.scope.toolId
    || manifestEntry.customerEstimateLine.estimatedCredits !==
      estimateEntry.estimate.maximumReservedToolCostCredits
    || manifestEntry.pricingUnitRef.contentHash !==
      `sha256:${pricingUnit.pricingUnitHash}`
    || estimateEntry.preapprovalManifestEntryDigestSha256 !==
      sha256AuthorityValue(manifestEntry)
  ) throw new Error(
    'GPU funded dispatch lost exact plan, pricing, approval, or reservation lineage.',
  )
  const approvedRoute = attempt.routeId === 'l4_heavy_fallback'
    ? estimateEntry.estimate.fallback
    : estimateEntry.estimate.primary
  if (!approvedRoute) throw new Error('GPU attempt route was not preapproved.')
  const [untrustedRelease, untrustedRate] = await Promise.all([
    input.runtimeContextReadPort.rereadQualifiedRuntimeRelease({
      toolId: estimateEntry.estimate.scope.toolId,
      operationId: estimateEntry.estimate.scope.operationId,
      routeId: attempt.routeId,
      exactToolOrModelReleaseRef:
        estimateEntry.estimate.scope.exactToolOrModelReleaseRef,
      at: input.admittedAt,
    }),
    input.runtimeContextReadPort.rereadApprovedCurrentRate({
      rateAuthorityRef: approvedRoute.rateAuthorityRef,
      routeId: attempt.routeId,
      at: input.admittedAt,
    }),
  ])
  assertPlainSerializedData(untrustedRelease, 'gpu_runtime_release')
  assertPlainSerializedData(untrustedRate, 'gpu_current_rate')
  const release = assertCanonicalProfessionalToolGpuRuntimeRelease(
    untrustedRelease,
    input.admittedAt,
  )
  const rate = assertCanonicalProfessionalGoogleCloudGpuRateAuthority(
    untrustedRate,
    input.admittedAt,
  )
  if (attempt.routeId === 'a100_80gb_heavy_primary') {
    if (!input.a100CustomerDispatchReadinessReadPort) {
      throw new Error(
        'Current A100 customer-dispatch readiness port is not mounted.',
      )
    }
    const runtimeReleaseRef = ref(
      release.releaseId,
      release.releaseHash,
      release.releaseVersion,
    )
    const rateAuthorityRef = ref(
      rate.rateAuthorityId,
      rate.rateAuthorityHash,
      rate.rateAuthorityVersion,
    )
    const readiness = await input.a100CustomerDispatchReadinessReadPort
      .rereadCurrent({
        toolId: 'sam3_1',
        operationId: 'tool.sam3_1.track_and_segment_video.v1',
        runtimeReleaseRef,
        rateAuthorityRef,
        at: input.admittedAt,
      })
    if (!readiness) throw new Error(
      'Current A100 customer-dispatch readiness is missing.',
    )
    assertCanonicalSam31CurrentA100CustomerDispatchAllowed({
      readiness,
      runtimeReleaseRef,
      rateAuthorityRef,
      immutableImageDigest: release.immutableImageDigest,
      at: input.admittedAt,
    })
  }
  const toolAdmission = admitCanonicalProfessionalToolGpuDispatch({
    admissionId: `${input.fundedAdmissionId}.tool-admission`,
    estimate: estimateEntry.estimate,
    runtimeRelease: release,
    currentRateAuthority: rate,
    scope: {
      ownerUserId: funding.scope.ownerUserId,
      workspaceId: funding.scope.workspaceId,
      projectId: funding.scope.projectId,
      editSessionId: funding.scope.editSessionId,
      editPlanId: funding.scope.editPlanId,
      editPlanVersion: funding.scope.editPlanVersion,
      approvedSnapshotRef: funding.approvedSnapshotRef,
      confirmedOutputFrameRef:
        funding.confirmedOutputFrame.outputFrameRef,
      masterTimingRef: funding.masterTimingRef,
      approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
      workerLeaseRef: attempt.workerLeaseRef,
      fundedReservationRef: funding.fundedReservationRef,
      userApprovalRecordRef: funding.userApprovalRecordRef,
      userTriggerRecordRef: attempt.userTriggerRecordRef,
      executionAttemptRef: attempt.executionAttemptRef,
      idempotencyKey: attempt.idempotencyKey,
    },
    routeId: attempt.routeId,
    priorPrimaryTerminalReceiptRef:
      attempt.priorPrimaryTerminalReceiptRef ?? undefined,
    priorPrimaryFailureClass: attempt.priorPrimaryFailureClass,
    priorPrimaryOutcomeKnownNotExecuted:
      attempt.priorPrimaryOutcomeKnownNotExecuted,
    admittedAt: input.admittedAt,
    expiresAt: input.expiresAt,
  })
  const payload = fundedAdmissionWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_FUNDED_DISPATCH_ADMISSION_VERSION,
    source:
      'canonical_server_professional_gpu_funded_dispatch_reconciliation',
    fundedAdmissionId: input.fundedAdmissionId,
    scope: funding.scope,
    pricingAuthorityBundleRef: ref(bundle.bundleId, bundle.bundleHash),
    pricingBasisRef: binding.pricingBasisRef,
    preapprovalManifestRef: binding.preapprovalManifestRef,
    publicationBindingRef: ref(binding.bindingId, binding.bindingHash),
    dispatchEstimateSetRef: ref(
      estimateSet.estimateSetId,
      estimateSet.estimateSetHash,
    ),
    approvedFundingObservationRef: ref(
      funding.observationId,
      funding.observationHash,
    ),
    attemptStartAuthorityRef: ref(
      attempt.attemptAuthorityId,
      attempt.attemptAuthorityHash,
    ),
    pricingUnitRef: manifestEntry.pricingUnitRef,
    preapprovalManifestEntryDigestSha256:
      estimateEntry.preapprovalManifestEntryDigestSha256,
    approvedPlanRef: funding.publishedPlanRef,
    approvedCustomerEstimateRef: funding.publishedCustomerEstimateRef,
    approvedSnapshotRef: funding.approvedSnapshotRef,
    userApprovalRecordRef: funding.userApprovalRecordRef,
    fundedReservationRef: funding.fundedReservationRef,
    approvedWorkItemRef: funding.approvedWorkItem.approvedWorkItemRef,
    gpuManifestTotalCeilingCredits:
      manifest.totalMaximumReservedToolCostCredits,
    approvedCustomerEstimateMaximumCredits: funding.approvedMaximumCredits,
    originallyReservedCredits: funding.originallyReservedCredits,
    remainingReservedCreditsAtAdmission: funding.remainingReservedCredits,
    approvedWorkItemGpuCeilingCredits:
      estimateEntry.estimate.maximumReservedToolCostCredits,
    toolDispatchAdmission: toolAdmission,
    exactPreapprovalPriceCalculationReused: true,
    exactPublishedPlanEstimateSnapshotApprovalReservationReread: true,
    fullCustomerEstimateFundedBeforeDispatch: true,
    currentWorkCeilingStillCovered: true,
    exactQualifiedRuntimeReleaseAndCurrentRateReread: true,
    authenticatedUserTriggeredScaleFromZero: true,
    callerApprovalReservationRatePriceRouteOrRuntimeAccepted: false,
    customerCreditsMutated: false,
    cloudJobCreated: false,
    admittedAt: input.admittedAt,
    expiresAt: input.expiresAt,
  })
  return assertCanonicalProfessionalGpuFundedDispatchAdmission({
    ...payload,
    fundedAdmissionHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalProfessionalGpuPlanPricingAuthorityBundle(
  value: unknown,
  at?: string,
): CanonicalProfessionalGpuPlanPricingAuthorityBundle {
  assertPlainSerializedData(value, 'gpu_pricing_authority_bundle')
  const bundle = canonicalProfessionalGpuPlanPricingAuthorityBundleSchema
    .parse(value)
  const { bundleHash, ...payload } = bundle
  const rebuilt = createCanonicalProfessionalGpuPlanPricingAuthorityBundle({
    bundleId: bundle.bundleId,
    repositoryRecordRef: bundle.repositoryRecordRef,
    pricingBasis: bundle.pricingBasis,
    preapprovalManifest: bundle.preapprovalManifest,
    publicationBinding: bundle.publicationBinding,
    dispatchEstimateSet: bundle.dispatchEstimateSet,
    persistedAt: bundle.persistedAt,
  })
  if (
    bundleHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(bundle) !== stableAuthorityStringify(rebuilt)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(bundle.persistedAt)
      || Date.parse(at) >= Date.parse(bundle.preapprovalManifest.validUntil)
    ))
  ) throw new Error('GPU pricing authority bundle is invalid or stale.')
  return bundle
}

export function assertCanonicalProfessionalGpuApprovedFundingObservation(
  value: unknown,
  at?: string,
): CanonicalProfessionalGpuApprovedFundingObservation {
  assertPlainSerializedData(value, 'gpu_approved_funding_observation')
  const observation = canonicalProfessionalGpuApprovedFundingObservationSchema
    .parse(value)
  const { observationHash, ...payload } = observation
  if (
    observationHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(observation.observedAt)
      || Date.parse(at) >= Date.parse(observation.reservationExpiresAt)
    ))
  ) throw new Error('Approved GPU funding observation is invalid or stale.')
  return observation
}

export function assertCanonicalProfessionalGpuAttemptStartAuthority(
  value: unknown,
  at?: string,
): CanonicalProfessionalGpuAttemptStartAuthority {
  assertPlainSerializedData(value, 'gpu_attempt_start_authority')
  const attempt = canonicalProfessionalGpuAttemptStartAuthoritySchema.parse(
    value,
  )
  const { attemptAuthorityHash, ...payload } = attempt
  if (
    attemptAuthorityHash !== sha256AuthorityValue(payload)
    || (at !== undefined && (
      Date.parse(at) < Date.parse(attempt.triggeredAt)
      || Date.parse(at) >= Date.parse(attempt.expiresAt)
    ))
  ) throw new Error('GPU attempt-start authority is invalid or stale.')
  return attempt
}

export function assertCanonicalProfessionalGpuFundedDispatchAdmission(
  value: unknown,
): CanonicalProfessionalGpuFundedDispatchAdmission {
  assertPlainSerializedData(value, 'gpu_funded_dispatch_admission')
  const admission = canonicalProfessionalGpuFundedDispatchAdmissionSchema
    .parse(value)
  const { fundedAdmissionHash, ...payload } = admission
  const toolAdmission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    admission.toolDispatchAdmission,
  )
  if (
    fundedAdmissionHash !== sha256AuthorityValue(payload)
    || !sameRef(toolAdmission.scope.approvedSnapshotRef,
      admission.approvedSnapshotRef)
    || !sameRef(toolAdmission.scope.approvedWorkItemRef,
      admission.approvedWorkItemRef)
    || !sameRef(toolAdmission.scope.fundedReservationRef,
      admission.fundedReservationRef)
    || !sameRef(toolAdmission.scope.userApprovalRecordRef,
      admission.userApprovalRecordRef)
    || toolAdmission.scope.ownerUserId !== admission.scope.ownerUserId
    || toolAdmission.scope.workspaceId !== admission.scope.workspaceId
    || toolAdmission.scope.projectId !== admission.scope.projectId
    || toolAdmission.scope.editSessionId !== admission.scope.editSessionId
    || toolAdmission.scope.editPlanId !== admission.scope.editPlanId
    || toolAdmission.scope.editPlanVersion !== admission.scope.editPlanVersion
    || toolAdmission.estimateMaximumReservedToolCostCredits !==
      admission.approvedWorkItemGpuCeilingCredits
    || toolAdmission.admittedAt !== admission.admittedAt
    || toolAdmission.expiresAt !== admission.expiresAt
  ) throw new Error('Funded GPU dispatch admission is invalid.')
  return admission
}

function canonicalWorkItemFromApproved(
  workItem: CanonicalApprovedExecutionWorkItem,
) {
  return canonicalWorkItemSchema.parse({
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    executionInput: workItem.executionInput,
    sourceSequenceItemIds: workItem.sourceSequenceItemIds,
    sourceCleanupDecisionIds: workItem.sourceCleanupDecisionIds,
    expectedOutputs: workItem.expectedOutputs,
    dependencyKeys: workItem.dependencyKeys,
    approvedToolIds: workItem.approvedToolIds,
    approvedProviderRoute: workItem.approvedProviderRoute,
    providerExecutionMode: workItem.providerExecutionMode,
    fallbackPolicy: workItem.fallbackPolicy,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
  })
}

function sameScope(
  observed: z.infer<typeof scopeSchema>,
  other: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    planningRequestId?: string
    outputId: string
  },
  planRef: z.infer<typeof evidenceRefSchema>,
): boolean {
  return observed.ownerUserId === other.ownerUserId
    && observed.workspaceId === other.workspaceId
    && observed.projectId === other.projectId
    && observed.editSessionId === other.editSessionId
    && (other.planningRequestId === undefined
      || observed.planningRequestId === other.planningRequestId)
    && observed.outputId === other.outputId
    && observed.editPlanId === planRef.id
    && observed.editPlanVersion === planRef.version
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertPlainSerializedData(
  value: unknown,
  label: string,
): void {
  const active = new WeakSet<object>()
  let visitedNodes = 0
  const visit = (item: unknown, path: string, depth: number): void => {
    if (depth > 72) throw new Error(`${path} nesting is too deep.`)
    if (item === null || typeof item === 'string'
      || typeof item === 'boolean') return
    if (typeof item === 'number') {
      if (!Number.isFinite(item)) throw new Error(`${path} is non-finite.`)
      return
    }
    if (typeof item !== 'object') {
      throw new Error(`${path} is not serialized plain data.`)
    }
    visitedNodes += 1
    if (visitedNodes > 75_000) {
      throw new Error(`${label} exceeds structural bounds.`)
    }
    if (active.has(item)) throw new Error(`${path} contains a cycle.`)
    let prototype: object | null
    let keys: readonly PropertyKey[]
    try {
      prototype = Object.getPrototypeOf(item)
      keys = Reflect.ownKeys(item)
    } catch {
      throw new Error(`${path} cannot be inspected.`)
    }
    if (
      !Array.isArray(item)
      && prototype !== Object.prototype
      && prototype !== null
    ) throw new Error(`${path} has a non-plain prototype.`)
    if (keys.length > 2_048) throw new Error(`${path} has too many keys.`)
    if (keys.some((key) => typeof key !== 'string')) {
      throw new Error(`${path} has a symbol key.`)
    }
    active.add(item)
    try {
      for (const key of keys as readonly string[]) {
        if (Array.isArray(item) && key === 'length') continue
        let descriptor: PropertyDescriptor | undefined
        try {
          descriptor = Object.getOwnPropertyDescriptor(item, key)
        } catch {
          throw new Error(`${path}.${key} cannot be inspected.`)
        }
        if (
          !descriptor
          || !Object.hasOwn(descriptor, 'value')
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.enumerable !== true
        ) throw new Error(`${path}.${key} has an accessor or hidden value.`)
        visit(descriptor.value, `${path}.${key}`, depth + 1)
      }
    } finally {
      active.delete(item)
    }
  }
  visit(value, label, 0)
}

export type {
  CanonicalProfessionalToolGpuDispatchAdmission,
}
