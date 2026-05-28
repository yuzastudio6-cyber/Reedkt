import type {
  EnhancementModelDownloadCommandPlan,
  EnhancementModelStoragePlan,
} from './enhancement-model-approval-types'

export const enhancementModelDownloadDoesNotDo = [
  'does not execute by default',
  'does not download model files in Phase 34A',
  'does not store model files in the repo',
  'does not print tokens',
  'does not call providers',
  'does not deploy or run GPU jobs',
  'does not process frames or video',
  'does not run enhancement or slow motion',
  'does not download FILM or any non-Real-ESRGAN model',
  'does not create public buckets or signed URL source of truth',
  'does not unblock production, external beta, paid production, or broad real-user-media testing',
]

export function buildEnhancementModelDownloadCommandPlan(storagePlan: EnhancementModelStoragePlan): EnhancementModelDownloadCommandPlan[] {
  return [
    {
      commandId: 'future_download_real_esrgan_x4plus_release_asset',
      modelCandidateId: 'xinntao_real_esrgan_x4plus',
      commandString: [
        'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD=true wget',
        'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
        `-P ${storagePlan.runtimeTempPath}`,
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...enhancementModelDownloadDoesNotDo],
      warnings: [
        'Text-only future command. Do not run in Phase 34A.',
        `Future upload/sync target is ${storagePlan.stagingStoragePath}.`,
        'Phase 34B must compute checksum evidence before runtime verification.',
      ],
    },
    {
      commandId: 'future_upload_real_esrgan_x4plus_to_private_gcs',
      modelCandidateId: 'xinntao_real_esrgan_x4plus',
      commandString: [
        'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD=true gcloud storage cp',
        `${storagePlan.runtimeTempPath}/RealESRGAN_x4plus.pth`,
        storagePlan.stagingStoragePath,
      ].join(' '),
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...enhancementModelDownloadDoesNotDo],
      warnings: [
        'Text-only future upload command. Do not run in Phase 34A.',
        'Future Phase 34B must verify private GCS storage, object metadata, and bucket non-public posture.',
      ],
    },
    {
      commandId: 'blocked_future_film_google_drive_download',
      modelCandidateId: 'google_research_film',
      commandString: 'BLOCKED in Phase 34A: FILM pre-trained TF2 Saved Models are downloaded separately from Google Drive per the official repo and require separate approval.',
      executionMode: 'text_only',
      requiresFutureExecutionFlag: true,
      futureExecutionFlag: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_WEIGHT_DOWNLOAD',
      safeToRunNow: false,
      doesNotDo: [...enhancementModelDownloadDoesNotDo],
      warnings: [
        'FILM is evaluated-only and download-blocked in Phase 34A.',
        `Future evaluated storage path, not approved now: ${storagePlan.filmFutureStoragePath}.`,
      ],
    },
  ]
}
