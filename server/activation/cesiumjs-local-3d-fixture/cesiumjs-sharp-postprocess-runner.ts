import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { cesiumJsLocal3DConfig } from './cesiumjs-local-3d-policy'
import type { ImageArtifactMetadata } from '../maplibre-local-render-fixture'
import type { SharpCesiumScreenshotProcessing } from './cesiumjs-local-3d-types'

export async function runCesiumJsSharpScreenshotProcessing(input: {
  screenshotPath: string
  outputRoot: string
}): Promise<SharpCesiumScreenshotProcessing> {
  const sharp = await loadSharp()
  const previewPath = path.join(input.outputRoot, 'cesiumjs-3d-preview.png')
  const thumbnailPath = path.join(input.outputRoot, 'cesiumjs-3d-thumbnail.png')
  await sharp(input.screenshotPath)
    .resize({ width: cesiumJsLocal3DConfig.previewMaxWidth, withoutEnlargement: true })
    .png()
    .toFile(previewPath)
  await sharp(input.screenshotPath)
    .resize({ width: cesiumJsLocal3DConfig.thumbnailWidth, withoutEnlargement: true })
    .png()
    .toFile(thumbnailPath)
  return {
    inputPath: input.screenshotPath,
    original: await imageMetadata(input.screenshotPath),
    preview: await imageMetadata(previewPath),
    thumbnail: await imageMetadata(thumbnailPath),
    processedAt: new Date().toISOString(),
    sharpVersion: await packageVersion('sharp'),
    remoteImagesFetched: false,
  }
}

async function imageMetadata(filePath: string): Promise<ImageArtifactMetadata> {
  const sharp = await loadSharp()
  const metadata = await sharp(filePath).metadata()
  const stats = await stat(filePath)
  return {
    path: filePath,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format,
    sizeBytes: stats.size,
    sha256: sha256File(filePath),
  }
}

async function packageVersion(packageName: string): Promise<string | undefined> {
  try {
    const packageJson = JSON.parse(readFileSync(`node_modules/${packageName}/package.json`, 'utf8')) as { version?: string }
    return packageJson.version
  } catch {
    return undefined
  }
}

async function loadSharp() {
  const module = await import('sharp')
  return module.default
}

function sha256File(filePath: string): string {
  const hash = createHash('sha256')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}
