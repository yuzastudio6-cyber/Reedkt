import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  buildAiGraphicsBetaEvidenceLocalAssembly,
  type AiGraphicsBetaEvidenceLocalAssemblyInput,
} from '../tool-registry/ai-graphics-beta-evidence-local-assembly'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
} from '../tool-registry/ai-graphics-model-weight-manifest-readiness'

type ManifestInput = Partial<AiGraphicsModelWeightManifestEvidenceRecord>

interface ManifestEnvelope {
  records?: ManifestInput[]
  manifests?: ManifestInput[]
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

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
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

function readJsonPath(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function manifestRecordsFromJsonFile(filePath: string): ManifestInput[] {
  const parsed = readJsonPath(filePath) as ManifestInput | ManifestInput[] | ManifestEnvelope
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray((parsed as ManifestEnvelope).records)) return (parsed as ManifestEnvelope).records ?? []
  if (Array.isArray((parsed as ManifestEnvelope).manifests)) return (parsed as ManifestEnvelope).manifests ?? []
  return [parsed as ManifestInput]
}

function proofResultsFromJsonFile(filePath: string): unknown[] {
  const parsed = readJsonPath(filePath)
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'object' && parsed !== null) {
    const envelope = parsed as ProofResultEnvelope
    if (Array.isArray(envelope.results)) return envelope.results
    if (Array.isArray(envelope.profiles)) return envelope.profiles
  }
  return [parsed]
}

function manifestFilesFromArgs(): string[] {
  return [
    ...valuesAfterFlag('--manifest'),
    ...valuesAfterFlag('--manifest-file'),
    ...valuesAfterFlag('--manifest-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, 'Manifest')),
  ]
}

function resultFilesFromArgs(): string[] {
  return [
    ...valuesAfterFlag('--result'),
    ...valuesAfterFlag('--result-file'),
    ...valuesAfterFlag('--result-dir').flatMap((directory) =>
      jsonFilesInDirectory(directory, 'Proof result')),
  ]
}

function readOptionalJsonFile(flag: string): Record<string, unknown> | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined
  const parsed = readJsonPath(filePath)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet for ${flag} must be a JSON object: ${filePath}`)
  }
  return parsed as Record<string, unknown>
}

function readProofPacket(flag: string, committedPath: string): Record<string, unknown> | undefined {
  const fromFlag = readOptionalJsonFile(flag)
  if (fromFlag) return fromFlag
  if (hasFlag('--use-committed-js-runtime-proofs')) {
    return readJsonPath(committedPath) as Record<string, unknown>
  }
  return undefined
}

const manifestFiles = manifestFilesFromArgs()
const resultFiles = resultFilesFromArgs()
const allSharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allTechnicalGatesPassed = allSharedGatesPassed || hasFlag('--all-technical-gates-passed')

const input: AiGraphicsBetaEvidenceLocalAssemblyInput = {
  manifestRecords: manifestFiles.flatMap(manifestRecordsFromJsonFile),
  gpuRuntimeProofResults: resultFiles.flatMap(proofResultsFromJsonFile),
  approvedPlanSnapshotGatePassed: allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
  creditReservationGatePassed: allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
  artifactBoundaryGatePassed: allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
  toolRouteGatePassed: allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
  workerGatePassed: allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
  browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
  internalBetaOwnerApprovalGranted: allSharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
  nodeRuntimeProofPacket: readProofPacket(
    '--node-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
  ),
  browserRuntimeProofPacket: readProofPacket(
    '--browser-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
  ),
  satoriFontRuntimeProofPacket: readProofPacket(
    '--satori-font-runtime-proof-packet',
    'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
  ),
}

const assembly = buildAiGraphicsBetaEvidenceLocalAssembly(input)
const output = {
  ...assembly,
  input: {
    validatorOnly: true,
    localPrivateManifestFilesRead: manifestFiles.length,
    localGpuRuntimeProofResultFilesRead: resultFiles.length,
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
    privateArtifactRefsLogged: 0,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (hasFlag('--require-all-21-beta-ready') && !assembly.betaEvidenceBundle.all21BetaEvidenceReady) {
  process.exitCode = 2
}

if (
  hasFlag('--require-ready-for-owner-gate') &&
  !assembly.betaEvidenceBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval
) {
  process.exitCode = 2
}
