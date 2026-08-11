import { z } from 'zod'

import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_QUALITY_FIRST_A100_FAST_SCALE_ZERO_MIGRATION_VERSION =
  'canonical-quality-first-a100-fast-scale-zero-migration-v1' as const

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()

const vertexEndpointCandidateSchema = z.object({
  candidateId: z.literal(
    'vertex_ai_dedicated_prediction_endpoint_min_zero_a100_80gb',
  ),
  officialCapabilityObservationId: z.literal(
    'google_cloud_vertex_prediction_scale_to_zero_min_replica_zero_2026_06',
  ),
  executionTarget: z.literal(
    'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra_min_zero',
  ),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  gpuCount: z.literal(1),
  gpuMemoryGiB: z.literal(80),
  minimumReplicaCount: z.literal(0),
  initialReplicaCount: z.literal(1),
  maximumReplicaCount: z.literal(1),
  minimumScaleUpPeriodSeconds: z.literal(300),
  idleScaleDownPeriodSeconds: z.literal(300),
  dedicatedEndpointRequired: z.literal(true),
  oneModelPerEndpointRequired: z.literal(true),
  multiHostGpuAllowed: z.literal(false),
  scaledDownFirstRequestDisposition: z.literal(
    'provider_429_model_not_ready_request_dropped_before_inference',
  ),
  safeRetryRequiresServerOwnedReadyObservation: z.literal(true),
  readinessRetryMayReuseCustomerSpendAuthority: z.literal(false),
  longRunningPrivateResultProtocolRequired: z.literal(true),
  fiveMinuteMinimumWarmBillingWindowMustBeMetered: z.literal(true),
  officialCapabilityObservationIsRuntimeQualification: z.literal(false),
  productionQualified: z.literal(false),
}).strict()

const gkeAutopilotCandidateSchema = z.object({
  candidateId: z.literal(
    'gke_autopilot_fast_starting_a2_a100_80gb_job',
  ),
  officialCapabilityObservationId: z.literal(
    'google_cloud_gke_autopilot_fast_starting_a2_scale_from_zero_2026_05',
  ),
  executionTarget: z.literal(
    'google_cloud_gke_autopilot_fast_starting_a2_ultra_job',
  ),
  machineType: z.literal('a2-ultragpu-1g'),
  accelerator: z.literal('nvidia_a100_80gb'),
  gpuCount: z.literal(1),
  gpuMemoryGiB: z.literal(80),
  minimumNodeCount: z.literal(0),
  jobCompletions: z.literal(1),
  jobParallelism: z.literal(1),
  jobBackoffLimit: z.literal(0),
  restartPolicy: z.literal('Never'),
  autopilotManagedGpuDriverRequired: z.literal(true),
  fastStartingA2NodeEligibilityRequired: z.literal(true),
  privateClusterAndWorkloadIdentityRequired: z.literal(true),
  publicNodeAddressAllowed: z.literal(false),
  serverOwnedJobManifestRequired: z.literal(true),
  callerNamespaceImageCommandOrNodeSelectorAccepted: z.literal(false),
  exactTerminalPodNodeAndGpuTeardownRereadRequired: z.literal(true),
  officialCapabilityObservationIsRuntimeQualification: z.literal(false),
  productionQualified: z.literal(false),
}).strict()

const migrationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_QUALITY_FIRST_A100_FAST_SCALE_ZERO_MIGRATION_VERSION,
  ),
  source: z.literal(
    'canonical_backend_quality_first_a100_fast_scale_zero_migration',
  ),
  status: z.literal('replacement_route_qualification_required'),
  historicalVertexCustomJobObservation: z.object({
    executionTarget: z.literal('google_cloud_vertex_custom_job_a2_ultra'),
    routeRole: z.literal('historical_hardware_quality_reference_only'),
    immutableImageDigest: z.literal(
      'sha256:6f019248887db07aeacf880a2630ffa2096b33aa42796b0dff9466c661848d62',
    ),
    providerExecutionName: z.literal(
      'projects/390722338345/locations/us-central1/customJobs/5225848758159278080',
    ),
    taskRef: refSchema,
    resultAdmissionRef: refSchema,
    attemptCostReceiptRef: refSchema,
    providerCreateTime: z.literal('2026-08-11T13:56:27.633719Z'),
    workerStartTime: z.literal('2026-08-11T14:49:47.000Z'),
    terminalTime: z.literal('2026-08-11T14:51:18.000Z'),
    coldProvisioningMilliseconds: z.literal(3_199_367),
    workerWallTimeMilliseconds: z.literal(96_198),
    modelLoadMilliseconds: z.literal(19_695),
    modelInferenceMilliseconds: z.literal(36_727),
    targetEndToEndMilliseconds: z.literal(480_000),
    coldProvisioningAloneExceedsTarget: z.literal(true),
    customerProductionRouteQualified: z.literal(false),
    historicalEvidenceRemainsReadable: z.literal(true),
    newCustomerAttemptAdmissionAllowed: z.literal(false),
  }).strict(),
  candidateRoutes: z.tuple([
    vertexEndpointCandidateSchema,
    gkeAutopilotCandidateSchema,
  ]),
  selectionGate: z.object({
    selectedCandidateId: z.null(),
    bothCandidatesMustBeIndependentlyBenchmarked: z.literal(true),
    exactSameImmutableImageRequired: z.literal(true),
    exactSameEightMinuteSourceRequired: z.literal(true),
    exactSameChunkPlanAndOutputGeometryRequired: z.literal(true),
    exactSameSam31CheckpointAndRuntimeSettingsRequired: z.literal(true),
    minimumRepresentativeRunsPerCandidate: z.literal(30),
    nearestRankP95AtOrBelowMilliseconds: z.literal(480_000),
    completeSourceIntervalAndResolutionRequired: z.literal(true),
    a100ReferenceMaskQualityMustMatchOrImprove: z.literal(true),
    noDownscaleQuantizationOrQaReductionAllowed: z.literal(true),
    accountEffectivePriceAndEveryAttemptCostRereadRequired: z.literal(true),
    coldStartModelLoadActiveWorkPersistenceAndIdleMustBeMetered:
      z.literal(true),
    allQualificationCostAbsorbedByWeEditPro: z.literal(true),
    customerCreditsMutatedDuringQualification: z.literal(false),
    qualifiedCandidatesRankedByQualityThenP95ThenCost: z.literal(true),
    noCandidateMeansNoA100CustomerDispatch: z.literal(true),
  }).strict(),
  fallbackBoundary: z.object({
    l4HeavyFallbackAutomaticallyPromoted: z.literal(false),
    l4RequiresIndependentSameQualityRelease: z.literal(true),
    classifiedPreInferencePrimaryFailureRequired: z.literal(true),
    unknownPrimaryOutcomeMayTriggerFallback: z.literal(false),
    cpuSubstantiveFallbackAllowed: z.literal(false),
  }).strict(),
  authority: z.object({
    sourceDecisionOnly: z.literal(true),
    cloudResourceCreated: z.literal(false),
    candidateRuntimeExecuted: z.literal(false),
    productionRouteSelected: z.literal(false),
    runtimeReleaseGranted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  recordedAt: timestamp,
}).strict()

export const canonicalQualityFirstA100FastScaleZeroMigrationSchema =
  migrationWithoutHashSchema.extend({ migrationHash: sha256 }).strict()

export type CanonicalQualityFirstA100FastScaleZeroMigration = z.infer<
  typeof canonicalQualityFirstA100FastScaleZeroMigrationSchema
>

