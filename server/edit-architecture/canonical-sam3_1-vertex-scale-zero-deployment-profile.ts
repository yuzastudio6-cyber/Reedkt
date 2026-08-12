import { z } from 'zod'

import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_PROFILE_VERSION =
  'canonical-sam3_1-vertex-scale-zero-deployment-profile-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const immutableImageUri = z.string().regex(
  /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
)

const profileWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_PROFILE_VERSION,
  ),
  source: z.literal(
    'canonical_backend_sam3_1_vertex_scale_zero_deployment_owner',
  ),
  status: z.literal('ready_for_private_endpoint_deployment'),
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  routeId: z.literal('a100_80gb_heavy_primary'),
  imageSupplyChainReleaseRef: refSchema,
  runtimeReleaseRef: refSchema,
  immutableImageRef: refSchema,
  immutableImageUri,
  immutableImageDigest: prefixedSha256,
  sourceCheckpointQualificationRef: refSchema,
  servingQuotaPreferenceRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  endpoint: z.object({
    controlPlaneApiVersion: z.literal('v1beta1'),
    projectId: z.literal('reeditpro'),
    projectNumber: z.literal('390722338345'),
    region: z.literal('us-central1'),
    endpointId: z.literal('weeditpro-sam31-a100-scale-zero-v1'),
    displayName: z.literal('WeEditPro SAM 3.1 A100 scale-zero v1'),
    dedicatedEndpointEnabled: z.literal(true),
    sharedPublicEndpointAllowed: z.literal(false),
    oneModelPerEndpointRequired: z.literal(true),
    requestResponseLoggingEnabled: z.literal(false),
    customerPayloadLoggingAllowed: z.literal(false),
  }).strict(),
  container: z.object({
    serverVersion: z.literal(
      'canonical-sam3_1-vertex-prediction-server-v1',
    ),
    port: z.literal(8080),
    healthRoute: z.literal('/health'),
    predictRoute: z.literal('/predict'),
    runtimeMode: z.literal('vertex_prediction_endpoint_v1'),
    acceleratorClass: z.literal('nvidia_a100_80gb'),
    callerBucketObjectUrlPathCommandModelOrPriceAccepted: z.literal(false),
    checkpointDownloadedOnlyFromFixedPrivateOwner: z.literal(true),
    invocationBytesDownloadedOnlyAfterExactTaskLineage: z.literal(true),
    resultEvidenceCreateOnlyAndResponseCommitMarkerLast: z.literal(true),
  }).strict(),
  dedicatedResources: z.object({
    machineType: z.literal('a2-ultragpu-1g'),
    acceleratorType: z.literal('nvidia-a100-80gb'),
    acceleratorCount: z.literal(1),
    gpuMemoryGiB: z.literal(80),
    minimumReplicaCount: z.literal(0),
    initialReplicaCount: z.literal(1),
    maximumReplicaCount: z.literal(1),
    minimumScaleUpPeriodSeconds: z.literal(300),
    idleScaleDownPeriodSeconds: z.literal(300),
    scaleToZeroSpec: z.object({
      minScaleupPeriod: z.literal('300s'),
      idleScaledownPeriod: z.literal('300s'),
    }).strict(),
    spotAllowed: z.literal(false),
    multiHostAllowed: z.literal(false),
    reservationRequired: z.literal(false),
  }).strict(),
  serviceIdentity: z.object({
    email: z.literal(
      'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
    ),
    checkpointBucketObjectViewerOnly: z.literal(true),
    invocationBucketObjectViewerAndCreatorOnly: z.literal(true),
    billingQaDeliveryOrGeneralAdminAuthorityGranted: z.literal(false),
  }).strict(),
  readinessAndAttemptPolicy: z.object({
    scaledDownFirstRequestExpectedStatus: z.literal(429),
    scaledDownFirstRequestKnownDroppedBeforeInference: z.literal(true),
    firstRequestMayBeCustomerChargeableAttempt: z.literal(false),
    serverOwnedReadinessTriggerRequired: z.literal(true),
    readinessTriggerMustUseNonCustomerInvocationIdentity: z.literal(true),
    customerInvocationMayStartOnlyAfterContainerReadyObservation:
      z.literal(true),
    oneCustomerInvocationPerDurablyConsumedAttempt: z.literal(true),
    unknownOutcomeAutomaticRetryAllowed: z.literal(false),
    activeInferenceTimeoutSeconds: z.literal(420),
  }).strict(),
  pricingAndSettlement: z.object({
    minimumWarmBillingWindowSeconds: z.literal(300),
    accountEffectiveRateRereadRequiredBeforeApproval: z.literal(true),
    estimateMustCoverColdStartModelLoadActiveWorkPersistenceAndIdle:
      z.literal(true),
    actualProviderUsageRereadRequiredBeforeSettlement: z.literal(true),
    toolOwnerCostExcludesWeEditProServiceFee: z.literal(true),
    failedOrUnknownUnsettledAttemptMayChargeCustomerCredits:
      z.literal(false),
    unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  }).strict(),
  qualificationGate: z.object({
    exactEightMinuteQualityFixtureRequired: z.literal(true),
    minimumRepresentativeRuns: z.literal(30),
    nearestRankP95EndToEndMaximumMilliseconds: z.literal(480_000),
    exactA100MaskQualityMustMatchOrImprove: z.literal(true),
    completeSourceIntervalAndResolutionRequired: z.literal(true),
    quantizationDownscaleOrQaReductionAllowed: z.literal(false),
    l4FallbackIndependentlyQualified: z.literal(false),
    customerDispatchAllowed: z.literal(false),
  }).strict(),
  authority: z.object({
    sourceProfileOnly: z.literal(true),
    cloudResourceCreated: z.literal(false),
    modelUploaded: z.literal(false),
    modelDeployed: z.literal(false),
    gpuRuntimeExecuted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  recordedAt: timestamp,
}).strict().superRefine((profile, context) => {
  const digest = profile.immutableImageUri.match(
    /@sha256:([a-f0-9]{64})$/u,
  )?.[1]
  if (
    profile.immutableImageDigest !== `sha256:${digest ?? ''}`
    || profile.immutableImageRef.contentHash !== profile.immutableImageDigest
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 endpoint profile lost immutable image identity.',
  })
})

