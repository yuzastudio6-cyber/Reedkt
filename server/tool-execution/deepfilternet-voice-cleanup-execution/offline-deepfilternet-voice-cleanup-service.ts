import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime, runOfflineDeepFilterNetVoiceCleanupContainer } from './offline-deepfilternet-voice-cleanup-docker-runtime'
import {
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_CONTAINER_PROTOCOL,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY,
  OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS,
  offlineDeepFilterNetVoiceCleanupRequestSha256,
  validateOfflineDeepFilterNetVoiceCleanupRequest,
} from './offline-deepfilternet-voice-cleanup-protocol'
import type { OfflineDeepFilterNetVoiceCleanupExecutionResult, OfflineDeepFilterNetVoiceCleanupImageEvidence, OfflineDeepFilterNetVoiceCleanupRuntimeAuthority } from './offline-deepfilternet-voice-cleanup-types'

export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_STORAGE_ROOT = '/tmp/reeditpro-offline-deepfilternet-voice-cleanup-execution' as const
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_AUTHORITY_PATH = 'runtime-authority/offline-deepfilternet-voice-cleanup-runtime-v1.json' as const
const BLOCKERS = Object.freeze([
  'This exact operation is confined private/local server-owned fixture evidence; arbitrary user audio ingestion, decoding, storage, malware scanning, privacy review, distributed worker identity, observability, recovery, and deployment remain separate gates.',
  'The current proven dependency closure is ARM64 CPU-only; an independently hash-pinned x86_64 image, production worker capacity benchmark, and multi-architecture manifest remain required.',
  'DeepFilterNet, DeepFilterLib, Torch, Torchaudio, the DeepFilterNet3 checkpoint, synthetic voice fixture, and dependency closure still require final security, compatibility, audio-naturalness, attribution, and production license review.',
] as const)

export interface PrivateOfflineDeepFilterNetVoiceCleanupRuntime {
  readonly image: OfflineDeepFilterNetVoiceCleanupImageEvidence
  execute(value: unknown): Promise<OfflineDeepFilterNetVoiceCleanupExecutionResult>
}

export async function activatePrivateOfflineDeepFilterNetVoiceCleanupRuntime(): Promise<PrivateOfflineDeepFilterNetVoiceCleanupRuntime> {
  if (arguments.length !== 0) throw invalid('DeepFilterNet runtime activation accepts no caller input.')
  const image = await inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime()
  await persistAuthority(image)
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function openPrivateOfflineDeepFilterNetVoiceCleanupRuntime(): Promise<PrivateOfflineDeepFilterNetVoiceCleanupRuntime> {
  if (arguments.length !== 0) throw invalid('DeepFilterNet runtime open accepts no caller input.')
  const authority = await readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority()
  if (!authority) throw notReady('Verified private DeepFilterNet runtime authority is unavailable.')
  const image = await inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) throw notReady('Private DeepFilterNet image changed after activation.')
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function executePrivateOfflineDeepFilterNetVoiceCleanup(value: unknown): Promise<OfflineDeepFilterNetVoiceCleanupExecutionResult> {
  return executeWithImage(await inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime(), value)
}

export async function readPersistedOfflineDeepFilterNetVoiceCleanupRuntimeAuthority(): Promise<OfflineDeepFilterNetVoiceCleanupRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_STORAGE_ROOT, relativePath: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw notReady('Private DeepFilterNet authority is invalid JSON.') }
  const envelope = record(parsed)
  const authority = record(envelope.authority)
  if (envelope.recordVersion !== 'offline-deepfilternet-voice-cleanup-runtime-authority-record-v1' || envelope.source !== 'private_local_checksum_protected_deepfilternet_voice_cleanup_runtime' || envelope.checksumSha256 !== sha256AuthorityValue(authority)) throw notReady('Private DeepFilterNet authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  const readiness = record(authority.readiness)
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-deepfilternet-voice-cleanup-runtime-authority-v1' ||
    authority.source !== 'private_local_offline_deepfilternet_voice_cleanup_runtime_authority' ||
    readiness.privateInternalExecutionReady !== true || readiness.exactStructuredPayloadOnly !== true ||
    readiness.modelAndLicenseReviewStillRequiredForProduction !== true ||
    readiness.productReady !== false || readiness.externalBetaReady !== false || readiness.productionReady !== false
  ) throw notReady('Private DeepFilterNet authority boundary is invalid.')
  return authority as unknown as OfflineDeepFilterNetVoiceCleanupRuntimeAuthority
}

