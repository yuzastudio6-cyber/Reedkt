import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { arch, platform } from 'node:os'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsGpuRuntimeProofLocalPreflight,
  type AiGraphicsGpuRuntimeProofHostEnvironment,
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

function commandOutput(command: string, args: string[] = []): { ok: boolean; stdout: string } {
  try {
    return {
      ok: true,
      stdout: execFileSync(command, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10_000,
      }).trim(),
    }
  } catch {
    return { ok: false, stdout: '' }
  }
}

function dockerRuntimeNames(): string[] {
  const result = commandOutput('docker', ['info', '--format', '{{json .Runtimes}}'])
  if (!result.ok || !result.stdout) return []

  try {
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>
    return Object.keys(parsed)
  } catch {
    return []
  }
}

function detectHostEnvironment(): AiGraphicsGpuRuntimeProofHostEnvironment {
  const hostPlatform = platform()
  const hostArch = arch()
  const dockerOsType = commandOutput('docker', ['info', '--format', '{{.OSType}}'])
  const dockerArchitecture = commandOutput('docker', ['info', '--format', '{{.Architecture}}'])
  const runtimeNames = dockerRuntimeNames()
  const nvidiaSmi = commandOutput('nvidia-smi', [
    '--query-gpu=name',
    '--format=csv,noheader',
  ])
  const nativeLinuxAmd64Host = hostPlatform === 'linux' && ['x64', 'amd64'].includes(hostArch)
  const dockerAvailable = dockerOsType.ok && dockerArchitecture.ok
  const dockerLinuxAmd64 = dockerOsType.stdout === 'linux' &&
    ['x86_64', 'amd64'].includes(dockerArchitecture.stdout)
  const dockerNvidiaRuntimeAvailable = runtimeNames.includes('nvidia')
  const nvidiaSmiAvailable = nvidiaSmi.ok && nvidiaSmi.stdout.length > 0
  const blockers = [
    !nativeLinuxAmd64Host
      ? `Host must be native linux/amd64 for proof; detected ${hostPlatform}/${hostArch}.`
      : undefined,
    !dockerAvailable ? 'Docker is not available for native GPU proof.' : undefined,
    dockerAvailable && !dockerLinuxAmd64
      ? `Docker proof runtime must be linux/amd64; detected ${dockerOsType.stdout || 'unknown'}/${dockerArchitecture.stdout || 'unknown'}.`
      : undefined,
    !dockerNvidiaRuntimeAvailable ? 'Docker NVIDIA runtime is not available.' : undefined,
    !nvidiaSmiAvailable ? 'nvidia-smi did not report an NVIDIA GPU.' : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    checkMode: 'detected',
    platform: hostPlatform,
    arch: hostArch,
    dockerAvailable,
    dockerOsType: dockerOsType.ok ? dockerOsType.stdout : null,
    dockerArchitecture: dockerArchitecture.ok ? dockerArchitecture.stdout : null,
    dockerNvidiaRuntimeAvailable,
    nvidiaSmiAvailable,
    nvidiaGpuName: nvidiaSmiAvailable ? nvidiaSmi.stdout.split('\n')[0] ?? null : null,
    nativeLinuxAmd64Host,
    hostEligibleForNativeGpuProof: blockers.length === 0,
    blockers,
  }
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
const hostEnvironment = hasFlag('--detect-host') ? detectHostEnvironment() : undefined
const preflight = buildAiGraphicsGpuRuntimeProofLocalPreflight({
  manifestRecords,
  proofResults,
  localManifestFilesRead: manifestFiles.length,
  localProofResultFilesRead: resultFiles.length,
  hostEnvironment,
})

const output = {
  ...preflight,
  input: {
    localManifestFilesRead: manifestFiles.length,
    localProofResultFilesRead: resultFiles.length,
    localOnly: true,
    privateArtifactRefsLogged: 0,
    commandPlanOnly: true,
    hostDetectionRequested: hasFlag('--detect-host'),
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
} else if (hasFlag('--require-host-eligible') && !preflight.hostEnvironment.hostEligibleForNativeGpuProof) {
  process.exitCode = 2
}
