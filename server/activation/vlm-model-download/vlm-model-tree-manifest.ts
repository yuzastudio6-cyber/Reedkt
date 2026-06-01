import {
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
} from './vlm-model-download-config'
import type { VlmModelAssetRecord, VlmModelTreeManifest } from './vlm-model-download-types'

export function buildVlmModelTreeManifest(input: {
  createdAt: string
  revision: string
  localTempPath: string
  selectedAssets: VlmModelAssetRecord[]
  fileSha256: Record<string, string>
  fileSizes: Record<string, number | null>
  aggregateSha256: string
}): VlmModelTreeManifest {
  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_model_tree_manifest_v1',
    createdAt: input.createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
    revision: input.revision,
    targetGcsPath: VLM_MODEL_DOWNLOAD_GCS_PATH,
    localTempPath: input.localTempPath,
    selectedAssets: input.selectedAssets,
    fileSha256: input.fileSha256,
    fileSizes: input.fileSizes,
    aggregateSha256: input.aggregateSha256,
    downloadAllowedInPhase39B: true,
    privateGcsUploadAllowedInPhase39B: true,
    runtimeAutoDownloadAllowed: false,
    vlmRuntimeAllowed: false,
    inferenceAllowed: false,
    mediaProcessingAllowed: false,
    providerAllowed: false,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    productionReadyAllowed: false,
    internalBetaAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    trackAExecutionAllowed: false,
  }
}
