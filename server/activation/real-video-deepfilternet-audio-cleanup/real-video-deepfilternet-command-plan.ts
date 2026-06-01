import { buildRealVideoDeepFilterNetIamPlan } from './real-video-deepfilternet-iam-plan'
import { realVideoDeepFilterNetConfig, realVideoDeepFilterNetDoesNotDo } from './real-video-deepfilternet-audio-cleanup-policy'
import type { RealVideoDeepFilterNetCommandPlan } from './real-video-deepfilternet-audio-cleanup-types'

export function buildRealVideoDeepFilterNetCommandPlans(input: { imageDigest?: string; runId?: string } = {}): RealVideoDeepFilterNetCommandPlan[] {
  const imageRef = input.imageDigest
    ? `${realVideoDeepFilterNetConfig.runtimeImageRepository}@${input.imageDigest}`
    : realVideoDeepFilterNetConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase36d-YYYYMMDDTHHMMSS'
  const envVars = [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_REAL_VIDEO_DEEPFILTERNET_AUDIO_CLEANUP=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=real_video_audio_cleanup_sample',
    `REEDITPRO_PHASE36D_RUN_ID=${runId}`,
    `REEDITPRO_PHASE36D_INPUT_VIDEO_GCS_URI=${realVideoDeepFilterNetConfig.approvedInputVideo}`,
    `REEDITPRO_PHASE36D_REFERENCE_AUDIO_GCS_URI=${realVideoDeepFilterNetConfig.referencePhase31Audio}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${realVideoDeepFilterNetConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${realVideoDeepFilterNetConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${realVideoDeepFilterNetConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${realVideoDeepFilterNetConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${realVideoDeepFilterNetConfig.aggregateSha256}`,
    `REEDITPRO_IMAGE_REF=${imageRef}`,
    input.imageDigest ? `REEDITPRO_IMAGE_DIGEST=${input.imageDigest}` : undefined,
    'PROVIDER_EXECUTION_ENABLED=false',
    'MODEL_DOWNLOADS_ENABLED=false',
    'RNNOISE_ENABLED=false',
    'DEMUCS_ENABLED=false',
    'PUBLIC_ACCESS_ENABLED=false',
    'FINAL_DELIVERY_ENABLED=false',
    'REEDITPRO_PRODUCTION_READY=false',
    'REEDITPRO_EXTERNAL_BETA_READY=false',
    'REEDITPRO_BROAD_REAL_MEDIA_READY=false',
  ].filter(Boolean).join(',')

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
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-analysis-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `gcloud storage objects describe ${realVideoDeepFilterNetConfig.approvedInputVideo}`,
        `gcloud storage objects describe ${realVideoDeepFilterNetConfig.referencePhase31Audio}`,
        `gcloud storage objects describe ${realVideoDeepFilterNetConfig.artifactGcsPath}${realVideoDeepFilterNetConfig.cliFileName}`,
        `gcloud storage objects describe ${realVideoDeepFilterNetConfig.artifactGcsPath}${realVideoDeepFilterNetConfig.modelArchiveFileName}`,
        `gcloud storage objects describe ${realVideoDeepFilterNetConfig.artifactGcsPath}model_tree_manifest.json`,
        `gcloud run jobs describe ${realVideoDeepFilterNetConfig.runtimeJobName} --region us-central1 --project reeditpro`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: realVideoDeepFilterNetDoesNotDo,
      warnings: ['Preflight is read-only and must confirm private source/artifact availability.'],
    },
    ...buildRealVideoDeepFilterNetIamPlan().map((plan): RealVideoDeepFilterNetCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoDeepFilterNetDoesNotDo,
      warnings: ['Use only if the exact conditional prefix binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-deepfilternet-runtime-worker && docker buildx build --platform linux/amd64 --provenance=false --sbom=false -f docker/prod/deepfilternet-runtime/Dockerfile -t ${realVideoDeepFilterNetConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoDeepFilterNetDoesNotDo,
      warnings: ['Build only the dedicated DeepFilterNet runtime image; do not bake media or artifacts into the image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${realVideoDeepFilterNetConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${realVideoDeepFilterNetConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoDeepFilterNetDoesNotDo,
      warnings: ['Do not enable providers, RNNoise, Demucs, production, beta, or public access.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${realVideoDeepFilterNetConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: realVideoDeepFilterNetDoesNotDo,
      warnings: ['Execute exactly once for the controlled Phase 32 source only.'],
    },
  ]
}
