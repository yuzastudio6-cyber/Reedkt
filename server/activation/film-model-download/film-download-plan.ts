import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_EXPECTED_MODEL_FILE_PATHS,
  FILM_MODEL_DOWNLOAD_GCS_PATH,
  FILM_MODEL_DOWNLOAD_LOCAL_DIR,
  FILM_MODEL_DOWNLOAD_TEMP_ROOT,
  FILM_SELECTED_ARTIFACT_ROOT,
  filmModelDownloadExecutionDoesNotDo,
} from './film-model-download-policy'
import type { FilmModelDownloadCommandPlan } from './film-model-download-types'

export function buildFilmModelDownloadExecutionCommandPlans(): FilmModelDownloadCommandPlan[] {
  return [
    {
      commandId: 'film_model_download_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage objects list gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/ --recursive --limit=20 || true',
      ].join(' && '),
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Read-only preflight commands; do not proceed unless project/env/source guards pass.'],
    },
    {
      commandId: 'film_model_source_license_verify',
      phase: 'source_evidence',
      commandString: `TEXT_ONLY source/license verification resolves ${FILM_CHECKPOINT_SOURCE_URL} and accepts only ${FILM_SELECTED_ARTIFACT_ROOT}.`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Stops before download if official source/license evidence or public Google Drive access is unclear.'],
    },
    {
      commandId: 'film_model_download_selected_saved_model_tree',
      phase: 'download',
      commandString: [
        'REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true',
        'npm run activation:film-model-download -- --execute',
      ].join(' '),
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD',
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: [
        `Downloads only ${FILM_SELECTED_ARTIFACT_ROOT} into ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}, outside the git worktree.`,
        'Does not download FILM L1, VGG, vgg, datasets, demo media, forks, or mirrors.',
      ],
    },
    {
      commandId: 'film_model_download_checksums',
      phase: 'checksum',
      commandString: `cd ${FILM_MODEL_DOWNLOAD_LOCAL_DIR} && shasum -a 256 ${FILM_EXPECTED_MODEL_FILE_PATHS.join(' ')} > file_checksums_sha256.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Checksum output must use official relative paths and must not include local temp directories.'],
    },
    {
      commandId: 'film_model_download_upload_to_gcs',
      phase: 'upload',
      commandString: `gcloud storage cp --recursive ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/film_net ${FILM_MODEL_DOWNLOAD_GCS_PATH} && gcloud storage cp ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/file_checksums_sha256.txt ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/model_tree_manifest.json ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/source_evidence.json ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/license_evidence.json ${FILM_MODEL_DOWNLOAD_LOCAL_DIR}/download_report.json ${FILM_MODEL_DOWNLOAD_GCS_PATH}`,
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD',
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Upload only to the private generated-assets FILM model-weight prefix.'],
    },
    {
      commandId: 'film_model_download_verify_gcs',
      phase: 'verify',
      commandString: `gcloud storage objects list ${FILM_MODEL_DOWNLOAD_GCS_PATH} --recursive && gcloud storage objects describe ${FILM_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Verification is read-only and must not create signed URLs or public access.'],
    },
    {
      commandId: 'film_model_download_cleanup_temp',
      phase: 'cleanup',
      commandString: `rm -rf ${FILM_MODEL_DOWNLOAD_TEMP_ROOT}/film-net-style-saved-model`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...filmModelDownloadExecutionDoesNotDo],
      warnings: ['Remove local temp FILM SavedModel files after upload and verification.'],
    },
  ]
}
