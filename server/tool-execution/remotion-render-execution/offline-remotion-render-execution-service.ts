import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { inspectExistingOfflineRemotionDockerRuntime, runOfflineRemotionContainer } from './offline-remotion-render-docker-runtime'
import { OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL, OFFLINE_REMOTION_RENDER_OPERATION, offlineRemotionRequestSha256, validateOfflineRemotionRenderRequest } from './offline-remotion-render-execution-protocol'
import type { OfflineRemotionImageEvidence, OfflineRemotionRenderResult, OfflineRemotionRuntimeAuthority } from './offline-remotion-render-execution-types'

export const OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT =
  '/tmp/reeditpro-offline-remotion-render-execution' as const
export const OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH =
  'runtime-authority/offline-remotion-render-runtime-v1.json' as const
const STORAGE_ROOT = OFFLINE_REMOTION_RENDER_EXECUTION_STORAGE_ROOT
const AUTHORITY_PATH = OFFLINE_REMOTION_RENDER_RUNTIME_AUTHORITY_RELATIVE_PATH
const BLOCKERS = Object.freeze([
  'Canonical approved-snapshot execution, private artifact authority, reconciliation, replay, cost events, and final render/export settlement remain separate evidence gates.',
  'This runtime is private single-host evidence and is not deployed worker-fleet, service-identity, multi-architecture, scanning, observability, or recovery evidence.',
  'The bounded proof composition is not a public delivery or production final-export authority.',
] as const)

export interface PrivateOfflineRemotionRenderRuntime {
  readonly image: OfflineRemotionImageEvidence
  execute(value: unknown): Promise<OfflineRemotionRenderResult>
}

export async function activatePrivateOfflineRemotionRenderRuntime(): Promise<PrivateOfflineRemotionRenderRuntime> {
  if (arguments.length !== 0) throw validationFailure('Remotion runtime activation accepts no caller input.')
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  await persistAuthority(image)
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function openPrivateOfflineRemotionRenderRuntime(): Promise<PrivateOfflineRemotionRenderRuntime> {
  if (arguments.length !== 0) throw validationFailure('Remotion runtime open accepts no caller input.')
  const authority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
  if (!authority) throw runtimeFailure('Verified private Remotion runtime authority is unavailable.')
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw runtimeFailure('Private Remotion image changed after runtime activation.')
  }
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function readPersistedOfflineRemotionRenderRuntimeAuthority(): Promise<OfflineRemotionRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw runtimeFailure('Private Remotion runtime authority is invalid JSON.') }
  const envelope = record(parsed); const authority = record(envelope.authority)
  if (
    envelope.recordVersion !== 'offline-remotion-render-runtime-authority-record-v1' ||
    envelope.source !== 'private_local_checksum_protected_remotion_runtime' ||
    envelope.checksumSha256 !== sha256AuthorityValue(authority)
  ) throw runtimeFailure('Private Remotion runtime authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-remotion-render-runtime-authority-v1' ||
    authority.source !== 'private_local_offline_remotion_render_runtime_authority' ||
    record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).productReady !== false ||
    record(authority.readiness).privateInternalFinalCompositionReady !== true ||
    record(authority.readiness).finalExportReady !== false
  ) throw runtimeFailure('Private Remotion runtime authority boundary is invalid.')
  return authority as unknown as OfflineRemotionRuntimeAuthority
}

export async function executePrivateOfflineRemotionRender(value: unknown): Promise<OfflineRemotionRenderResult> {
  const image = await inspectExistingOfflineRemotionDockerRuntime()
  return executeWithImage(image, value)
}

