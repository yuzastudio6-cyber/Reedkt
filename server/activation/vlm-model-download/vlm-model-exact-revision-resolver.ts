import {
  VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
  VLM_MODEL_DOWNLOAD_HF_API_URL,
  VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
  VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
} from './vlm-model-download-config'
import {
  VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT,
  VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES,
  VLM_MODEL_DOWNLOAD_SELECTED_FILES,
} from './vlm-model-file-registry'
import type { VlmExactRevisionManifest, VlmHfSiblingMetadata } from './vlm-model-download-types'

interface HfModelApiResponse {
  id?: string
  sha?: string
  lastModified?: string
  private?: boolean
  gated?: boolean | string | null
  disabled?: boolean
  pipeline_tag?: string
  library_name?: string
  tags?: string[]
  siblings?: Array<{
    rfilename?: string
    size?: number
    blobId?: string
    lfs?: {
      sha256?: string
      size?: number
    }
  }>
}

export async function resolveVlmExactRevision(createdAt = new Date().toISOString()): Promise<VlmExactRevisionManifest> {
  const authenticationAvailable = Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN)
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_HUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(VLM_MODEL_DOWNLOAD_HF_API_URL, { headers })
  if (!response.ok) {
    return buildBlockedRevisionManifest({
      createdAt,
      authenticationAvailable,
      blockers: [`exact_huggingface_revision_unresolved: Hugging Face metadata request failed with HTTP ${response.status}.`],
    })
  }
  const parsed = await response.json() as HfModelApiResponse
  return buildVlmExactRevisionManifestFromMetadata(parsed, {
    createdAt,
    authenticationAvailable,
  })
}

export function buildVlmExactRevisionManifestFromMetadata(
  parsed: HfModelApiResponse,
  input: { createdAt?: string; authenticationAvailable?: boolean } = {},
): VlmExactRevisionManifest {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const siblings = normalizeSiblings(parsed.siblings ?? [])
  const repoFiles = siblings.map((sibling) => sibling.rfilename).sort()
  const selectedFiles = [...VLM_MODEL_DOWNLOAD_SELECTED_FILES].sort()
  const expectedRepoFiles = [...selectedFiles, ...VLM_MODEL_DOWNLOAD_EXCLUDED_REPO_FILES].sort()
  const blockers: string[] = []
  const warnings: string[] = []
  const tags = parsed.tags ?? []
  const authenticationRequired = parsed.gated === true || parsed.private === true
  const licenseTagPresent = tags.includes('license:apache-2.0')
  const architectureTagPresent = tags.includes('qwen3_vl')

  if (parsed.id !== VLM_MODEL_DOWNLOAD_MODEL_ID) blockers.push(`exact_huggingface_model_id_mismatch: expected ${VLM_MODEL_DOWNLOAD_MODEL_ID}, got ${parsed.id ?? 'unknown'}.`)
  if (parsed.sha !== VLM_MODEL_DOWNLOAD_EXPECTED_REVISION) blockers.push(`exact_huggingface_revision_unresolved: expected ${VLM_MODEL_DOWNLOAD_EXPECTED_REVISION}, got ${parsed.sha ?? 'unknown'}.`)
  if (!/^[0-9a-f]{40}$/.test(parsed.sha ?? '')) blockers.push('exact_huggingface_revision_unresolved: revision is not a pinned 40-character commit SHA.')
  if (parsed.disabled === true) blockers.push('huggingface_model_disabled: selected model is disabled.')
  if (!licenseTagPresent) blockers.push('vlm_license_review_required: Hugging Face license tag is missing or changed from apache-2.0.')
  if (!architectureTagPresent) blockers.push('vlm_architecture_tag_missing: Hugging Face qwen3_vl tag is missing.')
  if (repoFiles.length !== VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT) blockers.push(`vlm_file_list_unexpected: expected ${VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT} repo files, got ${repoFiles.length}.`)
  if (JSON.stringify(repoFiles) !== JSON.stringify(expectedRepoFiles)) {
    blockers.push(`vlm_file_list_unexpected: repo file list differs from the approved Phase 39B selection shape. Files: ${repoFiles.join(', ')}`)
  }
  for (const selectedFile of VLM_MODEL_DOWNLOAD_SELECTED_FILES) {
    const sibling = siblings.find((item) => item.rfilename === selectedFile)
    if (!sibling) blockers.push(`vlm_required_file_missing: ${selectedFile}`)
    else if (!sibling.size || sibling.size <= 0) blockers.push(`vlm_required_file_size_missing: ${selectedFile}`)
  }
  if (parsed.pipeline_tag !== 'image-text-to-text') warnings.push(`HF pipeline tag is ${parsed.pipeline_tag ?? 'missing'}; Phase 39B expected image-text-to-text.`)
  if (parsed.library_name !== 'transformers') warnings.push(`HF library name is ${parsed.library_name ?? 'missing'}; Phase 39B expected transformers.`)
  warnings.push('Phase 39B uses Hugging Face metadata for revision/file selection only; it does not call inference providers.')

  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_exact_revision_manifest_v1',
    collectedAt: createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
    revision: parsed.sha ?? 'unresolved',
    sourceApiUrl: VLM_MODEL_DOWNLOAD_HF_API_URL,
    modelCardUrl: VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
    lastModified: parsed.lastModified,
    private: parsed.private === true,
    gated: parsed.gated ?? false,
    disabled: parsed.disabled === true,
    pipelineTag: parsed.pipeline_tag,
    libraryName: parsed.library_name,
    tags,
    authenticationRequired,
    authenticationAvailable: input.authenticationAvailable === true,
    repoFileCount: repoFiles.length,
    expectedRepoFileCount: VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT,
    revisionPinned: parsed.sha === VLM_MODEL_DOWNLOAD_EXPECTED_REVISION,
    licenseTagPresent,
    architectureTagPresent,
    siblings,
    blockers,
    warnings,
  }
}

function buildBlockedRevisionManifest(input: {
  createdAt: string
  authenticationAvailable: boolean
  blockers: string[]
}): VlmExactRevisionManifest {
  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_exact_revision_manifest_v1',
    collectedAt: input.createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    modelFamily: VLM_MODEL_DOWNLOAD_MODEL_FAMILY,
    revision: 'unresolved',
    sourceApiUrl: VLM_MODEL_DOWNLOAD_HF_API_URL,
    modelCardUrl: VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
    private: false,
    gated: null,
    disabled: false,
    tags: [],
    authenticationRequired: false,
    authenticationAvailable: input.authenticationAvailable,
    repoFileCount: 0,
    expectedRepoFileCount: VLM_MODEL_DOWNLOAD_EXPECTED_REPO_FILE_COUNT,
    revisionPinned: false,
    licenseTagPresent: false,
    architectureTagPresent: false,
    siblings: [],
    blockers: input.blockers,
    warnings: ['No model download may run until exact Hugging Face revision metadata resolves.'],
  }
}

function normalizeSiblings(siblings: HfModelApiResponse['siblings']): VlmHfSiblingMetadata[] {
  return (siblings ?? [])
    .filter((sibling): sibling is NonNullable<typeof sibling> & { rfilename: string } => typeof sibling.rfilename === 'string')
    .map((sibling) => ({
      rfilename: sibling.rfilename,
      size: sibling.size ?? sibling.lfs?.size,
      blobId: sibling.blobId,
      lfsSha256: sibling.lfs?.sha256,
    }))
    .sort((a, b) => a.rfilename.localeCompare(b.rfilename))
}
