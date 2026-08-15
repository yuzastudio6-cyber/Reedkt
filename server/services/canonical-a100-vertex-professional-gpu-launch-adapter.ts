import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
} from '../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import {
  CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
  CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
  assertCanonicalA100VertexCustomJobLaunchAuthority,
  assertCanonicalA100VertexCustomJobRelease,
  type CanonicalA100VertexCustomJobLaunchResult,
} from './canonical-a100-vertex-custom-job-launch-port'
import type {
  CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSam31GpuRuntimeReleaseRegistry,
} from './canonical-sam3_1-gpu-runtime-release-registry'
import {
  assertCanonicalSam31VertexQualificationQuotaObservation,
  type CanonicalSam31VertexQualificationQuotaObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import type {
  CanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_PROFESSIONAL_GPU_LAUNCH_ADAPTER_VERSION =
  'canonical-a100-vertex-professional-gpu-launch-adapter-v1' as const

const SERVICE_ACCOUNT =
  'reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com' as const
const IMAGE_PREFIX =
  'us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@sha256:' as const

type VertexLaunchPort = ReturnType<
  typeof import('./canonical-a100-vertex-custom-job-launch-port')
    .createCanonicalA100VertexCustomJobLaunchPort
>

/**
 * Adapts the generic funded lifecycle only after it rereads the exact SAM 3.1
 * release pair, Vertex rate, and live Vertex quota. The caller cannot provide
 * an image, command, route, environment, model, price, quota, or retry policy.
 */
export function createCanonicalA100VertexProfessionalGpuLaunchAdapter(input: {
  readonly releasePairReadPort: Pick<
    CanonicalSam31GpuRuntimeReleaseRegistry,
    'rereadReleasePair'
  >
  readonly rateAuthorityReadPort:
    Pick<CanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
      'reread'>
  readonly quotaReadPort: CanonicalSam31VertexQualificationQuotaReadPort
  readonly vertexLaunchPort: VertexLaunchPort
  readonly now?: () => string
}): CanonicalProfessionalGpuCloudJobLaunchPort {
  if (typeof input.releasePairReadPort?.rereadReleasePair !== 'function'
    || typeof input.rateAuthorityReadPort?.reread !== 'function'
    || typeof input.quotaReadPort?.rereadCurrent !== 'function'
    || typeof input.vertexLaunchPort?.startOneShotJob !== 'function') {
    throw new Error('Vertex A100 professional launch adapter is incomplete.')
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async startOneShotJob(untrusted: Parameters<
      CanonicalProfessionalGpuCloudJobLaunchPort['startOneShotJob']
    >[0]) {
      const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
        untrusted.admission,
      )
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        untrusted.target,
      )
      if (admission.toolId !== 'sam3_1'
        || admission.operationId !==
          'tool.sam3_1.segment_and_track_subject.v1'
        || admission.routeId !== 'a100_80gb_heavy_primary'
        || target.routeId !== admission.routeId
        || target.executionTarget !==
          'google_cloud_vertex_custom_job_a2_ultra'
        || target.accelerator !== 'nvidia_a100_80gb'
        || target.machineType !== 'a2-ultragpu-1g') {
        throw new Error('Vertex A100 adapter received another route.')
      }
      const observedAt = now()
      const [pair, rateRaw, quotaRaw] = await Promise.all([
        input.releasePairReadPort.rereadReleasePair({
          runtimeReleaseRef: target.releaseRef,
        }),
        input.rateAuthorityReadPort.reread({
          rateAuthorityRef: admission.currentRateAuthorityRef,
          at: observedAt,
        }),
        input.quotaReadPort.rereadCurrent(),
      ])
      if (!pair || !rateRaw) {
        throw new Error('Vertex A100 current release or rate is unavailable.')
      }
      const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
        rateRaw,
        observedAt,
      )
      const quota = assertCurrentQuota(quotaRaw, observedAt)
      const specialized = pair.specializedRelease
      const generic = pair.runtimeRelease
      if (generic.releaseId !== target.releaseRef.id
        || generic.releaseVersion !== target.releaseRef.version
        || `sha256:${generic.releaseHash}` !== target.releaseRef.contentHash
        || generic.executionTarget !== target.executionTarget
        || specialized.route.executionTarget !== target.executionTarget
        || specialized.imageSupplyChainReleaseRef === null
        || rate.rateAuthorityId !== admission.currentRateAuthorityRef.id
        || rate.rateAuthorityVersion !== admission.currentRateAuthorityRef.version
        || `sha256:${rate.rateAuthorityHash}` !==
          admission.currentRateAuthorityRef.contentHash) {
        throw new Error('Vertex A100 launch lineage changed after admission.')
      }
      const release = buildRelease({
        pair,
        rate,
        quota,
        observedAt,
      })
      const authority = buildAuthority({
        admission,
        target,
        release,
        admissionConsumptionRef: untrusted.admissionConsumptionRef,
        executionEnvelopeRef: untrusted.executionEnvelopeRef,
      })
      const result = await input.vertexLaunchPort.startOneShotJob({
        authority,
        release,
      })
      return mapResult(result)
    },
  })
}

