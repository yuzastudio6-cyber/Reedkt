import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { inspectExistingOfflineAiCapabilityDockerRuntime, runOfflineAiCapabilityContainer } from './offline-ai-capability-docker-runtime'
import {
  OFFLINE_AI_CAPABILITY_CONTAINER_PROTOCOL, OFFLINE_AI_CAPABILITY_OPERATIONS,
  OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES, OFFLINE_AI_CAPABILITY_TOOL_IDS,
  offlineAiCapabilityRequestSha256, validateOfflineAiCapabilityRequest,
} from './offline-ai-capability-protocol'
import type { OfflineAiCapabilityExecutionResult, OfflineAiCapabilityImageEvidence, OfflineAiCapabilityRuntimeAuthority } from './offline-ai-capability-types'

export const OFFLINE_AI_CAPABILITY_STORAGE_ROOT = '/tmp/reeditpro-offline-ai-capability-execution' as const
export const OFFLINE_AI_CAPABILITY_AUTHORITY_PATH = 'runtime-authority/offline-ai-capability-runtime-v1.json' as const
const BLOCKERS = Object.freeze([
  'These exact CPU-only operations are confined private/local evidence; deployed worker identity, fleet isolation, multi-architecture images, scanning, observability, and recovery remain deployment gates.',
  'Canonical approved-snapshot dispatch, private artifact reconciliation, retries, cost settlement, and user delivery remain separate evidence gates.',
  'Transformers proves the pinned offline package/configuration runtime only; no model weights are loaded and model inference remains unavailable until separately authorized and proven.',
] as const)

export interface PrivateOfflineAiCapabilityRuntime {
  readonly image: OfflineAiCapabilityImageEvidence
  execute(value: unknown): Promise<OfflineAiCapabilityExecutionResult>
}

export async function activatePrivateOfflineAiCapabilityRuntime(): Promise<PrivateOfflineAiCapabilityRuntime> {
  if (arguments.length !== 0) throw invalid('AI capability runtime activation accepts no caller input.')
  const image = await inspectExistingOfflineAiCapabilityDockerRuntime()
  await persistAuthority(image)
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function openPrivateOfflineAiCapabilityRuntime(): Promise<PrivateOfflineAiCapabilityRuntime> {
  if (arguments.length !== 0) throw invalid('AI capability runtime open accepts no caller input.')
  const authority = await readPersistedOfflineAiCapabilityRuntimeAuthority()
  if (!authority) throw notReady('Verified private AI capability runtime authority is unavailable.')
  const image = await inspectExistingOfflineAiCapabilityDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) throw notReady('Private AI capability image changed after activation.')
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function executePrivateOfflineAiCapability(value: unknown): Promise<OfflineAiCapabilityExecutionResult> {
  return executeWithImage(await inspectExistingOfflineAiCapabilityDockerRuntime(), value)
}

export async function readPersistedOfflineAiCapabilityRuntimeAuthority(): Promise<OfflineAiCapabilityRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: OFFLINE_AI_CAPABILITY_STORAGE_ROOT, relativePath: OFFLINE_AI_CAPABILITY_AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw notReady('Private AI capability authority is invalid JSON.') }
  const envelope = record(parsed); const authority = record(envelope.authority)
  if (envelope.recordVersion !== 'offline-ai-capability-runtime-authority-record-v1' || envelope.source !== 'private_local_checksum_protected_ai_capability_runtime' || envelope.checksumSha256 !== sha256AuthorityValue(authority)) throw notReady('Private AI capability authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  const readiness = record(authority.readiness)
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) || authority.schemaVersion !== 'offline-ai-capability-runtime-authority-v1' ||
    authority.source !== 'private_local_offline_ai_capability_runtime_authority' || readiness.privateInternalExecutionReady !== true ||
    readiness.exactStructuredPayloadOnly !== true || readiness.modelWeightsLoaded !== false || readiness.productReady !== false ||
    readiness.externalBetaReady !== false || readiness.productionReady !== false
  ) throw notReady('Private AI capability authority boundary is invalid.')
  return authority as unknown as OfflineAiCapabilityRuntimeAuthority
}

