import { stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchSharpRecord,
} from './controlled-live-search-capture-types'

export async function runLiveSharpPostprocess(input: {
  capture: ControlledLiveSearchCaptureRecord
}): Promise<ControlledLiveSearchSharpRecord> {
  const captureDir = path.dirname(input.capture.screenshotPath)
  const previewPath = path.join(captureDir, 'screenshot-preview.png')
  const thumbnailPath = path.join(captureDir, 'screenshot-thumbnail.png')
  await sharp(input.capture.screenshotPath)
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(previewPath)
  await sharp(input.capture.screenshotPath)
    .resize({ width: 320, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(thumbnailPath)
  const [originalMetadata, previewMetadata, thumbnailMetadata, originalStats, previewStats, thumbnailStats] = await Promise.all([
    sharp(input.capture.screenshotPath).metadata(),
    sharp(previewPath).metadata(),
    sharp(thumbnailPath).metadata(),
    stat(input.capture.screenshotPath),
    stat(previewPath),
    stat(thumbnailPath),
  ])
  return {
    sourceId: input.capture.sourceId,
    originalPath: input.capture.screenshotPath,
    previewPath,
    thumbnailPath,
    originalMetadata: {
      width: originalMetadata.width ?? 0,
      height: originalMetadata.height ?? 0,
      format: originalMetadata.format,
      sizeBytes: originalStats.size,
    },
    previewMetadata: {
      width: previewMetadata.width ?? 0,
      height: previewMetadata.height ?? 0,
      format: previewMetadata.format,
      sizeBytes: previewStats.size,
    },
    thumbnailMetadata: {
      width: thumbnailMetadata.width ?? 0,
      height: thumbnailMetadata.height ?? 0,
      format: thumbnailMetadata.format,
      sizeBytes: thumbnailStats.size,
    },
    processedAt: new Date().toISOString(),
  }
}
