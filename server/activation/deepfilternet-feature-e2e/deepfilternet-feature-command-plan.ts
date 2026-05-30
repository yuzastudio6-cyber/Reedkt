import { buildDeepFilterNetFeatureE2EIamPlan } from './deepfilternet-feature-iam-plan'
import { deepFilterNetFeatureE2EConfig, deepFilterNetFeatureE2EDoesNotDo } from './deepfilternet-feature-e2e-policy'
import type { DeepFilterNetFeatureE2ECommandPlan } from './deepfilternet-feature-e2e-types'

export function buildDeepFilterNetFeatureE2ECommandPlans(input: { imageDigest?: string; runId?: string } = {}): DeepFilterNetFeatureE2ECommandPlan[] {
  const imageRef = input.imageDigest
    ? `${deepFilterNetFeatureE2EConfig.runtimeImageRepository}@${input.imageDigest}`
    : deepFilterNetFeatureE2EConfig.runtimeTargetImage
  const runId = input.runId ?? 'phase36e-YYYYMMDDTHHMMSS'
  const envVars = [
    'REEDITPRO_ENV=staging',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_AUDIO_FEATURE_E2E=true',
    'REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=audio_feature_e2e',
    `REEDITPRO_PHASE36E_RUN_ID=${runId}`,
    `REEDITPRO_PHASE36E_INPUT_VIDEO_GCS_URI=${deepFilterNetFeatureE2EConfig.approvedInputVideo}`,
    `REEDITPRO_PHASE36E_REFERENCE_AUDIO_GCS_URI=${deepFilterNetFeatureE2EConfig.referencePhase31Audio}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_GCS_PATH=${deepFilterNetFeatureE2EConfig.artifactGcsPath}`,
    `REEDITPRO_DEEPFILTERNET_ARTIFACT_RUNTIME_PATH=${deepFilterNetFeatureE2EConfig.artifactRuntimePath}`,
    `REEDITPRO_DEEPFILTERNET_CLI_SHA256=${deepFilterNetFeatureE2EConfig.cliSha256}`,
    `REEDITPRO_DEEPFILTERNET_MODEL_ARCHIVE_SHA256=${deepFilterNetFeatureE2EConfig.modelArchiveSha256}`,
    `REEDITPRO_DEEPFILTERNET_AGGREGATE_SHA256=${deepFilterNetFeatureE2EConfig.aggregateSha256}`,
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
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.approvedInputVideo}`,
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.referencePhase31Audio}`,
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.artifactGcsPath}${deepFilterNetFeatureE2EConfig.cliFileName}`,
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.artifactGcsPath}${deepFilterNetFeatureE2EConfig.modelArchiveFileName}`,
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.artifactGcsPath}model_tree_manifest.json`,
        `gcloud storage objects describe ${deepFilterNetFeatureE2EConfig.phase36DReportUri}`,
        `gcloud run jobs describe ${deepFilterNetFeatureE2EConfig.runtimeJobName} --region us-central1 --project reeditpro`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetFeatureE2EDoesNotDo,
      warnings: ['Preflight is read-only and must confirm private source/artifact availability.'],
    },
    ...buildDeepFilterNetFeatureE2EIamPlan().map((plan): DeepFilterNetFeatureE2ECommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetFeatureE2EDoesNotDo,
      warnings: ['Use only if the exact conditional prefix binding is missing.'],
    })),
    {
      commandId: 'build-push-image',
      phase: 'build',
      commandString: `npm run build:staging-deepfilternet-runtime-worker && docker buildx build --platform linux/amd64 --provenance=false --sbom=false -f docker/prod/deepfilternet-runtime/Dockerfile -t ${deepFilterNetFeatureE2EConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetFeatureE2EDoesNotDo,
      warnings: ['Build only the dedicated DeepFilterNet runtime image; do not bake media or artifacts into the image.'],
    },
    {
      commandId: 'deploy-job',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${deepFilterNetFeatureE2EConfig.runtimeJobName} --project reeditpro --region us-central1 --image ${imageRef} --service-account ${deepFilterNetFeatureE2EConfig.serviceAccountEmail} --cpu=4 --memory=8Gi --parallelism=1 --max-retries=0 --set-env-vars ${envVars}`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetFeatureE2EDoesNotDo,
      warnings: ['Do not enable providers, RNNoise, Demucs, production, beta, or public access.'],
    },
    {
      commandId: 'execute-job',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${deepFilterNetFeatureE2EConfig.runtimeJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: deepFilterNetFeatureE2EDoesNotDo,
      warnings: ['Execute exactly once for the controlled Phase 32 source only.'],
    },
  ]
}
