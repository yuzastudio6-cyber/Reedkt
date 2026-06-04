import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { mapLibreLocalRenderConfig } from './maplibre-local-render-policy'
import type { ImageArtifactMetadata, SharpMapScreenshotProcessing } from './maplibre-local-render-types'

export async function runMapLibreSharpScreenshotProcessing(input: {
  screenshotPath: string
  outputRoot: string
}): Promise<SharpMapScreenshotProcessing> {
  const sharp = await loadSharp()
  const originalMetadata = await sharp(input.screenshotPath).metadata()
  if (!originalMetadata.width || !originalMetadata.height || originalMetadata.format !== 'png') {
    throw new Error('MapLibre screenshot must decode as a PNG with dimensions before Sharp post-processing.')
  }
  const previewPath = path.join(input.outputRoot, 'maplibre-render-preview.png')
  const thumbnailPath = path.join(input.outputRoot, 'maplibre-render-thumbnail.png')
  await sharp(input.screenshotPath)
    .resize({ width: mapLibreLocalRenderConfig.previewMaxWidth, withoutEnlargement: true })
    .png()
    .toFile(previewPath)
  await sharp(input.screenshotPath)
    .resize({ width: mapLibreLocalRenderConfig.thumbnailWidth, withoutEnlargement: true })
    .png()
    .toFile(thumbnailPath)
  return {
    inputPath: input.screenshotPath,
    original: await imageArtifact(input.screenshotPath),
    preview: await imageArtifact(previewPath),
    thumbnail: await imageArtifact(thumbnailPath),
    processedAt: new Date().toISOString(),
    sharpVersion: sharp.versions.sharp,
    remoteImagesFetched: false,
  }
}

async function imageArtifact(filePath: string): Promise<ImageArtifactMetadata> {
  const sharp = await loadSharp()
  const [metadata, stats] = await Promise.all([sharp(filePath).metadata(), stat(filePath)])
  return {
    path: filePath,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format,
    sizeBytes: stats.size,
    sha256: createHash('sha256').update(readFileSync(filePath)).digest('hex'),
  }
}

async function loadSharp() {
  const module = await import('sharp')
  return module.default
}
