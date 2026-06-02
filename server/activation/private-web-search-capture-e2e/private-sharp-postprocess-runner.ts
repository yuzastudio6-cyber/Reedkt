import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateWebCaptureMetadata, PrivateWebSharpArtifact, PrivateWebSharpMetadata } from './private-web-search-capture-e2e-types'

export async function runPrivateSharpPostprocess(input: {
  capture: PrivateWebCaptureMetadata
  outputRoot: string
}): Promise<PrivateWebSharpMetadata> {
  const sourceId = input.capture.sourceId
  const captureDir = path.join(input.outputRoot, 'captures', sourceId)
  const previewPath = path.join(captureDir, 'screenshot-preview.png')
  const thumbnailPath = path.join(captureDir, 'screenshot-thumbnail.png')
  const image = sharp(input.capture.screenshotPath)
  const metadata = await image.metadata()
  await image.clone().resize({ width: privateWebE2EConfig.previewMaxWidth, withoutEnlargement: true }).png().toFile(previewPath)
  await image.clone().resize({ width: privateWebE2EConfig.thumbnailWidth, withoutEnlargement: true }).png().toFile(thumbnailPath)
  return {
    sourceId,
    inputPath: input.capture.screenshotPath,
    original: {
      path: input.capture.screenshotPath,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
      sizeBytes: (await stat(input.capture.screenshotPath)).size,
      sha256: await sha256File(input.capture.screenshotPath),
    },
    preview: await describePng(previewPath),
    thumbnail: await describePng(thumbnailPath),
    processedAt: new Date().toISOString(),
    remoteImagesFetched: false,
  }
}

async function describePng(filePath: string): Promise<PrivateWebSharpArtifact> {
  const metadata = await sharp(filePath).metadata()
  const stats = await stat(filePath)
  return {
    path: filePath,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizeBytes: stats.size,
    sha256: await sha256File(filePath),
  }
}

async function sha256File(filePath: string): Promise<string> {
  const buffer = await import('node:fs/promises').then((fs) => fs.readFile(filePath))
  return createHash('sha256').update(buffer).digest('hex')
}
