import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  buildAiGraphicsModelWeightManifestAuthoringDrafts,
  type AiGraphicsModelWeightManifestReviewSupplementRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-authoring'
import type { AiGraphicsModelWeightChecksumEvidenceRecord } from '../tool-registry/ai-graphics-model-weight-checksum-evidence'

type ChecksumEvidenceInput = Partial<AiGraphicsModelWeightChecksumEvidenceRecord>
type ManifestSupplementInput = Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>

interface ChecksumEvidenceEnvelope {
  records?: ChecksumEvidenceInput[]
  checksumEvidence?: ChecksumEvidenceInput[]
}

interface ManifestSupplementEnvelope {
  records?: ManifestSupplementInput[]
  manifestSupplements?: ManifestSupplementInput[]
  supplements?: ManifestSupplementInput[]
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

function jsonFilesInDirectory(directory: string, ignoredFileNames: readonly string[] = []): string[] {
  if (!existsSync(directory)) {
    throw new Error(`Input directory does not exist: ${directory}`)
  }

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

function checksumEvidenceRecordsFromJsonFile(filePath: string): ChecksumEvidenceInput[] {
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

function manifestSupplementRecordsFromJsonFile(filePath: string): ManifestSupplementInput[] {
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

function collectChecksumEvidenceRecords(): ChecksumEvidenceInput[] {
  const evidenceFiles = [
    ...valuesAfterFlag('--evidence'),
    ...valuesAfterFlag('--evidence-file'),
    ...valuesAfterFlag('--evidence-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, ['checksum-evidence-authoring-checklist.json'])),
  ]

  return evidenceFiles.flatMap(checksumEvidenceRecordsFromJsonFile)
}

function collectManifestSupplementRecords(): ManifestSupplementInput[] {
  const supplementFiles = [
    ...valuesAfterFlag('--supplement'),
    ...valuesAfterFlag('--supplement-file'),
    ...valuesAfterFlag('--supplement-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, [
        'checksum-evidence-authoring-checklist.json',
        'manifest-authoring-checklist.json',
        'manifest-supplement-authoring-checklist.json',
      ])),
  ]

  return supplementFiles.flatMap(manifestSupplementRecordsFromJsonFile)
}

function writeDrafts(
  outDir: string,
  drafts: ReturnType<typeof buildAiGraphicsModelWeightManifestAuthoringDrafts>['drafts'],
  relativeFilePaths: ReturnType<typeof buildAiGraphicsModelWeightManifestAuthoringDrafts>['draftRelativeFilePaths'],
): number {
  const resolvedOutDir = resolve(outDir)
  let written = 0

  for (const draft of drafts) {
    const relativePath = relativeFilePaths[draft.toolId]
    const outputPath = join(resolvedOutDir, relativePath)
    if (existsSync(outputPath) && !hasFlag('--force')) {
      throw new Error(`Refusing to overwrite local manifest draft without --force: ${relativePath}`)
    }
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf8')
    written += 1
  }

  return written
}

const checksumEvidenceRecords = collectChecksumEvidenceRecords()
const manifestSupplements = collectManifestSupplementRecords()
const authoring = buildAiGraphicsModelWeightManifestAuthoringDrafts(checksumEvidenceRecords, manifestSupplements)
const outDir = valuesAfterFlag('--out-dir')[0]
let localPrivateManifestDraftFilesWritten = 0

if (outDir) {
  if (authoring.packet.localPrivateManifestDraftsReady !== 5) {
    process.exitCode = 2
  } else {
    localPrivateManifestDraftFilesWritten = writeDrafts(outDir, authoring.drafts, authoring.draftRelativeFilePaths)
  }
}

const output = {
  ...authoring.packet,
  input: {
    localPrivateChecksumEvidenceFilesRead: valuesAfterFlag('--evidence').length +
      valuesAfterFlag('--evidence-file').length +
      valuesAfterFlag('--evidence-dir').reduce((count, directory) =>
        count + jsonFilesInDirectory(directory, ['checksum-evidence-authoring-checklist.json']).length, 0),
    localPrivateManifestSupplementFilesRead: valuesAfterFlag('--supplement').length +
      valuesAfterFlag('--supplement-file').length +
      valuesAfterFlag('--supplement-dir').reduce((count, directory) =>
        count + jsonFilesInDirectory(directory, [
          'checksum-evidence-authoring-checklist.json',
          'manifest-authoring-checklist.json',
        ]).length, 0),
    localPrivateManifestDraftFilesWritten,
    privateArtifactRefsLogged: 0,
  },
}

console.log(JSON.stringify(output, null, 2))

const anyInputSupplied = checksumEvidenceRecords.length > 0 || manifestSupplements.length > 0
if (anyInputSupplied && authoring.packet.localPrivateManifestDraftsReady !== 5) {
  process.exitCode = 2
}
