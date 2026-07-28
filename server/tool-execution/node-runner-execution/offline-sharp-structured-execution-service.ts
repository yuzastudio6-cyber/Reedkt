import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { writePrivateTextFileAtomicWithinRoot } from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type { OfflineNodeRunnerImageSemanticEvidence } from '../node-runners'
import {
  createPrivateOfflineNodeStructuredExecutionRuntime,
  readPersistedOfflineNodeStructuredRuntimeAuthority,
} from './offline-node-structured-execution-service'
import {
  inspectExistingOfflineNodeStructuredDockerRuntime,
  runOfflineNodeStructuredContainer,
} from './offline-node-structured-docker-runtime'
import {
  structuredExecutionRequestSha256,
  validateOfflineNodeStructuredExecutionRequest,
  type OfflineNodeStructuredExecutionRequest,
} from './offline-node-structured-execution-protocol'
import type {
  OfflineNodeStructuredExecutionConfinementEvidence,
  OfflineNodeStructuredExecutionImageEvidence,
} from './offline-node-structured-execution-types'

const STORAGE_ROOT = '/tmp/reeditpro-offline-sharp-structured-execution' as const
const SHA = /^[a-f0-9]{64}$/

export interface OfflineSharpStructuredExecutionResult {
  imageArtifact: {
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
    bytes: Buffer
    sha256: string
    byteLength: number
  }
  verificationJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'sharp'
    operationId: string
    requestEnvelopeSha256: string
    runnerInputSha256: string
    packageName: 'sharp'
    packageVersion: '0.35.3'
    packageJsonSha256: string
    invokedEntrypoints: readonly string[]
    imageSha256: string
    imageByteLength: number
    imageMimeType: 'image/png' | 'image/jpeg' | 'image/webp'
    verificationJsonSha256: string
    semanticEvidence: OfflineNodeRunnerImageSemanticEvidence
    confinement: OfflineNodeStructuredExecutionConfinementEvidence
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineNodeStructuredExecutionImageEvidence
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface PrivateOfflineSharpStructuredExecutionRuntime {
  readonly image: OfflineNodeStructuredExecutionImageEvidence
  execute(request: unknown): Promise<OfflineSharpStructuredExecutionResult>
}

export async function createPrivateOfflineSharpStructuredExecutionRuntime():
Promise<PrivateOfflineSharpStructuredExecutionRuntime> {
  if (arguments.length !== 0) throw invalid('Sharp runtime activation accepts no caller input.')
  const common = await createPrivateOfflineNodeStructuredExecutionRuntime()
  return Object.freeze({ image: common.image, execute: (request: unknown) => execute(common.image, request) })
}

export async function openPrivateOfflineSharpStructuredExecutionRuntime():
Promise<PrivateOfflineSharpStructuredExecutionRuntime> {
  if (arguments.length !== 0) throw invalid('Sharp runtime open accepts no caller input.')
  const authority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
  if (
    !authority || !authority.readiness.privateInternalExecutionReady ||
    !authority.supportedOperations.some((operation) => operation.toolId === 'sharp')
  ) throw unavailable('Sharp runtime authority is unavailable.')
  const image = await inspectExistingOfflineNodeStructuredDockerRuntime()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw unavailable('Sharp runtime image changed after activation.')
  }
  return Object.freeze({ image, execute: (request: unknown) => execute(image, request) })
}

