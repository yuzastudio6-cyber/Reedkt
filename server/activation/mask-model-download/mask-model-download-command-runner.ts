import { buildMaskModelDownloadCommandPlan } from '../mask-model-approval/mask-model-download-command-plan'
import { buildBiRefNetMaskModelStoragePlan } from '../mask-model-approval/mask-model-storage-plan'
import {
  APPROVED_MASK_MODEL_REPO_ID,
  MASK_MODEL_DOWNLOAD_LOCAL_DIR,
  MASK_MODEL_DOWNLOAD_LOG_DIR,
  MASK_MODEL_DOWNLOAD_TEMP_ROOT,
  MASK_MODEL_DOWNLOAD_VENV_DIR,
  maskModelDownloadExecutionDoesNotDo,
} from './mask-model-download-policy'
import type { MaskModelDownloadExecutionCommandPlan } from './mask-model-download-types'

export function buildMaskModelDownloadExecutionCommandPlans(): MaskModelDownloadExecutionCommandPlan[] {
  const storagePlan = buildBiRefNetMaskModelStoragePlan()
  return [
    {
      commandId: 'mask_model_download_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
      ].join(' && '),
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Read-only preflight commands; do not proceed unless project/env guards pass.'],
    },
    {
      commandId: 'mask_model_download_hf_snapshot',
      phase: 'download',
      commandString: [
        'REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD=true',
        `${MASK_MODEL_DOWNLOAD_VENV_DIR}/bin/python -c`,
        `"from huggingface_hub import snapshot_download; snapshot_download(repo_id='${APPROVED_MASK_MODEL_REPO_ID}', local_dir='${MASK_MODEL_DOWNLOAD_LOCAL_DIR}', local_dir_use_symlinks=False)"`,
      ].join(' '),
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD',
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Execute only in Phase 33B after preflight; temp path is outside repo.'],
    },
    {
      commandId: 'mask_model_download_inspect_tree',
      phase: 'inspect',
      commandString: `find ${MASK_MODEL_DOWNLOAD_LOCAL_DIR} -type f | sort > ${MASK_MODEL_DOWNLOAD_LOG_DIR}/downloaded-files.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Inspect files only; do not execute downloaded code.'],
    },
    {
      commandId: 'mask_model_download_checksums',
      phase: 'checksum',
      commandString: `find ${MASK_MODEL_DOWNLOAD_LOCAL_DIR} -type f -print0 | sort -z | xargs -0 shasum -a 256 > ${MASK_MODEL_DOWNLOAD_LOG_DIR}/file_checksums_sha256.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Checksum output must use sanitized relative paths in tracked reports.'],
    },
    {
      commandId: 'mask_model_download_upload_to_gcs',
      phase: 'upload',
      commandString: `gcloud storage rsync --recursive ${MASK_MODEL_DOWNLOAD_LOCAL_DIR} ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD',
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Upload only to the private generated-assets BiRefNet model-weight prefix.'],
    },
    {
      commandId: 'mask_model_download_verify_gcs',
      phase: 'verify',
      commandString: `gcloud storage ls --recursive ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Verification is read-only and must not create signed URLs.'],
    },
    {
      commandId: 'mask_model_download_cleanup_temp',
      phase: 'cleanup',
      commandString: `rm -rf ${MASK_MODEL_DOWNLOAD_TEMP_ROOT}/birefnet-main`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...maskModelDownloadExecutionDoesNotDo],
      warnings: ['Remove local temp model files after upload; keep local logs.'],
    },
  ]
}

export function buildStaticMaskModelDownloadCommandPlans() {
  return buildMaskModelDownloadCommandPlan(buildBiRefNetMaskModelStoragePlan())
}
