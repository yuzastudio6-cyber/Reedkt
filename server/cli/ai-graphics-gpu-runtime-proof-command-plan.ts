import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  buildAiGraphicsGpuRuntimeProofCommandPlan,
  buildAiGraphicsGpuRuntimeProofNativeRunnerScript,
} from '../tool-registry/ai-graphics-gpu-runtime-proof-command-plan'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
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

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function jsonFilesInDirectory(directory: string): string[] {
  const resolvedDirectory = resolve(directory)
  if (!existsSync(resolvedDirectory)) {
    throw new Error(`Manifest directory does not exist: ${directory}`)
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

function manifestFilesFromArgs(): string[] {
  return [
    ...valuesAfterFlag('--manifest'),
    ...valuesAfterFlag('--manifest-file'),
    ...valuesAfterFlag('--manifest-dir').flatMap(jsonFilesInDirectory),
  ]
}

const manifestFiles = manifestFilesFromArgs()
const manifestRecords = manifestFiles.flatMap(recordsFromJsonFile)
const plan = buildAiGraphicsGpuRuntimeProofCommandPlan(manifestRecords)
const nativeRunnerScript = buildAiGraphicsGpuRuntimeProofNativeRunnerScript(plan)
const scriptOut = valueAfterFlag('--script-out')
if (scriptOut) {
  const resolvedScriptOut = resolve(scriptOut)
  mkdirSync(dirname(resolvedScriptOut), { recursive: true })
  writeFileSync(resolvedScriptOut, nativeRunnerScript, 'utf8')
  chmodSync(resolvedScriptOut, 0o700)
}
const output = {
  ...plan,
  input: {
    localPrivateManifestFilesRead: manifestFiles.length,
    privateArtifactRefsLogged: 0,
    commandPlanOnly: true,
    nativeRunnerScriptGenerated: Boolean(scriptOut),
    nativeRunnerScriptOutputPath: scriptOut ? resolve(scriptOut) : null,
    dockerExecuted: false,
    gpuRuntimeExecuted: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
  },
}

if (hasFlag('--emit-shell-script')) {
  process.stdout.write(nativeRunnerScript)
} else {
  console.log(JSON.stringify(output, null, 2))
}

if (manifestRecords.length > 0 && plan.nativeGpuProofInputStatus !== 'ready_for_native_gpu_runtime_probe_input') {
  process.exitCode = 2
}