async function executeWithImage(image: OfflineDeepFilterNetVoiceCleanupImageEvidence, value: unknown): Promise<OfflineDeepFilterNetVoiceCleanupExecutionResult> {
  const request = validateOfflineDeepFilterNetVoiceCleanupRequest(value)
  const result = await runOfflineDeepFilterNetVoiceCleanupContainer({ image, serializedRequest: JSON.stringify(request) })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) throw notReady('Private DeepFilterNet voice-cleanup execution failed.')
  const response = parseResponse(result.stdout)
  const artifact = record(response.artifact)
  const packageIdentity = record(response.packageIdentity)
  const modelIdentity = record(response.modelIdentity)
  const semanticEvidence = record(response.semanticEvidence)
  const readiness = record(response.readiness)
  const bytes = Buffer.from(string(artifact.bytesBase64), 'base64')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const expectedPackage = OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY
  const expectedModel = OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY
  if (
    response.schemaVersion !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_CONTAINER_PROTOCOL || response.ok !== true ||
    response.toolId !== request.toolId || response.operationId !== request.operationId || response.status !== 'actual_deepfilternet_voice_cleanup_completed' ||
    packageIdentity.packageName !== expectedPackage.packageName || packageIdentity.version !== expectedPackage.version ||
    packageIdentity.nativePackageName !== expectedPackage.nativePackageName || packageIdentity.nativePackageVersion !== expectedPackage.nativePackageVersion ||
    packageIdentity.torchVersion !== expectedPackage.torchVersion || packageIdentity.torchaudioVersion !== expectedPackage.torchaudioVersion ||
    modelIdentity.modelId !== expectedModel.modelId || modelIdentity.archiveSha256 !== expectedModel.archiveSha256 ||
    modelIdentity.checkpointSha256 !== expectedModel.checkpointSha256 || modelIdentity.configSha256 !== expectedModel.configSha256 ||
    modelIdentity.upstreamLicense !== expectedModel.upstreamLicense || modelIdentity.productionLicenseReviewRequired !== true ||
    response.requestEnvelopeSha256 !== offlineDeepFilterNetVoiceCleanupRequestSha256(request) ||
    artifact.mimeType !== 'audio/wav' || artifact.byteLength !== bytes.byteLength || artifact.sha256 !== sha256 ||
    bytes.length !== 384_214 || sha256 !== 'a359cf256f9f05294ee7f9701ec189385aed277020b2be5dfa83d229409e27a7' ||
    readiness.privateInternalOnly !== true || readiness.productReady !== false || readiness.externalBetaReady !== false || readiness.productionReady !== false
  ) throw notReady('Private DeepFilterNet result identity is invalid.')
  const sampleCount = validateWavArtifact(bytes)
  validateSemanticEvidence(semanticEvidence, sampleCount)
  if (Object.values(semanticEvidence).some((entry) => !['boolean', 'number', 'string'].includes(typeof entry))) throw notReady('Private DeepFilterNet semantic evidence contains an unsupported value.')
  const typedSemanticEvidence = semanticEvidence as Record<string, boolean | number | string>
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-deepfilternet-voice-cleanup-execution-attestation-v1' as const,
    completedAt,
    toolId: request.toolId,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: offlineDeepFilterNetVoiceCleanupRequestSha256(request),
    artifactSha256: sha256,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-deepfilternet-voice-cleanup-execution-attestation-record-v1', source: 'private_local_checksum_protected_deepfilternet_voice_cleanup_execution', attestation, checksumSha256: sha256AuthorityValue(attestation) })}\n`,
  })
  return {
    schemaVersion: 'offline-deepfilternet-voice-cleanup-execution-result-v1',
    request,
    artifact: { mimeType: 'audio/wav', bytes, byteLength: bytes.length, sha256 },
    evidence: {
      packageName: expectedPackage.packageName,
      packageVersion: expectedPackage.version,
      nativePackageName: expectedPackage.nativePackageName,
      nativePackageVersion: expectedPackage.nativePackageVersion,
      torchVersion: expectedPackage.torchVersion,
      torchaudioVersion: expectedPackage.torchaudioVersion,
      modelId: expectedModel.modelId,
      modelArchiveSha256: expectedModel.archiveSha256,
      modelCheckpointSha256: expectedModel.checkpointSha256,
      modelConfigSha256: expectedModel.configSha256,
      modelUpstreamLicense: expectedModel.upstreamLicense,
      requestEnvelopeSha256: String(response.requestEnvelopeSha256),
      image,
      confinement: result.confinement,
      semanticEvidence: typedSemanticEvidence,
      containerExitCode: 0,
      oomKilled: false,
    },
    attestation,
    readiness: { privateInternalOnly: true, exactStructuredPayloadOnly: true, canonicalDispatchIntegrated: false, modelAndLicenseReviewStillRequiredForProduction: true, productReady: false, externalBetaReady: false, productionReady: false },
  }
}

