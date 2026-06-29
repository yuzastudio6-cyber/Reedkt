import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import type { OcrModelAssetVerificationEntry, OcrModelAssetVerificationReport } from './ocr-runtime-types'
import type { Phase37COcrRuntimeAsset } from './ocr-runtime-phase37b-assets'
import { ocrRuntimeConfig } from './ocr-runtime-policy'

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

export async function buildOcrModelAssetVerificationReport(input: {
  runId: string
  assets: Array<Phase37COcrRuntimeAsset & { localPath: string }>
}): Promise<OcrModelAssetVerificationReport> {
  const entries: OcrModelAssetVerificationEntry[] = []
  const blockers: string[] = []
  const warnings: string[] = []

  for (const asset of input.assets) {
    const fileStat = await stat(asset.localPath)
    const actualSha256 = await sha256File(asset.localPath)
    const verified = actualSha256 === asset.expectedSha256
    if (!verified) blockers.push(`${asset.relativePath} sha256 mismatch: expected ${asset.expectedSha256}, got ${actualSha256}.`)
    entries.push({
      relativePath: asset.relativePath,
      gcsUri: asset.gcsUri,
      localPath: asset.localPath,
      expectedSha256: asset.expectedSha256,
      actualSha256,
      sizeBytes: fileStat.size,
      verified,
    })
  }

  if (entries.some((entry) => entry.sizeBytes <= 0)) blockers.push('One or more Phase 37B OCR model assets copied as an empty file.')
  warnings.push('GCS object metadata is used for presence/size only; SHA-256 verification is computed from local copied bytes.')

  return {
    phase: '37C',
    runId: input.runId,
    modelGcsPath: ocrRuntimeConfig.modelGcsPath,
    aggregateSha256: ocrRuntimeConfig.aggregateSha256,
    entries,
    status: blockers.length === 0 ? 'verified' : 'blocked',
    blockers,
    warnings,
  }
}