function buildRelease(input: {
  readonly pair: NonNullable<Awaited<ReturnType<
    CanonicalSam31GpuRuntimeReleaseRegistry['rereadReleasePair']
  >>>
  readonly rate: ReturnType<
    typeof assertCanonicalCurrentGoogleCloudVertexA100RateAuthority
  >
  readonly quota: CanonicalSam31VertexQualificationQuotaObservation
  readonly observedAt: string
}) {
  const specialized = input.pair.specializedRelease
  const generic = input.pair.runtimeRelease
  const expiresAt = earliest(
    generic.expiresAt,
    input.rate.expiresAt,
    input.quota.expiresAt,
  )
  if (Date.parse(expiresAt) <= Date.parse(input.observedAt)) {
    throw new Error('Vertex A100 release dependencies are expired.')
  }
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_RELEASE_VERSION,
    source: 'canonical_server_a100_vertex_custom_job_release_registry',
    evidenceClass: 'canonical_private_reread',
    releaseRef: ref(generic.releaseId, generic.releaseVersion,
      generic.releaseHash),
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    projectId: 'reeditpro',
    region: 'us-central1',
    customJobParent: 'projects/reeditpro/locations/us-central1',
    serviceAccountEmail: SERVICE_ACCOUNT,
    serviceIdentityRef: generic.serviceIdentityRef,
    immutableImageUri: `${IMAGE_PREFIX}${generic.immutableImageDigest.slice(7)}`,
    immutableImageRef: generic.immutableImageRef,
    immutableImageDigest: generic.immutableImageDigest,
    imageSupplyChainReleaseRef: specialized.imageSupplyChainReleaseRef,
    sourceCheckpointQualificationRef: ref(
      specialized.qualification.sourceCheckpointCompatibilityQualificationRef
        .id,
      specialized.qualification.sourceCheckpointCompatibilityQualificationRef
        .version,
      specialized.qualification.sourceCheckpointCompatibilityQualificationRef
        .contentHash.slice(7),
    ),
    privateArtifactTransportRef:
      specialized.privateNetworkAndArtifactTransportRef,
    privateNetworkPeeringQualificationRef:
      specialized.privateNetworkAndArtifactTransportRef,
    networkResource:
      'projects/390722338345/global/networks/weeditpro-gpu-private',
    encryptionKeyResource:
      'projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification',
    currentRateAuthorityRef: ref(
      input.rate.rateAuthorityId,
      input.rate.rateAuthorityVersion,
      input.rate.rateAuthorityHash,
    ),
    quotaPreferenceObservationRef: ref(
      `vertex-a100-quota.${input.quota.observationHash.slice(0, 32)}`,
      1,
      input.quota.observationHash,
    ),
    quotaPreferenceId: input.quota.quotaPreferenceId,
    quotaId: input.quota.quotaId,
    quotaPreferredValue: input.quota.preferredValue,
    quotaGrantedValue: input.quota.grantedValue,
    quotaReconciling: input.quota.reconciling,
    machineType: 'a2-ultragpu-1g',
    acceleratorType: 'NVIDIA_A100_80GB',
    acceleratorCount: 1,
    replicaCount: 1,
    bootDiskType: 'pd-ssd',
    bootDiskSizeGb: 200,
    maximumExecutionSeconds: 7_200,
    persistentResourceAllowed: false,
    persistentEndpointAllowed: false,
    publicIpExecutionAllowed: false,
    privateIpAndVPCPeeringRequired: true,
    runtimeNetworkDownloadAllowed: false,
    callerImageCommandArgsEnvironmentOrModelSelectionAllowed: false,
    containerEntrypointFromImmutableImageOnly: true,
    oneWorkerPoolOnly: true,
    oneReplicaOnly: true,
    restartJobOnWorkerRestart: false,
    automaticRetryAllowed: false,
    minimumIdleInstances: 0,
    startsOnlyFromDurablyConsumedApprovedAuthority: true,
    stopsAtTerminalAttempt: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: input.observedAt,
    expiresAt,
  } as const
  return assertCanonicalA100VertexCustomJobRelease({
    ...payload,
    configurationHash: sha256AuthorityValue(payload),
  })
}

