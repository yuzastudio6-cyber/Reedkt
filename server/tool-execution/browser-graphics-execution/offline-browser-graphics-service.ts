import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { readPrivateTextFileIfExistsWithinRoot, writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { inspectExistingOfflineBrowserGraphicsDockerRuntime, runOfflineBrowserGraphicsContainer } from './offline-browser-graphics-docker-runtime'
import {
  OFFLINE_BROWSER_GRAPHICS_CONTAINER_PROTOCOL, OFFLINE_BROWSER_GRAPHICS_OPERATIONS,
  OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES, OFFLINE_BROWSER_GRAPHICS_TOOL_IDS,
  offlineBrowserGraphicsRequestSha256, validateOfflineBrowserGraphicsRequest,
} from './offline-browser-graphics-protocol'
import type { OfflineBrowserGraphicsExecutionResult, OfflineBrowserGraphicsImageEvidence, OfflineBrowserGraphicsRuntimeAuthority } from './offline-browser-graphics-types'

export const OFFLINE_BROWSER_GRAPHICS_STORAGE_ROOT = '/tmp/reeditpro-offline-browser-graphics-execution' as const
export const OFFLINE_BROWSER_GRAPHICS_AUTHORITY_PATH = 'runtime-authority/offline-browser-graphics-runtime-v1.json' as const
const BLOCKERS = Object.freeze([
  'The five exact operations are confined private/local evidence; deployed worker identity, fleet isolation, multi-architecture images, scanning, observability, and recovery remain deployment gates.',
  'Canonical approved-snapshot dispatch, private artifact reconciliation, retries, cost settlement, and user delivery remain separate evidence gates.',
  'Playwright accepts only the server-owned reviewed internal template; arbitrary URLs, HTML, scripts, CSS, credentials, sessions, browser profiles, and public capture remain prohibited.',
] as const)

export interface PrivateOfflineBrowserGraphicsRuntime {
  readonly image: OfflineBrowserGraphicsImageEvidence
  execute(value: unknown): Promise<OfflineBrowserGraphicsExecutionResult>
}

export async function activatePrivateOfflineBrowserGraphicsRuntime(): Promise<PrivateOfflineBrowserGraphicsRuntime> {
  if (arguments.length !== 0) throw invalid('Browser graphics runtime activation accepts no caller input.')
  const image = await inspectExistingOfflineBrowserGraphicsDockerRuntime()
  await persistAuthority(image)
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function openPrivateOfflineBrowserGraphicsRuntime(): Promise<PrivateOfflineBrowserGraphicsRuntime> {
  if (arguments.length !== 0) throw invalid('Browser graphics runtime open accepts no caller input.')
  const authority = await readPersistedOfflineBrowserGraphicsRuntimeAuthority()
  if (!authority) throw notReady('Verified private browser graphics runtime authority is unavailable.')
  const image = await inspectExistingOfflineBrowserGraphicsDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) throw notReady('Private browser graphics image changed after activation.')
  return Object.freeze({ image, execute: (value: unknown) => executeWithImage(image, value) })
}

export async function executePrivateOfflineBrowserGraphics(value: unknown): Promise<OfflineBrowserGraphicsExecutionResult> {
  return executeWithImage(await inspectExistingOfflineBrowserGraphicsDockerRuntime(), value)
}

export async function readPersistedOfflineBrowserGraphicsRuntimeAuthority(): Promise<OfflineBrowserGraphicsRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: OFFLINE_BROWSER_GRAPHICS_STORAGE_ROOT, relativePath: OFFLINE_BROWSER_GRAPHICS_AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw notReady('Private browser graphics authority is invalid JSON.') }
  const envelope = record(parsed); const authority = record(envelope.authority)
  if (envelope.recordVersion !== 'offline-browser-graphics-runtime-authority-record-v1' || envelope.source !== 'private_local_checksum_protected_browser_graphics_runtime' || envelope.checksumSha256 !== sha256AuthorityValue(authority)) throw notReady('Private browser graphics authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) || authority.schemaVersion !== 'offline-browser-graphics-runtime-authority-v1' ||
    authority.source !== 'private_local_offline_browser_graphics_runtime_authority' || record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).exactStructuredPayloadOnly !== true || record(authority.readiness).productReady !== false ||
    record(authority.readiness).externalBetaReady !== false || record(authority.readiness).productionReady !== false
  ) throw notReady('Private browser graphics authority boundary is invalid.')
  return authority as unknown as OfflineBrowserGraphicsRuntimeAuthority
}

