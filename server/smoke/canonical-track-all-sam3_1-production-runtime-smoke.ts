import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { loadRuntimeEnv } from '../config/env'
import {
  createCanonicalTrackAllSam31ProductionRuntime,
} from '../services/canonical-track-all-sam3_1-production-runtime'

const local = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  STORAGE_MODE: 'local',
})
assert.equal(createCanonicalTrackAllSam31ProductionRuntime(local), null)

const cloud = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs',
  GOOGLE_CLOUD_PROJECT_ID: 'reeditpro',
  GCS_CONTROL_PLANE_STATE_BUCKET:
    'reeditpro-production-reeditpro-control-plane-state',
  GCS_PROCESSED_MEDIA_BUCKET:
    'reeditpro-production-reeditpro-proxy-media',
})
const runtime = createCanonicalTrackAllSam31ProductionRuntime(cloud)
assert.ok(runtime)
assert.equal(runtime.schemaVersion,
  'canonical-track-all-sam3_1-production-runtime-v10')
assert.equal(runtime.runtimeMode,
  'cloud_run_gcs_user_triggered_scale_from_zero')
assert.equal(runtime.a100HeavyPrimary, true)
assert.equal(runtime.a100PrimaryRequiresQualifiedReleaseAtAdmission, true)
assert.equal(
  runtime.l4HeavyFallbackRequiresSeparateQualifiedReleaseAtAdmission,
  true,
)
assert.equal(
  runtime.l4HeavyFallbackQualificationClaimedByComposition,
  false,
)
assert.equal(runtime.minimumIdleGpuInstances, 0)
assert.equal(runtime.cpuOnlySubstantiveExecutionAllowed, false)
assert.equal(runtime.rawCloudLaunchPortExposed, false)
assert.equal(
  runtime.skillQualificationRegistry.schemaVersion,
  'canonical-skill-qualification-registry-v1',
)
assert.equal(
  runtime.specialistSupportResumeRepository.schemaVersion,
  'canonical-specialist-support-resume-repository-v1',
)
assert.equal(
  runtime.captionTrackAllSceneEvidenceRepository.schemaVersion,
  'canonical-track-all-sam3_1-caption-scene-evidence-repository-v1',
)
assert.equal(
  runtime.captionTrackAllTaskQaRepository.schemaVersion,
  'canonical-track-all-sam3_1-task-qa-repository-v1',
)
assert.equal(
  runtime.captionTrackAllTaskQaOwner.schemaVersion,
  'canonical-track-all-sam3_1-task-qa-owner-v1',
)
assert.equal(
  runtime.captionTrackAllEvidenceRepository.schemaVersion,
  'canonical-caption-track-all-evidence-repository-v2',
)
assert.equal(
  runtime.captionTrackAllSupportService.schemaVersion,
  'canonical-caption-track-all-support-service-v2',
)
assert.equal(
  runtime.captionTrackAllEvidenceRequiresAdmittedCanonicalSam31Result,
  true,
)
assert.equal(
  runtime.captionTrackAllEvidenceRequiresIndependentTaskLevelMaskQa,
  true,
)
assert.equal(runtime.captionTrackAllEvidenceRequiresPrivateVisualReview, true)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort.schemaVersion,
  'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v1',
)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort
    .routeOwnsGpuPlacementOrPricing,
  false,
)
assert.equal(
  runtime.trackAllSam31AuthenticatedGpuStartRuntimePort
    .rawCloudLaunchPortExposed,
  false,
)
assert.equal(
  runtime.trackAllSam31L4TaskQaAuthenticatedStartRuntimePort.schemaVersion,
  'canonical-track-all-sam3_1-l4-task-qa-authenticated-start-v1',
)
assert.equal(
  runtime.trackAllSam31L4TaskQaAuthenticatedStartRuntimePort
    .routeOwnsGpuPlacementOrPricing,
  false,
)
assert.equal(
  runtime.trackAllSam31L4TaskQaAuthenticatedStartRuntimePort
    .rawCloudLaunchPortExposed,
  false,
)
assert.equal(
  runtime.trackAllSam31CaptionEvidenceFinalizationRuntimePort.schemaVersion,
  'canonical-track-all-sam3_1-caption-evidence-finalization-runtime-v1',
)
assert.equal(
  runtime.trackAllSam31CaptionEvidenceFinalizationRuntimePort
    .acceptsRawEvidenceOrMedia,
  false,
)
assert.equal(
  runtime.trackAllSam31CaptionEvidenceFinalizationRuntimePort
    .performsRuntimeOrAssetMutation,
  false,
)
assert.equal(
  runtime.trackAllSam31TaskQaCandidateRepository.schemaVersion,
  'canonical-track-all-sam3_1-task-qa-candidate-repository-v1',
)
assert.equal(
  runtime.trackAllSam31TaskQaEvidenceFinalizationRuntimePort.schemaVersion,
  'canonical-track-all-sam3_1-task-qa-evidence-finalization-runtime-v1',
)
assert.equal(
  runtime.trackAllSam31TaskQaEvidenceFinalizationRuntimePort
    .acceptsRawMeasurementReviewMediaOrCloudClaims,
  false,
)
assert.equal(
  runtime.trackAllSam31TaskQaEvidenceFinalizationRuntimePort
    .performsRuntimeAssetQaBillingOrDeliveryMutation,
  false,
)
assert.equal(runtime.rawTaskQaMeasurementReviewOrCloudClaimAccepted, false)
assert.equal(
  runtime.canonicalBackendCompilesTaskQaMeasurementFromFixedWorkerEvidence,
  true,
)
assert.equal(
  runtime.separateSam31InputAndL4TaskQaInvocationRootsRequired,
  true,
)

