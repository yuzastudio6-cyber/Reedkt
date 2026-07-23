import { z } from 'zod'

import type {
  MotionStudioCurrencyExchangeRateSnapshot,
  MotionStudioDeterministicRouteCandidateV1,
  MotionStudioDeterministicRouteReviewV1,
  MotionStudioWanUsdCostDerivation,
  MotionStudioMs010BExecutionAuthorityV1,
  MotionStudioMs010BFallbackEligibilityV1,
  MotionStudioMs010BOwnerAuthorizationV1,
  MotionStudioMs010BRetentionPolicyV1,
  MotionStudioMs010BStopPolicyV1,
  MotionStudioProviderNativeRateSnapshot,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION,
  MOTION_STUDIO_FX_SNAPSHOT_VERSION,
  MOTION_STUDIO_DETERMINISTIC_ROUTE_ACCEPTANCE_VERSION,
  MOTION_STUDIO_DETERMINISTIC_ROUTE_REVIEW_VERSION,
  MOTION_STUDIO_MS_010B_EXECUTION_AUTHORITY_VERSION,
  MOTION_STUDIO_MS_010B_FALLBACK_ELIGIBILITY_VERSION,
  MOTION_STUDIO_MS_010B_OWNER_AUTHORIZATION_VERSION,
  MOTION_STUDIO_MS_010B_RETENTION_POLICY_VERSION,
  MOTION_STUDIO_MS_010B_STOP_POLICY_VERSION,
  MOTION_STUDIO_PROVIDER_NATIVE_RATE_SNAPSHOT_VERSION,
} from '../../../types/motion-studio'
import { validateMotionStudioDeepValue } from './safe-values'
import {
  currencyExchangeRateEvidenceRefSchema,
  motionStudioVersionReferenceSchema,
  providerRateCardEvidenceRefSchema,
} from './schemas'

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const nonNegativeSafeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)

const allocationSchema = z.object({
  operationKind: z.enum([
    'gpt_image_generation',
    'gpt_image_edit',
    'wan_image_to_video',
    'hailuo_image_to_video_fallback',
  ]),
  providerRoute: z.enum(['gpt_image_2', 'wan', 'hailuo']),
  maximumCallCount: z.literal(1),
  maximumAuthorizedUsdMicros: positiveSafeInteger,
  retryAllowanceCount: z.literal(0),
  unusedAuthorityReassignable: z.literal(false),
  dependencyOperationKind: z.enum([
    'gpt_image_generation',
    'gpt_image_edit',
    'wan_image_to_video',
  ]).optional(),
  conditionalOnPersistedWanQaRejection: z.boolean(),
}).strict()

const expectedAllocations = Object.freeze({
  gpt_image_generation: {
    providerRoute: 'gpt_image_2',
    maximumAuthorizedUsdMicros: 250_000,
    dependencyOperationKind: undefined,
    conditionalOnPersistedWanQaRejection: false,
  },
  gpt_image_edit: {
    providerRoute: 'gpt_image_2',
    maximumAuthorizedUsdMicros: 250_000,
    dependencyOperationKind: 'gpt_image_generation',
    conditionalOnPersistedWanQaRejection: false,
  },
  wan_image_to_video: {
    providerRoute: 'wan',
    maximumAuthorizedUsdMicros: 2_000_000,
    dependencyOperationKind: 'gpt_image_edit',
    conditionalOnPersistedWanQaRejection: false,
  },
  hailuo_image_to_video_fallback: {
    providerRoute: 'hailuo',
    maximumAuthorizedUsdMicros: 500_000,
    dependencyOperationKind: 'wan_image_to_video',
    conditionalOnPersistedWanQaRejection: true,
  },
} as const)