function buildAuthority(input: {
  readonly admission: ReturnType<
    typeof assertCanonicalProfessionalToolGpuDispatchAdmission
  >
  readonly target: ReturnType<
    typeof assertCanonicalProfessionalGpuRuntimeLaunchTarget
  >
  readonly release: ReturnType<
    typeof assertCanonicalA100VertexCustomJobRelease
  >
  readonly admissionConsumptionRef: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  }
  readonly executionEnvelopeRef: {
    readonly id: string
    readonly version: number
    readonly contentHash: string
  }
}) {
  const scope = input.admission.scope
  const payload = {
    schemaVersion: CANONICAL_A100_VERTEX_CUSTOM_JOB_LAUNCH_AUTHORITY_VERSION,
    source: 'canonical_professional_gpu_dispatch_owner',
    authorityId: `${input.admission.admissionId}.vertex-a100`,
    toolId: 'sam3_1',
    operationId: input.admission.operationId,
    routeId: 'a100_80gb_heavy_primary',
    executionTarget: 'google_cloud_vertex_custom_job_a2_ultra',
    releaseRef: input.target.releaseRef,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotRef: scope.approvedSnapshotRef,
    confirmedOutputFrameRef: scope.confirmedOutputFrameRef,
    masterTimingRef: scope.masterTimingRef,
    approvedWorkItemRef: scope.approvedWorkItemRef,
    workerLeaseRef: scope.workerLeaseRef,
    fundedReservationRef: scope.fundedReservationRef,
    approvedEstimateRef: input.admission.estimateRef,
    userApprovalRecordRef: scope.userApprovalRecordRef,
    userTriggerRecordRef: scope.userTriggerRecordRef,
    executionAttemptRef: scope.executionAttemptRef,
    executionEnvelopeRef: input.executionEnvelopeRef,
    currentRateAuthorityRef: input.admission.currentRateAuthorityRef,
    maximumReservedToolCostCredits:
      input.admission.estimateMaximumReservedToolCostCredits,
    exactSnapshotWorkLeaseReservationTriggerReleaseAndRateReread: true,
    createOnlyDurableConsumptionRequiredBeforeProviderCall: true,
    oneAuthorityMayCreateAtMostOneCustomJob: true,
    retryAfterUnknownCreateOutcomeAllowed: false,
    userTriggeredScaleFromZero: true,
    noApprovedAuthorityMeansZeroGpuJobs: true,
    callerImageCommandArgsEnvironmentOrModelAccepted: false,
    cpuOnlySubstantiveExecutionAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.admission.admittedAt,
    expiresAt: earliest(input.admission.expiresAt, input.release.expiresAt),
  } as const
  return assertCanonicalA100VertexCustomJobLaunchAuthority({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

function mapResult(result: CanonicalA100VertexCustomJobLaunchResult) {
  return Object.freeze({
    disposition: result.disposition === 'accepted'
      ? 'accepted' as const
      : result.disposition === 'rejected_before_creation'
        ? 'rejected_before_creation' as const
        : 'outcome_unknown' as const,
    cloudJobExecutionRef: result.customJobExecutionRef,
    cloudJobCreateRequestRef: result.customJobCreateRequestRef,
    providerRequestIdDigestSha256:
      result.customJobCreateRequestRef.contentHash.slice(7),
    observedAt: result.observedAt,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      result.providerInferenceOrSubstantiveWorkKnownExecuted,
  })
}

function assertCurrentQuota(
  value: unknown,
  at: string,
): CanonicalSam31VertexQualificationQuotaObservation {
  const quota = assertCanonicalSam31VertexQualificationQuotaObservation(value)
  if (Date.parse(at) < Date.parse(quota.observedAt)
    || Date.parse(at) >= Date.parse(quota.expiresAt)) {
    throw new Error('Vertex A100 quota observation is not current.')
  }
  return quota
}

function ref(id: string, version: number, hash: string) {
  return Object.freeze({
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  })
}

function earliest(...values: readonly string[]): string {
  return new Date(Math.min(...values.map((value) => Date.parse(value))))
    .toISOString()
}
