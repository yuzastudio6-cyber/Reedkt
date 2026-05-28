import { speechRuntimeConfig, speechRuntimeDoesNotDo } from './speech-runtime-policy'
import type { SpeechRuntimeCommandPlan } from './speech-runtime-types'

export function buildSpeechRuntimeCommandPlans(imageDigest = '<digest-after-build>'): SpeechRuntimeCommandPlan[] {
  const digestImage = imageDigest.startsWith('sha256:')
    ? speechRuntimeConfig.targetImage.replace(`:${speechRuntimeConfig.imageTag}`, `@${imageDigest}`)
    : `<digest-pinned-${speechRuntimeConfig.targetImage}>`
  const condition = [
    'expression=resource.name.startsWith("projects/_/buckets/reeditpro-staging-reeditpro-generated-assets/objects/model-weights/faster-whisper/tiny/")',
    'title=phase27a_faster_whisper_tiny_read',
    'description=Read approved faster-whisper tiny model objects only',
  ].join(',')

  return [
    plan('preflight', 'preflight', 'docker --version && docker buildx version && gcloud config get-value project && gcloud auth list && gcloud storage ls gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/file_checksums_sha256.txt'),
    plan('build-worker', 'build', 'npm run build:staging-speech-runtime-worker'),
    plan('build-push-image', 'build', `docker buildx build --platform linux/amd64 -f docker/prod/speech-worker/Dockerfile -t ${speechRuntimeConfig.targetImage} --push .`),
    plan('verify-image', 'verify', `docker buildx imagetools inspect ${speechRuntimeConfig.targetImage}`),
    plan('iam-model-read', 'iam', `gcloud storage buckets add-iam-policy-binding gs://reeditpro-staging-reeditpro-generated-assets --member=serviceAccount:${speechRuntimeConfig.serviceAccountEmail} --role=roles/storage.objectViewer --condition='${condition}'`),
    plan('deploy-job', 'deploy', [
      `gcloud run jobs deploy ${speechRuntimeConfig.jobName}`,
      `--project=${speechRuntimeConfig.projectId}`,
      `--region=${speechRuntimeConfig.region}`,
      `--image=${digestImage}`,
      `--service-account=${speechRuntimeConfig.serviceAccountEmail}`,
      '--cpu=2 --memory=4Gi --tasks=1 --parallelism=1 --max-retries=0',
      '--set-env-vars=REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME=true,REEDITPRO_STAGING_SPEECH_RUNTIME=true,REEDITPRO_APPROVED_MODEL_ID=faster_whisper_tiny_staging_v1,REEDITPRO_MODEL_GCS_PATH=gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/,REEDITPRO_MODEL_RUNTIME_PATH=/tmp/reeditpro-model-weights/faster-whisper/tiny,REEDITPRO_MODEL_EXPECTED_SHA256=331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5,PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,HF_HUB_OFFLINE=1',
    ].join(' ')),
    plan('execute-job', 'execute', `gcloud run jobs execute ${speechRuntimeConfig.jobName} --region ${speechRuntimeConfig.region} --project ${speechRuntimeConfig.projectId} --wait`),
  ]
}

function plan(commandId: string, phase: SpeechRuntimeCommandPlan['phase'], commandString: string): SpeechRuntimeCommandPlan {
  return {
    commandId,
    phase,
    commandString,
    requiresConfirmation: phase !== 'preflight' && phase !== 'verify',
    confirmationEnvVar: phase !== 'preflight' && phase !== 'verify' ? 'REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME' : undefined,
    doesNotDo: [...speechRuntimeDoesNotDo],
    warnings: phase === 'iam'
      ? ['Stop if conditional bucket IAM is rejected; do not grant broad access without review.']
      : ['Phase 27A only verifies generated-audio CPU speech runtime.'],
  }
}