export const motionStudioMs010BOwnerAuthorizationV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS_010B_OWNER_AUTHORIZATION_VERSION),
  authorizationId: stableId,
  productionId: stableId,
  approvedSnapshotId: stableId,
  authorizationDigest: digest,
  authorizedAt: isoDate,
  allocations: z.array(allocationSchema).length(4).readonly(),
  combinedMaximumAuthorizedUsdMicros: z.literal(3_000_000),
  automaticRetriesAllowed: z.literal(false),
  automaticProviderSubmissionAllowed: z.literal(false),
  automaticPurchasesAllowed: z.literal(false),
  customerBillingAuthorized: z.literal(false),
  cnyToUsdPlanningAuthorized: z.literal(true),
  transportUnlocked: z.literal(false),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>()
  let sum = 0
  value.allocations.forEach((allocation, index) => {
    if (seen.has(allocation.operationKind)) {
      context.addIssue({ code: 'custom', path: ['allocations', index], message: 'Each authorized operation must appear exactly once.' })
    }
    seen.add(allocation.operationKind)
    sum += allocation.maximumAuthorizedUsdMicros
    const expected = expectedAllocations[allocation.operationKind]
    for (const field of ['providerRoute', 'maximumAuthorizedUsdMicros', 'dependencyOperationKind', 'conditionalOnPersistedWanQaRejection'] as const) {
      if (allocation[field] !== expected[field]) {
        context.addIssue({ code: 'custom', path: ['allocations', index, field], message: `MS-010B authorization requires the frozen ${field}.` })
      }
    }
  })
  for (const kind of Object.keys(expectedAllocations)) {
    if (!seen.has(kind)) context.addIssue({ code: 'custom', path: ['allocations'], message: `Missing frozen operation ${kind}.` })
  }
  if (sum !== value.combinedMaximumAuthorizedUsdMicros) {
    context.addIssue({ code: 'custom', path: ['allocations'], message: 'Operation ceilings must sum exactly to the combined provider ceiling.' })
  }
}) satisfies z.ZodType<MotionStudioMs010BOwnerAuthorizationV1>

export const motionStudioMs010BRetentionPolicyV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS_010B_RETENTION_POLICY_VERSION),
  id: stableId,
  contentDigest: digest,
  syntheticNonPersonalEvidenceOnly: z.literal(true),
  approvedEvidenceRetainedWithPrivateProject: z.literal(true),
  rejectedRawCandidateRetentionDays: z.literal(30),
  temporaryFilesRemovedAfterVerifiedIngestAndQa: z.literal(true),
  providerUrlsAuthoritative: z.literal(false),
  providerUrlsBrowserVisible: z.literal(false),
  credentialsPersisted: z.literal(false),
  providerAccountRetentionRecordedBeforeSubmission: z.literal(true),
  ownerConfirmedAt: isoDate,
  immutable: z.literal(true),
}).strict() satisfies z.ZodType<MotionStudioMs010BRetentionPolicyV1>

export const motionStudioMs010BStopPolicyV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS_010B_STOP_POLICY_VERSION),
  id: stableId,
  contentDigest: digest,
  stopOnCostCeilingRisk: z.literal(true),
  stopOnStaleOrAmbiguousPricingOrFx: z.literal(true),
  stopOnPurchaseOrRechargeRequired: z.literal(true),
  stopOnCredentialOrModelAccessFailure: z.literal(true),
  stopOnAuthorityOrDependencyMismatch: z.literal(true),
  stopOnPrivateOrUnlicensedInput: z.literal(true),
  stopOnUnknownProviderOutcome: z.literal(true),
  stopOnUnrecognizedProviderSchema: z.literal(true),
  stopOnUnsafeRedirectOrOversizedBody: z.literal(true),
  stopWhenResultCannotBeIngestedBeforeExpiry: z.literal(true),
  providerFailureDoesNotUnlockFallback: z.literal(true),
  timeoutDoesNotUnlockFallback: z.literal(true),
  unknownOutcomeDoesNotUnlockFallback: z.literal(true),
  onlyPersistedTechnicalCompleteWanQaRejectionUnlocksFallback: z.literal(true),
  reconcileOriginalOperationWithoutRetry: z.literal(true),
  ownerConfirmedAt: isoDate,
  immutable: z.literal(true),
}).strict() satisfies z.ZodType<MotionStudioMs010BStopPolicyV1>

const commonCredentialBindingShape = {
  credentialReferenceId: stableId,
  channel: z.enum(['one_shot_server_environment', 'approved_secret_manager']),
  accountFundedWithoutPurchase: z.literal(true),
  modelAccessVerified: z.literal(true),
  browserExposureAllowed: z.literal(false),
  persistedInProject: z.literal(false),
  loggingAllowed: z.literal(false),
  verifiedAt: isoDate,
}

const credentialBindingSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('openai'), ...commonCredentialBindingShape }).strict(),
  z.object({
    provider: z.literal('alibaba_cloud'),
    ...commonCredentialBindingShape,
    workspaceBindingId: stableId,
    region: z.enum(['singapore', 'beijing']),
  }).strict(),
  z.object({ provider: z.literal('minimax'), ...commonCredentialBindingShape }).strict(),
])

export const motionStudioMs010BExecutionAuthorityV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS_010B_EXECUTION_AUTHORITY_VERSION),
  id: stableId,
  productionId: stableId,
  approvedSnapshotId: stableId,
  ownerAuthorization: motionStudioVersionReferenceSchema,
  retentionPolicy: motionStudioVersionReferenceSchema,
  stopPolicy: motionStudioVersionReferenceSchema,
  credentialBindings: z.array(credentialBindingSchema).length(3).readonly(),
  wanProviderNativeRateSnapshotId: stableId,
  wanCurrencyExchangeRateSnapshotId: stableId.nullable(),
  combinedMaximumAuthorizedUsdMicros: z.literal(3_000_000),
  unresolvedGateCount: z.literal(0),
  submissionUnlocked: z.literal(true),
  authorityDigest: digest,
  createdAt: isoDate,
  expiresAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const providers = value.credentialBindings.map((binding) => binding.provider)
  for (const provider of ['openai', 'alibaba_cloud', 'minimax'] as const) {
    if (providers.filter((candidate) => candidate === provider).length !== 1) {
      context.addIssue({ code: 'custom', path: ['credentialBindings'], message: `Execution authority requires exactly one ${provider} credential binding.` })
    }
  }
  if (Date.parse(value.expiresAt) <= Date.parse(value.createdAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Execution authority must expire after it is created.' })
  }
}) satisfies z.ZodType<MotionStudioMs010BExecutionAuthorityV1>

export const motionStudioMs010BFallbackEligibilityV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS_010B_FALLBACK_ELIGIBILITY_VERSION),
  id: stableId,
  productionId: stableId,
  approvedSnapshotId: stableId,
  ownerAuthorization: motionStudioVersionReferenceSchema,
  primaryProviderRoute: z.literal('wan'),
  primaryProviderOperationId: stableId,
  primaryCandidateId: stableId,
  primaryAssetVersion: motionStudioVersionReferenceSchema,
  technicallyComplete: z.literal(true),
  qaDecision: z.literal('rejected'),
  qaEvidence: motionStudioVersionReferenceSchema,
  rejectionCategory: z.enum(['reference_adherence', 'continuity', 'visual_artifact', 'intent_alignment']),
  fallbackProviderRoute: z.literal('hailuo'),
  automaticSubmissionAllowed: z.literal(false),
  manualInvocationRequired: z.literal(true),
  manualInvocationId: stableId,
  eligibilityDigest: digest,
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict() satisfies z.ZodType<MotionStudioMs010BFallbackEligibilityV1>

export const motionStudioDeterministicRouteCandidateV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_DETERMINISTIC_ROUTE_ACCEPTANCE_VERSION),
  productionId: stableId,
  approvedSnapshotId: stableId,
  moduleId: z.literal('storytelling'),
  moduleCatalogVersion: z.literal('motion-studio-module-catalog-v1'),
  stageProfileId: z.literal('motion-studio-storytelling-stage-profile-v1'),
  candidateId: stableId,
  sourceKeyframe: z.object({
    mediaAssetVersionId: stableId,
    sha256: digest,
  }).strict(),
  output: z.object({
    mediaAssetId: stableId,
    mediaAssetVersionId: stableId,
    mimeType: z.literal('video/mp4'),
    sha256: digest,
    byteLength: positiveSafeInteger.refine((value) => value <= 100 * 1024 * 1024),
    privateObjectIdentityHash: digest,
    width: z.literal(1280),
    height: z.literal(720),
    durationFrames: z.literal(180),
    fpsNumerator: z.literal(30),
    fpsDenominator: z.literal(1),
  }).strict(),
  route: z.object({
    profileId: z.literal('motion_studio_deterministic_route_draw_v1'),
    routePresetId: z.literal('abstract_three_district_route_v1'),
    revealStartFrame: z.literal(18),
    revealEndFrame: z.literal(140),
    waypointFrames: z.tuple([z.literal(18), z.literal(82), z.literal(140)]).readonly(),
  }).strict(),
  runtime: z.object({ attestationDigest: digest }).strict(),
  qa: z.object({ evidenceDigest: digest }).strict(),
  cost: z.object({
    providerSubmissionCount: z.literal(0),
    providerCostIncurredMicros: z.literal(0),
    customerPriceCalculated: z.literal(false),
    customerCreditsMutated: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (value.route.revealStartFrame >= value.route.revealEndFrame) {
    context.addIssue({ code: 'custom', path: ['route'], message: 'Route reveal must progress forward.' })
  }
  if (value.route.waypointFrames[0] !== value.route.revealStartFrame || value.route.waypointFrames[2] !== value.route.revealEndFrame) {
    context.addIssue({ code: 'custom', path: ['route', 'waypointFrames'], message: 'Waypoint authority must bind both route endpoints.' })
  }
}) satisfies z.ZodType<MotionStudioDeterministicRouteCandidateV1>

