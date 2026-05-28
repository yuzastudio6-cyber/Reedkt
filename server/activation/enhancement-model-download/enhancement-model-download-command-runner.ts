import { buildEnhancementModelDownloadCommandPlan } from '../enhancement-model-approval/enhancement-model-download-command-plan'
import { buildRealEsrganEnhancementModelStoragePlan } from '../enhancement-model-approval/enhancement-model-storage-plan'
import {
  APPROVED_ENHANCEMENT_MODEL_FILE,
  APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
  ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR,
  ENHANCEMENT_MODEL_DOWNLOAD_LOG_DIR,
  ENHANCEMENT_MODEL_DOWNLOAD_TEMP_ROOT,
  enhancementModelDownloadExecutionDoesNotDo,
} from './enhancement-model-download-policy'
import type { EnhancementModelDownloadExecutionCommandPlan } from './enhancement-model-download-types'

export function buildEnhancementModelDownloadExecutionCommandPlans(): EnhancementModelDownloadExecutionCommandPlan[] {
  const storagePlan = buildRealEsrganEnhancementModelStoragePlan()
  return [
    {
      commandId: 'enhancement_model_download_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
      ].join(' && '),
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Read-only preflight commands; do not proceed unless project/env guards pass.'],
    },
    {
      commandId: 'enhancement_model_download_real_esrgan_x4plus_release_asset',
      phase: 'download',
      commandString: [
        'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD=true',
        'curl -fL',
        `-o ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR}/${APPROVED_ENHANCEMENT_MODEL_FILE}`,
        APPROVED_ENHANCEMENT_MODEL_SOURCE_URL,
      ].join(' '),
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD',
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Execute only in Phase 34B after preflight; temp path is outside repo.'],
    },
    {
      commandId: 'enhancement_model_download_inspect_file',
      phase: 'inspect',
      commandString: `find ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR} -maxdepth 1 -type f | sort > ${ENHANCEMENT_MODEL_DOWNLOAD_LOG_DIR}/downloaded-files.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Inspect files only; do not execute or import the downloaded .pth file.'],
    },
    {
      commandId: 'enhancement_model_download_checksums',
      phase: 'checksum',
      commandString: `cd ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR} && shasum -a 256 ${APPROVED_ENHANCEMENT_MODEL_FILE} > file_checksums_sha256.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Checksum output must use sanitized relative paths in tracked reports.'],
    },
    {
      commandId: 'enhancement_model_download_upload_to_gcs',
      phase: 'upload',
      commandString: `gcloud storage cp ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR}/${APPROVED_ENHANCEMENT_MODEL_FILE} ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR}/file_checksums_sha256.txt ${ENHANCEMENT_MODEL_DOWNLOAD_LOCAL_DIR}/model_tree_manifest.json ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_ENHANCEMENT_MODEL_DOWNLOAD',
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Upload only to the private generated-assets Real-ESRGAN x4plus model-weight prefix.'],
    },
    {
      commandId: 'enhancement_model_download_verify_gcs',
      phase: 'verify',
      commandString: `gcloud storage ls --recursive ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Verification is read-only and must not create signed URLs.'],
    },
    {
      commandId: 'enhancement_model_download_cleanup_temp',
      phase: 'cleanup',
      commandString: `rm -rf ${ENHANCEMENT_MODEL_DOWNLOAD_TEMP_ROOT}/real-esrgan-x4plus`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...enhancementModelDownloadExecutionDoesNotDo],
      warnings: ['Remove local temp model files after upload; keep local logs.'],
    },
  ]
}

export function buildStaticEnhancementModelDownloadCommandPlans() {
  return buildEnhancementModelDownloadCommandPlan(buildRealEsrganEnhancementModelStoragePlan())
}
