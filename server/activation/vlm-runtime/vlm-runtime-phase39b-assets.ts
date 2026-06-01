import { getApprovedVlmModelDownloadEvidence } from '../vlm-model-download'
import type { VlmModelAssetRecord } from '../vlm-model-download'

export function getPhase39BVlmRuntimeEvidence() {
  return getApprovedVlmModelDownloadEvidence()
}

export function getPhase39CVlmRuntimeAssets(): Array<VlmModelAssetRecord & {
  expectedSha256: string
  expectedSizeBytes: number
}> {
  const evidence = getApprovedVlmModelDownloadEvidence()
  return evidence.selectedAssets.map((asset) => ({
    ...asset,
    expectedSha256: evidence.assetSha256[asset.relativePath],
    expectedSizeBytes: evidence.assetSizeBytes[asset.relativePath] ?? asset.expectedSizeBytes,
  }))
}