export function assertCanonicalFreshA100CustomerDispatchAllowed(
  untrustedMigration: unknown =
    createCanonicalQualityFirstA100FastScaleZeroMigration(),
): CanonicalQualityFirstA100FastScaleZeroMigration {
  const migration = assertCanonicalQualityFirstA100FastScaleZeroMigration(
    untrustedMigration,
  )
  if (
    !migration.historicalVertexCustomJobObservation
      .newCustomerAttemptAdmissionAllowed
    || migration.selectionGate.selectedCandidateId === null
    || !migration.authority.productionRouteSelected
    || !migration.authority.runtimeReleaseGranted
    || !migration.authority.productionReady
  ) {
    throw new Error(
      'Fresh A100 customer dispatch is blocked pending a qualified fast scale-zero route.',
    )
  }
  return migration
}

export function createCanonicalQualityFirstA100FastScaleZeroMigration():
CanonicalQualityFirstA100FastScaleZeroMigration {
  const payload = migrationWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_QUALITY_FIRST_A100_FAST_SCALE_ZERO_MIGRATION_VERSION,
    source: 'canonical_backend_quality_first_a100_fast_scale_zero_migration',
    status: 'replacement_route_qualification_required',
    historicalVertexCustomJobObservation: {
      executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
      routeRole: 'historical_hardware_quality_reference_only',
      immutableImageDigest:
        'sha256:6f019248887db07aeacf880a2630ffa2096b33aa42796b0dff9466c661848d62',
      providerExecutionName:
        'projects/390722338345/locations/us-central1/customJobs/5225848758159278080',
      taskRef: {
        id: 'sam31-a100-qualification:sam31-production-a100-image-6f019248-20260811.run-01.execution',
        version: 1,
        contentHash:
          'sha256:54a8932010963abaf5b14f5df97abf69a9c76d9a21f31bf4806de380cbe1c03c',
      },
      resultAdmissionRef: {
        id: 'sam31-a100-result:sam31-a100-qualification:sam31-production-a100-image-6f019248-20260811.run-01.execution',
        version: 1,
        contentHash:
          'sha256:27e1ea8f715c19125dbc5c8e079b10b1ae163b9535b67fa02cd5fb65823d699e',
      },
      attemptCostReceiptRef: {
        id: 'vertex-a100-cost.c31ac1f5535bb11f915985b1313a7acc5fc06226293816d4',
        version: 1,
        contentHash:
          'sha256:bf199884cf43d6b1eb5eb707690c0557ce7575c50a8e8a9a2c15d0ff97afd094',
      },
      providerCreateTime: '2026-08-11T13:56:27.633719Z',
      workerStartTime: '2026-08-11T14:49:47.000Z',
      terminalTime: '2026-08-11T14:51:18.000Z',
      coldProvisioningMilliseconds: 3_199_367,
      workerWallTimeMilliseconds: 96_198,
      modelLoadMilliseconds: 19_695,
      modelInferenceMilliseconds: 36_727,
      targetEndToEndMilliseconds: 480_000,
      coldProvisioningAloneExceedsTarget: true,
      customerProductionRouteQualified: false,
      historicalEvidenceRemainsReadable: true,
      newCustomerAttemptAdmissionAllowed: false,
    },
    candidateRoutes: [
      {
        candidateId:
          'vertex_ai_dedicated_prediction_endpoint_min_zero_a100_80gb',
        officialCapabilityObservationId:
          'google_cloud_vertex_prediction_scale_to_zero_min_replica_zero_2026_06',
        executionTarget:
          'google_cloud_vertex_dedicated_prediction_endpoint_a2_ultra_min_zero',
        machineType: 'a2-ultragpu-1g',
        accelerator: 'nvidia_a100_80gb',
        gpuCount: 1,
        gpuMemoryGiB: 80,
        minimumReplicaCount: 0,
        initialReplicaCount: 1,
        maximumReplicaCount: 1,
        minimumScaleUpPeriodSeconds: 300,
        idleScaleDownPeriodSeconds: 300,
        dedicatedEndpointRequired: true,
        oneModelPerEndpointRequired: true,
        multiHostGpuAllowed: false,
        scaledDownFirstRequestDisposition:
          'provider_429_model_not_ready_request_dropped_before_inference',
        safeRetryRequiresServerOwnedReadyObservation: true,
        readinessRetryMayReuseCustomerSpendAuthority: false,
        longRunningPrivateResultProtocolRequired: true,
        fiveMinuteMinimumWarmBillingWindowMustBeMetered: true,
        officialCapabilityObservationIsRuntimeQualification: false,
        productionQualified: false,
      },
      {
        candidateId: 'gke_autopilot_fast_starting_a2_a100_80gb_job',
        officialCapabilityObservationId:
          'google_cloud_gke_autopilot_fast_starting_a2_scale_from_zero_2026_05',
        executionTarget:
          'google_cloud_gke_autopilot_fast_starting_a2_ultra_job',
        machineType: 'a2-ultragpu-1g',
        accelerator: 'nvidia_a100_80gb',
        gpuCount: 1,
        gpuMemoryGiB: 80,
        minimumNodeCount: 0,
        jobCompletions: 1,
        jobParallelism: 1,
        jobBackoffLimit: 0,
        restartPolicy: 'Never',
        autopilotManagedGpuDriverRequired: true,
        fastStartingA2NodeEligibilityRequired: true,
        privateClusterAndWorkloadIdentityRequired: true,
        publicNodeAddressAllowed: false,
        serverOwnedJobManifestRequired: true,
        callerNamespaceImageCommandOrNodeSelectorAccepted: false,
        exactTerminalPodNodeAndGpuTeardownRereadRequired: true,
        officialCapabilityObservationIsRuntimeQualification: false,
        productionQualified: false,
      },
    ],
    selectionGate: {
      selectedCandidateId: null,
      bothCandidatesMustBeIndependentlyBenchmarked: true,
      exactSameImmutableImageRequired: true,
      exactSameEightMinuteSourceRequired: true,
      exactSameChunkPlanAndOutputGeometryRequired: true,
      exactSameSam31CheckpointAndRuntimeSettingsRequired: true,
      minimumRepresentativeRunsPerCandidate: 30,
      nearestRankP95AtOrBelowMilliseconds: 480_000,
      completeSourceIntervalAndResolutionRequired: true,
      a100ReferenceMaskQualityMustMatchOrImprove: true,
      noDownscaleQuantizationOrQaReductionAllowed: true,
      accountEffectivePriceAndEveryAttemptCostRereadRequired: true,
      coldStartModelLoadActiveWorkPersistenceAndIdleMustBeMetered: true,
      allQualificationCostAbsorbedByWeEditPro: true,
      customerCreditsMutatedDuringQualification: false,
      qualifiedCandidatesRankedByQualityThenP95ThenCost: true,
      noCandidateMeansNoA100CustomerDispatch: true,
    },
    fallbackBoundary: {
      l4HeavyFallbackAutomaticallyPromoted: false,
      l4RequiresIndependentSameQualityRelease: true,
      classifiedPreInferencePrimaryFailureRequired: true,
      unknownPrimaryOutcomeMayTriggerFallback: false,
      cpuSubstantiveFallbackAllowed: false,
    },
    authority: {
      sourceDecisionOnly: true,
      cloudResourceCreated: false,
      candidateRuntimeExecuted: false,
      productionRouteSelected: false,
      runtimeReleaseGranted: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    recordedAt: '2026-08-11T15:15:00.000Z',
  })
  return canonicalQualityFirstA100FastScaleZeroMigrationSchema.parse({
    ...payload,
    migrationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalQualityFirstA100FastScaleZeroMigration(
  value: unknown,
): CanonicalQualityFirstA100FastScaleZeroMigration {
  const parsed = canonicalQualityFirstA100FastScaleZeroMigrationSchema.parse(
    value,
  )
  const { migrationHash, ...payload } = parsed
  if (
    migrationHash !== sha256AuthorityValue(payload)
    || stableAuthorityStringify(parsed) !== stableAuthorityStringify(
      createCanonicalQualityFirstA100FastScaleZeroMigration(),
    )
  ) throw new Error('A100 fast scale-zero migration record is stale.')
  return parsed
}
