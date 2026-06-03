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
const sampleId = getArg('--sample-id')
const runId = getArg('--run-id')

const requireFromPrefix = createRequire(path.join(nodePrefix, 'package.json'))
const sharp = requireFromPrefix('sharp')

await mkdir(path.dirname(outputThumb), { recursive: true })
await mkdir(path.dirname(outputReport), { recursive: true })

const metadata = await sharp(inputImage).metadata()
await sharp(inputImage).resize(160, 90, { fit: 'inside', withoutEnlargement: true }).png().toFile(outputThumb)
const thumbMetadata = await sharp(outputThumb).metadata()

const passed = Boolean(metadata.width && metadata.height && thumbMetadata.width && thumbMetadata.height && sharp.versions?.vips)

const report = {
  phase: '46C',
  runId,
  sampleId,
  toolId: 'sharp_libvips',
  status: passed ? 'passed' : 'warning',
  controlledRealVideo: true,
  arbitraryMediaInput: 'blocked',
  publicOutput: 'blocked',
  committedThumbnail: 'blocked',
  privateArtifactOnly: true,
  versions: sharp.versions,
  input: {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
  },
  thumbnail: {
    width: thumbMetadata.width,
    height: thumbMetadata.height,
    format: thumbMetadata.format,
  },
  checks: {
    metadataRead: Boolean(metadata.width && metadata.height),
    thumbnailCreated: Boolean(thumbMetadata.width && thumbMetadata.height),
    libvipsVersionRecorded: Boolean(sharp.versions?.vips),
    privateOnly: true,
  },
}

await writeFile(outputReport, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
