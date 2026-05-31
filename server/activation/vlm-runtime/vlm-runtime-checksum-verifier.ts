import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { getPhase39CVlmRuntimeAssets } from './vlm-runtime-phase39b-assets'
import { vlmRuntimeConfig } from './vlm-runtime-policy'
import type { VlmModelAssetVerificationReport } from './vlm-runtime-types'

export async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

export async function buildVlmModelAssetVerificationReport(input: {
  runId: string
  localModelRoot?: string
  metadataOnlyEntries?: Array<{
    relativePath: string
    generation?: string
    crc32c?: string
    md5Hash?: string
    sizeBytes?: number
  }>
}): Promise<VlmModelAssetVerificationReport> {
  const blockers: string[] = []
  const warnings: string[] = []
  const assets = getPhase39CVlmRuntimeAssets()
  const entries = []
  for (const asset of assets) {
    const localPath = input.localModelRoot ? path.join(input.localModelRoot, asset.relativePath) : undefined
    const metadata = input.metadataOnlyEntries?.find((entry) => entry.relativePath === asset.relativePath)
    let actualSha256: string | undefined
    let actualSizeBytes: number | undefined = metadata?.sizeBytes
    let verified = false
    if (localPath) {
      try {
        const fileStat = await stat(localPath)
        actualSizeBytes = fileStat.size
        actualSha256 = await sha256File(localPath)
        verified = actualSha256 === asset.expectedSha256 && actualSizeBytes === asset.expectedSizeBytes
      } catch (error) {
        blockers.push(`missing_or_unreadable_model_asset:${asset.relativePath}:${String(error).slice(0, 160)}`)
      }
    } else {
      verified = metadata?.sizeBytes === asset.expectedSizeBytes
      warnings.push(`metadata_only_verification_for:${asset.relativePath}`)
    }
    if (!asset.expectedSha256) blockers.push(`missing_phase39b_sha256:${asset.relativePath}`)
    if (actualSha256 && actualSha256 !== asset.expectedSha256) blockers.push(`checksum_mismatch:${asset.relativePath}`)
    if (typeof actualSizeBytes === 'number' && actualSizeBytes !== asset.expectedSizeBytes) blockers.push(`size_mismatch:${asset.relativePath}`)
    entries.push({
      relativePath: asset.relativePath,
      gcsUri: asset.gcsUri,
      localPath,
      expectedSha256: asset.expectedSha256,
      actualSha256,
      expectedSizeBytes: asset.expectedSizeBytes,
      actualSizeBytes,
      generation: metadata?.generation,
      crc32c: metadata?.crc32c,
      md5Hash: metadata?.md5Hash,
      verified,
    })
  }
  const allVerified = entries.every((entry) => entry.verified && (input.localModelRoot ? Boolean(entry.actualSha256) : true))
  if (!input.localModelRoot) blockers.push('local_model_payload_checksum_verification_not_run')
  if (!allVerified) blockers.push('phase39b_vlm_model_asset_verification_incomplete')
  return {
    phase: '39C',
    runId: input.runId,
    modelId: vlmRuntimeConfig.modelId,
    revision: vlmRuntimeConfig.modelRevision,
    modelGcsPath: vlmRuntimeConfig.modelGcsPath,
    aggregateSha256: vlmRuntimeConfig.aggregateSha256,
    entries,
    status: blockers.length === 0 ? 'verified' : 'blocked',
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}
