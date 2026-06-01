import {
  VLM_MODEL_DOWNLOAD_GCS_PATH,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
} from './vlm-model-download-config'
import type { VlmModelAssetRecord, VlmModelFileRole, VlmModelFileRequiredStatus, VlmHfSiblingMetadata } from './vlm-model-download-types'

export const VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT = 16
export const VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES = ['.gitattributes'] as const

export const VLM_MODEL_DOWNLOAD_SELECTED_FILES = [
  'README.md',
  'chat_template.json',
  'config.json',
  'generation_config.json',
  'merges.txt',
  'model-00001-of-00004.safetensors',
  'model-00002-of-00004.safetensors',
  'model-00003-of-00004.safetensors',
  'model-00004-of-00004.safetensors',
  'model.safetensors.index.json',
  'preprocessor_config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'video_preprocessor_config.json',
  'vocab.json',
] as const

export type VlmSelectedModelFile = typeof VLM_MODEL_DOWNLOAD_SELECTED_FILES[number]

const staticFileRoles: Record<VlmSelectedModelFile, { role: VlmModelFileRole; requiredStatus: VlmModelFileRequiredStatus; reason: string }> = {
  'README.md': { role: 'model_card', requiredStatus: 'required_for_source_license_evidence', reason: 'Model card snapshot for source/license evidence.' },
  'chat_template.json': { role: 'tokenizer', requiredStatus: 'required_for_phase39c_runtime', reason: 'Qwen chat template used by later bounded prompt formatting.' },
  'config.json': { role: 'config', requiredStatus: 'required_for_phase39c_runtime', reason: 'Model architecture/configuration for local runtime.' },
  'generation_config.json': { role: 'config', requiredStatus: 'required_for_phase39c_runtime', reason: 'Generation defaults for future bounded runtime templates.' },
  'merges.txt': { role: 'tokenizer', requiredStatus: 'required_for_phase39c_runtime', reason: 'Tokenizer merge rules.' },
  'model-00001-of-00004.safetensors': { role: 'model_weight', requiredStatus: 'required_for_phase39c_runtime', reason: 'Pinned model weight shard 1 of 4.' },
  'model-00002-of-00004.safetensors': { role: 'model_weight', requiredStatus: 'required_for_phase39c_runtime', reason: 'Pinned model weight shard 2 of 4.' },
  'model-00003-of-00004.safetensors': { role: 'model_weight', requiredStatus: 'required_for_phase39c_runtime', reason: 'Pinned model weight shard 3 of 4.' },
  'model-00004-of-00004.safetensors': { role: 'model_weight', requiredStatus: 'required_for_phase39c_runtime', reason: 'Pinned model weight shard 4 of 4.' },
  'model.safetensors.index.json': { role: 'model_weight', requiredStatus: 'required_for_phase39c_runtime', reason: 'Safetensors shard index for local runtime.' },
  'preprocessor_config.json': { role: 'processor', requiredStatus: 'required_for_phase39c_runtime', reason: 'Vision preprocessing configuration.' },
  'tokenizer.json': { role: 'tokenizer', requiredStatus: 'required_for_phase39c_runtime', reason: 'Tokenizer model file.' },
  'tokenizer_config.json': { role: 'tokenizer', requiredStatus: 'required_for_phase39c_runtime', reason: 'Tokenizer runtime configuration.' },
  'video_preprocessor_config.json': { role: 'processor', requiredStatus: 'required_for_phase39c_runtime', reason: 'Video processor configuration, staged for future runtime parity but not executed in Phase 39B.' },
  'vocab.json': { role: 'tokenizer', requiredStatus: 'required_for_phase39c_runtime', reason: 'Tokenizer vocabulary.' },
}

export function buildVlmSelectedAssetsFromSiblings(
  siblings: VlmHfSiblingMetadata[],
  revision = VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
): VlmModelAssetRecord[] {
  const byName = new Map(siblings.map((sibling) => [sibling.rfilename, sibling]))
  return VLM_MODEL_DOWNLOAD_SELECTED_FILES.map((relativePath) => {
    const sibling = byName.get(relativePath)
    const role = staticFileRoles[relativePath]
    return {
      relativePath,
      role: role.role,
      requiredStatus: role.requiredStatus,
      sourceUrl: resolveHfFileUrl(relativePath, revision),
      gcsUri: `${VLM_MODEL_DOWNLOAD_GCS_PATH}${relativePath}`,
      expectedSizeBytes: sibling?.size ?? 0,
      blobId: sibling?.blobId,
      lfsSha256: sibling?.lfsSha256,
      selectionReason: role.reason,
    }
  })
}

export function resolveHfFileUrl(relativePath: string, revision = VLM_MODEL_DOWNLOAD_EXPECTED_REVISION): string {
  return `https://huggingface.co/${VLM_MODEL_DOWNLOAD_MODEL_ID}/resolve/${revision}/${relativePath.split('/').map(encodeURIComponent).join('/')}`
}

export function selectedVlmModelFilesMatch(fileNames: string[]): boolean {
  const expected = [...VLM_MODEL_DOWNLOAD_SELECTED_FILES].sort()
  return JSON.stringify([...fileNames].sort()) === JSON.stringify(expected)
}
