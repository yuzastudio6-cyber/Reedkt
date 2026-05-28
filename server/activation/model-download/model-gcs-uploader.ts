import { buildFasterWhisperTinyStoragePlan } from '../model-approval/model-storage-plan'
import { MODEL_DOWNLOAD_BUCKET, modelDownloadExecutionDoesNotDo } from './model-download-policy'
import type { ModelDownloadExecutionCommandPlan } from './model-download-types'

export function buildModelGcsUploadPlan(localDir = '/tmp/reeditpro-model-download/faster-whisper-tiny/snapshot'): ModelDownloadExecutionCommandPlan {
  const storagePlan = buildFasterWhisperTinyStoragePlan()
  return {
    commandId: 'model_gcs_upload_faster_whisper_tiny',
    phase: 'upload',
    commandString: `gcloud storage rsync --recursive ${localDir} ${storagePlan.stagingStoragePath}`,
    textOnlyByDefault: true,
    requiresConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD',
    doesNotDo: [...modelDownloadExecutionDoesNotDo],
    warnings: ['Upload target must remain private and must not be source-media storage.'],
  }
}

export function validateModelGcsStoragePath(path: string): string[] {
  const blockers: string[] = []
  if (!path.startsWith(`gs://${MODEL_DOWNLOAD_BUCKET}/model-weights/faster-whisper/tiny/`)) {
    blockers.push('Model storage path must use the approved generated-assets faster-whisper tiny prefix.')
  }
  if (/source-media/i.test(path)) blockers.push('Model storage path must not use source-media bucket.')
  if (/public/i.test(path)) blockers.push('Model storage path must not be public.')
  return blockers
}
