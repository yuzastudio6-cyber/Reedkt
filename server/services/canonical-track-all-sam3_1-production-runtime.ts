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
  createCanonicalTrackAllSam31AuthenticatedGpuStartRuntime,
  type CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
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

export const CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-production-runtime-v11' as const

const PROJECT_ID = 'reeditpro' as const

export interface CanonicalTrackAllSam31ProductionRuntime {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION
  readonly runtimeMode: 'cloud_run_gcs_user_triggered_scale_from_zero'
  readonly skillQualificationRegistryReadPort:
    CanonicalSkillQualificationRegistryReadPort
  readonly trackAllSam31AuthenticatedGpuStartRuntimePort:
    CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
  readonly trackAllSam31L4TaskQaAuthenticatedStartRuntimePort:
    CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort
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
      sceneQaAuthorityReadPort: captionTrackAllTaskQaRepository,
      sceneEvidenceRepository: captionTrackAllSceneEvidenceRepository,
      evidenceRepository: captionTrackAllEvidenceRepository,
    })
  const trackAllSam31CaptionEvidenceFinalizationRuntimePort =
    createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime({
      taskQaOwner: captionTrackAllTaskQaOwner,
      supportService: captionTrackAllSupportService,
    })
  const rawCloudLaunchPort = createGoogleCloudProfessionalGpuJobLaunchPort({
    releaseReadPort: runtimeConfigurationRepository,
    privateObjectTransportReadPort: runtimeConfigurationRepository,
  })
  const runtimeComposition = createCanonicalSam31FundedGpuRuntimeComposition({
    taskContextRepository,
    approvedTaskMaterialSourceReadPort:
      approvedTaskMaterialSourceRepository,
    releasePairReadPort: releasePairRegistry,
    rateAuthorityReadPort: currentRateAuthorityRepository,
    privateInputStagingPort,
    taskStore,
    rawCloudLaunchPort,
  })
  const l4TaskQaRuntimeComposition =
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
      currentRateAuthorityRepository.rereadApprovedCurrentRate.bind(
        currentRateAuthorityRepository,
      ),
  })
  const authenticatedRuntime =
    createCanonicalTrackAllSam31AuthenticatedGpuStartRuntime({
      pricingAuthorityReadPort: pricingAuthorityStore,
      approvedFundingReadPort: fundedStartAuthorityStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      runtimeContextReadPort,
      releaseReadPort: runtimeConfigurationRepository,
      runtimeComposition,
      lifecycleStore,
      fundedLifecycleStore: lifecycleStore,
    })
  const l4TaskQaAuthenticatedRuntime =
    createCanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntime({
      pricingAuthorityReadPort: pricingAuthorityStore,
      approvedFundingReadPort: fundedStartAuthorityStore,
      attemptStartReadPort: fundedStartAuthorityStore,
      runtimeContextReadPort,
      releaseReadPort: runtimeConfigurationRepository,
      runtimeComposition: l4TaskQaRuntimeComposition,
      materialRepository: trackAllSam31L4TaskQaMaterialRepository,
      sam31TaskStore: taskStore,
      sam31TaskContextRepository: taskContextRepository,
      sam31ResultStore: sam31RuntimeResultStore,
      sam31OutputReadPort: trackAllSam31L4TaskQaSamOutputReadPort,
      supportResumeRepository: specialistSupportResumeRepository,
      lifecycleStore,
      fundedLifecycleStore: lifecycleStore,
    })

  return Object.freeze({
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_PRODUCTION_RUNTIME_VERSION,
    runtimeMode: 'cloud_run_gcs_user_triggered_scale_from_zero' as const,
    skillQualificationRegistryReadPort: Object.freeze({
      schemaVersion: skillQualificationRegistry.schemaVersion,
      evidenceClass: skillQualificationRegistry.evidenceClass,
      readExact: skillQualificationRegistry.readExact.bind(
        skillQualificationRegistry,
      ),
    }),
    trackAllSam31AuthenticatedGpuStartRuntimePort: authenticatedRuntime,
    trackAllSam31L4TaskQaAuthenticatedStartRuntimePort:
      l4TaskQaAuthenticatedRuntime,
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
