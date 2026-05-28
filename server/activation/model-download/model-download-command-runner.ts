import { buildModelDownloadCommandPlan } from '../model-approval/model-download-command-plan'
import { buildFasterWhisperTinyStoragePlan } from '../model-approval/model-storage-plan'
import {
  APPROVED_MODEL_REPO_ID,
  APPROVED_MODEL_REVISION,
  MODEL_DOWNLOAD_LOCAL_DIR,
  MODEL_DOWNLOAD_LOG_DIR,
  MODEL_DOWNLOAD_TEMP_ROOT,
  MODEL_DOWNLOAD_VENV_DIR,
  modelDownloadExecutionDoesNotDo,
} from './model-download-policy'
import type { ModelDownloadExecutionCommandPlan } from './model-download-types'

export function buildModelDownloadExecutionCommandPlans(): ModelDownloadExecutionCommandPlan[] {
  const storagePlan = buildFasterWhisperTinyStoragePlan()
  return [
    {
      commandId: 'model_download_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
      ].join(' && '),
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Read-only preflight commands; do not proceed unless project/env guards pass.'],
    },
    {
      commandId: 'model_download_hf_snapshot',
      phase: 'download',
      commandString: [
        'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD=true',
        `${MODEL_DOWNLOAD_VENV_DIR}/bin/python -c`,
        `"from huggingface_hub import snapshot_download; snapshot_download(repo_id='${APPROVED_MODEL_REPO_ID}', revision='${APPROVED_MODEL_REVISION}', local_dir='${MODEL_DOWNLOAD_LOCAL_DIR}', local_dir_use_symlinks=False)"`,
      ].join(' '),
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD',
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Execute only in Phase 26B after preflight; temp path is outside repo.'],
    },
    {
      commandId: 'model_download_checksums',
      phase: 'checksum',
      commandString: `find ${MODEL_DOWNLOAD_LOCAL_DIR} -type f -print0 | sort -z | xargs -0 shasum -a 256 > ${MODEL_DOWNLOAD_LOG_DIR}/file_checksums_sha256.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Checksum output must use sanitized relative paths in tracked reports.'],
    },
    {
      commandId: 'model_download_upload_to_gcs',
      phase: 'upload',
      commandString: `gcloud storage rsync --recursive ${MODEL_DOWNLOAD_LOCAL_DIR} ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD',
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Upload only to the private generated-assets model-weight prefix.'],
    },
    {
      commandId: 'model_download_verify_gcs',
      phase: 'verify',
      commandString: `gcloud storage ls --recursive ${storagePlan.stagingStoragePath}`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Verification is read-only and must not create signed URLs.'],
    },
    {
      commandId: 'model_download_cleanup_temp',
      phase: 'cleanup',
      commandString: `rm -rf ${MODEL_DOWNLOAD_TEMP_ROOT}/faster-whisper-tiny`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...modelDownloadExecutionDoesNotDo],
      warnings: ['Remove local temp model files after upload; keep local logs.'],
    },
  ]
}

export function buildStaticModelDownloadCommandPlans() {
  return buildModelDownloadCommandPlan(buildFasterWhisperTinyStoragePlan())
}