export const motionStudioDeterministicRouteReviewV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_DETERMINISTIC_ROUTE_REVIEW_VERSION),
  reviewId: stableId,
  snapshotAmendmentId: stableId,
  decision: z.literal('approved'),
  assessments: z.object({
    intentAlignment: z.literal('passed'),
    referenceAdherence: z.literal('passed'),
    continuity: z.literal('passed'),
    visibleArtifacts: z.literal('passed'),
    safety: z.literal('passed'),
  }).strict(),
  ownerApprovalStatementDigest: digest,
  qualityReport: z.object({ artifactId: stableId, versionId: stableId }).strict(),
  notes: z.array(z.string().trim().min(1).max(500)).min(1).max(8).readonly(),
}).strict().superRefine((value, context) => {
  try {
    validateMotionStudioDeepValue(value)
  } catch {
    context.addIssue({ code: 'custom', message: 'Deterministic route review contains unsafe nested values.' })
  }
}) satisfies z.ZodType<MotionStudioDeterministicRouteReviewV1>

export const motionStudioProviderNativeRateSnapshotSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_NATIVE_RATE_SNAPSHOT_VERSION),
  id: stableId,
  providerRoute: z.enum(['wan', 'hailuo']),
  providerAdapterId: stableId,
  modelOrService: stableId,
  version: stableId,
  contentDigest: digest,
  currency: z.enum(['CNY', 'USD']),
  unit: z.enum(['video_second', 'request']),
  unitPriceNativeMicros: positiveSafeInteger,
  minimumChargeNativeMicros: nonNegativeSafeInteger,
  roundingRule: z.enum(['exact_integer_quantity', 'provider_reported']),
  effectiveFrom: isoDate,
  effectiveTo: isoDate.optional(),
  sourceReference: providerRateCardEvidenceRefSchema,
  verifiedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.providerRoute === 'wan' && value.unit !== 'video_second') {
    context.addIssue({ code: 'custom', path: ['unit'], message: 'The registered Wan rate must be per video second.' })
  }
  if (value.providerRoute === 'hailuo' && (value.currency !== 'USD' || value.unit !== 'request')) {
    context.addIssue({ code: 'custom', path: ['currency'], message: 'The registered Hailuo rate must be USD per request.' })
  }
  if (value.effectiveTo && Date.parse(value.effectiveTo) <= Date.parse(value.effectiveFrom)) {
    context.addIssue({ code: 'custom', path: ['effectiveTo'], message: 'Rate expiration must follow its effective time.' })
  }
}) satisfies z.ZodType<MotionStudioProviderNativeRateSnapshot>

export const motionStudioCurrencyExchangeRateSnapshotSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_FX_SNAPSHOT_VERSION),
  id: stableId,
  version: stableId,
  contentDigest: digest,
  baseCurrency: z.literal('CNY'),
  quoteCurrency: z.literal('USD'),
  baseAmountMicros: positiveSafeInteger,
  quoteAmountMicros: positiveSafeInteger,
  roundingRule: z.literal('ceil_quote_micros'),
  sourceReference: currencyExchangeRateEvidenceRefSchema,
  capturedAt: isoDate,
  effectiveAt: isoDate,
  expiresAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.capturedAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'FX snapshot must expire after capture.' })
  }
  if (Date.parse(value.effectiveAt) > Date.parse(value.capturedAt)) {
    context.addIssue({ code: 'custom', path: ['effectiveAt'], message: 'FX observation cannot become effective after capture.' })
  }
}) satisfies z.ZodType<MotionStudioCurrencyExchangeRateSnapshot>

export const motionStudioWanUsdCostDerivationSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION),
  id: stableId,
  providerNativeRateSnapshotId: stableId,
  currencyExchangeRateSnapshotId: stableId.nullable(),
  derivedUsdRateCardVersionId: stableId,
  quantity: positiveSafeInteger,
  unit: z.enum(['video_second', 'request']),
  nativeCurrency: z.enum(['CNY', 'USD']),
  nativeCostMicros: positiveSafeInteger,
  usdInternalCostMicros: positiveSafeInteger,
  conversionMode: z.enum(['native_usd', 'cny_to_usd']),
  roundingRule: z.enum(['exact_native_usd', 'ceil_quote_micros']),
  calculationDigest: digest,
  calculatedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const nativeUsd = value.nativeCurrency === 'USD'
  if (
    nativeUsd && (
      value.currencyExchangeRateSnapshotId !== null ||
      value.conversionMode !== 'native_usd' ||
      value.roundingRule !== 'exact_native_usd' ||
      value.nativeCostMicros !== value.usdInternalCostMicros
    )
  ) {
    context.addIssue({
      code: 'custom',
      path: ['conversionMode'],
      message: 'Native USD Wan cost cannot apply a currency exchange rate.',
    })
  }
  if (
    !nativeUsd && (
      value.currencyExchangeRateSnapshotId === null ||
      value.conversionMode !== 'cny_to_usd' ||
      value.roundingRule !== 'ceil_quote_micros'
    )
  ) {
    context.addIssue({
      code: 'custom',
      path: ['conversionMode'],
      message: 'CNY Wan cost requires one exact CNY-to-USD snapshot and upward rounding.',
    })
  }
}) satisfies z.ZodType<MotionStudioWanUsdCostDerivation>

/** @deprecated Use motionStudioWanUsdCostDerivationSchema. */
export const motionStudioFxDerivedUsdCostSchema = motionStudioWanUsdCostDerivationSchema

function validate<T>(schema: z.ZodType<T>, value: unknown): { ok: boolean; errors: readonly string[] } {
  const parsed = schema.safeParse(value)
  const errors = parsed.success
    ? []
    : parsed.error.issues.map((issue) => `${issue.path.join('.') || '$'}: ${issue.message}`)
  errors.push(...validateMotionStudioDeepValue(value).errors)
  return { ok: errors.length === 0, errors }
}

export const validateMotionStudioMs010BOwnerAuthorization = (value: unknown) =>
  validate(motionStudioMs010BOwnerAuthorizationV1Schema, value)
export const validateMotionStudioMs010BRetentionPolicy = (value: unknown) =>
  validate(motionStudioMs010BRetentionPolicyV1Schema, value)
export const validateMotionStudioMs010BStopPolicy = (value: unknown) =>
  validate(motionStudioMs010BStopPolicyV1Schema, value)
export const validateMotionStudioMs010BExecutionAuthority = (value: unknown) =>
  validate(motionStudioMs010BExecutionAuthorityV1Schema, value)
export const validateMotionStudioMs010BFallbackEligibility = (value: unknown) =>
  validate(motionStudioMs010BFallbackEligibilityV1Schema, value)
export const validateMotionStudioProviderNativeRateSnapshot = (value: unknown) =>
  validate(motionStudioProviderNativeRateSnapshotSchema, value)
export const validateMotionStudioCurrencyExchangeRateSnapshot = (value: unknown) =>
  validate(motionStudioCurrencyExchangeRateSnapshotSchema, value)
export const validateMotionStudioWanUsdCostDerivation = (value: unknown) =>
  validate(motionStudioWanUsdCostDerivationSchema, value)
/** @deprecated Use validateMotionStudioWanUsdCostDerivation. */
export const validateMotionStudioFxDerivedUsdCost = validateMotionStudioWanUsdCostDerivation
