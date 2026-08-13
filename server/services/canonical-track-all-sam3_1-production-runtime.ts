import { Storage } from '@google-cloud/storage'

import type { RuntimeEnv } from '../config/env'
import {
  createCanonicalSkillQualificationRegistry,
  type CanonicalSkillQualificationRegistryReadPort,
} from '../orchestra/canonical-skill-qualification-registry'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-serving-rate-authority-repository'
import {
  createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository,
} from './canonical-current-google-cloud-vertex-a100-rate-authority-repository'
import {
  createCanonicalGcsAtomicCurrentJsonPointerPort,
  createCanonicalSam31CurrentA100CustomerDispatchReadinessRepository,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness-repository'
import type {
  CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  createCanonicalGcsProfessionalGpuFundedStartAuthorityStore,
} from './canonical-professional-gpu-funded-start-authority-store'
import {
  createCanonicalProfessionalGpuPricingAuthorityStore,
} from './canonical-professional-gpu-pricing-authority-store'
import {
  createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository,
} from './canonical-professional-google-cloud-gpu-runtime-configuration-repository'
import {
  createGoogleCloudProfessionalGpuJobLaunchPort,
} from './canonical-professional-google-cloud-gpu-job-launch-port'
import {
  createCanonicalProfessionalL4CloudRunExecutionAuthorityRepository,
  createCanonicalProfessionalL4CloudRunExecutionReadPort,
} from './canonical-professional-l4-cloud-run-execution-authority-repository'
import {
  createCanonicalProfessionalGpuTerminalCostEvidenceReadPort,
} from './canonical-professional-gpu-terminal-cost-evidence-service'
import {
  createGoogleCloudProfessionalGpuTerminalObservationPort,
} from './canonical-professional-google-cloud-gpu-terminal-observation-port'
import type {
  CanonicalProfessionalGpuCloudJobLaunchPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalA100VertexCustomJobDurableStore,
} from './canonical-a100-vertex-custom-job-durable-store'
import {
  createCanonicalA100VertexCustomJobTerminalPort,
} from './canonical-a100-vertex-custom-job-terminal-port'
import {
  createCanonicalA100VertexProfessionalGpuTerminalObservationPort,
} from './canonical-a100-vertex-professional-gpu-terminal-adapter'
import {
  createCanonicalA100VertexTerminalCostEvidenceReadPort,
} from './canonical-a100-vertex-terminal-cost-evidence-service'
import {
  createCanonicalA100VertexPlatformUsageReadPort,
  createCanonicalA100VertexProviderAllocationCostReceiptStore,
  createCanonicalSam31A100VertexWorkerUsageReadPort,
} from './canonical-a100-vertex-production-terminal-adapters'
import {
  createCanonicalSam31VertexQualificationQuotaReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import {
  createCanonicalGcsSam31ApprovedTrackAllTaskSourceRepository,
} from './canonical-sam3_1-approved-track-all-task-source-repository'
import {
  createCanonicalSam31FundedGpuRuntimeComposition,
} from './canonical-sam3_1-funded-gpu-runtime-composition'
import {
  createCanonicalSam31GpuRuntimeReleaseRegistry,
} from './canonical-sam3_1-gpu-runtime-release-registry'
import {
  createCanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  createCanonicalGcsSam31PreparedMaskProxyRepository,
} from './canonical-sam3_1-prepared-mask-proxy-repository'
import {
  createCanonicalTrackAllSam31AuthenticatedGpuInvocationRuntime,
  createCanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort,
  createCanonicalTrackAllSam31AuthenticatedGpuStartRuntime,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort,
  type CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  createCanonicalTrackAllSam31QueuedGpuStartRuntime,
  type CanonicalTrackAllSam31QueuedGpuStartRuntimePort,
} from './canonical-track-all-sam3_1-queued-gpu-start-service'
import {
  createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter,
  createCanonicalProfessionalGpuFairQueueProductionPostgresCapability,
} from './canonical-professional-gpu-fair-queue-postgres-rpc-adapter'
import {
  createCanonicalProfessionalGpuFairQueueServerHttpClient,
} from './canonical-professional-gpu-fair-queue-server-http-client'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter,
  createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability,
} from './canonical-professional-gpu-cloud-task-outbox-postgres-rpc-adapter'
import {
  createCanonicalProfessionalGpuCloudTaskOutboxServerHttpClient,
} from './canonical-professional-gpu-cloud-task-outbox-server-http-client'
import {
  createCanonicalProfessionalGpuQueueRuntimeReadPort,
  createCanonicalSam31ProductionGpuQueueCapacityReadPort,
} from './canonical-professional-gpu-queue-runtime-read-port'
import {
  createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient,
} from './canonical-professional-gpu-queue-runtime-read-server-http-client'
import {
  createCanonicalProfessionalGpuCloudTaskRuntimeConfig,
  createGoogleCloudProfessionalGpuCloudTaskDispatchPort,
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SERVICE_ACCOUNT,
} from './canonical-professional-gpu-cloud-task-dispatch'
import {
  createCanonicalProfessionalGpuCloudTaskScheduler,
  type CanonicalProfessionalGpuCloudTaskScheduler,
} from './canonical-professional-gpu-cloud-task-scheduler-service'
import {
  createCanonicalProfessionalGpuCloudTaskConsumer,
  type CanonicalProfessionalGpuCloudTaskConsumer,
} from './canonical-professional-gpu-cloud-task-consumer-service'
import {
  createCanonicalLiveGoogleServiceIdentityVerifier,
} from '../security/canonical-service-identity-verifier'
import {
  createCanonicalSam31GcpL4CompleteSourceCapacityReadPort,
  createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort,
} from './canonical-sam3_1-complete-source-capacity-owner'
import {
  rereadCanonicalSam31VertexServingCapacity,
} from './canonical-sam3_1-vertex-serving-capacity-mutation'
import {
  createCanonicalSam31CurrentVertexCustomerInvocationRepository,
  createCanonicalSam31CurrentVertexCustomerInvocationService,
} from './canonical-sam3_1-current-vertex-serving-invocation-service'
import {
  createCanonicalSam31VertexServingTerminalAttemptOwner,
  type CanonicalSam31VertexServingTerminalAttemptOwner,
} from './canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  createCanonicalSam31GcsPrivateBinaryObjectPort,
  createCanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  createCanonicalSam31GcsPrivateOutputRereadPort,
} from '../workers/masks/canonical-sam3_1-gcs-private-output-reader'
import {
  createCanonicalSam31A100ResultFinalizationRuntime,
  type CanonicalSam31A100ResultFinalizationRuntimePort,
} from './canonical-sam3_1-a100-result-finalization-service'
import {
  createCanonicalSpecialistSupportResumeRepository,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  createCanonicalCaptionTrackAllEvidenceRepository,
  createCanonicalCaptionTrackAllSupportService,
  createCanonicalTrackAllSam31CaptionSceneEvidenceRepository,
  type CanonicalCaptionTrackAllEvidenceRepository,
  type CanonicalCaptionTrackAllSupportService,
  type CanonicalTrackAllSam31CaptionSceneEvidenceRepository,
} from './canonical-caption-track-all-support-service'
import {
  createCanonicalTrackAllSam31TaskQaOwner,
  createCanonicalTrackAllSam31TaskQaRepository,
  type CanonicalTrackAllSam31TaskQaOwner,
  type CanonicalTrackAllSam31TaskQaRepository,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime,
  type CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort,
} from './canonical-track-all-sam3_1-caption-evidence-finalization-service'
import {
  createCanonicalTrackAllSam31TaskQaCandidateRepository,
  createCanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntime,
  type CanonicalTrackAllSam31TaskQaCandidateRepository,
  type CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort,
} from './canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import {
  createCanonicalTrackAllSam31L4TaskQaMaterialRepository,
  createCanonicalTrackAllSam31L4TaskQaTaskStore,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import {
  createCanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition,
} from './canonical-track-all-sam3_1-l4-task-qa-funded-gpu-runtime-composition'
import {
  createCanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntime,
  createCanonicalTrackAllSam31L4TaskQaSamOutputReadPort,
  type CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort,
} from './canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'
import {
  createCanonicalTrackAllSam31L4TaskQaQueuedStartRuntime,
  type CanonicalTrackAllSam31L4TaskQaQueuedStartRuntimePort,
} from './canonical-track-all-sam3_1-l4-task-qa-queued-start-service'
import {
  createCanonicalTrackAllSam31L4TaskQaCloudTaskConsumer,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-task-consumer-service'
import {
  createCanonicalTrackAllSam31L4TaskQaTerminalCostAdapters,
} from './canonical-track-all-sam3_1-l4-task-qa-terminal-cost-adapters'
import {
  createCanonicalTrackAllSam31L4TaskQaTerminalReconciler,
} from './canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-service'
import {
  createCanonicalSam31CompleteSourceChunkCoordinator,
  createCanonicalSam31CompleteSourceChunkRepository,
  type CanonicalSam31CompleteSourceChunkCoordinator,
  type CanonicalSam31CompleteSourceChunkRepository,
} from './canonical-sam3_1-complete-source-chunk-coordinator'
import {
  createCanonicalSam31CurrentServingResultFinalizationRuntime,
  type CanonicalSam31CurrentServingResultFinalizationRuntimePort,
} from './canonical-sam3_1-current-serving-result-finalization-service'
import {
  createCanonicalSam31VertexServingReconciledWindowCostRepository,
  type CanonicalSam31VertexServingReconciledWindowCostRepository,
} from './canonical-sam3_1-vertex-serving-reconciled-window-cost-repository'
import {
  createCanonicalSam31CompleteSourceServingReleaseOwner,
  createCanonicalSam31CompleteSourceServingReleaseRepository,
  type CanonicalSam31CompleteSourceServingReleaseOwner,
  type CanonicalSam31CompleteSourceServingReleaseRepository,
} from './canonical-sam3_1-complete-source-serving-release'
import {
  readPrivateEditAuthorityAggregate,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-production-runtime-v30' as const

const PROJECT_ID = 'reeditpro' as const

export interface CanonicalTrackAllSam31ProductionRuntime {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION
  readonly runtimeMode:
    'vertex_a100_cloud_run_l4_gcs_user_triggered_scale_from_zero'
  readonly skillQualificationRegistryReadPort:
    CanonicalSkillQualificationRegistryReadPort
  readonly trackAllSam31AuthenticatedGpuStartRuntimePort:
    CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
  readonly trackAllSam31AuthenticatedGpuInvocationRuntimePort:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort
  readonly trackAllSam31QueuedGpuStartRuntimePort:
    CanonicalTrackAllSam31QueuedGpuStartRuntimePort
  readonly professionalGpuCloudTaskScheduler:
    CanonicalProfessionalGpuCloudTaskScheduler
  readonly professionalGpuCloudTaskConsumer:
    CanonicalProfessionalGpuCloudTaskConsumer
  readonly sam31VertexServingTerminalAttemptOwner:
    CanonicalSam31VertexServingTerminalAttemptOwner
  readonly a100CustomerDispatchReadinessReadPort:
    CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
  readonly a100VertexCustomJobTerminalReadPort: ReturnType<
    typeof createCanonicalA100VertexCustomJobTerminalPort
  >
  readonly sam31A100ResultFinalizationRuntimePort:
    CanonicalSam31A100ResultFinalizationRuntimePort
  readonly sam31CompleteSourceChunkRepository:
    CanonicalSam31CompleteSourceChunkRepository
  readonly sam31CompleteSourceChunkCoordinator:
    CanonicalSam31CompleteSourceChunkCoordinator
  readonly sam31CurrentServingResultFinalizationRuntimePort:
    CanonicalSam31CurrentServingResultFinalizationRuntimePort
  readonly sam31VertexServingReconciledWindowCostRepository:
    CanonicalSam31VertexServingReconciledWindowCostRepository
  readonly sam31CompleteSourceServingReleaseRepository:
    CanonicalSam31CompleteSourceServingReleaseRepository
  readonly sam31CompleteSourceServingReleaseOwner:
    CanonicalSam31CompleteSourceServingReleaseOwner
  readonly trackAllSam31L4TaskQaAuthenticatedStartRuntimePort:
    CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort
  readonly trackAllSam31L4TaskQaQueuedStartRuntimePort:
    CanonicalTrackAllSam31L4TaskQaQueuedStartRuntimePort
  readonly trackAllSam31CaptionEvidenceFinalizationRuntimePort:
    CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort
  readonly trackAllSam31TaskQaEvidenceFinalizationRuntimePort:
    CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort
  readonly trackAllSam31TaskQaCandidateRepository:
    CanonicalTrackAllSam31TaskQaCandidateRepository
  readonly specialistSupportResumeRepository:
    CanonicalSpecialistSupportResumeRepository
  readonly captionTrackAllSceneEvidenceRepository:
    CanonicalTrackAllSam31CaptionSceneEvidenceRepository
  readonly captionTrackAllTaskQaRepository:
    CanonicalTrackAllSam31TaskQaRepository
  readonly captionTrackAllTaskQaOwner: CanonicalTrackAllSam31TaskQaOwner
  readonly captionTrackAllEvidenceRepository:
    CanonicalCaptionTrackAllEvidenceRepository
  readonly captionTrackAllSupportService:
    CanonicalCaptionTrackAllSupportService
  readonly captionTrackAllEvidenceRequiresAdmittedCanonicalSam31Result: true
  readonly captionTrackAllEvidenceRequiresIndependentTaskLevelMaskQa: true
  readonly captionTrackAllEvidenceRequiresPrivateVisualReview: true
  readonly a100HeavyPrimary: true
  readonly a100PrimaryRequiresQualifiedReleaseAtAdmission: true
  readonly l4HeavyFallbackRequiresSeparateQualifiedReleaseAtAdmission: true
  readonly l4HeavyFallbackQualificationClaimedByComposition: false
  readonly minimumIdleGpuInstances: 0
  readonly cpuOnlySubstantiveExecutionAllowed: false
  readonly callerGpuRouteModelImageCommandOrPriceAccepted: false
  readonly rawTaskQaMeasurementReviewOrCloudClaimAccepted: false
  readonly canonicalBackendCompilesTaskQaMeasurementFromFixedWorkerEvidence:
    true
  readonly separateSam31InputAndL4TaskQaInvocationRootsRequired: true
  readonly rawCloudLaunchPortExposed: false
  readonly historicalVertexCustomJobCustomerDispatchAllowed: false
  readonly currentA100DedicatedEndpointInvocationMounted: true
  readonly completeSourceSequentialChunkCoordinatorMounted: true
  readonly exactPrivateOutputRereadBeforeNextChunkMounted: true
  readonly durablePostgresQueueMountedBeforeGpuInvocation: true
  readonly userTriggeredCloudTaskSchedulingMounted: true
  readonly authenticatedCloudTaskConsumerMounted: true
  readonly l4RouteAwareCloudTaskConsumerMounted: true
  readonly l4TerminalUsageCostAndZeroActiveGpuReconciliationMounted: true
  readonly l4QueueFinalizationBeforeTerminalCostAndZeroActiveGpuAllowed: false
  readonly terminalServingAttemptOwnerMountedBeforeQueueFinalization: true
  readonly completeSourceCostSettlementAndScaleZeroReleaseMounted: true
  readonly perChunkResultMaySelfClaimServingWindowScaleZero: false
  readonly captionTrackAllCurrentServingGroupReleaseRereadMounted: true
  readonly l4QuotaAndActiveCountCapacityMounted: true
  readonly l4FixedTaskPreparedBeforeDurableQueueAdmission: true
  readonly directL4GpuInvocationHttpRouteMounted: false
  readonly directA100InvocationHttpRouteMounted: false
  readonly freshA100PricingUsesVertexServingRateAuthority: true
  readonly historicalA100CustomJobPricingRemainsReadOnly: true
}

/**
 * Production composition root for authenticated Track All / SAM 3.1 starts.
 * It mounts only in the Cloud Run + GCS runtime. Missing configuration keeps
 * local/mock modes source-only and makes an incomplete cloud deployment fail
 * during startup rather than falling back to CPU or caller-supplied material.
 */
export function createCanonicalTrackAllSam31ProductionRuntime(
  env: RuntimeEnv,
  input: { readonly storage?: Storage } = {},
): CanonicalTrackAllSam31ProductionRuntime | null {
  if (env.mode !== 'cloud_run' || env.storageMode !== 'gcs') return null
  const projectId = requiredProject(env.googleCloudProjectId)
  const controlPlaneBucketName = requiredBucket(
    env.gcsControlPlaneStateBucket,
    'control-plane state',
  )
  const privateGpuObjectBucketName = requiredBucket(
    env.gcsProcessedMediaBucket,
    'processed-media private GPU object',
  )
  const storage = input.storage ?? new Storage({ projectId })
  const supabaseUrl = requiredServerSetting(
    env.supabaseUrl,
    'Supabase Postgres origin',
  )
  const supabaseServiceRoleKey = requiredServerSetting(
    env.supabaseServiceRoleKey,
    'Supabase service-role credential',
  )
  const gpuQueueRpcClient =
    createCanonicalProfessionalGpuFairQueueServerHttpClient({
      endpointOrigin: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
    })
  const gpuQueueTransactionAdapter =
    createCanonicalProfessionalGpuFairQueueProductionPostgresAdapter({
      client: gpuQueueRpcClient,
      capability:
        createCanonicalProfessionalGpuFairQueueProductionPostgresCapability({
          endpointOrigin: supabaseUrl,
          client: gpuQueueRpcClient,
        }),
    })
  const gpuOutboxRpcClient =
    createCanonicalProfessionalGpuCloudTaskOutboxServerHttpClient({
      endpointOrigin: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
    })
  const gpuCloudTaskOutboxAdapter =
    createCanonicalProfessionalGpuCloudTaskOutboxProductionAdapter({
      client: gpuOutboxRpcClient,
      capability:
        createCanonicalProfessionalGpuCloudTaskOutboxProductionCapability({
          endpointOrigin: supabaseUrl,
          client: gpuOutboxRpcClient,
        }),
    })
  const gpuQueueRuntimeReadPort =
    createCanonicalProfessionalGpuQueueRuntimeReadPort({
      client: createCanonicalProfessionalGpuQueueRuntimeReadServerHttpClient({
        endpointOrigin: supabaseUrl,
        serviceRoleKey: supabaseServiceRoleKey,
      }),
    })
  const gpuCloudTaskTargetOrigin = requiredServerSetting(
    env.professionalGpuTaskTargetOrigin,
    'professional GPU Cloud Task target origin',
  )
  const gpuCloudTaskRuntimeConfig =
    createCanonicalProfessionalGpuCloudTaskRuntimeConfig({
      targetOrigin: gpuCloudTaskTargetOrigin,
    })
  const professionalGpuCloudTaskScheduler =
    createCanonicalProfessionalGpuCloudTaskScheduler({
      queueAdapter: gpuQueueTransactionAdapter,
      outboxAdapter: gpuCloudTaskOutboxAdapter,
      dispatchPort: createGoogleCloudProfessionalGpuCloudTaskDispatchPort({
        runtimeConfig: gpuCloudTaskRuntimeConfig,
      }),
      runtimeConfig: gpuCloudTaskRuntimeConfig,
      capacityReadPort:
        createCanonicalSam31ProductionGpuQueueCapacityReadPort({
          queueRuntimeReadPort: gpuQueueRuntimeReadPort,
          a100QuotaReadPort:
            createCanonicalSam31GcpA100ServingCompleteSourceCapacityReadPort(),
          a100EndpointCapacityReadPort: {
            rereadCurrent: () =>
              rereadCanonicalSam31VertexServingCapacity(),
          },
          l4QuotaReadPort:
            createCanonicalSam31GcpL4CompleteSourceCapacityReadPort(),
        }),
      dispatchableRouteIds: [
        'a100_80gb_heavy_primary',
        'l4_standard_primary',
      ],
      dispatcherInstanceId: env.workerInstanceId,
    })
  const controlPlaneObjectPort =
    createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: controlPlaneBucketName,
    })
  const privateGpuJsonObjectPort =
    createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: privateGpuObjectBucketName,
    })
  const skillQualificationRegistry =
    createCanonicalSkillQualificationRegistry({
      objectPort: controlPlaneObjectPort,
    })
  const l4CloudRunExecutionAuthorityRepository =
    createCanonicalProfessionalL4CloudRunExecutionAuthorityRepository({
      objectPort: controlPlaneObjectPort,
    })

  const pricingAuthorityStore =
    createCanonicalProfessionalGpuPricingAuthorityStore({
      objectPort: controlPlaneObjectPort,
    })
  const fundedStartAuthorityStore =
    createCanonicalGcsProfessionalGpuFundedStartAuthorityStore({
      storage,
      projectId,
      bucketName: controlPlaneBucketName,
    })
  const currentRateAuthorityRepository =
    createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
      objectPort: controlPlaneObjectPort,
    })
  const currentVertexA100ServingRateAuthorityRepository =
    createCanonicalCurrentGoogleCloudVertexA100ServingRateAuthorityRepository({
      objectPort: controlPlaneObjectPort,
    })
  const historicalVertexA100CustomJobRateAuthorityRepository =
    createCanonicalCurrentGoogleCloudVertexA100RateAuthorityRepository({
      objectPort: controlPlaneObjectPort,
    })
  const currentExecutionRateAuthorityReadPort = Object.freeze({
    async rereadApprovedCurrentRate(request: {
      readonly rateAuthorityRef: {
        readonly id: string
        readonly version: number
        readonly contentHash: string
      }
      readonly routeId:
        | 'a100_80gb_heavy_primary'
        | 'l4_heavy_fallback'
        | 'l4_standard_primary'
      readonly at: string
    }) {
      if (request.routeId === 'a100_80gb_heavy_primary') {
        return currentVertexA100ServingRateAuthorityRepository.reread({
          rateAuthorityRef: request.rateAuthorityRef,
          at: request.at,
        })
      }
      return currentRateAuthorityRepository.rereadApprovedCurrentRate(request)
    },
  })
  const runtimeConfigurationRepository =
    createCanonicalGcsProfessionalGoogleCloudGpuRuntimeConfigurationRepository({
      storage,
      projectId,
      bucketName: controlPlaneBucketName,
      privateObjectTransportBucketName: privateGpuObjectBucketName,
    })
  const releasePairRegistry =
    createCanonicalSam31GpuRuntimeReleaseRegistry({
      objectPort: controlPlaneObjectPort,
    })
  const currentA100CustomerDispatchReadinessRepository =
    createCanonicalSam31CurrentA100CustomerDispatchReadinessRepository({
      objectPort: controlPlaneObjectPort,
      currentPointerPort: createCanonicalGcsAtomicCurrentJsonPointerPort({
        storage,
        bucketName: controlPlaneBucketName,
      }),
    })
  const taskContextRepository =
    createCanonicalSam31GpuTaskContextRepository({
      objectPort: controlPlaneObjectPort,
    })
  const approvedTaskMaterialSourceRepository =
    createCanonicalGcsSam31ApprovedTrackAllTaskSourceRepository({
      storage,
      projectId,
      bucketName: controlPlaneBucketName,
      qualificationRegistryReadPort: skillQualificationRegistry,
    })
  const preparedMaskProxyRepository =
    createCanonicalGcsSam31PreparedMaskProxyRepository({
      storage,
      projectId,
      controlPlaneBucketName,
      privateProxyBucketName: privateGpuObjectBucketName,
    })
  const privateInputStagingPort =
    createCanonicalSam31GpuPrivateInputStagingPort({
      sourceReadPort: preparedMaskProxyRepository,
      binaryObjectPort: createCanonicalSam31GcsPrivateBinaryObjectPort({
        storage,
        projectId,
        bucketName: privateGpuObjectBucketName,
      }),
    })
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: privateGpuJsonObjectPort,
  })
  const sam31RuntimeResultStore =
    createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
      objectPort: privateGpuJsonObjectPort,
    })
  const sam31CompleteSourceChunkRepository =
    createCanonicalSam31CompleteSourceChunkRepository({
      objectPort: controlPlaneObjectPort,
    })
  const sam31VertexServingReconciledWindowCostRepository =
    createCanonicalSam31VertexServingReconciledWindowCostRepository({
      objectPort: controlPlaneObjectPort,
    })
  const sam31CompleteSourceServingReleaseRepository =
    createCanonicalSam31CompleteSourceServingReleaseRepository({
      objectPort: controlPlaneObjectPort,
    })
  const sam31PrivateOutputRereadPort =
    createCanonicalSam31GcsPrivateOutputRereadPort({
      storage,
      projectId,
      bucketName: privateGpuObjectBucketName,
    })
  const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: controlPlaneObjectPort,
  })
  const trackAllSam31TaskQaCandidateRepository =
    createCanonicalTrackAllSam31TaskQaCandidateRepository({
      objectPort: privateGpuJsonObjectPort,
    })
  const trackAllSam31L4TaskQaMaterialRepository =
    createCanonicalTrackAllSam31L4TaskQaMaterialRepository({
      objectPort: controlPlaneObjectPort,
    })
  const trackAllSam31L4TaskQaTaskStore =
    createCanonicalTrackAllSam31L4TaskQaTaskStore({
      objectPort: privateGpuJsonObjectPort,
    })
  const trackAllSam31L4TaskQaSamOutputReadPort =
    createCanonicalTrackAllSam31L4TaskQaSamOutputReadPort({
      objectPort: privateGpuJsonObjectPort,
    })
  const specialistSupportResumeRepository =
    createCanonicalSpecialistSupportResumeRepository({
      objectPort: controlPlaneObjectPort,
    })
  const captionTrackAllSceneEvidenceRepository =
    createCanonicalTrackAllSam31CaptionSceneEvidenceRepository({
      objectPort: controlPlaneObjectPort,
    })
  const captionTrackAllTaskQaRepository =
    createCanonicalTrackAllSam31TaskQaRepository({
      objectPort: controlPlaneObjectPort,
    })
  const captionTrackAllTaskQaOwner =
    createCanonicalTrackAllSam31TaskQaOwner({
      supportResumeRepository: specialistSupportResumeRepository,
      taskStore,
      taskContextRepository,
      resultStore: sam31RuntimeResultStore,
      completeSourceServingReleaseRepository:
        sam31CompleteSourceServingReleaseRepository,
      qaRepository: captionTrackAllTaskQaRepository,
      sceneEvidenceRepository: captionTrackAllSceneEvidenceRepository,
    })
  const trackAllSam31TaskQaEvidenceFinalizationRuntimePort =
    createCanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntime({
      candidateRepository: trackAllSam31TaskQaCandidateRepository,
      lifecycleReadPort: lifecycleStore,
      sam31ResultStore: sam31RuntimeResultStore,
      sam31TaskStore: taskStore,
      taskContextRepository,
      taskQaRepository: captionTrackAllTaskQaRepository,
    })
  const captionTrackAllEvidenceRepository =
    createCanonicalCaptionTrackAllEvidenceRepository({
      objectPort: controlPlaneObjectPort,
    })
  const captionTrackAllSupportService =
    createCanonicalCaptionTrackAllSupportService({
      supportResumeRepository: specialistSupportResumeRepository,
      taskStore,
      taskContextRepository,
      resultStore: sam31RuntimeResultStore,
      completeSourceServingReleaseRepository:
        sam31CompleteSourceServingReleaseRepository,
      sceneQaAuthorityReadPort: captionTrackAllTaskQaRepository,
      sceneEvidenceRepository: captionTrackAllSceneEvidenceRepository,
      evidenceRepository: captionTrackAllEvidenceRepository,
    })
  const trackAllSam31CaptionEvidenceFinalizationRuntimePort =
    createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime({
      taskQaOwner: captionTrackAllTaskQaOwner,
      supportService: captionTrackAllSupportService,
    })
  const l4CloudLaunchPort = createGoogleCloudProfessionalGpuJobLaunchPort({
    releaseReadPort: runtimeConfigurationRepository,
    privateObjectTransportReadPort: runtimeConfigurationRepository,
    l4ExecutionAuthorityPort: l4CloudRunExecutionAuthorityRepository,
  })
  const vertexA100DurableStore =
    createCanonicalA100VertexCustomJobDurableStore({
      objectPort: controlPlaneObjectPort,
    })
  const vertexA100QuotaReadPort =
    createCanonicalSam31VertexQualificationQuotaReadPort()
  const vertexA100TerminalCostEvidenceReadPort =
    createCanonicalA100VertexTerminalCostEvidenceReadPort({
      contextReadPort: vertexA100DurableStore,
      workerUsageReadPort:
        createCanonicalSam31A100VertexWorkerUsageReadPort({
          taskStore,
          launchContextReadPort: vertexA100DurableStore,
          objectPort: controlPlaneObjectPort,
        }),
      platformUsageReadPort: createCanonicalA100VertexPlatformUsageReadPort({
        executionReadPort: vertexA100DurableStore,
        quotaReadPort: vertexA100QuotaReadPort,
        objectPort: controlPlaneObjectPort,
      }),
      rateAuthorityReadPort:
        historicalVertexA100CustomJobRateAuthorityRepository,
      receiptStore:
        createCanonicalA100VertexProviderAllocationCostReceiptStore({
          objectPort: controlPlaneObjectPort,
        }),
    })
  const a100VertexCustomJobTerminalReadPort =
    createCanonicalA100VertexCustomJobTerminalPort({
      executionRepository: vertexA100DurableStore,
      costEvidenceReadPort: vertexA100TerminalCostEvidenceReadPort,
    })
  const a100VertexProfessionalGpuTerminalObservationPort =
    createCanonicalA100VertexProfessionalGpuTerminalObservationPort({
      terminalReadPort: a100VertexCustomJobTerminalReadPort,
    })
  const sam31A100ResultFinalizationRuntimePort =
    createCanonicalSam31A100ResultFinalizationRuntime({
      lifecycleStore,
      terminalObservationPort:
        a100VertexProfessionalGpuTerminalObservationPort,
      taskStore,
      privateOutputRereadPort: sam31PrivateOutputRereadPort,
      resultStore: sam31RuntimeResultStore,
    })
  const rawCloudLaunchPort: CanonicalProfessionalGpuCloudJobLaunchPort =
    Object.freeze({
      async startOneShotJob(request: Parameters<
        CanonicalProfessionalGpuCloudJobLaunchPort['startOneShotJob']
      >[0]) {
        if (request.admission.routeId === 'a100_80gb_heavy_primary') {
          throw new Error(
            'Fresh A100 customer dispatch is blocked: the historical Vertex '
            + 'Custom Job route is read-only and the dedicated prediction '
            + 'endpoint runtime is not mounted yet.',
          )
        }
        if ((request.admission.routeId !== 'l4_standard_primary'
            && request.admission.routeId !== 'l4_heavy_fallback')
          || request.target.executionTarget !== 'google_cloud_run_l4_job') {
          throw new Error('Current L4 work may launch only through Cloud Run.')
        }
        return l4CloudLaunchPort.startOneShotJob(request)
      },
    })
  const runtimeComposition = createCanonicalSam31FundedGpuRuntimeComposition({
    taskContextRepository,
    approvedTaskMaterialSourceReadPort:
      approvedTaskMaterialSourceRepository,
    releasePairReadPort: releasePairRegistry,
    rateAuthorityReadPort: currentExecutionRateAuthorityReadPort,
    privateInputStagingPort,
    taskStore,
    rawCloudLaunchPort,
  })
  const l4TaskQaPreparationRuntimeComposition =
    createCanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition({
      materialRepository: trackAllSam31L4TaskQaMaterialRepository,
      taskStore: trackAllSam31L4TaskQaTaskStore,
      rawCloudLaunchPort,
    })
  const runtimeContextReadPort = Object.freeze({
    rereadQualifiedRuntimeRelease:
      releasePairRegistry.rereadQualifiedRuntimeRelease.bind(
        releasePairRegistry,
      ),
    rereadApprovedCurrentRate:
      currentExecutionRateAuthorityReadPort.rereadApprovedCurrentRate.bind(
        currentExecutionRateAuthorityReadPort,
      ),
  })
  const l4CloudRunExecutionReadPort =
    createCanonicalProfessionalL4CloudRunExecutionReadPort({
      repository: l4CloudRunExecutionAuthorityRepository,
    })
  const l4TaskQaTerminalCostAdapters =
    createCanonicalTrackAllSam31L4TaskQaTerminalCostAdapters({
      objectPort: controlPlaneObjectPort,
      lifecycleStore,
      pricingAuthorityReadPort: pricingAuthorityStore,
      runtimeContextReadPort,
      executionReadPort: l4CloudRunExecutionReadPort,
      taskStore: trackAllSam31L4TaskQaTaskStore,
    })
  const l4TaskQaTerminalCostEvidenceReadPort =
    createCanonicalProfessionalGpuTerminalCostEvidenceReadPort({
      contextReadPort: l4TaskQaTerminalCostAdapters.contextReadPort,
      usageReadPort: l4TaskQaTerminalCostAdapters.usageReadPort,
      rateReadPort: l4TaskQaTerminalCostAdapters.rateReadPort,
      receiptStore: l4TaskQaTerminalCostAdapters.receiptStore,
    })
  const l4TaskQaTerminalObservationPort =
    createGoogleCloudProfessionalGpuTerminalObservationPort({
      executionReadPort: l4CloudRunExecutionReadPort,
      costEvidenceReadPort: l4TaskQaTerminalCostEvidenceReadPort,
    })
  const l4TaskQaTerminalReconciler =
    createCanonicalTrackAllSam31L4TaskQaTerminalReconciler({
      fundedStartAuthorityStore,
      lifecycleStore,
      terminalCostAdapters: l4TaskQaTerminalCostAdapters,
      terminalObservationPort: l4TaskQaTerminalObservationPort,
      queueTransactionAdapter: gpuQueueTransactionAdapter,
    })
  const authenticatedRuntime =
    createCanonicalTrackAllSam31AuthenticatedGpuStartRuntime({
      pricingAuthorityReadPort: pricingAuthorityStore,
      approvedFundingReadPort: fundedStartAuthorityStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      runtimeContextReadPort,
      a100CustomerDispatchReadinessReadPort:
        currentA100CustomerDispatchReadinessRepository,
      releaseReadPort: runtimeConfigurationRepository,
      runtimeComposition,
      lifecycleStore,
      fundedLifecycleStore: lifecycleStore,
    })
  const currentVertexInvocationRepository =
    createCanonicalSam31CurrentVertexCustomerInvocationRepository({
      objectPort: controlPlaneObjectPort,
    })
  const currentVertexInvocationPort =
    createCanonicalSam31CurrentVertexCustomerInvocationService({
      taskStore,
      currentReadinessReadPort:
        currentA100CustomerDispatchReadinessRepository,
      repository: currentVertexInvocationRepository,
    })
  const authenticatedInvocationRuntime =
    createCanonicalTrackAllSam31AuthenticatedGpuInvocationRuntime({
      fundedPreparationRuntime: authenticatedRuntime,
      fundedLifecycleReadPort: lifecycleStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      currentVertexInvocationPort,
    })
  const professionalGpuCloudTaskConsumer =
    (() => {
      const terminalAttemptOwner =
        createCanonicalSam31VertexServingTerminalAttemptOwner({
          fundedStartAuthorityStore,
          invocationRepository: currentVertexInvocationRepository,
          objectPort: controlPlaneObjectPort,
        })
      return Object.freeze({
        terminalAttemptOwner,
        consumer: createCanonicalProfessionalGpuCloudTaskConsumer({
          identityVerifier: createCanonicalLiveGoogleServiceIdentityVerifier({
            authenticationMechanism: 'google_oidc_id_token',
            expectedPrincipalEmail:
              CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SERVICE_ACCOUNT,
            expectedAudience: gpuCloudTaskTargetOrigin,
          }),
          expectedAudience: gpuCloudTaskTargetOrigin,
          queueRuntimeReadPort: gpuQueueRuntimeReadPort,
          fundedStartAuthorityStore,
          invocationRuntime: authenticatedInvocationRuntime,
          terminalAttemptOwner,
          queueTransactionAdapter: gpuQueueTransactionAdapter,
          l4TaskQaConsumer:
            createCanonicalTrackAllSam31L4TaskQaCloudTaskConsumer({
              fundedStartAuthorityStore,
              lifecycleStore,
              releaseReadPort: runtimeConfigurationRepository,
              runtimeComposition: l4TaskQaPreparationRuntimeComposition,
              materialRepository:
                trackAllSam31L4TaskQaMaterialRepository,
              terminalReconciler: l4TaskQaTerminalReconciler,
            }),
        }),
      })
    })()
  const queuedGpuStartRuntime =
    createCanonicalTrackAllSam31QueuedGpuStartRuntime({
      fundedPreparationRuntime: authenticatedRuntime,
      fundedLifecycleReadPort: lifecycleStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      queueTransactionAdapter: gpuQueueTransactionAdapter,
    })
  const authenticatedInvocationResultReadPort =
    createCanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort({
      fundedLifecycleReadPort: lifecycleStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      invocationRepository: currentVertexInvocationRepository,
    })
  const sam31CompleteSourceChunkCoordinator =
    createCanonicalSam31CompleteSourceChunkCoordinator({
      repository: sam31CompleteSourceChunkRepository,
      queuedStartRuntime: queuedGpuStartRuntime,
      invocationResultReadPort: authenticatedInvocationResultReadPort,
      taskStore,
      resultStore: sam31RuntimeResultStore,
      privateOutputRereadPort: sam31PrivateOutputRereadPort,
    })
  const sam31CurrentServingResultFinalizationRuntimePort =
    createCanonicalSam31CurrentServingResultFinalizationRuntime({
      chunkRepository: sam31CompleteSourceChunkRepository,
      invocationResultReadPort: authenticatedInvocationResultReadPort,
      terminalAttemptOwner:
        professionalGpuCloudTaskConsumer.terminalAttemptOwner,
      taskStore,
      resultStore: sam31RuntimeResultStore,
    })
  const sam31CompleteSourceServingReleaseOwner =
    createCanonicalSam31CompleteSourceServingReleaseOwner({
      chunkRepository: sam31CompleteSourceChunkRepository,
      resultStore: sam31RuntimeResultStore,
      terminalAttemptOwner:
        professionalGpuCloudTaskConsumer.terminalAttemptOwner,
      costRepository: sam31VertexServingReconciledWindowCostRepository,
      settlementReadPort: Object.freeze({
        async rereadAttemptCreditSettlement(request: {
          readonly ownerUserId: string
          readonly workspaceId: string
          readonly executionAttemptRef: {
            readonly id: string
            readonly version: number
            readonly contentHash: string
          }
        }) {
          const aggregate = await readPrivateEditAuthorityAggregate({
            localStorageRoot: env.localStorageRoot,
            ownerUserId: request.ownerUserId,
            workspaceId: request.workspaceId,
          })
          const matches = aggregate?.gpuAttemptCreditSettlements.filter(
            (record) => record.schemaVersion ===
                'canonical-sam3_1-vertex-serving-attempt-credit-settlement-v2'
              && record.executionAttemptId ===
                request.executionAttemptRef.id,
          ) ?? []
          if (matches.length > 1) throw new Error(
            'SAM 3.1 serving attempt has duplicate credit settlements.',
          )
          return matches[0] ? structuredClone(matches[0]) : null
        },
      }),
      releaseRepository: sam31CompleteSourceServingReleaseRepository,
    })
  const l4TaskQaAuthenticatedRuntime =
    createCanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntime({
      pricingAuthorityReadPort: pricingAuthorityStore,
      approvedFundingReadPort: fundedStartAuthorityStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      runtimeContextReadPort,
      releaseReadPort: runtimeConfigurationRepository,
      runtimeComposition: l4TaskQaPreparationRuntimeComposition,
      materialRepository: trackAllSam31L4TaskQaMaterialRepository,
      sam31TaskStore: taskStore,
      sam31TaskContextRepository: taskContextRepository,
      sam31ResultStore: sam31RuntimeResultStore,
      sam31CompleteSourceChunkRepository,
      sam31CompleteSourceServingReleaseRepository,
      sam31OutputReadPort: trackAllSam31L4TaskQaSamOutputReadPort,
      supportResumeRepository: specialistSupportResumeRepository,
      lifecycleStore,
      fundedLifecycleStore: lifecycleStore,
    })
  const l4TaskQaQueuedStartRuntime =
    createCanonicalTrackAllSam31L4TaskQaQueuedStartRuntime({
      fundedPreparationRuntime: l4TaskQaAuthenticatedRuntime,
      fundedLifecycleReadPort: lifecycleStore,
      materialRepository: trackAllSam31L4TaskQaMaterialRepository,
      attemptStartReadPort: fundedStartAuthorityStore,
      queueTransactionAdapter: gpuQueueTransactionAdapter,
    })

  return Object.freeze({
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION,
    runtimeMode:
      'vertex_a100_cloud_run_l4_gcs_user_triggered_scale_from_zero' as const,
    skillQualificationRegistryReadPort: Object.freeze({
      schemaVersion: skillQualificationRegistry.schemaVersion,
      evidenceClass: skillQualificationRegistry.evidenceClass,
      readExact: skillQualificationRegistry.readExact.bind(
        skillQualificationRegistry,
      ),
    }),
    trackAllSam31AuthenticatedGpuStartRuntimePort: authenticatedRuntime,
    trackAllSam31AuthenticatedGpuInvocationRuntimePort:
      authenticatedInvocationRuntime,
    trackAllSam31QueuedGpuStartRuntimePort: queuedGpuStartRuntime,
    professionalGpuCloudTaskScheduler,
    professionalGpuCloudTaskConsumer:
      professionalGpuCloudTaskConsumer.consumer,
    sam31VertexServingTerminalAttemptOwner:
      professionalGpuCloudTaskConsumer.terminalAttemptOwner,
    a100CustomerDispatchReadinessReadPort: Object.freeze({
      rereadCurrent:
        currentA100CustomerDispatchReadinessRepository.rereadCurrent.bind(
          currentA100CustomerDispatchReadinessRepository,
        ),
    }),
    a100VertexCustomJobTerminalReadPort,
    sam31A100ResultFinalizationRuntimePort,
    sam31CompleteSourceChunkRepository,
    sam31CompleteSourceChunkCoordinator,
    sam31CurrentServingResultFinalizationRuntimePort,
    sam31VertexServingReconciledWindowCostRepository,
    sam31CompleteSourceServingReleaseRepository,
    sam31CompleteSourceServingReleaseOwner,
    trackAllSam31L4TaskQaAuthenticatedStartRuntimePort:
      l4TaskQaAuthenticatedRuntime,
    trackAllSam31L4TaskQaQueuedStartRuntimePort:
      l4TaskQaQueuedStartRuntime,
    trackAllSam31CaptionEvidenceFinalizationRuntimePort,
    trackAllSam31TaskQaEvidenceFinalizationRuntimePort,
    trackAllSam31TaskQaCandidateRepository,
    specialistSupportResumeRepository,
    captionTrackAllSceneEvidenceRepository,
    captionTrackAllTaskQaRepository,
    captionTrackAllTaskQaOwner,
    captionTrackAllEvidenceRepository,
    captionTrackAllSupportService,
    captionTrackAllEvidenceRequiresAdmittedCanonicalSam31Result: true as const,
    captionTrackAllEvidenceRequiresIndependentTaskLevelMaskQa: true as const,
    captionTrackAllEvidenceRequiresPrivateVisualReview: true as const,
    a100HeavyPrimary: true as const,
    a100PrimaryRequiresQualifiedReleaseAtAdmission: true as const,
    l4HeavyFallbackRequiresSeparateQualifiedReleaseAtAdmission: true as const,
    l4HeavyFallbackQualificationClaimedByComposition: false as const,
    minimumIdleGpuInstances: 0 as const,
    cpuOnlySubstantiveExecutionAllowed: false as const,
    callerGpuRouteModelImageCommandOrPriceAccepted: false as const,
    rawTaskQaMeasurementReviewOrCloudClaimAccepted: false as const,
    canonicalBackendCompilesTaskQaMeasurementFromFixedWorkerEvidence:
      true as const,
    separateSam31InputAndL4TaskQaInvocationRootsRequired: true as const,
    rawCloudLaunchPortExposed: false as const,
    historicalVertexCustomJobCustomerDispatchAllowed: false as const,
    currentA100DedicatedEndpointInvocationMounted: true as const,
    completeSourceSequentialChunkCoordinatorMounted: true as const,
    exactPrivateOutputRereadBeforeNextChunkMounted: true as const,
    durablePostgresQueueMountedBeforeGpuInvocation: true as const,
    userTriggeredCloudTaskSchedulingMounted: true as const,
    authenticatedCloudTaskConsumerMounted: true as const,
    l4RouteAwareCloudTaskConsumerMounted: true as const,
    l4TerminalUsageCostAndZeroActiveGpuReconciliationMounted: true as const,
    l4QueueFinalizationBeforeTerminalCostAndZeroActiveGpuAllowed:
      false as const,
    terminalServingAttemptOwnerMountedBeforeQueueFinalization: true as const,
    completeSourceCostSettlementAndScaleZeroReleaseMounted: true as const,
    perChunkResultMaySelfClaimServingWindowScaleZero: false as const,
    captionTrackAllCurrentServingGroupReleaseRereadMounted: true as const,
    l4QuotaAndActiveCountCapacityMounted: true as const,
    l4FixedTaskPreparedBeforeDurableQueueAdmission: true as const,
    directL4GpuInvocationHttpRouteMounted: false as const,
    directA100InvocationHttpRouteMounted: false as const,
    freshA100PricingUsesVertexServingRateAuthority: true as const,
    historicalA100CustomJobPricingRemainsReadOnly: true as const,
  })
}

function requiredProject(value: string | undefined): typeof PROJECT_ID {
  if (value !== PROJECT_ID) {
    throw new Error('Track All SAM 3.1 requires Google Cloud project reeditpro.')
  }
  return PROJECT_ID
}

function requiredBucket(
  value: string | undefined,
  label: string,
): string {
  if (!value || !/^[a-z0-9][a-z0-9._-]+[a-z0-9]$/u.test(value)) {
    throw new Error(`Track All SAM 3.1 ${label} bucket is unavailable.`)
  }
  return value
}

function requiredServerSetting(
  value: string | undefined,
  label: string,
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Track All SAM 3.1 ${label} is unavailable.`)
  }
  return value.trim()
}
