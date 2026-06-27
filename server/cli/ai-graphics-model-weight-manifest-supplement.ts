import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightManifestSupplementPacket,
} from '../tool-registry/ai-graphics-model-weight-manifest-supplement'
import type {
  AiGraphicsModelWeightManifestReviewSupplementRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-authoring'

type ManifestSupplementInput = Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>

interface ManifestSupplementEnvelope {
  records?: ManifestSupplementInput[]
  manifestSupplements?: ManifestSupplementInput[]
  supplements?: ManifestSupplementInput[]
}

const ignoredSupportFiles = [
  'checksum-evidence-authoring-checklist.json',
  'manifest-authoring-checklist.json',
  'manifest-supplement-authoring-checklist.json',
]

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
    throw new Error(`Manifest supplement directory does not exist: ${directory}`)
  }

  const files: string[] = []
  for (const entry of readdirSync(directory).sort()) {
    const entryPath = join(directory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath))
    } else if (entry.endsWith('.json') && !ignoredSupportFiles.includes(entry)) {
      files.push(entryPath)
    }
  }

  return files
}

function recordsFromJsonFile(filePath: string): ManifestSupplementInput[] {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Manifest supplement file does not exist: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8')) as
    | ManifestSupplementInput
    | ManifestSupplementInput[]
    | ManifestSupplementEnvelope
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (Array.isArray((parsed as ManifestSupplementEnvelope).records)) {
    return (parsed as ManifestSupplementEnvelope).records ?? []
  }
  if (Array.isArray((parsed as ManifestSupplementEnvelope).manifestSupplements)) {
    return (parsed as ManifestSupplementEnvelope).manifestSupplements ?? []
  }
  if (Array.isArray((parsed as ManifestSupplementEnvelope).supplements)) {
    return (parsed as ManifestSupplementEnvelope).supplements ?? []
  }

  return [parsed as ManifestSupplementInput]
}

function collectManifestSupplementRecords(): ManifestSupplementInput[] {
  const supplementFiles = [
    ...valuesAfterFlag('--supplement'),
    ...valuesAfterFlag('--supplement-file'),
    ...valuesAfterFlag('--supplement-dir').flatMap(jsonFilesInDirectory),
  ]

  return supplementFiles.flatMap(recordsFromJsonFile)
}

const supplementRecords = collectManifestSupplementRecords()
const packet = buildAiGraphicsModelWeightManifestSupplementPacket(supplementRecords)
const output = {
  ...packet,
  input: {
    localPrivateManifestSupplementFilesRead: valuesAfterFlag('--supplement').length +
      valuesAfterFlag('--supplement-file').length +
      valuesAfterFlag('--supplement-dir').reduce((count, directory) => count + jsonFilesInDirectory(directory).length, 0),
    privateArtifactRefsLogged: 0,
  },
}

console.log(JSON.stringify(output, null, 2))

const allRequiredRecordsAccepted = packet.manifestSupplementRecordsProvided === 5 &&
  packet.manifestSupplementRecordsAccepted === 5 &&
  packet.manifestAuthoringEligibleRecords === 5

if (supplementRecords.length > 0 && !allRequiredRecordsAccepted) {
  process.exitCode = 2
}