async function executeWithImage(image: OfflineRemotionImageEvidence, value: unknown): Promise<OfflineRemotionRenderResult> {
  const request = validateOfflineRemotionRenderRequest(value)
  const result = await runOfflineRemotionContainer({ image, serializedRequest: JSON.stringify(request) })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) throw runtimeFailure('Private Remotion execution failed.', new Error(result.stderr.slice(-4_000)))
  const response = parseResponse(result.stdout)
  const artifactRecord = record(response.artifact)
  const bytes = Buffer.from(string(artifactRecord.bytesBase64), 'base64')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (
    response.schemaVersion !== OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL || response.ok !== true || response.toolId !== 'remotion' ||
    response.operationId !== OFFLINE_REMOTION_RENDER_OPERATION || response.status !== 'actual_remotion_media_render_completed' ||
    record(response.packageIdentity).packageName !== 'remotion+@remotion/renderer' || record(response.packageIdentity).version !== '4.0.487' ||
    response.requestEnvelopeSha256 !== offlineRemotionRequestSha256(request) || artifactRecord.mimeType !== 'video/mp4' ||
    artifactRecord.byteLength !== bytes.byteLength || artifactRecord.sha256 !== sha256 || bytes.length < 1024 || bytes.length > 16 * 1024 * 1024 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp' || artifactRecord.width !== request.payload.width || artifactRecord.height !== request.payload.height ||
    artifactRecord.fps !== request.payload.fps || artifactRecord.durationFrames !== request.payload.durationFrames ||
    record(response.readiness).privateInternalOnly !== true || record(response.readiness).productReady !== false ||
    !Object.values(record(response.semanticEvidence)).every((value) => value === true)
  ) throw runtimeFailure('Private Remotion result evidence is invalid.')
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-remotion-render-execution-attestation-v1' as const,
    completedAt,
    imageIdentityHash: image.imageIdentityHash,
    requestEnvelopeSha256: offlineRemotionRequestSha256(request),
    artifactSha256: sha256,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash)
  const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-remotion-render-execution-attestation-record-v1',
      source: 'private_local_checksum_protected_remotion_execution',
      attestation,
      checksumSha256: sha256AuthorityValue(attestation),
    })}\n`,
  })
  return {
    schemaVersion: 'offline-remotion-render-execution-result-v1', request,
    artifact: { mimeType: 'video/mp4', bytes, byteLength: bytes.length, sha256, width: Number(artifactRecord.width), height: Number(artifactRecord.height), fps: Number(artifactRecord.fps), durationFrames: Number(artifactRecord.durationFrames), durationSeconds: Number(artifactRecord.durationSeconds) },
    evidence: { packageName: 'remotion+@remotion/renderer', packageVersion: '4.0.487', requestEnvelopeSha256: String(response.requestEnvelopeSha256), image, confinement: result.confinement, semanticEvidence: record(response.semanticEvidence) as Record<string, true>, containerExitCode: 0, oomKilled: false },
    attestation,
    readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false, privateInternalFinalCompositionReady: true, canonicalDispatchIntegrated: false },
  }
}

async function persistAuthority(image: OfflineRemotionImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-remotion-render-runtime-authority-v1' as const,
    source: 'private_local_offline_remotion_render_runtime_authority' as const,
    activatedAt: new Date().toISOString(), image,
    supportedOperations: [{ toolId: 'remotion' as const, operationId: OFFLINE_REMOTION_RENDER_OPERATION }] as const,
    readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const, privateInternalFinalCompositionReady: true as const, finalExportReady: false as const },
    blockers: BLOCKERS,
  }
  const authority: OfflineRemotionRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-remotion-render-runtime-authority-record-v1', source: 'private_local_checksum_protected_remotion_runtime', authority, checksumSha256: sha256AuthorityValue(authority) })}\n`,
  })
}

function parseResponse(value: string): Record<string, unknown> { try { return record(JSON.parse(value)) } catch (cause) { throw runtimeFailure('Private Remotion response is not valid JSON.', cause) } }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw runtimeFailure('Private Remotion response contains an invalid object.'); return value as Record<string, unknown> }
function string(value: unknown): string { if (typeof value !== 'string') throw runtimeFailure('Private Remotion response contains an invalid string.'); return value }
function runtimeFailure(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function validationFailure(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
