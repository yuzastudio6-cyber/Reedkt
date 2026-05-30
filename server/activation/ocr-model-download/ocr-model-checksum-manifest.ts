import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { OCR_MODEL_ASSET_VERSION, selectedOcrModelAssetRelativePaths } from './ocr-model-asset-registry'
import type { OcrChecksumEntry, OcrChecksumManifest } from './ocr-model-download-types'

export function buildOcrAggregateChecksum(entries: OcrChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted
    .map((entry) => `${entry.sha256 ?? 'pending_until_download'}  ${entry.relativePath}`)
    .join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildPendingOcrChecksumManifest(createdAt = new Date().toISOString()): OcrChecksumManifest {
  const entries = selectedOcrModelAssetRelativePaths.map<OcrChecksumEntry>((relativePath) => ({
    relativePath,
    checksumStatus: 'pending_until_download',
  }))
  return {
    phase: '37B',
    manifestId: 'paddleocr_ppocrv5_checksum_manifest_v1',
    assetVersion: OCR_MODEL_ASSET_VERSION,
    generatedAt: createdAt,
    status: 'pending_until_download',
    entries,
    blockers: [
      'OCR asset SHA-256 values are pending until guarded Phase 37B download runs.',
      'Phase 37C runtime verification remains blocked until checksum_manifest.json and file_checksums_sha256.txt are computed and reviewed.',
    ],
    warnings: ['Dry-run plan/report modes emit schema only and do not download OCR assets.'],
  }
}

export function buildComputedOcrChecksumManifest(
  entries: OcrChecksumEntry[],
  generatedAt = new Date().toISOString(),
): OcrChecksumManifest {
  if (entries.some((entry) => !entry.sha256 || !entry.sizeBytes || entry.checksumStatus !== 'computed')) {
    throw new Error('Computed OCR checksum manifest requires sha256, sizeBytes, and computed status for every entry.')
  }
  return {
    phase: '37B',
    manifestId: 'paddleocr_ppocrv5_checksum_manifest_v1',
    assetVersion: OCR_MODEL_ASSET_VERSION,
    generatedAt,
    status: 'computed',
    entries: [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    aggregateSha256: buildOcrAggregateChecksum(entries),
    blockers: [],
    warnings: [
      'Computed checksums do not permit OCR runtime execution until private GCS upload evidence is verified and reviewed.',
    ],
  }
}

export function buildOcrChecksumTextManifest(entries: OcrChecksumEntry[]): string {
  return [...entries]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256 ?? 'pending_until_download'}  ${entry.relativePath}`)
    .join('\n') + '\n'
}

export async function checksumOcrModelFiles(localDir: string, relativePaths: string[]): Promise<OcrChecksumEntry[]> {
  const entries: OcrChecksumEntry[] = []
  for (const relativePath of relativePaths) {
    const filePath = join(localDir, relativePath)
    const [content, fileStat] = await Promise.all([readFile(filePath), stat(filePath)])
    entries.push({
      relativePath,
      sha256: createHash('sha256').update(content).digest('hex'),
      sizeBytes: fileStat.size,
      checksumStatus: 'computed',
    })
  }
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}
