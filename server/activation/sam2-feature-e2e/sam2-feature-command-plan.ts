import { buildSam2FeatureE2EIamPlan } from './sam2-feature-iam-plan'
import { sam2FeatureE2EConfig, sam2FeatureE2EDoesNotDo } from './sam2-feature-e2e-policy'
import type { Sam2FeatureCommandPlan } from './sam2-feature-e2e-types'

export function buildSam2FeatureE2ECommandPlans(runId = 'phase35f-YYYYMMDDTHHMMSS'): Sam2FeatureCommandPlan[] {
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.sourceMediaBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.finalExportsBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.generatedAssetsBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.masksBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.previewsBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.qaBucket}`,
        `gcloud storage buckets describe gs://${sam2FeatureE2EConfig.workerTempBucket}`,
        `gcloud storage objects describe ${sam2FeatureE2EConfig.approvedGcsSource}`,
        `gcloud storage objects describe ${sam2FeatureE2EConfig.approvedPreviewSource}`,
        `gcloud storage objects describe ${sam2FeatureE2EConfig.modelGcsPath}${sam2FeatureE2EConfig.checkpointFileName}`,
        `gcloud storage objects describe ${sam2FeatureE2EConfig.modelGcsPath}${sam2FeatureE2EConfig.configFileName}`,
        `gcloud storage objects describe ${sam2FeatureE2EConfig.modelGcsPath}model_tree_manifest.json`,
        `gcloud run jobs describe ${sam2FeatureE2EConfig.runtimeJobName} --region ${sam2FeatureE2EConfig.region} --project ${sam2FeatureE2EConfig.projectId}`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: sam2FeatureE2EDoesNotDo,
      warnings: ['Preflight is read-only and must confirm the exact approved private GCS objects and Cloud Run job.'],
    },
    ...buildSam2FeatureE2EIamPlan().map((plan): Sam2FeatureCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2FeatureE2EDoesNotDo,
      warnings: ['Use only if missing; binding is prefix-scoped and must not include public principals or broad storage roles.'],
    })),
    {
      commandId: 'build-push-runtime-image',
      phase: 'build',
      commandString: `npm run build:staging-sam2-runtime-worker && docker buildx build --platform linux/amd64 --provenance=false --sbom=false -f docker/prod/sam2-runtime/Dockerfile -t ${sam2FeatureE2EConfig.runtimeTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2FeatureE2EDoesNotDo,
      warnings: ['Builds a dedicated bounded SAM2 runtime image without model weights or provider code.'],
    },
    {
      commandId: 'execute-sam2-feature-e2e',
      phase: 'execute',
      commandString: `GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true REEDITPRO_PHASE35F_RUN_ID=${runId} PROVIDER_EXECUTION_ENABLED=false PUBLIC_ACCESS_ENABLED=false FULL_VIDEO_MASK_ENABLED=false FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED=false FINAL_EXPORT_ENABLED=false REAL_ESRGAN_EXECUTION_ENABLED=false REEDITPRO_PRODUCTION_READY=false REEDITPRO_EXTERNAL_BETA_READY=false REEDITPRO_PAID_PRODUCTION_READY=false REEDITPRO_BROAD_REAL_MEDIA_READY=false npm run activation:sam2-feature-e2e -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: sam2FeatureE2EDoesNotDo,
      warnings: ['Executes one private bounded SAM2 feature E2E gate only.'],
    },
    {
      commandId: 'fetch-private-report',
      phase: 'fetch-report',
      commandString: `gcloud storage cp gs://${sam2FeatureE2EConfig.qaBucket}/activation-real-video/phase35f/${runId}/reports/phase35f-report.json activation-logs/sam2-feature-e2e/phase35f/phase35f-report.json`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: sam2FeatureE2EDoesNotDo,
      warnings: ['Do not commit private reports or generated media; committed docs should contain sanitized summaries only.'],
    },
  ]
}
