import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightChecksumEvidencePacket,
  type AiGraphicsModelWeightChecksumEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-checksum-evidence'
import {
  buildAiGraphicsModelWeightManifestAuthoringDrafts,
  type AiGraphicsModelWeightManifestReviewSupplementRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-authoring'
import {
  buildAiGraphicsModelWeightManifestReviewPacket,
  type AiGraphicsModelWeightManifestEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-readiness'
import {
  buildAiGraphicsModelWeightManifestSupplementPacket,
} from '../tool-registry/ai-graphics-model-weight-manifest-supplement'
import {
  buildAiGraphicsModelWeightPrivateEvidenceIntakePacket,
} from '../tool-registry/ai-graphics-model-weight-private-evidence-intake'

type ChecksumEvidenceInput = Partial<AiGraphicsModelWeightChecksumEvidenceRecord>
type ManifestSupplementInput = Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>
type ManifestInput = Partial<AiGraphicsModelWeightManifestEvidenceRecord>

interface ChecksumEvidenceEnvelope {
  records?: ChecksumEvidenceInput[]
  checksumEvidence?: ChecksumEvidenceInput[]
}

interface ManifestSupplementEnvelope {
  records?: ManifestSupplementInput[]
  manifestSupplements?: ManifestSupplementInput[]
  supplements?: ManifestSupplementInput[]
}

interface ManifestEnvelope {
  records?: ManifestInput[]
  manifests?: ManifestInput[]
}

function valuesAfterFlag(flag: string): string[] {
  const values: string[] = []
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) values.push(process.argv[index + 1])
  }
  return values
}

function jsonFilesInDirectory(directory: string, ignoredFileNames: readonly string[] = []): string[] {
  if (!existsSync(directory)) throw new Error(`Input directory does not exist: ${directory}`)

  const files: string[] = []
  for (const entry of readdirSync(directory).sort()) {
    const entryPath = join(directory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath, ignoredFileNames))
    } else if (entry.endsWith('.json') && !ignoredFileNames.includes(entry)) {
      files.push(entryPath)
    }
  }
  return files
}

function readJsonFile<TRecord, TEnvelope>(
  filePath: string,
  arrayKeys: readonly (keyof TEnvelope)[],
): TRecord[] {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) throw new Error(`Input file does not exist: ${filePath}`)

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8')) as TRecord | TRecord[] | TEnvelope
  if (Array.isArray(parsed)) return parsed
  for (const key of arrayKeys) {
    const value = (parsed as TEnvelope)[key]
    if (Array.isArray(value)) return value as TRecord[]
  }
  return [parsed as TRecord]
}

function checksumEvidenceRecordsFromJsonFile(filePath: string): ChecksumEvidenceInput[] {
  return readJsonFile<ChecksumEvidenceInput, ChecksumEvidenceEnvelope>(
    filePath,
    ['records', 'checksumEvidence'],
  )
}

function manifestSupplementRecordsFromJsonFile(filePath: string): ManifestSupplementInput[] {
  return readJsonFile<ManifestSupplementInput, ManifestSupplementEnvelope>(
    filePath,
    ['records', 'manifestSupplements', 'supplements'],
  )
}

function manifestRecordsFromJsonFile(filePath: string): ManifestInput[] {
  return readJsonFile<ManifestInput, ManifestEnvelope>(filePath, ['records', 'manifests'])
}

function collectChecksumEvidenceRecords(): ChecksumEvidenceInput[] {
  const files = [
    ...valuesAfterFlag('--checksum-evidence'),
    ...valuesAfterFlag('--checksum-evidence-file'),
    ...valuesAfterFlag('--checksum-evidence-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, ['checksum-evidence-authoring-checklist.json'])),
  ]
  return files.flatMap(checksumEvidenceRecordsFromJsonFile)
}

function collectManifestSupplementRecords(): ManifestSupplementInput[] {
  const files = [
    ...valuesAfterFlag('--manifest-supplement'),
    ...valuesAfterFlag('--manifest-supplement-file'),
    ...valuesAfterFlag('--manifest-supplement-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, [
        'checksum-evidence-authoring-checklist.json',
        'manifest-authoring-checklist.json',
        'manifest-supplement-authoring-checklist.json',
      ])),
  ]
  return files.flatMap(manifestSupplementRecordsFromJsonFile)
}

function collectManifestRecords(): ManifestInput[] {
  const files = [
    ...valuesAfterFlag('--manifest'),
    ...valuesAfterFlag('--manifest-file'),
    ...valuesAfterFlag('--manifest-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, ['manifest-authoring-checklist.json'])),
  ]
  return files.flatMap(manifestRecordsFromJsonFile)
}

const checksumEvidenceRecords = collectChecksumEvidenceRecords()
const manifestSupplementRecords = collectManifestSupplementRecords()
const manifestRecords = collectManifestRecords()

const checksumEvidencePacket = buildAiGraphicsModelWeightChecksumEvidencePacket(checksumEvidenceRecords)
const manifestSupplementPacket = buildAiGraphicsModelWeightManifestSupplementPacket(manifestSupplementRecords)
const authoring = buildAiGraphicsModelWeightManifestAuthoringDrafts(
  checksumEvidenceRecords,
  manifestSupplementRecords,
)
const manifestReviewPacket = buildAiGraphicsModelWeightManifestReviewPacket(manifestRecords)
const packet = buildAiGraphicsModelWeightPrivateEvidenceIntakePacket({
  checksumEvidencePacket,
  manifestSupplementPacket,
  manifestAuthoringPacket: authoring.packet,
  manifestReviewPacket,
})

const output = {
  ...packet,
  input: {
    localPrivateChecksumEvidenceRecordsRead: checksumEvidenceRecords.length,
    localPrivateManifestSupplementRecordsRead: manifestSupplementRecords.length,
    localPrivateManifestRecordsRead: manifestRecords.length,
    privateArtifactRefsLogged: 0,
  },
}

console.log(JSON.stringify(output, null, 2))

const anyInputSupplied = checksumEvidenceRecords.length > 0 ||
  manifestSupplementRecords.length > 0 ||
  manifestRecords.length > 0
if (anyInputSupplied && !packet.booleans.readyForNativeGpuProofInput) {
  process.exitCode = 2
}
