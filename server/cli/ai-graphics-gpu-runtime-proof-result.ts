import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsGpuRuntimeProofResultPacket,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-result'

interface ProofResultEnvelope {
  results?: unknown[]
  profiles?: unknown[]
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
  const resolvedDirectory = resolve(directory)
  if (!existsSync(resolvedDirectory)) {
    throw new Error(`Proof result directory does not exist: ${directory}`)
  }

  const files: string[] = []
  for (const entry of readdirSync(resolvedDirectory).sort()) {
    const entryPath = join(resolvedDirectory, entry)
    const stats = statSync(entryPath)
    if (stats.isDirectory()) {
      files.push(...jsonFilesInDirectory(entryPath))
    } else if (entry.endsWith('.json')) {
      files.push(entryPath)
    }
  }

  return files
}

function proofResultsFromJsonFile(filePath: string): unknown[] {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Proof result file does not exist: ${filePath}`)
  }

  const parsed = JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (typeof parsed === 'object' && parsed !== null) {
    const envelope = parsed as ProofResultEnvelope
    if (Array.isArray(envelope.results)) {
      return envelope.results
    }
    if (Array.isArray(envelope.profiles)) {
      return envelope.profiles
    }
  }

  return [parsed]
}

function proofResultFilesFromArgs(): string[] {
  return [
    ...valuesAfterFlag('--result'),
    ...valuesAfterFlag('--result-file'),
    ...valuesAfterFlag('--result-dir').flatMap(jsonFilesInDirectory),
  ]
}

const proofResultFiles = proofResultFilesFromArgs()
const proofResults = proofResultFiles.flatMap(proofResultsFromJsonFile)
const packet = buildAiGraphicsGpuRuntimeProofResultPacket(proofResults)
const output = {
  ...packet,
  input: {
    localProofResultFilesRead: proofResultFiles.length,
    privateArtifactRefsLogged: 0,
    validatorOnly: true,
    dockerExecuted: false,
    gpuRuntimeExecuted: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    mediaProcessingPerformed: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (proofResults.length > 0 && !packet.nativeGpuRuntimeProofResultsAccepted) {
  process.exitCode = 2
}
