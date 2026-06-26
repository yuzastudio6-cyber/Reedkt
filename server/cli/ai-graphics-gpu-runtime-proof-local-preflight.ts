import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsGpuRuntimeProofLocalPreflight,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-local-preflight'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-readiness'

interface ManifestEnvelope {
  records?: Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
  manifests?: Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
}

interface ProofResultEnvelope {
  results?: unknown[]
  profiles?: unknown[]
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
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

function jsonFilesInDirectory(directory: string, label: string): string[] {
  const resolvedDirectory = resolve(directory)
  if (!existsSync(resolvedDirectory)) {
    throw new Error(`${label} directory does not exist: ${directory}`)
  }

  const files: string[] = []
  for (const entry of readdirSync(resolvedDirectory).sort()) {
    const entryPath = join(resolvedDirectory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath, label))
    } else if (entry.endsWith('.json')) {
      files.push(entryPath)
    }
  }

  return files
}

function readJsonFile(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`JSON file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown
}

function manifestRecordsFromJsonFile(filePath: string): Partial<AiGraphicsModelWeightManifestEvidenceRecord>[] {
  const parsed = readJsonFile(filePath) as
    | Partial<AiGraphicsModelWeightManifestEvidenceRecord>
    | Partial<AiGraphicsModelWeightManifestEvidenceRecord>[]
    | ManifestEnvelope

  if (Array.isArray(parsed)) return parsed
  if (Array.isArray((parsed as ManifestEnvelope).records)) return (parsed as ManifestEnvelope).records ?? []
  if (Array.isArray((parsed as ManifestEnvelope).manifests)) return (parsed as ManifestEnvelope).manifests ?? []
  return [parsed as Partial<AiGraphicsModelWeightManifestEvidenceRecord>]
}

function proofResultsFromJsonFile(filePath: string): unknown[] {
  const parsed = readJsonFile(filePath)
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'object' && parsed !== null) {
    const envelope = parsed as ProofResultEnvelope
    if (Array.isArray(envelope.results)) return envelope.results
    if (Array.isArray(envelope.profiles)) return envelope.profiles
  }
  return [parsed]
}

const manifestFiles = [
  ...valuesAfterFlag('--manifest'),
  ...valuesAfterFlag('--manifest-file'),
  ...valuesAfterFlag('--manifest-dir').flatMap((directory) => jsonFilesInDirectory(directory, 'Manifest')),
]
const resultFiles = [
  ...valuesAfterFlag('--result'),
  ...valuesAfterFlag('--result-file'),
  ...valuesAfterFlag('--result-dir').flatMap((directory) => jsonFilesInDirectory(directory, 'Proof result')),
]

const manifestRecords = manifestFiles.flatMap(manifestRecordsFromJsonFile)
const proofResults = resultFiles.flatMap(proofResultsFromJsonFile)
const preflight = buildAiGraphicsGpuRuntimeProofLocalPreflight({
  manifestRecords,
  proofResults,
  localManifestFilesRead: manifestFiles.length,
  localProofResultFilesRead: resultFiles.length,
})

const output = {
  ...preflight,
  input: {
    localManifestFilesRead: manifestFiles.length,
    localProofResultFilesRead: resultFiles.length,
    localOnly: true,
    privateArtifactRefsLogged: 0,
    commandPlanOnly: true,
    dockerExecuted: false,
    gpuRuntimeExecuted: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (hasFlag('--require-ready-for-owner-review') && !preflight.allGpuRuntimeEvidenceReadyForOwnerReview) {
  process.exitCode = 2
} else if (hasFlag('--require-manifests-ready') && !preflight.modelManifestsReadyForGpuProof) {
  process.exitCode = 2
} else if (hasFlag('--require-results-ready') && !preflight.nativeGpuProofResultsAcceptedForOwnerReview) {
  process.exitCode = 2
}