function validateSemanticEvidence(evidence: Record<string, unknown>, sampleCount: number): void {
  if (
    evidence.actualPackageEntrypointExecuted !== true || evidence.entrypoint !== 'df.enhance.enhance' ||
    evidence.modelId !== 'DeepFilterNet3' || evidence.modelArchiveSha256 !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.archiveSha256 ||
    evidence.modelCheckpointSha256 !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.checkpointSha256 ||
    evidence.modelConfigSha256 !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.configSha256 ||
    evidence.fixtureSha256 !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY.fixtureSha256 ||
    evidence.sourceFixtureSampleRate !== 22_050 || evidence.executionSampleRate !== 48_000 || evidence.sampleCount !== sampleCount || sampleCount !== 192_085 ||
    evidence.inputSnrDb !== 3.217773 || evidence.outputSnrDb !== 8.214627 || Number(evidence.outputSnrDb) <= Number(evidence.inputSnrDb) ||
    evidence.inputRms !== 0.085527542 || evidence.outputRms !== 0.063051309 || evidence.meanAbsoluteDelta !== 0.032997789 ||
    evidence.finiteOutputVerified !== true || evidence.sampleCountPreserved !== true || evidence.gentleAttenuationLimitDb !== 12 || evidence.postFilterEnabled !== false ||
    evidence.serverOwnedFixtureOnly !== true || evidence.callerMediaAllowed !== false || evidence.callerModelAllowed !== false ||
    evidence.runtimeModelDownloadAllowed !== false || evidence.cpuExecutionOnly !== true || evidence.zeroNetworkRuntimeRequired !== true
  ) throw notReady('Private DeepFilterNet semantic evidence is invalid.')
}

function validateWavArtifact(bytes: Buffer): number {
  if (
    bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE' ||
    bytes.toString('ascii', 12, 16) !== 'fmt ' || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 ||
    bytes.readUInt32LE(24) !== 48_000 || bytes.readUInt16LE(34) !== 16 || bytes.toString('ascii', 36, 40) !== 'data' ||
    bytes.readUInt32LE(40) !== bytes.length - 44 || (bytes.length - 44) % 2 !== 0
  ) throw notReady('DeepFilterNet WAV artifact structure is invalid.')
  return (bytes.length - 44) / 2
}

async function persistAuthority(image: OfflineDeepFilterNetVoiceCleanupImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-deepfilternet-voice-cleanup-runtime-authority-v1' as const,
    source: 'private_local_offline_deepfilternet_voice_cleanup_runtime_authority' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS.map((toolId) => ({ toolId, operationId: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS[toolId] })),
    readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, modelAndLicenseReviewStillRequiredForProduction: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const },
    blockers: BLOCKERS,
  }
  const authority: OfflineDeepFilterNetVoiceCleanupRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_STORAGE_ROOT,
    relativePath: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_AUTHORITY_PATH,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-deepfilternet-voice-cleanup-runtime-authority-record-v1', source: 'private_local_checksum_protected_deepfilternet_voice_cleanup_runtime', authority, checksumSha256: sha256AuthorityValue(authority) })}\n`,
  })
}

function parseResponse(value: string): Record<string, unknown> { try { return record(JSON.parse(value)) } catch (cause) { throw notReady('Private DeepFilterNet response is not valid JSON.', cause) } }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw notReady('Private DeepFilterNet response contains an invalid object.'); return value as Record<string, unknown> }
function string(value: unknown): string { if (typeof value !== 'string') throw notReady('Private DeepFilterNet response contains an invalid string.'); return value }
function notReady(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
