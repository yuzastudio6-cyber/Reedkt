import { getApprovedOcrModelDownloadEvidence } from '../ocr-model-download'
import { ocrRuntimeConfig } from './ocr-runtime-policy'

export const phase37COcrRuntimeAssetRelativePaths = [
  'det/PP-OCRv5_mobile_det_infer.tar',
  'rec/PP-OCRv5_mobile_rec_infer.tar',
  'dict/ppocrv5_dict.txt',
] as const

export type Phase37COcrRuntimeAssetRelativePath = typeof phase37COcrRuntimeAssetRelativePaths[number]

export interface Phase37COcrRuntimeAsset {
  relativePath: Phase37COcrRuntimeAssetRelativePath
  gcsUri: string
  expectedSha256: string
}

export function getPhase37COcrRuntimeAssets(): Phase37COcrRuntimeAsset[] {
  const evidence = getApprovedOcrModelDownloadEvidence()
  if (evidence.status !== 'verified') throw new Error('Phase 37B OCR model evidence is not verified.')
  if (evidence.targetGcsPath !== ocrRuntimeConfig.modelGcsPath) throw new Error('Phase 37B OCR model path does not match Phase 37C config.')
  return phase37COcrRuntimeAssetRelativePaths.map((relativePath) => {
    const expectedSha256 = evidence.assetSha256[relativePath]
    if (!expectedSha256) throw new Error(`Phase 37B evidence is missing sha256 for ${relativePath}.`)
    return {
      relativePath,
      gcsUri: `${evidence.targetGcsPath}${relativePath}`,
      expectedSha256,
    }
  })
}

export function assertOnlyPhase37BVerifiedOcrAssets(relativePaths: string[]): void {
  const expected = [...phase37COcrRuntimeAssetRelativePaths].sort()
  const actual = [...relativePaths].sort()
  const unexpected = actual.filter((path) => !expected.includes(path as Phase37COcrRuntimeAssetRelativePath))
  const missing = expected.filter((path) => !actual.includes(path))
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`Phase 37C asset set mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}