async function executeWithImage(image: OfflineAiCapabilityImageEvidence, value: unknown): Promise<OfflineAiCapabilityExecutionResult> {
  const request = validateOfflineAiCapabilityRequest(value)
  const result = await runOfflineAiCapabilityContainer({ image, serializedRequest: JSON.stringify(request) })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) throw notReady('Private AI capability execution failed.')
  const response = parseResponse(result.stdout); const artifact = record(response.artifact); const packageIdentity = record(response.packageIdentity)
  const semanticEvidence = record(response.semanticEvidence); const readiness = record(response.readiness)
  const bytes = Buffer.from(string(artifact.bytesBase64), 'base64'); const sha256 = createHash('sha256').update(bytes).digest('hex')
  const expectedPackage = OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES[request.toolId]
  const expectedMimeType = request.toolId === 'kornia' ? 'image/png' : 'application/json'
  if (
    response.schemaVersion !== OFFLINE_AI_CAPABILITY_CONTAINER_PROTOCOL || response.ok !== true || response.toolId !== request.toolId ||
    response.operationId !== request.operationId || response.status !== 'actual_ai_capability_operation_completed' ||
    packageIdentity.packageName !== expectedPackage.packageName || packageIdentity.version !== expectedPackage.version ||
    response.requestEnvelopeSha256 !== offlineAiCapabilityRequestSha256(request) ||
    artifact.mimeType !== expectedMimeType || artifact.byteLength !== bytes.byteLength || artifact.sha256 !== sha256 || bytes.length < 2 || bytes.length > 8 * 1024 * 1024 ||
    readiness.privateInternalOnly !== true || readiness.productReady !== false || readiness.externalBetaReady !== false || readiness.productionReady !== false
  ) throw notReady('Private AI capability result identity is invalid.')
  if (expectedMimeType === 'image/png') validatePng(bytes)
  else validateJsonArtifact(bytes)
  validateSemanticEvidence(request.toolId, semanticEvidence)
  if (Object.values(semanticEvidence).some((entry) => !['boolean', 'number', 'string'].includes(typeof entry))) throw notReady('Private AI capability semantic evidence contains an unsupported value.')
  const typedSemanticEvidence = semanticEvidence as Record<string, boolean | number | string>
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-ai-capability-execution-attestation-v1' as const, completedAt, toolId: request.toolId,
    imageIdentityHash: image.imageIdentityHash, requestEnvelopeSha256: offlineAiCapabilityRequestSha256(request), artifactSha256: sha256,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash); const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_AI_CAPABILITY_STORAGE_ROOT, relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-ai-capability-execution-attestation-record-v1', source: 'private_local_checksum_protected_ai_capability_execution', attestation, checksumSha256: sha256AuthorityValue(attestation) })}\n`,
  })
  return {
    schemaVersion: 'offline-ai-capability-execution-result-v1', request,
    artifact: { mimeType: expectedMimeType, bytes, byteLength: bytes.length, sha256 },
    evidence: { packageName: expectedPackage.packageName, packageVersion: expectedPackage.version, requestEnvelopeSha256: String(response.requestEnvelopeSha256), image, confinement: result.confinement, semanticEvidence: typedSemanticEvidence, containerExitCode: 0, oomKilled: false },
    attestation,
    readiness: { privateInternalOnly: true, exactStructuredPayloadOnly: true, canonicalDispatchIntegrated: false, modelWeightsLoaded: false, productReady: false, externalBetaReady: false, productionReady: false },
  }
}

function validateSemanticEvidence(toolId: keyof typeof OFFLINE_AI_CAPABILITY_OPERATIONS, evidence: Record<string, unknown>): void {
  const expectedEntrypoints = { torch_torchvision: 'torch.cuda.is_available', transformers: 'utils.is_torch_available', music21: 'stream.Stream.analyze', kornia: 'kornia.morphology.closing' } as const
  if (evidence.actualPackageEntrypointExecuted !== true || evidence.entrypoint !== expectedEntrypoints[toolId] || evidence.zeroNetworkRuntimeRequired !== true) throw notReady('Private AI capability semantic evidence is invalid.')
  if (toolId === 'torch_torchvision' && (evidence.tensorOperationExecuted !== true || evidence.torchvisionResizeExecuted !== true || evidence.cpuOnlyVerified !== true)) throw notReady('Torch/Torchvision execution evidence is invalid.')
  if (toolId === 'transformers' && (evidence.offlineConfigConstructed !== true || evidence.modelWeightsLoaded !== false || evidence.networkRequired !== false)) throw notReady('Transformers execution evidence is invalid.')
  if (toolId === 'music21' && (evidence.approvedWavBytesVerified !== true || evidence.fourPitchSegmentsAnalyzed !== true || evidence.musicTheoryAnalysisExecuted !== true)) throw notReady('Music21 execution evidence is invalid.')
  if (toolId === 'kornia' && (evidence.approvedMaskBytesVerified !== true || evidence.morphologyClosingExecuted !== true || evidence.width !== 64 || evidence.height !== 64 || !Number.isSafeInteger(evidence.activePixelCount) || Number(evidence.activePixelCount) < 100 || Number(evidence.activePixelCount) > 3996)) throw notReady('Kornia execution evidence is invalid.')
}

function validateJsonArtifact(bytes: Buffer): void { try { const value = JSON.parse(bytes.toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not object') } catch (cause) { throw notReady('AI capability JSON artifact is invalid.', cause) } }
function validatePng(bytes: Buffer): void { if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 64 || bytes.readUInt32BE(20) !== 64) throw notReady('AI capability PNG artifact is invalid.') }

async function persistAuthority(image: OfflineAiCapabilityImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-ai-capability-runtime-authority-v1' as const, source: 'private_local_offline_ai_capability_runtime_authority' as const,
    activatedAt: new Date().toISOString(), image,
    supportedOperations: OFFLINE_AI_CAPABILITY_TOOL_IDS.map((toolId) => ({ toolId, operationId: OFFLINE_AI_CAPABILITY_OPERATIONS[toolId] })),
    readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, modelWeightsLoaded: false as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const },
    blockers: BLOCKERS,
  }
  const authority: OfflineAiCapabilityRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_AI_CAPABILITY_STORAGE_ROOT, relativePath: OFFLINE_AI_CAPABILITY_AUTHORITY_PATH,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-ai-capability-runtime-authority-record-v1', source: 'private_local_checksum_protected_ai_capability_runtime', authority, checksumSha256: sha256AuthorityValue(authority) })}\n`,
  })
}

function parseResponse(value: string): Record<string, unknown> { try { return record(JSON.parse(value)) } catch (cause) { throw notReady('Private AI capability response is not valid JSON.', cause) } }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw notReady('Private AI capability response contains an invalid object.'); return value as Record<string, unknown> }
function string(value: unknown): string { if (typeof value !== 'string') throw notReady('Private AI capability response contains an invalid string.'); return value }
function notReady(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
