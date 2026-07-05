import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import {
  buildAiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket,
  listAiGraphicsExternalBetaCloudRunProofProfiles,
} from '../tool-registry/ai-graphics-external-beta-native-gpu-proof-cloud-run-result-collector.ts'
import type { AiGraphicsGpuRuntimeProofProfileId } from '../tool-registry/ai-graphics-gpu-runtime-proof-result.ts'

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function requiredStringFlag(flag: string): string {
  const value = stringFlag(flag)
  if (!value) throw new Error(`Missing required flag: ${flag}`)
  return value
}

function readJsonFile<T>(flag: string): T | undefined {
  const packetPath = stringFlag(flag)
  if (!packetPath) return undefined
  return JSON.parse(readFileSync(packetPath, 'utf8')) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonCandidate(candidate: string): unknown | null {
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function candidatePayloadsFromLine(line: string): unknown[] {
  const candidates: unknown[] = []
  const trimmed = line.trim()
  if (!trimmed) return candidates

  const direct = parseJsonCandidate(trimmed)
  if (direct !== null) candidates.push(direct)

  const firstBrace = line.indexOf('{')
  const lastBrace = line.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const embedded = parseJsonCandidate(line.slice(firstBrace, lastBrace + 1))
    if (embedded !== null) candidates.push(embedded)
  }

  return candidates
}

function unwrapCloudRunPayload(payload: unknown): unknown[] {
  if (!isRecord(payload)) return [payload]
  const nested: unknown[] = [payload]
  for (const key of ['textPayload', 'message', 'log', 'jsonPayload']) {
    const value = payload[key]
    if (typeof value === 'string') {
      const parsed = parseJsonCandidate(value)
      if (parsed !== null) nested.push(parsed)
    } else if (isRecord(value)) {
      nested.push(value)
    }
  }
  return nested
}

function isProofResultForProfile(payload: unknown, profile: AiGraphicsGpuRuntimeProofProfileId): boolean {
  return isRecord(payload) &&
    payload.status === 'passed' &&
    payload.profile === profile &&
    isRecord(payload.proofMetadata) &&
    payload.proofMetadata.probeName === 'reeditpro_ai_graphics_gpu_runtime_readiness' &&
    payload.proofMetadata.probeVersion === '2026-06-26.native-gpu-proof-v1'
}

function proofResultFromLog(logPath: string, profile: AiGraphicsGpuRuntimeProofProfileId): unknown {
  if (!existsSync(logPath)) {
    throw new Error(`Missing Cloud Run proof log for ${profile}: ${logPath}`)
  }

  const text = readFileSync(logPath, 'utf8')
  const matches: unknown[] = []
  const seenMatches = new Set<string>()
  for (const line of text.split(/\r?\n/)) {
    for (const payload of candidatePayloadsFromLine(line)) {
      for (const unwrapped of unwrapCloudRunPayload(payload)) {
        if (isProofResultForProfile(unwrapped, profile)) {
          const fingerprint = JSON.stringify(unwrapped)
          if (!seenMatches.has(fingerprint)) {
            seenMatches.add(fingerprint)
            matches.push(unwrapped)
          }
        }
      }
    }
  }

  if (matches.length === 0) {
    throw new Error(`No approved GPU runtime readiness JSON found in ${basename(logPath)} for ${profile}`)
  }
  if (matches.length > 1) {
    throw new Error(`Expected one GPU runtime readiness JSON in ${basename(logPath)} for ${profile}, found ${matches.length}`)
  }

  return matches[0]
}

const sourceCloudRunJobScaffold = readJsonFile<{
  decision?: string
  currentStatus?: string
  sourceOperatorHandoffBridgeAccepted?: boolean
  booleans?: {
    sourceNativeGpuProofCollectionBridgeAccepted?: boolean
  }
}>('--source-cloud-run-job-scaffold-packet')
const logsDirectory = resolve(requiredStringFlag('--logs-dir'))
const outputDirectory = resolve(requiredStringFlag('--out-dir'))
mkdirSync(outputDirectory, { recursive: true })

const packet = buildAiGraphicsExternalBetaNativeGpuProofCloudRunResultCollectorPacket({
  sourceCloudRunJobScaffoldPacket: sourceCloudRunJobScaffold,
  sourceCloudRunJobScaffoldDecision: sourceCloudRunJobScaffold?.decision,
  sourceCloudRunJobScaffoldStatus: sourceCloudRunJobScaffold?.currentStatus,
  logsDirectory,
  outputDirectory,
})

const extractedFiles: Record<string, string> = {}
for (const profile of listAiGraphicsExternalBetaCloudRunProofProfiles()) {
  const logPath = join(logsDirectory, `native-gpu-profile-${profile}-logs.txt`)
  const result = proofResultFromLog(logPath, profile)
  const outputPath = join(outputDirectory, `native-gpu-profile-${profile}.json`)
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  extractedFiles[profile] = outputPath
}

const collectorPacket = {
  ...packet,
  input: {
    logsDirectory,
    outputDirectory,
    sourceCloudRunJobScaffoldPacketRead: Boolean(sourceCloudRunJobScaffold),
  },
  extractedProfileResults: extractedFiles,
  counts: {
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: 8,
    runtimeProfilesRequired: packet.runtimeProfilesRequired.length,
    runtimeProfilesExtracted: Object.keys(extractedFiles).length,
    cloudRunDeploymentPerformed: 0,
    cloudRunJobExecutionPerformed: 0,
  },
}
writeFileSync(packet.outputFiles.collectorPacket, `${JSON.stringify(collectorPacket, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({
  decision: packet.decision,
  currentStatus: packet.currentStatus,
  collectorPacket: packet.outputFiles.collectorPacket,
  extractedProfileResults: extractedFiles,
  runtimeProfilesExtracted: Object.keys(extractedFiles).length,
  followUpValidationCommand: packet.followUpValidationCommand,
  sourceCloudRunJobScaffoldAccepted: packet.booleans.sourceCloudRunJobScaffoldAccepted,
  sourceNativeGpuProofCollectionBridgeAccepted:
    packet.booleans.sourceNativeGpuProofCollectionBridgeAccepted,
  cloudRunDeploymentPerformed: false,
  cloudRunJobExecutionPerformed: false,
  gpuRuntimePerformed: false,
  modelWeightsDownloaded: false,
  modelWeightsLoaded: false,
  modelInferencePerformed: false,
  mediaProcessingPerformed: false,
  publicArtifactCreated: false,
  signedUrlCreated: false,
}, null, 2))