async function execute(
  image: OfflineNodeStructuredExecutionImageEvidence,
  value: unknown,
): Promise<OfflineSharpStructuredExecutionResult> {
  let request: OfflineNodeStructuredExecutionRequest
  try { request = validateOfflineNodeStructuredExecutionRequest(value) } catch {
    throw invalid('Structured Sharp request was rejected.')
  }
  if (request.toolId !== 'sharp') throw invalid('Sharp runtime accepts only the exact Sharp operation.')
  const container = await runOfflineNodeStructuredContainer({
    image,
    serializedRequest: stableAuthorityStringify(request),
  })
  if (container.exitCode !== 0 || container.oomKilled || container.stderr.trim()) {
    throw unavailable('Confined Sharp container failed closed.')
  }
  const wire = record(JSON.parse(container.stdout))
  if (
    wire.schemaVersion !== 'offline-node-structured-execution-container-v1' || wire.ok !== true ||
    wire.toolId !== 'sharp' || wire.operationId !== request.operationId ||
    wire.actualToolPackageExecuted !== true || wire.status !== 'actual_library_operation_completed' ||
    wire.source !== 'server_resolved_in_memory' ||
    wire.requestEnvelopeSha256 !== structuredExecutionRequestSha256(request)
  ) throw unavailable('Sharp container returned different execution identity.')
  const packageIdentity = record(wire.packageIdentity)
  const invokedEntrypoints = stringArray(packageIdentity.invokedEntrypoints)
  const alphaComponent =
    'imageRecipeId' in request.payload &&
    request.payload.imageRecipeId ===
      'approved_living_frame_alpha_component_v1'
  if (
    packageIdentity.packageName !== 'sharp' || packageIdentity.version !== '0.35.3' ||
    typeof packageIdentity.packageJsonSha256 !== 'string' || !SHA.test(packageIdentity.packageJsonSha256) ||
    !invokedEntrypoints.includes('metadata') ||
    (alphaComponent
      ? !invokedEntrypoints.includes('raw') ||
        !invokedEntrypoints.includes('png') ||
        invokedEntrypoints.includes('resize')
      : !invokedEntrypoints.includes('resize'))
  ) throw unavailable('Sharp package identity or entrypoints are invalid.')
  const artifacts = array(wire.artifacts)
  if (artifacts.length !== 2) throw unavailable('Sharp must emit one image and one verification document.')
  const imageWire = artifact(artifacts, 'image')
  const verificationWire = artifact(artifacts, 'verification_json')
  const imageBytes = decodeArtifact(imageWire)
  const verificationBytes = decodeArtifact(verificationWire)
  const imageMimeType = imageWire.mimeType
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(String(imageMimeType)) ||
    imageBytes.byteLength > 16 * 1024 * 1024 ||
    !matchesImageSignature(imageBytes, String(imageMimeType))
  ) throw unavailable('Sharp output format, bound, or binary signature is invalid.')
  const semantic = verifySemantic(wire.semanticEvidence, imageMimeType as string)
  const verificationDocument = record(JSON.parse(verificationBytes.toString('utf8')))
  if (
    verificationDocument.toolId !== 'sharp' || verificationDocument.operationId !== request.operationId ||
    verificationDocument.imageSha256 !== imageWire.sha256 ||
    verificationDocument.imageByteLength !== imageBytes.byteLength ||
    verificationDocument.imageMimeType !== imageMimeType ||
    stableAuthorityStringify(verificationDocument.semanticEvidence) !== stableAuthorityStringify(semantic)
  ) throw unavailable('Sharp verification document is not bound to exact output evidence.')
  const completedAt = new Date().toISOString()
  const evidence = {
    toolId: 'sharp' as const, operationId: request.operationId,
    requestEnvelopeSha256: String(wire.requestEnvelopeSha256),
    runnerInputSha256: requiredSha(wire.inputSha256),
    packageName: 'sharp' as const, packageVersion: '0.35.3' as const,
    packageJsonSha256: String(packageIdentity.packageJsonSha256), invokedEntrypoints,
    imageSha256: String(imageWire.sha256), imageByteLength: imageBytes.byteLength,
    imageMimeType: imageMimeType as 'image/png' | 'image/jpeg' | 'image/webp',
    verificationJsonSha256: String(verificationWire.sha256), semanticEvidence: semantic,
    confinement: container.confinement, containerExitCode: 0 as const, oomKilled: false as const,
  }
  const withoutHash = {
    domain: 'offline_sharp_structured_execution_attestation_v1', completedAt,
    imageIdentityHash: image.imageIdentityHash, evidence,
  }
  const attestationHash = sha256AuthorityValue(withoutHash)
  const recordId = sha256AuthorityValue({ completedAt, attestationHash })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-sharp-structured-execution-record-v1',
      source: 'private_local_checksum_protected_sharp_execution',
      attestation: { ...withoutHash, recordId, attestationHash },
      checksumSha256: sha256AuthorityValue({ ...withoutHash, recordId, attestationHash }),
    })}\n`,
  })
  return {
    imageArtifact: {
      mimeType: evidence.imageMimeType, bytes: imageBytes,
      sha256: evidence.imageSha256, byteLength: imageBytes.byteLength,
    },
    verificationJson: {
      mimeType: 'application/json', bytes: verificationBytes,
      document: verificationDocument, sha256: evidence.verificationJsonSha256,
      byteLength: verificationBytes.byteLength,
    },
    evidence, image, attestation: { recordId, completedAt, attestationHash },
    readiness: {
      privateInternalOnly: true, productReady: false,
      externalBetaReady: false, productionReady: false,
    },
  }
}

function verifySemantic(value: unknown, mimeType: string): OfflineNodeRunnerImageSemanticEvidence {
  const semantic = record(value)
  if (semantic.sourceMimeType === 'image/png') {
    const outputWidth = Number(semantic.outputWidth)
    const outputHeight = Number(semantic.outputHeight)
    const transparentPixelCount =
      Number(semantic.transparentPixelCount)
    const partialAlphaPixelCount =
      Number(semantic.partialAlphaPixelCount)
    const opaquePixelCount =
      Number(semantic.opaquePixelCount)
    if (
      semantic.sourceBytesVerified !== true ||
      semantic.maskBytesVerified !== true ||
      semantic.maskMimeType !== 'image/png' ||
      semantic.outputFormat !== 'png' ||
      mimeType !== 'image/png' ||
      !Number.isSafeInteger(outputWidth) ||
      outputWidth < 1 ||
      outputWidth > 4_096 ||
      !Number.isSafeInteger(outputHeight) ||
      outputHeight < 1 ||
      outputHeight > 4_096 ||
      outputWidth * outputHeight > 16_777_216 ||
      semantic.outputChannels !== 4 ||
      semantic.metadataStripped !== true ||
      semantic.upscaleForbidden !== true ||
      semantic.alphaPreserved !== true ||
      semantic.sourceOpaque !== true ||
      semantic.maskGrayscale !== true ||
      semantic.maskOpaqueContainer !== true ||
      semantic.alphaDerivedFromMask !== true ||
      semantic.straightAlpha !== true ||
      semantic.transparentRgbCleared !== true ||
      semantic.sourcePixelsUnmodified !== true ||
      !Number.isSafeInteger(transparentPixelCount) ||
      transparentPixelCount < 1 ||
      !Number.isSafeInteger(partialAlphaPixelCount) ||
      partialAlphaPixelCount < 0 ||
      !Number.isSafeInteger(opaquePixelCount) ||
      opaquePixelCount < 1 ||
      transparentPixelCount + partialAlphaPixelCount +
        opaquePixelCount !== outputWidth * outputHeight ||
      semantic.actualSharpOperationCompleted !== true
    ) throw unavailable('Sharp alpha-component semantic evidence is invalid.')
    return semantic as unknown as OfflineNodeRunnerImageSemanticEvidence
  }
  if (
    semantic.sourceBytesVerified !== true || semantic.sourceMimeType !== 'image/svg+xml' ||
    semantic.metadataStripped !== true || semantic.upscaleForbidden !== true ||
    semantic.actualSharpOperationCompleted !== true ||
    !Number.isSafeInteger(semantic.outputWidth) || Number(semantic.outputWidth) < 1 ||
    !Number.isSafeInteger(semantic.outputHeight) || Number(semantic.outputHeight) < 1 ||
    !Number.isSafeInteger(semantic.outputChannels) || Number(semantic.outputChannels) < 1 ||
    typeof semantic.alphaPreserved !== 'boolean' || `image/${semantic.outputFormat}` !== mimeType
  ) throw unavailable('Sharp semantic evidence is invalid.')
  return semantic as unknown as OfflineNodeRunnerImageSemanticEvidence
}

function artifact(values: unknown[], kind: string): Record<string, unknown> {
  const matches = values.map(record).filter((value) => value.artifactKind === kind)
  if (matches.length !== 1) throw unavailable(`Sharp ${kind} artifact is missing or duplicated.`)
  const value = matches[0]!
  if (
    value.privateArtifactRequired !== true || value.publicUrl !== null ||
    typeof value.mimeType !== 'string' || typeof value.sha256 !== 'string' || !SHA.test(value.sha256) ||
    !Number.isSafeInteger(value.byteLength) || Number(value.byteLength) < 1 ||
    typeof value.bytesBase64 !== 'string'
  ) throw unavailable(`Sharp ${kind} artifact identity is invalid.`)
  return value
}
function decodeArtifact(value: Record<string, unknown>): Buffer {
  const bytes = Buffer.from(String(value.bytesBase64), 'base64')
  if (
    bytes.toString('base64') !== value.bytesBase64 || bytes.byteLength !== value.byteLength ||
    sha256(bytes) !== value.sha256
  ) throw unavailable('Sharp artifact byte commitment is invalid.')
  return bytes
}
function matchesImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9
  return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
}
function requiredSha(value: unknown): string { if (typeof value !== 'string' || !SHA.test(value)) throw unavailable('Sharp hash is invalid.'); return value }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Sharp record is invalid.'); return value as Record<string, unknown> }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw unavailable('Sharp array is invalid.'); return value }
function stringArray(value: unknown): string[] { if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw unavailable('Sharp string array is invalid.'); return value }
function sha256(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex') }
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
function unavailable(message: string): ApiError { return new ApiError('TOOL_NOT_READY', message, 503) }