export const canonicalSam31VertexScaleZeroDeploymentProfileSchema =
  profileWithoutHashSchema.extend({ profileHash: sha256 }).strict()

export type CanonicalSam31VertexScaleZeroDeploymentProfile = z.infer<
  typeof canonicalSam31VertexScaleZeroDeploymentProfileSchema
>

export function createCanonicalSam31VertexScaleZeroDeploymentProfile(input: {
  readonly imageSupplyChainReleaseRef: z.infer<typeof refSchema>
  readonly runtimeReleaseRef: z.infer<typeof refSchema>
  readonly immutableImageRef: z.infer<typeof refSchema>
  readonly immutableImageUri: string
  readonly immutableImageDigest: string
  readonly sourceCheckpointQualificationRef: z.infer<typeof refSchema>
  readonly servingQuotaPreferenceRef: z.infer<typeof refSchema>
  readonly accountEffectiveRateAuthorityRef: z.infer<typeof refSchema>
  readonly recordedAt: string
}): CanonicalSam31VertexScaleZeroDeploymentProfile {
  const payload = profileWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_VERTEX_SCALE_ZERO_DEPLOYMENT_PROFILE_VERSION,
    source: 'canonical_backend_sam3_1_vertex_scale_zero_deployment_owner',
    status: 'ready_for_private_endpoint_deployment',
    operationId: 'tool.sam3_1.segment_and_track_subject.v1',
    routeId: 'a100_80gb_heavy_primary',
    ...input,
    endpoint: {
      controlPlaneApiVersion: 'v1beta1',
      projectId: 'reeditpro',
      projectNumber: '390722338345',
      region: 'us-central1',
      endpointId: 'weeditpro-sam31-a100-scale-zero-v1',
      displayName: 'WeEditPro SAM 3.1 A100 scale-zero v1',
      dedicatedEndpointEnabled: true,
      sharedPublicEndpointAllowed: false,
      oneModelPerEndpointRequired: true,
      requestResponseLoggingEnabled: false,
      customerPayloadLoggingAllowed: false,
    },
    container: {
      serverVersion: 'canonical-sam3_1-vertex-prediction-server-v1',
      port: 8080,
      healthRoute: '/health',
      predictRoute: '/predict',
      runtimeMode: 'vertex_prediction_endpoint_v1',
      acceleratorClass: 'nvidia_a100_80gb',
      callerBucketObjectUrlPathCommandModelOrPriceAccepted: false,
      checkpointDownloadedOnlyFromFixedPrivateOwner: true,
      invocationBytesDownloadedOnlyAfterExactTaskLineage: true,
      resultEvidenceCreateOnlyAndResponseCommitMarkerLast: true,
    },
    dedicatedResources: {
      machineType: 'a2-ultragpu-1g',
      acceleratorType: 'nvidia-a100-80gb',
      acceleratorCount: 1,
      gpuMemoryGiB: 80,
      minimumReplicaCount: 0,
      initialReplicaCount: 1,
      maximumReplicaCount: 1,
      minimumScaleUpPeriodSeconds: 300,
      idleScaleDownPeriodSeconds: 300,
      scaleToZeroSpec: {
        minScaleupPeriod: '300s',
        idleScaledownPeriod: '300s',
      },
      spotAllowed: false,
      multiHostAllowed: false,
      reservationRequired: false,
    },
    serviceIdentity: {
      email:
        'weeditpro-sam31-serving-sa@reeditpro.iam.gserviceaccount.com',
      checkpointBucketObjectViewerOnly: true,
      invocationBucketObjectViewerAndCreatorOnly: true,
      billingQaDeliveryOrGeneralAdminAuthorityGranted: false,
    },
    readinessAndAttemptPolicy: {
      scaledDownFirstRequestExpectedStatus: 429,
      scaledDownFirstRequestKnownDroppedBeforeInference: true,
      firstRequestMayBeCustomerChargeableAttempt: false,
      serverOwnedReadinessTriggerRequired: true,
      readinessTriggerMustUseNonCustomerInvocationIdentity: true,
      customerInvocationMayStartOnlyAfterContainerReadyObservation: true,
      oneCustomerInvocationPerDurablyConsumedAttempt: true,
      unknownOutcomeAutomaticRetryAllowed: false,
      activeInferenceTimeoutSeconds: 420,
    },
    pricingAndSettlement: {
      minimumWarmBillingWindowSeconds: 300,
      accountEffectiveRateRereadRequiredBeforeApproval: true,
      estimateMustCoverColdStartModelLoadActiveWorkPersistenceAndIdle: true,
      actualProviderUsageRereadRequiredBeforeSettlement: true,
      toolOwnerCostExcludesWeEditProServiceFee: true,
      failedOrUnknownUnsettledAttemptMayChargeCustomerCredits: false,
      unapprovedOverageAbsorbedByWeEditPro: true,
    },
    qualificationGate: {
      exactEightMinuteQualityFixtureRequired: true,
      minimumRepresentativeRuns: 30,
      nearestRankP95EndToEndMaximumMilliseconds: 480_000,
      exactA100MaskQualityMustMatchOrImprove: true,
      completeSourceIntervalAndResolutionRequired: true,
      quantizationDownscaleOrQaReductionAllowed: false,
      l4FallbackIndependentlyQualified: false,
      customerDispatchAllowed: false,
    },
    authority: {
      sourceProfileOnly: true,
      cloudResourceCreated: false,
      modelUploaded: false,
      modelDeployed: false,
      gpuRuntimeExecuted: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
  })
  return canonicalSam31VertexScaleZeroDeploymentProfileSchema.parse({
    ...payload,
    profileHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexScaleZeroDeploymentProfile(
  value: unknown,
): CanonicalSam31VertexScaleZeroDeploymentProfile {
  const profile = canonicalSam31VertexScaleZeroDeploymentProfileSchema.parse(
    value,
  )
  const { profileHash, ...payload } = profile
  if (profileHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 scale-zero deployment profile digest changed.')
  }
  return profile
}
