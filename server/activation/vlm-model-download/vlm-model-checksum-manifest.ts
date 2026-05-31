import { createHash } from 'node:crypto'
import type { VlmChecksumEntry, VlmChecksumManifest, VlmModelAssetRecord } from './vlm-model-download-types'
import { VLM_MODEL_DOWNLOAD_MODEL_ID } from './vlm-model-download-config'

export function buildPendingVlmChecksumManifest(input: {
  createdAt: string
  revision: string
  selectedAssets: VlmModelAssetRecord[]
  blockers?: string[]
  warnings?: string[]
}): VlmChecksumManifest {
  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_checksum_manifest_v1',
    generatedAt: input.createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    revision: input.revision,
    status: 'pending_until_download',
    entries: input.selectedAssets.map((asset) => ({
      relativePath: asset.relativePath,
      role: asset.role,
      sizeBytes: asset.expectedSizeBytes,
      gcsUri: asset.gcsUri,
      checksumStatus: 'pending_until_download',
    })),
    totalSizeBytes: input.selectedAssets.reduce((sum, asset) => sum + asset.expectedSizeBytes, 0),
    fileCount: input.selectedAssets.length,
    blockers: input.blockers ?? ['Checksum generation is pending guarded Phase 39B download execution.'],
    warnings: input.warnings ?? [],
  }
}

export function buildComputedVlmChecksumManifest(input: {
  createdAt: string
  revision: string
  selectedAssets: VlmModelAssetRecord[]
  checksums: Record<string, string>
  sizes: Record<string, number>
  blockers?: string[]
  warnings?: string[]
}): VlmChecksumManifest {
  const entries: VlmChecksumEntry[] = input.selectedAssets.map((asset) => ({
    relativePath: asset.relativePath,
    role: asset.role,
    sizeBytes: input.sizes[asset.relativePath],
    sha256: input.checksums[asset.relativePath],
    gcsUri: asset.gcsUri,
    checksumStatus: 'computed',
  }))
  const aggregateSha256 = computeVlmAggregateSha256(entries)
  return {
    phase: '39B',
    manifestId: 'qwen3_vl_8b_instruct_checksum_manifest_v1',
    generatedAt: input.createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    revision: input.revision,
    status: 'computed',
    entries,
    aggregateSha256,
    totalSizeBytes: entries.reduce((sum, entry) => sum + (entry.sizeBytes ?? 0), 0),
    fileCount: entries.length,
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? ['SHA256 was computed over downloaded local bytes; GCS metadata may not expose SHA256.'],
  }
}

export function buildVlmChecksumText(entries: VlmChecksumEntry[]): string {
  return entries
    .slice()
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256 ?? 'pending'}  ${entry.relativePath}`)
    .join('\n') + '\n'
}

export function computeVlmAggregateSha256(entries: VlmChecksumEntry[]): string {
  const hash = createHash('sha256')
  const lines = entries
    .slice()
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.relativePath} ${entry.sha256 ?? ''} ${entry.sizeBytes ?? 0}`)
  hash.update(lines.join('\n'))
  return hash.digest('hex')
}
