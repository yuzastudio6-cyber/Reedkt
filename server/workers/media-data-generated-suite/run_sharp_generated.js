import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function getArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || index + 1 >= process.argv.length) throw new Error(`${name} is required`)
  return process.argv[index + 1]
}

const inputImage = getArg('--input-image')
const outputThumb = getArg('--output-thumb')
const outputReport = getArg('--output-report')
const nodePrefix = getArg('--sharp-node-prefix')

const requireFromPrefix = createRequire(path.join(nodePrefix, 'package.json'))
const sharp = requireFromPrefix('sharp')

await mkdir(path.dirname(outputThumb), { recursive: true })
await mkdir(path.dirname(outputReport), { recursive: true })

const metadata = await sharp(inputImage).metadata()
await sharp(inputImage).resize(80, 60, { fit: 'fill' }).png().toFile(outputThumb)
const thumbMetadata = await sharp(outputThumb).metadata()

const passed = metadata.width === 320
  && metadata.height === 240
  && thumbMetadata.width === 80
  && thumbMetadata.height === 60

const report = {
  fixtureId: 'generated-thumbnail-sharp-libvips',
  toolId: 'sharp_libvips',
  status: passed ? 'passed' : 'failed',
  generatedOnly: true,
  realMedia: 'not_used',
  frontendImport: 'not_used',
  versions: sharp.versions,
  input: {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  },
  thumbnail: {
    width: thumbMetadata.width,
    height: thumbMetadata.height,
    format: thumbMetadata.format,
  },
  checks: {
    metadataRead: Boolean(metadata.width && metadata.height),
    thumbnailDimensionsMatch: thumbMetadata.width === 80 && thumbMetadata.height === 60,
    libvipsVersionRecorded: Boolean(sharp.versions?.vips),
  },
}

await writeFile(outputReport, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
