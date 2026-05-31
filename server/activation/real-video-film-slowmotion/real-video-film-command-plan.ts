import { buildRealVideoFilmIamPlan } from './real-video-film-iam-plan'
import { buildRealVideoFilmPlanSnapshot } from './real-video-film-plan-snapshot'
import { realVideoFilmSlowmotionConfig, realVideoFilmSlowmotionDoesNotDo } from './real-video-film-slowmotion-policy'
import type { RealVideoFilmSlowmotionCommandPlan } from './real-video-film-slowmotion-types'

export function buildRealVideoFilmCommandPlans(input: { imageDigest?: string; runId?: string; planSnapshotGcsUri?: string } = {}): RealVideoFilmSlowmotionCommandPlan[] {
  const imageRef = input.imageDigest ? `${realVideoFilmSlowmotionConfig.runtimeImageRepository}@${input.imageDigest}` : realVideoFilmSlowmotionConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase38d-YYYYMMDDTHHMMSS'
  const snapshot = buildRealVideoFilmPlanSnapshot(runId)
  const planSnapshotGcsUri = input.planSnapshotGcsUri ?? `${snapshot.artifactPrefixes.generatedAssets}plan/approved-plan-snapshot.json`
  const envVars = buildRealVideoFilmRuntimeEnvVars(runId, imageRef, input.imageDigest, planSnapshotGcsUri)

  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-final-exports',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-previews',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `gcloud storage objects describe ${realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri}`,
        `${filmObjectDescribe('model_tree_manifest.json')}`,
        `gcloud run jobs describe ${realVideoFilmSlowmotionConfig.runtimeJobName} --region us-central1 --project reeditpro`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['Preflight is read-only and must confirm private buckets and exact approved artifacts.'],
    },
    ...buildRealVideoFilmIamPlan().map((plan): RealVideoFilmSlowmotionCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['Use only if the exact conditional prefix binding is missing.'],
    })),
    {
      commandId: 'upload-plan-snapshot',
      phase: 'plan-snapshot',
      commandString: `Create approved-plan-snapshot.json and upload to ${planSnapshotGcsUri}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['Worker executes the approved snapshot; raw prompt execution remains disabled.'],
    },
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-film-runtime-worker && docker buildx build --platform linux/amd64 --provenance=false --sbom=false -f docker/prod/film-runtime/Dockerfile -t ${realVideoFilmSlowmotionConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['Build only the dedicated CPU FILM runtime image; do not bake model artifacts or media into the image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoFilmSlowmotionConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realVideoFilmSlowmotionConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['CPU-only selected real-video sample; full-video interpolation, audio stretch, and final delivery remain blocked.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoFilmSlowmotionConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoFilmSlowmotionDoesNotDo,
      warnings: ['Execution must process exactly one bounded approved Phase 38D segment.'],
    },
  ]
}

export function buildRealVideoFilmRuntimeEnvVars(runId: string, imageRef: string, imageDigest?: string, planSnapshotGcsUri?: string): string {
  return [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_FILM_REAL_VIDEO_SLOWMOTION=true',
    'REEDITPRO_FILM_RUNTIME_MODE=real_video_slowmotion_sample',
    `REEDITPRO_PHASE38D_RUN_ID=${runId}`,
    `REEDITPRO_PHASE38D_PLAN_SNAPSHOT_GCS_URI=${planSnapshotGcsUri ?? ''}`,
    `REEDITPRO_PHASE38D_INPUT_VIDEO_GCS_URI=${realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri}`,
    `REEDITPRO_PHASE38D_SEGMENT_START_SECONDS=${realVideoFilmSlowmotionConfig.segmentStartSeconds}`,
    `REEDITPRO_PHASE38D_SEGMENT_END_SECONDS=${realVideoFilmSlowmotionConfig.segmentEndSeconds}`,
    `REEDITPRO_PHASE38D_SEGMENT_DURATION_SECONDS=${realVideoFilmSlowmotionConfig.segmentDurationSeconds}`,
    `REEDITPRO_PHASE38D_SOURCE_FRAME_FPS=${realVideoFilmSlowmotionConfig.sourceFrameFps}`,
    `REEDITPRO_PHASE38D_SOURCE_FRAME_COUNT=${realVideoFilmSlowmotionConfig.sourceFrameCount}`,
    `REEDITPRO_PHASE38D_MAX_SOURCE_FRAMES=${realVideoFilmSlowmotionConfig.maxSourceFrames}`,
    `REEDITPRO_PHASE38D_FRAME_WIDTH=${realVideoFilmSlowmotionConfig.frameWidth}`,
    `REEDITPRO_PHASE38D_FRAME_HEIGHT=${realVideoFilmSlowmotionConfig.frameHeight}`,
    `REEDITPRO_PHASE38D_OUTPUT_FRAME_COUNT=${realVideoFilmSlowmotionConfig.outputFrameCount}`,
    `REEDITPRO_PHASE38D_MAX_OUTPUT_FRAMES=${realVideoFilmSlowmotionConfig.maxOutputFrames}`,
    `REEDITPRO_FILM_ARTIFACT_GCS_PATH=${realVideoFilmSlowmotionConfig.artifactGcsPath}`,
    `REEDITPRO_FILM_ARTIFACT_RUNTIME_PATH=${realVideoFilmSlowmotionConfig.artifactRuntimePath}`,
    `REEDITPRO_FILM_KERAS_METADATA_SHA256=${realVideoFilmSlowmotionConfig.kerasMetadataSha256}`,
    `REEDITPRO_FILM_SAVED_MODEL_SHA256=${realVideoFilmSlowmotionConfig.savedModelSha256}`,
    `REEDITPRO_FILM_VARIABLES_DATA_SHA256=${realVideoFilmSlowmotionConfig.variablesDataSha256}`,
    `REEDITPRO_FILM_VARIABLES_INDEX_SHA256=${realVideoFilmSlowmotionConfig.variablesIndexSha256}`,
    `REEDITPRO_FILM_AGGREGATE_SHA256=${realVideoFilmSlowmotionConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    imageDigest ? `REEDITPRO_IMAGE_DIGEST=${imageDigest}` : undefined,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'REAL_MEDIA_INPUT_SCOPE=approved_phase38d_short_segment_only',
    'FULL_VIDEO_INTERPOLATION_ENABLED=false',
    'AUDIO_STRETCH_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'REVIDEO_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].filter(Boolean).join(',')
}

function filmObjectDescribe(relativePath: string): string {
  return `gcloud storage objects describe ${realVideoFilmSlowmotionConfig.artifactGcsPath}${relativePath}`
}
