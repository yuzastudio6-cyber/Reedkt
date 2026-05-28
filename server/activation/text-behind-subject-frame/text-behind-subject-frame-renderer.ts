import { resolveTextBehindSubjectFrameArtifacts } from './text-behind-subject-frame-source-resolver'
import { textBehindSubjectFrameConfig } from './text-behind-subject-frame-policy'
import { buildTextBehindSubjectFrameIamCommandPlans } from './text-behind-subject-frame-iam-plan'
import type { TextBehindSubjectFrameCommandPlan } from './text-behind-subject-frame-types'

export function buildTextBehindSubjectFrameCommandPlans(runId = 'phase33e-pending', imageDigest = '<digest-pinned-render-image>'): TextBehindSubjectFrameCommandPlan[] {
  const artifacts = resolveTextBehindSubjectFrameArtifacts(runId)
  return [
    {
      commandId: 'preflight-text-behind-subject-frame',
      phase: 'preflight',
      commandString: 'gcloud auth list && gcloud config get-value project && gcloud run jobs describe reeditpro-staging-render-job --region us-central1 --project reeditpro && gcloud storage objects describe <phase33d-frame-mask-cutout>',
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Stop unless the active project is reeditpro and Phase 33D inputs exist privately.'],
    },
    ...buildTextBehindSubjectFrameIamCommandPlans(),
    {
      commandId: 'build-render-worker-phase33e',
      phase: 'build',
      commandString: `npm run build:staging-real-video-export-worker && docker buildx build --platform linux/amd64 -f docker/prod/render-worker/Dockerfile -t ${textBehindSubjectFrameConfig.renderTargetImage} --push .`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Build only the render worker image; no GPU image is built.'],
    },
    {
      commandId: 'deploy-render-worker-phase33e',
      phase: 'deploy',
      commandString: `gcloud run jobs deploy ${textBehindSubjectFrameConfig.renderJobName} --project reeditpro --region us-central1 --image ${imageDigest} --service-account ${textBehindSubjectFrameConfig.renderServiceAccountEmail} --command node --args dist-staging-real-video-export-worker/staging-real-video-export-worker-cli.js --cpu=2 --memory=4Gi --parallelism=1 --max-retries=0 --task-timeout=15m --set-env-vars GCP_PROJECT_ID=reeditpro,GCP_REGION=us-central1,REEDITPRO_ENV=staging,REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW=true,REEDITPRO_PHASE33E_MODE=text_behind_subject_frame_preview,REEDITPRO_PHASE33D_RUN_ID=phase33d-20260528T161056,REEDITPRO_PHASE33E_RUN_ID=${runId},REEDITPRO_PHASE33E_TEXT=REEDITPRO,REEDITPRO_PHASE33E_FRAME_GCS_URI=${textBehindSubjectFrameConfig.representativeFrameGcsUri},REEDITPRO_PHASE33E_MASK_GCS_URI=${textBehindSubjectFrameConfig.maskGcsUri},REEDITPRO_PHASE33E_CUTOUT_GCS_URI=${textBehindSubjectFrameConfig.cutoutGcsUri},PROVIDER_EXECUTION_ENABLED=false,MODEL_DOWNLOADS_ENABLED=false,REEDITPRO_PRODUCTION_READY=false`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['No GPU, providers, model downloads, public URL, Revideo, or video render.'],
    },
    {
      commandId: 'execute-render-worker-phase33e',
      phase: 'execute',
      commandString: `gcloud run jobs execute ${textBehindSubjectFrameConfig.renderJobName} --region us-central1 --project reeditpro --wait`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      warnings: ['Creates a single private PNG preview only.'],
    },
    {
      commandId: 'fetch-phase33e-report',
      phase: 'fetch-report',
      commandString: `gcloud storage cp ${artifacts.phase33eReport} activation-logs/text-behind-subject-frame/phase33e/phase33e-report.json`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      warnings: ['Do not fetch or commit preview image artifacts by default.'],
    },
  ]
}
