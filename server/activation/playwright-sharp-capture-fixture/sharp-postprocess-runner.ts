import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'
import type { SharpPostprocessMetadata, SharpProcessedArtifact } from './playwright-sharp-capture-types'

export async function runSharpScreenshotPostprocess(input: {
  screenshotPath: string
  outputRoot: string
}): Promise<SharpPostprocessMetadata> {
  const originalMetadata = await sharp(input.screenshotPath).metadata()
  if (!originalMetadata.width || !originalMetadata.height || originalMetadata.format !== 'png') {
    throw new Error('Original Playwright screenshot must decode as a PNG with dimensions.')
  }
  const previewPath = path.join(input.outputRoot, 'screenshot-preview.png')
  const thumbnailPath = path.join(input.outputRoot, 'screenshot-thumbnail.png')
  await sharp(input.screenshotPath)
    .resize({ width: playwrightSharpCaptureConfig.previewMaxWidth, withoutEnlargement: true })
    .png()
    .toFile(previewPath)
  await sharp(input.screenshotPath)
    .resize({ width: playwrightSharpCaptureConfig.thumbnailWidth, withoutEnlargement: true })
    .png()
    .toFile(thumbnailPath)
  const preview = await imageArtifact(previewPath)
  const thumbnail = await imageArtifact(thumbnailPath)
  const originalStats = await stat(input.screenshotPath)
  return {
    inputPath: input.screenshotPath,
    original: {
      width: originalMetadata.width,
      height: originalMetadata.height,
      format: originalMetadata.format,
      sizeBytes: originalStats.size,
      sha256: sha256File(input.screenshotPath),
    },
    preview,
    thumbnail,
    processedAt: new Date().toISOString(),
    remoteImagesFetched: false,
  }
}

async function imageArtifact(filePath: string): Promise<SharpProcessedArtifact> {
  const [metadata, stats] = await Promise.all([sharp(filePath).metadata(), stat(filePath)])
  return {
    path: filePath,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizeBytes: stats.size,
    sha256: sha256File(filePath),
  }
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}
