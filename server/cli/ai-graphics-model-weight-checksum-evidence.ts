import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightChecksumEvidencePacket,
  type AiGraphicsModelWeightChecksumEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-checksum-evidence'

type ChecksumEvidenceInput = Partial<AiGraphicsModelWeightChecksumEvidenceRecord>

interface ChecksumEvidenceEnvelope {
  records?: ChecksumEvidenceInput[]
  checksumEvidence?: ChecksumEvidenceInput[]
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

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function jsonFilesInDirectory(directory: string): string[] {
  if (!existsSync(directory)) {
    throw new Error(`Checksum evidence directory does not exist: ${directory}`)
  }

  const files: string[] = []
  for (const entry of readdirSync(directory).sort()) {
    const entryPath = join(directory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath))
    } else if (entry.endsWith('.json') && entry !== 'checksum-evidence-authoring-checklist.json') {
      files.push(entryPath)
    }
  }

  return files
}

function recordsFromJsonFile(filePath: string): ChecksumEvidenceInput[] {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Checksum evidence file does not exist: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8')) as
    | ChecksumEvidenceInput
    | ChecksumEvidenceInput[]
    | ChecksumEvidenceEnvelope
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (Array.isArray((parsed as ChecksumEvidenceEnvelope).records)) {
    return (parsed as ChecksumEvidenceEnvelope).records ?? []
  }
  if (Array.isArray((parsed as ChecksumEvidenceEnvelope).checksumEvidence)) {
    return (parsed as ChecksumEvidenceEnvelope).checksumEvidence ?? []
  }

  return [parsed as ChecksumEvidenceInput]
}

function collectChecksumEvidenceRecords(): ChecksumEvidenceInput[] {
  const evidenceFiles = [
    ...valuesAfterFlag('--evidence'),
    ...valuesAfterFlag('--evidence-file'),
    ...valuesAfterFlag('--evidence-dir').flatMap(jsonFilesInDirectory),
  ]

  return evidenceFiles.flatMap(recordsFromJsonFile)
}

const evidenceRecords = collectChecksumEvidenceRecords()
const packet = buildAiGraphicsModelWeightChecksumEvidencePacket(evidenceRecords)
const allowPartial = hasFlag('--allow-partial')
const providedToolIds = new Set<string>(evidenceRecords.flatMap((record) =>
  typeof record.toolId === 'string' && record.toolId.length > 0 ? [record.toolId] : []))
const providedResults = packet.validationResults.filter((result) =>
  typeof result.toolId === 'string' && providedToolIds.has(result.toolId))
const allProvidedRecordsAccepted = evidenceRecords.length > 0 &&
  providedToolIds.size === evidenceRecords.length &&
  providedResults.length === providedToolIds.size &&
  providedResults.every((result) => result.reviewAccepted && result.eligibleForPrivateManifestAuthoring)
const output = {
  ...packet,
  input: {
    localPrivateChecksumEvidenceFilesRead: valuesAfterFlag('--evidence').length +
      valuesAfterFlag('--evidence-file').length +
      valuesAfterFlag('--evidence-dir').reduce((count, directory) => count + jsonFilesInDirectory(directory).length, 0),
    privateArtifactRefsLogged: 0,
    partialModeAllowed: allowPartial,
    partialValidationAccepted: allowPartial && allProvidedRecordsAccepted,
  },
}

console.log(JSON.stringify(output, null, 2))

const allRequiredRecordsAccepted = packet.checksumEvidenceRecordsProvided === 5 &&
  packet.checksumEvidenceRecordsAccepted === 5 &&
  packet.manifestAuthoringEligibleRecords === 5

if (evidenceRecords.length > 0 && !allRequiredRecordsAccepted) {
  process.exitCode = allowPartial && allProvidedRecordsAccepted ? 0 : 2
}
