import { buildSegmentTextBehindSubjectPreviewIamPlan } from './segment-text-behind-iam-plan'
import { segmentTextBehindSubjectPreviewConfig, segmentTextBehindSubjectPreviewDoesNotDo } from './segment-text-behind-subject-preview-policy'
import type { SegmentTextBehindSubjectPreviewCommandPlan } from './segment-text-behind-subject-preview-types'

export function buildSegmentTextBehindSubjectPreviewCommandPlans(runId = 'phase35e-YYYYMMDDTHHMMSS'): SegmentTextBehindSubjectPreviewCommandPlan[] {
  return [
    {
      commandId: 'preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-masks',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-previews',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-qa-artifacts',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-worker-temp',
        `gcloud storage objects describe ${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`,
        `gcloud storage objects describe ${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`,
        `gcloud storage objects describe ${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`,
        `gcloud storage objects describe ${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`,
      ].join(' && '),
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: segmentTextBehindSubjectPreviewDoesNotDo,
      warnings: ['Preflight is read-only and must confirm the exact approved Phase 35D private artifacts.'],
    },
    ...buildSegmentTextBehindSubjectPreviewIamPlan().map((plan): SegmentTextBehindSubjectPreviewCommandPlan => ({
      commandId: plan.bindingId,
      phase: 'iam',
      commandString: plan.commandString,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: segmentTextBehindSubjectPreviewDoesNotDo,
      warnings: ['Use only if a future worker-hosted compositor needs the exact conditional binding; local authenticated execution should not mutate IAM.'],
    })),
    {
      commandId: 'execute-local-segment-preview',
      phase: 'execute',
      commandString: `GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SEGMENT_TEXT_BEHIND_SUBJECT_PREVIEW=true REEDITPRO_PHASE35D_RUN_ID=${segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId} REEDITPRO_PHASE35E_RUN_ID=${runId} REEDITPRO_PHASE35E_TEXT=REEDITPRO PROVIDER_EXECUTION_ENABLED=false PUBLIC_ACCESS_ENABLED=false FULL_VIDEO_TEXT_BEHIND_SUBJECT_ENABLED=false FULL_VIDEO_MASK_ENABLED=false FINAL_EXPORT_ENABLED=false REEDITPRO_PRODUCTION_READY=false REEDITPRO_EXTERNAL_BETA_READY=false REEDITPRO_BROAD_REAL_MEDIA_READY=false npm run activation:segment-text-behind-subject-preview -- --execute`,
      requiresConfirmation: true,
      textOnlyByDefault: true,
      doesNotDo: segmentTextBehindSubjectPreviewDoesNotDo,
      warnings: ['Creates private preview frames and metadata only from the approved Phase 35D short segment.'],
    },
    {
      commandId: 'fetch-private-report',
      phase: 'fetch-report',
      commandString: `gcloud storage cp ${segmentTextBehindSubjectPreviewConfig.outputQaPrefix}${runId}/reports/phase35e-report.json activation-logs/segment-text-behind-subject-preview/phase35e/phase35e-report.json`,
      requiresConfirmation: false,
      textOnlyByDefault: true,
      doesNotDo: segmentTextBehindSubjectPreviewDoesNotDo,
      warnings: ['Do not commit private reports or generated preview media. The committed docs should contain sanitized summaries only.'],
    },
  ]
}
