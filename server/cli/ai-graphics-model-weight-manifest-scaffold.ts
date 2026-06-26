import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightManifestScaffoldPacket,
} from '../tool-registry/ai-graphics-model-weight-manifest-scaffold'

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

const outputDirectory = valueAfterFlag('--out-dir')

if (!outputDirectory) {
  console.log(JSON.stringify({
    status: 'blocked_missing_out_dir',
    reason: 'Missing required --out-dir for local-only model manifest scaffold output.',
    localOnly: true,
    privateArtifactRefsLogged: 0,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    runtimeReadyNow: false,
  }, null, 2))
  process.exit(2)
}

const resolvedOutputDirectory = resolve(outputDirectory)
const force = hasFlag('--force')
const packet = buildAiGraphicsModelWeightManifestScaffoldPacket()
const writtenFiles: string[] = []
const skippedFiles: string[] = []

for (const record of packet.scaffoldRecords) {
  const filePath = join(resolvedOutputDirectory, record.relativeFilePath)
  mkdirSync(dirname(filePath), { recursive: true })

  if (existsSync(filePath) && !force) {
    skippedFiles.push(filePath)
    continue
  }

  writeFileSync(filePath, `${JSON.stringify(record.placeholderRecord, null, 2)}\n`, 'utf8')
  writtenFiles.push(filePath)
}

console.log(JSON.stringify({
  ...packet,
  output: {
    outDir: resolvedOutputDirectory,
    writtenFiles,
    skippedFiles,
    force,
    localOnly: true,
    privateArtifactRefsLogged: 0,
    scaffoldTemplatesAreReviewInvalid: true,
  },
}, null, 2))

if (skippedFiles.length > 0) {
  process.exitCode = 2
}
