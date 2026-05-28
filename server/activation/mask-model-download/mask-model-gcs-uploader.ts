import { buildBiRefNetMaskModelStoragePlan } from '../mask-model-approval/mask-model-storage-plan'
import { MASK_MODEL_DOWNLOAD_BUCKET, maskModelDownloadExecutionDoesNotDo } from './mask-model-download-policy'
import type { MaskModelDownloadExecutionCommandPlan } from './mask-model-download-types'

export function buildMaskModelGcsUploadPlan(localDir = '/tmp/reeditpro-mask-model-download/birefnet-main/snapshot'): MaskModelDownloadExecutionCommandPlan {
  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  return {
    commandId: 'mask_model_gcs_upload_birefnet',
    phase: 'upload',
    commandString: `gcloud storage rsync --recursive ${localDir} ${storagePlan.stagingStoragePath}`,
    textOnlyByDefault: true,
    requiresConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD',
    doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
    warnings: ['Upload target must remain private and must not be source-media storage.'],
  }
}

export function validateMaskModelGcsStoragePath(path: string): string[] {
  const blockers: string[] = []
  if (!path.startsWith(`gs://${MASK_MODEL_DOWNLOAD_BUCKET}/model-weights/birefnet/main/`)) {
    blockers.push('Mask model storage path must use the approved generated-assets BiRefNet prefix.')
  }
  if (/source-media/i.test(path)) blockers.push('Mask model storage path must not use source-media bucket.')
  if (/public/i.test(path)) blockers.push('Mask model storage path must not be public.')
  return blockers
}
