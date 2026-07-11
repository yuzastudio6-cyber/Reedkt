import { getOfflineNodeRunnerCanonicalOperation } from './offline-node-runner-canonical-operations'
import {
  OFFLINE_NODE_RUNNER_LIMITS,
  OFFLINE_NODE_RUNNER_PROTOCOL,
  type OfflineNodeRunnerArtifact,
  type OfflineNodeRunnerImageSemanticEvidence,
  type OfflineNodeRunnerResult,
  type OfflineSharpImageInput,
} from './offline-node-runner-types'
import { OfflineNodeRunnerValidationError, sha256, stableStringify } from './offline-node-runner-security'

export async function runOfflineSharpImageOperation(value: unknown): Promise<OfflineNodeRunnerResult> {
  const input = validateInput(value)
  const sourceBytes = Buffer.from(input.sourceBytes)
  validateSvgSource(sourceBytes)
  const sharpModule = await import('sharp')
  const sharp = sharpModule.default
  let pipeline = sharp(sourceBytes, {
    density: 144,
    failOn: 'warning',
    limitInputPixels: 40_000_000,
    unlimited: false,
    sequentialRead: true,
  }).resize({
    width: input.outputWidth,
    height: input.outputHeight,
    fit: 'inside',
    withoutEnlargement: true,
    fastShrinkOnLoad: true,
  })
  pipeline = input.outputFormat === 'png'
    ? pipeline.png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    : input.outputFormat === 'jpeg'
      ? pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: false })
      : pipeline.webp({ quality: 90, alphaQuality: 100, lossless: false, smartSubsample: false })
  const outputBytes = await pipeline.toBuffer()
  if (outputBytes.byteLength < 64 || outputBytes.byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumImageBytes) {
    throw new OfflineNodeRunnerValidationError('OUTPUT_TOO_LARGE', 'Sharp output exceeded its fixed image bound.')
  }
  const metadata = await sharp(outputBytes, { failOn: 'warning' }).metadata()
  if (
    metadata.format !== input.outputFormat || !metadata.width || !metadata.height ||
    metadata.width > input.outputWidth || metadata.height > input.outputHeight ||
    !metadata.channels || metadata.width * metadata.height > 40_000_000
  ) throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'Sharp output metadata violates the approved recipe.')
  const operation = getOfflineNodeRunnerCanonicalOperation('sharp')
  const inputCommitment = {
    imageRecipeId: input.imageRecipeId, outputFormat: input.outputFormat,
    outputWidth: input.outputWidth, outputHeight: input.outputHeight,
    preserveMetadata: false, allowUpscale: false,
    sourceMimeType: input.sourceMimeType,
    sourceByteLength: input.sourceByteLength, sourceSha256: input.sourceSha256,
  }
  const inputSha256 = sha256(stableStringify(inputCommitment))
  const semanticEvidence: OfflineNodeRunnerImageSemanticEvidence = {
    sourceBytesVerified: true, sourceMimeType: 'image/svg+xml',
    outputFormat: input.outputFormat,
    outputWidth: metadata.width, outputHeight: metadata.height,
    outputChannels: metadata.channels,
    metadataStripped: true, upscaleForbidden: true,
    alphaPreserved: metadata.hasAlpha === true,
    actualSharpOperationCompleted: true,
  }
  const mimeType = input.outputFormat === 'png'
    ? 'image/png' as const
    : input.outputFormat === 'jpeg'
      ? 'image/jpeg' as const
      : 'image/webp' as const
  const imageArtifact = artifact('image', mimeType, outputBytes)
  const verificationDocument = {
    schemaVersion: 'offline-node-runner-verification-v1',
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    toolId: 'sharp', operationId: operation.operationId,
    packageName: 'sharp', invokedEntrypoints: ['sharp', 'resize', input.outputFormat, 'metadata'],
    actualToolPackageExecuted: true, source: 'server_resolved_in_memory',
    inputSha256,
    imageSha256: imageArtifact.sha256,
    imageByteLength: imageArtifact.byteLength,
    imageMimeType: mimeType,
    semanticEvidence,
    networkPolicy: 'offline_no_caller_targets_no_provider_calls',
    frontendExecutionAllowed: false,
    readinessScope: 'tool_specific_operation_evidence_only',
  }
  const verificationArtifact = artifact(
    'verification_json',
    'application/json',
    Buffer.from(stableStringify(verificationDocument), 'utf8'),
  )
  return {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    toolId: 'sharp', operationId: operation.operationId,
    status: 'actual_library_operation_completed', source: 'server_resolved_in_memory',
    actualToolPackageExecuted: true, packageName: 'sharp',
    invokedEntrypoints: ['sharp', 'resize', input.outputFormat, 'metadata'],
    normalizedForDeterminism: true, inputSha256, elapsedMilliseconds: 0,
    timeoutCeilingMilliseconds: OFFLINE_NODE_RUNNER_LIMITS.timeoutMilliseconds,
    outputByteCeiling: OFFLINE_NODE_RUNNER_LIMITS.maximumImageBytes,
    artifacts: [imageArtifact, verificationArtifact], semanticEvidence,
    networkPolicy: 'offline_no_caller_targets_no_provider_calls',
    frontendExecutionAllowed: false, readinessScope: 'tool_specific_operation_evidence_only',
  }
}

