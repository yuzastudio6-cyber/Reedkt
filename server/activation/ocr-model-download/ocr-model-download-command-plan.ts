import {
  PP_OCRV5_DICT_SOURCE_URL,
  selectedOcrModelAssets,
} from './ocr-model-asset-registry'
import {
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  OCR_MODEL_DOWNLOAD_TEMP_ROOT,
  ocrModelDownloadExecutionDoesNotDo,
} from './ocr-model-download-policy'
import type { OcrModelDownloadExecutionCommandPlan } from './ocr-model-download-types'

export function buildOcrModelDownloadExecutionCommandPlans(): OcrModelDownloadExecutionCommandPlan[] {
  const downloadCommands = selectedOcrModelAssets.map<OcrModelDownloadExecutionCommandPlan>((asset) => ({
    commandId: `ocr_model_download_${asset.assetId}`,
    phase: 'download',
    commandString: [
      'REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true',
      'curl -fL',
      `-o ${OCR_MODEL_DOWNLOAD_LOCAL_DIR}/${asset.localRelativePath}`,
      asset.sourceUrl,
    ].join(' '),
    textOnlyByDefault: true,
    requiresConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD',
    doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
    warnings: [
      'Execute only after source/license evidence passes and the temp directory is outside the repo.',
      asset.sourceUrl === PP_OCRV5_DICT_SOURCE_URL ? 'Dictionary download is required to keep recognition runtime pinned and offline.' : 'Model archive must not be unpacked or loaded in Phase 37B.',
    ],
  }))

  return [
    {
      commandId: 'ocr_model_download_preflight',
      phase: 'preflight',
      commandString: [
        'gcloud auth list',
        'gcloud config get-value project',
        'gcloud projects describe reeditpro',
        'gcloud storage buckets describe gs://reeditpro-staging-reeditpro-generated-assets',
        'gcloud storage buckets get-iam-policy gs://reeditpro-staging-reeditpro-generated-assets',
        `gcloud storage objects list ${OCR_MODEL_DOWNLOAD_GCS_PATH} --recursive --limit=50 || true`,
      ].join(' && '),
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Read-only preflight commands; do not proceed unless project/env/source/private-bucket guards pass.'],
    },
    {
      commandId: 'ocr_model_source_license_verify',
      phase: 'source_evidence',
      commandString: 'TEXT_ONLY source/license verification runs inside the Phase 37B CLI before download.',
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Stops before download if official PaddleOCR source/license evidence is unclear.'],
    },
    ...downloadCommands,
    {
      commandId: 'ocr_model_download_checksums',
      phase: 'checksum',
      commandString: `cd ${OCR_MODEL_DOWNLOAD_LOCAL_DIR} && shasum -a 256 det/PP-OCRv5_mobile_det_infer.tar rec/PP-OCRv5_mobile_rec_infer.tar dict/ppocrv5_dict.txt > file_checksums_sha256.txt`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Checksum output must use relative paths and feed checksum_manifest.json plus model_tree_manifest.json.'],
    },
    {
      commandId: 'ocr_model_download_upload_to_private_gcs',
      phase: 'upload',
      commandString: [
        'REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true',
        'gcloud storage cp',
        `${OCR_MODEL_DOWNLOAD_LOCAL_DIR}/det/PP-OCRv5_mobile_det_infer.tar ${OCR_MODEL_DOWNLOAD_GCS_PATH}det/PP-OCRv5_mobile_det_infer.tar &&`,
        'gcloud storage cp',
        `${OCR_MODEL_DOWNLOAD_LOCAL_DIR}/rec/PP-OCRv5_mobile_rec_infer.tar ${OCR_MODEL_DOWNLOAD_GCS_PATH}rec/PP-OCRv5_mobile_rec_infer.tar &&`,
        'gcloud storage cp',
        `${OCR_MODEL_DOWNLOAD_LOCAL_DIR}/dict/ppocrv5_dict.txt ${OCR_MODEL_DOWNLOAD_GCS_PATH}dict/ppocrv5_dict.txt`,
      ].join(' '),
      textOnlyByDefault: true,
      requiresConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD',
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Upload only to the approved private generated-assets PP-OCRv5 safe-zone prefix.'],
    },
    {
      commandId: 'ocr_model_download_verify_private_gcs',
      phase: 'verify',
      commandString: `gcloud storage objects describe ${OCR_MODEL_DOWNLOAD_GCS_PATH}det/PP-OCRv5_mobile_det_infer.tar ${OCR_MODEL_DOWNLOAD_GCS_PATH}rec/PP-OCRv5_mobile_rec_infer.tar ${OCR_MODEL_DOWNLOAD_GCS_PATH}dict/ppocrv5_dict.txt ${OCR_MODEL_DOWNLOAD_GCS_PATH}checksum_manifest.json ${OCR_MODEL_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Verification is read-only and must not create signed URLs or public objects.'],
    },
    {
      commandId: 'ocr_model_download_cleanup_temp',
      phase: 'cleanup',
      commandString: `rm -rf ${OCR_MODEL_DOWNLOAD_TEMP_ROOT}/paddle3.0.0-mobile-safe-zone-v1`,
      textOnlyByDefault: true,
      requiresConfirmation: false,
      doesNotDo: [...ocrModelDownloadExecutionDoesNotDo],
      warnings: ['Remove local temp model files after upload and verification; never commit model files to git.'],
    },
  ]
}