async function executeWithImage(image: OfflineBrowserGraphicsImageEvidence, value: unknown): Promise<OfflineBrowserGraphicsExecutionResult> {
  const request = validateOfflineBrowserGraphicsRequest(value)
  const result = await runOfflineBrowserGraphicsContainer({ image, serializedRequest: JSON.stringify(request) })
  if (result.exitCode !== 0 || result.oomKilled || result.stderr.trim()) throw notReady('Private browser graphics execution failed.')
  const response = parseResponse(result.stdout); const artifact = record(response.artifact); const packageIdentity = record(response.packageIdentity)
  const semanticEvidence = record(response.semanticEvidence); const readiness = record(response.readiness)
  const bytes = Buffer.from(string(artifact.bytesBase64), 'base64'); const sha256 = createHash('sha256').update(bytes).digest('hex')
  const expectedPackage = OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES[request.toolId]
  if (
    response.schemaVersion !== OFFLINE_BROWSER_GRAPHICS_CONTAINER_PROTOCOL || response.ok !== true || response.toolId !== request.toolId ||
    response.operationId !== request.operationId || response.status !== 'actual_browser_graphics_operation_completed' ||
    packageIdentity.packageName !== expectedPackage.packageName || packageIdentity.version !== expectedPackage.version ||
    response.requestEnvelopeSha256 !== offlineBrowserGraphicsRequestSha256(request) || response.networkRequestCount !== 0 ||
    artifact.mimeType !== 'image/png' || artifact.byteLength !== bytes.byteLength || artifact.sha256 !== sha256 || artifact.width !== 640 || artifact.height !== 360 ||
    bytes.length < 1024 || bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    bytes.readUInt32BE(16) !== 640 || bytes.readUInt32BE(20) !== 360 || readiness.privateInternalOnly !== true || readiness.productReady !== false ||
    readiness.externalBetaReady !== false || readiness.productionReady !== false
  ) throw notReady('Private browser graphics result identity is invalid.')
  validateSemanticEvidence(request.toolId, semanticEvidence)
  if (Object.values(semanticEvidence).some((entry) => !['boolean', 'number', 'string'].includes(typeof entry))) throw notReady('Private browser graphics semantic evidence contains an unsupported value.')
  const typedSemanticEvidence = semanticEvidence as Record<string, boolean | number | string>
  const completedAt = new Date().toISOString()
  const attestationWithoutHash = {
    schemaVersion: 'offline-browser-graphics-execution-attestation-v1' as const, completedAt, toolId: request.toolId,
    imageIdentityHash: image.imageIdentityHash, requestEnvelopeSha256: offlineBrowserGraphicsRequestSha256(request), artifactSha256: sha256,
    confinementHash: sha256AuthorityValue(result.confinement),
  }
  const attestationHash = sha256AuthorityValue(attestationWithoutHash); const recordId = sha256AuthorityValue({ attestationHash, completedAt })
  const attestation = { ...attestationWithoutHash, recordId, attestationHash }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_BROWSER_GRAPHICS_STORAGE_ROOT, relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-browser-graphics-execution-attestation-record-v1', source: 'private_local_checksum_protected_browser_graphics_execution', attestation, checksumSha256: sha256AuthorityValue(attestation) })}\n`,
  })
  return {
    schemaVersion: 'offline-browser-graphics-execution-result-v1', request,
    artifact: { mimeType: 'image/png', bytes, byteLength: bytes.length, sha256, width: 640, height: 360 },
    evidence: { packageName: expectedPackage.packageName, packageVersion: expectedPackage.version, requestEnvelopeSha256: String(response.requestEnvelopeSha256), image, confinement: result.confinement, semanticEvidence: typedSemanticEvidence, networkRequestCount: 0, containerExitCode: 0, oomKilled: false },
    attestation,
    readiness: { privateInternalOnly: true, exactStructuredPayloadOnly: true, canonicalDispatchIntegrated: false, productReady: false, externalBetaReady: false, productionReady: false },
  }
}