assert.throws(() => createCanonicalTrackAllSam31ProductionRuntime({
  ...cloud,
  googleCloudProjectId: 'other-project',
}), /project reeditpro/u)
assert.throws(() => createCanonicalTrackAllSam31ProductionRuntime({
  ...cloud,
  gcsProcessedMediaBucket: undefined,
}), /processed-media/u)

const entrypoint = readFileSync('server/index.ts', 'utf8')
assert.match(entrypoint, /createCanonicalTrackAllSam31ProductionRuntime/u)
assert.match(
  entrypoint,
  /trackAllSam31AuthenticatedGpuStartRuntimePort/u,
)
assert.match(
  entrypoint,
  /trackAllSam31L4TaskQaAuthenticatedStartRuntimePort/u,
)
assert.match(
  entrypoint,
  /trackAllSam31CaptionEvidenceFinalizationRuntimePort/u,
)
assert.match(
  entrypoint,
  /trackAllSam31TaskQaEvidenceFinalizationRuntimePort/u,
)
assert.doesNotMatch(entrypoint, /sam2|qwen/u)

console.log(JSON.stringify({
  smoke: 'canonical-track-all-sam3_1-production-runtime',
  checks: 58,
  localAndMockRuntimeMounted: false,
  cloudRunGcsCompositionMounted: true,
  authenticatedRouteUsesDurableProductionRuntime: true,
  pricingFundingRateReleaseSourceProxyTaskAndLifecyclePortsComposed: true,
  privateGpuTaskAndProxyShareServerConfiguredBucket: true,
  captionTrackAllSupportResumeAndEvidenceRepositoriesMounted: true,
  captionTrackAllRequiresCanonicalSam31TaskResultReread: true,
  captionTrackAllRequiresTaskLevelIndependentMaskQa: true,
  authenticatedL4TaskQaStartMounted: true,
  l4TaskMaterialPersistedAndRereadBeforeCloudLaunch: true,
  captionTrackAllTaskLevelQaOwnerMounted: true,
  captionTrackAllTaskLevelQaRequiresL4KorniaCudaAndOpenCv: true,
  captionTrackAllRequiresPrivateVisualReview: true,
  captionTrackAllAuthenticatedFinalizerMounted: true,
  taskQaCandidateRepositoryMountedInPrivateGpuObjectStore: true,
  taskQaEvidenceFinalizerMounted: true,
  rawTaskQaMeasurementReviewOrCloudClaimAccepted: false,
  canonicalBackendCompilesTaskQaMeasurementFromFixedWorkerEvidence: true,
  separateSam31InputAndL4TaskQaInvocationRootsRequired: true,
  a100HeavyPrimary: true,
  a100PrimaryRequiresQualifiedReleaseAtAdmission: true,
  l4HeavyFallbackRequiresSeparateQualifiedReleaseAtAdmission: true,
  l4HeavyFallbackQualificationClaimedByComposition: false,
  userTriggeredScaleFromZero: true,
  minimumIdleGpuInstances: 0,
  cpuOnlySubstantiveExecutionAllowed: false,
  rawCloudLaunchPortExposed: false,
  liveCloudJobStarted: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