function validateInput(value: unknown): OfflineSharpImageInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  const record = value as Record<string, unknown>
  const expected = [
    'protocol', 'source', 'imageRecipeId', 'outputFormat', 'outputWidth', 'outputHeight',
    'preserveMetadata', 'allowUpscale', 'sourceMimeType', 'sourceByteLength',
    'sourceSha256', 'sourceBytes',
  ].sort()
  if (Object.keys(record).sort().join('|') !== expected.join('|')) throw invalid()
  if (
    record.protocol !== OFFLINE_NODE_RUNNER_PROTOCOL || record.source !== 'server_resolved_in_memory' ||
    !['approved_thumbnail_v1', 'approved_panel_asset_v1', 'approved_overlay_asset_v1'].includes(String(record.imageRecipeId)) ||
    !['png', 'jpeg', 'webp'].includes(String(record.outputFormat)) ||
    !Number.isSafeInteger(record.outputWidth) || Number(record.outputWidth) < 1 || Number(record.outputWidth) > 1_920 ||
    !Number.isSafeInteger(record.outputHeight) || Number(record.outputHeight) < 1 || Number(record.outputHeight) > 1_080 ||
    record.preserveMetadata !== false || record.allowUpscale !== false || record.sourceMimeType !== 'image/svg+xml' ||
    !Number.isSafeInteger(record.sourceByteLength) || Number(record.sourceByteLength) < 64 || Number(record.sourceByteLength) > 2 * 1024 * 1024 ||
    typeof record.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sourceSha256) ||
    !(record.sourceBytes instanceof Uint8Array)
  ) throw invalid()
  const bytes = Buffer.from(record.sourceBytes)
  if (bytes.byteLength !== record.sourceByteLength || sha256(bytes) !== record.sourceSha256) throw invalid()
  return record as unknown as OfflineSharpImageInput
}

function validateSvgSource(bytes: Buffer): void {
  let svg: string
  try { svg = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw invalid() }
  if (
    !/^\s*<svg\b/i.test(svg) || !/<\/svg>\s*$/i.test(svg) ||
    /<(?:script|foreignObject|iframe|object|embed|image|video|audio)\b/i.test(svg) ||
    /(?:href|src)\s*=\s*["']\s*(?:https?:|file:|data:|javascript:|\/\/)/i.test(svg) ||
    /url\s*\(\s*["']?\s*(?:https?:|file:|data:|javascript:|\/\/)/i.test(svg) ||
    /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|@import/i.test(svg)
  ) throw new OfflineNodeRunnerValidationError('UNSAFE_CONTENT', 'Sharp SVG source contains active or external content.')
}

function artifact(
  artifactKind: OfflineNodeRunnerArtifact['artifactKind'],
  mimeType: OfflineNodeRunnerArtifact['mimeType'],
  bytes: Buffer,
): OfflineNodeRunnerArtifact {
  return {
    artifactKind, mimeType, bytes, sha256: sha256(bytes), byteLength: bytes.byteLength,
    privateArtifactRequired: true, publicUrl: null,
  }
}
function invalid(): OfflineNodeRunnerValidationError {
  return new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Sharp input is outside the fixed approved image recipe.')
}