function validateSemanticEvidence(toolId: keyof typeof OFFLINE_BROWSER_GRAPHICS_OPERATIONS, evidence: Record<string, unknown>): void {
  const expectedEntrypoints = { lottie: 'lottie.loadAnimation', pixijs: 'Application.init', konva: 'Stage.toDataURL', babylon_js: 'Engine.runRenderLoop', playwright: 'chromium.launch' } as const
  if (
    evidence.actualPackageEntrypointExecuted !== true || evidence.entrypoint !== expectedEntrypoints[toolId] ||
    evidence.decodedPngVerified !== true || !Number.isSafeInteger(evidence.pixelsDifferentFromFirst) || Number(evidence.pixelsDifferentFromFirst) < 1_000 ||
    !Number.isSafeInteger(evidence.sampledUniqueColorCount) || Number(evidence.sampledUniqueColorCount) < 2 ||
    evidence.zeroNetworkVerified !== true || evidence.fixedViewportVerified !== true || evidence.privatePngProduced !== true
  ) throw notReady('Private browser graphics semantic evidence is invalid.')
  if (toolId === 'lottie' && (evidence.canvasRendererUsed !== true || evidence.frameRendered !== 30 || Number(evidence.renderedPixelCount) < 1_000)) throw notReady('Lottie execution evidence is invalid.')
  if (toolId === 'pixijs' && evidence.stageRendered !== true) throw notReady('PixiJS execution evidence is invalid.')
  if (toolId === 'konva' && (evidence.stageRendered !== true || evidence.dataUrlVerified !== true)) throw notReady('Konva execution evidence is invalid.')
  if (toolId === 'babylon_js' && (evidence.sceneRendered !== true || evidence.framebufferReadbackVerified !== true || Number(evidence.meshCount) < 1 || Number(evidence.renderedPixelCount) < 1_000)) throw notReady('Babylon.js execution evidence is invalid.')
  if (toolId === 'playwright' && evidence.fixedTemplateRendered !== true) throw notReady('Playwright execution evidence is invalid.')
}

async function persistAuthority(image: OfflineBrowserGraphicsImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-browser-graphics-runtime-authority-v1' as const, source: 'private_local_offline_browser_graphics_runtime_authority' as const,
    activatedAt: new Date().toISOString(), image,
    supportedOperations: OFFLINE_BROWSER_GRAPHICS_TOOL_IDS.map((toolId) => ({ toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId] })),
    readiness: { privateInternalExecutionReady: true as const, exactStructuredPayloadOnly: true as const, canonicalDispatchMayReference: true as const, productReady: false as const, externalBetaReady: false as const, productionReady: false as const },
    blockers: BLOCKERS,
  }
  const authority: OfflineBrowserGraphicsRuntimeAuthority = { ...withoutHash, authorityHash: sha256AuthorityValue(withoutHash) }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_BROWSER_GRAPHICS_STORAGE_ROOT, relativePath: OFFLINE_BROWSER_GRAPHICS_AUTHORITY_PATH,
    content: `${stableAuthorityStringify({ recordVersion: 'offline-browser-graphics-runtime-authority-record-v1', source: 'private_local_checksum_protected_browser_graphics_runtime', authority, checksumSha256: sha256AuthorityValue(authority) })}\n`,
  })
}

function parseResponse(value: string): Record<string, unknown> { try { return record(JSON.parse(value)) } catch (cause) { throw notReady('Private browser graphics response is not valid JSON.', cause) } }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw notReady('Private browser graphics response contains an invalid object.'); return value as Record<string, unknown> }
function string(value: unknown): string { if (typeof value !== 'string') throw notReady('Private browser graphics response contains an invalid string.'); return value }
function notReady(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
