import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-readiness'

type ManifestInput = Partial<AiGraphicsModelWeightManifestEvidenceRecord>

interface ManifestEnvelope {
  records?: ManifestInput[]
  manifests?: ManifestInput[]
}

function valuesAfterFlag(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) {
      values.push(process.argv[index + 1])
    }
  }
  return values
}

function jsonFilesInDirectory(directory: string): string[] {
  if (!existsSync(directory)) {
    throw new Error(`Manifest directory does not exist: ${directory}`)
  }

  const files: string[] = []
  for (const entry of readdirSync(directory).sort()) {
    const entryPath = join(directory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath))
    } else if (entry.endsWith('.json')) {
      files.push(entryPath)
    }
  }

  return files
}

function recordsFromJsonFile(filePath: string): ManifestInput[] {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Manifest file does not exist: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8')) as ManifestInput | ManifestInput[] | ManifestEnvelope
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (Array.isArray((parsed as ManifestEnvelope).records)) {
    return (parsed as ManifestEnvelope).records ?? []
  }
  if (Array.isArray((parsed as ManifestEnvelope).manifests)) {
    return (parsed as ManifestEnvelope).manifests ?? []
  }

  return [parsed as ManifestInput]
}

function collectManifestRecords(): ManifestInput[] {
  const manifestFiles = [
    ...valuesAfterFlag('--manifest'),
    ...valuesAfterFlag('--manifest-file'),
    ...valuesAfterFlag('--manifest-dir').flatMap(jsonFilesInDirectory),
  ]

  return manifestFiles.flatMap(recordsFromJsonFile)
}

const manifestRecords = collectManifestRecords()
const packet = buildAiGraphicsModelWeightManifestReviewPacket(manifestRecords)
const output = {
  ...packet,
  input: {
    localPrivateManifestFilesRead: valuesAfterFlag('--manifest').length +
      valuesAfterFlag('--manifest-file').length +
      valuesAfterFlag('--manifest-dir').reduce((count, directory) => count + jsonFilesInDirectory(directory).length, 0),
    privateArtifactRefsLogged: 0,
  },
}

console.log(JSON.stringify(output, null, 2))

const allRequiredRecordsAccepted = packet.manifestRecordsProvided === 5 &&
  packet.schemaValidManifestRecords === 5 &&
  packet.reviewAcceptedManifestRecords === 5 &&
  packet.nativeGpuProofInputEligibleRecords === 5

if (manifestRecords.length > 0 && !allRequiredRecordsAccepted) {
  process.exitCode = 2
}
