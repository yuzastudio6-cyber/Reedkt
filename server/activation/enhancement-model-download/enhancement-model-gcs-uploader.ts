import { buildRealEsrganEnhancementModelStoragePlan } from '../enhancement-model-approval/enhancement-model-storage-plan'
import {
  ENHANCEMENT_MODEL_DOWNLOAD_BUCKET,
  ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR,
  enhancementModelDownloadExecutionDoesNotDo,
} from './enhancement-model-download-policy'
import type { EnhancementModelDownloadExecutionCommandPlan } from './enhancement-model-download-types'

export function buildEnhancementModelGcsUploadPlan(localDir = ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR): EnhancementModelDownloadExecutionCommandPlan {
  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  return {
    commandId: 'enhancement_model_gcs_upload_real_esrgan_x4plus',
    phase: 'upload',
    commandString: `gcloud storage cp ${localDir}/RealESRGAN_x4plus.pth ${localDir}/file_checksums_sha256.txt ${localDir}/model_tree_manifest.json ${storagePlan.stagingStoragePath}`,
    textOnlyByDefault: true,
    requiresConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD',
    doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
    warnings: ['Upload target must remain private and must not be source-media storage.'],
  }
}

export function validateEnhancementModelGcsStoragePath(path: string): string[] {
  const blockers: string[] = []
  if (!path.startsWith(`gs://${ENHANCEMENT_MODEL_DOWNLOAD_BUCKET}/model-weights/real-esrgan/x4plus/`)) {
    blockers.push('Enhancement model storage path must use the approved generated-assets Real-ESRGAN x4plus prefix.')
  }
  if (/source-media/i.test(path)) blockers.push('Enhancement model storage path must not use source-media bucket.')
  if (/public/i.test(path)) blockers.push('Enhancement model storage path must not be public.')
  return blockers
}
